"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"

interface CreateClientModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function CreateClientModal({ isOpen, onClose, onSuccess }: CreateClientModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    cpf: "",
    email: "",
    phone: "",
    birthDate: "",
    rg: "",
    motherName: "",
    preferredContact: "WHATSAPP",
    notifications: true,
    status: "ACTIVE",
    address: {
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      cep: ""
    }
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/v1/clients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          source: "MANUAL"
        }),
      })

      if (!response.ok) {
        throw new Error('Erro ao criar cliente')
      }

      toast.success("Cliente criado com sucesso!")
      onSuccess()
    } catch (error) {
      console.error('Erro:', error)
      toast.error("Erro ao criar cliente")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Cliente</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Dados Pessoais */}
            <div className="col-span-2 space-y-2">
              <Label>Dados Pessoais</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
                <Input
                  placeholder="CPF"
                  value={formData.cpf}
                  onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                  required
                />
                <Input
                  type="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
                <Input
                  placeholder="Telefone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
                <div>
                  <Label>Data de Nascimento</Label>
                  <Input
                    type="date"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({
                      ...formData,
                      birthDate: e.target.value
                    })}
                  />
                </div>
                <Input
                  placeholder="RG"
                  value={formData.rg}
                  onChange={(e) => setFormData({ ...formData, rg: e.target.value })}
                />
                <Input
                  placeholder="Nome da Mãe"
                  value={formData.motherName}
                  onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                />
              </div>
            </div>

            {/* Endereço */}
            <div className="col-span-2 space-y-2">
              <Label>Endereço</Label>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="CEP"
                  value={formData.address.cep}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, cep: e.target.value }
                  })}
                />
                <Input
                  placeholder="Rua"
                  value={formData.address.street}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, street: e.target.value }
                  })}
                />
                <Input
                  placeholder="Número"
                  value={formData.address.number}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, number: e.target.value }
                  })}
                />
                <Input
                  placeholder="Complemento"
                  value={formData.address.complement}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, complement: e.target.value }
                  })}
                />
                <Input
                  placeholder="Bairro"
                  value={formData.address.district}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, district: e.target.value }
                  })}
                />
                <Input
                  placeholder="Cidade"
                  value={formData.address.city}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, city: e.target.value }
                  })}
                />
                <Input
                  placeholder="Estado"
                  value={formData.address.state}
                  onChange={(e) => setFormData({
                    ...formData,
                    address: { ...formData.address, state: e.target.value }
                  })}
                />
              </div>
            </div>

            {/* Preferências */}
            <div className="col-span-2 space-y-2">
              <Label>Preferências</Label>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  value={formData.preferredContact}
                  onValueChange={(value) => setFormData({ ...formData, preferredContact: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Contato Preferido" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="PHONE">Telefone</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="notifications"
                    checked={formData.notifications}
                    onCheckedChange={(checked) => 
                      setFormData({ ...formData, notifications: checked as boolean })
                    }
                  />
                  <Label htmlFor="notifications">Receber notificações</Label>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? "Criando..." : "Criar Cliente"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 