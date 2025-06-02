import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
} from "lucide-react";

interface PaymentStatusBadgeProps {
  status: string;
  paymentAmount?: number | null;
  paymentMethod?: string | null;
  paymentConfirmedAt?: string | null;
  size?: "sm" | "md" | "lg";
}

export function PaymentStatusBadge({
  status,
  paymentAmount,
  paymentMethod,
  paymentConfirmedAt,
  size = "sm",
}: PaymentStatusBadgeProps) {
  const getPaymentStatusInfo = () => {
    switch (status) {
      case "AWAITING_PAYMENT":
        return {
          icon: Clock,
          text: "Aguardando Pagamento",
          variant: "outline" as const,
          className: "border-orange-200 bg-orange-50 text-orange-700",
        };
      case "PAYMENT_PENDING":
        return {
          icon: DollarSign,
          text: "Pagamento Pendente",
          variant: "outline" as const,
          className: "border-yellow-200 bg-yellow-50 text-yellow-700",
        };
      case "PAYMENT_CONFIRMED":
        return {
          icon: CheckCircle,
          text: "Pagamento Confirmado",
          variant: "outline" as const,
          className: "border-emerald-200 bg-emerald-50 text-emerald-700",
        };
      case "PAYMENT_FAILED":
        return {
          icon: XCircle,
          text: "Pagamento Falhado",
          variant: "outline" as const,
          className: "border-red-200 bg-red-50 text-red-700",
        };
      default:
        return null;
    }
  };

  const paymentInfo = getPaymentStatusInfo();

  if (!paymentInfo) return null;

  const Icon = paymentInfo.icon;
  const iconSize =
    size === "lg" ? "h-4 w-4" : size === "md" ? "h-3.5 w-3.5" : "h-3 w-3";
  const textSize = size === "lg" ? "text-sm" : "text-xs";

  return (
    <Badge
      variant={paymentInfo.variant}
      className={cn(
        "flex items-center gap-1.5 font-medium",
        paymentInfo.className,
        textSize
      )}
    >
      <Icon className={iconSize} />
      <span>{paymentInfo.text}</span>
      {paymentAmount && (
        <span className="ml-1 font-semibold">
          R$ {paymentAmount.toFixed(2)}
        </span>
      )}
    </Badge>
  );
}

export function PaymentMethodBadge({
  paymentMethod,
}: {
  paymentMethod: string | null;
}) {
  if (!paymentMethod) return null;

  const getMethodInfo = () => {
    switch (paymentMethod) {
      case "PIX":
        return {
          icon: DollarSign,
          text: "PIX",
          className: "border-blue-200 bg-blue-50 text-blue-700",
        };
      case "CREDIT_CARD":
        return {
          icon: CreditCard,
          text: "Cartão Crédito",
          className: "border-purple-200 bg-purple-50 text-purple-700",
        };
      case "BOLETO":
        return {
          icon: AlertTriangle,
          text: "Boleto",
          className: "border-gray-200 bg-gray-50 text-gray-700",
        };
      default:
        return {
          icon: DollarSign,
          text: paymentMethod,
          className: "border-gray-200 bg-gray-50 text-gray-700",
        };
    }
  };

  const methodInfo = getMethodInfo();
  const Icon = methodInfo.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "flex items-center gap-1 text-xs font-medium",
        methodInfo.className
      )}
    >
      <Icon className="h-3 w-3" />
      <span>{methodInfo.text}</span>
    </Badge>
  );
}
