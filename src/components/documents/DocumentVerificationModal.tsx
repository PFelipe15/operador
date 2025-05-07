import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  CheckCircle2,
  Eye,
  FileText,
   AlertCircle,
  FileX,
  FileMinus,
  FileQuestion,
  FileX2,
  MessageSquare,
} from "lucide-react";
import {
  Document,
  DocumentStatus,
  Operator,
  TimelineEventCategory,
  TimelineEventType,
} from "@prisma/client";
import { cn } from "@/lib/utils";

const rejectionReasons = [
  {
    id: "ilegivel",
    label: "Documento ilegível",
    description: "O documento está muito borrado ou com baixa qualidade",
    icon: FileX,
  },
  {
    id: "incompleto",
    label: "Documento incompleto",
    description: "Faltam páginas ou informações importantes",
    icon: FileMinus,
  },
  {
    id: "invalido",
    label: "Documento inválido",
    description: "O documento não é válido ou está expirado",
    icon: FileQuestion,
  },
  {
    id: "incorreto",
    label: "Documento incorreto",
    description: "O documento enviado não corresponde ao solicitado",
    icon: FileX2,
  },
  {
    id: "outro",
    label: "Outro motivo",
    description: "Especifique outro motivo de rejeição",
    icon: MessageSquare,
  },
];

interface DocumentVerificationModalProps {
  document: Document & {
    uploadedBy?: Operator | null;
    verifiedBy?: Operator | null;
    rejectionBy?: Operator | null;
  };
  processId: string;
  operatorId?: string;
  onVerificationSuccess: () => void;
}

export function DocumentVerificationModal({
  document,
  processId,
  operatorId,
  onVerificationSuccess,
}: DocumentVerificationModalProps) {
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");

  const handleVerifyDocument = async (status: DocumentStatus) => {
    const finalRejectionReason =
      status === "REJECTED"
        ? selectedReason === "outro"
          ? customReason
          : rejectionReasons.find((r) => r.id === selectedReason)?.label
        : null;

    try {
      await toast.promise(
        async () => {
          const response = await fetch(
            `/api/v1/processes/${processId}/documents/${document.id}`,
            {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                verified: true,
                status,
                rejectionReason: finalRejectionReason,
                operatorId,
                 timelineEvent: {
                  title: "Documento Analisado",
                  description: `Documento ${document.name} ${
                    status === "REJECTED"
                      ? `rejeitado com a seguinte razão: ${finalRejectionReason}`
                      : "validado"
                  }`,
                  type: "SUCCESS" as TimelineEventType,
                  category: "DOCUMENT" as TimelineEventCategory,
                  source: "MANUAL",
                  operatorId,
                  metadata: JSON.stringify({
                    documentId: document.id,
                    documentType: document.name,
                  }),
                },
              }),
            }
          );

          if (!response.ok) throw new Error("Erro ao verificar documento");

          setSelectedReason("");
          setCustomReason("");
          onVerificationSuccess();
        },
        {
          loading: "Verificando documento...",
          success: "Documento verificado com sucesso",
          error: "Erro ao verificar documento",
        }
      );
    } catch (error) {
      console.error("Erro ao verificar documento:", error);
      toast.error("Erro ao verificar documento", {
        description: "Não foi possível verificar o documento.",
      });
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant={document.status === "REJECTED" ? "destructive" : "outline"}
          size="sm"
          className="gap-2"
        >
          <CheckCircle2 className="h-4 w-4" />
          Verificar
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader className="space-y-2">
          <AlertDialogTitle className="text-xl font-semibold">
            Verificar Documento
          </AlertDialogTitle>
          <AlertDialogDescription>
            Analise o documento e decida pela aprovação ou rejeição
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-2">
          {/* Card de Informações do Documento */}
          <div className="rounded-lg border bg-gray-50/50 p-4">
            <div className="flex items-center gap-3 mb-3">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-medium">Informações do Documento</h3>
            </div>

            <div className="grid gap-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Nome:</span>
                <span className="font-medium">{document.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Data de Envio:</span>
                <span className="font-medium">
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Botão de Visualização */}
          <Button variant="outline" className="w-full gap-2">
            <Eye className="h-4 w-4" />
            Visualizar Documento
          </Button>

          {/* Opções de Rejeição */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <h3 className="font-medium">Motivo da Rejeição</h3>
            </div>

            <RadioGroup
              value={selectedReason}
              onValueChange={setSelectedReason}
              className="gap-2"
            >
              {rejectionReasons.map((reason) => {
                const Icon = reason.icon;
                return (
                  <div
                    key={reason.id}
                    className={cn(
                      "flex items-start space-x-3 space-y-0 rounded-lg border p-3 transition-all duration-200",
                      selectedReason === reason.id
                        ? "border-primary bg-primary/5"
                        : "hover:border-primary/50 hover:bg-gray-50"
                    )}
                  >
                    <RadioGroupItem
                      value={reason.id}
                      id={reason.id}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        <Label
                          htmlFor={reason.id}
                          className="text-sm font-medium"
                        >
                          {reason.label}
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {reason.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </RadioGroup>

            {selectedReason === "outro" && (
              <div className="space-y-2">
                <Input
                  placeholder="Descreva o motivo da rejeição"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </div>

        <AlertDialogFooter className="gap-2 sm:gap-0">
          <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
          <Button
            variant="destructive"
            onClick={() => handleVerifyDocument("REJECTED")}
            disabled={
              selectedReason === "" ||
              (selectedReason === "outro" && !customReason)
            }
            className="gap-2"
            size="sm"
          >
            <FileX className="h-4 w-4" />
            Rejeitar
          </Button>
          <Button
            variant="default"
            onClick={() => handleVerifyDocument("VERIFIED")}
            className="gap-2"
            size="sm"
          >
            <CheckCircle2 className="h-4 w-4" />
            Aprovar
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
