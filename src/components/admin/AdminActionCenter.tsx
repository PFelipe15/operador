"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowRightLeft,
  AlertTriangle,
  MessageSquare,
  Shield,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { ReassignmentModal } from "./ReassignmentModal";

interface AdminActionCenterProps {
  onAction?: (action: string, result: Record<string, unknown>) => void;
}

interface Operator {
  id: string;
  name: string;
  processCount: number;
  processesCount: number; // Para compatibilidade com ReassignmentModal
  email: string;
  role: string;
  status: string;
}

type NotificationType = "INFO" | "WARNING" | "ALERT" | "SUCCESS";

export function AdminActionCenter({ onAction }: AdminActionCenterProps) {
  const { operator } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loadingOperators, setLoadingOperators] = useState(true);
  const [showReassignModal, setShowReassignModal] = useState(false);

  // Estados dos modais
  const [selectedModal, setSelectedModal] = useState<string | null>(null);
  const [massUpdateData, setMassUpdateData] = useState({
    priority: "",
    processIds: [] as string[],
  });
  const [notificationData, setNotificationData] = useState({
    title: "",
    message: "",
    type: "INFO" as NotificationType,
    targetOperators: [] as string[],
  });

  useEffect(() => {
    fetchOperators();
  }, []);

  const fetchOperators = async () => {
    try {
      setLoadingOperators(true);
      console.log("🔍 Iniciando busca de operadores...");
      console.log("👤 Operador atual:", operator);

      const url = `/api/v1/admin/operators?adminId=${operator?.id}`;
      console.log("🌐 URL da requisição:", url);

      const response = await fetch(url);
      console.log("📡 Response status:", response.status);
      console.log("📡 Response ok:", response.ok);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Dados recebidos:", data);

        if (data.success && data.operators) {
          // Adicionar processesCount para compatibilidade
          const formattedOperators = data.operators.map((op: Operator) => ({
            ...op,
            processesCount: op.processCount,
          }));
          console.log("✅ Operadores formatados:", formattedOperators);
          setOperators(formattedOperators);
        } else {
          console.warn("⚠️ Formato de resposta inesperado:", data);
          setOperators([]);
        }
      } else {
        const errorData = await response.json();
        console.error("❌ Erro na resposta:", errorData);
        toast.error(
          `Erro ao carregar operadores: ${
            errorData.error || "Erro desconhecido"
          }`
        );
      }
    } catch (error) {
      console.error("💥 Erro ao carregar operadores:", error);
      toast.error("Erro ao carregar lista de operadores");
    } finally {
      setLoadingOperators(false);
    }
  };

  const executeAdminAction = async (
    action: string,
    data: Record<string, unknown>
  ) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/v1/admin/actions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: action,
          data,
          operatorId: operator?.id,
        }),
      });

      if (!response.ok) throw new Error("Erro na execução da ação");

      const result = await response.json();
      toast.success("Ação executada com sucesso!");
      setSelectedModal(null);

      // Reset dos dados dos formulários
      setMassUpdateData({ priority: "", processIds: [] });
      setNotificationData({
        title: "",
        message: "",
        type: "INFO",
        targetOperators: [],
      });

      // Atualizar lista de operadores
      await fetchOperators();

      if (onAction) {
        onAction(action, result);
      }
    } catch (error) {
      console.error("Erro ao executar ação administrativa:", error);
      toast.error("Erro ao executar ação administrativa");
    } finally {
      setIsLoading(false);
    }
  };

  const executeReassignment = async (data: {
    fromOperatorId: string;
    toOperatorId: string;
    processIds: string[];
  }) => {
    const response = await fetch("/api/v1/admin/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "REASSIGN_PROCESSES",
        data: data,
        operatorId: operator?.id,
      }),
    });

    if (!response.ok) {
      throw new Error("Erro ao reatribuir processos");
    }

    const result = await response.json();

    // Atualizar lista de operadores
    await fetchOperators();

    if (onAction) {
      onAction("REASSIGN_PROCESSES", result);
    }
  };

  const actionCards = [
    {
      id: "priority",
      title: "Atualização de Prioridade",
      description: "Altere a prioridade de múltiplos processos",
      icon: AlertTriangle,
      color: "orange",
      bgColor: "bg-orange-50",
      iconColor: "text-orange-600",
      borderColor: "border-orange-200",
      hoverBorder: "hover:border-orange-300",
      buttonColor: "bg-orange-600 hover:bg-orange-700",
    },
    {
      id: "notification",
      title: "Notificação em Massa",
      description: "Envie notificações para operadores",
      icon: MessageSquare,
      color: "blue",
      bgColor: "bg-blue-50",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      hoverBorder: "hover:border-blue-300",
      buttonColor: "bg-blue-600 hover:bg-blue-700",
    },
    {
      id: "emergency",
      title: "Escalação de Emergência",
      description: "Ative protocolo de emergência",
      icon: Shield,
      color: "red",
      bgColor: "bg-red-50",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      hoverBorder: "hover:border-red-300",
      buttonColor: "bg-red-600 hover:bg-red-700",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200">
          Centro de Ações Administrativas
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Execute ações administrativas avançadas com um clique
        </p>
      </div>

      {/* Grid de Ações */}
      <div className="space-y-6">
        {/* Grid de Ações */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Reatribuir Operadores - Atualizado */}
          <Card className="group hover:shadow-lg transition-all duration-300 border-purple-200 hover:border-purple-300">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-100 text-purple-600 group-hover:bg-purple-200 transition-colors">
                  <ArrowRightLeft className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg text-purple-800">
                    Reatribuir Processos
                  </CardTitle>
                  <CardDescription>
                    Transfira processos entre operadores facilmente
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="bg-purple-50 rounded-lg p-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="font-medium text-purple-800">
                        {operators.length}
                      </span>
                      <p className="text-purple-600">Operadores</p>
                    </div>
                    <div>
                      <span className="font-medium text-purple-800">
                        {operators.reduce(
                          (sum, op) => sum + op.processCount,
                          0
                        )}
                      </span>
                      <p className="text-purple-600">Processos Total</p>
                    </div>
                  </div>
                </div>
                <Button
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => setShowReassignModal(true)}
                  disabled={isLoading || operators.length < 2}
                >
                  <ArrowRightLeft className="h-4 w-4 mr-2" />
                  Reatribuir Processos
                </Button>
              </div>
            </CardContent>
          </Card>

          {actionCards.map((card) => (
            <Card
              key={card.id}
              className={`group hover:shadow-lg transition-all duration-300 ${card.borderColor} ${card.hoverBorder}`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${card.bgColor} ${card.iconColor} group-hover:bg-opacity-80 transition-colors`}
                  >
                    <card.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className={`text-lg text-${card.color}-800`}>
                      {card.title}
                    </CardTitle>
                    <CardDescription>{card.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button
                  className={`w-full ${card.buttonColor} text-white`}
                  onClick={() => setSelectedModal(card.id)}
                  disabled={isLoading}
                >
                  <card.icon className="h-4 w-4 mr-2" />
                  Executar Ação
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Estatísticas dos Operadores */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Status dos Operadores
            </CardTitle>
            <CardDescription>
              Visão geral do sistema e distribuição de carga
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loadingOperators ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-500">
                  Carregando operadores...
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {operators.map((op) => (
                  <div
                    key={op.id}
                    className="border rounded-lg p-4 bg-gradient-to-br from-gray-50 to-white hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-800 truncate">
                        {op.name}
                      </h4>
                      <Badge
                        variant={
                          op.status === "ACTIVE" ? "default" : "secondary"
                        }
                        className="text-xs"
                      >
                        {op.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Processos:</span>
                        <span className="font-medium">{op.processCount}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Papel:</span>
                        <span className="font-medium">{op.role}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Reatribuição Melhorado */}
      <ReassignmentModal
        isOpen={showReassignModal}
        onClose={() => setShowReassignModal(false)}
        operators={operators}
        onReassign={executeReassignment}
      />

      {/* Modal de Prioridade em Massa */}
      <Dialog
        open={selectedModal === "priority"}
        onOpenChange={() => setSelectedModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Atualização de Prioridade em Massa
            </DialogTitle>
            <DialogDescription>
              Altere a prioridade de múltiplos processos simultaneamente
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="priority">Nova Prioridade</Label>
              <Select
                value={massUpdateData.priority}
                onValueChange={(value) =>
                  setMassUpdateData({ ...massUpdateData, priority: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar prioridade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="HIGH">Alta</SelectItem>
                  <SelectItem value="MEDIUM">Média</SelectItem>
                  <SelectItem value="LOW">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="process-ids">IDs dos Processos</Label>
              <Textarea
                id="process-ids"
                placeholder="Cole os IDs dos processos separados por vírgula"
                className="min-h-[80px]"
                value={massUpdateData.processIds.join(", ")}
                onChange={(e) =>
                  setMassUpdateData({
                    ...massUpdateData,
                    processIds: e.target.value
                      .split(",")
                      .map((id) => id.trim())
                      .filter(Boolean),
                  })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                executeAdminAction("mass_priority_update", massUpdateData)
              }
              disabled={
                isLoading ||
                !massUpdateData.priority ||
                massUpdateData.processIds.length === 0
              }
            >
              {isLoading ? "Executando..." : "Atualizar Prioridade"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Notificação em Massa */}
      <Dialog
        open={selectedModal === "notification"}
        onOpenChange={() => setSelectedModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Notificação em Massa
            </DialogTitle>
            <DialogDescription>
              Envie notificações importantes para operadores selecionados
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="notification-title">Título</Label>
              <Input
                id="notification-title"
                placeholder="Título da notificação"
                value={notificationData.title}
                onChange={(e) =>
                  setNotificationData({
                    ...notificationData,
                    title: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="notification-message">Mensagem</Label>
              <Textarea
                id="notification-message"
                placeholder="Conteúdo da notificação"
                className="min-h-[80px]"
                value={notificationData.message}
                onChange={(e) =>
                  setNotificationData({
                    ...notificationData,
                    message: e.target.value,
                  })
                }
              />
            </div>
            <div>
              <Label htmlFor="notification-type">Tipo</Label>
              <Select
                value={notificationData.type}
                onValueChange={(value: NotificationType) =>
                  setNotificationData({ ...notificationData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INFO">Informação</SelectItem>
                  <SelectItem value="WARNING">Aviso</SelectItem>
                  <SelectItem value="ALERT">Alerta</SelectItem>
                  <SelectItem value="SUCCESS">Sucesso</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedModal(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                executeAdminAction("mass_notification", {
                  ...notificationData,
                  targetOperators: operators.map((op) => op.id),
                })
              }
              disabled={
                isLoading ||
                !notificationData.title ||
                !notificationData.message
              }
            >
              {isLoading ? "Enviando..." : "Enviar Notificação"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Emergência */}
      <Dialog
        open={selectedModal === "emergency"}
        onOpenChange={() => setSelectedModal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-600" />
              Escalação de Emergência
            </DialogTitle>
            <DialogDescription>
              Ative protocolo de emergência no sistema
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <span className="font-medium text-red-800">
                  Aviso Importante
                </span>
              </div>
              <p className="text-red-700 text-sm">
                Esta ação irá ativar o protocolo de emergência, notificando
                todos os operadores e priorizando processos críticos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedModal(null)}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => executeAdminAction("emergency_protocol", {})}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Ativando...
                </>
              ) : (
                <>
                  <Shield className="h-4 w-4 mr-2" />
                  Ativar Emergência
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
