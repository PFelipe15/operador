/* eslint-disable @typescript-eslint/no-unused-vars */
"use client";

import {
  AssignToMeButton,
  OperatorActionsButton,
} from "@/components/layout/assigmeButton";
import { TooltipComponent } from "@/components/layout/infoTootip";
import { AssignOperatorModal } from "@/components/modals/assign-operator-modal";
import { CreateProcessModal } from "@/components/modals/CreateProcessModal";
import {
  PaymentStatusBadge,
  PaymentMethodBadge,
} from "@/components/process/PaymentStatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Checkbox } from "@/components/ui/checkbox";
import {
  cn,
  formatDate,
  getPriorityColor,
  getProcessStatusColor,
  getSourceColor,
  translatePriority,
  translateProcessStatus,
  translateProcessType,
  translateSource,
  hasPermission,
} from "@/lib/utils";
import { ProcessStatus } from "@prisma/client";
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  BarChart3,
  Calendar,
  CheckCircle,
  Clock,
  Eye,
  Files,
  Filter,
  LayoutGrid,
  LayoutList,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Search,
  TrendingUp,
  UserCheck,
  UserPlus,
  Users,
  Share2,
  Settings,
  ChevronDown,
  CheckSquare,
  X,
  CreditCard,
  DollarSign,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { FC, useEffect, useState } from "react";

interface Address {
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  cep: string;
}

interface Company {
  id: string;
  name: string;
  cnpj: string | null;
  activity: string | null;
  occupation: string | null;
  capitalSocial: string | null;
  address: Address | null;
}

interface Client {
  id: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
}

interface Document {
  id: string;
  name: string;
  status: string;
}

interface Process {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  priority: string;
  type: string;
  progress: number;
  client: Client;
  company: Company | null;
  documents: Document[];
  operator?: {
    id: string;
    name: string;
  };
  source: string;
  paymentRequired: boolean;
  paymentAmount: number | null;
  paymentMethod: string | null;
  paymentId: string | null;
  paymentPixKey: string | null;
  paymentQrCode: string | null;
  paymentDueDate: string | null;
  paymentConfirmedAt: string | null;
  paymentReference: string | null;
}

interface ProcessStats {
  total: number;
  botOrigin: number;
  manualOrigin: number;
  platformOrigin: number;
  byType: {
    [key: string]: number;
  };
  byStatus: {
    [key: string]: number;
  };
}

