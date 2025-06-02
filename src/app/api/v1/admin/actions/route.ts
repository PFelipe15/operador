import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação para ações administrativas
const adminActionSchema = z.object({
  type: z.string(),
  data: z
    .object({
      // Para reatribuição de operador
      processIds: z.array(z.string()).optional(),
      fromOperatorId: z.string().optional(),
      toOperatorId: z.string().optional(),

      // Para mudanças em massa
      targetIds: z.array(z.string()).optional(),
      newPriority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      priority: z.string().optional(),
      newStatus: z.string().optional(),

      // Para relatórios
      reportType: z
        .enum(["performance", "efficiency", "timeline", "custom"])
        .optional(),
      startDate: z.string().optional(),
      endDate: z.string().optional(),
      filters: z.record(z.any()).optional(),

      // Para notificações do sistema
      title: z.string().optional(),
      message: z.string().optional(),
      priority: z.enum(["HIGH", "NORMAL", "LOW"]).optional(),
      targetOperators: z.array(z.string()).optional(),
      type: z.string().optional(),

      // Para auditoria
      entityType: z
        .enum(["process", "operator", "client", "document"])
        .optional(),
      entityId: z.string().optional(),
      period: z.string().optional(),

      // Para alertas de performance
      threshold: z.number().optional(),
      metric: z.string().optional(),

      // Para escalação de emergência
      reason: z.string().optional(),
      urgentProcesses: z.array(z.string()).optional(),
    })
    .optional(),
  operatorId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Body recebido:", body);
    
    const { type, data, operatorId } = adminActionSchema.parse(body);

    // Verificar se é administrador
    const admin = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!admin || admin.role !== "ADMIN") {
      return NextResponse.json(
        {
          error:
            "Acesso negado. Apenas administradores podem executar esta ação.",
        },
        { status: 403 }
      );
    }

    let result;

    console.log("Tipo de ação:", type);

    switch (type) {
      case "REASSIGN_PROCESSES":
        result = await handleReassignOperator(data!, operatorId);
        break;

      case "mass_priority_update":
        result = await handleBulkPriorityChange(data!, operatorId);
        break;

      case "generate_report":
        result = await handleGenerateReport(data!, operatorId);
        break;

      case "mass_notification":
        result = await handleSystemNotification(data!, operatorId);
        break;

      case "audit_log":
        result = await handleAuditLog(data!, operatorId);
        break;

      case "performance_alert":
        result = await handlePerformanceAlert(data!, operatorId);
        break;

      case "backup_data":
        result = await handleBackupData(operatorId);
        break;

      case "reset_operator_stats":
        result = await handleResetOperatorStats(data!, operatorId);
        break;

      case "bulk_status_change":
        result = await handleBulkStatusChange(data!, operatorId);
        break;

      case "emergency_protocol":
        result = await handleEmergencyEscalation(data!, operatorId);
        break;

      default:
        return NextResponse.json(
          { error: `Ação administrativa não reconhecida: ${type}` },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erro ao executar ação administrativa:", error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error.message}` },
      { status: 500 }
    );
  }
}

// Função para reatribuir operador em massa
async function handleReassignOperator(data: any, adminId: string) {
  const { processIds, fromOperatorId, toOperatorId } = data;

  console.log("Dados de reatribuição:", { processIds, fromOperatorId, toOperatorId });

  if (!processIds || processIds.length === 0) {
    throw new Error("Nenhum processo foi selecionado para reatribuição");
  }

  if (!toOperatorId) {
    throw new Error("Operador destino é obrigatório");
  }

  // Verificar se o operador destino existe
  const targetOperator = await prisma.operator.findUnique({
    where: { id: toOperatorId },
  });

  if (!targetOperator) {
    throw new Error("Operador destino não encontrado");
  }

  // Reatribuir processos específicos
  const processes = await prisma.process.updateMany({
    where: { 
      id: { in: processIds },
      isActive: true // Apenas processos ativos
    },
    data: { 
      operatorId: toOperatorId,
      lastInteractionAt: new Date()
    },
  });

  // Criar log de auditoria para cada processo
  for (const processId of processIds) {
    await prisma.timelineEvent.create({
      data: {
        title: "Processo reatribuído",
        description: `Processo reatribuído pelo administrador`,
        type: "INFO",
        category: "STATUS",
        source: "SYSTEM",
        processId: processId,
        operatorId: adminId,
        createdBy: adminId,
        metadata: JSON.stringify({
          action: "reassign",
          fromOperator: fromOperatorId,
          toOperator: toOperatorId,
          reassignedBy: adminId,
        }),
      },
    });
  }

  return { 
    success: true, 
    affectedProcesses: processes.count,
    message: `${processes.count} processo(s) reatribuído(s) com sucesso`
  };
}

