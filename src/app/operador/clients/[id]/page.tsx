"use client"

import { FC, useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, User, MapPin, Bell, FileText } from "lucide-react"

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
  processes: Array<{
    id: string
    type: string
    status: string
    createdAt: string
  }>
}

interface Address {
  street: string
  number: string
  complement?: string | null
  district: string
  city: string
  state: string
  cep: string
}

const ClientDetails: FC = () => {
  const params = useParams()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchClient = async () => {
      try {
        const response = await fetch(`/api/clients/${params.id}`)
        const data = await response.json()
        setClient(data)
      } catch (error) {
        console.error('Erro ao carregar cliente:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500" />
      </div>
    )
  }

  if (!client) {
    return <div>Cliente não encontrado</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="h-8 w-8 p-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">{client.name}</h2>
          <p className="text-muted-foreground">Detalhes do cliente</p>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList>
          <TabsTrigger value="info">Informações</TabsTrigger>
          <TabsTrigger value="processes">Processos</TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Dados Pessoais
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Nome</p>
                <p className="text-sm text-muted-foreground">{client.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">CPF</p>
                <p className="text-sm text-muted-foreground">{client.cpf}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Email</p>
                <p className="text-sm text-muted-foreground">{client.email}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Telefone</p>
                <p className="text-sm text-muted-foreground">{client.phone}</p>
              </div>
              {client.birthDate && (
                <div>
                  <p className="text-sm font-medium">Data de Nascimento</p>
                  <p className="text-sm text-muted-foreground">
                    {new Date(client.birthDate).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              {client.rg && (
                <div>
                  <p className="text-sm font-medium">RG</p>
                  <p className="text-sm text-muted-foreground">{client.rg}</p>
                </div>
              )}
              {client.motherName && (
                <div>
                  <p className="text-sm font-medium">Nome da Mãe</p>
                  <p className="text-sm text-muted-foreground">{client.motherName}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {client.address && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">CEP</p>
                  <p className="text-sm text-muted-foreground">{client.address.cep}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Rua</p>
                  <p className="text-sm text-muted-foreground">
                    {client.address.street}, {client.address.number}
                    {client.address.complement && ` - ${client.address.complement}`}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium">Bairro</p>
                  <p className="text-sm text-muted-foreground">{client.address.district}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Cidade/Estado</p>
                  <p className="text-sm text-muted-foreground">
                    {client.address.city}/{client.address.state}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Preferências
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium">Contato Preferido</p>
                <p className="text-sm text-muted-foreground">
                  {client.preferredContact || "Não definido"}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Notificações</p>
                <Badge variant={client.notifications ? "default" : "secondary"}>
                  {client.notifications ? "Ativadas" : "Desativadas"}
                </Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Origem do Cadastro</p>
                <Badge variant="outline">{client.source}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge>{client.status}</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Processos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {client.processes.length > 0 ? (
                <div className="space-y-4">
                  {client.processes.map((process) => (
                    <div
                      key={process.id}
                      className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-muted/50"
                      onClick={() => router.push(`/process/${process.id}`)}
                    >
                      <div>
                        <p className="font-medium">{process.type}</p>
                        <p className="text-sm text-muted-foreground">
                          Criado em {new Date(process.createdAt).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                      <Badge>{process.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Nenhum processo encontrado</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default ClientDetails 