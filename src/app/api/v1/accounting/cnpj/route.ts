import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { cnpj } = await req.json();

    if (!cnpj) {
      return NextResponse.json(
        { error: "CNPJ é obrigatório" },
        { status: 400 }
      );
    }

    // Remover formatação do CNPJ
    const cleanCnpj = cnpj.replace(/\D/g, "");

    // Validar CNPJ
    if (!isValidCNPJ(cleanCnpj)) {
      return NextResponse.json({ error: "CNPJ inválido" }, { status: 400 });
    }

    try {
      // Tentar consulta real na ReceitaWS
      const response = await fetch(
        `https://receitaws.com.br/v1/cnpj/${cleanCnpj}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "User-Agent": "PlataformaOperador/1.0",
          },
          // Timeout de 10 segundos
          signal: AbortSignal.timeout(10000),
        }
      );

      if (!response.ok) {
        throw new Error("Erro na consulta externa");
      }

      const data = await response.json();

      // Verificar se a consulta foi bem-sucedida
      if (data.status === "ERROR") {
        throw new Error(data.message || "CNPJ não encontrado");
      }

      // Transformar dados da ReceitaWS para o formato esperado
      const formattedData = {
        cnpj: formatCNPJ(cleanCnpj),
        status: "OK",
        nome: data.nome || "NÃO INFORMADO",
        fantasia: data.fantasia || "NÃO INFORMADO",
        tipo: data.tipo || "MATRIZ",
        porte: data.porte || "NÃO INFORMADO",
        natureza_juridica: data.natureza_juridica || "NÃO INFORMADO",
        logradouro: data.logradouro || "NÃO INFORMADO",
        numero: data.numero || "S/N",
        municipio: data.municipio || "NÃO INFORMADO",
        bairro: data.bairro || "NÃO INFORMADO",
        uf: data.uf || "NÃO INFORMADO",
        cep: data.cep || "00000-000",
        email: data.email || "NÃO INFORMADO",
        telefone: data.telefone || "NÃO INFORMADO",
        situacao: data.situacao || "NÃO INFORMADO",
        data_situacao: data.data_situacao || "NÃO INFORMADO",
        data_abertura: data.abertura || "NÃO INFORMADO",
        capital_social: data.capital_social || "NÃO INFORMADO",
        cnae_fiscal: {
          codigo: data.atividade_principal?.[0]?.code || "0000-0/00",
          descricao: data.atividade_principal?.[0]?.text || "NÃO INFORMADO",
        },
        cnaes_secundarios:
          data.atividades_secundarias?.map((atividade: any) => ({
            codigo: atividade.code,
            descricao: atividade.text,
          })) || [],
        qsa:
          data.qsa?.map((socio: any) => ({
            nome: socio.nome,
            qual: socio.qual,
          })) || [],
        consulta_realizada: new Date().toISOString(),
        ultima_atualizacao: new Date().toISOString(),
      };

      return NextResponse.json(formattedData);
    } catch (apiError) {
      console.log("Erro na consulta real, usando dados simulados:", apiError);

      // Fallback para dados simulados em caso de erro na API externa
      const mockData = generateMockCNPJData(cleanCnpj, cnpj);

      // Adicionar aviso de que são dados simulados
      mockData.status = "SIMULADO";
      mockData.observacao = "Dados simulados - API externa indisponível";

      return NextResponse.json(mockData);
    }
  } catch (error) {
    console.error("Erro na consulta CNPJ:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function formatCNPJ(cnpj: string): string {
  return cnpj.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
}

function generateMockCNPJData(cleanCnpj: string, formattedCnpj: string) {
  const lastDigit = parseInt(cleanCnpj.slice(-1));

  const companies = [
    {
      nome: "COMERCIO VAREJISTA ABC LTDA",
      fantasia: "Loja ABC",
      cnae: "47.11-3-02",
      cnae_desc:
        "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - minimercados, mercearias e armazéns",
      porte: "MICROEMPRESA",
    },
    {
      nome: "SERVICOS DE BELEZA MARIA LTDA",
      fantasia: "Salão Maria",
      cnae: "96.02-5-01",
      cnae_desc: "Cabeleireiros, manicure e pedicure",
      porte: "MICROEMPRESA",
    },
    {
      nome: "CONSULTORIA EM TECNOLOGIA SILVA EIRELI",
      fantasia: "TechSilva",
      cnae: "62.04-0-00",
      cnae_desc: "Consultoria em tecnologia da informação",
      porte: "PEQUENA EMPRESA",
    },
    {
      nome: "RESTAURANTE SABOR CASEIRO LTDA",
      fantasia: "Sabor Caseiro",
      cnae: "56.11-2-01",
      cnae_desc:
        "Restaurantes e outros estabelecimentos de serviços de alimentação e bebidas",
      porte: "MICROEMPRESA",
    },
    {
      nome: "CONSTRUTORA PEDRA FORTE LTDA",
      fantasia: "Pedra Forte",
      cnae: "41.20-4-00",
      cnae_desc: "Construção de edifícios",
      porte: "PEQUENA EMPRESA",
    },
    {
      nome: "FARMACIA POPULAR LTDA",
      fantasia: "Farmácia Popular",
      cnae: "47.71-7-01",
      cnae_desc:
        "Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas",
      porte: "MICROEMPRESA",
    },
    {
      nome: "TRANSPORTES RAPIDO LTDA",
      fantasia: "Transporte Rápido",
      cnae: "49.30-2-02",
      cnae_desc:
        "Transporte rodoviário de carga, intermunicipal, interestadual e internacional",
      porte: "PEQUENA EMPRESA",
    },
    {
      nome: "ESCOLA DE INFORMATICA DIGITAL LTDA",
      fantasia: "Escola Digital",
      cnae: "85.13-9-00",
      cnae_desc: "Ensino de nível fundamental",
      porte: "MICROEMPRESA",
    },
    {
      nome: "OFICINA MECANICA DO JOAO LTDA",
      fantasia: "Oficina do João",
      cnae: "45.20-0-01",
      cnae_desc:
        "Serviços de manutenção e reparação mecânica de veículos automotores",
      porte: "MICROEMPRESA",
    },
    {
      nome: "PADARIA E CONFEITARIA DOCE VIDA LTDA",
      fantasia: "Doce Vida",
      cnae: "10.91-1-01",
      cnae_desc: "Fabricação de produtos de padaria",
      porte: "MICROEMPRESA",
    },
  ];

  const company = companies[lastDigit] || companies[0];
  const situations = [
    "ATIVA",
    "ATIVA",
    "SUSPENSA",
    "ATIVA",
    "ATIVA",
    "BAIXADA",
    "ATIVA",
    "ATIVA",
    "ATIVA",
    "ATIVA",
  ];
  const addresses = generateAddress(lastDigit);
  const partners = generatePartners(lastDigit);

  return {
    cnpj: formattedCnpj,
    status: "OK",
    nome: company.nome,
    fantasia: company.fantasia,
    tipo: "MATRIZ",
    porte: company.porte,
    natureza_juridica: "206-2 - Sociedade Empresária Limitada",
    logradouro: addresses.logradouro,
    numero: addresses.numero,
    municipio: addresses.municipio,
    bairro: addresses.bairro,
    uf: addresses.uf,
    cep: addresses.cep,
    email: `contato@${company.fantasia
      .toLowerCase()
      .replace(/\s/g, "")}.com.br`,
    telefone: generatePhone(lastDigit),
    situacao: situations[lastDigit] || "ATIVA",
    data_situacao: generateDate(lastDigit),
    data_abertura: generateOpeningDate(lastDigit),
    capital_social: generateCapital(company.porte),
    cnae_fiscal: {
      codigo: company.cnae,
      descricao: company.cnae_desc,
    },
    cnaes_secundarios: generateSecondaryCnaes(lastDigit),
    qsa: partners,
    consulta_realizada: new Date().toISOString(),
    ultima_atualizacao: new Date(
      Date.now() - Math.random() * 86400000 * 30
    ).toISOString(),
  };
}

function generateAddress(lastDigit: number) {
  const streets = [
    "RUA DAS FLORES",
    "AVENIDA BRASIL",
    "RUA PRESIDENTE VARGAS",
    "AVENIDA PAULISTA",
    "RUA DA CONSOLAÇÃO",
    "AVENIDA IPIRANGA",
    "RUA AUGUSTA",
    "AVENIDA FARIA LIMA",
    "RUA OSCAR FREIRE",
    "AVENIDA REBOUÇAS",
  ];

  const neighborhoods = [
    "CENTRO",
    "VILA NOVA",
    "JARDIM AMÉRICA",
    "COPACABANA",
    "IPANEMA",
    "LEBLON",
    "BOTAFOGO",
    "TIJUCA",
    "BARRA DA TIJUCA",
    "CAMPO GRANDE",
  ];

  const cities = [
    "SÃO PAULO",
    "RIO DE JANEIRO",
    "BELO HORIZONTE",
    "SALVADOR",
    "BRASÍLIA",
    "FORTALEZA",
    "RECIFE",
    "PORTO ALEGRE",
    "CURITIBA",
    "GOIÂNIA",
  ];

  const states = ["SP", "RJ", "MG", "BA", "DF", "CE", "PE", "RS", "PR", "GO"];

  return {
    logradouro: streets[lastDigit] || "RUA EXEMPLO",
    numero: String(100 + lastDigit * 50),
    bairro: neighborhoods[lastDigit] || "CENTRO",
    municipio: cities[lastDigit] || "SÃO PAULO",
    uf: states[lastDigit] || "SP",
    cep: `${String(10000 + lastDigit * 1000).padStart(5, "0")}-${String(
      100 + lastDigit * 10
    ).padStart(3, "0")}`,
  };
}

function generatePartners(lastDigit: number) {
  const names = [
    "ANA PAULA SOUZA",
    "CARLOS ROBERTO SILVA",
    "MARIA JOSÉ SANTOS",
    "JOÃO PEDRO OLIVEIRA",
    "FERNANDA LIMA COSTA",
    "RAFAEL MENDES ALVES",
    "JULIANA FERREIRA ROCHA",
    "PEDRO HENRIQUE MARTINS",
    "CAMILA RODRIGUES PEREIRA",
    "LUCAS GABRIEL NASCIMENTO",
  ];

  const roles = [
    "49-Sócio-Administrador",
    "22-Sócio",
    "05-Administrador",
    "49-Sócio-Administrador",
    "22-Sócio",
    "49-Sócio-Administrador",
    "22-Sócio",
    "05-Administrador",
    "49-Sócio-Administrador",
    "22-Sócio",
  ];

  return [
    {
      nome: names[lastDigit] || "JOSE DA SILVA",
      qual: roles[lastDigit] || "49-Sócio-Administrador",
    },
  ];
}

function generatePhone(lastDigit: number): string {
  const ddd = [11, 21, 31, 71, 61, 85, 81, 51, 41, 62][lastDigit] || 11;
  const number = `9${String(1000 + lastDigit * 111).padStart(4, "0")}-${String(
    1000 + lastDigit * 222
  ).padStart(4, "0")}`;
  return `(${ddd}) ${number}`;
}

function generateDate(lastDigit: number): string {
  const year = 2015 + lastDigit;
  const month = (lastDigit % 12) + 1;
  const day = (lastDigit % 28) + 1;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0"
  )}/${year}`;
}

function generateOpeningDate(lastDigit: number): string {
  const year = 2010 + lastDigit;
  const month = (lastDigit % 12) + 1;
  const day = (lastDigit % 28) + 1;
  return `${String(day).padStart(2, "0")}/${String(month).padStart(
    2,
    "0"
  )}/${year}`;
}

function generateCapital(porte: string): string {
  if (porte === "MICROEMPRESA") {
    return "R$ 10.000,00";
  } else if (porte === "PEQUENA EMPRESA") {
    return "R$ 50.000,00";
  }
  return "R$ 1.000,00";
}

function generateSecondaryCnaes(lastDigit: number) {
  const cnaes = [
    {
      codigo: "47.89-0-99",
      descricao:
        "Comércio varejista de outros produtos não especificados anteriormente",
    },
    {
      codigo: "96.09-2-99",
      descricao:
        "Outras atividades de serviços pessoais não especificadas anteriormente",
    },
    {
      codigo: "82.99-7-99",
      descricao:
        "Outras atividades de serviços prestados principalmente às empresas",
    },
  ];

  return lastDigit > 5 ? [cnaes[lastDigit % 3]] : [];
}

function isValidCNPJ(cnpj: string): boolean {
  if (cnpj.length !== 14) return false;

  // Verificar se todos os dígitos são iguais
  if (/^(\d)\1{13}$/.test(cnpj)) return false;

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const weights2 = [6, 7, 8, 9, 2, 3, 4, 5, 6, 7, 8, 9];

  // Validar primeiro dígito verificador
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj[i]) * weights1[i];
  }
  let remainder = sum % 11;
  let firstDigit = remainder < 2 ? 0 : 11 - remainder;

  if (parseInt(cnpj[12]) !== firstDigit) return false;

  // Validar segundo dígito verificador
  sum = 0;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj[i]) * weights2[i];
  }
  remainder = sum % 11;
  let secondDigit = remainder < 2 ? 0 : 11 - remainder;

  return parseInt(cnpj[13]) === secondDigit;
}