// Função para mudança de prioridade em massa
async function handleBulkPriorityChange(data: any, adminId: string) {
  const { priority, processIds } = data;

  if (!processIds || processIds.length === 0) {
    throw new Error("Nenhum processo foi selecionado");
  }

  const processes = await prisma.process.updateMany({
    where: { id: { in: processIds } },
    data: { priority: priority },
  });

  // Criar eventos na timeline para cada processo
  for (const processId of processIds) {
    await prisma.timelineEvent.create({
      data: {
        title: `Prioridade alterada para ${
          priority === "HIGH"
            ? "Alta"
            : priority === "MEDIUM"
            ? "Média"
            : "Baixa"
        }`,
        description: "Prioridade alterada pelo administrador em ação em massa",
        type: "WARNING",
        category: "STATUS",
        source: "SYSTEM",
        processId,
        operatorId: adminId,
        createdBy: adminId,
      },
    });
  }

  return { success: true, affectedProcesses: processes.count };
}

// Função para gerar relatório
async function handleGenerateReport(data: any, adminId: string) {
  const { reportType, startDate, endDate, filters } = data;

  const dateFilter = {
    createdAt: {
      gte: startDate
        ? new Date(startDate)
        : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      lte: endDate ? new Date(endDate) : new Date(),
    },
  };

  let reportData;

  switch (reportType) {
    case "performance":
      reportData = await generatePerformanceReport(dateFilter);
      break;
    case "efficiency":
      reportData = await generateEfficiencyReport(dateFilter);
      break;
    case "timeline":
      reportData = await generateTimelineReport(dateFilter);
      break;
    default:
      reportData = await generateCustomReport(dateFilter, filters);
  }

  // Log da geração do relatório
  await prisma.timelineEvent.create({
    data: {
      title: `Relatório ${reportType} gerado`,
      description: `Administrador gerou relatório do período`,
      type: "INFO",
      category: "ANALYSIS",
      source: "SYSTEM",
      processId: "REPORT_GENERATION",
      operatorId: adminId,
      createdBy: adminId,
      metadata: JSON.stringify({ reportType, period: { startDate, endDate } }),
    },
  });

  return { success: true, report: reportData, generatedAt: new Date() };
}

// Função para notificação do sistema
async function handleSystemNotification(data: any, adminId: string) {
  const { title, message, priority, targetOperators } = data;

  const notifications = [];

  if (targetOperators && targetOperators.length > 0) {
    // Enviar para operadores específicos
    for (const operatorId of targetOperators) {
      const notification = await prisma.notification.create({
        data: {
          title: title || "Notificação do Sistema",
          message: message || "Mensagem do administrador",
          type: "ALERT",
          category: "SYSTEM",
          priority: priority || "NORMAL",
          status: "PENDING",
          source: "SYSTEM",
          senderId: adminId,
          recipientId: operatorId,
          actionType: "system_notification",
        },
      });
      notifications.push(notification);
    }
  } else {
    // Enviar para todos os operadores
    const operators = await prisma.operator.findMany({
      where: { status: "ACTIVE" },
    });

    for (const operator of operators) {
      const notification = await prisma.notification.create({
        data: {
          title: title || "Notificação do Sistema",
          message: message || "Mensagem do administrador",
          type: "ALERT",
          category: "SYSTEM",
          priority: priority || "NORMAL",
          status: "PENDING",
          source: "SYSTEM",
          senderId: adminId,
          recipientId: operator.id,
          actionType: "system_notification",
        },
      });
      notifications.push(notification);
    }
  }

  return { success: true, notificationsSent: notifications.length };
}

