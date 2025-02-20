"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface Operator {
  id: string
  name: string
  email: string
  processesCount: number
}

interface AssignOperatorModalProps {
  isOpen: boolean
  onClose: () => void
  processId: string
  currentOperatorId?: string
  onAssign: () => void
}

export function AssignOperatorModal({
  isOpen,
  onClose,
  processId,
  currentOperatorId,
  onAssign
}: AssignOperatorModalProps) {
  const [operators, setOperators] = useState<Operator[]>([])
  const [selectedOperator, setSelectedOperator] = useState<string>("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchOperators = async () => {
      try {
        const response = await fetch('/api/operators')
        const data = await response.json()
        setOperators(data)
      } catch (error) {
        console.error('Erro ao carregar operadores:', error)
        toast.error('Erro ao carregar operadores')
      }
    }

    if (isOpen) {
      fetchOperators()
    }
  }, [isOpen])

  const handleAssign = async () => {
    if (!selectedOperator) {
      toast.error('Selecione um operador')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/processes/${processId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ operatorId: selectedOperator }),
      })

      if (!response.ok) throw new Error('Erro ao atribuir operador')

      toast.success('Operador atribuído com sucesso')
      onAssign()
    } catch (error) {
      console.error('Erro ao atribuir operador:', error)
      toast.error('Erro ao atribuir operador')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {currentOperatorId ? 'Transferir Processo' : 'Atribuir Operador'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Selecione o Operador</label>
            <Select
              value={selectedOperator}
              onValueChange={setSelectedOperator}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um operador" />
              </SelectTrigger>
              <SelectContent>
                {operators.map((op) => (
                  <SelectItem key={op.id} value={op.id}>
                    <div className="flex justify-between items-center w-full">
                      <span>{op.name}</span>
                      <span className="text-sm text-gray-500">
                        ({op.processesCount} processos)
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleAssign}
            disabled={loading || !selectedOperator}
            className="w-full"
          >
            {loading ? "Processando..." : "Confirmar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 