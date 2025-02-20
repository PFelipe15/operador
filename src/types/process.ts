export enum ProcessStep {
  DADOS_PESSOAIS = "DADOS_PESSOAIS",
  DADOS_EMPRESA = "DADOS_EMPRESA",
  DOCUMENTACAO = "DOCUMENTACAO",
  ANALISE_CREDITO = "ANALISE_CREDITO",
  APROVACAO_FINAL = "APROVACAO_FINAL"
}

export interface StepConfig {
  title: string;
  description: string;
  requiredDocs: string[];
  validations: string[];
  progress: number;
}

export const MEI_STEPS: Record<ProcessStep, StepConfig> = {
  DADOS_PESSOAIS: {
    title: "Dados Pessoais",
    description: "Validação dos dados básicos do cliente",
    requiredDocs: ["RG", "CPF", "Comprovante de Residência"],
    validations: ["nome", "cpf", "rg", "endereco"],
    progress: 20
  },
  DADOS_EMPRESA: {
    title: "Dados da Empresa",
    description: "Definição das informações do MEI",
    requiredDocs: ["CCMEI", "Declaração de Atividade"],
    validations: ["nomeEmpresa", "atividade", "capitalSocial"],
    progress: 40
  },
  DOCUMENTACAO: {
    title: "Documentação",
    description: "Upload e verificação dos documentos necessários",
    requiredDocs: ["Certificado MEI", "Documentos Adicionais"],
    validations: ["documentosObrigatorios", "documentosExtras"],
    progress: 60
  },
  ANALISE_CREDITO: {
    title: "Análise de Crédito",
    description: "Verificação da situação financeira",
    requiredDocs: ["Extrato Bancário", "Comprovante de Renda"],
    validations: ["analiseCredito", "scoreCliente"],
    progress: 80
  },
  APROVACAO_FINAL: {
    title: "Aprovação Final",
    description: "Revisão e aprovação do processo",
    requiredDocs: ["Termo de Abertura", "Documentação Final"],
    validations: ["aprovacaoGerencial", "assinaturaDigital"],
    progress: 100
  }
} 