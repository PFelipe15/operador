"use client";

import { FC, useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Search,
  Plus,
  Users,
  UserCheck,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Eye,
  MoreHorizontal,
  RefreshCw,
  LayoutGrid,
  LayoutList,
  TrendingUp,
  Files,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { CreateClientModal } from "@/components/modals/CreateClientModal";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, formatCPF } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";

interface Address {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  cep: string;
}

interface Process {
  id: string;
  status: string;
  type: string;
  createdAt: string;
  operator?: {
    id: string;
    name: string;
  };
}

interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate?: string | null;
  rg?: string | null;
  motherName?: string | null;
  address?: Address | null;
  source: string;
  status: string;
  preferredContact?: string | null;
  notifications: boolean;
  createdAt: string;
  _count: {
    processes: number;
  };
  processes: Process[];
}

interface ClientStats {
  total: number;
  active: number;
  withProcesses: number;
  recentlyAdded: number;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
}

const ClientsPage: FC = () => {
  const { operator } = useAuth();
  const { toast } = useToast();
  const isAdmin = operator?.role === "ADMIN";
  const router = useRouter();

  // Estados básicos
  const [searchTerm, setSearchTerm] = useState("");
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Estados de filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [processFilter, setProcessFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("createdAt");

  // Estados de estatísticas
  const [stats, setStats] = useState<ClientStats>({
    total: 0,
    active: 0,
    withProcesses: 0,
    recentlyAdded: 0,
    bySource: {},
    byStatus: {},
  });

  // Buscar clientes
  const fetchClients = async () => {
    if (!operator?.id) return;

    try {
      setLoading(true);
      const response = await fetch(
        `/api/v1/clients?operatorId=${operator.id}&role=${operator.role}`
      );
      const data = await response.json();
      setClients(data);
      calculateStats(data);
    } catch (error) {
      console.error("Erro ao carregar clientes:", error);
      toast({
        title: "Erro",
        description: "Erro ao carregar clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Calcular estatísticas
  const calculateStats = (clientsData: Client[]) => {
    const now = new Date();
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const newStats: ClientStats = {
      total: clientsData.length,
      active: clientsData.filter((c) => c.status === "ACTIVE").length,
      withProcesses: clientsData.filter((c) => c._count.processes > 0).length,
      recentlyAdded: clientsData.filter((c) => new Date(c.createdAt) > lastWeek)
        .length,
      bySource: {},
      byStatus: {},
    };

    // Contagem por fonte
    clientsData.forEach((client) => {
      newStats.bySource[client.source] =
        (newStats.bySource[client.source] || 0) + 1;
      newStats.byStatus[client.status] =
        (newStats.byStatus[client.status] || 0) + 1;
    });

    setStats(newStats);
  };

  useEffect(() => {
    fetchClients();
  }, [operator?.id]);

  // Filtrar clientes
  const filteredClients = clients
    .filter((client) => {
      const matchesSearch =
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf.includes(searchTerm) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.phone.includes(searchTerm);

      const matchesStatus =
        statusFilter === "all" || client.status === statusFilter;
      const matchesSource =
        sourceFilter === "all" || client.source === sourceFilter;
      const matchesProcess =
        processFilter === "all" ||
        (processFilter === "with" && client._count.processes > 0) ||
        (processFilter === "without" && client._count.processes === 0);

      return matchesSearch && matchesStatus && matchesSource && matchesProcess;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name);
        case "processes":
          return b._count.processes - a._count.processes;
        case "createdAt":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

  // Funções auxiliares
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      ACTIVE: "bg-emerald-100 text-emerald-800 border-emerald-200",
      INACTIVE: "bg-gray-100 text-gray-800 border-gray-200",
      BLOCKED: "bg-red-100 text-red-800 border-red-200",
    };
    return (
      statusConfig[status as keyof typeof statusConfig] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const getSourceBadge = (source: string) => {
    const sourceConfig = {
      MANUAL: "bg-blue-100 text-blue-800 border-blue-200",
      BOT: "bg-purple-100 text-purple-800 border-purple-200",
      PLATFORM: "bg-amber-100 text-amber-800 border-amber-200",
    };
    return (
      sourceConfig[source as keyof typeof sourceConfig] ||
      "bg-gray-100 text-gray-800 border-gray-200"
    );
  };

  const translateSource = (source: string) => {
    const translations = {
      MANUAL: "Manual",
      BOT: "WhatsApp Bot",
      PLATFORM: "Plataforma",
    };
    return translations[source as keyof typeof translations] || source;
  };

  const translateStatus = (status: string) => {
    const translations = {
      ACTIVE: "Ativo",
      INACTIVE: "Inativo",
      BLOCKED: "Bloqueado",
    };
    return translations[status as keyof typeof translations] || status;
  };

  // Componente ClientCard para view grid
  const ClientCard = ({ client }: { client: Client }) => {
    const hasActiveProcesses = client.processes.some(
      (p) => !["COMPLETED", "CANCELLED"].includes(p.status)
    );

    return (
      <Card
        className="group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-white border border-gray-200"
        onClick={() => router.push(`/operador/clients/${client.id}`)}
      >
        <CardContent className="p-6">
          {/* Header - Nome e Status */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-1 group-hover:text-emerald-600 transition-colors">
                {client.name}
              </h3>
              <div className="flex items-center gap-2 mb-2">
                <Badge
                  variant="outline"
                  className={getStatusBadge(client.status)}
                >
                  {translateStatus(client.status)}
                </Badge>
                <Badge
                  variant="outline"
                  className={getSourceBadge(client.source)}
                >
                  {translateSource(client.source)}
                </Badge>
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                  <Eye className="mr-2 h-4 w-4" />
                  Ver Detalhes
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Mail className="h-4 w-4" />
              <span className="truncate">{client.email}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Phone className="h-4 w-4" />
              <span>{client.phone}</span>
            </div>
            {client.address && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span className="truncate">
                  {client.address.city}, {client.address.state}
                </span>
              </div>
            )}
          </div>

          {/* Processos */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Processos
              </span>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-emerald-600">
                  {client._count.processes}
                </span>
                {hasActiveProcesses && (
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>

            {/* Indicador de operador vinculado (apenas para admin) */}
            {isAdmin && client.processes.length > 0 && (
              <div className="mt-2">
                <div className="text-xs text-gray-500 mb-1">Operadores:</div>
                <div className="flex flex-wrap gap-1">
                  {Array.from(
                    new Set(
                      client.processes
                        .filter((p) => p.operator)
                        .map((p) => p.operator!.name)
                    )
                  ).map((operatorName) => (
                    <Badge
                      key={operatorName}
                      variant="secondary"
                      className="text-xs bg-emerald-50 text-emerald-700"
                    >
                      {operatorName}
                    </Badge>
                  ))}
                  {client.processes.some((p) => !p.operator) && (
                    <Badge
                      variant="secondary"
                      className="text-xs bg-gray-50 text-gray-600"
                    >
                      Não atribuído
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer - Data de criação */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Calendar className="h-3 w-3" />
              <span>Cadastrado em {formatDate(client.createdAt)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isAdmin ? "Todos os Clientes" : "Meus Clientes"}
              </h1>
              <p className="text-gray-600">
                {isAdmin
                  ? "Gerencie todos os clientes cadastrados no sistema"
                  : "Clientes dos processos atribuídos a você"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={fetchClients}
                disabled={loading}
                className="border-gray-300"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              {isAdmin && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">
                    Total de Clientes
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.total}
                  </p>
                </div>
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    {stats.active}
                  </p>
                </div>
                <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <UserCheck className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Com Processos</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {stats.withProcesses}
                  </p>
                </div>
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Files className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Novos (7 dias)</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {stats.recentlyAdded}
                  </p>
                </div>
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600"></div>
              <p className="text-sm text-gray-600">Carregando clientes...</p>
            </div>
          </div>
        ) : clients.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Users className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum cliente encontrado
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                {isAdmin
                  ? "Ainda não há clientes cadastrados no sistema."
                  : "Você ainda não possui clientes atribuídos aos seus processos."}
              </p>
              {isAdmin && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Cadastrar Primeiro Cliente
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-4">
              {/* Filtros */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por nome, CPF, email ou telefone..."
                        className="pl-10 h-10 bg-white border-gray-300 focus:border-emerald-500 focus:ring-emerald-500/20"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-32 h-10 border-gray-300">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Status</SelectItem>
                        <SelectItem value="ACTIVE">Ativo</SelectItem>
                        <SelectItem value="INACTIVE">Inativo</SelectItem>
                        <SelectItem value="BLOCKED">Bloqueado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={sourceFilter}
                      onValueChange={setSourceFilter}
                    >
                      <SelectTrigger className="w-32 h-10 border-gray-300">
                        <SelectValue placeholder="Origem" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas Origens</SelectItem>
                        <SelectItem value="BOT">WhatsApp Bot</SelectItem>
                        <SelectItem value="MANUAL">Manual</SelectItem>
                        <SelectItem value="PLATFORM">Plataforma</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={processFilter}
                      onValueChange={setProcessFilter}
                    >
                      <SelectTrigger className="w-36 h-10 border-gray-300">
                        <SelectValue placeholder="Processos" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="with">Com Processos</SelectItem>
                        <SelectItem value="without">Sem Processos</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36 h-10 border-gray-300">
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="createdAt">Mais Recente</SelectItem>
                        <SelectItem value="name">Nome A-Z</SelectItem>
                        <SelectItem value="processes">
                          Mais Processos
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex border-l border-gray-300 pl-2 gap-1">
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="h-10 px-3"
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-10 px-3"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredClients.length} de {clients.length} clientes
                  </span>
                  {(statusFilter !== "all" ||
                    sourceFilter !== "all" ||
                    processFilter !== "all" ||
                    searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setSourceFilter("all");
                        setProcessFilter("all");
                        setSearchTerm("");
                      }}
                      className="text-gray-500 hover:text-gray-700 h-8"
                    >
                      Limpar filtros
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {viewMode === "grid" ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                  {filteredClients.map((client) => (
                    <ClientCard key={client.id} client={client} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">
                          Cliente
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Contato
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Origem
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Processos
                        </TableHead>
                        {isAdmin && (
                          <TableHead className="font-semibold text-gray-900">
                            Operadores
                          </TableHead>
                        )}
                        <TableHead className="font-semibold text-gray-900">
                          Cadastrado
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredClients.map((client) => (
                        <TableRow
                          key={client.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                          onClick={() =>
                            router.push(`/operador/clients/${client.id}`)
                          }
                        >
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">
                                {client.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                CPF: {formatCPF(client.cpf)}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate max-w-[200px]">
                                  {client.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{client.phone}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getStatusBadge(client.status)}
                            >
                              {translateStatus(client.status)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getSourceBadge(client.source)}
                            >
                              {translateSource(client.source)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-emerald-600">
                                {client._count.processes}
                              </span>
                              {client.processes.some(
                                (p) =>
                                  !["COMPLETED", "CANCELLED"].includes(p.status)
                              ) && (
                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                              )}
                            </div>
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              <div className="flex flex-wrap gap-1 max-w-[200px]">
                                {Array.from(
                                  new Set(
                                    client.processes
                                      .filter((p) => p.operator)
                                      .map((p) => p.operator!.name)
                                  )
                                ).map((operatorName) => (
                                  <Badge
                                    key={operatorName}
                                    variant="secondary"
                                    className="text-xs bg-emerald-50 text-emerald-700 border-emerald-200"
                                  >
                                    {operatorName}
                                  </Badge>
                                ))}
                                {client.processes.some((p) => !p.operator) && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs bg-orange-50 text-orange-700 border-orange-200"
                                  >
                                    Não atribuído
                                  </Badge>
                                )}
                                {client.processes.length === 0 && (
                                  <span className="text-sm text-gray-400 italic">
                                    Sem processos
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {formatDate(client.createdAt)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(client.createdAt).toLocaleTimeString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Ações</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() =>
                                    router.push(
                                      `/operador/clients/${client.id}`
                                    )
                                  }
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modal de Criação */}
        <CreateClientModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            fetchClients();
          }}
        />
      </div>
    </div>
  );
};

export default ClientsPage;
