import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;
    const body = await request.json();

    // Busca o processo para verificar se existe
    const existingProcess = await prisma.process.findUnique({
      where: { id: processId },
    });

    if (!existingProcess) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    // Atualiza os dados de pagamento
    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        paymentAmount: body.paymentAmount || existingProcess.paymentAmount,
        paymentMethod: body.paymentMethod || existingProcess.paymentMethod,
        paymentId: body.paymentId || existingProcess.paymentId,
        paymentPixKey: body.paymentPixKey || existingProcess.paymentPixKey,
        paymentQrCode: body.paymentQrCode || existingProcess.paymentQrCode,
        paymentDueDate: body.paymentDueDate
          ? new Date(body.paymentDueDate)
          : existingProcess.paymentDueDate,
        paymentConfirmedAt: body.paymentConfirmedAt
          ? new Date(body.paymentConfirmedAt)
          : existingProcess.paymentConfirmedAt,
        paymentReference:
          body.paymentReference || existingProcess.paymentReference,
        paymentRequired:
          body.paymentRequired !== undefined
            ? body.paymentRequired
            : existingProcess.paymentRequired,
        updatedAt: new Date(),
      },
      include: {
        client: true,
        company: true,
        documents: true,
        operator: true,
      },
    });

    // Adiciona evento na timeline se houve mudança significativa
    if (
      body.paymentAmount &&
      body.paymentAmount !== existingProcess.paymentAmount
    ) {
      await prisma.timelineEvent.create({
        data: {
          title: "Valor de pagamento atualizado",
          description: `Valor alterado de R$ ${
            existingProcess.paymentAmount || 0
          } para R$ ${body.paymentAmount}`,
          type: "INFO",
          category: "DATA",
          processId: processId,
          source: "PLATFORM",
        },
      });
    }

    return NextResponse.json({
      success: true,
      process: updatedProcess,
    });
  } catch (error) {
    console.error("Erro ao atualizar pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;

    const process = await prisma.process.findUnique({
      where: { id: processId },
      select: {
        id: true,
        paymentRequired: true,
        paymentAmount: true,
        paymentMethod: true,
        paymentId: true,
        paymentPixKey: true,
        paymentQrCode: true,
        paymentDueDate: true,
        paymentConfirmedAt: true,
        paymentReference: true,
        status: true,
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: process,
    });
  } catch (error) {
    console.error("Erro ao buscar dados de pagamento:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
