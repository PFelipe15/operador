/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { DocumentVerificationModal } from "@/components/documents/DocumentVerificationModal";
import { AssignToMeButton } from "@/components/layout/assigmeButton";
import { TimelineEvent } from "@/components/layout/timelineEvent";
import { AssignOperatorModal } from "@/components/modals/assign-operator-modal";
import { DocumentUploadModal } from "@/components/modals/document-upload-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { CheckItem, MEI_ANALYSIS_STEPS } from "@/lib/constants";
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
} from "@/lib/utils";
import {
  Address,
  Client,
  Company,
  Document,
  Operator,
  PendingDataType,
  Process,
  ProcessStatus,
  TimelineEvent as TimelineEventPrisma,
} from "@prisma/client";
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Archive,
  ArrowLeft,
  Bell,
  Building2,
  Calculator,
  Calendar,
  CheckCircle2,
  CheckSquare,
  ClipboardCheck,
  Clock,
  Download,
  ExternalLink,
  Eye,
  FileText,
  Flag,
  Mail,
  Maximize2,
  MessageCircle,
  MessageSquare,
  Minimize2,
  MoreHorizontal,
  Phone,
  PinIcon,
  Plus,
  RefreshCw,
  Send,
  Settings,
  Share2,
  Star,
  StickyNote,
  Trash2,
  TrendingUp,
  User2,
  Zap,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import React, { useCallback, useEffect, useState } from "react";
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

interface Note {
  id: string;
  content: string;
  type: "PRIVATE" | "INTERNAL" | "PUBLIC";
  priority: "HIGH" | "MEDIUM" | "LOW";
  tags: string[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  pinned: boolean;
  operator: {
    id: string;
    name: string;
    email: string;
  };
}

interface Task {
  id: string;
  title: string;
  description?: string;
  status: "PENDING" | "COMPLETED" | "CANCELLED";
  priority: "HIGH" | "MEDIUM" | "LOW";
  dueDate?: string;
  completedAt?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: string;
    name: string;
    email: string;
  };
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
}

interface Reminder {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  type: "DEADLINE" | "FOLLOWUP" | "MEETING" | "DOCUMENT";
  completed: boolean;
  notified: boolean;
  createdAt: string;
  operator: {
    id: string;
    name: string;
    email: string;
  };
}

