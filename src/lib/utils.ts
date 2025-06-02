import {
  processPriorityTranslations,
  processStatusTranslations,
  processTypeTranslations,
  sourceTranslations,
  documentStatusTranslations,
  timelineEventCategoryTranslations,
  timelineEventTypeTranslations,
  processStatusColors,
} from "@/constants/translate";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCPF(cpf: string) {
  if (!cpf) return "";

  // Remove caracteres não numéricos
  cpf = cpf.replace(/\D/g, "");

  // Aplica a máscara
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

export function formatCNPJ(cnpj: string | undefined) {
  if (!cnpj) return "";

  // Remove caracteres não numéricos
  cnpj = cnpj.replace(/\D/g, "");

  // Aplica a máscara
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

export function formatPhone(phone: string) {
  if (!phone) return "";

  // Remove caracteres não numéricos
  phone = phone.replace(/\D/g, "");

  // Verifica se é celular (9 dígitos) ou fixo (8 dígitos)
  if (phone.length === 11) {
    return phone.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  }

  return phone.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
}

export function formatCurrency(value: string | number | undefined) {
  if (!value) return "R$ 0,00";

  const number = typeof value === "string" ? parseFloat(value) : value;

  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

export function formatDate(date: string | Date) {
  if (!date) return "";

  return new Date(date).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function formatStatus(status: string) {
  const statusMap: { [key: string]: string } = {
    PENDING_DOCS: "Pendente",
    IN_PROGRESS: "Em Andamento",
    COMPLETED: "Concluído",
    CANCELLED: "Cancelado",
  };

  return statusMap[status] || status;
}

export function formatPriority(priority: string) {
  const priorityMap: { [key: string]: string } = {
    LOW: "Baixa",
    NORMAL: "Normal",
    HIGH: "Alta",
    URGENT: "Urgente",
  };

  return priorityMap[priority] || priority;
}

export function getPriorityColor(priority: string) {
  const priorityColors = {
    HIGH: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    MEDIUM:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    LOW: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    Alta: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    Média:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    Baixa:
      "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  };
  return (
    priorityColors[priority as keyof typeof priorityColors] ||
    "bg-gray-100 text-gray-800"
  );
}

export const getSourceBadge = (source: string) => {
  const sourceConfig = {
    MANUAL: "bg-blue-100 text-blue-800",
    BOT: "bg-purple-100 text-purple-800",
    PLATFORM: "bg-amber-100 text-amber-800",
  };
  return sourceConfig[source as keyof typeof sourceConfig] || "";
};

export const getRoleOperator = (role: string) => {
  const roleConfig = {
    ADMIN: {
      translate: "Administrador",
      color: "bg-blue-100 text-blue-800",
      icon: "👑",
    },
    OPERATOR: {
      translate: "Operador Contabil",
      color: "bg-purple-100 text-purple-800",
      icon: "👨‍💼",
    },
  };
  return (
    roleConfig[role as keyof typeof roleConfig] || {
      color: "bg-gray-100 text-gray-800",
      icon: "ℹ️",
    }
  );
};

// Função para traduzir status do processo
export function translateProcessStatus(status: string) {
  return (
    processStatusTranslations[
      status as keyof typeof processStatusTranslations
    ] || status
  );
}

// Função para traduzir tipo do processo
export function translateProcessType(type: string) {
  return (
    processTypeTranslations[type as keyof typeof processTypeTranslations] ||
    type
  );
}

// Função para traduzir prioridade
export function translatePriority(priority: string) {
  return (
    processPriorityTranslations[
      priority as keyof typeof processPriorityTranslations
    ] || priority
  );
}

// Alias para translatePriority - para compatibilidade
export function translateProcessPriority(priority: string) {
  return (
    processPriorityTranslations[
      priority as keyof typeof processPriorityTranslations
    ] || priority
  );
}

// Função para traduzir fonte
export function translateSource(source: string) {
  return (
    sourceTranslations[source as keyof typeof sourceTranslations] || source
  );
}

// Função para traduzir status do documento
export function translateDocumentStatus(status: string) {
  return (
    documentStatusTranslations[
      status as keyof typeof documentStatusTranslations
    ] || status
  );
}

// Função para traduzir categoria do evento de timeline
export function translateTimelineEventCategory(category: string) {
  return (
    timelineEventCategoryTranslations[
      category as keyof typeof timelineEventCategoryTranslations
    ] || category
  );
}

// Função para traduzir tipo do evento de timeline
export function translateTimelineEventType(type: string) {
  return (
    timelineEventTypeTranslations[
      type as keyof typeof timelineEventTypeTranslations
    ] || type
  );
}

// Função para obter cor do status
export function getProcessStatusColor(status: string) {
  return processStatusColors[status] || "bg-gray-100 text-gray-800";
}

// Cores para fonte
export function getSourceColor(source: string) {
  const sourceColors = {
    MANUAL: "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
    SYSTEM:
      "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
    BOT: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
    PLATFORM:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
  };
  return (
    sourceColors[source as keyof typeof sourceColors] ||
    "bg-gray-100 text-gray-800"
  );
}

// Ícones para status
export function getStatusIcon(status: string) {
  const icons = {
    PENDING_DOCS: "⌛",
    IN_ANALYSIS: "🔍",
    DOCS_SENT: "📤",
    UNDER_REVIEW: "👀",
    APPROVED: "✅",
    COMPLETED: "🎉",
    CANCELLED: "❌",
    ON_HOLD: "⏸️",
  };
  return icons[status as keyof typeof icons] || "ℹ️";
}

// Função auxiliar para formatação de tempo relativo
export function formatTimeAgo(date: Date) {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return "agora mesmo";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}min`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
  return `${Math.floor(diffInSeconds / 86400)}d`;
}

// Função auxiliar para formatação de tempo
export function formatTime(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h${remainingMinutes}min`;
}

// função helper no início do arquivo
export const formatTimeDifference = (startDate: Date, endDate: Date) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(
    (diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );

  if (diffDays > 0) {
    return `${diffDays} dia${diffDays > 1 ? "s" : ""} e ${diffHours} hora${
      diffHours > 1 ? "s" : ""
    }`;
  }
  return `${diffHours} hora${diffHours > 1 ? "s" : ""}`;
};

// Função utilitária para verificar permissões de administrador
export const isAdminUser = (operator: { role?: string } | null): boolean => {
  return operator?.role === "ADMIN";
};

// Função utilitária para verificar permissões específicas
export const hasPermission = (
  operator: { role?: string } | null,
  permission:
    | "CHANGE_PRIORITY"
    | "DUPLICATE_PROCESS"
    | "MANAGE_OPERATORS"
    | "VIEW_ANALYTICS"
): boolean => {
  if (!operator) return false;

  const permissions = {
    ADMIN: [
      "CHANGE_PRIORITY",
      "DUPLICATE_PROCESS",
      "MANAGE_OPERATORS",
      "VIEW_ANALYTICS",
    ],
    OPERATOR: ["CHANGE_PRIORITY"],
  };

  return (
    permissions[operator.role as keyof typeof permissions]?.includes(
      permission
    ) || false
  );
};

// Funções para pagamento
export function formatPaymentAmount(amount: number | null): string {
  if (!amount) return "Não definido";
  return `R$ ${amount.toFixed(2).replace(".", ",")}`;
}

export function formatPaymentMethod(method: string | null): string {
  if (!method) return "Não definido";

  const methods: Record<string, string> = {
    PIX: "PIX",
    CREDIT_CARD: "Cartão de Crédito",
    CREDIT_CARD_INSTALLMENTS: "Cartão Parcelado",
    DEBIT_CARD: "Cartão de Débito",
    BOLETO: "Boleto Bancário",
  };

  return methods[method] || method;
}

export function getPaymentStatusColor(status: string): string {
  const statusColors: Record<string, string> = {
    AWAITING_PAYMENT: "bg-orange-100 text-orange-800 border-orange-200",
    PAYMENT_PENDING: "bg-yellow-100 text-yellow-800 border-yellow-200",
    PAYMENT_CONFIRMED: "bg-emerald-100 text-emerald-800 border-emerald-200",
    PAYMENT_FAILED: "bg-red-100 text-red-800 border-red-200",
  };

  return statusColors[status] || "bg-gray-100 text-gray-800 border-gray-200";
}

export function translatePaymentStatus(status: string): string {
  const translations: Record<string, string> = {
    AWAITING_PAYMENT: "Aguardando Pagamento",
    PAYMENT_PENDING: "Pagamento Pendente",
    PAYMENT_CONFIRMED: "Pagamento Confirmado",
    PAYMENT_FAILED: "Pagamento Falhado",
  };

  return translations[status] || status;
}

export function isPaymentOverdue(dueDate: string | null): boolean {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
}

export function getPaymentDaysUntilDue(dueDate: string | null): number | null {
  if (!dueDate) return null;

  const due = new Date(dueDate);
  const now = new Date();
  const diffTime = due.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

export function formatPaymentReference(reference: string | null): string {
  if (!reference) return "Não definido";

  // Formata referência para ser mais legível
  if (reference.startsWith("MEI-")) {
    return reference.replace("MEI-", "MEI #");
  }

  return reference;
}
