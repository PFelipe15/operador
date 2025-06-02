import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const paymentId = params.id;

    // Busca o processo que tem esse paymentId
    const process = await prisma.process.findFirst({
      where: { paymentId: paymentId },
      include: {
        client: true,
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Pagamento não encontrado" },
        { status: 404 }
      );
    }

    // Aqui você integraria com a API do Mercado Pago para verificar o status real
    // Por enquanto, vou simular a verificação
    const mercadoPagoResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MERCADO_PAGO_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mercadoPagoResponse.ok) {
      throw new Error("Erro ao consultar Mercado Pago");
    }

    const paymentData = await mercadoPagoResponse.json();

    // Mapeia os status do Mercado Pago para nossos status
    const statusMapping: Record<string, string> = {
      pending: "PAYMENT_PENDING",
      approved: "PAYMENT_CONFIRMED",
      authorized: "PAYMENT_PENDING",
      in_process: "PAYMENT_PENDING",
      in_mediation: "PAYMENT_PENDING",
      rejected: "PAYMENT_FAILED",
      cancelled: "PAYMENT_FAILED",
      refunded: "PAYMENT_FAILED",
      charged_back: "PAYMENT_FAILED",
    };

    const newStatus = statusMapping[paymentData.status] || process.status;
    let updatedProcess = process;

    // Se o status mudou, atualiza o processo
    if (newStatus !== process.status) {
      updatedProcess = await prisma.process.update({
        where: { id: process.id },
        data: {
          status: newStatus,
          paymentConfirmedAt:
            paymentData.status === "approved" ? new Date() : null,
          updatedAt: new Date(),
        },
        include: {
          client: true,
        },
      });

      // Adiciona evento na timeline
      await prisma.timelineEvent.create({
        data: {
          title: `Status de pagamento atualizado`,
          description: `Pagamento ${paymentData.status} - Valor: R$ ${paymentData.transaction_amount}`,
          type:
            paymentData.status === "approved"
              ? "SUCCESS"
              : paymentData.status === "rejected"
              ? "ERROR"
              : "INFO",
          category: "STATUS",
          processId: process.id,
          source: "SYSTEM",
          metadata: JSON.stringify({
            paymentId: paymentId,
            mercadoPagoStatus: paymentData.status,
            transactionAmount: paymentData.transaction_amount,
          }),
        },
      });
    }

    return NextResponse.json({
      success: true,
      status: newStatus,
      mercadoPagoStatus: paymentData.status,
      paymentData: {
        id: paymentData.id,
        status: paymentData.status,
        status_detail: paymentData.status_detail,
        transaction_amount: paymentData.transaction_amount,
        date_created: paymentData.date_created,
        date_approved: paymentData.date_approved,
        payment_method_id: paymentData.payment_method_id,
        external_reference: paymentData.external_reference,
      },
      process: updatedProcess,
    });
  } catch (error) {
    console.error("Erro ao verificar status de pagamento:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Erro ao verificar status de pagamento",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
