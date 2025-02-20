import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await prisma.client.findUnique({
      where: {
        id: params.id
      },
      include: {
        address: true,
        processes: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true
          }
        },
        _count: {
          select: {
            processes: true
          }
        }
      }
    })

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      )
    }

    return NextResponse.json(client)
  } catch (error) {
    console.error('Erro ao buscar cliente:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar cliente' },
      { status: 500 }
    )
  }
} 