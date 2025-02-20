import { prisma } from "@/lib/prisma"
import { TimelineEventCategory, TimelineEventType } from "@prisma/client"
import { NextResponse } from "next/server"

export async function POST(
  request: Request,
  { params }: { params: { processId: string } }
) {
  try {
    const { processId } = params
    const { operatorId } = await request.json()

    // Verifica se o processo existe e não tem operador
    const process = await prisma.process.findUnique({
      where: { id: processId },
      select: { operatorId: true }
    })

    if (!process) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      )
    }

    if (process.operatorId) {
      return NextResponse.json(
        { error: 'Processo já possui um operador atribuído' },
        { status: 400 }
      )
    }

    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { name: true }
    })

    // Atribui o operador ao processo

    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: { 
        operatorId,
        // Adiciona um evento na timeline
        timeline: {
          create: {
            title: `Processo atribuído a ${operator?.name}`,
            category: 'DATA' as TimelineEventCategory,
            type: 'SUCCESS' as TimelineEventType,
            description: 'Operador atribuído ao processo',
            operatorId


          }



        }
      }
    })

    console.log(updatedProcess)
    return NextResponse.json(updatedProcess)
  } catch (error) {
    console.error('Erro ao atribuir processo:', error)
    return NextResponse.json(
      { error: 'Erro ao atribuir processo' },
      { status: 500 }
    )
  }
} 