import { PendingDataType, ProcessStatus } from "@prisma/client"
import { Building2, CheckCircle2, FileText, User2 } from "lucide-react"
import { Icon } from "next/dist/lib/metadata/types/metadata-types"


export const MEI_ANALYSIS_STEPS = {
  DADOS_PESSOAIS: {
    id: "DADOS_PESSOAIS",
    title: "Análise de Dados Pessoais",
    description: "Verificação dos dados cadastrais do cliente",
    icon: User2,
    status: "ANALYZING_DATA",
    next_status: "ANALYZING_COMPANY",
    progress: 20,
    checkItems: [
      {
        id: "nome_completo",
        label: "Nome completo está correto e sem abreviações",
        required: true,
        pendingTypeData: [ PendingDataType.DATA_NOME_COMPLETO]
      },
      {
        id: "cpf_valido",
        label: "CPF válido e consistente com documentação",
        required: true,
        pendingTypeData: [PendingDataType.DATA_CPF]
      },
      {
        id: "rg_valido",
        label: "RG válido e dentro da validade",
        required: true,
        pendingTypeData: [PendingDataType.DATA_RG]
      },
      {
        id: "endereco_completo",
        label: "Endereço completo e com comprovante",
        required: true,
        pendingTypeData: [PendingDataType.DATA_ENDERECO]
      },
      {
        id: "contatos_validos",
        label: "Telefone e email válidos e testados",
        required: true,
        pendingTypeData: [PendingDataType.DATA_TELEFONE, PendingDataType.DATA_EMAIL]
      }
    ]
  },
  
  ATIVIDADE_MEI: {
    id: "ATIVIDADE_MEI",
    title: "Análise de Atividade MEI",
    description: "Verificação da atividade pretendida",
    icon: Building2,
    status: "ANALYZING_COMPANY",
    next_status: "ANALYZING_DOCS",
    progress: 40,
    checkItems: [
      {
        id: "cnae_permitido",
        label: "CNAE está na lista de permitidos para MEI",
        required: true
      },
      {
        id: "atividade_principal",
        label: "Atividade principal claramente definida",
        required: true,
        pendingTypeData: [PendingDataType.COMPANY_PRINCIPAL_ACTIVITY]
      },
      {
        id: "nome_fantasia",
        label: "Nome fantasia válido e registrado",
        required: true,
        pendingTypeData: [PendingDataType.COMPANY_NAME]
      }
    ]
  },

  DOCUMENTACAO: {
    id: "DOCUMENTACAO",
    title: "Análise Documental",
    description: "Verificação dos documentos necessários",
    status: "PENDING_DOCS",
    next_status: "IN_ANALYSIS",
    icon: FileText,
    progress: 60,
    checkItems: [
      {
        id: "docs_pessoais_rg",
        label: "Documentos pessoais completos e legíveis",
        required: true,
        pendingTypeData: [PendingDataType.DOC_IDENTIDADE, PendingDataType.DOC_RESIDENCIA, PendingDataType.DOC_COMPROVANTE_ENDERECO, PendingDataType.DOC_COMPROVANTE_EMPRESA, PendingDataType.DOC_COMPROVANTE_RENDA]
      },
      {
        id: "docs_pessoais_cpf",
        label: "CPF válido e consistente com documentação",
        required: true,
        pendingTypeData: [PendingDataType.DOC_CPF]
      },
     
      {
        id: "certidoes_negativas",
        label: "Certidões negativas verificadas",
        required: false
      }
    ]
  },

  VALIDACAO_CADASTRAL: {
    id: "VALIDACAO_CADASTRAL",
    title: "Validação Cadastral",
    description: "Verificação de pendências e restrições",
    status: "IN_ANALYSIS" as ProcessStatus,
    next_status: "UNDER_REVIEW",
    icon: CheckCircle2,
    progress: 80,
    checkItems: [
      {
        id: "consulta_cpf",
        label: "Situação CPF regular na Receita Federal",
        required: true
      },
      {
        id: "consulta_nome",
        label: "Sem homônimos ou processos em nome",
        required: true
      },
      {
        id: "consulta_endereco",
        label: "Endereço permite atividade comercial",
        required: true
      },
      {
        id: "restricoes_municipais",
        label: "Sem restrições municipais para atividade",
        required: true
      }
    ]
  },

  APROVACAO_FINAL: {
    id: "APROVACAO_FINAL",
    title: "Aprovação Final",
    description: "Revisão final e liberação",
    status: "UNDER_REVIEW",
    next_status: "APPROVED",
    progress: 100,
    icon: CheckCircle2,
    checkItems: [
      {
        id: "revisao_documentos",
        label: "Todos documentos revisados e aprovados",
        required: true
      },
      {
        id: "revisao_informacoes",
        label: "Informações cadastrais conferidas",
        required: true
      },
      {
        id: "termo_ciencia",
        label: "Cliente ciente das obrigações do MEI",
        required: true
      },
      {
        id: "aprovacao_responsavel",
        label: "Aprovado pelo responsável técnico",
        required: true
      }
    ]
  }
}

// Tipo para os itens de verificação
export interface CheckItem {
  id: string
  label: string
  required: boolean
  checked?: boolean
  pendingTypeData?: PendingDataType[]
}

// Tipo para os steps de análise
export interface AnalysisStep {
  id: string
  title: string
  description: string
  status: ProcessStatus
  next_status: ProcessStatus
  progress: number
  icon: Icon
  checkItems: CheckItem[]
} 