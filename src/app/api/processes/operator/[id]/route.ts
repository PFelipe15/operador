import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
 

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const { id } = params

  try {
    const processes = await prisma.process.findMany({
      where: id ? {
        OR: [
          { operatorId: id }, // Processos atribuídos ao operador
          { 
            AND: [
              { operatorId: null }, // Processos sem operador
              { isActive: true } // Apenas processos ativos
            ]
          }
        ]
      } : undefined,
      include: {
        client: true,
        company: {
          include: {
            address: true
          }
        },
        operator: true,
        documents: true,
        timeline: {
          include: {
            operator: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      },
      orderBy: {
        lastInteractionAt: 'desc'
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