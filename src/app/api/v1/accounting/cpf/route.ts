import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cpf } = await req.json();

    if (!cpf) {
      return NextResponse.json({ error: "CPF é obrigatório" }, { status: 400 });
    }

    // Remover formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, "");

    // Validar CPF
    if (!isValidCPF(cleanCpf)) {
      return NextResponse.json({ error: "CPF inválido" }, { status: 400 });
    }

    // IMPORTANTE: A Receita Federal não oferece API pública para consulta de CPF
    // Por questões de privacidade e LGPD, dados de CPF só podem ser consultados
    // através do portal oficial da Receita Federal com certificado digital

    const response = {
      cpf: formatCPF(cleanCpf),
      status: "VÁLIDO",
      digito_verificador: "CORRETO",
      observacao: "CPF matematicamente válido",
      aviso_importante: [
        "A Receita Federal não oferece API pública para consulta de dados de CPF",
        "Para consultas oficiais, acesse: https://servicos.receita.fazenda.gov.br/",
        "É necessário certificado digital ou conta gov.br para consultas reais",
        "Este sistema apenas valida a estrutura matemática do CPF",
      ],
      consulta_realizada: new Date().toISOString(),
      validacao: {
        estrutura: "VÁLIDA",
        digitos_verificadores: "CORRETOS",
        sequencia_repetida: hasRepeatedSequence(cleanCpf) ? "SIM" : "NÃO",
      },
      proximos_passos: [
        "Para consultar dados reais, acesse o portal da Receita Federal",
        "Utilize certificado digital ou conta gov.br",
        "Consulte: Meu CPF > Situação Cadastral",
      ],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erro na validação CPF:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function formatCPF(cpf: string): string {
  return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}

function hasRepeatedSequence(cpf: string): boolean {
  return /^(\d)\1{10}$/.test(cpf);
}

function isValidCPF(cpf: string): boolean {
  if (cpf.length !== 11) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf[i]) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  let firstDigit = remainder >= 10 ? 0 : remainder;

  if (parseInt(cpf[9]) !== firstDigit) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf[i]) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  let secondDigit = remainder >= 10 ? 0 : remainder;

  return parseInt(cpf[10]) === secondDigit;
}
