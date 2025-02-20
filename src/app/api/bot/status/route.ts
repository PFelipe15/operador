import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export const PUT = async (request: NextRequest) => {
  const { status, hasConnected } = await request.json()
  await prisma.botWhatsapp.update({
    where: { id: "singleton" },
    data: { status: status, hasConnected: hasConnected },
  })
  return NextResponse.json({ message: 'Status do Bot foi Atualizado com sucesso' }, { status: 200 })
}
