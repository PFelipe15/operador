import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { NoteType, NotePriority } from "@prisma/client";

// GET - Buscar todas as notas de um processo
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const notes = await prisma.note.findMany({
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
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(notes);
  } catch (error) {
    console.error("Erro ao buscar notas:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// POST - Criar nova nota
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { content, type, priority, tags, operatorId } = body;

    if (!content || !operatorId) {
      return NextResponse.json(
        { error: "Conteúdo e operador são obrigatórios" },
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

    const note = await prisma.note.create({
      data: {
        content,
        type: type || NoteType.PRIVATE,
        priority: priority || NotePriority.MEDIUM,
        tags: tags || [],
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

    return NextResponse.json(note, { status: 201 });
  } catch (error) {
    console.error("Erro ao criar nota:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
