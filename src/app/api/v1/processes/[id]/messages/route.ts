import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - Buscar todas as mensagens de um processo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messages = await prisma.message.findMany({
      where: {
        processId: params.id,
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return NextResponse.json(messages);
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova mensagem
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, messageType, fromMe, operatorId, remoteJid } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Conteúdo da mensagem é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se o processo existe
    const process = await prisma.process.findUnique({
      where: { id: params.id },
      include: {
        client: true,
      },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const message = await prisma.message.create({
      data: {
        content,
        messageType: messageType || "text",
        fromMe: fromMe || false,
        remoteJid: remoteJid || process.client.phone || "",
        timestamp: new Date(),
        processId: params.id,
        operatorId: fromMe ? operatorId : null,
      },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(message, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar mensagem:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
