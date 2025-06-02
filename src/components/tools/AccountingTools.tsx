"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatCNPJ, formatCPF, formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  AlertTriangle,
  Building2,
  Calculator,
  CheckCircle,
  Clock,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Globe,
  Hash,
  Info,
  MapPin,
  PieChart,
  Printer,
  Receipt,
  RefreshCw,
  Search,
  Shield,
  Target,
  TrendingUp,
  User,
  Zap
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface AccountingToolsProps {
  clientCpf?: string;
  companyCnpj?: string;
  processId?: string;
}

interface CPFData {
  cpf: string;
  nome: string;
  situacao: string;
  digito_verificador: string;
  consulta_realizada: string;
}

interface CNPJData {
  cnpj: string;
  status: string;
  nome: string;
  fantasia: string;
  tipo: string;
  porte: string;
  natureza_juridica: string;
  logradouro: string;
  numero: string;
  municipio: string;
  bairro: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  situacao: string;
  data_situacao: string;
  cnae_fiscal: {
    codigo: string;
    descricao: string;
  };
  qsa: Array<{
    nome: string;
    qual: string;
  }>;
  consulta_realizada: string;
}

interface CNAEResult {
  codigo: string;
  descricao: string;
}

interface TaxResult {
  monthlyTax: number;
  annualTax: number;
  annualLimit: number;
  remainingLimit: number;
  exceedsLimit: boolean;
  taxRate: string;
  monthsInOperation: number;
}

interface ConsultationHistoryItem {
  id: string;
  type: string;
  query: string;
  result: CPFData | CNPJData | null;
  timestamp: string;
}

interface JurosResult {
  valorFinal: number;
  jurosAcumulados: number;
  percentualTotal: number;
  detalhePeriodos: Array<{
    periodo: number;
    saldo: number;
    juros: number;
  }>;
}

interface RegimeTributario {
  nome: string;
  descricao: string;
  limiteFaturamento: number;
  aliquotas: {
    irpj: number;
    csll: number;
    pis: number;
    cofins: number;
    issqn?: number;
    icms?: number;
  };
  vantagens: string[];
  desvantagens: string[];
}

interface CepData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
}

const publicSites = [
  {
    name: "Receita Federal",
    url: "https://www.gov.br/receitafederal/pt-br",
    description: "Consultas oficiais de CPF e CNPJ",
    icon: Shield,
    category: "Consultas Oficiais",
  },
  {
    name: "Portal do Empreendedor",
    url: "https://www.gov.br/empresas-e-negocios/pt-br/empreendedor",
    description: "Abertura e gestão de MEI",
    icon: Building2,
    category: "MEI",
  },
  {
    name: "Simples Nacional",
    url: "http://www8.receita.fazenda.gov.br/simplesnacional/",
    description: "Gestão do Simples Nacional",
    icon: FileText,
    category: "Tributário",
  },
  {
    name: "CNAE Fiscal",
    url: "https://concla.ibge.gov.br/busca-online-cnae.html",
    description: "Consulta de códigos CNAE",
    icon: Search,
    category: "Classificações",
  },
  {
    name: "Junta Comercial",
    url: "https://www.jucerja.rj.gov.br/",
    description: "Certidões e consultas estaduais",
    icon: FileCheck,
    category: "Certidões",
  },
  {
    name: "Caixa Econômica Federal",
    url: "https://www.caixa.gov.br/empresa/",
    description: "FGTS e certificado digital",
    icon: CreditCard,
    category: "Obrigações",
  },
  {
    name: "eSocial",
    url: "https://www.gov.br/esocial/pt-br",
    description: "Escrituração Digital",
    icon: Globe,
    category: "Obrigações",
  },
  {
    name: "SPED Contábil",
    url: "https://www.gov.br/receitafederal/pt-br/assuntos/orientacao-tributaria/declaracoes-e-demonstrativos/ecf",
    description: "Escrituração Contábil Digital",
    icon: Receipt,
    category: "SPED",
  },
];

