import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Source, ProcessType, ProcessPriority, ProcessStatus } from '@prisma/client'

// Busca todos os processos
export async function GET() {
    const processes = await prisma.process.findMany({
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
  
}

export async function POST(request: Request) {
     const body = await request.json()
    
    // Validações
    if (!body.type) {
      return NextResponse.json(
        { error: 'Tipo do processo é obrigatório' },
        { status: 400 }
      )
    }

    if (!body.priority) {
      return NextResponse.json(
        { error: 'Prioridade do processo é obrigatória' },
        { status: 400 }
      )
    }

    if (!body.clientId && !body.client?.create) {
      return NextResponse.json(
        { error: 'Dados do cliente são obrigatórios' },
        { status: 400 }
      )
    }

    // Validação do tipo de processo
    if (!Object.values(ProcessType).includes(body.type)) {
      return NextResponse.json(
        { 
          error:'Tipo de processo inválido',
          validTypes: Object.values(ProcessType),
          receivedType: body.type
        },
        { status: 400 }
      )
    }

    try {
      const processData = {
        status: "CREATED" as ProcessStatus,
        type: body.type as ProcessType,
        priority: body.priority as ProcessPriority,
        source: (body.source || "MANUAL") as Source,
        progress: 0,
        
        // Cliente (conecta existente ou cria novo)
        ...(body.clientId ? {
          client: {
            connect: { id: body.clientId }
          }
        } : {
          client: {
            create: body.client.create
          }
        }),
        
        // Operador (opcional)
        ...(body.operatorId && {
          operator: {
            connect: { id: body.operatorId }
          }
        }),
        
        // Empresa (opcional)
        ...(body.company?.create && {
          company: {
            create: {
              name: body.company.create.name,
              cnpj: body.company.create.cnpj || null,
              capitalSocial: body.company.create.capitalSocial || null,
              principalActivity: body.company.create.principalActivity || null,
              activities: body.company.create.activities || null,
              ...(body.company.create.address && {
                address: body.company.create.address
              })
            }
          }
        }),
        
        // Timeline
        timeline: {
          create: {
            title: "Processo Iniciado",
            description: "Cadastro inicial realizado no sistema",
            type: "INFO",
            category: "STATUS",      
            source: (body.source || 'MANUAL') as Source,
            ...(body.operatorId && {
              operator: {
                connect: { id: body.operatorId }
              }
            }),
            metadata: JSON.stringify({
              newStatus: "CREATED" as ProcessStatus
            })
          }
        }
      }

 
      const process = await prisma.process.create({
        data: processData,
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
            }
          }
        }
      })

      return NextResponse.json(process)
    } catch (error) {
      console.error('Erro ao criar processo:', error)
      return NextResponse.json(
        { 
          error: 'Erro ao criar processo', 
          details: error instanceof Error ? error.message : 'Erro desconhecido',
          receivedData: body,
          validProcessTypes: Object.values(ProcessType)
        },
        { status: 500 }
      )
    
 
} }



