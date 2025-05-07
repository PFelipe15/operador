import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { infoDataUpdate } from "@/constants/translate";

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { field, value } = body;

    console.log(field, value);
    const process = await prisma.process.findUnique({
      where: { id: params.id },
      include: { client: true, operator: true },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const updatedClient = await prisma.client.update({
      where: { id: process.client.id },
      data: {
        [field]: value,
      },
    });

    // Adiciona evento na timeline
    await prisma.timelineEvent.create({
      data: {
        processId: params.id,
        title: "Informação Atualizada",
        description: `O "${
          infoDataUpdate[field as keyof typeof infoDataUpdate]
        }" do cliente atualizado`,
        type: "INFO",
        category: "UPDATEFIELD",
        metadata: JSON.stringify({
          field,
          oldValue: process.client?.[field as keyof typeof process.client],
          newValue: value,
        }),
      },
    });

    await prisma.notification.create({
      data: {
        processId: params.id,
        title: "Informação Atualizada",
        message: `Campo "${field}" da empresa atualizado`,
        type: "INFO",
        category: "PROCESS",
        metadata: JSON.stringify({
          field,
          oldValue: process.client?.[field as keyof typeof process.client],
          newValue: value,
        }),
        recipientId: process.operator?.id || "",
        status: "SENT",
        priority: "NORMAL",
      },
    });

    return NextResponse.json(updatedClient);
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar informações do cliente" },
      { status: 500 }
    );
  }
}
