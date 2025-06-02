"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Search,
  Filter,
  CheckSquare,
  Square,
  Minus,
  ArrowRight,
  Clock,
  AlertTriangle,
  FileText,
  Calendar,
  RefreshCw,
  X,
} from "lucide-react";
import { translateProcessStatus, translateProcessPriority } from "@/lib/utils";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface Process {
  id: string;
  status: string;
  priority: string;
  type: string;
  progress: number;
  createdAt: string;
  lastInteractionAt: string;
  client: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  company?: {
    id: string;
    name: string;
  } | null;
  documentsCount: number;
  timelineCount: number;
  daysOld: number;
  daysSinceLastInteraction: number;
}

interface ProcessStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  avgProgress: number;
}

interface ReassignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: Array<{
    id: string;
    name: string;
    processesCount: number;
  }>;
  onReassign: (data: {
    fromOperatorId: string;
    toOperatorId: string;
    processIds: string[];
  }) => Promise<void>;
}

export function ReassignmentModal({
  isOpen,
  onClose,
  operators,
  onReassign,
}: ReassignmentModalProps) {
  const { operator } = useAuth();
  const [fromOperatorId, setFromOperatorId] = useState("");
  const [toOperatorId, setToOperatorId] = useState("");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [processStats, setProcessStats] = useState<ProcessStats | null>(null);
  const [selectedProcessIds, setSelectedProcessIds] = useState<Set<string>>(
    new Set()
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [isLoadingProcesses, setIsLoadingProcesses] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Buscar processos quando operador origem for selecionado
  useEffect(() => {
    if (fromOperatorId && operator?.id) {
      fetchOperatorProcesses();
    } else {
      setProcesses([]);
      setProcessStats(null);
      setSelectedProcessIds(new Set());
    }
  }, [fromOperatorId, operator?.id]);

  const fetchOperatorProcesses = async () => {
    setIsLoadingProcesses(true);
    try {
      console.log("🔍 Buscando processos do operador...");
      console.log("👤 Operador ID:", fromOperatorId);
      console.log("🔑 Admin ID:", operator?.id);

      const url = `/api/v1/admin/processes-by-operator?operatorId=${fromOperatorId}&adminId=${operator?.id}`;
      console.log("🌐 URL da requisição:", url);

      const response = await fetch(url);
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Erro na resposta:", errorData);
        throw new Error(
          `Erro ${response.status}: ${errorData.error || "Erro desconhecido"}`
        );
      }

      const data = await response.json();
      console.log("📦 Dados recebidos:", data);

      if (data.processes && data.stats) {
        console.log(`✅ ${data.processes.length} processos encontrados`);
        setProcesses(data.processes);
        setProcessStats(data.stats);
      } else {
        console.warn("⚠️ Formato de resposta inesperado:", data);
        setProcesses([]);
        setProcessStats(null);
      }
    } catch (error) {
      console.error("💥 Erro ao buscar processos:", error);
      toast.error("Erro ao carregar processos do operador");
    } finally {
      setIsLoadingProcesses(false);
    }
  };

  // Filtrar processos baseado nos filtros
  const filteredProcesses = processes.filter((process) => {
    const matchesSearch =
      process.client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      process.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (process.company?.name || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || process.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || process.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  // Funções de seleção em massa
  const selectAll = () => {
    setSelectedProcessIds(new Set(filteredProcesses.map((p) => p.id)));
  };

  const selectNone = () => {
    setSelectedProcessIds(new Set());
  };

  const invertSelection = () => {
    const newSelection = new Set<string>();
    filteredProcesses.forEach((process) => {
      if (!selectedProcessIds.has(process.id)) {
        newSelection.add(process.id);
      }
    });
    setSelectedProcessIds(newSelection);
  };

  // Toggle individual process
  const toggleProcess = (processId: string) => {
    const newSelection = new Set(selectedProcessIds);
    if (newSelection.has(processId)) {
      newSelection.delete(processId);
    } else {
      newSelection.add(processId);
    }
    setSelectedProcessIds(newSelection);
  };

  // Executar reatribuição
  const handleSubmit = async () => {
    if (!fromOperatorId || !toOperatorId || selectedProcessIds.size === 0) {
      toast.error(
        "Preencha todos os campos e selecione pelo menos um processo"
      );
      return;
    }

    if (fromOperatorId === toOperatorId) {
      toast.error("Operador origem e destino devem ser diferentes");
      return;
    }

    setIsSubmitting(true);
    try {
      await onReassign({
        fromOperatorId,
        toOperatorId,
        processIds: Array.from(selectedProcessIds),
      });

      toast.success(
        `${selectedProcessIds.size} processo(s) reatribuído(s) com sucesso!`
      );

      // Reset form
      setFromOperatorId("");
      setToOperatorId("");
      setSelectedProcessIds(new Set());
      setSearchTerm("");
      setStatusFilter("all");
      setPriorityFilter("all");
      onClose();
    } catch (error) {
      console.error("Erro na reatribuição:", error);
      toast.error("Erro ao reatribuir processos");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset ao abrir/fechar modal
  useEffect(() => {
    if (!isOpen) {
      setFromOperatorId("");
      setToOperatorId("");
      setSelectedProcessIds(new Set());
      setSearchTerm("");
      setStatusFilter("all");
      setPriorityFilter("all");
      setProcesses([]);
      setProcessStats(null);
    }
  }, [isOpen]);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "HIGH":
        return "bg-red-100 text-red-800 border-red-200";
      case "MEDIUM":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "LOW":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusColor = (status: string) => {
    if (status.includes("PENDING")) return "bg-yellow-100 text-yellow-800";
    if (status.includes("APPROVED") || status.includes("COMPLETED"))
      return "bg-green-100 text-green-800";
    if (status.includes("REJECTED") || status.includes("CANCELLED"))
      return "bg-red-100 text-red-800";
    return "bg-blue-100 text-blue-800";
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Reatribuir Processos Entre Operadores
          </DialogTitle>
          <DialogDescription>
            Transfira processos de um operador para outro de forma eficiente e
            organizada
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {/* Seleção de Operadores */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="space-y-2">
              <Label htmlFor="from-operator">Operador Origem</Label>
              <Select value={fromOperatorId} onValueChange={setFromOperatorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador origem" />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op.id} value={op.id}>
                      {op.name} ({op.processesCount} processos)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="to-operator">Operador Destino</Label>
              <Select
                value={toOperatorId}
                onValueChange={setToOperatorId}
                disabled={!fromOperatorId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o operador destino" />
                </SelectTrigger>
                <SelectContent>
                  {operators
                    .filter((op) => op.id !== fromOperatorId)
                    .map((op) => (
                      <SelectItem key={op.id} value={op.id}>
                        {op.name} ({op.processesCount} processos)
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Estatísticas do Operador */}
          {processStats && (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {processStats.total}
                  </p>
                  <p className="text-sm text-gray-600">Total de Processos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {Math.round(processStats.avgProgress)}%
                  </p>
                  <p className="text-sm text-gray-600">Progresso Médio</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {selectedProcessIds.size}
                  </p>
                  <p className="text-sm text-gray-600">Selecionados</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-orange-600">
                    {processStats.byPriority.HIGH || 0}
                  </p>
                  <p className="text-sm text-gray-600">Alta Prioridade</p>
                </div>
              </div>
            </div>
          )}

          {/* Filtros e Busca */}
          {fromOperatorId && (
            <div className="space-y-4 mb-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Buscar por cliente, processo ou empresa..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="CREATED">Criado</SelectItem>
                    <SelectItem value="PENDING_DATA">Pendente Dados</SelectItem>
                    <SelectItem value="PENDING_DOCS">Pendente Docs</SelectItem>
                    <SelectItem value="IN_ANALYSIS">Em Análise</SelectItem>
                    <SelectItem value="APPROVED">Aprovado</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={priorityFilter}
                  onValueChange={setPriorityFilter}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="HIGH">Alta</SelectItem>
                    <SelectItem value="MEDIUM">Média</SelectItem>
                    <SelectItem value="LOW">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchOperatorProcesses}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>

              {/* Controles de Seleção */}
              <div className="flex items-center gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={selectAll}>
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Selecionar Todos ({filteredProcesses.length})
                </Button>
                <Button variant="outline" size="sm" onClick={selectNone}>
                  <Square className="h-4 w-4 mr-2" />
                  Limpar Seleção
                </Button>
                <Button variant="outline" size="sm" onClick={invertSelection}>
                  <Minus className="h-4 w-4 mr-2" />
                  Inverter Seleção
                </Button>

                {selectedProcessIds.size > 0 && (
                  <Badge variant="secondary" className="ml-auto">
                    {selectedProcessIds.size} processo(s) selecionado(s)
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Lista de Processos */}
          <ScrollArea className="h-96 border rounded-lg">
            {isLoadingProcesses ? (
              <div className="flex items-center justify-center h-32">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">
                  Carregando processos...
                </span>
              </div>
            ) : filteredProcesses.length > 0 ? (
              <div className="space-y-2 p-4">
                {filteredProcesses.map((process) => (
                  <div
                    key={process.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all hover:shadow-md ${
                      selectedProcessIds.has(process.id)
                        ? "bg-blue-50 border-blue-300"
                        : "bg-white hover:bg-gray-50"
                    }`}
                    onClick={() => toggleProcess(process.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedProcessIds.has(process.id)}
                        onChange={() => toggleProcess(process.id)}
                      />

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium text-gray-900">
                            {process.client.name}
                          </span>
                          <Badge
                            variant="outline"
                            className={getPriorityColor(process.priority)}
                          >
                            {translateProcessPriority(process.priority)}
                          </Badge>
                          <Badge className={getStatusColor(process.status)}>
                            {translateProcessStatus(process.status)}
                          </Badge>

                          {process.daysSinceLastInteraction > 7 && (
                            <Badge variant="destructive">
                              <AlertTriangle className="h-3 w-3 mr-1" />
                              Parado há {process.daysSinceLastInteraction} dias
                            </Badge>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                          <div>
                            <p>
                              <strong>ID:</strong> #{process.id.slice(-8)}
                            </p>
                            <p>
                              <strong>Progresso:</strong> {process.progress}%
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Documentos:</strong>{" "}
                              {process.documentsCount}
                            </p>
                            <p>
                              <strong>Atividades:</strong>{" "}
                              {process.timelineCount}
                            </p>
                          </div>
                          <div>
                            <p>
                              <strong>Criado há:</strong> {process.daysOld} dias
                            </p>
                            {process.company && (
                              <p>
                                <strong>Empresa:</strong> {process.company.name}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : fromOperatorId ? (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <FileText className="h-8 w-8 mb-2" />
                <p>Nenhum processo encontrado</p>
                <p className="text-sm">Tente ajustar os filtros</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                <Users className="h-8 w-8 mb-2" />
                <p>Selecione um operador origem para ver os processos</p>
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Preview da Reatribuição */}
        {selectedProcessIds.size > 0 && fromOperatorId && toOperatorId && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-2">
              <ArrowRight className="h-4 w-4 text-green-600" />
              <span className="font-medium text-green-800">
                Preview da Reatribuição
              </span>
            </div>
            <p className="text-sm text-green-700">
              <strong>{selectedProcessIds.size}</strong> processo(s) serão
              transferidos de{" "}
              <strong>
                {operators.find((op) => op.id === fromOperatorId)?.name}
              </strong>{" "}
              para{" "}
              <strong>
                {operators.find((op) => op.id === toOperatorId)?.name}
              </strong>
            </p>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              !fromOperatorId ||
              !toOperatorId ||
              selectedProcessIds.size === 0 ||
              isSubmitting
            }
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-4 w-4 mr-2" />
            )}
            Reatribuir Processos ({selectedProcessIds.size})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