export function AccountingTools({
  clientCpf,
  companyCnpj,
  processId,
}: AccountingToolsProps) {
  const [cpfQuery, setCpfQuery] = useState("");
  const [cnpjQuery, setCnpjQuery] = useState("");
  const [cpfData, setCpfData] = useState<CPFData | null>(null);
  const [cnpjData, setCnpjData] = useState<CNPJData | null>(null);
  const [loading, setLoading] = useState(false);

  // Calculadora de impostos
  const [revenue, setRevenue] = useState("");
  const [taxResult, setTaxResult] = useState<TaxResult | null>(null);

  // CNAE Search
  const [cnaeQuery, setCnaeQuery] = useState("");
  const [cnaeResults, setCnaeResults] = useState<CNAEResult[]>([]);

  // Histórico de consultas
  const [consultationHistory, setConsultationHistory] = useState<
    ConsultationHistoryItem[]
  >([]);

  // Novas funcionalidades
  const [valorInicial, setValorInicial] = useState("");
  const [taxaJuros, setTaxaJuros] = useState("");
  const [periodoMeses, setPeriodoMeses] = useState("");
  const [jurosResult, setJurosResult] = useState<JurosResult | null>(null);

  const [cepQuery, setCepQuery] = useState("");
  const [cepData, setCepData] = useState<CepData | null>(null);

  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [ufSelecionada, setUfSelecionada] = useState("");
  const [ieValidationResult, setIeValidationResult] = useState<any>(null);

  const [faturamentoSimulacao, setFaturamentoSimulacao] = useState("");
  const [regimeSimulacao, setRegimeSimulacao] =
    useState<RegimeTributario | null>(null);

  // Auto-preencher campos quando o componente carrega
  useEffect(() => {
    if (clientCpf && !cpfQuery) {
      setCpfQuery(formatCPF(clientCpf));
    }
    if (companyCnpj && !cnpjQuery) {
      setCnpjQuery(formatCNPJ(companyCnpj));
    }
  }, [clientCpf, companyCnpj]);

  const formatCPFInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return formatCPF(numbers);
  };

  const formatCNPJInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    return formatCNPJ(numbers);
  };

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    const numberValue = parseInt(numbers) / 100;
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numberValue);
  };

  const validateCPF = (cpf: string) => {
    const numbers = cpf.replace(/\D/g, "");
    if (numbers.length !== 11) return false;

    if (/^(\d)\1{10}$/.test(numbers)) return false;

    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(numbers[i]) * (10 - i);
    }
    let remainder = 11 - (sum % 11);
    const firstDigit = remainder >= 10 ? 0 : remainder;

    if (parseInt(numbers[9]) !== firstDigit) return false;

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(numbers[i]) * (11 - i);
    }
    remainder = 11 - (sum % 11);
    const secondDigit = remainder >= 10 ? 0 : remainder;

    return parseInt(numbers[10]) === secondDigit;
  };

  const validateCNPJ = (cnpj: string) => {
    const numbers = cnpj.replace(/\D/g, "");
    if (numbers.length !== 14) return false;

    if (/^(\d)\1{13}$/.test(numbers)) return false;

    const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];

    let sum = 0;
    for (let i = 0; i < 12; i++) {
      sum += parseInt(numbers[i]) * weights1[i];
    }
    let remainder = sum % 11;
    const firstDigit = remainder < 2 ? 0 : 11 - remainder;

    if (parseInt(numbers[12]) !== firstDigit) return false;

    sum = 0;
    for (let i = 0; i < 13; i++) {
      sum += parseInt(numbers[i]) * weights2[i];
    }
    remainder = sum % 11;
    const secondDigit = remainder < 2 ? 0 : 11 - remainder;

    return parseInt(numbers[13]) === secondDigit;
  };

  const consultCPF = async () => {
    if (!cpfQuery) {
      toast.error("Digite um CPF para consultar");
      return;
    }

    if (!validateCPF(cpfQuery)) {
      toast.error("CPF inválido");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/accounting/cpf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cpf: cpfQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na consulta");
      }

      const data = await response.json();
      setCpfData(data);

      // Adicionar ao histórico
      addToHistory("CPF", cpfQuery, data);

      toast.success("Consulta CPF realizada com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao consultar CPF"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const consultCNPJ = async () => {
    if (!cnpjQuery) {
      toast.error("Digite um CNPJ para consultar");
      return;
    }

    if (!validateCNPJ(cnpjQuery)) {
      toast.error("CNPJ inválido");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/accounting/cnpj", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ cnpj: cnpjQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na consulta");
      }

      const data = await response.json();
      setCnpjData(data);

      // Adicionar ao histórico
      addToHistory("CNPJ", cnpjQuery, data);

      toast.success("Consulta CNPJ realizada com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao consultar CNPJ"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMEITax = () => {
    if (!revenue) {
      toast.error("Digite o faturamento para calcular");
      return;
    }

    const revenueValue = parseFloat(
      revenue.replace(/[^\d,]/g, "").replace(",", ".")
    );

    if (isNaN(revenueValue) || revenueValue < 0) {
      toast.error("Digite um valor válido");
      return;
    }

    // Valores do MEI 2024
    const monthlyTax = 70.6; // DAS MEI 2024
    const annualLimit = 81000; // Limite anual MEI 2024

    const result = {
      monthlyTax,
      annualTax: monthlyTax * 12,
      annualLimit,
      remainingLimit: Math.max(0, annualLimit - revenueValue),
      exceedsLimit: revenueValue > annualLimit,
      taxRate: (((monthlyTax * 12) / Math.max(revenueValue, 1)) * 100).toFixed(
        2
      ),
      monthsInOperation: Math.ceil(revenueValue / (annualLimit / 12)),
    };

    setTaxResult(result);
    toast.success("Cálculo realizado com sucesso");
  };

  const searchCNAE = async () => {
    if (!cnaeQuery) {
      toast.error("Digite uma atividade para buscar");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/v1/accounting/cnae", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: cnaeQuery }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro na busca");
      }

      const data = await response.json();
      setCnaeResults(data);

      if (data.length === 0) {
        toast.warning("Nenhum CNAE encontrado para este termo");
      } else {
        toast.success(`${data.length} CNAEs encontrados`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro na busca CNAE"
      );
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const addToHistory = (
    type: string,
    query: string,
    result: CPFData | CNPJData | null
  ) => {
    const historyItem: ConsultationHistoryItem = {
      id: Date.now().toString(),
      type,
      query,
      result,
      timestamp: new Date().toISOString(),
    };
    setConsultationHistory((prev) => [historyItem, ...prev.slice(0, 4)]);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência");
  };

  const clearAllData = () => {
    setCpfQuery("");
    setCnpjQuery("");
    setCpfData(null);
    setCnpjData(null);
    setRevenue("");
    setTaxResult(null);
    setCnaeQuery("");
    setCnaeResults([]);
    setConsultationHistory([]);
    setValorInicial("");
    setTaxaJuros("");
    setPeriodoMeses("");
    setJurosResult(null);
    setCepQuery("");
    setCepData(null);
    setInscricaoEstadual("");
    setUfSelecionada("");
    setIeValidationResult(null);
    setFaturamentoSimulacao("");
    setRegimeSimulacao(null);
    toast.success("Todos os dados foram limpos");
  };

  const getSituacaoBadge = (situacao: string) => {
    switch (situacao?.toUpperCase()) {
      case "REGULAR":
      case "ATIVA":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="w-3 h-3 mr-1" />
            {situacao}
          </Badge>
        );
      case "IRREGULAR":
      case "SUSPENSA":
        return (
          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {situacao}
          </Badge>
        );
      case "INATIVA":
      case "BAIXADA":
        return (
          <Badge className="bg-red-100 text-red-800 border-red-200">
            <AlertCircle className="w-3 h-3 mr-1" />
            {situacao}
          </Badge>
        );
      default:
        return <Badge variant="outline">{situacao}</Badge>;
    }
  };

  const generateReport = () => {
    const reportData = {
      processo_id: processId,
      data_geracao: new Date().toISOString(),
      consultas_realizadas: consultationHistory,
      dados_cpf: cpfData,
      dados_cnpj: cnpjData,
      calculo_mei: taxResult,
      cnaes_consultados: cnaeResults.slice(0, 5),
    };

    const reportText = `
=== RELATÓRIO DE FERRAMENTAS CONTÁBEIS ===
Data: ${new Date().toLocaleString()}
Processo: ${processId || "N/A"}

=== CONSULTAS REALIZADAS ===
${consultationHistory
  .map(
    (item) =>
      `${item.type}: ${item.query} - ${new Date(
        item.timestamp
      ).toLocaleString()}`
  )
  .join("\n")}

=== DADOS CPF ===
${
  cpfData
    ? `
Nome: ${cpfData.nome}
CPF: ${cpfData.cpf}
Situação: ${cpfData.situacao}
`
    : "Nenhuma consulta realizada"
}

=== DADOS CNPJ ===
${
  cnpjData
    ? `
Razão Social: ${cnpjData.nome}
CNPJ: ${cnpjData.cnpj}
Situação: ${cnpjData.situacao}
CNAE: ${cnpjData.cnae_fiscal.codigo} - ${cnpjData.cnae_fiscal.descricao}
`
    : "Nenhuma consulta realizada"
}

=== CÁLCULO MEI ===
${
  taxResult
    ? `
DAS Mensal: ${formatCurrency(taxResult.monthlyTax)}
DAS Anual: ${formatCurrency(taxResult.annualTax)}
Taxa Efetiva: ${taxResult.taxRate}%
Excede Limite: ${taxResult.exceedsLimit ? "SIM" : "NÃO"}
`
    : "Nenhum cálculo realizado"
}

=== RELATÓRIO GERADO EM ${new Date().toLocaleString()} ===
    `.trim();

    // Criar e baixar arquivo
    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-contabil-${
      processId || "geral"
    }-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Relatório exportado com sucesso");
  };

  const exportToJSON = () => {
    const exportData = {
      metadata: {
        processo_id: processId,
        data_exportacao: new Date().toISOString(),
        versao: "1.0",
      },
      consultas: {
        historico: consultationHistory,
        cpf: cpfData,
        cnpj: cnpjData,
      },
      calculadora: {
        mei: taxResult,
      },
      cnae: {
        resultados: cnaeResults,
      },
    };

    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dados-contabeis-${
      processId || "geral"
    }-${new Date().getTime()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Dados exportados em JSON");
  };

  const printResults = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Pop-up bloqueado. Permita pop-ups para imprimir.");
      return;
    }

    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Relatório Contábil - Processo ${processId}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
    h1, h2 { color: #059669; border-bottom: 2px solid #059669; padding-bottom: 5px; }
    .section { margin: 20px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
    .highlight { background-color: #f0fdf4; padding: 10px; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin: 10px 0; }
    th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
    th { background-color: #f9fafb; }
    @media print { body { margin: 0; } }
  </style>
</head>
<body>
  <h1>Relatório de Ferramentas Contábeis</h1>
  <p><strong>Processo:</strong> ${processId || "N/A"}</p>
  <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
  
  ${
    cpfData
      ? `
  <div class="section">
    <h2>Consulta CPF</h2>
    <table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td>Nome</td><td>${cpfData.nome}</td></tr>
      <tr><td>CPF</td><td>${cpfData.cpf}</td></tr>
      <tr><td>Situação</td><td>${cpfData.situacao}</td></tr>
      <tr><td>Consulta</td><td>${new Date(
        cpfData.consulta_realizada
      ).toLocaleString()}</td></tr>
    </table>
  </div>
  `
      : ""
  }
  
  ${
    cnpjData
      ? `
  <div class="section">
    <h2>Consulta CNPJ</h2>
    <table>
      <tr><th>Campo</th><th>Valor</th></tr>
      <tr><td>Razão Social</td><td>${cnpjData.nome}</td></tr>
      <tr><td>CNPJ</td><td>${cnpjData.cnpj}</td></tr>
      <tr><td>Situação</td><td>${cnpjData.situacao}</td></tr>
      <tr><td>CNAE</td><td>${cnpjData.cnae_fiscal.codigo} - ${cnpjData.cnae_fiscal.descricao}</td></tr>
      <tr><td>Porte</td><td>${cnpjData.porte}</td></tr>
    </table>
  </div>
  `
      : ""
  }
  
  ${
    taxResult
      ? `
  <div class="section">
    <h2>Cálculo MEI</h2>
    <div class="highlight">
      <p><strong>DAS Mensal:</strong> ${formatCurrency(
        taxResult.monthlyTax
      )}</p>
      <p><strong>DAS Anual:</strong> ${formatCurrency(taxResult.annualTax)}</p>
      <p><strong>Taxa Efetiva:</strong> ${taxResult.taxRate}%</p>
      <p><strong>Limite Excedido:</strong> ${
        taxResult.exceedsLimit ? "SIM" : "NÃO"
      }</p>
    </div>
  </div>
  `
      : ""
  }
  
  <div class="section">
    <h2>Histórico de Consultas</h2>
    <table>
      <tr><th>Tipo</th><th>Consulta</th><th>Data/Hora</th></tr>
      ${consultationHistory
        .map(
          (item) => `
      <tr>
        <td>${item.type}</td>
        <td>${item.query}</td>
        <td>${new Date(item.timestamp).toLocaleString()}</td>
      </tr>
      `
        )
        .join("")}
    </table>
  </div>
</body>
</html>`;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
    toast.success("Documento preparado para impressão");
  };

  const quickFillExample = () => {
    // Preencher com dados de exemplo para demonstração
    const exampleCpf = "123.456.789-09";
    const exampleCnpj = "12.345.678/0001-95";

    setCpfQuery(exampleCpf);
    setCnpjQuery(exampleCnpj);
    setRevenue("R$ 45.000,00");
    setCnaeQuery("comércio varejista");

    toast.info("Campos preenchidos com dados de exemplo");
  };

  const regimesTributarios: RegimeTributario[] = [
    {
      nome: "MEI - Microempreendedor Individual",
      descricao:
        "Regime simplificado para empreendedores com faturamento até R$ 81.000/ano",
      limiteFaturamento: 81000,
      aliquotas: { irpj: 0, csll: 0, pis: 0, cofins: 0, issqn: 5, icms: 1 },
      vantagens: [
        "DAS fixo mensal",
        "Sem complexidade fiscal",
        "Aposentadoria",
      ],
      desvantagens: [
        "Limite baixo de faturamento",
        "Sem funcionários CLT",
        "Limitação de atividades",
      ],
    },
    {
      nome: "Simples Nacional",
      descricao: "Regime tributário simplificado para pequenas empresas",
      limiteFaturamento: 4800000,
      aliquotas: { irpj: 0, csll: 0, pis: 0, cofins: 0, issqn: 2.3, icms: 7.3 },
      vantagens: [
        "Tributos unificados",
        "Alíquotas reduzidas",
        "Facilidade de cálculo",
      ],
      desvantagens: [
        "Limitações de atividade",
        "Restrições para sócios",
        "Vedações específicas",
      ],
    },
    {
      nome: "Lucro Presumido",
      descricao:
        "Tributação sobre margem de lucro presumida pela Receita Federal",
      limiteFaturamento: 78000000,
      aliquotas: { irpj: 15, csll: 9, pis: 0.65, cofins: 3 },
      vantagens: [
        "Simplicidade de cálculo",
        "Planejamento tributário",
        "Menor burocracia",
      ],
      desvantagens: [
        "Tributação fixa independente do lucro",
        "Limitação de atividades",
      ],
    },
    {
      nome: "Lucro Real",
      descricao: "Tributação sobre o lucro efetivo da empresa",
      limiteFaturamento: Infinity,
      aliquotas: { irpj: 15, csll: 9, pis: 1.65, cofins: 7.6 },
      vantagens: [
        "Tributação sobre lucro real",
        "Sem limite de faturamento",
        "Todas as atividades",
      ],
      desvantagens: [
        "Maior complexidade",
        "Obrigações acessórias",
        "Custos contábeis",
      ],
    },
  ];

  const calculateJuros = () => {
    if (!valorInicial || !taxaJuros || !periodoMeses) {
      toast.error("Preencha todos os campos para calcular");
      return;
    }

    const valor = parseFloat(
      valorInicial.replace(/[^\d,]/g, "").replace(",", ".")
    );
    const taxa = parseFloat(taxaJuros.replace(",", ".")) / 100;
    const periodo = parseInt(periodoMeses);

    if (
      isNaN(valor) ||
      isNaN(taxa) ||
      isNaN(periodo) ||
      valor <= 0 ||
      taxa < 0 ||
      periodo <= 0
    ) {
      toast.error("Digite valores válidos");
      return;
    }

    let saldo = valor;
    const detalhePeriodos = [];

    for (let i = 1; i <= periodo; i++) {
      const juros = saldo * taxa;
      saldo += juros;
      detalhePeriodos.push({
        periodo: i,
        saldo: saldo,
        juros: juros,
      });
    }

    const result: JurosResult = {
      valorFinal: saldo,
      jurosAcumulados: saldo - valor,
      percentualTotal: ((saldo - valor) / valor) * 100,
      detalhePeriodos,
    };

    setJurosResult(result);
    toast.success("Cálculo de juros realizado com sucesso");
  };

  const consultCEP = async () => {
    if (!cepQuery) {
      toast.error("Digite um CEP para consultar");
      return;
    }

    const cleanCep = cepQuery.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast.error("CEP deve ter 8 dígitos");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(
        `https://viacep.com.br/ws/${cleanCep}/json/`
      );

      if (!response.ok) {
        throw new Error("Erro na consulta de CEP");
      }

      const data = await response.json();

      if (data.erro) {
        throw new Error("CEP não encontrado");
      }

      setCepData(data);
      toast.success("CEP consultado com sucesso");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Erro ao consultar CEP"
      );
    } finally {
      setLoading(false);
    }
  };

  const validateInscricaoEstadual = () => {
    if (!inscricaoEstadual || !ufSelecionada) {
      toast.error("Preencha a Inscrição Estadual e selecione o estado");
      return;
    }

    // Validação básica - implementação simplificada
    const cleanIE = inscricaoEstadual.replace(/\D/g, "");

    if (cleanIE === "ISENTO" || cleanIE === "isento") {
      setIeValidationResult({
        valid: true,
        status: "ISENTO",
        message: "Contribuinte isento de Inscrição Estadual",
      });
    } else if (cleanIE.length >= 8 && cleanIE.length <= 14) {
      setIeValidationResult({
        valid: true,
        status: "VÁLIDA",
        message: `Estrutura válida para ${ufSelecionada}`,
        uf: ufSelecionada,
        inscricao: inscricaoEstadual,
      });
    } else {
      setIeValidationResult({
        valid: false,
        status: "INVÁLIDA",
        message: "Estrutura inválida para Inscrição Estadual",
      });
    }

    toast.success("Validação de IE realizada");
  };

  const simularRegime = () => {
    if (!faturamentoSimulacao) {
      toast.error("Digite o faturamento anual para simular");
      return;
    }

    const faturamento = parseFloat(
      faturamentoSimulacao.replace(/[^\d,]/g, "").replace(",", ".")
    );

    if (isNaN(faturamento) || faturamento <= 0) {
      toast.error("Digite um valor válido");
      return;
    }

    const regimeRecomendado =
      regimesTributarios.find(
        (regime) => faturamento <= regime.limiteFaturamento
      ) || regimesTributarios[regimesTributarios.length - 1];

    setRegimeSimulacao(regimeRecomendado);
    toast.success("Simulação de regime tributário realizada");
  };

  const generateDAS = () => {
    if (!taxResult) {
      toast.error("Primeiro calcule os impostos MEI");
      return;
    }

    const dasContent = `
=== DOCUMENTO DE ARRECADAÇÃO DO SIMPLES NACIONAL (DAS) ===
Data de Geração: ${new Date().toLocaleString()}
Processo: ${processId || "N/A"}

DADOS DO CONTRIBUINTE:
CPF: ${cpfData?.cpf || "NÃO INFORMADO"}
CNPJ: ${cnpjData?.cnpj || "NÃO INFORMADO"}
Razão Social: ${cnpjData?.nome || "NÃO INFORMADO"}

VALORES MEI 2024:
DAS Mensal: ${formatCurrency(taxResult.monthlyTax)}
DAS Anual: ${formatCurrency(taxResult.annualTax)}
Taxa Efetiva: ${taxResult.taxRate}%

CALENDÁRIO DE VENCIMENTOS 2024:
Janeiro: 20/02/2024
Fevereiro: 20/03/2024
Março: 20/04/2024
Abril: 20/05/2024
Maio: 20/06/2024
Junho: 20/07/2024
Julho: 20/08/2024
Agosto: 20/09/2024
Setembro: 20/10/2024
Outubro: 20/11/2024
Novembro: 20/12/2024
Dezembro: 20/01/2025

IMPORTANTE:
- Pagamento até o dia 20 do mês seguinte
- Atraso gera multa e juros
- Comprovante necessário para aposentadoria
- Consulte sempre o Portal do Empreendedor

=== DOCUMENTO GERADO EM ${new Date().toLocaleString()} ===
    `.trim();

    const blob = new Blob([dasContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `das-mei-${processId || "geral"}-${new Date().getTime()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success("Guia DAS gerada com sucesso");
  };

  return (
    <div className="w-full space-y-6">
      {/* Alerta sobre limitações da consulta CPF */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          <strong>ℹ️ INFORMAÇÃO:</strong> As consultas de{" "}
          <strong>CNPJ são REAIS</strong> (via ReceitaWS). Para{" "}
          <strong>CPF</strong>, apenas validação matemática está disponível -
          consultas de dados pessoais requerem certificado digital no portal da
          Receita Federal.
        </AlertDescription>
      </Alert>

      {/* Alertas e Informações */}
      {clientCpf && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Info className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700">
            CPF do cliente detectado: <strong>{formatCPF(clientCpf)}</strong> -
            Clique em &quot;Validar&quot; para verificar automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {companyCnpj && (
        <Alert className="border-emerald-200 bg-emerald-50">
          <Info className="h-4 w-4 text-emerald-600" />
          <AlertDescription className="text-emerald-700">
            CNPJ da empresa detectado:{" "}
            <strong>{formatCNPJ(companyCnpj)}</strong> - Clique em
            &quot;Consultar&quot; para buscar dados reais automaticamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Barra de Ações */}
      <Card className="w-full shadow-sm border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className="text-emerald-600 border-emerald-300"
              >
                {consultationHistory.length} consultas realizadas
              </Badge>
              {taxResult && (
                <Badge
                  variant="outline"
                  className="text-amber-600 border-amber-300"
                >
                  DAS calculado: {formatCurrency(taxResult.monthlyTax)}
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllData}
                className="text-gray-600 border-gray-300"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Limpar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateReport}
                className="text-blue-600 border-blue-300"
              >
                <Download className="w-4 h-4 mr-1" />
                Relatório
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={generateDAS}
                className="text-green-600 border-green-300"
                disabled={!taxResult}
              >
                <Receipt className="w-4 h-4 mr-1" />
                Gerar DAS
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToJSON}
                className="text-purple-600 border-purple-300"
              >
                <FileText className="w-4 h-4 mr-1" />
                JSON
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={printResults}
                className="text-indigo-600 border-indigo-300"
              >
                <Printer className="w-4 h-4 mr-1" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={quickFillExample}
                className="text-orange-600 border-orange-300"
              >
                <Zap className="w-4 h-4 mr-1" />
                Exemplo
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Ferramentas */}
      <Card className="w-full shadow-lg border-0">
        <CardContent className="p-6">
          <Tabs defaultValue="consultas" className="w-full">
            <TabsList className="grid w-full grid-cols-7 mb-6">
              <TabsTrigger value="consultas" className="text-xs">
                <Search className="w-4 h-4 mr-1" />
                Consultas
              </TabsTrigger>
              <TabsTrigger value="calculadora" className="text-xs">
                <Calculator className="w-4 h-4 mr-1" />
                Calculadora
              </TabsTrigger>
              <TabsTrigger value="cnae" className="text-xs">
                <Building2 className="w-4 h-4 mr-1" />
                CNAE
              </TabsTrigger>
              <TabsTrigger value="juros" className="text-xs">
                <TrendingUp className="w-4 h-4 mr-1" />
                Juros
              </TabsTrigger>
              <TabsTrigger value="regimes" className="text-xs">
                <PieChart className="w-4 h-4 mr-1" />
                Regimes
              </TabsTrigger>
              <TabsTrigger value="validadores" className="text-xs">
                <Shield className="w-4 h-4 mr-1" />
                Validadores
              </TabsTrigger>
              <TabsTrigger value="sites" className="text-xs">
                <Globe className="w-4 h-4 mr-1" />
                Sites Úteis
              </TabsTrigger>
            </TabsList>

            {/* Aba Consultas */}
            <TabsContent value="consultas" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Validação CPF */}
                <Card className="shadow-sm border border-emerald-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-emerald-600" />
                      <Label className="font-medium">Validação CPF</Label>
                      <Badge
                        variant="outline"
                        className="text-xs bg-blue-100 text-blue-600 border-blue-200"
                      >
                        Validação Matemática
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="000.000.000-00"
                        value={cpfQuery}
                        onChange={(e) =>
                          setCpfQuery(formatCPFInput(e.target.value))
                        }
                        maxLength={14}
                        className="flex-1"
                      />
                      <Button
                        onClick={consultCPF}
                        disabled={loading}
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {clientCpf && clientCpf !== cpfQuery.replace(/\D/g, "") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setCpfQuery(formatCPF(clientCpf));
                          toast.info("CPF do cliente preenchido");
                        }}
                        className="w-full text-emerald-600 border-emerald-300"
                      >
                        <Zap className="w-4 h-4 mr-1" />
                        Validar CPF do Cliente
                      </Button>
                    )}

                    {cpfData && (
                      <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="font-medium">CPF:</span>
                            <div className="flex items-center gap-2">
                              <span>{cpfData.cpf}</span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(cpfData.cpf)}
                                className="h-6 w-6"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="font-medium">Status:</span>
                            <Badge className="bg-green-100 text-green-800 border-green-200">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Válido
                            </Badge>
                          </div>

                          {(cpfData as any).aviso_importante && (
                            <Alert className="border-amber-200 bg-amber-50">
                              <AlertTriangle className="h-4 w-4 text-amber-600" />
                              <AlertDescription className="text-amber-700 text-xs">
                                <strong>Importante:</strong> Para consultar
                                dados pessoais reais, acesse o portal da Receita
                                Federal com certificado digital.
                              </AlertDescription>
                            </Alert>
                          )}

                          <div className="text-xs text-emerald-600 mt-2">
                            Validado em:{" "}
                            {new Date(
                              cpfData.consulta_realizada
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Consulta CNPJ */}
                <Card className="shadow-sm border border-blue-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600" />
                      <Label className="font-medium">Consulta CNPJ</Label>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-100 text-green-600 border-green-200"
                      >
                        Dados Reais
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={cnpjQuery}
                        onChange={(e) =>
                          setCnpjQuery(formatCNPJInput(e.target.value))
                        }
                        maxLength={18}
                        className="flex-1"
                      />
                      <Button
                        onClick={consultCNPJ}
                        disabled={loading}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {companyCnpj &&
                      companyCnpj !== cnpjQuery.replace(/\D/g, "") && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setCnpjQuery(formatCNPJ(companyCnpj));
                            toast.info("CNPJ da empresa preenchido");
                          }}
                          className="w-full text-blue-600 border-blue-300"
                        >
                          <Zap className="w-4 h-4 mr-1" />
                          Consultar CNPJ da Empresa
                        </Button>
                      )}

                    {cnpjData && (
                      <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 space-y-3">
                        {(cnpjData as any).status === "SIMULADO" && (
                          <Alert className="border-amber-200 bg-amber-50 mb-3">
                            <AlertTriangle className="h-4 w-4 text-amber-600" />
                            <AlertDescription className="text-amber-700 text-xs">
                              <strong>Fallback:</strong> API externa
                              indisponível. Dados simulados.
                            </AlertDescription>
                          </Alert>
                        )}

                        <div className="grid grid-cols-1 gap-3 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Razão Social:</span>
                            <div className="flex items-center gap-1">
                              <span className="text-right">
                                {cnpjData.nome}
                              </span>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => copyToClipboard(cnpjData.nome)}
                                className="h-5 w-5"
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Situação:</span>
                            {getSituacaoBadge(cnpjData.situacao)}
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Porte:</span>
                            <Badge variant="outline">{cnpjData.porte}</Badge>
                          </div>
                          <Separator />
                          <div>
                            <span className="font-medium">CNAE Principal:</span>
                            <p className="text-xs mt-1">
                              {cnpjData.cnae_fiscal.codigo} -{" "}
                              {cnpjData.cnae_fiscal.descricao}
                            </p>
                          </div>
                          <div className="text-xs text-blue-600 mt-2">
                            Consultado em:{" "}
                            {new Date(
                              cnpjData.consulta_realizada
                            ).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Histórico de Consultas */}
              {consultationHistory.length > 0 && (
                <Card className="shadow-sm border border-gray-100">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-600" />
                      Histórico de Consultas
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {consultationHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border"
                        >
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {item.type}
                            </Badge>
                            <span className="text-sm font-mono">
                              {item.query}
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {new Date(item.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Aba Calculadora */}
            <TabsContent value="calculadora" className="space-y-6 mt-4">
              <Card className="shadow-sm border border-amber-100">
                <CardHeader className="bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Calculadora MEI 2024
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Faturamento Anual (R$)</Label>
                    <Input
                      placeholder="Ex: R$ 50.000,00"
                      value={revenue}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (
                          /^\d*[,.]?\d*$/.test(value.replace(/[R$\s]/g, ""))
                        ) {
                          setRevenue(value);
                        }
                      }}
                      className="text-lg"
                    />
                  </div>
                  <Button
                    onClick={calculateMEITax}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-lg py-3"
                  >
                    <Calculator className="w-5 h-5 mr-2" />
                    Calcular Impostos MEI
                  </Button>

                  {taxResult && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                      <h4 className="font-bold text-amber-800 mb-4 text-lg">
                        Resultado do Cálculo:
                      </h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            DAS Mensal:
                          </span>
                          <p className="font-bold text-2xl text-emerald-600">
                            {formatCurrency(taxResult.monthlyTax)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            DAS Anual:
                          </span>
                          <p className="font-bold text-2xl text-emerald-600">
                            {formatCurrency(taxResult.annualTax)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            Limite Restante:
                          </span>
                          <p
                            className={`font-bold text-2xl ${
                              taxResult.exceedsLimit
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {formatCurrency(taxResult.remainingLimit)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            Taxa Efetiva:
                          </span>
                          <p className="font-bold text-2xl text-blue-600">
                            {taxResult.taxRate}%
                          </p>
                        </div>
                      </div>

                      {taxResult.exceedsLimit && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-700">
                            <strong>Atenção: Limite MEI Excedido!</strong>
                            <br />O faturamento de{" "}
                            {formatCurrency(
                              parseFloat(
                                revenue.replace(/[^\d,]/g, "").replace(",", ".")
                              )
                            )}
                            excede o limite anual de{" "}
                            {formatCurrency(taxResult.annualLimit)}.
                            <strong>
                              {" "}
                              Considere a migração para Microempresa (ME).
                            </strong>
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="mt-4 p-3 bg-white rounded border">
                        <h5 className="font-medium text-gray-700 mb-2">
                          Resumo Fiscal:
                        </h5>
                        <ul className="text-sm text-gray-600 space-y-1">
                          <li>
                            • Limite anual MEI:{" "}
                            {formatCurrency(taxResult.annualLimit)}
                          </li>
                          <li>
                            • Valor já faturado:{" "}
                            {formatCurrency(
                              parseFloat(
                                revenue.replace(/[^\d,]/g, "").replace(",", ".")
                              )
                            )}
                          </li>
                          <li>
                            • DAS fixo mensal:{" "}
                            {formatCurrency(taxResult.monthlyTax)}
                          </li>
                          <li>
                            • Carga tributária efetiva: {taxResult.taxRate}%
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Aba CNAE */}
            <TabsContent value="cnae" className="space-y-6 mt-4">
              <Card className="shadow-sm border border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="w-5 h-5" />
                    Busca CNAE
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite a atividade (ex: comércio varejista) ou código CNAE"
                      value={cnaeQuery}
                      onChange={(e) => setCnaeQuery(e.target.value)}
                      className="flex-1"
                      onKeyPress={(e) => e.key === "Enter" && searchCNAE()}
                    />
                    <Button
                      onClick={searchCNAE}
                      disabled={loading}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {loading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Buscar
                    </Button>
                  </div>

                  {cnaeResults.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">
                          Resultados ({cnaeResults.length}):
                        </Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCnaeResults([])}
                        >
                          Limpar
                        </Button>
                      </div>
                      <div className="max-h-96 overflow-y-auto space-y-2">
                        {cnaeResults.map((cnae, index) => (
                          <Card
                            key={index}
                            className="p-4 border border-purple-200 hover:bg-purple-50 transition-colors cursor-pointer"
                            onClick={() =>
                              copyToClipboard(
                                `${cnae.codigo} - ${cnae.descricao}`
                              )
                            }
                          >
                            <div className="flex items-start gap-3">
                              <Badge
                                variant="outline"
                                className="shrink-0 bg-purple-100 text-purple-700"
                              >
                                {cnae.codigo}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm font-medium">
                                  {cnae.descricao}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                  Clique para copiar o código e descrição
                                </p>
                              </div>
                              <Copy className="w-4 h-4 text-gray-400" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nova Aba - Calculadora de Juros */}
            <TabsContent value="juros" className="space-y-6 mt-4">
              <Card className="shadow-sm border border-purple-100">
                <CardHeader className="bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Calculadora de Juros Compostos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Valor Inicial (R$)</Label>
                      <Input
                        placeholder="R$ 1.000,00"
                        value={valorInicial}
                        onChange={(e) => setValorInicial(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Taxa de Juros (% ao mês)</Label>
                      <Input
                        placeholder="2,5"
                        value={taxaJuros}
                        onChange={(e) => setTaxaJuros(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Período (meses)</Label>
                      <Input
                        placeholder="12"
                        type="number"
                        value={periodoMeses}
                        onChange={(e) => setPeriodoMeses(e.target.value)}
                      />
                    </div>
                  </div>

                  <Button
                    onClick={calculateJuros}
                    className="w-full bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                  >
                    <Calculator className="w-4 h-4 mr-2" />
                    Calcular Juros Compostos
                  </Button>

                  {jurosResult && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg border border-purple-200">
                      <h4 className="font-bold text-purple-800 mb-4 text-lg">
                        Resultado do Cálculo:
                      </h4>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            Valor Final:
                          </span>
                          <p className="font-bold text-2xl text-purple-600">
                            {formatCurrency(jurosResult.valorFinal)}
                          </p>
                        </div>
                        <div className="p-4 bg-white rounded-lg border shadow-sm">
                          <span className="text-gray-600 text-sm">
                            Juros Acumulados:
                          </span>
                          <p className="font-bold text-2xl text-green-600">
                            {formatCurrency(jurosResult.jurosAcumulados)}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded border max-h-40 overflow-y-auto">
                        <h5 className="font-medium text-purple-700 mb-2">
                          Evolução Mensal:
                        </h5>
                        <div className="space-y-1 text-sm">
                          {jurosResult.detalhePeriodos
                            .slice(0, 12)
                            .map((periodo) => (
                              <div
                                key={periodo.periodo}
                                className="flex justify-between"
                              >
                                <span>Mês {periodo.periodo}:</span>
                                <span className="font-medium">
                                  {formatCurrency(periodo.saldo)}
                                </span>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nova Aba - Simulador de Regimes Tributários */}
            <TabsContent value="regimes" className="space-y-6 mt-4">
              <Card className="shadow-sm border border-indigo-100">
                <CardHeader className="bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Simulador de Regimes Tributários
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  <div className="space-y-2">
                    <Label>Faturamento Anual Estimado (R$)</Label>
                    <Input
                      placeholder="Ex: R$ 120.000,00"
                      value={faturamentoSimulacao}
                      onChange={(e) => setFaturamentoSimulacao(e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <Button
                    onClick={simularRegime}
                    className="w-full bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700"
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Simular Melhor Regime
                  </Button>

                  {regimeSimulacao && (
                    <div className="mt-6 p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-lg border border-indigo-200">
                      <h4 className="font-bold text-indigo-800 mb-4 text-lg">
                        Regime Recomendado:
                      </h4>
                      <div className="bg-white p-4 rounded-lg border mb-4">
                        <h5 className="font-bold text-xl text-indigo-700 mb-2">
                          {regimeSimulacao.nome}
                        </h5>
                        <p className="text-gray-600 mb-3">
                          {regimeSimulacao.descricao}
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h6 className="font-medium text-green-700 mb-2">
                              ✅ Vantagens:
                            </h6>
                            <ul className="text-sm space-y-1">
                              {regimeSimulacao.vantagens.map(
                                (vantagem, index) => (
                                  <li key={index} className="text-green-600">
                                    • {vantagem}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                          <div>
                            <h6 className="font-medium text-red-700 mb-2">
                              ⚠️ Desvantagens:
                            </h6>
                            <ul className="text-sm space-y-1">
                              {regimeSimulacao.desvantagens.map(
                                (desvantagem, index) => (
                                  <li key={index} className="text-red-600">
                                    • {desvantagem}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <h5 className="font-medium text-gray-700 mb-3">
                      Comparação de Regimes:
                    </h5>
                    <div className="grid gap-3">
                      {regimesTributarios.map((regime, index) => (
                        <div
                          key={index}
                          className="p-3 bg-gray-50 rounded border text-sm"
                        >
                          <div className="flex justify-between items-center">
                            <span className="font-medium">{regime.nome}</span>
                            <span className="text-gray-600">
                              Até{" "}
                              {regime.limiteFaturamento === Infinity
                                ? "Sem limite"
                                : formatCurrency(regime.limiteFaturamento)}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Nova Aba - Validadores */}
            <TabsContent value="validadores" className="space-y-6 mt-4">
              <div className="grid md:grid-cols-2 gap-6">
                {/* Consulta CEP */}
                <Card className="shadow-sm border border-green-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-green-600" />
                      <Label className="font-medium">Consulta CEP</Label>
                      <Badge
                        variant="outline"
                        className="text-xs bg-green-100 text-green-600 border-green-200"
                      >
                        Via CEP
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="00000-000"
                        value={cepQuery}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, "");
                          const formatted = value.replace(
                            /(\d{5})(\d{3})/,
                            "$1-$2"
                          );
                          setCepQuery(formatted);
                        }}
                        maxLength={9}
                        className="flex-1"
                      />
                      <Button
                        onClick={consultCEP}
                        disabled={loading}
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                      >
                        {loading ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {cepData && (
                      <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="space-y-2 text-sm">
                          <div>
                            <strong>Logradouro:</strong> {cepData.logradouro}
                          </div>
                          <div>
                            <strong>Bairro:</strong> {cepData.bairro}
                          </div>
                          <div>
                            <strong>Cidade:</strong> {cepData.localidade}
                          </div>
                          <div>
                            <strong>UF:</strong> {cepData.uf}
                          </div>
                          <div>
                            <strong>DDD:</strong> {cepData.ddd}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Validador de Inscrição Estadual */}
                <Card className="shadow-sm border border-orange-100">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-orange-600" />
                      <Label className="font-medium">Validador de IE</Label>
                      <Badge
                        variant="outline"
                        className="text-xs bg-orange-100 text-orange-600 border-orange-200"
                      >
                        Estrutural
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <select
                        value={ufSelecionada}
                        onChange={(e) => setUfSelecionada(e.target.value)}
                        className="w-full p-2 border rounded"
                      >
                        <option value="">Selecione o Estado</option>
                        <option value="SP">São Paulo</option>
                        <option value="RJ">Rio de Janeiro</option>
                        <option value="MG">Minas Gerais</option>
                        <option value="RS">Rio Grande do Sul</option>
                        <option value="PR">Paraná</option>
                        <option value="SC">Santa Catarina</option>
                        <option value="BA">Bahia</option>
                        <option value="GO">Goiás</option>
                        <option value="ES">Espírito Santo</option>
                        <option value="DF">Distrito Federal</option>
                      </select>

                      <Input
                        placeholder="Inscrição Estadual ou ISENTO"
                        value={inscricaoEstadual}
                        onChange={(e) => setInscricaoEstadual(e.target.value)}
                      />
                    </div>

                    <Button
                      onClick={validateInscricaoEstadual}
                      disabled={!inscricaoEstadual || !ufSelecionada}
                      size="sm"
                      className="w-full bg-orange-600 hover:bg-orange-700"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      Validar IE
                    </Button>

                    {ieValidationResult && (
                      <div
                        className={`p-4 rounded-lg border ${
                          ieValidationResult.valid
                            ? "bg-green-50 border-green-200"
                            : "bg-red-50 border-red-200"
                        }`}
                      >
                        <div className="space-y-2 text-sm">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Status:</span>
                            <Badge
                              className={
                                ieValidationResult.valid
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }
                            >
                              {ieValidationResult.status}
                            </Badge>
                          </div>
                          <div>
                            <strong>Resultado:</strong>{" "}
                            {ieValidationResult.message}
                          </div>
                          {ieValidationResult.uf && (
                            <div>
                              <strong>Estado:</strong> {ieValidationResult.uf}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Aba Sites Úteis */}
            <TabsContent value="sites" className="mt-4">
              <div className="space-y-6">
                {Object.entries(
                  publicSites.reduce((acc, site) => {
                    if (!acc[site.category]) acc[site.category] = [];
                    acc[site.category].push(site);
                    return acc;
                  }, {} as Record<string, typeof publicSites>)
                ).map(([category, sites]) => (
                  <Card key={category} className="shadow-sm">
                    <CardHeader className="pb-3">
                      <h4 className="font-medium text-gray-800 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-emerald-600" />
                        {category}
                      </h4>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-3 md:grid-cols-2">
                        {sites.map((site, index) => (
                          <Card
                            key={index}
                            className="p-4 border border-emerald-100 hover:bg-emerald-50 transition-colors cursor-pointer group"
                            onClick={() => {
                              window.open(site.url, "_blank");
                              toast.success(`Abrindo ${site.name}`);
                            }}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                                  <site.icon className="w-5 h-5 text-emerald-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {site.name}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    {site.description}
                                  </p>
                                </div>
                              </div>
                              <ExternalLink className="w-4 h-4 text-emerald-600 group-hover:text-emerald-700" />
                            </div>
                          </Card>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
