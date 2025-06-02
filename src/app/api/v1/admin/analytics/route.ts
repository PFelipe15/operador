import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30d";
    const adminId = searchParams.get("adminId");

    // Verificar se é administrador
    if (adminId) {
      const admin = await prisma.operator.findUnique({
        where: { id: adminId },
      });

      if (!admin || admin.role !== "ADMIN") {
        return NextResponse.json(
          { error: "Acesso negado. Apenas administradores podem acessar." },
          { status: 403 }
        );
      }
    }

    // Calcular período baseado no timeRange
    const now = new Date();
    let startDate: Date;

    switch (timeRange) {
      case "7d":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "90d":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "1y":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default: // 30d
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    // 1. KPIs Principais - TOTAIS DO SISTEMA (sem filtro de data)
    const [
      totalProcessesEver,
      completedProcessesEver,
      activeProcessesEver,
      totalOperators,
      totalClients,
      avgCompletionTime,
      // Dados filtrados por período para tendências
      totalProcessesPeriod,
      completedProcessesPeriod,
    ] = await Promise.all([
      // Dados totais do sistema
      prisma.process.count(),
      prisma.process.count({
        where: {
          status: { in: ["APPROVED", "COMPLETED"] },
        },
      }),
      prisma.process.count({
        where: {
          isActive: true,
        },
      }),
      prisma.operator.count({ where: { status: "ACTIVE" } }),
      prisma.client.count(),
      prisma.process.aggregate({
        _avg: { progress: true },
      }),
      // Dados do período para cálculos de tendência
      prisma.process.count({ where: { createdAt: { gte: startDate } } }),
      prisma.process.count({
        where: {
          createdAt: { gte: startDate },
          status: { in: ["APPROVED", "COMPLETED"] },
        },
      }),
    ]);

    // 2. Performance dos Operadores - SEMPRE TODOS OS DADOS
    const operatorsWithStats = await prisma.operator.findMany({
      where: { status: "ACTIVE" },
      include: {
        processes: {
          include: { timeline: true },
        },
        _count: {
          select: {
            processes: true,
          },
        },
      },
    });

    const operatorPerformance = {
      labels: operatorsWithStats.map((op) => op.name),
      datasets: [
        {
          label: "Taxa de Sucesso",
          data: operatorsWithStats.map((op) => {
            const completedByOperator = op.processes.filter(
              (p) => p.status === "APPROVED" || p.status === "COMPLETED"
            ).length;
            return op.processes.length > 0
              ? (completedByOperator / op.processes.length) * 100
              : 0;
          }),
          backgroundColor: [
            "rgba(34, 197, 94, 0.8)",
            "rgba(59, 130, 246, 0.8)",
            "rgba(168, 85, 247, 0.8)",
            "rgba(239, 68, 68, 0.8)",
            "rgba(245, 158, 11, 0.8)",
          ],
        },
      ],
    };

    // 3. Análise de Gargalos por Status - TODOS OS PROCESSOS
    const statusDistribution = await prisma.process.groupBy({
      by: ["status"],
      _count: { status: true },
      _avg: { progress: true },
    });

    const bottleneckAnalysis = {
      labels: statusDistribution.map((s) => {
        const statusLabels: Record<string, string> = {
          CREATED: "Criado",
          PENDING_DATA: "Pendente Dados",
          PENDING_DOCS: "Pendente Docs",
          IN_ANALYSIS: "Em Análise",
          APPROVED: "Aprovado",
          COMPLETED: "Finalizado",
        };
        return statusLabels[s.status] || s.status;
      }),
      datasets: [
        {
          label: "Processos por Status",
          data: statusDistribution.map((s) => s._count.status),
          backgroundColor: "rgba(239, 68, 68, 0.6)",
        },
      ],
    };

    // 4. Tendências Temporais (últimos 12 meses) - FILTRADO POR PERÍODO
    const monthlyStats = [];
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);

      const [monthTotal, monthCompleted] = await Promise.all([
        prisma.process.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
          },
        }),
        prisma.process.count({
          where: {
            createdAt: { gte: monthStart, lte: monthEnd },
            status: { in: ["APPROVED", "COMPLETED"] },
          },
        }),
      ]);

      monthlyStats.push({
        month: monthStart.toLocaleDateString("pt-BR", { month: "short" }),
        total: monthTotal,
        completed: monthCompleted,
        efficiency: monthTotal > 0 ? (monthCompleted / monthTotal) * 100 : 0,
      });
    }

    const trends = {
      labels: monthlyStats.map((m) => m.month),
      datasets: [
        {
          label: "Eficiência (%)",
          data: monthlyStats.map((m) => m.efficiency),
          borderColor: "rgb(34, 197, 94)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          tension: 0.4,
        },
        {
          label: "Volume de Processos",
          data: monthlyStats.map((m) => m.total),
          borderColor: "rgb(59, 130, 246)",
          backgroundColor: "rgba(59, 130, 246, 0.1)",
          tension: 0.4,
          yAxisID: "y1",
        },
      ],
    };

    // 5. Previsões baseadas em tendências
    const lastMonth = monthlyStats[monthlyStats.length - 1];
    const avgGrowth =
      monthlyStats.length > 1
        ? (lastMonth.total - monthlyStats[monthlyStats.length - 2].total) /
          Math.max(monthlyStats[monthlyStats.length - 2].total, 1)
        : 0;

    const predictions = {
      nextMonthProcesses: Math.max(
        Math.round(lastMonth.total * (1 + avgGrowth)),
        0
      ),
      efficiency: Math.min(Math.max(lastMonth.efficiency + 2, 0), 95), // Melhoria gradual
      potentialIssues: statusDistribution.filter(
        (s) => s.status.includes("PENDING") && s._count.status > 5
      ).length,
    };

    // 6. Análise de documentos - FILTRADO POR PERÍODO
    const documentStats = await prisma.document.groupBy({
      by: ["status"],
      where: {
        createdAt: { gte: startDate },
      },
      _count: { status: true },
    });

    // 7. Notificações recentes - FILTRADO POR PERÍODO
    const recentNotifications = await prisma.notification.count({
      where: {
        createdAt: { gte: startDate },
        status: "PENDING",
      },
    });

    // 8. Timeline de atividades importantes - FILTRADO POR PERÍODO
    const recentTimeline = await prisma.timelineEvent.findMany({
      where: { createdAt: { gte: startDate } },
      include: {
        process: { include: { client: true } },
        operator: true,
      },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    // Calcular KPIs usando dados totais do sistema
    const efficiency =
      totalProcessesEver > 0
        ? (completedProcessesEver / totalProcessesEver) * 100
        : 0;
    const satisfaction = 94.2; // Pode ser calculado a partir de feedback quando implementado
    const estimatedRevenue = completedProcessesEver * 850; // R$ 850 por processo

    // Calcular crescimento baseado no período selecionado
    const growth =
      totalProcessesPeriod > 0 && monthlyStats.length > 1
        ? ((lastMonth.total - monthlyStats[monthlyStats.length - 2].total) /
            Math.max(monthlyStats[monthlyStats.length - 2].total, 1)) *
          100
        : 0;

    // Identificar gargalos usando todos os processos
    const bottlenecks = statusDistribution.filter(
      (s) => s.status.includes("PENDING") && s._count.status > 3
    ).length;

    const analyticsData = {
      kpis: {
        efficiency: Number(efficiency.toFixed(1)),
        satisfaction: satisfaction,
        revenue: estimatedRevenue,
        growth: Number(growth.toFixed(1)),
        bottlenecks: bottlenecks,
        predictions,
      },
      trends,
      operatorPerformance,
      bottleneckAnalysis,
      predictiveAnalytics: {
        labels: ["Próximos 7 dias", "Próximos 15 dias", "Próximo mês"],
        datasets: [
          {
            label: "Processos Previstos",
            data: [
              Math.round(predictions.nextMonthProcesses * 0.25),
              Math.round(predictions.nextMonthProcesses * 0.5),
              predictions.nextMonthProcesses,
            ],
            backgroundColor: "rgba(168, 85, 247, 0.6)",
          },
          {
            label: "Capacidade Atual",
            data: [
              totalOperators * 15, // 15 processos por operador por semana
              totalOperators * 30, // 30 processos por operador por quinzena
              totalOperators * 50, // 50 processos por operador por mês
            ],
            backgroundColor: "rgba(34, 197, 94, 0.6)",
          },
        ],
      },
      insights: [
        {
          type:
            efficiency >= 85
              ? "success"
              : efficiency >= 70
              ? "warning"
              : "error",
          title:
            efficiency >= 85
              ? "Excelente Performance"
              : efficiency >= 70
              ? "Performance Adequada"
              : "Performance Baixa",
          message: `Taxa de eficiência atual: ${efficiency.toFixed(1)}%`,
          action: efficiency < 70 ? "Revisar processos" : null,
        },
        {
          type:
            bottlenecks === 0
              ? "success"
              : bottlenecks <= 2
              ? "warning"
              : "error",
          title: bottlenecks === 0 ? "Sem Gargalos" : "Gargalos Identificados",
          message: `${bottlenecks} gargalos detectados no fluxo`,
          action: bottlenecks > 0 ? "Otimizar processos" : null,
        },
        {
          type: "info",
          title: "Previsão de Demanda",
          message: `${predictions.nextMonthProcesses} processos previstos para próximo mês`,
          action:
            predictions.nextMonthProcesses > totalOperators * 40
              ? "Considerar contratar mais operadores"
              : null,
        },
      ],
      systemStats: {
        totalProcesses: totalProcessesEver, // Sempre mostrar total do sistema
        activeProcesses: activeProcessesEver, // Sempre mostrar total do sistema
        completedProcesses: completedProcessesEver, // Sempre mostrar total do sistema
        totalOperators,
        totalClients,
        pendingNotifications: recentNotifications,
        avgProgress: Number((avgCompletionTime._avg.progress || 0).toFixed(1)),
        documentStats: documentStats.map((d) => ({
          status: d.status,
          count: d._count.status,
        })),
      },
      recentActivity: recentTimeline.slice(0, 10).map((event) => ({
        id: event.id,
        title: event.title,
        description: event.description,
        type: event.type,
        category: event.category,
        createdAt: event.createdAt,
        operatorName: event.operator?.name,
        clientName: event.process?.client?.name,
      })),
      // Informações adicionais sobre o período
      periodInfo: {
        timeRange,
        startDate: startDate.toISOString(),
        endDate: now.toISOString(),
        processesInPeriod: totalProcessesPeriod,
        completedInPeriod: completedProcessesPeriod,
      },
    };

    return NextResponse.json(analyticsData);
  } catch (error) {
    console.error("Erro ao buscar analytics administrativos:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
