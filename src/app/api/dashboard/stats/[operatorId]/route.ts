import { prisma } from "@/lib/prisma"
import { translateDocumentStatus, translatePriority, translateProcessStatus, translateProcessType } from "@/lib/utils"
import { differenceInDays } from "date-fns"
import { NextResponse } from "next/server"

export async function GET(
  request: Request,
  { params }: { params: { operatorId: string } }
) {
  try {
    const operatorId = params.operatorId

    // Verificar se o operador existe e seu papel
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { role: true }
    })

    if (!operator) {
      return NextResponse.json({ error: 'Operador não encontrado' }, { status: 404 })
    }

    
    // Definir condição base de filtro
    const baseWhere = operator.role === 'ADMIN' 
      ? {} 
      : { operatorId }

    // Buscar dados básicos
    const [
      totalProcesses,
      activeProcesses,
      completedProcesses,
      inProgressProcesses,
      urgentProcesses
     ] = await Promise.all([
      prisma.process.count({ where: baseWhere }),
      prisma.process.count({ where: { ...baseWhere, isActive: true } }),
      prisma.process.count({ where: { ...baseWhere, status: 'APPROVED' } }),
        prisma.process.count({ 
          where: { 
            ...baseWhere, 
            isActive: true,
            status: { notIn: ['COMPLETED', 'APPROVED', 'CANCELLED', 'REJECTED'] }
          } 
        }),
        prisma.process.count({ where: { ...baseWhere, priority: 'HIGH' } })
    ])

    // Buscar distribuição por status
    const processesByStatus = await prisma.process.groupBy({
      by: ['status'],
      where: baseWhere,
      _count: true
    })

    // Buscar distribuição por tipo
    const processesByType = await prisma.process.groupBy({
      by: ['type'],
      where: baseWhere,
      _count: true
    })

    // Buscar distribuição por prioridade
    const processesByPriority = await prisma.process.groupBy({
      by: ['priority'],
      where: baseWhere,
      _count: true
    })

    // Buscar status dos documentos
    const documentsByStatus = await prisma.document.groupBy({
      by: ['status'],
      where: {
        process: { ...baseWhere }
      },
      _count: true
    })

    // Preparar dados para os gráficos
    const processTypeData = {
      labels: processesByType.map(p => translateProcessType(p.type)),
      datasets: [{
        data: processesByType.map(p => p._count),
        backgroundColor: ['#3B82F6', '#34D399', '#F59E0B']
      }]
    }

    const priorityData = {
      labels: processesByPriority.map(p => translatePriority(p.priority)),
      datasets: [{
        data: processesByPriority.map(p => p._count),
        backgroundColor: ['#EF4444', '#F59E0B', '#10B981']
      }]
    }

    const documentStatusData = {
      labels: documentsByStatus.map(d => translateDocumentStatus(d.status)),
      datasets: [{
        data: documentsByStatus.map(d => d._count),
        backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444']
      }]
    }


  


    const totalDocuments = await prisma.document.count({ where: { process: { ...baseWhere } } })

    const averageDocuments = totalProcesses > 0 ? totalDocuments / totalProcesses : 0

    // Calcular o tempo médio de conclusão dos processos
    const completedProcessList = await prisma.process.findMany({
      where: {
        ...baseWhere,
        status: 'APPROVED'
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    const averageCompletionTime = completedProcesses > 0 
      ? completedProcessList.reduce((acc, process) => {
          return acc + differenceInDays(
            new Date(process.updatedAt), 
            new Date(process.createdAt)
          )
        }, 0) / completedProcesses
      : 0

    // Para visão administrativa, vamos adicionar mais métricas
    if (operator.role === 'ADMIN') {
      const [
        totalOperators,
        totalClients,
        botProcesses,
        manualProcesses,
        platformProcesses,
        operatorPerformance,
        documentMetrics,
        clientMetrics
      ] = await Promise.all([
        // Contagem total de operadores ativos
        prisma.operator.count({
          where: { status: 'ACTIVE' }
        }),

        // Contagem total de clientes
        prisma.client.count(),

        // Processos por fonte
        prisma.process.count({
          where: { source: 'BOT' }
        }),
        prisma.process.count({
          where: { source: 'MANUAL' }
        }),
        prisma.process.count({
          where: { source: 'PLATFORM' }
        }),

        // Performance dos operadores
        prisma.operator.findMany({
          where: { 
            role: 'OPERATOR',
            status: 'ACTIVE'
          },
          select: {
            id: true,
            name: true,
            processes: {
              select: {
                status: true,
              },
              where: {
                // Considerar processos dos últimos 30 dias
                createdAt: {
                  gte: new Date(new Date().setDate(new Date().getDate() - 30))
                }
              }
            },
            _count: {
              select: {
                processes: true
              }
            }
          }
        }),

        // Métricas de documentos
        prisma.document.groupBy({
          by: ['status'],
          _count: true,
          where: {
            verified: true
          }
        }),

        // Métricas de clientes
        prisma.client.groupBy({
          by: ['source'],
          _count: true
        })
      ])

      // Calcular taxa de sucesso para cada operador
      const operatorStats = operatorPerformance.map(operator => {
        const totalProcesses = operator._count.processes;
        const completedProcesses = operator.processes.filter(
          p => p.status === 'APPROVED'
        ).length;

        // Calcular taxa de sucesso
        const successRate = totalProcesses > 0 
          ? (completedProcesses / totalProcesses) * 100 
          : 0;

        return {
          name: operator.name,
          successRate: successRate
        };
      });

      // Preparar dados adicionais para gráficos
      const sourceDistributionData = {
        labels: ['Bot', 'Manual', 'Plataforma'],
        datasets: [{
          data: [botProcesses, manualProcesses, platformProcesses],
          backgroundColor: ['#8B5CF6', '#EC4899', '#F59E0B']
        }]
      }

      const performanceChartData = {
        labels: operatorStats.map(op => op.name),
        datasets: [{
          label: 'Taxa de Sucesso',
          data: operatorStats.map(op => op.successRate),
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 1
        }]
      };

      // Adicionar métricas administrativas ao retorno
      return NextResponse.json({
        totalProcesses,
        activeProcesses,
        urgentProcesses,

        averageCompletionTime,
        completedProcesses,
        totalDocuments,
        averageDocuments,
        inProgressProcesses,
        processesByStatus: processesByStatus.map(status => ({
          status: status.status,
          count: status._count,
          label: translateProcessStatus(status.status)
        })),
        processTypeData,
        priorityData,
        documentStatusData,
        performanceRate: totalProcesses ? Math.round((completedProcesses / totalProcesses) * 100) : 0,
        
        // Métricas gerais
        totalOperators,
        totalClients,
        
        // Métricas de fonte
        botProcesses,
        manualProcesses,
        platformProcesses,
        sourceDistribution: sourceDistributionData,
        
        // Métricas de operadores
        operatorPerformance: performanceChartData,
        averageOperatorSuccessRate: operatorStats.reduce((acc, op) => acc + op.successRate, 0) / operatorStats.length,
        
        // Métricas de documentos
        documentVerificationRate: documentMetrics.reduce((acc, doc) => 
          doc.status === 'VERIFIED' ? acc + doc._count : acc, 0) / totalDocuments * 100,
        
        // Métricas de clientes
        clientSourceDistribution: clientMetrics.map(source => ({
          source: source.source,
          count: source._count
        })),
        
        // Métricas de eficiência
        averageProcessTime: averageCompletionTime,
        processCompletionRate: (completedProcesses / totalProcesses) * 100,
        
        // Métricas de qualidade
        documentRejectionRate: documentMetrics.reduce((acc, doc) => 
          doc.status === 'REJECTED' ? acc + doc._count : acc, 0) / totalDocuments * 100,
        
        // Métricas de produtividade
        processesPerOperator: totalProcesses / totalOperators,
        averageActiveProcesses: activeProcesses / totalOperators
      })
    }

    return NextResponse.json({
      totalProcesses,
      activeProcesses,
      urgentProcesses,

      averageCompletionTime,
      completedProcesses,
      totalDocuments,
      averageDocuments,
      inProgressProcesses,
      processesByStatus: processesByStatus.map(status => ({
        status: status.status,
        count: status._count,
        label: translateProcessStatus(status.status)
      })),
      processTypeData,
      priorityData,
      documentStatusData,
      performanceRate: totalProcesses ? Math.round((completedProcesses / totalProcesses) * 100) : 0
    })

  } catch (error) {
    console.error('Erro ao buscar estatísticas:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar estatísticas' },
      { status: 500 }
    )
  }
}

