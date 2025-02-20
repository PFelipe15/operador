"use client"

import { AddOperatorModal } from "@/components/modals/AddOperatorModal"
import { ManualDistributionModal } from "@/components/modals/ManualDistributionModal"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useAuth } from '@/hooks/useAuth'
import { AlertCircle, ArrowUpDown, Info, MoreHorizontal } from "lucide-react"
import type { FC } from "react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

// Enums para melhor tipagem
enum OperatorStatus {
  ACTIVE = "ACTIVE",
  AWAY = "AWAY",
  BUSY = "BUSY",
  INACTIVE = "INACTIVE"
}

enum OperatorRole {
  ADMIN = "ADMIN",
  SUPERVISOR = "SUPERVISOR",
  OPERATOR = "OPERATOR"
}

// Interface com tipos mais específicos
interface Operator {
  id: string
  name: string
  email: string
  role: OperatorRole
  status: OperatorStatus
  processesCount: number
  maxProcesses: number
  efficiency?: number
  lastActive?: Date
}

const CaseDistributionPage: FC = () => {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [sortConfig, setSortConfig] = useState<{
    key: keyof Operator,
    direction: 'asc' | 'desc'
  } | null>(null)
  const { operator } = useAuth()
  const isAdmin = operator?.role === 'ADMIN'

  // Função para ordenar operadores
  const sortOperators = (key: keyof Operator) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Função para formatar dados do operador
  const formatOperatorData = (data: Operator[]): Operator[] => {
    return data.map(op => ({
      ...op,
      processesCount: Number(op.processesCount) || 0,
      maxProcesses: Number(op.maxProcesses) || 10,
      status: op.status as OperatorStatus,
      role: op.role as OperatorRole,
      lastActive: op.lastActive ? new Date(op.lastActive) : undefined
    }))
  }

  // Função para calcular porcentagem de carga
  const calculateWorkload = (current: number, max: number): number => {
    return Math.min(Math.round((current / max) * 100), 100)
  }

  // Função para buscar operadores com tratamento de erro melhorado
  const fetchOperators = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/operators')
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      const formattedData = formatOperatorData(data)
      setOperators(formattedData)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao carregar operadores'
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOperators()
  }, [])

  // Função para traduzir status
  const getStatusText = (status: OperatorStatus): string => {
    const statusMap = {
      [OperatorStatus.ACTIVE]: "Disponível",
      [OperatorStatus.AWAY]: "Em pausa",
      [OperatorStatus.BUSY]: "Ocupado",
      [OperatorStatus.INACTIVE]: "Inativo"
    }
    return statusMap[status]
  }

  // Função para definir cor do status
  const getStatusColor = (status: OperatorStatus): string => {
    const colorMap = {
      [OperatorStatus.ACTIVE]: "bg-green-100 text-green-800",
      [OperatorStatus.AWAY]: "bg-yellow-100 text-yellow-800",
      [OperatorStatus.BUSY]: "bg-red-100 text-red-800",
      [OperatorStatus.INACTIVE]: "bg-gray-100 text-gray-800"
    }
    return colorMap[status]
  }

  // Função para traduzir cargo
  const getRoleText = (role: OperatorRole): string => {
    const roleMap = {
      [OperatorRole.ADMIN]: "Administrador",
      [OperatorRole.SUPERVISOR]: "Supervisor",
      [OperatorRole.OPERATOR]: "Operador"
    }
    return roleMap[role]
  }

  // Ordenação dos operadores
  const sortedOperators = [...operators].sort((a, b) => {
    if (!sortConfig) return 0
    const { key, direction } = sortConfig
    const valueA = a[key] ?? 0
    const valueB = b[key] ?? 0
    if (valueA < valueB) return direction === 'asc' ? -1 : 1
    if (valueA > valueB) return direction === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Distribuição de Casos</h2>
          <p className="text-muted-foreground mt-2">
            {isAdmin 
              ? "Gerencie a distribuição de processos MEI entre operadores"
              : "Visualize a distribuição de processos MEI"
            }
          </p>
        </div>
        {isAdmin && <AddOperatorModal onOperatorAdded={fetchOperators} />}
      </div>

      {/* Cards com Regras e Métricas - Visível apenas para admins */}
      {isAdmin && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Carga Máxima</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">10</div>
              <p className="text-xs text-muted-foreground">
                Processos por operador
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Priorização</CardTitle>
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Auto</div>
              <p className="text-xs text-muted-foreground">
                Baseada em eficiência
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">SLA</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Tempo máximo para primeira análise</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">48h</div>
              <p className="text-xs text-muted-foreground">
                Prazo de resposta
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Regras de Distribuição</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="h-4 w-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="space-y-2">
                      <p>1. Prioridade por tipo de MEI</p>
                      <p>2. Balanceamento de carga</p>
                      <p>3. Eficiência do operador</p>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Badge variant="outline" className="w-fit">Automática</Badge>
                <Badge variant="outline" className="w-fit">Manual</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alertas e Avisos - Visível apenas para admins */}
      {isAdmin && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
          <div className="flex">
            <div className="flex-shrink-0">
              <AlertCircle className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Processos prioritários são distribuídos primeiro para operadores com maior taxa de eficiência.
              </p>
            </div>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Operadores Disponíveis</CardTitle>
     
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-32 text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              {error}
            </div>
          ) : operators.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Nenhum operador cadastrado
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>
                    <Button 
                      variant="ghost" 
                      onClick={() => sortOperators('processesCount')}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Ordenar por carga</span>
                      <ArrowUpDown className="h-4 w-4" />
                    </Button>
                    Carga de Trabalho
                  </TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedOperators
                  // Se não for admin, mostra apenas o próprio operador
                  .filter(op => isAdmin || op.id === operator?.id)
                  .map((operator) => (
                    <TableRow key={operator.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{operator.name}</div>
                          <div className="text-sm text-gray-500">{operator.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${
                                calculateWorkload(operator.processesCount, operator.maxProcesses) > 80 
                                  ? 'bg-red-500' 
                                  : calculateWorkload(operator.processesCount, operator.maxProcesses) > 50 
                                  ? 'bg-yellow-500' 
                                  : 'bg-emerald-500'
                              }`}
                              style={{ 
                                width: `${calculateWorkload(operator.processesCount, operator.maxProcesses)}%` 
                              }}
                            />
                          </div>
                          <span className="text-sm">
                            {operator.processesCount}/{operator.maxProcesses}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRoleText(operator.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(operator.status)}>
                          {getStatusText(operator.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {isAdmin && (
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Botões de ação - Visíveis apenas para admins */}
      {isAdmin && (
        <div className="flex justify-between">
          <ManualDistributionModal onDistributionComplete={fetchOperators} />
          <Button variant="default">Definir Regras Automáticas</Button>
        </div>
      )}
    </div>
  )
}

export default CaseDistributionPage

