import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// PUT - Atualizar nota
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const body = await request.json();
    const { content, type, priority, tags, pinned } = body;

    const note = await prisma.note.update({
      where: {
        id: params.noteId,
        processId: params.id,
      },
      data: {
        ...(content !== undefined && { content }),
        ...(type !== undefined && { type }),
        ...(priority !== undefined && { priority }),
        ...(tags !== undefined && { tags }),
        ...(pinned !== undefined && { pinned }),
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

    return NextResponse.json(note);
  } catch (error) {
    console.error("Erro ao atualizar nota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// DELETE - Deletar nota
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    await prisma.note.delete({
      where: {
        id: params.noteId,
        processId: params.id,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao deletar nota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// PATCH - Toggle pin da nota
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; noteId: string } }
) {
  try {
    const note = await prisma.note.findUnique({
      where: {
        id: params.noteId,
        processId: params.id,
      },
    });

    if (!note) {
      return NextResponse.json(
        { error: "Nota não encontrada" },
        { status: 404 }
      );
    }

    const updatedNote = await prisma.note.update({
      where: {
        id: params.noteId,
      },
      data: {
        pinned: !note.pinned,
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

    return NextResponse.json(updatedNote);
  } catch (error) {
    console.error("Erro ao toggle pin da nota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
