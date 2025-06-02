import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Button } from "../ui/button";
import {
  UserPlus,
  UserCheck,
  Clock,
  Flag,
  MessageSquare,
  FileText,
  MoreHorizontal,
  Star,
  AlertCircle,
  Files,
} from "lucide-react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  ReminderModal,
  NoteModal,
  ContactModal,
  IssueModal,
} from "@/components/modals/OperatorActionModals";
import { hasPermission } from "@/lib/utils";

interface Process {
  id: string;
  priority: string;
  status: string;
  operator?: {
    id: string;
    name: string;
  };
}

export const AssignToMeButton = ({
  processId,
  onAssignSuccess,
}: {
  processId: string;
  onAssignSuccess?: () => void;
}) => {
  const { operator } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleAssign = async () => {
    if (!operator?.id) return;
    setIsLoading(true);

    try {
      await toast.promise(
        async () => {
          const response = await fetch(
            `/api/v1/processes/${processId}/assign`,
            {
              method: "PATCH",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ operatorId: operator.id }),
            }
          );

          if (response.ok) {
            onAssignSuccess?.();
          }
        },
        {
          loading: "Atribuindo processo...",
          success: "Processo atribuído com sucesso!",
          error: "Erro ao atribuir processo",
        }
      );
    } catch (error) {
      console.error("Erro ao atribuir processo:", error);
      toast.error("Erro ao atribuir processo", {
        description: "Não foi possível atribuir o processo.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={(e) => {
        e.stopPropagation();
        handleAssign();
      }}
      disabled={isLoading}
      className="gap-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200 hover:border-emerald-300 transition-all duration-200"
    >
      <UserPlus className="h-4 w-4" />
      {isLoading ? "Atribuindo..." : "Atribuir a mim"}
    </Button>
  );
};

