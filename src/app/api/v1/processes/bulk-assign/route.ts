import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const bulkAssignSchema = z.object({
  operatorId: z.string(),
  processIds: z.array(z.string()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operatorId, processIds } = bulkAssignSchema.parse(body);

    // Verificar se o operador existe
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Operador não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se todos os processos existem
    const existingProcesses = await prisma.process.findMany({
      where: {
        id: { in: processIds },
        isActive: true,
      },
      include: {
        client: {
          select: { name: true, email: true },
        },
      },
    });

    if (existingProcesses.length !== processIds.length) {
      return NextResponse.json(
        { error: "Um ou mais processos não foram encontrados" },
        { status: 404 }
      );
    }

    // Realizar a atribuição em massa usando transação
    const result = await prisma.$transaction(async (tx) => {
      const updatedProcesses = await tx.process.updateMany({
        where: {
          id: { in: processIds },
        },
        data: {
          operatorId: operatorId,
          lastInteractionAt: new Date(),
        },
      });

      // Criar eventos na timeline para cada processo
      const timelineEvents = processIds.map((processId) => ({
        title: "Operador atribuído (distribuição em massa)",
        description: `Processo atribuído ao operador ${operator.name} via distribuição administrativa`,
        type: "INFO" as const,
        category: "STATUS" as const,
        source: "MANUAL" as const,
        processId,
        operatorId,
        createdBy: operatorId,
      }));

      await tx.timelineEvent.createMany({
        data: timelineEvents,
      });

      return { assigned: updatedProcesses.count };
    });

    return NextResponse.json({
      success: true,
      assigned: result.assigned,
      message: `${result.assigned} processos atribuídos com sucesso ao operador ${operator.name}`,
    });
  } catch (error) {
    console.error("Erro na atribuição em massa:", error);

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
