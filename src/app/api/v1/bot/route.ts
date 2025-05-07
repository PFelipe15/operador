 import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const bot = await prisma.botWhatsapp.findUnique({
      where: {
        id: "singleton",
      },
    });

    if (!bot) {
      return NextResponse.json({
        status: "NOT_CREATED",
        hasConnected: false,
      });
    }

    return NextResponse.json({
      ...bot,
      status: bot.status || "DISCONNECTED",
      lastConnection: bot.lastConnection || null,
      qrcode: bot.qrcode || null,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do bot:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST() {
  try {
    const bot = await prisma.botWhatsapp.create({
      data: {
        id: "singleton",
        status: "AGUARDANDO_CONEXAO",
        hasConnected: false,
      },
    });

    return NextResponse.json(bot);
  } catch (error) {
    console.error("Erro ao criar bot:", error);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { qrcode } = await request.json();
  await prisma.botWhatsapp.update({
    where: { id: "singleton" },
    data: { qrcode: qrcode, status: "AGUARDANDO_CONEXAO" },
  });
  return NextResponse.json(
    { message: "QrCode do Bot foi Atualizado com sucesso" },
    { status: 200 }
  );
}