interface ChatMessage {
  id: string;
  content: string;
  type: "text" | "file" | "image" | "system";
  sender: "operator" | "client" | "system";
  senderName: string;
  timestamp: string;
  read: boolean;
  attachments?: any[];
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
  const [pendingItems, setPendingItems] = useState<PendingDataType[]>([]);
  const [previouslyPendingItems, setPreviouslyPendingItems] = useState<
    PendingDataType[]
  >([]);
  const [pendingItemsChanged, setPendingItemsChanged] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Estados para o painel lateral dinâmico
  const [activeTab, setActiveTab] = useState("overview");
  const [activeToolTab, setActiveToolTab] = useState("notes");
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newTask, setNewTask] = useState("");
  const [newReminder, setNewReminder] = useState("");
  const [chatInput, setChatInput] = useState("");

  // NOVOS ESTADOS PARA PAINÉIS FLUTUANTES
  const [chatPanelOpen, setChatPanelOpen] = useState(false);
  const [toolsPanelOpen, setToolsPanelOpen] = useState(false);

  const [noteType, setNoteType] = useState<"PRIVATE" | "INTERNAL" | "PUBLIC">(
    "PRIVATE"
  );
  const [taskPriority, setTaskPriority] = useState<"LOW" | "MEDIUM" | "HIGH">(
    "MEDIUM"
  );
  const [isAddingReminder, setIsAddingReminder] = useState(false);
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderType, setReminderType] = useState<
    "DEADLINE" | "FOLLOWUP" | "MEETING" | "DOCUMENT"
  >("DEADLINE");

  // Estados para painéis laterais
  const [leftPanelMinimized, setLeftPanelMinimized] = useState(false);
  const [rightPanelMinimized, setRightPanelMinimized] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Estados para ferramentas contábeis
  const [prolaboreValue, setProlaboreValue] = useState("");
  const [cnaeCode, setCnaeCode] = useState("");
  const [showProlaboreCalc, setShowProlaboreCalc] = useState(false);
  const [faturamentoMEI, setFaturamentoMEI] = useState("");
  const [showFaturamentoCalc, setShowFaturamentoCalc] = useState(false);

  // Valores atualizados para 2025
  const MEI_VALUES = {
    salarioMinimo: 1518.0,
    inssRate: 0.05, // 5%
    icmsValue: 1.0,
    issValue: 5.0,
    limiteAnual: 81000.0,
  };

  const calculateDASMEI = (tipo: "comercio" | "servicos" | "ambos") => {
    const inssValue = MEI_VALUES.salarioMinimo * MEI_VALUES.inssRate;

    switch (tipo) {
      case "comercio":
        return inssValue + MEI_VALUES.icmsValue; // INSS + ICMS
      case "servicos":
        return inssValue + MEI_VALUES.issValue; // INSS + ISS
      case "ambos":
        return inssValue + MEI_VALUES.icmsValue + MEI_VALUES.issValue; // INSS + ICMS + ISS
      default:
        return inssValue + MEI_VALUES.icmsValue;
    }
  };

  // Base de CNAEs MEI mais comuns (simplificada)
  const CNAES_MEI_COMUNS = [
    "4751-2/01",
    "4751-2/02",
    "4751-2/03", // Comércio varejista de tecidos
    "4753-9/00", // Comércio varejista especializado de eletrodomésticos
    "4759-8/01",
    "4759-8/02",
    "4759-8/03", // Comércio varejista de móveis
    "5611-2/01",
    "5611-2/02",
    "5611-2/03", // Restaurantes e similares
    "5620-1/01",
    "5620-1/02", // Fornecimento de alimentos preparados
    "6201-5/00", // Desenvolvimento de programas de computador sob encomenda
    "6202-3/00", // Desenvolvimento e licenciamento de programas de computador
    "7020-4/00", // Atividades de consultoria em gestão empresarial
    "8230-0/01", // Serviços de organização de feiras, congressos
    "9602-5/01",
    "9602-5/02", // Cabeleireiros, manicure e pedicure
  ];

  const checkCNAEMEI = (cnae: string) => {
    if (!cnae || cnae.length < 7) return null;

    // Simulação simples - na prática, seria uma consulta à API oficial
    const isCommon = CNAES_MEI_COMUNS.some((common) =>
      cnae.includes(common.substring(0, 4))
    );

    if (isCommon) {
      return { permitido: true, tipo: "Atividade comum para MEI" };
    } else {
      return { permitido: null, tipo: "Verificar na lista oficial" };
    }
  };

  // Função para mostrar dados atuais do processo
  const getCurrentData = (itemId: string) => {
    if (!process) return null;

    switch (itemId) {
      // DADOS_PESSOAIS step
      case "nome_completo":
        return process.client?.name || null;
      case "cpf_valido":
        return process.client?.cpf ? formatCPF(process.client.cpf) : null;
      case "rg_valido":
        return process.client?.rg || null;
      case "endereco_completo":
        if (process.client?.address) {
          return `${process.client.address.street}, ${process.client.address.number} - ${process.client.address.district}, ${process.client.address.city}/${process.client.address.state} - CEP: ${process.client.address.cep}`;
        }
        return null;
      case "contatos_validos":
        const phone = process.client?.phone
          ? formatPhone(process.client.phone)
          : null;
        const email = process.client?.email || null;
        if (phone && email) return `${phone} | ${email}`;
        if (phone) return phone;
        if (email) return email;
        return null;

      // ATIVIDADE_MEI step
      case "cnae_permitido":
        return process.company?.principalActivity || null;
      case "atividade_principal":
        return process.company?.principalActivity || null;
      case "nome_fantasia":
        return process.company?.name || null;

      // DOCUMENTACAO step
      case "docs_pessoais_rg":
        const rgDocs = process.documents?.filter(
          (d) =>
            d.type.includes("IDENTIDADE") ||
            d.type.includes("RG") ||
            d.name.toLowerCase().includes("identidade") ||
            d.name.toLowerCase().includes("rg")
        );
        return rgDocs && rgDocs.length > 0
          ? `${rgDocs.length} documento(s) de identidade anexado(s)`
          : null;
      case "docs_pessoais_cpf":
        const cpfDocs = process.documents?.filter(
          (d) => d.type.includes("CPF") || d.name.toLowerCase().includes("cpf")
        );
        return cpfDocs && cpfDocs.length > 0
          ? `${cpfDocs.length} documento(s) de CPF anexado(s)`
          : null;
      case "certidoes_negativas":
        const certDocs = process.documents?.filter(
          (d) =>
            d.name.toLowerCase().includes("certidão") ||
            d.name.toLowerCase().includes("certidao") ||
            d.name.toLowerCase().includes("negativa")
        );
        return certDocs && certDocs.length > 0
          ? `${certDocs.length} certidão(ões) anexada(s)`
          : null;

      // VALIDACAO_CADASTRAL step
      case "consulta_cpf":
        return process.client?.cpf
          ? `CPF: ${formatCPF(
              process.client.cpf
            )} - Verificar situação na Receita Federal`
          : null;
      case "consulta_nome":
        return process.client?.name
          ? `${process.client.name} - Verificar homônimos`
          : null;
      case "consulta_endereco":
        if (process.client?.address) {
          return `${process.client.address.street}, ${process.client.address.number} - ${process.client.address.city}/${process.client.address.state}`;
        }
        return null;
      case "restricoes_municipais":
        return process.company?.principalActivity
          ? `Atividade: ${process.company.principalActivity}`
          : null;

      // APROVACAO_FINAL step
      case "revisao_documentos":
        const verifiedDocs = process.documents?.filter(
          (d) => d.status === "VERIFIED"
        );
        const totalDocs = process.documents?.length || 0;
        return totalDocs > 0
          ? `${verifiedDocs?.length || 0}/${totalDocs} documentos verificados`
          : null;
      case "revisao_informacoes":
        const completedFields = [
          process.client?.name,
          process.client?.cpf,
          process.client?.email,
          process.client?.phone,
          process.company?.name,
        ].filter(Boolean).length;
        return `${completedFields}/5 campos principais preenchidos`;
      case "termo_ciencia":
        return process.company?.principalActivity
          ? `Atividade MEI: ${process.company.principalActivity}`
          : null;
      case "aprovacao_responsavel":
        return process.operator?.name
          ? `Responsável: ${process.operator.name}`
          : "Operador não atribuído";

      default:
        return null;
    }
  };

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
                savedCheckedItems[`${metadata.step}-${itemId}`] =
                  checked as boolean;
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

  // Carregar dados das funcionalidades dinâmicas apenas uma vez quando o processo ID estiver disponível
  useEffect(() => {
    if (params.id && typeof params.id === "string") {
      fetchProcess();
      loadChatMessages();
      loadNotes();
      loadTasks();
      loadReminders();
    }
  }, [params.id]);

  // Funções para carregar dados das novas funcionalidades
  const loadNotes = async () => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/notes`);
      if (response.ok) {
        const data = await response.json();
        setNotes(data);
      } else {
        // Se a API retornar erro, apenas definir array vazio
        setNotes([]);
      }
    } catch (error) {
      console.error("Erro ao carregar notas:", error);
      // Em caso de erro de rede, manter o estado atual sem adicionar dados mock
      // setNotes([]);
    }
  };

  const loadTasks = async () => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/tasks`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      } else {
        // Se a API retornar erro, apenas definir array vazio
        setTasks([]);
      }
    } catch (error) {
      console.error("Erro ao carregar tarefas:", error);
      // Em caso de erro de rede, manter o estado atual sem adicionar dados mock
      // setTasks([]);
    }
  };

  const loadReminders = async () => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/reminders`);
      if (response.ok) {
        const data = await response.json();
        setReminders(data);
      } else {
        // Se a API retornar erro, apenas definir array vazio
        setReminders([]);
      }
    } catch (error) {
      console.error("Erro ao carregar lembretes:", error);
      // Em caso de erro de rede, manter o estado atual sem adicionar dados mock
      // setReminders([]);
    }
  };

  const loadChatMessages = async () => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/messages`);
      if (response.ok) {
        const data = await response.json();
        const chatMessages: ChatMessage[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          type: msg.messageType,
          sender: msg.fromMe ? "operator" : "client",
          senderName: msg.fromMe
            ? msg.operator?.name || "Operador"
            : process?.client.name || "Cliente",
          timestamp: msg.createdAt,
          read: msg.read,
          attachments: [],
        }));
        setChatMessages(chatMessages);
      }
    } catch (error) {
      console.error("Erro ao carregar mensagens:", error);
      // Fallback para dados mock em caso de erro
      const mockMessages: ChatMessage[] = [
        {
          id: "1",
          content:
            "Boa tarde! Gostaria de saber sobre o andamento do meu processo.",
          type: "text",
          sender: "client",
          senderName: process?.client.name || "Cliente",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          read: true,
          attachments: [],
        },
      ];
      setChatMessages(mockMessages);
    }
  };

  useEffect(() => {
    fetchProcess();
  }, [params.id]);

  useEffect(() => {
    const fetchProcessStats = async () => {
      try {
        const response = await fetch(`/api/v1/processes/${params.id}/status`);
        const stats = await response.json();
        setProcessStats(stats);
      } catch (error) {
        console.error("Erro ao carregar estatísticas:", error);
      }
    };

    fetchProcessStats();
  }, [params.id]);

  useEffect(() => {
    if (process?.pendingTypeData && process.pendingTypeData.length > 0) {
      // Sincroniza os pendingItems com os dados do processo
      const processPendingItems = process.pendingTypeData as PendingDataType[];
      setPendingItems(processPendingItems);
      setPreviouslyPendingItems(processPendingItems);
      setPendingItemsChanged(false);
    }
  }, [process?.pendingTypeData]);

  // Resto das funções existentes mantidas...
  const canCompleteStep = useCallback(
    (step: (typeof MEI_ANALYSIS_STEPS)[keyof typeof MEI_ANALYSIS_STEPS]) => {
      if (!step || !step.checkItems) return false;

      // Primeiro: Verifica se há itens pendentes no processo
      if (process?.pendingTypeData && process.pendingTypeData.length > 0) {
        console.log(
          "❌ Não pode concluir: há itens pendentes no processo",
          process.pendingTypeData
        );
        return false;
      }

      // Segundo: Verifica se há pendências locais (ainda não salvas)
      if (pendingItems && pendingItems.length > 0) {
        console.log(
          "❌ Não pode concluir: há pendências locais não salvas",
          pendingItems
        );
        return false;
      }

      // Terceiro: Verifica se todos os itens obrigatórios estão marcados
      const requiredItems = step.checkItems.filter((item) => item.required);

      // Verifica se há itens obrigatórios
      if (requiredItems.length === 0) return true;

      // Verifica se todos os itens obrigatórios estão marcados
      const allRequiredChecked = requiredItems.every((item) => {
        // Usa a chave correta para verificar o estado do checkbox
        const checkboxKey = `${step.id}-${item.id}`;
        console.log(
          `Verificando item ${checkboxKey}: ${checkedItems[checkboxKey]}`
        );
        return !!checkedItems[checkboxKey];
      });

      console.log(
        `Todos os itens obrigatórios marcados: ${allRequiredChecked}`
      );
      return allRequiredChecked;
    },
    [checkedItems, process?.pendingTypeData, pendingItems]
  );

  const fetchProcess = async () => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}`);
      if (!response.ok) {
        throw new Error("Processo não encontrado");
      }

      const data: ProcessWithRelations = await response.json();
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

  // Funções dinâmicas para ações rápidas
  const handlePhoneCall = () => {
    if (!process) return;
    const phoneNumber = process.client.phone.replace(/\D/g, "");
    window.open(`tel:${phoneNumber}`, "_self");
    toast.success(
      `Iniciando ligação para ${formatPhone(process.client.phone)}`
    );
  };

  const handleSendEmail = () => {
    if (!process) return;
    const subject = `Processo ${process.id.slice(-8)} - ${process.client.name}`;
    const body = `Olá ${process.client.name},\n\nEntramos em contato sobre o seu processo de ${process.type}.\n\nAtenciosamente,\n${operator?.name}`;
    window.open(
      `mailto:${process.client.email}?subject=${encodeURIComponent(
        subject
      )}&body=${encodeURIComponent(body)}`,
      "_self"
    );
    toast.success("Cliente de email aberto");
  };

  const handleWhatsApp = () => {
    if (!process) return;
    const phoneNumber = process.client.phone.replace(/\D/g, "");
    const message = `Olá ${process.client.name}! Aqui é ${
      operator?.name
    } da StepMEI. Entro em contato sobre o seu processo ${process.id.slice(
      -8
    )}.`;
    window.open(
      `https://wa.me/55${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
    toast.success("WhatsApp aberto");
  };

  const handleExternalConsultation = () => {
    // Simulação de abertura de sistemas externos
    const consultationSites = [
      {
        name: "Receita Federal",
        url: "https://www.gov.br/receitafederal/pt-br",
      },
      {
        name: "Simples Nacional",
        url: "http://www8.receita.fazenda.gov.br/simplesnacional/",
      },
      { name: "Junta Comercial", url: "https://www.juntacomercial.pr.gov.br/" },
    ];

    consultationSites.forEach((site) => {
      window.open(site.url, "_blank");
    });
    toast.success("Sistemas de consulta abertos");
  };

  // Funções para adicionar novas notas
  const addNote = async (
    content: string,
    type: "PRIVATE" | "INTERNAL" | "PUBLIC",
    priority: "HIGH" | "MEDIUM" | "LOW"
  ) => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/notes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content,
          type,
          priority,
          operatorId: operator?.id || "1",
        }),
      });

      if (response.ok) {
        const newNote = await response.json();
        setNotes((prev) => [newNote, ...prev]);
      }
    } catch (error) {
      console.error("Erro ao adicionar nota:", error);
    }
  };

  // Função para adicionar nova tarefa
  const addTask = async (
    title: string,
    description: string,
    priority: "HIGH" | "MEDIUM" | "LOW",
    dueDate?: string
  ) => {
    try {
      const response = await fetch(`/api/v1/processes/${params.id}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          priority,
          dueDate,
          operatorId: operator?.id || "1",
        }),
      });

      if (response.ok) {
        const newTask = await response.json();
        setTasks((prev) => [...prev, newTask]);
      }
    } catch (error) {
      console.error("Erro ao adicionar tarefa:", error);
    }
  };

  // Função para toggle de tarefa
  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch(
        `/api/v1/processes/${params.id}/tasks/${taskId}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        const updatedTask = await response.json();
        setTasks((prev) =>
          prev.map((task) => (task.id === taskId ? updatedTask : task))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar tarefa:", error);
    }
  };

  // Função para toggle pin de nota
  const toggleNotePin = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/v1/processes/${params.id}/notes/${noteId}`,
        {
          method: "PATCH",
        }
      );

      if (response.ok) {
        const updatedNote = await response.json();
        setNotes((prev) =>
          prev.map((note) => (note.id === noteId ? updatedNote : note))
        );
      }
    } catch (error) {
      console.error("Erro ao atualizar nota:", error);
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const response = await fetch(
        `/api/v1/processes/${params.id}/notes/${noteId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setNotes(notes.filter((note: Note) => note.id !== noteId));
        toast.success("Anotação removida com sucesso");
      } else {
        throw new Error("Erro ao remover anotação");
      }
    } catch (error) {
      console.error("Erro ao remover anotação:", error);
      toast.error("Erro ao remover anotação");
    }
  };

  const handleMarkAsPending = (item: any) => {
    if (!item.pendingTypeData || item.pendingTypeData.length === 0) return;

    const updatedPendingItems = [...pendingItems];

    item.pendingTypeData.forEach((type: PendingDataType) => {
      if (!updatedPendingItems.includes(type)) {
        updatedPendingItems.push(type);
      }
    });

    setPendingItems(updatedPendingItems);
    const hasChanged = !arraysAreEqual(
      updatedPendingItems,
      previouslyPendingItems
    );
    setPendingItemsChanged(hasChanged);
  };

  const handleRemovePending = (item: any) => {
    if (!item.pendingTypeData || item.pendingTypeData.length === 0) return;

    const updatedPendingItems = pendingItems.filter(
      (type) => !item.pendingTypeData.includes(type)
    );
    setPendingItems(updatedPendingItems);

    const hasChanged = !arraysAreEqual(
      updatedPendingItems,
      previouslyPendingItems
    );
    setPendingItemsChanged(hasChanged);
  };

  const handleConfirmPendingChanges = async () => {
    try {
      await toast.promise(
        async () => {
          const addedItems = pendingItems.filter(
            (item) => !previouslyPendingItems.includes(item)
          );
          const removedItems = previouslyPendingItems.filter(
            (item) => !pendingItems.includes(item)
          );

          await fetch(`/api/v1/processes/${params.id}/progress`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: "PENDING_DATA_UPDATE",
              data: {
                pendingTypeData: pendingItems,
                addedItems,
                removedItems,
                previousStatus: process?.status,
              },
            }),
          });

          // Recarregar apenas o processo principal, sem disparar reload dos dados dinâmicos
          await fetchProcess();
          setPendingItemsChanged(false);
        },
        {
          loading: "Atualizando dados pendentes...",
          success: "Dados pendentes atualizados com sucesso",
          error: "Erro ao atualizar dados pendentes",
        }
      );
    } catch (error) {
      console.error("Erro:", error);
    }
  };

  const arraysAreEqual = (arr1: any[], arr2: any[]) => {
    if (arr1.length !== arr2.length) return false;
    const sortedArr1 = [...arr1].sort();
    const sortedArr2 = [...arr2].sort();
    return sortedArr1.every((val, idx) => val === sortedArr2[idx]);
  };

  const sendMessage = () => {
    // Implemente a lógica para enviar a mensagem
    console.log("Mensagem enviada:", message);
    setMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  };

  const fetchStats = async () => {
    if (!operator?.id) return;
    try {
      setLoading(true);
      const response = await fetch(`/api/v1/dashboard/stats/${operator.id}`);
      const data = await response.json();
      // ... resto do código
    } catch (error) {
      console.error("Erro ao carregar estatísticas:", error);
    } finally {
      setLoading(false);
    }
  };

  // Funções essenciais que foram removidas mas são necessárias
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
              onAssignSuccess={() => {
                fetchProcess();
              }}
            />
          </div>
        </div>,
        {
          duration: 0,
          style: {
            backgroundColor: "#FEF2F2",
            border: "1px solid #FCA5A5",
            padding: "16px",
            width: "380px",
          },
        }
      );
      return;
    }

    // Verificações de validação antes de concluir a etapa

    // 1. Verificar se há pendências salvas no processo
    if (process?.pendingTypeData && process.pendingTypeData.length > 0) {
      toast.error(
        `Não é possível concluir a etapa pois há ${process.pendingTypeData.length} item(s) pendente(s) no processo. Resolva as pendências primeiro.`,
        {
          description:
            "Vá para a aba de análise e verifique os itens marcados como pendentes.",
          duration: 5000,
        }
      );
      return;
    }

    // 2. Verificar se há pendências locais não salvas
    if (pendingItems && pendingItems.length > 0) {
      toast.error(
        `Há ${pendingItems.length} item(s) marcado(s) como pendente(s) que ainda não foram salvos.`,
        {
          description: "Salve as alterações de pendência antes de continuar.",
          action: {
            label: "Salvar Alterações",
            onClick: () => handleConfirmPendingChanges(),
          },
          duration: 8000,
        }
      );
      return;
    }

    // 3. Verificar se há alterações de pendências não confirmadas
    if (pendingItemsChanged) {
      toast.error("Há alterações de pendências não salvas.", {
        description: "Confirme ou cancele as alterações antes de continuar.",
        duration: 5000,
      });
      return;
    }

    try {
      await toast.promise(
        async () => {
          await fetch(`/api/v1/processes/${params.id}/progress`, {
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
              },
            }),
          });

          await fetchProcess();
          await loadCheckedItems();

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
          loading: "Concluindo etapa...",
          success: "Etapa concluída com sucesso",
          error: "Erro ao concluir etapa",
        }
      );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Erro ao concluir etapa");
    }
  };

  const handleStartProcess = async () => {
    try {
      if (process?.operatorId === null) {
        toast.error(
          "Não foi possível iniciar o processo pois o processo não tem operador atribuído"
        );
        return;
      }

      await toast.promise(
        async () => {
          await fetch(`/api/v1/processes/${params.id}/progress`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              step: "START_PROCESS",
              data: {
                previousStatus: process?.status,
                newStatus: "ANALYZING_DATA",
              },
            }),
          });

          await fetchProcess();
        },
        {
          loading: "Iniciando processo...",
          success: "Processo iniciado com sucesso",
          error: "Erro ao iniciar processo",
        }
      );
    } catch (error) {
      console.error("Erro:", error);
      toast.error("Não foi possível iniciar o processo");
    }
  };

  // Funções de formatação corrigidas
  const formatTimeFixed = (timestamp: string) => {
    return formatTime(new Date(timestamp).getTime());
  };

  const formatTimeAgoFixed = (dateString: string) => {
    return formatTimeAgo(new Date(dateString));
  };

  const formatTimeDifferenceFixed = (start: string, end: string) => {
    return formatTimeDifference(new Date(start), new Date(end));
  };

  // Funções para chat
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    try {
      const response = await fetch(`/api/v1/processes/${params.id}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: chatInput,
          messageType: "text",
          fromMe: true,
          operatorId: operator?.id || "1",
        }),
      });

      if (response.ok) {
        const newMessage = await response.json();
        const chatMessage: ChatMessage = {
          id: newMessage.id,
          content: newMessage.content,
          type: newMessage.messageType,
          sender: "operator",
          senderName: operator?.name || "Operador",
          timestamp: newMessage.createdAt,
          read: true,
          attachments: [],
        };
        setChatMessages([...chatMessages, chatMessage]);
        setChatInput("");
        toast.success("Mensagem enviada");
      }
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      toast.error("Erro ao enviar mensagem");
    }
  };

  // Funções para lembretes
  const addReminder = async () => {
    if (!reminderTitle.trim() || !reminderDate) return;

    try {
      const response = await fetch(`/api/v1/processes/${params.id}/reminders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: reminderTitle,
          description: newReminder || undefined,
          type: reminderType.toUpperCase(),
          dueDate: reminderDate,
          operatorId: operator?.id || "1",
        }),
      });

      if (response.ok) {
        const newReminderItem = await response.json();
        setReminders([newReminderItem, ...reminders]);
        setReminderTitle("");
        setReminderDate("");
        setNewReminder("");
        setIsAddingReminder(false);
        toast.success("Lembrete adicionado com sucesso");
      } else {
        throw new Error("Erro ao adicionar lembrete");
      }
    } catch (error) {
      console.error("Erro ao adicionar lembrete:", error);
      toast.error("Erro ao adicionar lembrete");
    }
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(
        `/api/v1/processes/${params.id}/reminders/${reminderId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setReminders(
          reminders.filter((reminder) => reminder.id !== reminderId)
        );
        toast.success("Lembrete removido com sucesso");
      } else {
        throw new Error("Erro ao remover lembrete");
      }
    } catch (error) {
      console.error("Erro ao remover lembrete:", error);
      toast.error("Erro ao remover lembrete");
    }
  };

  const toggleReminderCompleted = async (reminderId: string) => {
    try {
      const reminder = reminders.find((r) => r.id === reminderId);
      if (!reminder) return;

      const response = await fetch(
        `/api/v1/processes/${params.id}/reminders/${reminderId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            completed: !reminder.completed,
          }),
        }
      );

      if (response.ok) {
        const updatedReminder = await response.json();
        setReminders(
          reminders.map((r) => (r.id === reminderId ? updatedReminder : r))
        );
        toast.success(
          `Lembrete marcado como ${
            updatedReminder.completed ? "completo" : "pendente"
          }`
        );
      } else {
        throw new Error("Erro ao atualizar lembrete");
      }
    } catch (error) {
      console.error("Erro ao atualizar lembrete:", error);
      toast.error("Erro ao atualizar lembrete");
    }
  };

  const getReminderTypeDisplay = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return "Prazo";
      case "FOLLOWUP":
        return "Follow-up";
      case "MEETING":
        return "Reunião";
      case "DOCUMENT":
        return "Documento";
      default:
        return type;
    }
  };

  const getReminderIcon = (type: string) => {
    switch (type) {
      case "DEADLINE":
        return <AlertOctagon className="h-5 w-5 text-red-600" />;
      case "FOLLOWUP":
        return <Clock className="h-5 w-5 text-blue-600" />;
      case "MEETING":
        return <Calendar className="h-5 w-5 text-purple-600" />;
      case "DOCUMENT":
        return <FileText className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-orange-600" />;
    }
  };

  const deleteTask = async (taskId: string) => {
    try {
      const response = await fetch(
        `/api/v1/processes/${params.id}/tasks/${taskId}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setTasks(tasks.filter((task) => task.id !== taskId));
        toast.success("Tarefa removida com sucesso");
      } else {
        throw new Error("Erro ao remover tarefa");
      }
    } catch (error) {
      console.error("Erro ao remover tarefa:", error);
      toast.error("Erro ao remover tarefa");
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
        <Button
          variant="outline"
          onClick={() => router.push("/operador/process")}
        >
          Voltar para lista de processos
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-emerald-50/20">
      {/* Header Avançado */}
      <div className="bg-white/95 backdrop-blur-sm border-b border-gray-200/60 shadow-lg">
        <div className="max-w-8xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="h-10 w-10 p-0 hover:bg-gray-100 rounded-xl"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl text-white shadow-lg">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                      Processo #{process?.id.slice(-8)}
                    </h1>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium px-3 py-1",
                        getProcessStatusColor(process?.status || "CREATED")
                      )}
                    >
                      <div className="flex items-center gap-1.5">
                        {getStatusIcon(process?.status || "CREATED")}
                        {translateProcessStatus(
                          (process?.status as ProcessStatus) || "CREATED"
                        )}
                      </div>
                    </Badge>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs font-medium px-3 py-1",
                        getPriorityColor(process?.priority || "MEDIUM")
                      )}
                    >
                      <Flag className="h-3 w-3 mr-1" />
                      {translatePriority(process?.priority || "MEDIUM")}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <User2 className="h-4 w-4" />
                      {process?.client.name}
                    </span>
                    <span>•</span>
                    <span>
                      Criado {formatDate(process?.createdAt.toString() || "")}
                    </span>
                    <span>•</span>
                    <span>
                      Atualizado{" "}
                      {formatTimeAgoFixed(
                        process?.lastInteractionAt.toString() || ""
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-gray-50"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-gray-50"
              >
                <Share2 className="h-4 w-4" />
                Compartilhar
              </Button>

              {process?.operatorId ? (
                <DocumentUploadModal
                  processId={process?.id || ""}
                  onUploadSuccess={fetchProcess}
                  operatorProcessId={process?.operator?.id}
                />
              ) : (
                <AssignToMeButton
                  processId={process?.id || ""}
                  onAssignSuccess={fetchProcess}
                />
              )}

              <Button
                variant="outline"
                size="sm"
                className="gap-2 hover:bg-gray-50"
              >
                <Star className="h-4 w-4" />
              </Button>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48" align="end">
                  <div className="space-y-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Settings className="h-4 w-4" />
                      Configurações
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2"
                    >
                      <Archive className="h-4 w-4" />
                      Arquivar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start gap-2 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </Button>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      </div>

      <div className="flex max-w-8xl mx-auto">
        {/* BARRA DE TAREFAS - LATERAL ESQUERDA */}
        <div
          className={cn(
            "transition-all duration-300 bg-white/95 backdrop-blur-sm border-r border-gray-200/60 shadow-lg overflow-hidden",
            leftPanelMinimized ? "w-16" : "w-64"
          )}
        >
          <div className="p-3 border-b bg-gradient-to-r from-blue-500 to-blue-600 text-white flex items-center justify-between">
            {!leftPanelMinimized && (
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <MessageCircle className="h-4 w-4" />
                Chat & Consultas
              </h3>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLeftPanelMinimized(!leftPanelMinimized)}
              className="h-7 w-7 text-white hover:bg-blue-600 rounded-full"
            >
              {leftPanelMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
          </div>

          {!leftPanelMinimized && (
            <div className="h-[calc(100vh-200px)] overflow-y-auto">
              {/* Chat Section - Mais compacto */}
              <div className="p-3 border-b">
                <div className="flex-1 p-3 overflow-y-auto space-y-2 bg-gradient-to-b from-blue-50/30 to-white max-h-64">
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-6 text-gray-500">
                      <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2">
                        <MessageCircle className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-xs font-medium">Nenhuma mensagem</p>
                      <p className="text-xs text-gray-400">
                        Chat com {process?.client.name?.split(" ")[0]}
                      </p>
                    </div>
                  ) : (
                    chatMessages.slice(-3).map((msg) => (
                      <div
                        key={msg.id}
                        className={cn(
                          "flex",
                          msg.sender === "operator"
                            ? "justify-end"
                            : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "max-w-[180px] px-2 py-1.5 rounded-lg text-xs shadow-sm",
                            msg.sender === "operator"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-br-sm"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-sm"
                          )}
                        >
                          <p className="leading-relaxed">{msg.content}</p>
                          <p
                            className={cn(
                              "text-xs mt-1",
                              msg.sender === "operator"
                                ? "text-blue-100"
                                : "text-gray-500"
                            )}
                          >
                            {formatTimeFixed(msg.timestamp)}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-2">
                  <div className="flex gap-1 items-end">
                    <Input
                      placeholder="Mensagem..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="text-xs border-blue-200 focus:border-blue-400 rounded-md h-8"
                      onKeyPress={(e) =>
                        e.key === "Enter" && !e.shiftKey && sendChatMessage()
                      }
                    />
                    <Button
                      onClick={sendChatMessage}
                      disabled={!chatInput.trim()}
                      size="sm"
                      className={cn(
                        "rounded-md px-2 h-8",
                        chatInput.trim()
                          ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                          : "bg-gray-300 cursor-not-allowed"
                      )}
                    >
                      <Send className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Consultas Compactas */}
              <div className="p-3">
                <h4 className="text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                  <Calculator className="h-3 w-3" />
                  Consultas Rápidas
                </h4>

                <div className="space-y-2">
                  {/* Consulta CNPJ Compacta */}
                  <Card className="p-2 shadow-sm border">
                    <div className="flex items-center gap-1 mb-1">
                      <Building2 className="h-3 w-3 text-blue-600" />
                      <span className="text-xs font-medium">CNPJ</span>
                    </div>
                    <Input
                      placeholder="00.000.000/000"
                      className="text-xs h-6 mb-1"
                    />
                    <Button
                      size="sm"
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-6 text-xs"
                    >
                      Consultar
                    </Button>
                  </Card>
                </div>
              </div>
            </div>
          )}

          {/* Minimized state */}
          {leftPanelMinimized && (
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <MessageCircle className="h-4 w-4 text-blue-600" />
              </div>
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <Calculator className="h-4 w-4 text-emerald-600" />
              </div>
            </div>
          )}
        </div>

        {/* Conteúdo Principal - Mais Espaço */}
        <div className="flex-1 p-4 space-y-4">
          {/* Dashboard de Métricas Compacto */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <Card className="shadow-md border-0 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white overflow-hidden relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium">
                      Progresso
                    </p>
                    <p className="text-2xl font-bold">{process.progress}%</p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <TrendingUp className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">
                      Documentos
                    </p>
                    <p className="text-2xl font-bold">
                      {
                        process.documents.filter(
                          (d: Document) => d.status === "VERIFIED"
                        ).length
                      }
                      <span className="text-sm text-blue-200">
                        /{process.documents.length}
                      </span>
                    </p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-gradient-to-br from-amber-500 to-amber-600 text-white overflow-hidden relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-medium">
                      Tempo Ativo
                    </p>
                    <p className="text-lg font-bold">
                      {formatTimeDifferenceFixed(
                        process.createdAt.toString(),
                        new Date().toISOString()
                      )}
                    </p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Clock className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-md border-0 bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative group hover:shadow-lg transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-xs font-medium">
                      Atividades
                    </p>
                    <p className="text-2xl font-bold">
                      {notes.length + tasks.length + chatMessages.length}
                    </p>
                  </div>
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Activity className="h-5 w-5" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs de Navegação Reorganizadas */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <TabsList className="grid w-fit grid-cols-4 bg-white/80 backdrop-blur-sm shadow-md border">
                <TabsTrigger
                  value="overview"
                  className="gap-2 data-[state=active]:bg-emerald-500 data-[state=active]:text-white text-sm"
                >
                  <User2 className="h-4 w-4" />
                  Informações
                </TabsTrigger>
                <TabsTrigger
                  value="documents"
                  className="gap-2 data-[state=active]:bg-blue-500 data-[state=active]:text-white text-sm"
                >
                  <FileText className="h-4 w-4" />
                  Documentos
                </TabsTrigger>
                <TabsTrigger
                  value="analysis"
                  className="gap-2 data-[state=active]:bg-purple-500 data-[state=active]:text-white text-sm"
                >
                  <ClipboardCheck className="h-4 w-4" />
                  Análise
                </TabsTrigger>
                <TabsTrigger
                  value="timeline"
                  className="gap-2 data-[state=active]:bg-amber-500 data-[state=active]:text-white text-sm"
                >
                  <Clock className="h-4 w-4" />
                  Histórico
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={fetchProcess}
                  className="gap-1 text-xs"
                >
                  <RefreshCw className="h-3 w-3" />
                  Atualizar
                </Button>
                <div className="text-xs text-gray-500">
                  Atualizado{" "}
                  {formatTimeAgoFixed(process.lastInteractionAt.toString())}
                </div>
              </div>
            </div>

            {/* Resto das tabs permanece igual */}
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Informações do Cliente */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-emerald-50/50">
                  <CardHeader className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-t-lg p-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <User2 className="h-5 w-5" />
                      Informações do Cliente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Nome
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {process.client.name}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          CPF
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {formatCPF(process.client.cpf)}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Email
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {process.client.email}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Telefone
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {formatPhone(process.client.phone)}
                        </p>
                      </div>
                    </div>

                    {process.client.address && (
                      <div className="pt-3 border-t">
                        <Label className="text-xs font-medium text-gray-500">
                          Endereço
                        </Label>
                        <div className="text-sm mt-1 space-y-1 font-medium">
                          <p>
                            {process.client.address.street},{" "}
                            {process.client.address.number}
                          </p>
                          <p>
                            {process.client.address.district},{" "}
                            {process.client.address.city} -{" "}
                            {process.client.address.state}
                          </p>
                          <p>CEP: {process.client.address.cep}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Informações da Empresa */}
                <Card className="shadow-lg border-0 bg-gradient-to-br from-white to-blue-50/50">
                  <CardHeader className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-t-lg p-4">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5" />
                      Informações da Empresa
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          Razão Social
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {process.company?.name || "Não informado"}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-500">
                          CNPJ
                        </Label>
                        <p className="text-sm mt-1 font-medium">
                          {process.company?.cnpj
                            ? formatCNPJ(process.company.cnpj)
                            : null}
                        </p>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-500">
                        Atividade Principal
                      </Label>
                      <p className="text-sm mt-1 font-medium">
                        {process.company?.principalActivity || "Não informado"}
                      </p>
                    </div>

                    <div>
                      <Label className="text-xs font-medium text-gray-500">
                        Capital Social
                      </Label>
                      <p className="text-sm mt-1 font-medium">
                        {process.company?.capitalSocial
                          ? formatCurrency(process.company.capitalSocial)
                          : "R$ 0,00"}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Tab: Documentos */}
            <TabsContent value="documents" className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Documentos do Processo
                  </h3>
                  <p className="text-sm text-gray-500">
                    {process.documents.length} documentos •{" "}
                    {
                      process.documents.filter((d) => d.status === "VERIFIED")
                        .length
                    }{" "}
                    verificados
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="Buscar documentos..."
                    className="w-48 h-9 text-sm"
                  />
                  <DocumentUploadModal
                    processId={process.id}
                    onUploadSuccess={fetchProcess}
                    operatorProcessId={process.operator?.id}
                  />
                </div>
              </div>

              <div className="grid gap-3">
                {process.documents.map((doc: DocumentWithRelations) => (
                  <Card
                    key={doc.id}
                    className="shadow-md border-0 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className={cn(
                              "p-2 rounded-lg shadow-md",
                              doc.status === "VERIFIED"
                                ? "bg-gradient-to-br from-emerald-400 to-emerald-500 text-white"
                                : doc.status === "REJECTED"
                                ? "bg-gradient-to-br from-red-400 to-red-500 text-white"
                                : "bg-gradient-to-br from-blue-400 to-blue-500 text-white"
                            )}
                          >
                            <FileText className="h-5 w-5" />
                          </div>

                          <div>
                            <h4 className="font-semibold text-gray-900 text-sm">
                              {doc.name}
                            </h4>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs font-medium h-5",
                                  doc.status === "VERIFIED"
                                    ? "border-emerald-200 text-emerald-700 bg-emerald-50"
                                    : doc.status === "REJECTED"
                                    ? "border-red-200 text-red-700 bg-red-50"
                                    : "border-blue-200 text-blue-700 bg-blue-50"
                                )}
                              >
                                {translateDocumentStatus(doc.status)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(
                                  new Date(doc.createdAt).toISOString()
                                )}
                              </span>
                              {doc.uploadedBy && (
                                <span className="text-xs text-gray-500">
                                  por {doc.uploadedBy.name}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                          >
                            <Eye className="h-3 w-3" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1 h-8 text-xs"
                          >
                            <Download className="h-3 w-3" />
                            Download
                          </Button>
                          {doc.status !== "VERIFIED" && (
                            <DocumentVerificationModal
                              document={doc}
                              processId={process.id}
                              operatorId={operator?.id}
                              onVerificationSuccess={fetchProcess}
                            />
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {process.documents.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium">
                      Nenhum documento anexado
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Faça o upload dos documentos necessários para o processo
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Tab: Análise - Focada apenas na análise */}
            <TabsContent value="analysis" className="space-y-4">
              {process.status === "CREATED" ? (
                <Card className="shadow-lg border-0 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-100 overflow-hidden">
                  <CardContent className="p-6 text-center relative">
                    {/* Decorative background elements */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-200/20 rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="absolute bottom-0 left-0 w-20 h-20 bg-green-200/20 rounded-full translate-y-10 -translate-x-10"></div>

                    <div className="relative z-10 space-y-4">
                      <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-lg">
                        <Zap className="h-8 w-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-emerald-800 mb-1">
                          Iniciar Análise do Processo
                        </h2>
                        <p className="text-emerald-600">
                          Clique para começar a análise do processo de{" "}
                          <span className="font-semibold">
                            {process.client.name}
                          </span>
                        </p>
                      </div>
                      <Button
                        onClick={handleStartProcess}
                        size="lg"
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg px-6 py-3 font-semibold"
                      >
                        <Zap className="h-5 w-5 mr-2" />
                        Iniciar Processo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <div className="max-w-5xl mx-auto space-y-4">
                  {/* Header com Status Geral - Mais compacto */}
                  <div className="bg-gradient-to-r from-emerald-600 to-green-600 rounded-lg p-4 text-white shadow-lg relative overflow-hidden">
                    {/* Decorative elements - menores */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -translate-y-10 translate-x-10"></div>
                    <div className="absolute bottom-0 left-0 w-16 h-16 bg-white/10 rounded-full translate-y-8 -translate-x-8"></div>

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 bg-white/20 rounded-md backdrop-blur-sm">
                            <ClipboardCheck className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold mb-0.5">
                              Análise do Processo
                            </h2>
                            <p className="text-emerald-100 text-sm">
                              Processo #{process.id.slice(-8)} •{" "}
                              {process.client.name}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold mb-0.5">
                            {process.progress}%
                          </div>
                          <div className="text-emerald-100 text-xs">
                            Concluído
                          </div>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="relative mb-3">
                        <div className="bg-white/20 rounded-full h-2 backdrop-blur-sm overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-white to-emerald-200 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${process.progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between mt-1.5 text-xs text-emerald-100">
                          <span>Iniciado</span>
                          <span>Em Análise</span>
                          <span>Finalizado</span>
                        </div>
                      </div>

                      {/* Resumo da Análise - Mais compacto */}
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/10 backdrop-blur-sm rounded-md p-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-200" />
                            <span className="text-xs font-medium text-white">
                              Concluídos
                            </span>
                          </div>
                          <div className="text-lg font-bold text-emerald-200">
                            {Object.values(checkedItems).filter(Boolean).length}
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-md p-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-200" />
                            <span className="text-xs font-medium text-white">
                              Pendências
                            </span>
                          </div>
                          <div className="text-lg font-bold text-amber-200">
                            {pendingItems.length +
                              (process.pendingTypeData?.length || 0)}
                          </div>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-md p-2">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <Clock className="h-3.5 w-3.5 text-blue-200" />
                            <span className="text-xs font-medium text-white">
                              Atual
                            </span>
                          </div>
                          <div className="text-sm font-bold text-blue-200">
                            {expandedStep !== null
                              ? Object.values(MEI_ANALYSIS_STEPS)
                                  [expandedStep]?.title.split(" ")
                                  .slice(0, 2)
                                  .join(" ")
                              : "Nenhuma"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Steps Navigator - Mais compacto */}
                  <div className="grid grid-cols-5 gap-3">
                    {Object.values(MEI_ANALYSIS_STEPS).map((step, index) => {
                      const isCompleted = process.progress >= step.progress;
                      const isCurrent = expandedStep === index;
                      const isNext =
                        !isCompleted &&
                        process.progress < step.progress &&
                        index === (expandedStep || 0);

                      return (
                        <div
                          key={step.id}
                          className={cn(
                            "p-3 rounded-lg border transition-all duration-200 cursor-pointer hover:shadow-md",
                            isCompleted
                              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                              : isCurrent || isNext
                              ? "bg-blue-50 border-blue-200 text-blue-800 ring-1 ring-blue-200"
                              : "bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300"
                          )}
                          onClick={() => setExpandedStep(index)}
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <div
                              className={cn(
                                "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                                isCompleted
                                  ? "bg-emerald-500 text-white"
                                  : isCurrent || isNext
                                  ? "bg-blue-500 text-white"
                                  : "bg-gray-300 text-gray-600"
                              )}
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="h-3 w-3" />
                              ) : (
                                index + 1
                              )}
                            </div>
                            <div className="text-xs font-semibold">
                              {step.progress}%
                            </div>
                          </div>
                          <div className="text-xs font-medium leading-tight">
                            {step.title}
                          </div>

                          {/* Progress indicator - menor */}
                          <div className="mt-2">
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div
                                className={cn(
                                  "h-1 rounded-full transition-all duration-300",
                                  isCompleted
                                    ? "bg-emerald-500"
                                    : isCurrent || isNext
                                    ? "bg-blue-500"
                                    : "bg-gray-300"
                                )}
                                style={{
                                  width: isCompleted
                                    ? "100%"
                                    : isCurrent || isNext
                                    ? "50%"
                                    : "0%",
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Etapa Atual Detalhada - Mais compacta */}
                  {expandedStep !== null && (
                    <Card className="shadow-lg border-0 bg-white">
                      <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white p-5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                              {React.createElement(
                                Object.values(MEI_ANALYSIS_STEPS)[expandedStep]
                                  ?.icon || CheckCircle2,
                                {
                                  className: "h-5 w-5 text-white",
                                }
                              )}
                            </div>
                            <div>
                              <CardTitle className="text-lg font-bold mb-1">
                                {
                                  Object.values(MEI_ANALYSIS_STEPS)[
                                    expandedStep
                                  ]?.title
                                }
                              </CardTitle>
                              <p className="text-emerald-100 text-sm">
                                {
                                  Object.values(MEI_ANALYSIS_STEPS)[
                                    expandedStep
                                  ]?.description
                                }
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold">
                              {
                                Object.values(MEI_ANALYSIS_STEPS)[expandedStep]
                                  ?.progress
                              }
                              %
                            </div>
                            <div className="text-emerald-100 text-xs">Meta</div>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="p-5">
                        <div className="space-y-3">
                          {Object.values(MEI_ANALYSIS_STEPS)[
                            expandedStep
                          ]?.checkItems?.map(
                            (item: CheckItem, itemIndex: number) => {
                              const checkboxKey = `${
                                Object.values(MEI_ANALYSIS_STEPS)[expandedStep]
                                  .id
                              }-${item.id}`;
                              const isPendingItem =
                                item.pendingTypeData &&
                                item.pendingTypeData.some((type) =>
                                  pendingItems.includes(type)
                                );
                              const isChecked =
                                checkedItems[checkboxKey] || false;

                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "relative p-3 rounded-md border transition-all duration-200",
                                    isPendingItem
                                      ? "border-amber-200 bg-amber-50/50"
                                      : isChecked
                                      ? "border-emerald-200 bg-emerald-50/50"
                                      : "border-gray-200 bg-white hover:border-gray-300"
                                  )}
                                >
                                  {/* Item Number Badge - menor */}
                                  <div
                                    className={cn(
                                      "absolute -top-1.5 -left-1.5 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                                      isPendingItem
                                        ? "bg-amber-500 text-white"
                                        : isChecked
                                        ? "bg-emerald-500 text-white"
                                        : "bg-gray-400 text-white"
                                    )}
                                  >
                                    {itemIndex + 1}
                                  </div>

                                  <div className="flex items-start gap-3">
                                    <Checkbox
                                      id={checkboxKey}
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        setCheckedItems({
                                          ...checkedItems,
                                          [checkboxKey]: !!checked,
                                        });
                                      }}
                                      className="h-4 w-4 mt-0.5 data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                    />

                                    <div className="flex-1">
                                      <Label
                                        htmlFor={checkboxKey}
                                        className="text-sm font-medium text-gray-800 leading-snug cursor-pointer"
                                      >
                                        {item.label}
                                        {item.required && (
                                          <span className="text-red-500 ml-1">
                                            *
                                          </span>
                                        )}
                                      </Label>

                                      {/* Exibição dos dados atuais */}
                                      {(() => {
                                        const currentData = getCurrentData(
                                          item.id
                                        );
                                        if (currentData) {
                                          return (
                                            <div className="mt-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                                              <div className="flex items-center gap-1.5 mb-1">
                                                <CheckCircle2 className="h-3 w-3 text-blue-600" />
                                                <span className="text-xs text-blue-800 font-medium">
                                                  Dados encontrados:
                                                </span>
                                              </div>
                                              <div className="text-xs text-blue-900 font-mono break-words bg-white px-2 py-1 rounded border">
                                                {currentData}
                                              </div>
                                            </div>
                                          );
                                        } else {
                                          return (
                                            <div className="mt-2 p-2 bg-amber-50 rounded-md border border-amber-200">
                                              <div className="flex items-center gap-1.5">
                                                <AlertTriangle className="h-3 w-3 text-amber-600" />
                                                <span className="text-xs text-amber-800 font-medium">
                                                  Dados não informados -
                                                  Verificar se é necessário
                                                </span>
                                              </div>
                                            </div>
                                          );
                                        }
                                      })()}

                                      {/* Status Badges - menores */}
                                      <div className="flex items-center gap-1.5 mt-1.5">
                                        {item.required && (
                                          <Badge
                                            variant="outline"
                                            className="bg-red-50 text-red-700 border-red-200 text-xs h-4 px-1.5"
                                          >
                                            <Flag className="h-2.5 w-2.5 mr-1" />
                                            Obrigatório
                                          </Badge>
                                        )}
                                        {isPendingItem && (
                                          <Badge
                                            variant="outline"
                                            className="bg-amber-100 text-amber-800 border-amber-300 text-xs h-4 px-1.5"
                                          >
                                            <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                                            Pendente
                                          </Badge>
                                        )}
                                        {isChecked && (
                                          <Badge
                                            variant="outline"
                                            className="bg-emerald-100 text-emerald-800 border-emerald-300 text-xs h-4 px-1.5"
                                          >
                                            <CheckCircle2 className="h-2.5 w-2.5 mr-1" />
                                            Concluído
                                          </Badge>
                                        )}
                                      </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {item.pendingTypeData &&
                                      item.pendingTypeData.length > 0 && (
                                        <div className="flex items-center gap-1.5">
                                          {!isPendingItem ? (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-1 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-700 h-7 px-2 text-xs"
                                              onClick={() =>
                                                handleMarkAsPending(item)
                                              }
                                            >
                                              <AlertTriangle className="h-3 w-3" />
                                              Marcar Pendente
                                            </Button>
                                          ) : (
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              className="gap-1 bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100 h-7 px-2 text-xs"
                                              onClick={() =>
                                                handleRemovePending(item)
                                              }
                                            >
                                              <CheckCircle2 className="h-3 w-3" />
                                              Remover Pendência
                                            </Button>
                                          )}
                                        </div>
                                      )}
                                  </div>
                                </div>
                              );
                            }
                          )}

                          {/* Botão de Concluir Etapa - Mais compacto */}
                          {expandedStep !== null && (
                            <div className="mt-4 p-3 bg-gray-50 rounded-md border">
                              {(() => {
                                const currentStep =
                                  Object.values(MEI_ANALYSIS_STEPS)[
                                    expandedStep
                                  ];
                                const canComplete =
                                  canCompleteStep(currentStep);
                                const hasPendingData =
                                  process?.pendingTypeData &&
                                  process.pendingTypeData.length > 0;
                                const hasLocalPending =
                                  pendingItems && pendingItems.length > 0;
                                const hasUnsavedChanges = pendingItemsChanged;

                                let disabledReason = "";
                                if (hasPendingData) {
                                  disabledReason = `${process.pendingTypeData.length} item(s) pendente(s) no processo`;
                                } else if (hasLocalPending) {
                                  disabledReason = `${pendingItems.length} pendência(s) não salva(s)`;
                                } else if (hasUnsavedChanges) {
                                  disabledReason =
                                    "Alterações de pendência não confirmadas";
                                } else if (!canComplete) {
                                  disabledReason =
                                    "Marque todos os itens obrigatórios";
                                }

                                return (
                                  <>
                                    <Button
                                      disabled={!canComplete}
                                      onClick={() =>
                                        handleStepComplete(currentStep)
                                      }
                                      className={cn(
                                        "w-full shadow-md text-white transition-all duration-200 font-semibold py-3",
                                        canComplete
                                          ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700"
                                          : "bg-gray-400 cursor-not-allowed opacity-60"
                                      )}
                                      size="default"
                                    >
                                      <div className="flex items-center justify-center gap-2">
                                        {canComplete ? (
                                          <>
                                            <CheckCircle2 className="h-4 w-4" />
                                            <span className="text-sm">
                                              Concluir Etapa
                                            </span>
                                            <div className="px-2 py-0.5 bg-white/20 rounded text-xs">
                                              {currentStep.progress}%
                                            </div>
                                          </>
                                        ) : (
                                          <>
                                            <AlertTriangle className="h-4 w-4" />
                                            <span className="text-sm">
                                              Não é Possível Concluir
                                            </span>
                                          </>
                                        )}
                                      </div>
                                    </Button>

                                    {!canComplete && disabledReason && (
                                      <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded-md">
                                        <div className="flex items-start gap-2">
                                          <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                          <div>
                                            <p className="text-xs font-medium text-amber-800">
                                              Não é possível concluir a etapa
                                            </p>
                                            <p className="text-xs text-amber-700 mt-0.5">
                                              {disabledReason}
                                            </p>
                                            {(hasPendingData ||
                                              hasLocalPending ||
                                              hasUnsavedChanges) && (
                                              <p className="text-xs text-amber-600 mt-1 font-medium">
                                                💡 Resolva as pendências antes
                                                de continuar.
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Tab: Timeline/Histórico - Nova aba dedicada */}
            <TabsContent value="timeline" className="space-y-4">
              <div className="max-w-5xl mx-auto">
                <Card className="shadow-lg border-0">
                  <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg p-6">
                    <CardTitle className="flex items-center gap-3 text-xl">
                      <Clock className="h-6 w-6" />
                      Histórico Completo do Processo
                    </CardTitle>
                    <p className="text-amber-100 text-sm mt-2">
                      Acompanhe todas as ações e alterações realizadas no
                      processo
                    </p>
                  </CardHeader>
                  <CardContent className="p-6">
                    {/* Estatísticas do Timeline */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-blue-500 rounded-lg">
                            <Activity className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-900">
                              Total de Eventos
                            </p>
                            <p className="text-lg font-bold text-blue-700">
                              {process.timeline.length}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-emerald-500 rounded-lg">
                            <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-emerald-900">
                              Eventos de Sucesso
                            </p>
                            <p className="text-lg font-bold text-emerald-700">
                              {
                                process.timeline.filter(
                                  (event) => event.type === "SUCCESS"
                                ).length
                              }
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-amber-500 rounded-lg">
                            <Clock className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-amber-900">
                              Último Evento
                            </p>
                            <p className="text-sm font-bold text-amber-700">
                              {process.timeline.length > 0
                                ? formatTimeAgoFixed(
                                    process.timeline[0].createdAt.toString()
                                  )
                                : "Nenhum evento"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Filtros do Timeline */}
                    <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">
                          Filtrar por tipo:
                        </label>
                        <Select defaultValue="all">
                          <SelectTrigger className="w-40 h-8">
                            <SelectValue placeholder="Todos" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="STATUS">Status</SelectItem>
                            <SelectItem value="DOCUMENT">Documentos</SelectItem>
                            <SelectItem value="DATA">Dados</SelectItem>
                            <SelectItem value="ANALYSIS">Análise</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Atualizar
                      </Button>
                    </div>

                    {/* Timeline de Eventos */}
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {process.timeline.length > 0 ? (
                        process.timeline.map((event, index) => (
                          <div key={event.id} className="relative">
                            {/* Linha conectora */}
                            {index < process.timeline.length - 1 && (
                              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200"></div>
                            )}

                            <TimelineEvent event={event} />
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-gray-500">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Clock className="h-8 w-8 text-gray-400" />
                          </div>
                          <p className="text-lg font-medium">
                            Nenhum evento registrado
                          </p>
                          <p className="text-sm text-gray-400 mt-1">
                            O histórico será preenchido conforme o processo
                            avançar
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Ações do Timeline */}
                    {process.timeline.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-gray-600">
                            Mostrando {process.timeline.length} eventos
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Exportar Timeline
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2"
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver Detalhado
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* FERRAMENTAS - LATERAL DIREITA */}
        <div
          className={cn(
            "transition-all duration-300 bg-white/95 backdrop-blur-sm border-l border-gray-200/60 shadow-lg overflow-hidden",
            rightPanelMinimized ? "w-16" : "w-72"
          )}
        >
          <div className="p-3 border-b bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex items-center justify-between">
            {!rightPanelMinimized && (
              <h3 className="font-medium flex items-center gap-2 text-sm">
                <StickyNote className="h-4 w-4" />
                Ferramentas
              </h3>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setRightPanelMinimized(!rightPanelMinimized)}
              className="h-7 w-7 text-white hover:bg-emerald-600 rounded-full"
            >
              {rightPanelMinimized ? (
                <Maximize2 className="h-3 w-3" />
              ) : (
                <Minimize2 className="h-3 w-3" />
              )}
            </Button>
          </div>

          {!rightPanelMinimized && (
            <Tabs
              value={activeToolTab}
              onValueChange={setActiveToolTab}
              className="h-full"
            >
              <TabsList className="grid w-full grid-cols-5 bg-white border-b">
                <TabsTrigger value="notes" className="text-xs">
                  Notas
                </TabsTrigger>
                <TabsTrigger value="tasks" className="text-xs">
                  Tarefas
                </TabsTrigger>
                <TabsTrigger value="reminders" className="text-xs">
                  Lembretes
                </TabsTrigger>
                <TabsTrigger value="tools" className="text-xs">
                  Contábil
                </TabsTrigger>
                <TabsTrigger value="actions" className="text-xs">
                  Ações
                </TabsTrigger>
              </TabsList>

              {/* Tab: Notas - Mais compacto */}
              <TabsContent
                value="notes"
                className="p-3 space-y-3 h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Nova nota..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="text-xs h-16"
                      rows={2}
                    />
                    <div className="flex items-center gap-1">
                      <Select
                        value={noteType}
                        onValueChange={(
                          value: "PRIVATE" | "INTERNAL" | "PUBLIC"
                        ) => setNoteType(value)}
                      >
                        <SelectTrigger className="w-20 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="PRIVATE">Privada</SelectItem>
                          <SelectItem value="INTERNAL">Interna</SelectItem>
                          <SelectItem value="PUBLIC">Pública</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newNote.trim()) {
                            addNote(newNote, noteType, "MEDIUM");
                            setNewNote("");
                          }
                        }}
                        disabled={!newNote.trim()}
                        className="h-7 text-xs flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {notes.map((note) => (
                      <Card key={note.id} className="p-2 shadow-sm">
                        <div className="flex items-start justify-between gap-1">
                          <div className="flex-1">
                            <p className="text-xs text-gray-800 leading-relaxed">
                              {note.content}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs h-4",
                                  note.type === "PRIVATE"
                                    ? "border-blue-200 text-blue-700 bg-blue-50"
                                    : note.type === "INTERNAL"
                                    ? "border-amber-200 text-amber-700 bg-amber-50"
                                    : "border-emerald-200 text-emerald-700 bg-emerald-50"
                                )}
                              >
                                {note.type === "PRIVATE"
                                  ? "Privada"
                                  : note.type === "INTERNAL"
                                  ? "Interna"
                                  : "Pública"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgoFixed(note.createdAt)}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => toggleNotePin(note.id)}
                              className="h-5 w-5"
                            >
                              <PinIcon
                                className={cn(
                                  "h-3 w-3",
                                  note.pinned
                                    ? "text-amber-500"
                                    : "text-gray-400"
                                )}
                              />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => deleteNote(note.id)}
                              className="h-5 w-5 text-red-500"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {notes.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <StickyNote className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">Nenhuma nota</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Tarefas - Mais compacto */}
              <TabsContent
                value="tasks"
                className="p-3 space-y-3 h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="space-y-2">
                  <div className="space-y-2">
                    <Input
                      placeholder="Nova tarefa..."
                      value={newTask}
                      onChange={(e) => setNewTask(e.target.value)}
                      className="text-xs h-7"
                    />
                    <div className="flex items-center gap-1">
                      <Select
                        value={taskPriority}
                        onValueChange={(value: "LOW" | "MEDIUM" | "HIGH") =>
                          setTaskPriority(value)
                        }
                      >
                        <SelectTrigger className="w-16 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="LOW">Baixa</SelectItem>
                          <SelectItem value="MEDIUM">Média</SelectItem>
                          <SelectItem value="HIGH">Alta</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        onClick={() => {
                          if (newTask.trim()) {
                            addTask(newTask, "", taskPriority);
                            setNewTask("");
                          }
                        }}
                        disabled={!newTask.trim()}
                        className="h-7 text-xs flex-1"
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {tasks.map((task) => (
                      <Card key={task.id} className="p-2 shadow-sm">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={task.status === "COMPLETED"}
                            onCheckedChange={() => toggleTask(task.id)}
                            className="mt-0.5 h-4 w-4"
                          />
                          <div className="flex-1">
                            <p
                              className={cn(
                                "text-xs",
                                task.status === "COMPLETED"
                                  ? "line-through text-gray-500"
                                  : "text-gray-800"
                              )}
                            >
                              {task.title}
                            </p>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge
                                variant="outline"
                                className={cn(
                                  "text-xs h-4",
                                  task.priority === "HIGH"
                                    ? "border-red-200 text-red-700 bg-red-50"
                                    : task.priority === "MEDIUM"
                                    ? "border-amber-200 text-amber-700 bg-amber-50"
                                    : "border-gray-200 text-gray-700 bg-gray-50"
                                )}
                              >
                                {task.priority === "HIGH"
                                  ? "Alta"
                                  : task.priority === "MEDIUM"
                                  ? "Média"
                                  : "Baixa"}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatTimeAgoFixed(task.createdAt)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTask(task.id)}
                            className="h-5 w-5 text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {tasks.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <CheckSquare className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">Nenhuma tarefa</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Lembretes - Mais compacto */}
              <TabsContent
                value="reminders"
                className="p-3 space-y-3 h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="space-y-2">
                  {!isAddingReminder ? (
                    <Button
                      onClick={() => setIsAddingReminder(true)}
                      size="sm"
                      className="w-full gap-1 h-7 text-xs"
                    >
                      <Plus className="h-3 w-3" />
                      Novo Lembrete
                    </Button>
                  ) : (
                    <div className="space-y-2 p-2 border border-gray-200 rounded-lg">
                      <Input
                        placeholder="Título..."
                        value={reminderTitle}
                        onChange={(e) => setReminderTitle(e.target.value)}
                        className="text-xs h-7"
                      />
                      <Input
                        type="datetime-local"
                        value={reminderDate}
                        onChange={(e) => setReminderDate(e.target.value)}
                        className="text-xs h-7"
                      />
                      <Select
                        value={reminderType}
                        onValueChange={(
                          value:
                            | "DEADLINE"
                            | "FOLLOWUP"
                            | "MEETING"
                            | "DOCUMENT"
                        ) => setReminderType(value)}
                      >
                        <SelectTrigger className="h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="DEADLINE">Prazo</SelectItem>
                          <SelectItem value="FOLLOWUP">Follow-up</SelectItem>
                          <SelectItem value="MEETING">Reunião</SelectItem>
                          <SelectItem value="DOCUMENT">Documento</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          onClick={() => {
                            setIsAddingReminder(false);
                            setReminderTitle("");
                            setReminderDate("");
                            setNewReminder("");
                          }}
                          variant="outline"
                          className="h-7 text-xs flex-1"
                        >
                          Cancelar
                        </Button>
                        <Button
                          size="sm"
                          onClick={addReminder}
                          disabled={!reminderTitle.trim() || !reminderDate}
                          className="h-7 text-xs flex-1"
                        >
                          Salvar
                        </Button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    {reminders.map((reminder) => (
                      <Card key={reminder.id} className="p-2 shadow-sm">
                        <div className="flex items-start gap-2">
                          <Checkbox
                            checked={reminder.completed}
                            onCheckedChange={() =>
                              toggleReminderCompleted(reminder.id)
                            }
                            className="mt-0.5 h-4 w-4"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-1">
                              {getReminderIcon(reminder.type)}
                              <p
                                className={cn(
                                  "text-xs font-medium",
                                  reminder.completed
                                    ? "line-through text-gray-500"
                                    : "text-gray-800"
                                )}
                              >
                                {reminder.title}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 mt-1">
                              <Badge variant="outline" className="text-xs h-4">
                                {getReminderTypeDisplay(reminder.type)}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatDate(reminder.dueDate)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteReminder(reminder.id)}
                            className="h-5 w-5 text-red-500"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                    {reminders.length === 0 && (
                      <div className="text-center py-6 text-gray-500">
                        <Bell className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                        <p className="text-xs">Nenhum lembrete</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Ferramentas Contábeis - Nova aba */}
              <TabsContent
                value="tools"
                className="p-3 space-y-3 h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="space-y-3">
                  {/* Calculadoras */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Calculator className="h-3 w-3" />
                      Calculadoras
                    </h4>
                    <div className="grid gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/atspo/pgmei.app/identificacao",
                            "_blank"
                          )
                        }
                      >
                        <Calculator className="h-3 w-3 text-blue-600" />
                        DAS MEI
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://www8.receita.fazenda.gov.br/simplesnacional/aplicacoes/calculadora/",
                            "_blank"
                          )
                        }
                      >
                        <Calculator className="h-3 w-3 text-green-600" />
                        Simples Nacional
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() => setShowProlaboreCalc(!showProlaboreCalc)}
                      >
                        <Calculator className="h-3 w-3 text-purple-600" />
                        Pró-labore
                      </Button>

                      {/* Calculadora de Pró-labore expansível */}
                      {showProlaboreCalc && (
                        <Card className="p-2 shadow-sm border mt-1">
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 mb-1">
                              <Calculator className="h-3 w-3 text-purple-600" />
                              <span className="text-xs font-medium">
                                Calc. Pró-labore
                              </span>
                            </div>
                            <Input
                              placeholder="Faturamento mensal"
                              value={prolaboreValue}
                              onChange={(e) =>
                                setProlaboreValue(e.target.value)
                              }
                              className="text-xs h-6"
                            />
                            {prolaboreValue && (
                              <div className="bg-purple-50 p-2 rounded text-xs">
                                <div className="font-medium text-purple-800">
                                  Sugestão:
                                </div>
                                <div className="text-purple-700">
                                  Min: R${" "}
                                  {(
                                    parseFloat(
                                      prolaboreValue.replace(/[^\d]/g, "")
                                    ) * 0.05
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                                <div className="text-purple-700">
                                  Max: R${" "}
                                  {(
                                    parseFloat(
                                      prolaboreValue.replace(/[^\d]/g, "")
                                    ) * 0.28
                                  ).toLocaleString("pt-BR", {
                                    minimumFractionDigits: 2,
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        </Card>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Consultas */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <FileText className="h-3 w-3" />
                      Consultas
                    </h4>
                    <div className="grid gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://concla.ibge.gov.br/busca-online-cnae.html",
                            "_blank"
                          )
                        }
                      >
                        <FileText className="h-3 w-3 text-blue-600" />
                        Consulta CNAE
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://servicos.receita.fazenda.gov.br/servicos/cpf/consultasituacao/consultacpf.asp",
                            "_blank"
                          )
                        }
                      >
                        <User2 className="h-3 w-3 text-green-600" />
                        Situação CPF
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://solucoes.receita.fazenda.gov.br/servicos/cnpjreva/cnpjreva_solicitacao.asp",
                            "_blank"
                          )
                        }
                      >
                        <Building2 className="h-3 w-3 text-purple-600" />
                        Comprovante CNPJ
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Sistemas Oficiais */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <ExternalLink className="h-3 w-3" />
                      Sistemas Oficiais
                    </h4>
                    <div className="grid gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
                            "_blank"
                          )
                        }
                      >
                        <Building2 className="h-3 w-3 text-emerald-600" />
                        Portal MEI
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://www8.receita.fazenda.gov.br/simplesnacional/",
                            "_blank"
                          )
                        }
                      >
                        <FileText className="h-3 w-3 text-blue-600" />
                        Simples Nacional
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                        onClick={() =>
                          window.open(
                            "https://www.gov.br/receitafederal/pt-br",
                            "_blank"
                          )
                        }
                      >
                        <Flag className="h-3 w-3 text-red-600" />
                        Receita Federal
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Ferramentas Rápidas */}
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      Ferramentas Rápidas
                    </h4>

                    {/* Mini Calculadora de DAS */}
                    <Card className="p-2 shadow-sm border mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <Calculator className="h-3 w-3 text-emerald-600" />
                        <span className="text-xs font-medium">
                          DAS MEI 2025
                        </span>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          Comércio/Indústria:
                        </div>
                        <div className="text-sm font-bold text-emerald-600">
                          R${" "}
                          {calculateDASMEI("comercio").toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          INSS: R${" "}
                          {(
                            MEI_VALUES.salarioMinimo * MEI_VALUES.inssRate
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          + ICMS: R$ {MEI_VALUES.icmsValue.toFixed(2)}
                        </div>

                        <div className="text-xs text-gray-600 mt-1">
                          Serviços:
                        </div>
                        <div className="text-sm font-bold text-blue-600">
                          R${" "}
                          {calculateDASMEI("servicos").toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          INSS: R${" "}
                          {(
                            MEI_VALUES.salarioMinimo * MEI_VALUES.inssRate
                          ).toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}{" "}
                          + ISS: R$ {MEI_VALUES.issValue.toFixed(2)}
                        </div>
                      </div>
                    </Card>

                    {/* Limite MEI */}
                    <Card className="p-2 shadow-sm border mb-2">
                      <div className="flex items-center gap-1 mb-1">
                        <TrendingUp className="h-3 w-3 text-amber-600" />
                        <span className="text-xs font-medium">
                          Limite MEI 2025
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            setShowFaturamentoCalc(!showFaturamentoCalc)
                          }
                          className="ml-auto h-4 w-4 p-0"
                        >
                          <Calculator className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-gray-600">
                          Limite anual:
                        </div>
                        <div className="text-sm font-bold text-amber-600">
                          R${" "}
                          {MEI_VALUES.limiteAnual.toLocaleString("pt-BR", {
                            minimumFractionDigits: 2,
                          })}
                        </div>
                        <div className="text-xs text-gray-500">
                          Mensal: R${" "}
                          {(MEI_VALUES.limiteAnual / 12).toLocaleString(
                            "pt-BR",
                            { minimumFractionDigits: 2 }
                          )}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          💡 Acima de 20% = desenquadramento
                        </div>

                        {/* Simulador de Faturamento expansível */}
                        {showFaturamentoCalc && (
                          <div className="mt-2 p-2 bg-amber-50 rounded border-t">
                            <div className="text-xs font-medium text-amber-800 mb-1">
                              Verificar Faturamento:
                            </div>
                            <Input
                              placeholder="Faturamento anual atual"
                              value={faturamentoMEI}
                              onChange={(e) =>
                                setFaturamentoMEI(e.target.value)
                              }
                              className="text-xs h-6 mb-1"
                            />
                            {faturamentoMEI && (
                              <div className="text-xs">
                                {(() => {
                                  const valor = parseFloat(
                                    faturamentoMEI.replace(/[^\d]/g, "")
                                  );
                                  const percentual =
                                    (valor / MEI_VALUES.limiteAnual) * 100;
                                  const limite20 = MEI_VALUES.limiteAnual * 1.2;

                                  if (valor <= MEI_VALUES.limiteAnual) {
                                    return (
                                      <div className="text-green-700 bg-green-100 p-1 rounded">
                                        ✅ Dentro do limite (
                                        {percentual.toFixed(1)}%)
                                      </div>
                                    );
                                  } else if (valor <= limite20) {
                                    return (
                                      <div className="text-amber-700 bg-amber-100 p-1 rounded">
                                        ⚠️ Excesso de{" "}
                                        {(
                                          (valor / MEI_VALUES.limiteAnual - 1) *
                                          100
                                        ).toFixed(1)}
                                        % - Pagará DAS complementar
                                      </div>
                                    );
                                  } else {
                                    return (
                                      <div className="text-red-700 bg-red-100 p-1 rounded">
                                        ❌ Desenquadramento obrigatório
                                      </div>
                                    );
                                  }
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>

                    {/* Consulta Rápida CNAE */}
                    <Card className="p-2 shadow-sm border">
                      <div className="flex items-center gap-1 mb-1">
                        <FileText className="h-3 w-3 text-blue-600" />
                        <span className="text-xs font-medium">CNAE Rápido</span>
                      </div>
                      <Input
                        placeholder="Ex: 4751-2/01"
                        value={cnaeCode}
                        onChange={(e) => setCnaeCode(e.target.value)}
                        className="text-xs h-6 mb-1"
                      />
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white h-6 text-xs"
                          onClick={() =>
                            window.open(
                              "https://concla.ibge.gov.br/busca-online-cnae.html",
                              "_blank"
                            )
                          }
                        >
                          Consultar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-6 text-xs px-2"
                          onClick={() =>
                            window.open(
                              "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor/quero-ser-mei/atividades-permitidas",
                              "_blank"
                            )
                          }
                        >
                          MEI
                        </Button>
                      </div>
                      {cnaeCode && cnaeCode.length >= 7 && (
                        <div className="mt-1">
                          {(() => {
                            const resultado = checkCNAEMEI(cnaeCode);
                            if (resultado?.permitido) {
                              return (
                                <div className="p-1 bg-green-50 rounded text-xs">
                                  <div className="text-green-700 font-medium">
                                    ✅ {resultado.tipo}
                                  </div>
                                  <div className="text-green-600">
                                    Atividade permitida para MEI
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div className="p-1 bg-blue-50 rounded text-xs">
                                  <div className="text-blue-700 font-medium">
                                    📋 Verificar Lista Oficial
                                  </div>
                                  <div className="text-blue-600">
                                    Consulte a lista completa de atividades MEI
                                  </div>
                                </div>
                              );
                            }
                          })()}
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </TabsContent>

              {/* Tab: Ações Rápidas - Mais compacto */}
              <TabsContent
                value="actions"
                className="p-3 space-y-3 h-[calc(100vh-200px)] overflow-y-auto"
              >
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Comunicação
                    </h4>
                    <div className="grid gap-1">
                      <Button
                        onClick={handlePhoneCall}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                      >
                        <Phone className="h-3 w-3 text-emerald-600" />
                        Ligar
                      </Button>
                      <Button
                        onClick={handleSendEmail}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                      >
                        <Mail className="h-3 w-3 text-blue-600" />
                        Email
                      </Button>
                      <Button
                        onClick={handleWhatsApp}
                        variant="outline"
                        size="sm"
                        className="justify-start gap-2 h-8 text-xs"
                      >
                        <MessageSquare className="h-3 w-3 text-green-600" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Consultas
                    </h4>
                    <Button
                      onClick={handleExternalConsultation}
                      variant="outline"
                      size="sm"
                      className="justify-start gap-2 w-full h-8 text-xs"
                    >
                      <ExternalLink className="h-3 w-3 text-purple-600" />
                      Abrir Sistemas
                    </Button>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-medium text-gray-700 mb-2">
                      Operador
                    </h4>
                    {process?.operatorId ? (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 rounded-lg mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                            <User2 className="h-3 w-3 text-white" />
                          </div>
                          <div>
                            <p className="text-xs font-medium text-emerald-800">
                              {process.operator.name}
                            </p>
                            <p className="text-xs text-emerald-600">
                              Responsável
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-2">
                        <AssignToMeButton
                          processId={process?.id || ""}
                          onAssignSuccess={() => {
                            fetchProcess();
                            loadNotes();
                            loadTasks();
                            loadReminders();
                          }}
                        />
                      </div>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAssignModalOpen(true)}
                      className="gap-2 w-full h-8 text-xs"
                    >
                      <User2 className="h-3 w-3" />
                      {process?.operatorId ? "Reatribuir" : "Atribuir"}
                    </Button>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          {/* Minimized state */}
          {rightPanelMinimized && (
            <div className="flex flex-col items-center gap-3 py-3">
              <div className="p-1.5 bg-emerald-100 rounded-lg">
                <StickyNote className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="p-1.5 bg-blue-100 rounded-lg">
                <CheckSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="p-1.5 bg-amber-100 rounded-lg">
                <Bell className="h-4 w-4 text-amber-600" />
              </div>
              <div className="p-1.5 bg-indigo-100 rounded-lg">
                <Calculator className="h-4 w-4 text-indigo-600" />
              </div>
              <div className="p-1.5 bg-purple-100 rounded-lg">
                <Phone className="h-4 w-4 text-purple-600" />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toaster */}
      <Toaster position="top-right" />

      {pendingItemsChanged && (
        <div className="fixed bottom-6 left-6 bg-white border-2 border-amber-200 shadow-2xl rounded-xl p-4 max-w-sm z-50">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-900">
                Alterações Pendentes
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Você tem alterações não salvas no processo.
              </p>
              <div className="flex gap-2 mt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setPendingItems([...previouslyPendingItems]);
                    setPendingItemsChanged(false);
                  }}
                  className="text-xs"
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={handleConfirmPendingChanges}
                  className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs"
                >
                  Salvar Alterações
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Atribuição de Operador */}
      <AssignOperatorModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        processId={process?.id || ""}
        currentOperatorId={process?.operatorId ? process.operatorId : undefined}
        onAssign={() => {
          fetchProcess();
          loadNotes();
          loadTasks();
          loadReminders();
          setIsAssignModalOpen(false);
        }}
      />
    </div>
  );
}