// Função para log de auditoria
async function handleAuditLog(data: any, adminId: string) {
  const { entityType, entityId, period } = data;

  const periodDays =
    period === "week"
      ? 7
      : period === "month"
      ? 30
      : period === "quarter"
      ? 90
      : 1;
  const startDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);

  let auditLogs;

  if (entityType && entityId) {
    // Logs específicos de uma entidade
    auditLogs = await prisma.timelineEvent.findMany({
      where: {
        createdAt: { gte: startDate },
        OR: [
          { processId: entityId },
          { operatorId: entityId },
          { createdBy: entityId },
        ],
      },
      include: {
        process: { include: { client: true } },
        operator: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  } else {
    // Logs gerais do sistema
    auditLogs = await prisma.timelineEvent.findMany({
      where: {
        createdAt: { gte: startDate },
      },
      include: {
        process: { include: { client: true } },
        operator: true,
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  return { success: true, auditLogs, period: periodDays };
}

// Função para alerta de performance
async function handlePerformanceAlert(data: any, adminId: string) {
  const { threshold, metric } = data;

  // Buscar operadores com performance abaixo do threshold
  const operators = await prisma.operator.findMany({
    where: {
      status: "ACTIVE",
      [metric === "successRate" ? "successRate" : "processesCount"]: {
        lt: threshold,
      },
    },
  });

  // Criar notificações de alerta
  for (const operator of operators) {
    await prisma.notification.create({
      data: {
        title: "Alerta de Performance",
        message: `Sua ${
          metric === "successRate"
            ? "taxa de sucesso"
            : "quantidade de processos"
        } está abaixo do esperado`,
        type: "WARNING",
        category: "PROCESS",
        priority: "HIGH",
        status: "PENDING",
        source: "SYSTEM",
        senderId: adminId,
        recipientId: operator.id,
        actionType: "performance_alert",
      },
    });
  }

  return { success: true, alertsSent: operators.length };
}

// Função para backup de dados
async function handleBackupData(adminId: string) {
  // Simular backup (em produção seria implementado backup real)
  const backupData = {
    timestamp: new Date(),
    totalProcesses: await prisma.process.count(),
    totalClients: await prisma.client.count(),
    totalOperators: await prisma.operator.count(),
    totalDocuments: await prisma.document.count(),
    totalNotifications: await prisma.notification.count(),
  };

  await prisma.timelineEvent.create({
    data: {
      title: "Backup do sistema realizado",
      description: "Backup completo dos dados do sistema",
      type: "SUCCESS",
      category: "ANALYSIS",
      source: "SYSTEM",
      processId: "SYSTEM_BACKUP",
      operatorId: adminId,
      createdBy: adminId,
      metadata: JSON.stringify(backupData),
    },
  });

  return { success: true, backup: backupData };
}

// Função para resetar estatísticas do operador
async function handleResetOperatorStats(data: any, adminId: string) {
  const { targetIds } = data;

  await prisma.operator.updateMany({
    where: { id: { in: targetIds } },
    data: {
      processesCount: 0,
      successRate: 0,
    },
  });

  return { success: true, resetOperators: targetIds.length };
}

// Função para mudança de status em massa
async function handleBulkStatusChange(data: any, adminId: string) {
  const { targetIds, newStatus } = data;

  const processes = await prisma.process.updateMany({
    where: { id: { in: targetIds } },
    data: { status: newStatus },
  });

  return { success: true, affectedProcesses: processes.count };
}

// Função para escalação de emergência
async function handleEmergencyEscalation(data: any, adminId: string) {
  const { reason, urgentProcesses } = data;

  // Criar notificações de emergência para todos os operadores
  const operators = await prisma.operator.findMany({
    where: { status: "ACTIVE" },
  });

  for (const operator of operators) {
    await prisma.notification.create({
      data: {
        title: "🚨 ESCALAÇÃO DE EMERGÊNCIA",
        message: `ATENÇÃO: ${reason}. Processos prioritários requerem ação imediata.`,
        type: "ALERT",
        category: "SYSTEM",
        priority: "HIGH",
        status: "PENDING",
        source: "SYSTEM",
        senderId: adminId,
        recipientId: operator.id,
        actionType: "emergency_escalation",
      },
    });
  }

  // Alterar prioridade dos processos para ALTA
  if (urgentProcesses && urgentProcesses.length > 0) {
    await prisma.process.updateMany({
      where: { id: { in: urgentProcesses } },
      data: { priority: "HIGH" },
    });
  }

  return { success: true, escalationSent: operators.length };
}

// Funções auxiliares para relatórios
async function generatePerformanceReport(dateFilter: any) {
  const operators = await prisma.operator.findMany({
    include: {
      processes: {
        where: dateFilter,
        include: { client: true },
      },
      _count: {
        select: {
          processes: { where: dateFilter },
        },
      },
    },
  });

  return operators.map((op) => ({
    id: op.id,
    name: op.name,
    processesCount: op._count.processes,
    successRate: op.successRate,
    avgCompletionTime:
      op.processes.length > 0
        ? op.processes.reduce((acc, p) => acc + p.progress / 100, 0) /
          op.processes.length
        : 0,
  }));
}

async function generateEfficiencyReport(dateFilter: any) {
  const processes = await prisma.process.findMany({
    where: dateFilter,
    include: {
      client: true,
      operator: true,
      documents: true,
      timeline: true,
    },
  });

  return {
    totalProcesses: processes.length,
    completedProcesses: processes.filter(
      (p) => p.status === "APPROVED" || p.status === "COMPLETED"
    ).length,
    avgDocumentsPerProcess:
      processes.reduce((acc, p) => acc + p.documents.length, 0) /
      processes.length,
    avgTimelineEvents:
      processes.reduce((acc, p) => acc + p.timeline.length, 0) /
      processes.length,
  };
}

async function generateTimelineReport(dateFilter: any) {
  return await prisma.timelineEvent.findMany({
    where: {
      createdAt: dateFilter.createdAt,
    },
    include: {
      process: { include: { client: true } },
      operator: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
}

async function generateCustomReport(dateFilter: any, filters: any) {
  // Implementar relatório customizado baseado nos filtros
  return {
    message: "Relatório customizado gerado",
    filters,
    dateRange: dateFilter,
  };
}
