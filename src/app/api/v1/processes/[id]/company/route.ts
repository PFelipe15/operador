import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { infoDataUpdate } from '@/constants/translate'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { field, value } = body

    const process = await prisma.process.findUnique({
      where: { id: params.id },
      include: { company: true, operator: true }
    })

    if (!process) {
      return NextResponse.json(
        { error: 'Processo não encontrado' },
        { status: 404 }
      )
    }

    let company
    if (process.company === null) {
      company = await prisma.company.create({
        data: {
          name: field === "name" ? String(value) : "não informado",
          cnpj: field === "cnpj" ? String(value) : "não informado",
          capitalSocial: field === "capitalSocial" ? String(value) : "0",
          address: {
            create: {
              cep: "não informado",
              street: "não informado",
              number: "não informado",
              district: "não informado",
              city: "não informado",
              state: "não informado",
            }
          },
          processes: {
            connect: {
              id: process.id
            }
          }
        }
      })

      // Se o campo não for CNPJ, atualiza com o valor correto
      if (field !== "cnpj" && company) {
        company = await prisma.company.update({
          where: { id: company.id },
          data: {
            [field]: String(value)
          }
        })
      }
    } else {
      // Atualiza a empresa existente
      company = await prisma.company.update({
        where: { id: process.company.id },
        data: {
          [field]: String(value)
        }
      })
    }

    // Adiciona evento na timeline
    await prisma.timelineEvent.create({
      data: {
        processId: params.id,
        title: 'Informação Atualizada',
        description: `Campo "${ infoDataUpdate[field as keyof typeof infoDataUpdate] || field }" da empresa atualizado`,
        type: 'INFO',
        category: 'UPDATEFIELD',
        metadata: JSON.stringify({
          field,
          oldValue: process.company?.[field as keyof typeof process.company],
          newValue: value
        })
      }
    })

    // Cria notificação
    if (process.operator?.id) {
      await prisma.notification.create({
        data: {
          processId: params.id,
          title: 'Informação Atualizada',
          message: `Campo "${field}" da empresa atualizado`,
          type: 'INFO',
          category: 'PROCESS',
          metadata: JSON.stringify({
            field,
            oldValue: process.company?.[field as keyof typeof process.company],
            newValue: value
          }),
          recipientId: process.operator.id,
          status: 'SENT',
          priority: 'NORMAL'
        }
      })
    }

    return NextResponse.json(company)
  } catch (error) {
    console.error('Erro ao atualizar empresa:', error)
    return NextResponse.json(
      { error: 'Erro ao atualizar informações da empresa' },
      { status: 500 }
    )
  }
} 