// Novo componente com mais opções para operadores
export const OperatorActionsButton = ({
  process,
  onAction,
}: {
  process: Process;
  onAction?: (action: string) => void;
}) => {
  const { operator } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  
  // Verificação de permissões específicas usando função utilitária
  const canChangePriority = hasPermission(operator, "CHANGE_PRIORITY");
  const canDuplicateProcess = hasPermission(operator, "DUPLICATE_PROCESS");

  // Estados dos modais
  const [reminderModalOpen, setReminderModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [issueModalOpen, setIssueModalOpen] = useState(false);

  const executeAction = async (action: string, data?: any) => {
    if (!operator?.id) {
      toast.error("Operador não identificado");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/v1/processes/${process.id}/actions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action,
          data,
          operatorId: operator.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao executar ação");
      }

      // Feedback específico por ação
      const actionMessages = {
        priority: "Prioridade alterada com sucesso!",
        reminder: "Lembrete criado com sucesso!",
        note: "Anotação adicionada com sucesso!",
        contact: "Contato registrado com sucesso!",
        favorite: "Processo favoritado com sucesso!",
        duplicate: `Novo processo ${result.newProcess?.id.slice(-8)} criado!`,
        issue: "Problema reportado com sucesso!",
      };

      toast.success(
        actionMessages[action as keyof typeof actionMessages] ||
          "Ação executada com sucesso!"
      );

      // Callback para atualizar a lista de processos
      onAction?.(action);

      // Feedback adicional para algumas ações
      if (action === "contact" && result.contactInfo) {
        if (result.contactInfo.phone) {
          setTimeout(() => {
            toast.info("WhatsApp", {
              description: `Número: ${result.contactInfo.phone}`,
              action: {
                label: "Abrir WhatsApp",
                onClick: () =>
                  window.open(
                    `https://wa.me/${result.contactInfo.phone.replace(
                      /\D/g,
                      ""
                    )}`,
                    "_blank"
                  ),
              },
            });
          }, 1000);
        }
      }

      if (action === "duplicate" && result.newProcess) {
        setTimeout(() => {
          toast.info("Processo Duplicado", {
            description: `ID: ${result.newProcess.id.slice(-8)}`,
            action: {
              label: "Ver Processo",
              onClick: () =>
                window.open(
                  `/operador/process/${result.newProcess.id}`,
                  "_blank"
                ),
            },
          });
        }, 1000);
      }
    } catch (error) {
      console.error("Erro ao executar ação:", error);
      toast.error("Erro ao executar ação", {
        description: error instanceof Error ? error.message : "Tente novamente",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePriorityAction = () => {
    // Verificação adicional de permissão
    if (!canChangePriority) {
      toast.error("Acesso negado", {
        description:
          "Apenas administradores podem alterar a prioridade de processos.",
      });
      return;
    }

    const newPriority = process.priority === "HIGH" ? "MEDIUM" : "HIGH";
    executeAction("priority", { priority: newPriority });
  };

  const handleFavoriteAction = () => {
    executeAction("favorite");
  };

  const handleDuplicateAction = () => {
    // Verificação adicional de permissão
    if (!canDuplicateProcess) {
      toast.error("Acesso negado", {
        description: "Apenas administradores podem duplicar processos.",
      });
      return;
    }

    executeAction("duplicate");
  };

  // Handlers dos modais
  const handleReminderSubmit = (data: any) => {
    executeAction("reminder", data);
    setReminderModalOpen(false);
  };

  const handleNoteSubmit = (data: any) => {
    executeAction("note", data);
    setNoteModalOpen(false);
  };

  const handleContactSubmit = (data: any) => {
    executeAction("contact", data);
    setContactModalOpen(false);
  };

  const handleIssueSubmit = (data: any) => {
    executeAction("issue", data);
    setIssueModalOpen(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isLoading}
            className="gap-2 text-gray-600 hover:text-emerald-700 hover:bg-emerald-50 border-gray-200 hover:border-emerald-300 transition-all duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal className="h-4 w-4" />
            Ações
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          onClick={(e) => e.stopPropagation()}
          className="w-56"
        >
          <DropdownMenuLabel className="text-gray-700 font-semibold">
            Ações do Operador
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          {/* Aumentar Prioridade - Apenas para ADMIN */}
          {canChangePriority && (
          <DropdownMenuItem
            onClick={handlePriorityAction}
            className="cursor-pointer hover:bg-orange-50 focus:bg-orange-50"
          >
            <Flag className="mr-2 h-4 w-4 text-orange-500" />
            <div className="flex flex-col">
              <span>
                {process.priority === "HIGH" ? "Reduzir" : "Aumentar"}{" "}
                Prioridade
              </span>
              <span className="text-xs text-gray-500">
                {process.priority === "HIGH"
                  ? "Alterar para Média"
                    : "Alterar para Alta"}{" "}
                  • Apenas Admin
              </span>
            </div>
          </DropdownMenuItem>
          )}

          <DropdownMenuItem
            onClick={() => setReminderModalOpen(true)}
            className="cursor-pointer hover:bg-blue-50 focus:bg-blue-50"
          >
            <Clock className="mr-2 h-4 w-4 text-blue-500" />
            <div className="flex flex-col">
              <span>Adicionar Lembrete</span>
              <span className="text-xs text-gray-500">Notificação futura</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setNoteModalOpen(true)}
            className="cursor-pointer hover:bg-green-50 focus:bg-green-50"
          >
            <FileText className="mr-2 h-4 w-4 text-green-500" />
            <div className="flex flex-col">
              <span>Adicionar Anotação</span>
              <span className="text-xs text-gray-500">Nota interna</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={() => setContactModalOpen(true)}
            className="cursor-pointer hover:bg-purple-50 focus:bg-purple-50"
          >
            <MessageSquare className="mr-2 h-4 w-4 text-purple-500" />
            <div className="flex flex-col">
              <span>Entrar em Contato</span>
              <span className="text-xs text-gray-500">WhatsApp/Email</span>
            </div>
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={handleFavoriteAction}
            className="cursor-pointer hover:bg-yellow-50 focus:bg-yellow-50"
          >
            <Star className="mr-2 h-4 w-4 text-yellow-500" />
            <div className="flex flex-col">
              <span>Favoritar Processo</span>
              <span className="text-xs text-gray-500">Acesso rápido</span>
            </div>
          </DropdownMenuItem>

          {/* Duplicar Processo - Apenas para ADMIN */}
          {canDuplicateProcess && (
          <DropdownMenuItem
            onClick={handleDuplicateAction}
            className="cursor-pointer hover:bg-indigo-50 focus:bg-indigo-50"
          >
            <Files className="mr-2 h-4 w-4 text-indigo-500" />
            <div className="flex flex-col">
              <span>Duplicar Processo</span>
                <span className="text-xs text-gray-500">
                  Criar similar • Apenas Admin
                </span>
            </div>
          </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => setIssueModalOpen(true)}
            className="cursor-pointer hover:bg-red-50 focus:bg-red-50"
          >
            <AlertCircle className="mr-2 h-4 w-4 text-red-500" />
            <div className="flex flex-col">
              <span>Reportar Problema</span>
              <span className="text-xs text-gray-500">Suporte técnico</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modais */}
      <ReminderModal
        isOpen={reminderModalOpen}
        onClose={() => setReminderModalOpen(false)}
        onConfirm={handleReminderSubmit}
        isLoading={isLoading}
      />

      <NoteModal
        isOpen={noteModalOpen}
        onClose={() => setNoteModalOpen(false)}
        onConfirm={handleNoteSubmit}
        isLoading={isLoading}
      />

      <ContactModal
        isOpen={contactModalOpen}
        onClose={() => setContactModalOpen(false)}
        onConfirm={handleContactSubmit}
        isLoading={isLoading}
      />

      <IssueModal
        isOpen={issueModalOpen}
        onClose={() => setIssueModalOpen(false)}
        onConfirm={handleIssueSubmit}
        isLoading={isLoading}
      />
    </>
  );
};
