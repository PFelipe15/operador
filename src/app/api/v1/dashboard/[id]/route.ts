import { prisma } from "@/lib/prisma";
import {
  translateDocumentStatus,
  translatePriority,
  translateProcessStatus,
  translateProcessType,
} from "@/lib/utils";
import { differenceInDays } from "date-fns";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const operatorId = params.id;

    // Verificar se o operador existe e seu papel
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
      select: { role: true },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Operador não encontrado" },
        { status: 404 }
      );
    }

    // Definir condição base de filtro
    const baseWhere = operator.role === "ADMIN" ? {} : { operatorId };

    // Data limite para considerar um processo como "parado" (7 dias sem atualização)
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 7);

    // Buscar dados básicos
    const [
      totalProcesses,
      activeProcesses,
      completedProcesses,
      inProgressProcesses,
      urgentProcesses,
      staleProcesses,
    ] = await Promise.all([
      prisma.process.count({ where: baseWhere }),
      prisma.process.count({ where: { ...baseWhere, isActive: true } }),
      prisma.process.count({ where: { ...baseWhere, status: "APPROVED" } }),
      prisma.process.count({
        where: {
          ...baseWhere,
          isActive: true,
          status: { notIn: ["COMPLETED", "APPROVED", "CANCELLED", "REJECTED"] },
        },
      }),
      prisma.process.count({ where: { ...baseWhere, priority: "HIGH" } }),
      // Processos parados (sem atualização há mais de 7 dias e ainda ativos)
      prisma.process.count({
        where: {
          ...baseWhere,
          updatedAt: {
            lt: staleDate,
          },
          status: {
            notIn: ["COMPLETED", "APPROVED", "CANCELLED", "REJECTED"],
          },
        },
      }),
    ]);
    // Buscar distribuição por status
    const processesByStatus = await prisma.process.groupBy({
      by: ["status"],
      where: baseWhere,
      _count: true,
    });

    // Buscar distribuição por tipo
    const processesByType = await prisma.process.groupBy({
      by: ["type"],
      where: baseWhere,
      _count: true,
    });

    // Buscar distribuição por prioridade
    const processesByPriority = await prisma.process.groupBy({
      by: ["priority"],
      where: baseWhere,
      _count: true,
    });

    // Buscar status dos documentos
    const documentsByStatus = await prisma.document.groupBy({
      by: ["status"],
      where: {
        process: { ...baseWhere },
      },
      _count: true,
    });

    // Preparar dados para os gráficos
    const processTypeData = {
      labels: processesByType.map((p) => translateProcessType(p.type)),
      datasets: [
        {
          data: processesByType.map((p) => p._count),
          backgroundColor: ["#3B82F6", "#34D399", "#F59E0B"],
        },
      ],
    };

    const priorityData = {
      labels: processesByPriority.map((p) => translatePriority(p.priority)),
      datasets: [
        {
          data: processesByPriority.map((p) => p._count),
          backgroundColor: ["#EF4444", "#F59E0B", "#10B981"],
        },
      ],
    };

    const documentStatusData = {
      labels: documentsByStatus.map((d) => translateDocumentStatus(d.status)),
      datasets: [
        {
          data: documentsByStatus.map((d) => d._count),
          backgroundColor: ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
        },
      ],
    };

    const totalDocuments = await prisma.document.count({
      where: { process: { ...baseWhere } },
    });

    const averageDocuments =
      totalProcesses > 0 ? totalDocuments / totalProcesses : 0;

    // Calcular o tempo médio de conclusão dos processos
    const completedProcessList = await prisma.process.findMany({
      where: {
        ...baseWhere,
        status: "APPROVED",
      },
      select: {
        createdAt: true,
        updatedAt: true,
      },
    });

    const averageCompletionTime =
      completedProcesses > 0
        ? completedProcessList.reduce((acc, process) => {
            const days = differenceInDays(
              new Date(process.updatedAt),
              new Date(process.createdAt)
            );

            // Se o processo foi concluído no mesmo dia, considerar como 1 dia
            return acc + Math.max(days, 1);
          }, 0) / completedProcesses
        : 0;

    // Para visão administrativa, vamos adicionar mais métricas
    if (operator.role === "ADMIN") {
      const [
        totalOperators,
        totalClients,
        botProcesses,
        manualProcesses,
        platformProcesses,
        operatorPerformance,
        documentMetrics,
        clientMetrics,
        documentsByType,
      ] = await Promise.all([
        // Contagem total de operadores ativos
        prisma.operator.count({
          where: { status: "ACTIVE" },
        }),

        // Contagem total de clientes
        prisma.client.count(),

        // Processos por fonte
        prisma.process.count({
          where: { source: "BOT" },
        }),
        prisma.process.count({
          where: { source: "MANUAL" },
        }),
        prisma.process.count({
          where: { source: "PLATFORM" },
        }),

        // Performance dos operadores
        prisma.operator.findMany({
          where: {
            role: "OPERATOR",
            status: "ACTIVE",
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
                  gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                },
              },
            },
            _count: {
              select: {
                processes: true,
              },
            },
          },
        }),

        // Métricas de documentos
        prisma.document.groupBy({
          by: ["status"],
          _count: true,
          where: {
            verified: true,
          },
        }),

        // Métricas de clientes
        prisma.client.groupBy({
          by: ["source"],
          _count: true,
        }),

        // Nova consulta: Documentos agrupados por tipo
        prisma.document.groupBy({
          by: ["type"],
          _count: {
            _all: true,
          },
          where: {
            process: { ...baseWhere },
          },
        }),
      ]);

      // Calcular taxa de sucesso para cada operador
      const operatorStats = operatorPerformance.map((operator) => {
        const totalProcesses = operator._count.processes;
        const completedProcesses = operator.processes.filter(
          (p) => p.status === "APPROVED"
        ).length;

        // Calcular taxa de sucesso
        const successRate =
          totalProcesses > 0 ? (completedProcesses / totalProcesses) * 100 : 0;

        return {
          name: operator.name,
          successRate: successRate,
        };
      });

      // Preparar dados adicionais para gráficos
      const sourceDistributionData = {
        labels: ["Bot", "Manual", "Plataforma"],
        datasets: [
          {
            data: [botProcesses, manualProcesses, platformProcesses],
            backgroundColor: ["#8B5CF6", "#EC4899", "#F59E0B"],
          },
        ],
      };

      const performanceChartData = {
        labels: operatorStats.map((op) => op.name),
        datasets: [
          {
            label: "Taxa de Sucesso",
            data: operatorStats.map((op) => op.successRate),
            backgroundColor: "#10B981",
            borderColor: "#059669",
            borderWidth: 1,
          },
        ],
      };

      // Agora vamos buscar os documentos verificados por tipo
      const verifiedDocumentsByType = await prisma.document.groupBy({
        by: ["type"],
        _count: {
          _all: true,
        },
        where: {
          process: { ...baseWhere },
          status: "VERIFIED",
        },
      });

      // Criar mapa para facilitar o acesso aos dados de documentos verificados
      const verifiedDocsMap = new Map();
      verifiedDocumentsByType.forEach((doc) => {
        verifiedDocsMap.set(doc.type, doc._count._all);
      });

      // Preparar dados para o gráfico de verificação por tipo
      const documentVerificationByTypeData = {
        labels: documentsByType.map((doc) => {
          // Traduzir os tipos de documento para exibição
          switch (doc.type) {
            case "ID":
              return "Identidade";
            case "CPF":
              return "CPF";
            case "ADDRESS_PROOF":
              return "Comprovante de Endereço";
            case "INCOME_PROOF":
              return "Comprovante de Renda";
            case "SELFIE":
              return "Selfie";
            case "CNPJ":
              return "CNPJ";
            case "COMPANY_CONTRACT":
              return "Contrato Social";
            case "OTHER":
              return "Outros";
            default:
              return doc.type;
          }
        }),
        datasets: [
          {
            label: "Taxa de Verificação (%)",
            data: documentsByType.map((doc) => {
              const totalDocs = doc._count._all;
              const verifiedDocs = verifiedDocsMap.get(doc.type) || 0;
              // Calcular a porcentagem de documentos verificados
              return totalDocs > 0
                ? Math.round((verifiedDocs / totalDocs) * 100)
                : 0;
            }),
            backgroundColor: "#3B82F6",
            borderColor: "#2563EB",
            borderWidth: 1,
          },
        ],
      };

      // Adicionar métricas administrativas ao retorno
      return NextResponse.json({
        totalProcesses,
        activeProcesses,
        urgentProcesses,
        staleProcesses,
        averageCompletionTime,
        completedProcesses,
        totalDocuments,
        averageDocuments,
        inProgressProcesses,
        processesByStatus: processesByStatus.map((status) => ({
          status: status.status,
          count: status._count,
          label: translateProcessStatus(status.status),
        })),
        processTypeData,
        priorityData,
        documentStatusData,
        performanceRate: totalProcesses
          ? Math.round((completedProcesses / totalProcesses) * 100)
          : 0,

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
        averageOperatorSuccessRate:
          operatorStats.reduce((acc, op) => acc + op.successRate, 0) /
          operatorStats.length,

        // Métricas de documentos
        documentVerificationRate:
          (documentMetrics.reduce(
            (acc, doc) => (doc.status === "VERIFIED" ? acc + doc._count : acc),
            0
          ) /
            totalDocuments) *
          100,

        // Métricas de clientes
        clientSourceDistribution: clientMetrics.map((source) => ({
          source: source.source,
          count: source._count,
        })),

        // Métricas de eficiência
        averageProcessTime: averageCompletionTime,
        processCompletionRate: (completedProcesses / totalProcesses) * 100,

        // Métricas de qualidade
        documentRejectionRate:
          (documentMetrics.reduce(
            (acc, doc) => (doc.status === "REJECTED" ? acc + doc._count : acc),
            0
          ) /
            totalDocuments) *
          100,

        // Métricas de produtividade
        processesPerOperator: totalProcesses / totalOperators,
        averageActiveProcesses: activeProcesses / totalOperators,

        // Métricas de processos parados
        staleProcessesRate: totalProcesses
          ? (staleProcesses / totalProcesses) * 100
          : 0,
        staleProcessesByStatus: await prisma.process.groupBy({
          by: ["status"],
          where: {
            ...baseWhere,
            isActive: true,
            updatedAt: {
              lt: staleDate,
            },
            status: {
              notIn: ["COMPLETED", "APPROVED", "CANCELLED", "REJECTED"],
            },
          },
          _count: true,
        }),

        // Nova métrica: Verificação de documentos por tipo
        documentVerificationByType: documentVerificationByTypeData,
      });
    }

    console.log("staleProcesses", staleProcesses);

    // Para operadores não-admin, vamos buscar dados mais específicos
    const [
      recentActivities,
      urgentProcessesList,
      recentDocuments,
      recentClients,
    ] = await Promise.all([
      // Atividades recentes do operador
      prisma.process.findMany({
        where: {
          ...baseWhere,
          updatedAt: {
            gte: new Date(new Date().setHours(new Date().getHours() - 24)), // Últimas 24 horas
          },
        },
        select: {
          id: true,
          status: true,
          updatedAt: true,
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          updatedAt: "desc",
        },
        take: 10,
      }),

      // Lista de processos urgentes com detalhes
      prisma.process.findMany({
        where: {
          ...baseWhere,
          priority: "HIGH",
          isActive: true,
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          client: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: "asc",
        },
        take: 5,
      }),

      // Documentos recentes
      prisma.document.findMany({
        where: {
          process: { ...baseWhere },
          createdAt: {
            gte: new Date(new Date().setHours(new Date().getHours() - 48)), // Últimas 48 horas
          },
        },
        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
          process: {
            select: {
              client: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      }),

      // Últimos clientes (baseado nos processos do operador)
      prisma.client.findMany({
        where: {
          processes: {
            some: {
              ...baseWhere,
            },
          },
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          source: true,
          createdAt: true,
          _count: {
            select: {
              processes: {
                where: {
                  ...baseWhere,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 8,
      }),
    ]);

    return NextResponse.json({
      totalProcesses,
      activeProcesses,
      urgentProcesses,
      staleProcesses,
      averageCompletionTime,
      completedProcesses,
      totalDocuments,
      averageDocuments,
      inProgressProcesses,
      processesByStatus: processesByStatus.map((status) => ({
        status: status.status,
        count: status._count,
        label: translateProcessStatus(status.status),
      })),
      processTypeData,
      priorityData,
      documentStatusData,
      performanceRate: totalProcesses
        ? Math.round((completedProcesses / totalProcesses) * 100)
        : 0,

      // Novos dados para dashboard dinâmico
      recentActivities: recentActivities.map((activity) => ({
        id: activity.id,
        type: "process_update",
        status: activity.status,
        statusLabel: translateProcessStatus(activity.status),
        clientName: activity.client?.name,
        timestamp: activity.updatedAt,
        timeAgo: Math.floor(
          (new Date().getTime() - new Date(activity.updatedAt).getTime()) /
            (1000 * 60)
        ), // minutos atrás
      })),

      urgentProcessesList: urgentProcessesList.map((process) => ({
        id: process.id,
        clientName: process.client?.name,
        status: process.status,
        statusLabel: translateProcessStatus(process.status),
        createdAt: process.createdAt,
        daysWaiting: Math.floor(
          (new Date().getTime() - new Date(process.createdAt).getTime()) /
            (1000 * 60 * 60 * 24)
        ),
      })),

      recentDocuments: recentDocuments.map((doc) => ({
        id: doc.id,
        type: doc.type,
        status: doc.status,
        statusLabel: translateDocumentStatus(doc.status),
        clientName: doc.process?.client?.name,
        timestamp: doc.createdAt,
        hoursAgo: Math.floor(
          (new Date().getTime() - new Date(doc.createdAt).getTime()) /
            (1000 * 60 * 60)
        ),
      })),

      // Estatísticas de hoje
      todayStats: {
        processesCreated: await prisma.process.count({
          where: {
            ...baseWhere,
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        processesCompleted: await prisma.process.count({
          where: {
            ...baseWhere,
            status: "APPROVED",
            updatedAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
        documentsReceived: await prisma.document.count({
          where: {
            process: { ...baseWhere },
            createdAt: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
        }),
      },

      // Novos dados para operadores não-admin
      recentClients: recentClients.map((client) => ({
        id: client.id,
        name: client.name,
        email: client.email,
        phone: client.phone,
        source: client.source,
        processes: client._count.processes,
        joinedAt: client.createdAt,
      })),
    });
  } catch (error) {
    console.error("Erro ao buscar estatísticas:", error);
    return NextResponse.json(
      { error: "Erro ao buscar estatísticas" },
      { status: 500 }
    );
  }
}
