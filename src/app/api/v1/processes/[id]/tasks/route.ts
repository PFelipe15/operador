import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskPriority, TaskStatus } from "@prisma/client";

// GET - Buscar todas as tarefas de um processo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tasks = await prisma.task.findMany({
      where: {
        processId: params.id,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Erro ao buscar tarefas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova tarefa
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, assignedTo, operatorId } =
      body;

    if (!title || !operatorId) {
      return NextResponse.json(
        { error: "Título e operador são obrigatórios" },
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

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || TaskPriority.MEDIUM,
        dueDate: dueDate ? new Date(dueDate) : null,
        processId: params.id,
        createdBy: operatorId,
        assignedTo: assignedTo || operatorId,
      },
      include: {
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar tarefa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
