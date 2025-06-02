import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ReminderType } from "@prisma/client";

// GET - Buscar todos os lembretes de um processo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reminders = await prisma.reminder.findMany({
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
      orderBy: [
        { completed: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(reminders);
  } catch (error) {
    console.error("Erro ao buscar lembretes:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar novo lembrete
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, type, dueDate, operatorId } = body;

    if (!title || !dueDate || !operatorId) {
      return NextResponse.json(
        { error: "Título, data de vencimento e operador são obrigatórios" },
        { status: 400 }
      );
    }

    // Verificar se o processo existe
    const process = await prisma.process.findUnique({
      where: { id: params.id },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        title,
        description: description || null,
        type: type || ReminderType.DEADLINE,
        dueDate: new Date(dueDate),
        processId: params.id,
        createdBy: operatorId,
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

    return NextResponse.json(reminder, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar lembrete:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
