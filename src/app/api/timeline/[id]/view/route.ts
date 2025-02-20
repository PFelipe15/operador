import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const event = await prisma.timelineEvent.update({
      where: { id: params.id },
      data: { 
        metadata: JSON.stringify({ viewed: true })
      }
    })

    return NextResponse.json(event)
  } catch (error) {
    console.error("Erro ao marcar evento como visualizado:", error)
    return NextResponse.json(
      { error: "Erro ao marcar evento como visualizado" },
      { status: 500 }
    )
  }
} 