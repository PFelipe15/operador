import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/ui/use-toast";
import { PaymentStatusBadge, PaymentMethodBadge } from "./PaymentStatusBadge";
import { EditableField } from "./EditableField";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  RefreshCw,
  Calendar,
  Link as LinkIcon,
} from "lucide-react";

interface PaymentData {
  paymentRequired: boolean;
  paymentAmount: number | null;
  paymentMethod: string | null;
  paymentId: string | null;
  paymentPixKey: string | null;
  paymentQrCode: string | null;
  paymentDueDate: string | null;
  paymentConfirmedAt: string | null;
  paymentReference: string | null;
  status: string;
}

interface PaymentSectionProps {
  processId: string;
  paymentData: PaymentData;
  onPaymentUpdate: () => void;
}

export function PaymentSection({
  processId,
  paymentData,
  onPaymentUpdate,
}: PaymentSectionProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleUpdatePaymentAmount = async (newAmount: string) => {
    try {
      const response = await fetch(`/api/v1/processes/${processId}/payment`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentAmount: parseFloat(newAmount),
        }),
      });

      if (!response.ok) throw new Error("Erro ao atualizar valor");

      toast({
        title: "Valor atualizado",
        description: "Valor do pagamento foi atualizado com sucesso",
      });

      onPaymentUpdate();
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o valor do pagamento",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleCheckPaymentStatus = async () => {
    if (!paymentData.paymentId) return;

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/v1/payments/${paymentData.paymentId}/status`
      );
      const data = await response.json();

      if (data.success) {
        toast({
          title: "Status verificado",
          description: `Status do pagamento: ${data.status}`,
        });
        onPaymentUpdate();
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível verificar o status do pagamento",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const formatPaymentMethod = (method: string | null) => {
    if (!method) return "Não definido";

    const methods: Record<string, string> = {
      PIX: "PIX",
      CREDIT_CARD: "Cartão de Crédito",
      CREDIT_CARD_INSTALLMENTS: "Cartão Parcelado",
      DEBIT_CARD: "Cartão de Débito",
      BOLETO: "Boleto Bancário",
    };

    return methods[method] || method;
  };

  if (!paymentData.paymentRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Informações de Pagamento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este processo não requer pagamento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <DollarSign className="h-5 w-5" />
          Informações de Pagamento
          {paymentData.status && (
            <PaymentStatusBadge
              status={paymentData.status}
              paymentAmount={paymentData.paymentAmount}
              size="md"
            />
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EditableField
            label="Valor do Pagamento"
            value={
              paymentData.paymentAmount
                ? `R$ ${paymentData.paymentAmount.toFixed(2)}`
                : ""
            }
            onSave={(value) =>
              handleUpdatePaymentAmount(value.replace(/[R$\s]/g, ""))
            }
            type="text"
          />

          <div className="space-y-2">
            <Label className="text-sm font-medium text-muted-foreground">
              Método de Pagamento
            </Label>
            <div className="flex items-center gap-2">
              <p className="text-base font-medium">
                {formatPaymentMethod(paymentData.paymentMethod)}
              </p>
              {paymentData.paymentMethod && (
                <PaymentMethodBadge paymentMethod={paymentData.paymentMethod} />
              )}
            </div>
          </div>
        </div>

        {/* Datas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {paymentData.paymentDueDate && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Vencimento
              </Label>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p
                  className={cn(
                    "text-base font-medium",
                    new Date(paymentData.paymentDueDate) < new Date()
                      ? "text-red-600"
                      : "text-orange-600"
                  )}
                >
                  {new Date(paymentData.paymentDueDate).toLocaleDateString(
                    "pt-BR"
                  )}
                </p>
              </div>
            </div>
          )}

          {paymentData.paymentConfirmedAt && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Data de Confirmação
              </Label>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
                <p className="text-base font-medium text-emerald-600">
                  {new Date(paymentData.paymentConfirmedAt).toLocaleDateString(
                    "pt-BR",
                    {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  )}
                </p>
              </div>
            </div>
          )}
        </div>

        <Separator />

        {/* Detalhes Técnicos */}
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Detalhes Técnicos</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {paymentData.paymentId && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  ID do Pagamento
                </Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {paymentData.paymentId}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(paymentData.paymentId!, "ID do pagamento")
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {paymentData.paymentReference && (
              <div className="space-y-2">
                <Label className="text-sm font-medium text-muted-foreground">
                  Referência
                </Label>
                <div className="flex items-center gap-2">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                    {paymentData.paymentReference}
                  </code>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(
                        paymentData.paymentReference!,
                        "Referência"
                      )
                    }
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {paymentData.paymentPixKey && (
            <div className="space-y-2">
              <Label className="text-sm font-medium text-muted-foreground">
                Chave PIX
              </Label>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-gray-100 px-2 py-1 rounded flex-1">
                  {paymentData.paymentPixKey}
                </code>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(paymentData.paymentPixKey!, "Chave PIX")
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Ações */}
        <div className="flex flex-wrap gap-2 pt-4 border-t">
          {paymentData.paymentId && (
            <Button
              variant="outline"
              onClick={handleCheckPaymentStatus}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              <RefreshCw
                className={cn("h-4 w-4", isLoading && "animate-spin")}
              />
              Verificar Status
            </Button>
          )}

          {paymentData.paymentQrCode && (
            <Button
              variant="outline"
              onClick={() => window.open(paymentData.paymentQrCode!, "_blank")}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Ver QR Code
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