const ProcessPage: FC = () => {
  const { operator } = useAuth();
  const isAdmin = operator?.role === "ADMIN";
  const canManageOperators = hasPermission(operator, "MANAGE_OPERATORS");
  const operatorId = operator?.id;
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [currentOperator, setCurrentOperator] = useState({ id: "" });
  const [processStats, setProcessStats] = useState<ProcessStats>({
    total: 0,
    botOrigin: 0,
    manualOrigin: 0,
    platformOrigin: 0,
    byType: {},
    byStatus: {},
  });
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");

  // Novos estados para filtros
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("updatedAt");

  // Estados para distribuição em massa (apenas para admins)
  const [isDistributionMode, setIsDistributionMode] = useState(false);
  const [selectedProcesses, setSelectedProcesses] = useState<string[]>([]);
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false);

  useEffect(() => {
    if (typeof operatorId !== "undefined") {
      const fetchProcesses = async () => {
        try {
          const url = isAdmin
            ? "/api/v1/processes"
            : `/api/v1/processes/operator/${operatorId}`;

          const response = await fetch(url);
          const data = await response.json();
          setProcesses(data);
        } catch (error) {
          console.error("Erro ao carregar processos:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchProcesses();
    }
  }, [operatorId, isAdmin]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!operatorId) return;

      try {
        const response = await fetch(`/api/v1/processes/stats/${operatorId}`);
        const data = await response.json();
        setProcessStats(data);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchStats();
  }, [operatorId]);

  // Filtros e busca melhorados
  const filteredProcesses = processes
    .filter((process) => {
      const matchesSearch =
        process.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        process.company?.name?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || process.status === statusFilter;
      const matchesPriority =
        priorityFilter === "all" || process.priority === priorityFilter;

      // Filtro de pagamento
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "paid" &&
          (process.status === "PAYMENT_CONFIRMED" ||
            !process.paymentRequired)) ||
        (paymentFilter === "pending" &&
          process.paymentRequired &&
          process.status !== "PAYMENT_CONFIRMED") ||
        (paymentFilter === "not_required" && !process.paymentRequired);

      return (
        matchesSearch && matchesStatus && matchesPriority && matchesPayment
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "updatedAt":
          return (
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );
        case "createdAt":
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        case "priority":
          const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
          return (
            (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) -
            (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
          );
        case "progress":
          return b.progress - a.progress;
        default:
          return 0;
      }
    });

  const handleProcessClick = (processId: string) => {
    router.push(`/operador/process/${processId}`);
  };

  const handleNewProcess = () => {
    setIsCreateModalOpen(true);
  };

  const refreshProcesses = async () => {
    setLoading(true);
    try {
      const url = isAdmin
        ? "/api/v1/processes"
        : `/api/v1/processes/operator/${operatorId}`;

      const response = await fetch(url);
      const data = await response.json();
      setProcesses(data);
    } catch (error) {
      console.error("Erro ao carregar processos:", error);
    } finally {
      setLoading(false);
    }
  };

  // Estatísticas calculadas dos processos filtrados
  const statsCalculated = {
    total: filteredProcesses.length,
    active: filteredProcesses.filter(
      (p) => p.status !== "COMPLETED" && p.status !== "CANCELLED"
    ).length,
    urgent: filteredProcesses.filter((p) => p.priority === "HIGH").length,
    completed: filteredProcesses.filter(
      (p) => p.status === "APPROVED" || p.status === "COMPLETED"
    ).length,
    // Novas estatísticas de pagamento
    readyToWork: filteredProcesses.filter(
      (p) =>
        (p.status === "PAYMENT_CONFIRMED" || !p.paymentRequired) &&
        p.status !== "COMPLETED" &&
        p.status !== "CANCELLED"
    ).length,
    awaitingPayment: filteredProcesses.filter(
      (p) =>
        p.paymentRequired &&
        !["PAYMENT_CONFIRMED", "COMPLETED", "CANCELLED"].includes(p.status)
    ).length,
    avgProgress:
      filteredProcesses.length > 0
        ? Math.round(
            filteredProcesses.reduce((acc, p) => acc + p.progress, 0) /
              filteredProcesses.length
          )
        : 0,
  };

  // Função para alternar o modo de distribuição
  const toggleDistributionMode = () => {
    setIsDistributionMode(!isDistributionMode);
    setSelectedProcesses([]);
  };

  // Função para selecionar/desselecionar processo
  const toggleProcessSelection = (processId: string) => {
    setSelectedProcesses((prev) => {
      if (prev.includes(processId)) {
        return prev.filter((id) => id !== processId);
      } else {
        return [...prev, processId];
      }
    });
  };

  // Função para selecionar todos os processos visíveis
  const selectAllVisibleProcesses = () => {
    const visibleProcessIds = filteredProcesses.map((p) => p.id);
    setSelectedProcesses(visibleProcessIds);
  };

  // Função para limpar seleção
  const clearSelection = () => {
    setSelectedProcesses([]);
  };

  const AdminActions: FC<{ process: Process }> = ({ process }) => {
    if (!isAdmin) return null;

    return (
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
        <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenuLabel>Ações do Administrador</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => {
              e.stopPropagation();
              setSelectedProcessId(process.id);
              setIsAssignModalOpen(true);
            }}
          >
            {process.operator ? (
              <UserCheck className="mr-2 h-4 w-4" />
            ) : (
              <UserPlus className="mr-2 h-4 w-4" />
            )}
            {process.operator ? "Transferir Operador" : "Atribuir Operador"}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Alterar Prioridade
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  const ProcessCard = ({ process }: { process: Process }) => {
    const daysOld = Math.floor(
      (new Date().getTime() - new Date(process.createdAt).getTime()) /
        (1000 * 60 * 60 * 24)
    );

    const isSelected = selectedProcesses.includes(process.id);

    // Verifica se o processo está pronto para trabalhar
    const isReadyToWork =
      !process.paymentRequired || process.status === "PAYMENT_CONFIRMED";
    const needsPayment =
      process.paymentRequired &&
      (process.status === "PAYMENT_PENDING" ||
        process.status === "AWAITING_PAYMENT");

    const getPriorityStyles = (priority: string) => {
      switch (priority) {
        case "HIGH":
          return {
            border: "border-red-200",
            bg: "bg-red-50",
            text: "text-red-700",
            accent: "bg-red-500",
          };
        case "MEDIUM":
          return {
            border: "border-green-200",
            bg: "bg-green-50",
            text: "text-green-700",
            accent: "bg-green-500",
          };
        case "LOW":
          return {
            border: "border-emerald-200",
            bg: "bg-emerald-50",
            text: "text-emerald-700",
            accent: "bg-emerald-500",
          };
        default:
          return {
            border: "border-gray-200",
            bg: "bg-gray-50",
            text: "text-gray-700",
            accent: "bg-gray-500",
          };
      }
    };

    const priorityStyles = getPriorityStyles(process.priority);

    return (
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 hover:shadow-lg hover:-translate-y-1",
          "bg-white border border-gray-200 rounded-xl overflow-hidden h-full flex flex-col",
          isDistributionMode &&
            isSelected &&
            "ring-2 ring-emerald-500 border-emerald-300 bg-emerald-50/30",
          isDistributionMode && !isSelected && "opacity-70",
          // Destaque para processos que precisam de pagamento
          needsPayment && "border-orange-300 bg-orange-50/30",
          // Destaque para processos prontos para trabalhar
          isReadyToWork &&
            !needsPayment &&
            "border-emerald-200 bg-emerald-50/10"
        )}
        onClick={() => {
          if (isDistributionMode) {
            toggleProcessSelection(process.id);
          } else {
            router.push(`/operador/process/${process.id}`);
          }
        }}
      >
        <CardContent className="p-0 flex flex-col h-full">
          {/* Alerta de Pagamento Pendente */}
          {needsPayment && (
            <div className="bg-orange-100 border-b border-orange-200 p-3">
              <div className="flex items-center gap-2 text-orange-800">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ⏳ Aguardando pagamento para iniciar
                </span>
              </div>
            </div>
          )}

          {/* Badge de Pronto para Trabalhar */}
          {isReadyToWork && !needsPayment && process.paymentRequired && (
            <div className="bg-emerald-100 border-b border-emerald-200 p-3">
              <div className="flex items-center gap-2 text-emerald-800">
                <CheckCircle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  ✅ Pagamento confirmado - Pronto para trabalhar
                </span>
              </div>
            </div>
          )}

          {/* Checkbox para modo distribuição */}
          {isDistributionMode && (
            <div className="p-4 pb-0">
              <div className="flex items-center gap-2 p-2 bg-emerald-50 rounded-lg border border-emerald-200">
                <Checkbox
                  checked={isSelected}
                  onCheckedChange={() => toggleProcessSelection(process.id)}
                  onClick={(e) => e.stopPropagation()}
                  className="h-4 w-4"
                />
                <span className="text-xs text-emerald-700">
                  {isSelected ? "Selecionado" : "Selecionar"}
                </span>
              </div>
            </div>
          )}

          <div className="p-5 flex flex-col flex-grow">
            {/* Header - Cliente e Badges */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-semibold text-gray-900 truncate mb-1 group-hover:text-emerald-600 transition-colors">
                  {process.client.name}
                </h3>
                <p className="text-sm text-gray-500 truncate mb-3">
                  {process.client.email}
                </p>

                {/* Badges inline */}
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-medium px-2 py-1",
                      priorityStyles.border,
                      priorityStyles.bg,
                      priorityStyles.text
                    )}
                  >
                    {translatePriority(process.priority)}
                  </Badge>
                  <Badge
                    variant="secondary"
                    className={cn(
                      "text-xs",
                      getProcessStatusColor(process.status)
                    )}
                  >
                    {translateProcessStatus(process.status)}
                  </Badge>

                  {/* Badge de Status de Pagamento */}
                  {process.paymentRequired && (
                    <PaymentStatusBadge
                      status={process.status}
                      paymentAmount={process.paymentAmount}
                      paymentMethod={process.paymentMethod}
                      paymentConfirmedAt={process.paymentConfirmedAt}
                      size="sm"
                    />
                  )}

                  {/* Badge de Método de Pagamento */}
                  {process.paymentMethod && (
                    <PaymentMethodBadge paymentMethod={process.paymentMethod} />
                  )}

                  <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                    #{process.id.slice(-6)}
                  </span>
                </div>
              </div>
            </div>

            {/* Progresso */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Progresso
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {process.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    process.progress >= 80
                      ? "bg-emerald-500"
                      : process.progress >= 50
                      ? "bg-emerald-400"
                      : process.progress >= 20
                      ? "bg-green-400"
                      : "bg-gray-400"
                  )}
                  style={{ width: `${process.progress}%` }}
                />
              </div>
            </div>

            {/* Informações do Processo */}
            <div className="space-y-3 mb-4 flex-grow">
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">Tipo</span>
                <span className="text-sm font-medium text-gray-900 text-right">
                  {translateProcessType(process.type)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Empresa
                </span>
                <span className="text-sm text-gray-900 truncate max-w-[60%] text-right">
                  {process.company?.name || "Não definida"}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Documentos
                </span>
                <span className="text-sm font-medium text-gray-900">
                  {
                    process.documents.filter((doc) => doc.status === "Enviado")
                      .length
                  }
                  /{process.documents.length}
                </span>
              </div>

              {/* Informações de Pagamento */}
              {process.paymentRequired && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500 font-medium">
                      Valor
                    </span>
                    <span className="text-sm font-semibold text-gray-900">
                      {process.paymentAmount
                        ? `R$ ${process.paymentAmount.toFixed(2)}`
                        : "Não definido"}
                    </span>
                  </div>

                  {process.paymentConfirmedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">
                        Pago em
                      </span>
                      <span className="text-sm text-emerald-600 font-medium">
                        {formatDate(process.paymentConfirmedAt)}
                      </span>
                    </div>
                  )}

                  {process.paymentDueDate && !process.paymentConfirmedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-500 font-medium">
                        Vencimento
                      </span>
                      <span
                        className={cn(
                          "text-sm font-medium",
                          new Date(process.paymentDueDate) < new Date()
                            ? "text-red-600"
                            : "text-orange-600"
                        )}
                      >
                        {formatDate(process.paymentDueDate)}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500 font-medium">
                  Atualizado
                </span>
                <span className="text-sm text-gray-900">
                  {daysOld === 0 ? "Hoje" : `${daysOld}d`}
                </span>
              </div>
            </div>

            {/* Footer - Operador e Ações */}
            <div
              className="pt-4 border-t border-gray-100 mt-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {process.operator ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <UserCheck className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {process.operator.name}
                      </p>
                      <p className="text-xs text-gray-500">Operador</p>
                    </div>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <AdminActions process={process} />
                    <OperatorActionsButton
                      process={process}
                      onAction={(action) => {
                        console.log(
                          `Ação ${action} executada no processo ${process.id}`
                        );
                        refreshProcesses();
                      }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex-1">
                    {isReadyToWork ? (
                      <AssignToMeButton
                        processId={process.id}
                        onAssignSuccess={refreshProcesses}
                      />
                    ) : (
                      <div className="text-center p-2 bg-orange-50 rounded-lg border border-orange-200">
                        <p className="text-sm text-orange-700 font-medium">
                          💰 Aguardando pagamento
                        </p>
                        <p className="text-xs text-orange-600">
                          Cliente deve pagar antes de iniciar
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <AdminActions process={process} />
                    <OperatorActionsButton
                      process={process}
                      onAction={(action) => {
                        console.log(
                          `Ação ${action} executada no processo ${process.id}`
                        );
                        refreshProcesses();
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Header Simplificado */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Processos
              </h1>
              <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  {statsCalculated.total} Total
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  {statsCalculated.active} Ativos
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  {statsCalculated.urgent} Urgentes
                </span>
                <span className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  {statsCalculated.avgProgress}% Progresso
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={refreshProcesses}
                disabled={loading}
                className="border-gray-300"
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Atualizar
              </Button>
              <Button
                onClick={handleNewProcess}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo Processo
              </Button>
            </div>
          </div>
        </div>

        {/* Cards de Estatísticas Compactos */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Total</p>
                  <p className="text-xl font-bold text-gray-900">
                    {statsCalculated.total}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Files className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-emerald-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-emerald-600 mb-1 font-medium">
                    Prontos p/ Trabalhar
                  </p>
                  <p className="text-xl font-bold text-emerald-600">
                    {statsCalculated.readyToWork}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-orange-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-orange-600 mb-1 font-medium">
                    Aguardando Pagto
                  </p>
                  <p className="text-xl font-bold text-orange-600">
                    {statsCalculated.awaitingPayment}
                  </p>
                </div>
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Ativos</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {statsCalculated.active}
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Urgentes</p>
                  <p className="text-xl font-bold text-red-600">
                    {statsCalculated.urgent}
                  </p>
                </div>
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-600 mb-1">Progresso</p>
                  <p className="text-xl font-bold text-emerald-600">
                    {statsCalculated.avgProgress}%
                  </p>
                </div>
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="h-4 w-4 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Painel de Distribuição Simplificado */}
        {isAdmin && canManageOperators && (
          <Card className="bg-emerald-50 border border-emerald-200 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                    <Share2 className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      Distribuição de Processos
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isDistributionMode
                        ? `${selectedProcesses.length} processos selecionados`
                        : "Ative para distribuir processos em massa"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {isDistributionMode && (
                    <>
                      {selectedProcesses.length > 0 && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={clearSelection}
                            className="border-gray-300"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Limpar
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => setIsBulkAssignModalOpen(true)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Distribuir ({selectedProcesses.length})
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={selectAllVisibleProcesses}
                        className="border-gray-300"
                      >
                        <CheckSquare className="h-4 w-4 mr-1" />
                        Todos
                      </Button>
                    </>
                  )}
                  <Button
                    variant={isDistributionMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleDistributionMode}
                    className={
                      isDistributionMode
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                        : "border-gray-300"
                    }
                  >
                    <Settings className="h-4 w-4 mr-1" />
                    {isDistributionMode ? "Sair" : "Distribuir"}
                  </Button>
                </div>
              </div>

              {isDistributionMode && selectedProcesses.length > 0 && (
                <div className="mt-4 p-3 bg-emerald-100/50 rounded-lg border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckSquare className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-medium text-emerald-900">
                      Processos Selecionados:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {selectedProcesses.slice(0, 5).map((processId) => {
                      const process = processes.find((p) => p.id === processId);
                      return (
                        <Badge
                          key={processId}
                          variant="secondary"
                          className="text-xs bg-white border border-emerald-200"
                        >
                          {process?.client.name || processId.slice(-6)}
                        </Badge>
                      );
                    })}
                    {selectedProcesses.length > 5 && (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-white border border-emerald-200"
                      >
                        +{selectedProcesses.length - 5}
                      </Badge>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-200 border-t-emerald-600"></div>
              <p className="text-sm text-gray-600">Carregando processos...</p>
            </div>
          </div>
        ) : processes.length === 0 ? (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardContent className="flex flex-col items-center justify-center p-16 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Files className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Nenhum processo encontrado
              </h2>
              <p className="text-gray-600 mb-6 max-w-md">
                Não existem processos atribuídos a você ou pendentes de
                atribuição no momento.
              </p>
              <Button
                onClick={handleNewProcess}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Processo
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-white border border-gray-200 shadow-sm">
            <CardHeader className="border-b border-gray-200 bg-gray-50/50 p-4">
              {/* Filtros Compactos */}
              <div className="space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Buscar por cliente, ID ou empresa..."
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
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="CREATED">Criado</SelectItem>
                        <SelectItem value="DOCS_SENT">Docs Enviados</SelectItem>
                        <SelectItem value="IN_ANALYSIS">Em Análise</SelectItem>
                        <SelectItem value="APPROVED">Aprovado</SelectItem>
                        <SelectItem value="REJECTED">Rejeitado</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={priorityFilter}
                      onValueChange={setPriorityFilter}
                    >
                      <SelectTrigger className="w-32 h-10 border-gray-300">
                        <SelectValue placeholder="Prioridade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todas</SelectItem>
                        <SelectItem value="HIGH">Alta</SelectItem>
                        <SelectItem value="MEDIUM">Média</SelectItem>
                        <SelectItem value="LOW">Baixa</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={paymentFilter}
                      onValueChange={setPaymentFilter}
                    >
                      <SelectTrigger className="w-40 h-10 border-gray-300">
                        <SelectValue placeholder="Pagamento" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="paid">✅ Pagos</SelectItem>
                        <SelectItem value="pending">⏳ Aguardando</SelectItem>
                        <SelectItem value="not_required">
                          🆓 Não Requer
                        </SelectItem>
                      </SelectContent>
                    </Select>

                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="w-36 h-10 border-gray-300">
                        <SelectValue placeholder="Ordenar" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="updatedAt">Mais Recente</SelectItem>
                        <SelectItem value="createdAt">Data Criação</SelectItem>
                        <SelectItem value="priority">Prioridade</SelectItem>
                        <SelectItem value="progress">Progresso</SelectItem>
                      </SelectContent>
                    </Select>

                    <div className="flex border-l border-gray-300 pl-2 gap-1">
                      <Button
                        variant={viewMode === "grid" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("grid")}
                        className="h-10 px-3"
                      >
                        <LayoutGrid className="h-4 w-4" />
                      </Button>
                      <Button
                        variant={viewMode === "table" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setViewMode("table")}
                        className="h-10 px-3"
                      >
                        <LayoutList className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredProcesses.length} de {processes.length} processos
                  </span>
                  {(statusFilter !== "all" ||
                    priorityFilter !== "all" ||
                    paymentFilter !== "all" ||
                    searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setStatusFilter("all");
                        setPriorityFilter("all");
                        setPaymentFilter("all");
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                  {filteredProcesses.map((process) => (
                    <ProcessCard key={process.id} process={process} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="font-semibold text-gray-900">
                          ID
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Cliente
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Empresa
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Tipo
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Status
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Prioridade
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Progresso
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Documentos
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Atualização
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Operador
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Origem
                        </TableHead>
                        <TableHead className="font-semibold text-gray-900">
                          Ações
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProcesses.map((process) => (
                        <TableRow
                          key={process.id}
                          className="cursor-pointer hover:bg-gray-50 transition-colors border-b border-gray-100"
                          onClick={() => handleProcessClick(process.id)}
                        >
                          <TableCell className="font-mono text-sm text-gray-600">
                            {process.id.slice(-8)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-semibold text-gray-900">
                                {process.client.name}
                              </span>
                              <span className="text-sm text-gray-500">
                                {process.client.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {process.company?.name || (
                              <span className="text-gray-400 italic">
                                Não definida
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium">
                              {translateProcessType(process.type)}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn(
                                getProcessStatusColor(process.status)
                              )}
                            >
                              {translateProcessStatus(process.status)}  
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={cn(getPriorityColor(process.priority))}
                            >
                              {translatePriority(process.priority)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden min-w-[60px]">
                                <div
                                  className="h-2 bg-emerald-500 rounded-full transition-all"
                                  style={{ width: `${process.progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-gray-600 w-9">
                                {process.progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <span className="text-sm font-medium">
                                {`${
                                  process.documents.filter(
                                    (doc) => doc.status === "Enviado"
                                  ).length
                                }/${process.documents.length}`}
                              </span>
                              <span className="text-sm text-gray-500">
                                enviados
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">
                                {formatDate(process.updatedAt)}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(process.updatedAt).toLocaleTimeString(
                                  "pt-BR"
                                )}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            {process.operator ? (
                              <div className="flex items-center gap-2">
                                <UserCheck className="h-4 w-4 text-emerald-500" />
                                <span className="text-sm font-medium">
                                  {process.operator.name}
                                </span>
                              </div>
                            ) : // Verifica se está pronto para trabalhar
                            !process.paymentRequired ||
                              process.status === "PAYMENT_CONFIRMED" ? (
                              <AssignToMeButton
                                processId={process.id}
                                onAssignSuccess={refreshProcesses}
                              />
                            ) : (
                              <div className="text-center p-1 bg-orange-50 rounded border border-orange-200">
                                <p className="text-xs text-orange-700 font-medium">
                                  💰 Aguardando pagamento
                                </p>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={getSourceColor(process.source)}
                            >
                              {translateSource(process.source)}
                            </Badge>
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleProcessClick(process.id);
                                }}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <OperatorActionsButton
                                process={process}
                                onAction={(action) => {
                                  console.log(
                                    `Ação ${action} executada no processo ${process.id}`
                                  );
                                }}
                              />
                              <AdminActions process={process} />
                            </div>
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

        {/* Modais */}
        <AssignOperatorModal
          isOpen={isAssignModalOpen}
          onClose={() => setIsAssignModalOpen(false)}
          processId={selectedProcessId}
          currentOperatorId={currentOperator.id}
          onAssign={refreshProcesses}
        />

        <CreateProcessModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSuccess={() => {
            setIsCreateModalOpen(false);
            refreshProcesses();
          }}
          operatorId={currentOperator.id}
        />

        {/* Modal de Distribuição em Massa */}
        <AssignOperatorModal
          isOpen={isBulkAssignModalOpen}
          onClose={() => setIsBulkAssignModalOpen(false)}
          processIds={selectedProcesses}
          onAssign={() => {
            refreshProcesses();
            setSelectedProcesses([]);
            setIsDistributionMode(false);
          }}
          mode="bulk"
        />
      </div>
    </div>
  );
};

export default ProcessPage;
