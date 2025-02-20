import { ProcessStatus } from "@prisma/client"
import { Building2, CheckCircle2, FileText, User2 } from "lucide-react"
import { Icon } from "next/dist/lib/metadata/types/metadata-types"


export const MEI_ANALYSIS_STEPS = {
  DADOS_PESSOAIS: {
    id: "DADOS_PESSOAIS",
    title: "Análise de Dados Pessoais",
    description: "Verificação dos dados cadastrais do cliente",
    icon: User2,
    status: "PENDING_DATA",
    next_status: "PENDING_COMPANY",
    progress: 20,
    checkItems: [
      {
        id: "nome_completo",
        label: "Nome completo está correto e sem abreviações",
        required: true
      },
      {
        id: "cpf_valido",
        label: "CPF válido e consistente com documentação",
        required: true
      },
      {
        id: "rg_valido",
        label: "RG válido e dentro da validade",
        required: true
      },
      {
        id: "endereco_completo",
        label: "Endereço completo e com comprovante",
        required: true
      },
      {
        id: "contatos_validos",
        label: "Telefone e email válidos e testados",
        required: true
      }
    ]
  },
  
  ATIVIDADE_MEI: {
    id: "ATIVIDADE_MEI",
    title: "Análise de Atividade MEI",
    description: "Verificação da atividade pretendida",
    icon: Building2,
    status: "PENDING_COMPANY",
    next_status: "PENDING_DOCS",
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
        required: true
      },
      {
        id: "limite_faturamento",
        label: "Previsão de faturamento dentro do limite MEI",
        required: true
      },
      {
        id: "restricoes_atividade",
        label: "Sem restrições para a atividade escolhida",
        required: true
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
        id: "docs_pessoais",
        label: "Documentos pessoais completos e legíveis",
        required: true
      },
      {
        id: "comp_residencia",
        label: "Comprovante de residência válido e recente",
        required: true
      },
      {
        id: "declaracao_mei",
        label: "Declaração de enquadramento MEI assinada",
        required: true
      },
      {
        id: "certidoes_negativas",
        label: "Certidões negativas verificadas",
        required: true
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