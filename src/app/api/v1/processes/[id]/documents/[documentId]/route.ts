import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(
  request: Request,
  { params }: { params: { id: string, documentId: string } }
) {
  const { documentId } = params
  const { verified, timelineEvent, status, rejectionReason } = await request.json()

  try {
    
const process = await prisma.process.findUnique({
  where: { id: params.id }, select: { operatorId: true }
})


  if (!process || !process.operatorId) {
    return NextResponse.json({ error: 'Processo não encontrado' }, { status: 404 })
  }

    const RejectOrVerified = status === "REJECTED" ? "rejectionById" : "verifiedById"

    await prisma.$transaction([
      // Atualiza o documento
      prisma.document.update({
        where: { id: documentId },
        data: { verified, status, rejectionReason, [RejectOrVerified]: timelineEvent.operatorId }
      }),



      // Cria o evento na timeline
      prisma.timelineEvent.create({
        data: {
          title: timelineEvent.title,
          description: timelineEvent.description,
          type: timelineEvent.type,
          category: timelineEvent.category,
          source: timelineEvent.source,
          processId: params.id,
          operatorId: timelineEvent.operatorId,
          metadata: timelineEvent.metadata
        }
      }),

      // Atualiza lastInteractionAt do processo
      prisma.process.update({
        where: { id: params.id },
        data: { lastInteractionAt: new Date() }
      })
    ])


  

    // Cria a notificação para o operador do processo
    await prisma.notification.create({
      data: {
        processId: params.id,
        recipientId: process?.operatorId , // ID do operador que está encarregado do processo
        title: "Documento Verificado",
        message: `O documento ${documentId} foi verificado`,
        type: "SUCCESS",
        category: "DOCUMENT",
        metadata: JSON.stringify({
          documentId: documentId,
          operatorId: timelineEvent.operatorId // ID do operador que verificou
        })
      }
    })

    return NextResponse.json({ message: 'Documento verificado com sucesso' }, { status: 200 })
  } catch (error) {
    console.error('Erro ao verificar documento:', error)
    return NextResponse.json({ error: 'Erro ao verificar documento' }, { status: 500 })
  }
}