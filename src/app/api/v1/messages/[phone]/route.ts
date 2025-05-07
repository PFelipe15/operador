import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

export async function GET(
  request: Request,
  { params }: { params: { phone: string } }
) {
  try {
    const phone = params.phone;
    const formattedPhone = `${phone}@s.whatsapp.net`;

    console.log("Buscando mensagens para:", formattedPhone);

    const messages = await prisma.message.findMany({
      where: {
        remoteJid: formattedPhone,
      },
      orderBy: {
        timestamp: "desc",
      },
      include: {
        operator: {
          select: {
            name: true,
          },
        },
      },
      take: 50,
    });

    console.log("Mensagens encontradas:", messages.length);

    return NextResponse.json({
      success: true,
      messages: messages.reverse(),
    });
  } catch (error) {
    console.error("Erro ao buscar mensagens:", error);
    return NextResponse.json(
      { success: false, error: "Erro ao buscar mensagens" },
      { status: 500 }
    );
  }
}
