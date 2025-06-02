import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
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

    // Buscar operadores ativos
    const operators = await prisma.operator.findMany({
      where: { status: "ACTIVE" },
      include: {
        _count: {
          select: {
            processes: {
              where: {
                isActive: true, // Contar apenas processos ativos
              },
            },
          },
        },
      },
      orderBy: { name: "asc" },
    });

    const operatorList = operators.map((op) => ({
      id: op.id,
      name: op.name,
      email: op.email,
      processCount: op._count.processes,
      processesCount: op._count.processes, // Para compatibilidade
      role: op.role,
      status: op.status,
    }));

    return NextResponse.json({
      success: true,
      operators: operatorList,
    });
  } catch (error) {
    console.error("Erro ao buscar operadores:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
