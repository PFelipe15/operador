'use client'

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import {
    AlertCircle,
    ArrowDownToLine,
    Calendar,
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    Download,
    FileIcon,
    FileText,
    Filter,
    PieChart,
    TrendingUp,
    Users
} from "lucide-react"
import { useState } from "react"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

export default function RelatoriosPage() {
  const [date, setDate] = useState<Date | undefined>(undefined)

  const reportTypes = [
    {
      id: 'processos',
      name: 'Processos',
      description: 'Relatórios detalhados sobre processos em andamento e concluídos',
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      metrics: [
        { label: 'Total', value: '1,234', change: '+12%' },
        { label: 'Em Andamento', value: '543', change: '+5%' },
        { label: 'Concluídos', value: '691', change: '+7%' }
      ]
    },
    {
      id: 'performance',
      name: 'Performance',
      description: 'Métricas de desempenho e produtividade da equipe',
      icon: <TrendingUp className="h-5 w-5 text-emerald-600" />,
      metrics: [
        { label: 'Média Diária', value: '45', change: '+15%' },
        { label: 'Taxa de Conclusão', value: '92%', change: '+3%' },
        { label: 'Tempo Médio', value: '3.2d', change: '-8%' }
      ]
    },
    {
      id: 'clientes',
      name: 'Clientes',
      description: 'Análise de satisfação e dados dos clientes',
      icon: <Users className="h-5 w-5 text-purple-600" />,
      metrics: [
        { label: 'Total', value: '876', change: '+9%' },
        { label: 'Ativos', value: '654', change: '+11%' },
        { label: 'Satisfação', value: '4.8', change: '+0.2' }
      ]
    }
  ]

  return (
    <div className="container   max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Relatórios e Documentos
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Gerencie e exporte relatórios personalizados
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="mr-2 h-4 w-4" />
            Agendar
          </Button>
          <Button>
            <ArrowDownToLine className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Tipos de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {reportTypes.map((type) => (
          <Card key={type.id} className="p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg">
                  {type.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    {type.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {type.description}
                  </p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {type.metrics.map((metric, index) => (
                <div key={index} className="space-y-1">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {metric.label}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {metric.value}
                  </p>
                  <span className={`text-xs ${
                    metric.change.startsWith('+') 
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {metric.change}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>

      {/* Filtros e Geração */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <Label>Tipo de Relatório</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="processos">Processos</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="financeiro">Financeiro</SelectItem>
                <SelectItem value="clientes">Clientes</SelectItem>
                <SelectItem value="documentos">Documentos</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <DayPicker
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  locale={ptBR}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Formato</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Formato de exportação" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="excel">Excel</SelectItem>
                <SelectItem value="csv">CSV</SelectItem>
                <SelectItem value="word">Word</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder="Status do processo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex gap-2 mt-6">
          <Button className="w-full md:w-auto" variant="outline">
            <Filter className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
          <Button className="w-full md:w-auto">
            Gerar Relatório
          </Button>
        </div>
      </Card>

      {/* Relatórios Recentes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Relatórios Recentes
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Relatório de Processos', date: 'Hoje, 14:30', status: 'success' },
              { name: 'Performance Mensal', date: 'Ontem, 16:45', status: 'warning' },
              { name: 'Análise de Clientes', date: '2 dias atrás', status: 'success' },
            ].map((report, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <FileIcon className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {report.name}
                    </h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {report.date}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {report.status === 'success' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                  )}
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Relatórios Agendados
          </h2>
          <div className="space-y-4">
            {[
              { name: 'Relatório Semanal', schedule: 'Toda Segunda, 08:00', type: 'PDF' },
              { name: 'Performance da Equipe', schedule: 'Todo dia 1º, 09:00', type: 'Excel' },
              { name: 'Métricas de Clientes', schedule: 'Todo dia 15, 10:00', type: 'PDF' },
            ].map((scheduled, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg dark:border-gray-700">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded">
                    <Calendar className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {scheduled.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {scheduled.schedule}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
                    {scheduled.type}
                  </span>
                  <Button variant="ghost" size="sm">
                    <PieChart className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
} 