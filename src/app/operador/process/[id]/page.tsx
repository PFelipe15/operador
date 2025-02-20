"use client";

import { ContextualHelp } from "@/components/knowledge/ContextualHelp";
import { AssignToMeButton } from "@/components/layout/assigmeButton";
import { TimelineEvent } from "@/components/layout/timelineEvent";
import { DocumentUploadModal } from "@/components/modals/document-upload-modal";
import { EditableField } from '@/components/process/EditableField';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { MEI_ANALYSIS_STEPS } from "@/lib/constants";
import {
  cn,
  formatCNPJ,
  formatCPF,
  formatCurrency,
  formatDate,
  formatPhone,
  formatTime,
  formatTimeAgo,
  formatTimeDifference,
  getPriorityColor,
  getProcessStatusColor,
  getStatusIcon,
  translateDocumentStatus,
  translatePriority,
  translateProcessStatus,
  translateSource,
} from "@/lib/utils";
import {
  Address,
  Client,
  Company,
  Document,
  DocumentStatus,
  Operator,
  Process,
  ProcessStatus,
  TimelineEventCategory,
  TimelineEvent as TimelineEventPrisma,
  TimelineEventType,
} from "@prisma/client";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Bell,
  Bot,
  Building2,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Eye,
  FileText,
  Flag,
  Info,
  LightbulbIcon,
  Mail,
  MapPin,
  Phone,
  PlayCircle,
  Tag,
  TrendingUp,
  Upload,
  User2,
  XCircle
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast, Toaster } from "sonner";
  
interface ProcessStats {
  successRate: number;
  avgProcessTime: number;
  totalDocuments: number;
  completedDocuments: number;
  pendingDocuments: number;
}

interface ProcessWithRelations extends Process {
  client: Client & { address: Address };
  company: Company & { address: Address };
  operator: Operator;
  documents: Document[] & { documentType: DocumentType; uploadedBy: Operator };
  timeline: TimelineEventPrisma[];
}

interface CNAEActivity {
  codigo: string;
  descricao: string;
}

type DocumentWithRelations = Document & {
  uploadedBy?: Operator | null;
  verifiedBy?: Operator | null;
  rejectionBy?: Operator | null;
  metadata?: string;
};


