"use client"
import { PendingDataType } from "@prisma/client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export const translatePendingType = (type: PendingDataType) => {
  const translations: Record<PendingDataType, string> = {
    DATA_NOME_COMPLETO: "Nome Completo",
    DATA_CPF: "CPF",
    DATA_RG: "RG",
    DATA_ENDERECO: "Endereço",
    DATA_TELEFONE: "Telefone",
    DATA_EMAIL: "Email",
    DATA_NASCIMENTO: "Data de Nascimento",
    DATA_NOME_MAE: "Nome da Mãe",
    DOC_IDENTIDADE: "Documento de Identidade",
    DOC_RESIDENCIA: "Comprovante de Residência",
    DOC_COMPROVANTE_ENDERECO: "Comprovante de Endereço",
    DOC_COMPROVANTE_EMPRESA: "Comprovante da Empresa",
    DOC_COMPROVANTE_RENDA: "Comprovante de Renda",
    DOC_CPF: "CPF",
    COMPANY_NAME: "Nome da Empresa",
    COMPANY_PRINCIPAL_ACTIVITY: "Atividade Principal"
  };
  
  return translations[type] || type;
};

export function PendingDataBadge({ type, isNew = false }: { type: PendingDataType, isNew?: boolean }) {
  return (
    <Badge 
      variant="outline" 
      className={cn(
        isNew 
          ? "bg-yellow-100 text-yellow-800 border-yellow-300" 
          : "bg-yellow-50 text-yellow-700 border-yellow-200",
        "flex items-center gap-1.5"
      )}
    >
      <AlertTriangle className="h-3 w-3" />
      {translatePendingType(type)}
    </Badge>
  );
}