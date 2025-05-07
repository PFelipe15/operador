import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { operatorId } = body;
    console.log(operatorId);
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Operador não encontrado" },
        { status: 404 }
      );
    }

    const process = await prisma.process.update({
      where: { id: params.id },
      data: {
        operatorId,
        timeline: {
          create: {
            title: `Operador Atribuído`,
            type: "INFO",
            description: `O processo foi atribuído ao operador ${operator.name}`,
            category: "DATA",
            source: "MANUAL",
            operatorId,
            metadata: JSON.stringify({
              type: "operator_assignment",
              operatorId,
            }),
          },
        },
      },
      include: {
        operator: true,
      },
    });

    return NextResponse.json(process);
  } catch (error) {
    console.error("Erro ao atribuir operador:", error);
    return NextResponse.json(
      { error: "Erro ao atribuir operador" },
      { status: 500 }
    );
  }
}