const ProcessApproved = ({ process }: { process: ProcessWithRelations }) => {
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl border shadow-sm p-8 space-y-8">
        {/* Cabeçalho com Ilustração */}
        <div className="flex flex-col items-center text-center space-y-4">
          <img 
            src="/figuras/completed.svg" 
            alt="Processo Aprovado" 
            className="w-48 h-48"
          />
          <div>
            <h2 className="text-2xl font-bold text-emerald-700">
              Processo Aprovado com Sucesso!
            </h2>
            <p className="text-gray-600 mt-2">
              Todas as etapas foram concluídas e o processo foi aprovado
            </p>
          </div>
        </div>

        {/* Cards de Informação */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Calendar className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-700 font-medium">Data de Aprovação</p>
                <p className="text-sm text-emerald-600">
                  {format(new Date(process.updatedAt), "dd/MM/yyyy 'às' HH:mm")}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User2 className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-700 font-medium">Aprovado por</p>
                <p className="text-sm text-emerald-600">{process.operator?.name}</p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 p-4 rounded-lg border border-emerald-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Clock className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-emerald-700 font-medium">Tempo Total</p>
                <p className="text-sm text-emerald-600">
                  {formatTimeDifference(process.createdAt, process.updatedAt)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Resumo do Processo */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium mb-4">Resumo do Processo</h3>
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Cliente</span>
                <span className="font-medium">{process.client.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Documentos Aprovados</span>
                <span className="font-medium">{process.documents.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Etapas Concluídas</span>
                <span className="font-medium">5/5</span>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">CPF</span>
                <span className="font-medium">{formatCPF(process.client.cpf)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Tipo de Processo</span>
                <span className="font-medium">{process.type}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Progresso</span>
                <span className="font-medium text-emerald-600">100% Concluído</span>
              </div>
            </div>
          </div>
        </div>

        {/* Mensagem de Sucesso */}
        <div className="flex items-start gap-4 bg-emerald-50 p-4 rounded-lg border border-emerald-100">
          <div className="p-2 bg-emerald-100 rounded-full shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <h4 className="font-medium text-emerald-700">Processo Validado e Aprovado</h4>
            <p className="text-sm text-emerald-600 mt-1">
              Todas as verificações foram concluídas com sucesso. O processo está aprovado e pronto para as próximas etapas.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}



export default function ProcessDetails() {
  const [expandedStep, setExpandedStep] = useState<number | null>(0);
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const params = useParams();
  const router = useRouter();
  const [process, setProcess] = useState<ProcessWithRelations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processStats, setProcessStats] = useState<ProcessStats | null>(null);
  const { operator } = useAuth();
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);

  // Função para carregar o estado dos checkboxes do processo
  const loadCheckedItems = useCallback(async () => {
    if (!process) return;

    try {
      // Buscar timeline do processo
      const timeline = process.timeline || [];

      // Filtrar apenas eventos de conclusão de etapa
      const stepEvents = timeline.filter(
        (event) => event.category === "STATUS" && event.type === "SUCCESS"
      );

      // Reconstruir estado dos checkboxes baseado na timeline
      const savedCheckedItems: Record<string, boolean> = {};

      stepEvents.forEach((event) => {
        try {
          const metadata = JSON.parse(event.metadata || "{}");
          if (metadata.checkedItems) {
            // Reconstruir as chaves dos checkboxes com o formato "STEP_ID-ITEM_ID"
            Object.entries(metadata.checkedItems).forEach(
              ([itemId, checked]) => {
                savedCheckedItems[`${metadata.step}-${itemId}`] = checked as boolean;
              }
            );
          }
        } catch (e) {
          console.error("Erro ao processar metadata:", e);
        }
      });

      setCheckedItems(savedCheckedItems);

      // Definir o step expandido baseado no progresso atual
      const currentStepIndex = Object.values(MEI_ANALYSIS_STEPS).findIndex(
        (step) => process.progress < step.progress
      );

      setExpandedStep(currentStepIndex === -1 ? null : currentStepIndex);
    } catch (error) {
      console.error("Erro ao carregar estado dos checkboxes:", error);
    }
  }, [process]);

  // Carregar estado dos checkboxes quando o processo for carregado
  useEffect(() => {
    if (process) {
      loadCheckedItems();
    }
  }, [process, loadCheckedItems]);

  useEffect(() => {
    fetchProcess();
  }, [params.id]);

  useEffect(() => {
    const fetchProcessStats = async () => {
      try {
        const response = await fetch(`/api/processes/${params.id}/status`);
        const stats = await response.json();
        setProcessStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchProcessStats();
  }, [params.id]);

  const canCompleteStep = (
    step?: (typeof MEI_ANALYSIS_STEPS)[keyof typeof MEI_ANALYSIS_STEPS]
  ) => {
    if (!step || !step.checkItems) return false;

    return step.checkItems
      .filter((item) => item.required)
      .every((item) => checkedItems[`${step.id}-${item.id}`]);
  };

  const handleStepComplete = async (
    step: (typeof MEI_ANALYSIS_STEPS)[keyof typeof MEI_ANALYSIS_STEPS]
  ) => {
    const semOperadorAtribuido = process?.operatorId === null;

    if (semOperadorAtribuido) {
      toast(
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-medium text-red-700 mb-1">
                Operador não atribuído
              </h3>
              <p className="text-sm text-red-600">
                Não foi possível concluir a etapa pois não há operador atribuído
                ao processo.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.dismiss()}
              className="h-8"
            >
              Fechar
            </Button>
            <AssignToMeButton
              processId={process.id}
              onAssign={() => {
                fetchProcess();
              }}
            />
          </div>
        </div>,
        {
          duration: 0, // Toast não desaparece automaticamente
          style: {
            backgroundColor: "#FEF2F2", // Vermelho bem claro
            border: "1px solid #FCA5A5", // Borda vermelha clara
            padding: "16px",
            width: "380px",
          },
        }
      );
      return;
    }

    try {
    await toast.promise(
      async () => {
        // Faz a requisição
        await fetch(`/api/processes/${params.id}/progress`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            step: step.id,
            data: {
              checkedItems: Object.entries(checkedItems)
                .filter(([key]) => key.startsWith(step.id))
                .reduce(
                  (acc, [key, value]) => ({
                    ...acc,
                    [key.split("-")[1]]: value,
                  }),
                  {}
                ),
            }
          }),
        });

        // Atualiza os dados
        await fetchProcess();
        await loadCheckedItems();

        // Verifica próximo step
        const nextStepIndex = Object.values(MEI_ANALYSIS_STEPS).findIndex(
          (s) => s.progress > step.progress
        );

        if (
          nextStepIndex !== -1 &&
          nextStepIndex < Object.values(MEI_ANALYSIS_STEPS).length
        ) {
          setExpandedStep(nextStepIndex);
        } else {
          toast.success("Processo Concluído!", {
            description: "Todas as etapas foram finalizadas com sucesso.",
          });
        }
      },
      {
        loading: 'Concluindo etapa...',
        success: 'Etapa concluída com sucesso',
        error: "Erro ao concluir etapa"
      }
    );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao concluir etapa", {
        description: (
          <div className="flex flex-col gap-2">
            <p>Não foi possível concluir a etapa no momento.</p>
            <div className="flex items-center gap-2 p-2 bg-red-50 rounded-md text-sm">
              <XCircle className="h-4 w-4 text-red-500" />
              <span>Tente novamente em alguns instantes</span>
            </div>
          </div>
        ),
        action: {
          label: "Tentar Novamente",
          onClick: () => handleStepComplete(step),
        },
      });
    }
  };

  const handleStartProcess = async () => {
    try {

      if(process?.operatorId === null){
        toast.error("Não foi possível iniciar o processo pois o processo não tem operador atribuído");
        return;
      }

      await toast.promise(
        async () => {
          await fetch(`/api/processes/${params.id}/progress`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: "START_PROCESS",
              data: {
                previousStatus: process?.status,
                newStatus: "PENDING_DATA",
              },
            }),
          });
          
          await fetchProcess();
        },
        {
          loading: 'Iniciando processo...',
          success: 'Processo iniciado com sucesso',
          error: 'Erro ao iniciar processo'
        }
      );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Não foi possível iniciar o processo");
    }
  };

  const fetchProcess = async () => {
    try {
      const response = await fetch(`/api/processes/${params.id}`);
      if (!response.ok) {
        throw new Error("Processo não encontrado");
      }

      const data: ProcessWithRelations = await response.json();

      console.log(data);
      setProcess(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erro ao carregar processo"
      );
      console.error("Erro ao carregar processo:", err);
    } finally {
      setLoading(false);
    }
  };

 

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500" />
      </div>
    );
  }

  if (error || !process) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <div className="text-red-500 font-medium">
          {error || "Processo não encontrado"}
        </div>
        <Button variant="outline" onClick={() => router.push("/process")}>
          Voltar para lista de processos
        </Button>
      </div>
    );
  }

  const handleVerifyDocumentAndUpdateStatus = async (
    documentId: string,
    status: DocumentStatus
  ) => {
    const operatorId = operator?.id;
    try {
      await toast.promise(
        async () => {
          await fetch(
            `/api/processes/${process.id}/documents/${documentId}`,
            {
              method: "PUT",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                verified: true,
                status: status,
                rejectionReason: status === "REJECTED" ? rejectionReason : null,
                operatorId: operatorId,
                timelineEvent: {
                  title: "Documento Verificado",
                  description: "Documento foi verificado e validado",
                  type: "SUCCESS" as TimelineEventType,
                  category: "DOCUMENT" as TimelineEventCategory,
                  source: "MANUAL",
                  operatorId: operatorId,
                  operatorProcessId: process.operator?.id,
                  metadata: JSON.stringify({
                    documentId,
                    documentType: process.documents.find(
                      (d: Document) => d.id === documentId
                    )?.name,
                  }),
                },
              }),
            }
          );

          setRejectionReason(null);
          await fetchProcess();
        },
        {
          loading: 'Verificando documento...',
          success: 'Documento verificado com sucesso',
          error: 'Erro ao verificar documento'
        }
      );
    } catch (error) {
      console.error("Erro ao verificar documento:", error);
      toast.error("Erro ao verificar documento", {
        description: "Não foi possível verificar o documento.",
      });
    }
  };

  const handleUpdateClientField = async (field: string, value: string) => {
    try {

      if(process.operatorId === null){
        toast.error("Não foi possível atualizar o campo pois o processo não tem operador atribuído");
        return;
      }

      await toast.promise(
        async () => {
          const response = await fetch(`/api/processes/${process.id}/client`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              field,
              value
            })
          });

          if (!response.ok) throw new Error('Erro ao atualizar informação');
          await fetchProcess();
        },
        {
          loading: 'Atualizando informação...',
          success: 'Informação atualizada com sucesso',
          error: 'Erro ao atualizar informação'
        }
      );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar informação");
    }
  };

  const handleUpdateCompanyField = async (field: string, value: string) => {

    if(process.operatorId === null){
      toast.error("Não foi possível atualizar o campo pois o processo não tem operador atribuído");
      return;
    }

    try {
      await toast.promise(
        async () => {
          const response = await fetch(`/api/processes/${process.id}/company`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              field,
              value
            })
          });

          if (!response.ok) throw new Error('Erro ao atualizar informação');
          await fetchProcess();
        },
        {
          loading: 'Atualizando informação...',
          success: 'Informação atualizada com sucesso',
          error: 'Erro ao atualizar informação'
        }
      );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao atualizar informação");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 via-background to-background dark:from-primary/10 dark:via-background/50 dark:to-background/90">
      {/* Header com melhor contraste no dark mode */}
      <div className="border-b  bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm sticky top-0 z-10 dark:border-gray-800">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="h-9 w-9 p-0 hover:bg-primary/10"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            <div className="flex-1">
              <div className="flex items-center gap-3">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold tracking-tight">
                      Processo #{process.id.slice(-8)}
                    </h1>
                    <div className="flex items-center gap-1">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-sm px-3 py-1 transition-all",
                          getProcessStatusColor(process.status)
                        )}
                      >
                        <div className="flex items-center gap-1.5">
                          {getStatusIcon(process.status)}
                          {translateProcessStatus(
                            process.status as ProcessStatus
                          )}
                        </div>
                      </Badge>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-sm px-3 py-1",
                          getPriorityColor(process.priority)
                        )}
                      >
                        <Flag className="h-3.5 w-3.5 mr-1" />
                        {translatePriority(process.priority)}
                      </Badge>
                      <Badge variant="secondary" className="gap-1">
                        <User2 className="h-3.5 w-3.5" />
                        {process.operator?.name || "Não atribuído"}
                      </Badge>
 
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-4 w-4" />
                      Criado em {formatDate(process.createdAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4" />
                      Última atualização:{" "}
                      {formatDate(process.lastInteractionAt)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bot className="h-4 w-4" />
                      Via {translateSource(process.source)}
                    </div>
                  </div>
                </div>
              </div>
            </div>


            {/* Ações rápidas melhoradas */}
            <div className="flex items-center gap-2">
            <ContextualHelp />

            {process.operatorId ? (
              <div className="flex items-center justify- gap-2">
                <DocumentUploadModal
                  processId={process.id}
                  onUploadSuccess={() => {
                    fetchProcess();
                  }}
                  operatorProcessId={process.operator?.id}
                />
                <Button variant="outline" className="gap-2">
                  <Mail className="h-4 w-4" />
                  Enviar Email
                </Button>

 
              </div>

            ) : (
              
                <AssignToMeButton
                  processId={process.id}
                  onAssign={() => {
                    fetchProcess();
                  }}
                />
             
            )}
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            {process.client.preferredContact && (
              <Badge variant="outline" className="gap-1">
                {process.client.preferredContact === "email" ? (
                  <Mail className="h-3.5 w-3.5" />
                ) : (
                  <Phone className="h-3.5 w-3.5" />
                )}
                Contato preferido: {process.client.preferredContact}
              </Badge>
            )}
            {process.client.notifications && (
              <Badge variant="outline" className="gap-1 bg-emerald-50">
                <Bell className="h-3.5 w-3.5" />
                Notificações ativas
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Cards de Status com cores adaptativas */}
      <div className="container mx-auto px-6 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-lg border-l-4 border-l-primary dark:border-l-primary/70">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                {getStatusIcon(process.status)}
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    Status Atual
                  </p>
                  <p className="text-lg font-semibold mt-1">
                    {translateProcessStatus(process.status as ProcessStatus)}
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400 mt-1">
                    Atualizado {formatDate(process.lastInteractionAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-lg border-l-4 border-l-blue-500 dark:border-l-blue-400">
            <CardContent className="p-6">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                  Progresso
                </p>
                <Progress
                  value={process.progress}
                   className="h-2 bg-emerald-400 dark:bg-emerald-700"
                />
                <div className="flex justify-between items-center">
                  <p className="text-lg font-semibold dark:text-gray-200">
                    {process.progress}%
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Meta: 100%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-lg border-l-4 border-l-amber-500 dark:border-l-amber-400">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-amber-100 dark:bg-amber-900/50 p-2 rounded-full">
                  <FileText className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    Documentos Verificados
                  </p>
                  <div className="flex items-end gap-1">
                    <p className="text-lg font-semibold dark:text-gray-200">
                      {
                        process.documents.filter((d:Document) => d.status === "VERIFIED")
                          .length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground dark:text-gray-400 mb-0.5">
                      /{process.documents.length} Verificados
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-lg border-l-4 border-l-purple-500 dark:border-l-purple-400">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="bg-purple-100 dark:bg-purple-900/50 p-2 rounded-full">
                  <Activity className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                    Atividade
                  </p>
                  <p className="text-lg font-semibold dark:text-gray-200">
                    {process.timeline.length} eventos
                  </p>
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    Última há {formatTimeAgo(process.lastInteractionAt)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {processStats && (
            <>
              <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200 hover:shadow-lg border-l-4 border-l-emerald-500 dark:border-l-emerald-400">
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2 rounded-full">
                      <TrendingUp className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                        Taxa de Sucesso
                      </p>
                      <p className="text-lg font-semibold dark:text-gray-200">
                        {processStats.successRate.toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground dark:text-gray-400">
                        Tempo médio: {formatTime(processStats.avgProcessTime)}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Tabs com melhor visibilidade no dark mode */}
        <div className="mt-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm p-1 rounded-lg border dark:border-gray-800">
              <TabsTrigger
                value="overview"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground dark:data-[state=active]:bg-primary/80 transition-all duration-200"
              >
                <User2 className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="documents">
                <FileText className="h-4 w-4 mr-2" />
                Documentos
              </TabsTrigger>

              <TabsTrigger value="analysis">
                <AlertTriangle className="h-4 w-4 mr-2" />
                Análise
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className="h-4 w-4 mr-2" />
                Linha do Tempo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Cards de informação com cores adaptativas */}
                <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                      <User2 className="h-5 w-5 text-primary dark:text-primary/80" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        label="Nome"
                        value={process.client.name}
                        onSave={(value) => handleUpdateClientField('name', value)}
                      />
                      <EditableField
                        label="CPF"
                        value={formatCPF(process.client.cpf)}
                        onSave={(value) => handleUpdateClientField('cpf', value.replace(/\D/g, ''))}
                        mask={formatCPF}
                      />
                    </div>

                    <Separator className="dark:bg-gray-800" />

                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        label="Email"
                        value={process.client.email}
                        onSave={(value) => handleUpdateClientField('email', value)}
                        type="email"
                      />
                      <EditableField
                        label="Telefone"
                        value={formatPhone(process.client.phone)}
                        onSave={(value) => handleUpdateClientField('phone', value.replace(/\D/g, ''))}
                        mask={formatPhone}
                      />
                    </div>

                    {process.client.birthDate && (
                      <>
                        <Separator />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                              Data de Nascimento
                            </p>
                          </div>
                          <p className="text-base dark:text-gray-200">
                            {formatDate(process.client.birthDate)}
                          </p>
                        </div>
                      </>
                    )}

                    {process.client.rg && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                          RG
                        </p>
                        <p className="text-base dark:text-gray-200">
                          {process.client.rg}
                        </p>
                      </div>
                    )}

                    {process.client.motherName && (
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                          Nome da Mãe
                        </p>
                        <p className="text-base dark:text-gray-200">
                          {process.client.motherName}
                        </p>
                      </div>
                    )}

                    {process.client.address && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground dark:text-gray-400" />
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                              Endereço
                            </p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-base dark:text-gray-200">
                              {process.client.address.street},{" "}
                              {process.client.address.number}
                              {process.client.address.complement &&
                                ` - ${process.client.address.complement}`}
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                              {process.client.address.district},{" "}
                              {process.client.address.city} -{" "}
                              {process.client.address.state}
                            </p>
                            <p className="text-sm text-muted-foreground dark:text-gray-400">
                              CEP: {process.client.address.cep}
                            </p>
                          </div>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Card da empresa com cores adaptativas */}
                <Card className="bg-white/70 dark:bg-gray-900/50 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-900 transition-all duration-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 dark:text-gray-200">
                      <Building2 className="h-5 w-5 text-primary dark:text-primary/80" />
                      Informações da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <EditableField
                        label="Razão Social"
                        value={process.company?.name}
                        onSave={(value) => handleUpdateCompanyField('name', value)}
                      />
                      <EditableField
                        label="CNPJ"
                        value={formatCNPJ(process.company?.cnpj || '')}
                        onSave={(value) => handleUpdateCompanyField('cnpj', value.replace(/\D/g, ''))}
                        mask={formatCNPJ}
                      />
                    </div>
                    <Separator />
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-4 w-4 text-primary dark:text-primary/80" />
                        <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                          Atividade Principal
                        </p>
                      </div>
                      <EditableField
                        label="Atividade Principal"
                        value={process.company?.principalActivity || ''}
                        onSave={(value) => handleUpdateCompanyField('principalActivity', value)}
                        className="bg-primary/5 p-3 rounded-lg dark:bg-primary/10"
                      />
                    </div>
                    {process.company?.activities && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <Tag className="h-4 w-4 text-primary dark:text-primary/80" />
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                              Atividades Secundárias
                            </p>
                          </div>
                          <div className="space-y-2">
                            {JSON.parse(process.company.activities).map(
                              (activity: CNAEActivity, index: number) => (
                                <p
                                  key={index}
                                  className="text-sm bg-secondary/5 p-2 rounded-lg dark:bg-secondary/10"
                                >
                                  {activity.codigo} - {activity.descricao}
                                </p>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}
                    <Separator />
                    <div>
                      <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                        Capital Social
                      </p>
                      <EditableField
                        label="Capital Social"
                        value={formatCurrency(process.company?.capitalSocial || '')}
                        onSave={(value) => handleUpdateCompanyField('capitalSocial', value.replace(/\D/g, ''))}
                        mask={formatCurrency}
                      />
                    </div>
                    {process.company?.address && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <MapPin className="h-4 w-4 text-primary dark:text-primary/80" />
                            <p className="text-sm font-medium text-muted-foreground dark:text-gray-400">
                              Endereço
                            </p>
                          </div>
                          <p className="text-base dark:text-gray-200">
                            {process.company.address.street},{" "}
                            {process.company.address.number}
                            {process.company.address.complement &&
                              `, ${process.company.address.complement}`}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400 mt-1">
                            {process.company.address.district},{" "}
                            {process.company.address.city} -{" "}
                            {process.company.address.state}
                          </p>
                          <p className="text-sm text-muted-foreground dark:text-gray-400">
                            CEP: {process.company.address.cep}
                          </p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="documents">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">
                      Documentos do Processo
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {process.documents.length} documentos •{" "}
                      {
                        process.documents.filter((d) => d.status === "SENT")
                          .length
                      }{" "}
                      enviados •{" "}
                      {
                        process.documents.filter((d) => d.status === "VERIFIED")
                          .length
                      }{" "}
                      verificados
                    </p>
                  </div>
                  <DocumentUploadModal
                    processId={process.id}
                    onUploadSuccess={fetchProcess}
                    operatorProcessId={process.operator?.id}
                  />
                </div>

                <div className="grid gap-4">
                  {process.documents.map((doc: DocumentWithRelations) => (
                    <div
                      key={doc.id}
                      className={cn(
                        "p-4 rounded-lg border transition-all",
                        doc.status === "VERIFIED" &&
                          "bg-emerald-50/50 dark:bg-emerald-950/20",
                        doc.status === "REJECTED" &&
                          "bg-red-50/50 dark:bg-red-950/20",
                        doc.status === "SENT" &&
                          "bg-blue-50/50 dark:bg-blue-950/20"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4">
                          <div
                            className={cn(
                              "p-2 rounded-lg",
                              doc.status === "VERIFIED"
                                ? "bg-emerald-100 text-emerald-700"
                                : doc.status === "REJECTED"
                                ? "bg-red-100 text-red-700"
                                : "bg-blue-100 text-blue-700"
                            )}
                          >
                            <FileText className="h-5 w-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{doc.name}</h4>
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs",
                                  doc.source === "MANUAL"
                                    ? "border-purple-500 text-purple-700"
                                    : doc.source === "BOT"
                                    ? "border-orange-500 text-orange-700"
                                    : "border-blue-500 text-blue-700"
                                )}
                              >
                                {doc.source === "MANUAL" ? (
                                  <div className="flex items-center gap-1">
                                    <User2 className="h-3 w-3" />
                                    Manual
                                  </div>
                                ) : doc.source === "BOT" ? (
                                  <div className="flex items-center gap-1">
                                    <Bot className="h-3 w-3" />
                                    Bot
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1">
                                    <Upload className="h-3 w-3" />
                                    Plataforma
                                  </div>
                                )}
                              </Badge>
                            </div>

                            <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                              {/* Informações de quem enviou */}
                              <div className="flex items-center gap-2">
                                <User2 className="h-4 w-4" />
                                {doc.source === "MANUAL" ? (
                                  <span>
                                    Enviado por {doc?.uploadedBy?.name}
                                  </span>
                                ) : doc.source === "BOT" ? (
                                  <span>Enviado pelo Bot</span>
                                ) : (
                                  <span>Enviado pela Plataforma</span>
                                )}
                                <span>•</span>
                                <Calendar className="h-4 w-4" />
                                <span>{formatDate(doc.createdAt)}</span>
                              </div>

                              {/* Informações de quem verificou */}
                              {doc.verifiedBy && doc.verified && (
                                <div className="flex items-center gap-2 text-emerald-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span>
                                    Verificado por {doc.verifiedBy.name}  
                                  </span>
                                </div>
                              )}

                              {/* Informações de quem rejeitou */}
                              {doc.status === "REJECTED" && doc.rejectionBy && (
                                <div className="flex items-center gap-2 text-red-600">
                                  <XCircle className="h-4 w-4" />
                                  <span>
                                    Rejeitado por {doc.rejectionBy?.name}
                                  </span>
                                </div>
                              )}
                            </div>

                            {doc.status === "REJECTED" &&
                              doc.rejectionReason && (
                                <div className="flex items-center gap-2 text-sm text-red-600 mt-2 bg-red-50 p-2 rounded">
                                  <AlertTriangle className="h-4 w-4" />
                                  <span>
                                    Motivo da rejeição: {doc.rejectionReason}
                                  </span>
                                </div>
                              )}

                            {doc.metadata && (
                              <div className="mt-2 text-sm">
                                <p className="text-muted-foreground">
                                  Informações adicionais:
                                </p>
                                <div className="grid grid-cols-2 gap-2 mt-1">
                                  <div>
                                    Tamanho: {JSON.parse(doc.metadata || "{}").fileSize}
                                  </div>
                                  <div>
                                    Tipo: {JSON.parse(doc.metadata).fileType}
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-2"
                            onClick={() => {
                              /* Lógica para visualizar */
                            }}
                          >
                            <Eye className="h-4 w-4" />
                            Visualizar
                          </Button>

                          {doc.status !== "VERIFIED" && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant={
                                    doc.status === "REJECTED"
                                      ? "destructive"
                                      : "outline"
                                  }
                                  size="sm"
                                  className="gap-2"
                                >
                                  <CheckCircle2 className="h-4 w-4" />
                                  Verificar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>
                                    Verificar Documento
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Deseja aprovar ou rejeitar este documento?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>

                                <div className="space-y-4 py-4">
                                  <div className="space-y-2">
                                    <Label>Motivo da Rejeição (opcional)</Label>
                                    <Input
                                      placeholder="Descreva o motivo da rejeição"
                                      onChange={(e) =>
                                        setRejectionReason(e.target.value)
                                      }
                                    />
                                  </div>
                                </div>

                                <AlertDialogFooter>
                                  <AlertDialogCancel>
                                    Cancelar
                                  </AlertDialogCancel>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      handleVerifyDocumentAndUpdateStatus(
                                        doc.id,
                                        "REJECTED"
                                      )
                                    }
                                  >
                                    Rejeitar
                                  </Button>
                                  <Button
                                    variant="default"
                                    onClick={() =>
                                      handleVerifyDocumentAndUpdateStatus(
                                        doc.id,
                                        "VERIFIED"
                                      )
                                    }
                                  >
                                    Aprovar
                                  </Button>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>

                      {/* Barra de Progresso e Status */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="text-muted-foreground">
                            Status do Documento
                          </span>
                          <Badge
                            variant="outline"
                            className={cn(
                              doc.status === "VERIFIED"
                                ? "border-emerald-500 text-emerald-700"
                                : doc.status === "REJECTED"
                                ? "border-red-500 text-red-700"
                                : "border-blue-500 text-blue-700"
                            )}
                          >
                            {translateDocumentStatus(doc.status)}
                          </Badge>
                        </div>
                        <Progress
                          value={
                            doc.status === "VERIFIED"
                              ? 100
                              : doc.status === "SENT"
                              ? 50
                              : 0
                          }
                          className="h-2"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="timeline">
              <Card className="bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico do Processo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative space-y-4">
                    {process.timeline.map((event) => (
                      <TimelineEvent key={event.id} event={event} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analysis">
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Análise do Processo</h3>
                  <span className="text-sm text-muted-foreground">
                    Faltam {100 - process.progress}% para conclusão
                  </span>
                </div>

                {process.status === "CREATED" ? (
                  <Card className="bg-white/50 backdrop-blur-sm border-none shadow-lg">
                    <CardHeader className="text-center pb-2">
                      <CardTitle className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                        Iniciar Processo
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-400">
                        Vamos começar a análise do processo do seu cliente
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-8">
                      {/* Cards de Informação */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-800 rounded-lg">
                              <ClipboardCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                              <p className="font-medium text-emerald-900 dark:text-emerald-100">
                                Checklist
                              </p>
                              <p className="text-sm text-emerald-600 dark:text-emerald-400">
                                Guia passo a passo
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-lg">
                              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                              <p className="font-medium text-blue-900 dark:text-blue-100">
                                Documentos
                              </p>
                              <p className="text-sm text-blue-600 dark:text-blue-400">
                                Gestão simplificada
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg">
                              <Clock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                              <p className="font-medium text-purple-900 dark:text-purple-100">
                                Timeline
                              </p>
                              <p className="text-sm text-purple-600 dark:text-purple-400">
                                Acompanhamento em tempo real
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Seção de Destaque */}
                      <div className="relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-2xl" />
                        <div className="relative p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800">
                          <div className="grid md:grid-cols-2 gap-6 items-center">
                            <div className="space-y-4">
                              <h3 className="text-lg font-semibold text-emerald-900 dark:text-emerald-100">
                                Pronto para começar?
                              </h3>
                              <p className="text-gray-600 dark:text-gray-400">
                                Ao iniciar o processo, você terá acesso a todas
                                as ferramentas necessárias para uma análise
                                completa e eficiente.
                              </p>
                              <Button
                                onClick={handleStartProcess}
                                className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                              >
                                <PlayCircle className="h-5 w-5 mr-2" />
                                Iniciar Processo
                              </Button>
                            </div>

                            <div className="hidden md:block">
                              <img
                                src="/figuras/suporte.svg"
                                alt="Iniciar Processo"
                                className="w-full max-w-[300px] mx-auto"
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Lista de Benefícios */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              Análise Automatizada
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Sistema inteligente para validação de documentos
                            </p>
                          </div>
                        </div>

                        <div className="flex items-start gap-3">
                          <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40">
                            <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              Acompanhamento em Tempo Real
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Monitore cada etapa do processo
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {/* Barra de Steps Horizontal */}
                    <div className="relative mb-8">
                      {/* Linha de Progresso Base */}
                      <div className="absolute top-[35px] left-0 right-0 h-[2px] bg-gray-200" />

                      {/* Linha de Progresso Ativa */}
                      <div
                        className="absolute top-[35px] left-0 h-[2px] bg-emerald-500 transition-all duration-300"
                        style={{ width: `${process.progress}%` }}
                      />

                      {/* Steps */}
                      <div className="relative flex justify-between">
                        {Object.values(MEI_ANALYSIS_STEPS).map(
                          (step, index) => {
                            const StepIcon = step.icon;
                            const isCompleted =
                              process.progress >= step.progress;
                            const isCurrent =
                              process.progress < step.progress &&
                              (index === 0 ||
                                process.progress >=
                                  Object.values(MEI_ANALYSIS_STEPS)[index - 1]
                                    .progress);
                            const isLocked = !isCompleted && !isCurrent;

                            return (
                              <div
                                key={step.id}
                                className="flex flex-col items-center"
                                onClick={() => {
                                  if (!isLocked) {
                                    setExpandedStep(
                                      expandedStep === index ? null : index
                                    );
                                  }
                                }}
                              >
                                {/* Etapa Label */}
                                {isCurrent && (
                                  <div className="mb-2 px-3 py-1 bg-emerald-500 text-white text-xs rounded-full">
                                    Atual
                                  </div>
                                )}

                                {/* Círculo do Step */}
                                <div
                                  className={cn(
                                    "w-[70px] h-[70px] rounded-full flex items-center justify-center cursor-pointer transition-all duration-200",
                                    isCompleted && "bg-emerald-500 text-white",
                                    isCurrent &&
                                      "bg-emerald-500 text-white ring-4 ring-emerald-100",
                                    isLocked && "bg-gray-100 text-gray-400",
                                    !isLocked && "hover:scale-105"
                                  )}
                                >
                                  <StepIcon className="h-6 w-6" />
                                </div>

                                {/* Título e Progresso */}
                                <div
                                  className={cn(
                                    "mt-3 text-center",
                                    isCompleted || isCurrent
                                      ? "text-emerald-700"
                                      : "text-gray-500"
                                  )}
                                >
                                  <p className="text-sm font-medium whitespace-nowrap">
                                    {step.title}
                                  </p>
                                  <p className="text-xs mt-1">
                                    {step.progress}%
                                  </p>
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>

                    {process.status === ProcessStatus.APPROVED ? (
                      <>
                        <ProcessApproved process={process} />
                      </>
                    ) : (
                      <>
                        {/* Área de Conteúdo */}
                        <div className="grid grid-cols-3 gap-6">
                          {/* Coluna Principal - Checklist */}
                          <div className="col-span-2 space-y-4">
                            <div className="bg-white rounded-lg border p-6 space-y-6">
                              <div className="space-y-2">
                                <h3 className="text-lg font-semibold">
                                  {Object.values(MEI_ANALYSIS_STEPS)[
                                    expandedStep || 0
                                  ]?.title || ""}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  Complete todos os itens obrigatórios para
                                  prosseguir
                                </p>
                              </div>

                              {/* Checklist items */}
                              <div className="space-y-3">
                                {expandedStep !== null &&
                                  Object.values(MEI_ANALYSIS_STEPS)[
                                    expandedStep
                                  ]?.checkItems?.map((item) => (
                                    <div
                                      key={item.id}
                                      className={cn(
                                        "group relative p-4 rounded-lg border transition-all duration-200",
                                        checkedItems[
                                          `${
                                            Object.values(MEI_ANALYSIS_STEPS)[
                                              expandedStep
                                            ].id
                                          }-${item.id}`
                                        ]
                                          ? "bg-emerald-50 border-emerald-200"
                                          : "hover:bg-gray-50/50"
                                      )}
                                    >
                                      <div className="flex items-center gap-4">
                                        <Checkbox
                                          id={`${
                                            Object.values(MEI_ANALYSIS_STEPS)[
                                              expandedStep
                                            ].id
                                          }-${item.id}`}
                                          checked={
                                            checkedItems[
                                              `${
                                                Object.values(
                                                  MEI_ANALYSIS_STEPS
                                                )[expandedStep].id
                                              }-${item.id}`
                                            ]
                                          }
                                          onCheckedChange={(checked) => {
                                            setCheckedItems((prev) => ({
                                              ...prev,
                                              [`${
                                                Object.values(
                                                  MEI_ANALYSIS_STEPS
                                                )[expandedStep].id
                                              }-${item.id}`]: checked as boolean,
                                            }));
                                          }}
                                          className="h-5 w-5"
                                        />

                                        <div className="flex-1">
                                          <div className="flex items-center justify-between">
                                            <label
                                              htmlFor={`${
                                                Object.values(
                                                  MEI_ANALYSIS_STEPS
                                                )[expandedStep].id
                                              }-${item.id}`}
                                              className="text-sm font-medium cursor-pointer"
                                            >
                                              {item.label}
                                              {item.required && (
                                                <span className="text-red-500 ml-1">
                                                  *
                                                </span>
                                              )}
                                            </label>

                                            {checkedItems[
                                              `${
                                                Object.values(
                                                  MEI_ANALYSIS_STEPS
                                                )[expandedStep].id
                                              }-${item.id}`
                                            ] && (
                                              <Badge
                                                variant="outline"
                                                className="bg-emerald-50 text-emerald-700 border-emerald-200"
                                              >
                                                <CheckCircle2 className="h-3 w-3 mr-1" />
                                                Verificado
                                              </Badge>
                                            )}
                                          </div>

                                          <div className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                                            {item.id === "nome_completo" && (
                                              <>
                                                <User2 className="h-4 w-4" />
                                                <span>
                                                  {process.client.name}
                                                </span>
                                              </>
                                            )}

                                            {item.id === "cpf_valido" && (
                                              <>
                                                <FileText className="h-4 w-4" />
                                                <span>
                                                  {formatCPF(
                                                    process.client.cpf
                                                  )}
                                                </span>
                                              </>
                                            )}

                                            {item.id === "rg_valido" && (
                                              <>
                                                <FileText className="h-4 w-4" />
                                                <span
                                                  className={
                                                    !process.client.rg
                                                      ? "text-amber-600"
                                                      : ""
                                                  }
                                                >
                                                  {process.client.rg ||
                                                    "Não informado"}
                                                </span>
                                              </>
                                            )}

                                            {item.id === "endereco_completo" &&
                                              process.client.address && (
                                                <>
                                                  <MapPin className="h-4 w-4" />
                                                  <span>
                                                    {
                                                      process.client.address
                                                        .street
                                                    }
                                                    ,{" "}
                                                    {
                                                      process.client.address
                                                        .number
                                                    }
                                                    {process.client.address
                                                      .complement &&
                                                      ` - ${process.client.address.complement}`}
                                                  </span>
                                                </>
                                              )}

                                            {item.id === "telefone_email" && (
                                              <>
                                                <Phone className="h-4 w-4" />
                                                <span>
                                                  {formatPhone(
                                                    process.client.phone
                                                  )}
                                                </span>
                                                <Mail className="h-4 w-4 ml-2" />
                                                <span>
                                                  {process.client.email}
                                                </span>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>

                                      <div
                                        className={cn(
                                          "absolute left-0 top-0 bottom-0 w-1 rounded-l-lg transition-all",
                                          checkedItems[
                                            `${
                                              Object.values(MEI_ANALYSIS_STEPS)[
                                                expandedStep
                                              ].id
                                            }-${item.id}`
                                          ]
                                            ? "bg-emerald-500"
                                            : "bg-transparent group-hover:bg-gray-200"
                                        )}
                                      />
                                    </div>
                                  ))}
                              </div>

                              <Button
                                className={cn(
                                  "w-full mt-6",
                                  canCompleteStep(
                                    Object.values(MEI_ANALYSIS_STEPS)[
                                      expandedStep || 0
                                    ]
                                  )
                                    ? "bg-emerald-500 hover:bg-emerald-600"
                                    : ""
                                )}
                                disabled={
                                  !canCompleteStep(
                                    Object.values(MEI_ANALYSIS_STEPS)[
                                      expandedStep || 0
                                    ]
                                  )
                                }
                                onClick={() => {
                                  if (
                                    expandedStep !== null &&
                                    Object.values(MEI_ANALYSIS_STEPS)[
                                      expandedStep
                                    ]
                                  ) {
                                    handleStepComplete(
                                      Object.values(MEI_ANALYSIS_STEPS)[
                                        expandedStep
                                      ]
                                    );
                                  }
                                }}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Concluir Etapa
                              </Button>
                            </div>
                          </div>

                          {/* Coluna Lateral - Informações da Etapa */}
                          <div className="space-y-4">
                            <div className="bg-white rounded-lg border p-6">
                              <div className="space-y-6">
                                <div className="flex items-center gap-2 text-primary">
                                  <Info className="h-5 w-5" />
                                  <h3 className="font-semibold">
                                    Informações da Etapa
                                  </h3>
                                </div>

                                <div>
                                  <h4 className="text-sm font-medium mb-2">
                                    Descrição
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    Verificação dos dados cadastrais do cliente
                                  </p>
                                </div>

                                <Separator />

                                <div>
                                  <h4 className="text-sm font-medium mb-3">
                                    Dicas
                                  </h4>
                                  <div className="space-y-3">
                                    <div className="flex items-start gap-2">
                                      <LightbulbIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                      <p className="text-sm text-muted-foreground">
                                        Certifique-se de que todos os documentos
                                        estejam legíveis
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <LightbulbIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                      <p className="text-sm text-muted-foreground">
                                        Compare os dados com documentos
                                        originais quando possível
                                      </p>
                                    </div>
                                    <div className="flex items-start gap-2">
                                      <LightbulbIcon className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                                      <p className="text-sm text-muted-foreground">
                                        Verifique a validade dos documentos
                                        apresentados
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Adicione o Toaster no final do componente */}
      <Toaster
        position="top-right"
        closeButton
        theme="light"
        className="z-50"
        toastOptions={{
          style: {
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: "8px",
            padding: "16px",
          },
           
         
        }}
      />
    </div>
  )}



