"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from '@/hooks/useAuth'
import { formatDate } from "@/lib/utils"
import { CheckCircle, Clock, FileText, User } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface Process {
  id: string
  client: {
    name: string
    cpf: string
    email: string

  }
  type: string
  priority: string
  createdAt: string
  documents: {
    total: number
    verified: number
  }
  deadline?: string
}

interface Operator {
  id: string
  name: string
  role: string
  processesCount: number
  efficiency: number
  status: string
}

export function ManualDistributionModal({ onDistributionComplete }: { onDistributionComplete: () => void }) {
  const { operator } = useAuth()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [processes, setProcesses] = useState<Process[]>([])
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedProcess, setSelectedProcess] = useState("")
  const [selectedOperator, setSelectedOperator] = useState("")

  useEffect(() => {
    if (open) {
      fetchPendingProcesses()
      fetchAvailableOperators()
    }
  }, [open])
  
  if (operator?.role !== 'ADMIN') return null


  const fetchPendingProcesses = async () => {
    try {
      const response = await fetch("/api/v1/processes?status=PENDING")
      const data = await response.json()
      setProcesses(data)
    } catch (error) {
      console.error("Erro ao buscar processos:", error)
      toast.error("Erro ao carregar processos")
    }
  }

  const fetchAvailableOperators = async () => {
    try {
      const response = await fetch("/api/v1/operators")
      const data = await response.json()
      setOperators(data)
    } catch (error) {
      console.error("Erro ao buscar operadores:", error)
      toast.error("Erro ao carregar operadores")
    }
  }

  const getSelectedProcess = () => processes.find(p => p.id === selectedProcess)
  const getSelectedOperator = () => operators.find(o => o.id === selectedOperator)

  const handleDistribute = async () => {
    if (!selectedProcess || !selectedOperator) {
      toast.error("Selecione um processo e um operador")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/v1/distribution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId: selectedProcess,
          operatorId: selectedOperator
        }),
      })

      if (!response.ok) throw new Error("Erro na distribuição")

      toast.success("Processo distribuído com sucesso!")
      setOpen(false)
      onDistributionComplete()
    } catch (error) {
      toast.error("Erro ao distribuir processo")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Distribuir Manualmente</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Distribuição Manual de Processo</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Seleção de Processo */}
          <div className="space-y-4">
            <Label className="text-base">Processo</Label>
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um processo" />
              </SelectTrigger>
              <SelectContent>
                {processes.map((process) => (
                  <SelectItem key={process.id} value={process.id}>
                    <div className="flex items-center gap-2">
                      <span>{process.client.name}</span>
                      <Badge variant={process.priority === 'HIGH' ? 'destructive' : 'outline'}>
                        {process.priority}
                       </Badge>
                    </div>
                  </SelectItem>

                ))}
              </SelectContent>
            </Select>

            {/* Detalhes do Processo Selecionado */}
            {selectedProcess && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{getSelectedProcess()?.client.name}</h4>
                    <Badge>{getSelectedProcess()?.type}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <span>Criado em: {formatDate(getSelectedProcess()?.createdAt as string)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Documentos: {getSelectedProcess()?.documents.verified}/{getSelectedProcess()?.documents.total}</span>
                    </div>
                  </div>
                  
                </div>
              </Card>
            )}
          </div>

          {/* Seleção de Operador */}
          <div className="space-y-4">
            <Label className="text-base">Operador</Label>
            <Select value={selectedOperator} onValueChange={setSelectedOperator}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione um operador" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((operator) => (
                  <SelectItem key={operator.id} value={operator.id}>
                    <div className="flex items-center gap-2">
                      <span>{operator.name}</span>
                      <span className="text-muted-foreground">
                        ({operator.processesCount} processos)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Detalhes do Operador Selecionado */}
            {selectedOperator && (
              <Card className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      <h4 className="font-medium">{getSelectedOperator()?.name}</h4>
                    </div>
                    <Badge variant={
                      (getSelectedOperator()?.processesCount ?? 0) >= 8 ? 'destructive' : 'outline'
                    }>
                      {getSelectedOperator()?.processesCount ?? 0}/10 processos
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Eficiência</span>
                      <span>{getSelectedOperator()?.efficiency}%</span>
                    </div>
                    <Progress value={getSelectedOperator()?.efficiency} className="h-2" />
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-2 mt-6">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleDistribute}
            disabled={loading || !selectedProcess || !selectedOperator}
          >
            {loading ? (
              <>
                <span className="animate-spin mr-2">⚪</span>
                Distribuindo...
              </>
            ) : (
              <>
                <CheckCircle className="mr-2 h-4 w-4" />
                Distribuir Processo
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 