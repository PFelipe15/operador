export function getCategoryText(category: string) {
  switch (category) {
    case "status":
      return "Atualização de Status";
    case "document":
      return "Documentação";
    case "data":
      return "Dados Cadastrais";
    case "analysis":
      return "Análise";
    default:
      return "Informação";
  }
} 