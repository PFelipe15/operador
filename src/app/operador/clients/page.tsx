"use client"

import { FC, useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Search, Plus, Filter } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { CreateClientModal } from "@/components/modals/CreateClientModal"
import { useRouter } from "next/navigation"

interface Address {
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  state: string
  cep: string
}

interface Client {
  id: string
  name: string
  cpf: string
  email: string
  phone: string
  birthDate?: string | null
  rg?: string | null
  motherName?: string | null
  address?: Address | null
  source: string
  status: string
  preferredContact?: string | null
  notifications: boolean
  _count: {
    processes: number
  }
}

const ClientsPage: FC = () => {
  const [searchTerm, setSearchTerm] = useState("")
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch('/api/v1/clients')
        const data = await response.json()
        setClients(data)
      } catch (error) {
        console.error('Erro ao carregar clientes:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.email.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: "bg-emerald-100 text-emerald-800",
      INACTIVE: "bg-gray-100 text-gray-800",
      BLOCKED: "bg-red-100 text-red-800"
    }
    return statusConfig[status as keyof typeof statusConfig] || "bg-gray-100 text-gray-800"
  }

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      MANUAL: "bg-blue-100 text-blue-800",
      BOT: "bg-purple-100 text-purple-800",
      PLATFORM: "bg-amber-100 text-amber-800"
    }
    return sourceConfig[source as keyof typeof sourceConfig] || "bg-gray-100 text-gray-800"
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Clientes</h2>
          <p className="text-muted-foreground">Gerencie todos os clientes cadastrados</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setIsCreateModalOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Cliente
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Buscar por nome, CPF ou email..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Contato Preferido</TableHead>
                    <TableHead>Processos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow
                      key={client.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/operador/clients/${client.id}`)}
                    >
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell>{client.cpf}</TableCell>
                      <TableCell>{client.email}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusBadge(client.status)}>
                          {client.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getSourceBadge(client.source)}>
                          {client.source}
                        </Badge>
                      </TableCell>
                      <TableCell>{client.preferredContact || "Não definido"}</TableCell>
                      <TableCell>{client._count.processes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>

      <CreateClientModal 
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => {
          setIsCreateModalOpen(false)
          window.location.reload()
        }}
      />
    </div>
  )
}

export default ClientsPage 