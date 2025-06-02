import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TaskStatus } from "@prisma/client";

// PUT - Atualizar tarefa
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const body = await request.json();
    const { title, description, priority, dueDate, assignedTo, status } = body;

    const task = await prisma.task.update({
      where: {
        id: params.taskId,
        processId: params.id,
      },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(priority !== undefined && { priority }),
        ...(dueDate !== undefined && {
          dueDate: dueDate ? new Date(dueDate) : null,
        }),
        ...(assignedTo !== undefined && { assignedTo }),
        ...(status !== undefined && {
          status,
          ...(status === TaskStatus.COMPLETED && { completedAt: new Date() }),
          ...(status !== TaskStatus.COMPLETED && { completedAt: null }),
        }),
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

    return NextResponse.json(task);
  } catch (error) {
    console.error("Erro ao atualizar tarefa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar tarefa
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    await prisma.task.delete({
      where: {
        id: params.taskId,
        processId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar tarefa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle status da tarefa
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    const task = await prisma.task.findUnique({
      where: {
        id: params.taskId,
        processId: params.id,
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Tarefa não encontrada" },
        { status: 404 }
      );
    }

    const newStatus =
      task.status === TaskStatus.COMPLETED
        ? TaskStatus.PENDING
        : TaskStatus.COMPLETED;

    const updatedTask = await prisma.task.update({
      where: {
        id: params.taskId,
      },
      data: {
        status: newStatus,
        completedAt: newStatus === TaskStatus.COMPLETED ? new Date() : null,
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

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Erro ao toggle status da tarefa:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
