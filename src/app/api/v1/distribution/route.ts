import { prisma } from '@/lib/prisma'
import { NotificationCategory, NotificationPriority, NotificationStatus, NotificationType } from '@prisma/client'
import { NextResponse } from 'next/server'
 

export async function POST(request: Request) {
  try {
    const { processId, operatorId } = await request.json()

    // Validações básicas
    if (!processId || !operatorId) {
      return NextResponse.json(
        { error: 'Processo e operador são obrigatórios' },
        { status: 400 }
      )
    }   
    // Atualiza o processo e o contador do operador em uma única transação e cria a notificação
    const result = await prisma.$transaction(async (tx) => {
      // Atualiza o processo
      const process = await tx.process.update({
        where: { id: processId },
        data: {
          operatorId: operatorId
        }
      })

      // Atualiza o contador do operador
      await tx.operator.update({
        where: { id: operatorId },
        data: {
          processesCount: {
            increment: 1
          }
        }
      })

      
      return process
    })
    // Notificar o operador que ele foi atribuído a um novo processo
    await prisma.notification.create({
     data:{
      processId: processId,
      recipientId: operatorId,
      title: 'Processo Distribuído',
      message: 'Você foi atribuído a um novo processo',
      category: NotificationCategory.PROCESS,
      type: NotificationType.INFO,
      priority: NotificationPriority.NORMAL,
      status: NotificationStatus.PENDING,
      source: 'SYSTEM',
      metadata: JSON.stringify({
        processId: processId,
        operatorId: operatorId
      })
    
       

     }
       
    })

    return NextResponse.json({
      success: true,
      message: 'Processo distribuído com sucesso',
      data: result
    })

  } catch (error) {
    console.error('Erro na distribuição:', error)
    return NextResponse.json(
      { error: 'Erro ao distribuir processo' },
      { status: 500 }
    )
  }
}

// Busca processos pendentes
export async function GET() {
  try {
    const processes = await prisma.process.findMany({
      where: {
        status: {
          in: ['PENDING_COMPANY', 'PENDING_DATA', 'PENDING_DATA', 'IN_ANALYSIS', ]
        }
      },
      select: {
        id: true,
        client: {
          select: {
            name: true
          }
        },
        type: true,
        priority: true

      }
    })

    return NextResponse.json(processes)
  } catch (error) {
    console.error('Erro ao buscar processos:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar processos' },
      { status: 500 }
    )
  }
} 