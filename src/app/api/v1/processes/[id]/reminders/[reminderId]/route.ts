import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PATCH - Atualizar lembrete (marcar como completo/incompleto)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; reminderId: string } }
) {
  try {
    const body = await request.json();
    const { completed, title, description, dueDate, type } = body;

    // Buscar lembrete existente
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: params.reminderId,
        processId: params.id,
      },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Lembrete não encontrado" },
        { status: 404 }
      );
    }

    // Atualizar apenas os campos fornecidos
    const updateData: any = {};

    if (completed !== undefined) {
      updateData.completed = completed;
    }

    if (title !== undefined) {
      updateData.title = title;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (dueDate !== undefined) {
      updateData.dueDate = new Date(dueDate);
    }

    if (type !== undefined) {
      updateData.type = type;
    }

    const updatedReminder = await prisma.reminder.update({
      where: {
        id: params.reminderId,
      },
      data: updateData,
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

    return NextResponse.json(updatedReminder);
  } catch (error) {
    console.error("Erro ao atualizar lembrete:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Excluir lembrete
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; reminderId: string } }
) {
  try {
    // Verificar se o lembrete existe e pertence ao processo
    const existingReminder = await prisma.reminder.findFirst({
      where: {
        id: params.reminderId,
        processId: params.id,
      },
    });

    if (!existingReminder) {
      return NextResponse.json(
        { error: "Lembrete não encontrado" },
        { status: 404 }
      );
    }

    await prisma.reminder.delete({
      where: {
        id: params.reminderId,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Lembrete excluído com sucesso",
    });
  } catch (error) {
    console.error("Erro ao excluir lembrete:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
