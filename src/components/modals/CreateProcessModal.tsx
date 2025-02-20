"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"
import { ArrowLeft, ArrowRight, Loader2, Check, X, Star, Search } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Address, ProcessType as PrismaProcessType, ProcessPriority, Source } from "@prisma/client"	
interface CreateProcessModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  operatorId: string
}

interface ProcessType {
  id: PrismaProcessType
  name: string
  description: string
}

interface CNAEActivity {
  codigo: string;
  descricao: string;
}

interface SelectedActivity extends CNAEActivity {
  isPrincipal: boolean;
}

interface Client {
  id: string
  name: string
  cpf: string
  email: string
  phone: string
}

interface CNAEResponse {
  id: string
  descricao: string
}

export function CreateProcessModal({ isOpen, onClose, onSuccess, operatorId }: CreateProcessModalProps) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [clientType, setClientType] = useState<'new' | 'existing'>('new')
  const [existingClients, setExistingClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [formData, setFormData] = useState({
    clientData: {
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
    },
    processData: {
      type: "ABERTURA_MEI" as PrismaProcessType,
      priority: "MEDIUM" as ProcessPriority,
      source: "MANUAL" as Source,
    },
    companyData: {
      name: "",
      cnpj: "",
      activity: "",
      occupation: "",
      capitalSocial: "",
    },
    addressData: {
      street: "",
      number: "",
      complement: "",
      district: "",
      city: "",
      state: "",
      cep: "",
    }
  })
  const [isLoadingCep, setIsLoadingCep] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [processTypes] = useState<ProcessType[]>([
    { id: "ABERTURA_MEI", name: "Abertura de MEI", description: "Abertura de Microempreendedor Individual" },
    { id: "ALTERACAO_MEI", name: "Alteração de MEI", description: "Alteração de dados do MEI" },
    { id: "BAIXA_MEI", name: "Baixa de MEI", description: "Encerramento de atividades do MEI" } 

   ])
  const [selectedActivities, setSelectedActivities] = useState<SelectedActivity[]>([]);
  const [cnaeActivities, setCnaeActivities] = useState<CNAEActivity[]>([]);
  const [searchActivityTerm, setSearchActivityTerm] = useState("");
  const [isLoadingActivities, setIsLoadingActivities] = useState(false);
  const [showAddress, setShowAddress] = useState(false);

  const getClients = async () => {
    const response = await fetch('http://localhost:3000/api/clients')
    const data = await response.json()
    setExistingClients(data)
  }

  useEffect(() => {
    getClients()
  }, [clientType])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Se não estiver no último step, apenas avança
    if (step < 3) {
      setStep(step + 1);
      return;
    }

    // Validações antes de enviar
    if (clientType === 'existing' && !selectedClientId) {
      toast.error("Selecione um cliente");
      return;
    }

    if (clientType === 'new' && !formData.clientData.cpf) {
      toast.error("CPF do cliente é obrigatório");
      return;
    }

    if (!formData.processData.type) {
      toast.error("Selecione o tipo do processo");
      return;
    }

    if (!formData.companyData.name) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }

    setLoading(true);

    try {
      const companyCreateData = {
        name: formData.companyData.name.trim(),
        cnpj: formData.companyData.cnpj.replace(/\D/g, ''),
        capitalSocial: formData.companyData.capitalSocial.replace(/[^\d,]/g, ''),
        principalActivity: selectedActivities.find(a => a.isPrincipal)?.codigo || "",
        activities: JSON.stringify(selectedActivities.filter(a => !a.isPrincipal)),
        ...(showAddress && {
          address: {
            create: {
              street: formData.addressData.street,
              number: formData.addressData.number,
              complement: formData.addressData.complement,

              district: formData.addressData.district,
              city: formData.addressData.city,
              state: formData.addressData.state,
              cep: formData.addressData.cep.replace(/\D/g, '')
            } as Address
          } 
        })
      };


      // Prepara os dados do cliente
      const clientData = clientType === 'existing' 
        ? { clientId: selectedClientId }
        : {
            client  : {
              create: {
                name: formData.clientData.name.trim(),
                cpf: formData.clientData.cpf.replace(/\D/g, ''),
                email: formData.clientData.email.trim(),
                phone: formData.clientData.phone.replace(/\D/g, ''),
                rg: formData.clientData.rg,
 
                motherName: formData.clientData.motherName,
                birthDate: formData.clientData.birthDate 
                  ? new Date(formData.clientData.birthDate).toISOString() 
                  : undefined,
                preferredContact: formData.clientData.preferredContact,
                notifications: formData.clientData.notifications,
                status: "ACTIVE"
                
              }  
            }   
          };

      const processData = {
        type: formData.processData.type,
        priority: formData.processData.priority,
        source: "MANUAL",
        operatorId,
        ...clientData,
        company: {
          create: companyCreateData
        }
      };


      const response = await fetch('/api/processes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao criar processo');
      }

      toast.success("Processo criado com sucesso!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro:', error);
      toast.error("Erro ao criar processo");
    } finally {
      setLoading(false);
    }
  };

  const handleCepSearch = async (cep: string) => {
    if (cep.length !== 8) return
    
    setIsLoadingCep(true)
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
      const data = await response.json()
      
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          addressData: {
            ...prev.addressData,
            street: data.logradouro,
            district: data.bairro,
            city: data.localidade,
            state: data.uf,
            cep
          }
        }))
      }
    } catch (_error) {
      console.error("Erro ao buscar CEP", _error)
      toast.error("Erro ao buscar CEP")
    } finally {
      setIsLoadingCep(false)
    }
  }

  const filteredClients = existingClients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm)
  )
 

  // Função para formatar CNPJ
  const formatCNPJ = (value: string) => {
    const cnpj = value.replace(/\D/g, ''); // Remove tudo que não é número
    return cnpj.replace(
      /^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/,
      '$1.$2.$3/$4-$5'
    ).substring(0, 18); // Limita a 18 caracteres (14 números + 4 caracteres especiais)
  };

  // Função para formatar valor monetário
  const formatCurrency = (value: string) => {
    const number = value.replace(/\D/g, '');
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(Number(number) / 100);
  };

  // Função otimizada para buscar atividades CNAE
  const searchCNAEActivities = async () => {
    if (!searchActivityTerm || searchActivityTerm.length < 3) {
      toast.error("Digite pelo menos 3 caracteres para pesquisar");
      return;
    }

    setIsLoadingActivities(true);
    try {
      const response = await fetch(
        `https://servicodados.ibge.gov.br/api/v2/cnae/subclasses?descricao=${encodeURIComponent(searchActivityTerm)}`
      );
      
      if (!response.ok) {
        throw new Error('Falha na busca de atividades');
      }

      const data = await response.json();
      
      // Remove duplicatas usando Set com o código como chave única
      const uniqueActivities = Array.from(new Set(data.map((item: CNAEResponse) => item.id))).map(id => {
        const activity = data.find((item: CNAEResponse) => item.id === id);
        return {
          codigo: activity.id,
          descricao: activity.descricao
        };
      });

      // Filtra atividades já selecionadas e ordena por relevância
      const filteredActivities = uniqueActivities
        .filter(activity => {
          const searchTermLower = searchActivityTerm.toLowerCase();
          const descricaoLower = activity.descricao.toLowerCase();
          
          // Remove atividades já selecionadas 
          const isSelected = selectedActivities.some(
            selected => selected.codigo === activity.codigo
          );

          return descricaoLower.includes(searchTermLower) && !isSelected;
        })
        .sort((a, b) => {
          const aDesc = a.descricao.toLowerCase();
          const bDesc = b.descricao.toLowerCase();
          const searchTerm = searchActivityTerm.toLowerCase();

          // Prioriza itens que começam com o termo de busca
          if (aDesc.startsWith(searchTerm) && !bDesc.startsWith(searchTerm)) return -1;
          if (!aDesc.startsWith(searchTerm) && bDesc.startsWith(searchTerm)) return 1;

          return aDesc.localeCompare(bDesc);
        })
        .slice(0, 10);

      setCnaeActivities(filteredActivities);
    } catch (error) {
      console.error('Erro ao buscar atividades:', error);
      toast.error("Erro ao buscar atividades CNAE");
      setCnaeActivities([]);
    } finally {
      setIsLoadingActivities(false);
    }
  };

  // Função para adicionar/remover atividade
  const toggleActivity = (activity: CNAEActivity) => {
    setSelectedActivities(prev => {
      const exists = prev.find(a => a.codigo === activity.codigo);
      
      if (exists) {
        return prev.filter(a => a.codigo !== activity.codigo);
      }

      if (prev.length >= 16) {
        toast.error("Limite máximo de 16 atividades atingido");
        return prev;
      }

      // Define como principal se for a primeira atividade
      const isPrincipal = prev.length === 0;
      return [...prev, { ...activity, isPrincipal }];
    });
  };

  // Função para definir atividade principal
  const setAsPrincipal = (codigo: string) => {
    setSelectedActivities(prev => 
      prev.map(activity => ({
        ...activity,
        isPrincipal: activity.codigo === codigo
      }))
    );
  };

  // Adicione esta função para verificar se é processo de abertura
  const isOpeningProcess = () => {
    return formData.processData.type === "ABERTURA_MEI";
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Processo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Tabs value={String(step)} onValueChange={(v) => setStep(Number(v))}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="1">Cliente</TabsTrigger>
              <TabsTrigger value="2">Empresa</TabsTrigger>
              <TabsTrigger value="3">Processo</TabsTrigger>
            </TabsList>

            <TabsContent value="1" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label>Tipo de Cliente</Label>
                  <Select
                    value={clientType}
                    onValueChange={(value: 'new' | 'existing') => setClientType(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">Novo Cliente</SelectItem>
                      <SelectItem value="existing">Cliente Existente</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {clientType === 'existing' ? (
                  <div className="space-y-4">
                    <div className="relative">
                      <Input
                        placeholder="Buscar cliente por nome ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="mb-2"
                      />
                      <div className="max-h-[200px] overflow-y-auto border rounded-md">
                        {filteredClients.map((client) => (
                          <div
                            key={client.id}
                            className={`p-2 hover:bg-gray-100 cursor-pointer ${
                              selectedClientId === client.id ? 'bg-gray-100' : ''
                            }`}
                            onClick={() => setSelectedClientId(client.id)}
                          >
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">CPF: {client.cpf}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <Label>Nome Completo</Label>
                      <Input
                        value={formData.clientData.name}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, name: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label>CPF</Label>
                      <Input
                        value={formData.clientData.cpf}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, cpf: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label>RG</Label>
                      <Input
                        value={formData.clientData.rg}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, rg: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        value={formData.clientData.email}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, email: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Telefone</Label>
                      <Input
                        value={formData.clientData.phone}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, phone: e.target.value }
                        })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Data de Nascimento</Label>
                      <Input
                        type="date"
                        value={formData.clientData.birthDate}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, birthDate: e.target.value }
                        })}
                      />
                    </div>
                    <div>
                      <Label>Nome da Mãe</Label>
                      <Input
                        value={formData.clientData.motherName}
                        onChange={(e) => setFormData({
                          ...formData,
                          clientData: { ...formData.clientData, motherName: e.target.value }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="2" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label>Nome da Empresa</Label>
                  <Input
                    value={formData.companyData.name}
                    onChange={(e) => setFormData({
                      ...formData,
                      companyData: { ...formData.companyData, name: e.target.value }
                    })}
                    placeholder="Nome Fantasia da Empresa"
                    className="uppercase"
                  />
                </div>

                {/* Campo CNPJ só aparece se NÃO for processo de abertura */}
                {!isOpeningProcess() && (
                  <div>
                    <Label>CNPJ</Label>
                    <div className="flex items-center gap-2 mb-2">
                      <Checkbox 
                        id="sem-cnpj" 
                        checked={!formData.companyData.cnpj}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setFormData({
                              ...formData,
                              companyData: { ...formData.companyData, cnpj: '' }
                            });
                          }
                        }}
                        className="rounded-sm" 
                      />
                      <Label htmlFor="sem-cnpj" className="text-sm text-muted-foreground">
                        Empresa sem CNPJ
                      </Label>
                    </div>
                    <Input
                      value={formData.companyData.cnpj}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, '');
                        const formatted = formatCNPJ(value);
                        setFormData({
                          ...formData,
                          companyData: { ...formData.companyData, cnpj: formatted }
                        });
                      }}
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      disabled={!formData.companyData.cnpj}
                    />
                  </div>
                )}

                {/* Capital Social só aparece se for processo de abertura */}
                {isOpeningProcess() && (
                  <div>
                    <Label>Capital Social</Label>
                    <Input
                      value={formData.companyData.capitalSocial}
                      onChange={(e) => {
                        const formatted = formatCurrency(e.target.value);
                        setFormData({
                          ...formData,
                          companyData: { ...formData.companyData, capitalSocial: formatted }
                        });
                      }}
                      placeholder="R$ 0,00"
                    />
                  </div>
                )}

                <div className="col-span-2">
                  <Label>Atividades CNAE</Label>
                  <div>
                    {/* Campo de busca */}
                    <div className="mb-4">
                      <div className="flex gap-2">
                        <Input
                          value={searchActivityTerm}
                          onChange={(e) => setSearchActivityTerm(e.target.value)}
                          placeholder="Pesquisar atividades..."
                        />
                        <Button
                          type="button"
                          variant="default"
                          onClick={() => searchCNAEActivities()}
                          className="px-3 bg-[#0f172a]"
                        >
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Container dividido em duas colunas */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Coluna da esquerda - Resultados da busca */}
                      <div>
                        {isLoadingActivities ? (
                          <div className="flex justify-center py-4">
                            <Loader2 className="h-6 w-6 animate-spin" />
                          </div>
                        ) : (
                          <div className="max-h-[300px] overflow-y-auto border rounded-md">
                            {cnaeActivities.map((activity) => (
                              <div
                                key={activity.codigo}
                                className="flex items-start gap-3 p-2 hover:bg-gray-50 border-b last:border-b-0"
                              >
                                <Checkbox
                                  checked={selectedActivities.some(a => a.codigo === activity.codigo)}
                                  onCheckedChange={() => toggleActivity(activity)}
                                  className="mt-1"
                                />
                                <div>
                                  <p className="text-sm">{activity.codigo}</p>
                                  <p className="text-sm text-gray-600">{activity.descricao}</p>
                                </div>
                              </div>
                            ))}
                            {cnaeActivities.length === 0 && searchActivityTerm.length >= 3 && (
                              <div className="p-4 text-center text-sm text-gray-500">
                                Nenhuma atividade encontrada
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Coluna da direita - Atividades Selecionadas */}
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm">Atividades Selecionadas</span>
                          <span className="text-sm text-gray-500">{selectedActivities.length}/16</span>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto">
                          {selectedActivities.map((activity) => (
                            <div
                              key={activity.codigo}
                              className={`p-2 mb-2 ${
                                activity.isPrincipal ? 'bg-emerald-50' : 'bg-gray-50'
                              }`}
                            >
                              <div className="flex items-start justify-between">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{activity.codigo}</span>
                                    {activity.isPrincipal && (
                                      <span className="text-xs bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm">
                                        Principal
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600 mt-0.5">{activity.descricao}</p>
                                </div>
                                <div className="flex items-center gap-1 ml-2">
                                  {!activity.isPrincipal && (
                                    <button
                                      type="button"
                                      onClick={() => setAsPrincipal(activity.codigo)}
                                      className="text-gray-400 hover:text-gray-600"
                                    >
                                      <Star className="h-4 w-4" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleActivity(activity)}
                                    className="text-gray-400 hover:text-gray-600"
                                  >
                                    <X className="h-4 w-4" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Checkbox para endereço */}
                <div className="flex items-center gap-2 pt-4">
                  <Checkbox 
                    checked={showAddress}
                    onCheckedChange={(checked) => {
                      setShowAddress(checked as boolean);
                      if (!checked) {
                        setFormData({
                          ...formData,
                          addressData: {
                            street: "",
                            number: "",
                            complement: "",
                            district: "",
                            city: "",
                            state: "",
                            cep: ""
                          }
                        });
                      }
                    }}
                    id="endereco"
                  />
                  <Label htmlFor="endereco" className="cursor-pointer">
                    Cadastrar Endereço?
                  </Label>
                </div>

                {/* Campos de endereço */}
                {showAddress && (
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="relative">
                        <Label>CEP</Label>
                        <Input
                          value={formData.addressData.cep}
                          onChange={(e) => {
                            const cep = e.target.value.replace(/\D/g, '');
                            setFormData({
                              ...formData,
                              addressData: { ...formData.addressData, cep }
                            });
                            if (cep.length === 8) handleCepSearch(cep);
                          }}
                          placeholder="00000-000"
                        />
                        {isLoadingCep && (
                          <div className="absolute right-2 top-8">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        )}
                      </div>
                      <div>
                        <Label>Rua</Label>
                        <Input
                          value={formData.addressData.street}
                          onChange={(e) => setFormData({
                             ...formData,
                            addressData: { ...formData.addressData, street: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Número</Label>
                        <Input
                          value={formData.addressData.number}
                          onChange={(e) => setFormData({
                            ...formData,
                            addressData: { ...formData.addressData, number: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Complemento</Label>
                        <Input
                          value={formData.addressData.complement}
                          onChange={(e) => setFormData({
                            ...formData,
                            addressData: { ...formData.addressData, complement: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Bairro</Label>
                        <Input
                          value={formData.addressData.district}
                          onChange={(e) => setFormData({
                            ...formData,
                            addressData: { ...formData.addressData, district: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Cidade</Label>
                        <Input
                          value={formData.addressData.city}
                          onChange={(e) => setFormData({
                            ...formData,
                            addressData: { ...formData.addressData, city: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <Label>Estado</Label>
                        <Input
                          value={formData.addressData.state}
                          onChange={(e) => setFormData({
                            ...formData,
                            addressData: { ...formData.addressData, state: e.target.value }
                          })}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="3" className="space-y-4">
              <div className="grid gap-4">
                {processTypes.map((type) => (
                  <div
                    key={type.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-all ${
                      formData.processData.type === type.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'hover:border-gray-400'
                    }`}
                    onClick={() => setFormData({
                      ...formData,
                      processData: { ...formData.processData, type: type.id as PrismaProcessType }
                    })}
                  >
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-gray-500">{type.description}</p>
                    <p className="text-sm text-gray-500">{type.id}</p>
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>

          <div className="w-full bg-gray-200 h-2 rounded-full">
            <div
              className="bg-emerald-500 h-2 rounded-full transition-all"
              style={{ width: `${(step / 3) * 100}%` }}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (step > 1) setStep(step - 1)
                else onClose()
              }}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              {step === 1 ? "Cancelar" : "Voltar"}
            </Button>
            
            <Button 
              type="submit"
              disabled={loading}
              className={`flex items-center gap-2 ${
                step === 3 ? 'bg-emerald-600 hover:bg-emerald-700' : ''
              }`}
            >
              {step === 3 ? (
                loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Criando...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Criar Processo
                  </>
                )
              ) : (
                <>
                  Próximo
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 