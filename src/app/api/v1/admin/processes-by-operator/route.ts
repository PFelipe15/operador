import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get("operatorId");
    const adminId = searchParams.get("adminId");

    // Verificar se é administrador
    if (adminId) {
      const admin = await prisma.operator.findUnique({
        where: { id: adminId },
      });

      if (!admin || admin.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acesso negado. Apenas administradores podem acessar." },
          { status: 403 }
        );
      }
    }

    if (!operatorId) {
      return NextResponse.json(
        { error: "ID do operador é obrigatório" },
        { status: 400 }
      );
    }

    // Buscar processos do operador
    const processes = await prisma.process.findMany({
      where: {
        operatorId: operatorId,
        isActive: true, // Apenas processos ativos
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
        _count: {
          select: {
            documents: true,
            timeline: true,
          },
        },
      },
      orderBy: [
        { priority: "desc" }, // Alta prioridade primeiro
        { createdAt: "desc" },
      ],
    });

    // Formatar dados para o frontend
    const formattedProcesses = processes.map((process) => ({
      id: process.id,
      status: process.status,
      priority: process.priority,
      type: process.type,
      progress: process.progress,
      createdAt: process.createdAt,
      lastInteractionAt: process.lastInteractionAt,
      client: {
        id: process.client.id,
        name: process.client.name,
        email: process.client.email,
        phone: process.client.phone,
      },
      company: process.company
        ? {
            id: process.company.id,
            name: process.company.name,
          }
        : null,
      documentsCount: process._count.documents,
      timelineCount: process._count.timeline,
      // Calcular dias desde criação
      daysOld: Math.floor(
        (new Date().getTime() - new Date(process.createdAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
      // Calcular dias desde última interação
      daysSinceLastInteraction: Math.floor(
        (new Date().getTime() - new Date(process.lastInteractionAt).getTime()) /
          (1000 * 60 * 60 * 24)
      ),
    }));

    // Estatísticas resumidas
    const stats = {
      total: formattedProcesses.length,
      byStatus: formattedProcesses.reduce((acc, p) => {
        acc[p.status] = (acc[p.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      byPriority: formattedProcesses.reduce((acc, p) => {
        acc[p.priority] = (acc[p.priority] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      avgProgress:
        formattedProcesses.length > 0
          ? formattedProcesses.reduce((sum, p) => sum + p.progress, 0) /
            formattedProcesses.length
          : 0,
    };

    return NextResponse.json({
      processes: formattedProcesses,
      stats,
    });
  } catch (error) {
    console.error("Erro ao buscar processos do operador:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
