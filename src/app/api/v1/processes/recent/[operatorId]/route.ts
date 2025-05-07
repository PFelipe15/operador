import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { operatorId: string } }
) {
  try {
    const recentProcesses = await prisma.process.findMany({
      where: {
        operatorId: params.operatorId,
      },
      include: {
        client: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      take: 5,
    });

    return NextResponse.json(recentProcesses);
  } catch (error) {
    console.error("Erro ao buscar processos recentes:", error);
    return NextResponse.json(
      { error: "Erro ao buscar processos recentes" },
      { status: 500 }
    );
  }
}
