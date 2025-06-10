// Traduções para ProcessStatus
export const processStatusTranslations: Record<string, string> = {
  PENDING_DOCS: "Pendente de Documentos",
  IN_ANALYSIS: "Em Análise",
  ANALYZING_DOCS: "Análise de Documentos",
  ANALYZING_COMPANY: "Análise de Empresa",
  ANALYZING_DATA: "Análise de Dados",
  PENDING_COMPANY: "Pendente de Empresa",
  PENDING_DATA: "Pendente de Dados",
  DOCS_SENT: "Documentos Enviados",
  UNDER_REVIEW: "Em Revisão",
  APPROVED: "Aprovado",
  COMPLETED: "Finalizado",
  CANCELLED: "Cancelado",
  ON_HOLD: "Em Espera",
  CREATED: "Iniciado",
  AWAITING_PAYMENT: "Aguardando Pagamento",
  PAYMENT_PENDING: "Pagamento Pendente",
  PAYMENT_CONFIRMED: "Pagamento Confirmado",
  PAYMENT_FAILED: "Pagamento Falhou",
};

// Cores para status do processo
export const processStatusColors: Record<string, string> = {
  CREATED:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  PENDING_DOCS: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  PENDING_COMPANY:
    "bg-red-100 text-orange-800 dark:bg-stone-900/50 dark:text-stone-300",
  PENDING_DATA: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  IN_ANALYSIS:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  DOCS_SENT:
    "bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300",
  UNDER_REVIEW:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",

  ANALYZING_DATA:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  ANALYZING_COMPANY:
    "bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300",
  ANALYZING_DOCS:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
  APPROVED:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300",
  COMPLETED:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  ON_HOLD: "bg-gray-100 text-gray-800 dark:bg-gray-900/50 dark:text-gray-300",
  AWAITING_PAYMENT:
    "bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300",
  PAYMENT_PENDING:
    "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
  PAYMENT_CONFIRMED:
    "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
  PAYMENT_FAILED:
    "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
};

export const infoDataUpdate = {
  principalActivity: "Atividade Principal",
  cnpj: "CNPJ",
  capitalSocial: "Capital Social",
  name: "Nome",
  cpf: "CPF",
  fantasyName: "Nome Fantasia",
  tradeName: "Razão Social",
  birthDate: "Data de Nascimento",
  motherName: "Nome da Mãe",
  rg: "RG",
  phone: "Telefone",
  email: "Email",
  address: "Endereço",
  neighborhood: "Bairro",
  city: "Cidade",
  state: "Estado",
  zipCode: "CEP",
};

export const infoDocumentUpdate = {
  COMP_RESIDENCIA: "Comprovante de Residência",
  CPF: "Comprovante de CPF",
  CNPJ: "Comprovante de CNPJ",
  RG: "Comprovante de RG",
  EMAIL: "Comprovante de Email",
  PHONE: "Comprovante de Telefone",
  ADDRESS: "Comprovante de Endereço",
  NEIGHBORHOOD: "Comprovante de Bairro",
  CITY: "Comprovante de Cidade",
  STATE: "Comprovante de Estado",
  ZIP_CODE: "Comprovante de CEP",
};

// Traduções para ProcessType
export const processTypeTranslations = {
  ABERTURA_MEI: "Abertura de MEI",
  ALTERACAO_MEI: "Alteração de MEI",
  BAIXA_MEI: "Baixa de MEI",
};

// Traduções para ProcessPriority
export const processPriorityTranslations = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

// Traduções para Source
export const sourceTranslations = {
  MANUAL: "Manual",
  SYSTEM: "Sistema",
  BOT: "Bot",
  PLATFORM: "Plataforma",
};

// Traduções para DocumentStatus
export const documentStatusTranslations = {
  PENDING: "Pendente",
  SENT: "Enviado",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
};

// Traduções para TimelineEventCategory
export const timelineEventCategoryTranslations = {
  STATUS: "Status",
  DOCUMENT: "Documento",
  DATA: "Dados",
  ANALYSIS: "Análise",
};

// Traduções para TimelineEventType
export const timelineEventTypeTranslations = {
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
  ERROR: "Erro",
  INFO: "Informação",
};

// Traduções para NotificationType
export const notificationTypeTranslations = {
  ALERT: "Alerta",
  INFO: "Informação",
  WARNING: "Aviso",
  SUCCESS: "Sucesso",
};

// Traduções para NotificationCategory
export const notificationCategoryTranslations = {
  PROCESS: "Processo",
  DOCUMENT: "Documento",
  SYSTEM: "Sistema",
  ANALYSIS: "Análise",
};

export const priority = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};

export const type = {
  DOCUMENT: "Documento",
  IMAGE: "Imagem",
  VIDEO: "Vídeo",
};

export const statusDocument = {
  PENDING: "Pendente",
  SENT: "Enviado",
  VERIFIED: "Verificado",
  REJECTED: "Rejeitado",
};

export const timelineEventCategory = {
  PROCESS: "Processo",
  DOCUMENT: "Documento",
};

export const timelineEventType = {
  SUCCESS: "Sucesso",
  WARNING: "Aviso",
  ERROR: "Erro",
  INFO: "Informação",
};

export const notificationType = {
  ALERT: "Alerta",
  INFO: "Informação",
  WARNING: "Aviso",
  SUCCESS: "Sucesso",
};

export const notificationCategory = {
  PROCESS: "Processo",
  DOCUMENT: "Documento",
  SYSTEM: "Sistema",
  ANALYSIS: "Análise",
};

export const notificationPriority = {
  HIGH: "Alta",
  MEDIUM: "Média",
  LOW: "Baixa",
};
