import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
  try {
    const { status, hasConnected } = await request.json();

    await prisma.botWhatsapp.update({
      where: { id: "singleton" },
      data: {
        status: status,
        hasConnected: hasConnected,
        lastConnection: hasConnected ? new Date() : undefined,
      },
    });

    return NextResponse.json(
      { message: "Status do Bot foi atualizado com sucesso" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erro ao atualizar status do bot:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar status do bot" },
      { status: 500 }
    );
  }
}
