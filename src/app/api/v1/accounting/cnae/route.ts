import { NextRequest, NextResponse } from "next/server";

// Base de dados expandida de CNAE
const cnaeDatabase = [
  // Comércio
  {
    codigo: "47.11-3-01",
    descricao:
      "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - hipermercados",
  },
  {
    codigo: "47.11-3-02",
    descricao:
      "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - minimercados, mercearias e armazéns",
  },
  {
    codigo: "47.12-1-00",
    descricao:
      "Comércio varejista de mercadorias em geral, com predominância de produtos alimentícios - supermercados",
  },
  {
    codigo: "47.21-1-02",
    descricao:
      "Comércio varejista de produtos de padaria, laticínio, doces, balas e semelhantes",
  },
  {
    codigo: "47.22-9-01",
    descricao: "Comércio varejista de carnes e pescados - açougues",
  },
  {
    codigo: "47.31-8-00",
    descricao: "Comércio varejista de combustíveis para veículos automotores",
  },
  {
    codigo: "47.41-5-99",
    descricao:
      "Comércio varejista de material de construção não especificado anteriormente",
  },
  {
    codigo: "47.51-2-01",
    descricao:
      "Comércio varejista especializado de equipamentos e suprimentos de informática",
  },
  {
    codigo: "47.61-0-01",
    descricao: "Comércio varejista de livros",
  },
  {
    codigo: "47.71-7-01",
    descricao:
      "Comércio varejista de produtos farmacêuticos, sem manipulação de fórmulas",
  },
  {
    codigo: "47.82-2-02",
    descricao: "Comércio varejista de calçados",
  },
  {
    codigo: "47.83-1-01",
    descricao: "Comércio varejista de artigos do vestuário e acessórios",
  },
  {
    codigo: "47.85-7-99",
    descricao:
      "Comércio varejista de outros artigos de uso pessoal e doméstico não especificados anteriormente",
  },
  {
    codigo: "47.89-0-99",
    descricao:
      "Comércio varejista de outros produtos não especificados anteriormente",
  },

  // Alimentação
  {
    codigo: "56.11-2-01",
    descricao:
      "Restaurantes e outros estabelecimentos de serviços de alimentação e bebidas",
  },
  {
    codigo: "56.12-1-00",
    descricao: "Serviços ambulantes de alimentação",
  },
  {
    codigo: "56.20-1-00",
    descricao:
      "Serviços de catering, bufê e outros serviços de comida preparada",
  },
  {
    codigo: "56.30-8-01",
    descricao: "Lanchonetes, casas de chá, de sucos e similares",
  },
  {
    codigo: "56.30-8-02",
    descricao:
      "Bares e outros estabelecimentos especializados em servir bebidas",
  },

  // Tecnologia
  {
    codigo: "62.01-5-00",
    descricao: "Desenvolvimento de programas de computador sob encomenda",
  },
  {
    codigo: "62.02-3-00",
    descricao:
      "Desenvolvimento e licenciamento de programas de computador customizáveis",
  },
  {
    codigo: "62.03-1-00",
    descricao:
      "Desenvolvimento e licenciamento de programas de computador não-customizáveis",
  },
  {
    codigo: "62.04-0-00",
    descricao: "Consultoria em tecnologia da informação",
  },
  {
    codigo: "62.09-1-00",
    descricao:
      "Suporte técnico, manutenção e outros serviços em tecnologia da informação",
  },
  {
    codigo: "63.11-9-00",
    descricao:
      "Tratamento de dados, provedores de serviços de aplicação e serviços de hospedagem na internet",
  },
  {
    codigo: "63.19-4-00",
    descricao:
      "Portais, provedores de conteúdo e outros serviços de informação na internet",
  },

  // Serviços de Beleza
  {
    codigo: "96.02-5-01",
    descricao: "Cabeleireiros, manicure e pedicure",
  },
  {
    codigo: "96.02-5-02",
    descricao:
      "Atividades de estética e outros serviços de cuidados com a beleza",
  },
  {
    codigo: "96.09-2-01",
    descricao: "Clínicas de estética e similares",
  },

  // Construção
  {
    codigo: "43.11-8-00",
    descricao: "Demolição e preparação de canteiro de obras",
  },
  {
    codigo: "43.12-6-00",
    descricao: "Perfurações e sondagens",
  },
  {
    codigo: "43.21-5-00",
    descricao: "Instalação e manutenção elétrica",
  },
  {
    codigo: "43.22-3-01",
    descricao: "Instalações hidráulicas, sanitárias e de gás",
  },
  {
    codigo: "43.22-3-02",
    descricao: "Instalações elétricas",
  },
  {
    codigo: "43.30-4-05",
    descricao:
      "Aplicação de revestimentos e de resinas em interiores e exteriores",
  },
  {
    codigo: "43.91-1-01",
    descricao: "Obras de terraplanagem",
  },
  {
    codigo: "43.99-1-99",
    descricao:
      "Serviços especializados para construção não especificados anteriormente",
  },
  {
    codigo: "41.20-4-00",
    descricao: "Construção de edifícios",
  },

  // Serviços Automotivos
  {
    codigo: "45.11-1-01",
    descricao:
      "Comércio a varejo de automóveis, camionetas e utilitários novos",
  },
  {
    codigo: "45.12-9-01",
    descricao:
      "Comércio a varejo de automóveis, camionetas e utilitários usados",
  },
  {
    codigo: "45.20-0-01",
    descricao:
      "Serviços de manutenção e reparação mecânica de veículos automotores",
  },
  {
    codigo: "45.20-0-02",
    descricao:
      "Serviços de lanternagem ou funilaria e pintura de veículos automotores",
  },
  {
    codigo: "45.20-0-04",
    descricao:
      "Serviços de manutenção e reparação elétrica de veículos automotores",
  },
  {
    codigo: "45.30-7-01",
    descricao:
      "Comércio por atacado de peças e acessórios para veículos automotores",
  },
  {
    codigo: "45.30-7-02",
    descricao:
      "Comércio a varejo de peças e acessórios para veículos automotores",
  },

  // Educação
  {
    codigo: "85.13-9-00",
    descricao: "Ensino de nível fundamental",
  },
  {
    codigo: "85.20-1-00",
    descricao: "Ensino médio",
  },
  {
    codigo: "85.31-1-00",
    descricao: "Educação superior - graduação",
  },
  {
    codigo: "85.41-2-00",
    descricao: "Educação profissional de nível técnico",
  },
  {
    codigo: "85.42-1-00",
    descricao: "Educação profissional de nível tecnológico",
  },
  {
    codigo: "85.50-3-01",
    descricao: "Administração de caixas escolares",
  },
  {
    codigo: "85.59-6-99",
    descricao: "Outras atividades de ensino não especificadas anteriormente",
  },
  {
    codigo: "85.91-1-00",
    descricao: "Ensino de esportes",
  },
  {
    codigo: "85.92-9-99",
    descricao: "Ensino de arte e cultura não especificado anteriormente",
  },
  {
    codigo: "85.99-6-01",
    descricao: "Formação de condutores",
  },
  {
    codigo: "85.99-6-99",
    descricao: "Outras atividades de ensino não especificadas anteriormente",
  },

  // Saúde
  {
    codigo: "86.10-1-01",
    descricao:
      "Atividades de atendimento hospitalar, exceto pronto-socorro e unidades para atendimento a urgências",
  },
  {
    codigo: "86.21-6-01",
    descricao: "UTI móvel",
  },
  {
    codigo: "86.30-5-01",
    descricao:
      "Atividade médica ambulatorial com recursos para realização de procedimentos cirúrgicos",
  },
  {
    codigo: "86.30-5-02",
    descricao:
      "Atividade médica ambulatorial com recursos para realização de exames complementares",
  },
  {
    codigo: "86.30-5-03",
    descricao: "Atividade médica ambulatorial restrita a consultas",
  },
  {
    codigo: "86.40-2-02",
    descricao: "Atividades de fisioterapia",
  },
  {
    codigo: "86.40-2-03",
    descricao: "Atividades de terapia ocupacional",
  },
  {
    codigo: "86.50-0-02",
    descricao: "Atividades de profissionais da nutrição",
  },
  {
    codigo: "86.60-7-00",
    descricao: "Atividades de apoio à gestão de saúde",
  },

  // Transporte
  {
    codigo: "49.20-2-01",
    descricao: "Transporte rodoviário de passageiros, regular, urbano",
  },
  {
    codigo: "49.30-2-01",
    descricao: "Transporte rodoviário de carga, municipal",
  },
  {
    codigo: "49.30-2-02",
    descricao:
      "Transporte rodoviário de carga, intermunicipal, interestadual e internacional",
  },
  {
    codigo: "49.40-0-00",
    descricao: "Transporte dutoviário",
  },
  {
    codigo: "50.11-4-01",
    descricao: "Transporte marítimo de cabotagem - passageiros",
  },
  {
    codigo: "51.11-1-00",
    descricao: "Transporte aéreo de passageiros regular",
  },

  // Serviços Gerais
  {
    codigo: "68.10-2-02",
    descricao: "Aluguel de imóveis próprios",
  },
  {
    codigo: "69.11-7-01",
    descricao: "Atividades jurídicas, exceto cartórios",
  },
  {
    codigo: "69.20-6-01",
    descricao: "Atividades de contabilidade",
  },
  {
    codigo: "70.20-4-00",
    descricao: "Atividades de consultoria em gestão empresarial",
  },
  {
    codigo: "71.11-1-00",
    descricao: "Serviços de arquitetura",
  },
  {
    codigo: "71.12-0-00",
    descricao: "Serviços de engenharia",
  },
  {
    codigo: "73.11-4-00",
    descricao: "Agências de publicidade",
  },
  {
    codigo: "74.90-1-04",
    descricao:
      "Atividades de intermediação e agenciamento de serviços e negócios em geral, exceto imobiliários",
  },
  {
    codigo: "81.11-7-00",
    descricao:
      "Serviços combinados para apoio a edifícios, exceto condomínios prediais",
  },
  {
    codigo: "81.21-4-00",
    descricao: "Limpeza em prédios e em domicílios",
  },
  {
    codigo: "81.22-2-00",
    descricao: "Imunização e controle de pragas urbanas",
  },
  {
    codigo: "82.11-3-00",
    descricao: "Serviços combinados de escritório e apoio administrativo",
  },
  {
    codigo: "82.99-7-99",
    descricao:
      "Outras atividades de serviços prestados principalmente às empresas não especificadas anteriormente",
  },
  {
    codigo: "95.11-8-00",
    descricao:
      "Reparação e manutenção de computadores e de equipamentos periféricos",
  },
  {
    codigo: "95.12-6-00",
    descricao: "Reparação e manutenção de equipamentos de comunicação",
  },
  {
    codigo: "96.01-7-01",
    descricao: "Lavanderias",
  },
  {
    codigo: "96.01-7-02",
    descricao: "Tinturarias",
  },
  {
    codigo: "96.09-2-99",
    descricao:
      "Outras atividades de serviços pessoais não especificadas anteriormente",
  },

  // Hospedagem
  {
    codigo: "55.10-8-00",
    descricao: "Hotéis e similares",
  },
  {
    codigo: "55.90-6-01",
    descricao: "Albergues, exceto assistenciais",
  },
  {
    codigo: "55.90-6-99",
    descricao: "Outros tipos de alojamento não especificados anteriormente",
  },

  // Indústria
  {
    codigo: "10.91-1-01",
    descricao: "Fabricação de produtos de padaria",
  },
  {
    codigo: "10.91-1-02",
    descricao: "Fabricação de produtos de confeitaria",
  },
  {
    codigo: "11.12-1-01",
    descricao: "Fabricação de aguardentes e outras bebidas destiladas",
  },
  {
    codigo: "13.11-1-00",
    descricao: "Preparação e fiação de fibras de algodão",
  },
  {
    codigo: "14.12-6-01",
    descricao: "Confecção de roupas íntimas",
  },
  {
    codigo: "14.13-4-01",
    descricao: "Confecção de roupas profissionais",
  },
  {
    codigo: "15.10-6-00",
    descricao: "Curtimento e outras preparações de couro",
  },
  {
    codigo: "16.10-2-00",
    descricao: "Desdobramento de madeira",
  },
  {
    codigo: "23.30-3-01",
    descricao:
      "Fabricação de artefatos de concreto, cimento, fibrocimento, gesso e materiais semelhantes",
  },
  {
    codigo: "25.11-0-00",
    descricao: "Fabricação de estruturas metálicas",
  },
];

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { error: "Termo de busca é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar CNAE com base no termo fornecido (melhorada)
    const searchTerm = query.toLowerCase().trim();

    let results = cnaeDatabase.filter(
      (cnae) =>
        cnae.descricao.toLowerCase().includes(searchTerm) ||
        cnae.codigo.includes(searchTerm.replace(/[^\d.-]/g, "")) ||
        // Busca por palavras-chave específicas
        searchTerm
          .split(" ")
          .some(
            (word) =>
              word.length > 2 && cnae.descricao.toLowerCase().includes(word)
          )
    );

    // Se não encontrou resultados, tentar busca mais ampla
    if (results.length === 0) {
      const keywords = extractKeywords(searchTerm);
      results = cnaeDatabase.filter((cnae) =>
        keywords.some((keyword) =>
          cnae.descricao.toLowerCase().includes(keyword.toLowerCase())
        )
      );
    }

    // Ordenar por relevância
    results = results.sort((a, b) => {
      const aScore = getRelevanceScore(a, searchTerm);
      const bScore = getRelevanceScore(b, searchTerm);
      return bScore - aScore;
    });

    // Limitar a 15 resultados
    results = results.slice(0, 15);

    return NextResponse.json(results);
  } catch (error) {
    console.error("Erro na busca CNAE:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

function extractKeywords(searchTerm: string): string[] {
  const commonWords = [
    "de",
    "da",
    "do",
    "das",
    "dos",
    "em",
    "na",
    "no",
    "nas",
    "nos",
    "para",
    "com",
    "sem",
    "por",
    "e",
    "ou",
  ];
  return searchTerm
    .split(" ")
    .filter(
      (word) => word.length > 2 && !commonWords.includes(word.toLowerCase())
    )
    .slice(0, 3); // Limitar a 3 palavras-chave principais
}

function getRelevanceScore(cnae: any, searchTerm: string): number {
  let score = 0;
  const desc = cnae.descricao.toLowerCase();
  const term = searchTerm.toLowerCase();

  // Pontuação por correspondência exata
  if (desc.includes(term)) score += 10;

  // Pontuação por início da descrição
  if (desc.startsWith(term)) score += 5;

  // Pontuação por código
  if (cnae.codigo.includes(term.replace(/[^\d.-]/g, ""))) score += 8;

  // Pontuação por palavras-chave
  const words = term.split(" ");
  words.forEach((word) => {
    if (word.length > 2 && desc.includes(word)) {
      score += 2;
    }
  });

  return score;
}
