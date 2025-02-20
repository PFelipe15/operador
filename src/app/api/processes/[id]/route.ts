import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const process = await prisma.process.findUnique({
      where: {
        id: params.id
      },
      include: {
        client: true,
        company: {
          include: {
            address: true
          }
        },
        operator: true,
        documents: {
          include: {
            uploadedBy: true,
            verifiedBy: true,
            rejectionBy: true
          }
        },
        timeline: {
          orderBy: {
            createdAt: 'desc'
          }
        }

      }
    })

    if (!process) {
      return notFound()
    }

    return NextResponse.json(process)
  } catch (error) {
    console.error('Erro ao buscar processo:', error)
    return NextResponse.json(
      { error: 'Erro ao carregar processo' },
      { status: 500 }
    )
  }
} 