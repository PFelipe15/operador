import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkFetchSchema = z.object({
  processIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { processIds } = bulkFetchSchema.parse(body);

    // Buscar os processos especificados
    const processes = await prisma.process.findMany({
      where: {
        id: { in: processIds },
        isActive: true,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
        company: {
          select: {
            id: true,
            name: true,
          },
        },
        operator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            documents: true,
            timeline: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Formatar dados para o frontend
    const formattedProcesses = processes.map((process) => ({
      id: process.id,
      client: {
        name: process.client.name,
        email: process.client.email,
      },
      status: process.status,
      priority: process.priority,
      progress: process.progress,
      operator: process.operator
        ? {
            id: process.operator.id,
            name: process.operator.name,
          }
        : null,
      company: process.company
        ? {
            name: process.company.name,
          }
        : null,
      createdAt: process.createdAt,
      updatedAt: process.updatedAt,
      documentsCount: process._count.documents,
      timelineCount: process._count.timeline,
    }));

    return NextResponse.json(formattedProcesses);
  } catch (error) {
    console.error("Erro ao buscar processos em massa:", error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos", details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
