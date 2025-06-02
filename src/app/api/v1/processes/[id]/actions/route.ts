import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Schema de validação para as ações
const actionSchema = z.object({
  action: z.enum([
    "priority",
    "reminder",
    "note",
    "contact",
    "favorite",
    "duplicate",
    "issue",
  ]),
  data: z
    .object({
      priority: z.enum(["HIGH", "MEDIUM", "LOW"]).optional(),
      reminderDate: z.string().optional(),
      reminderMessage: z.string().optional(),
      noteContent: z.string().optional(),
      contactMethod: z.enum(["whatsapp", "email", "phone"]).optional(),
      contactMessage: z.string().optional(),
      issueDescription: z.string().optional(),
      issueType: z
        .enum(["technical", "process", "document", "client"])
        .optional(),
    })
    .optional(),
  operatorId: z.string(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { action, data, operatorId } = actionSchema.parse(body);
    const processId = params.id;

    // Verificar se o processo existe
    const process = await prisma.process.findUnique({
      where: { id: processId },
      include: { client: true, operator: true },
    });

    if (!process) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    // Verificar se o operador existe
    const operator = await prisma.operator.findUnique({
      where: { id: operatorId },
    });

    if (!operator) {
      return NextResponse.json(
        { error: "Operador não encontrado" },
        { status: 404 }
      );
    }

    let result;

    switch (action) {
      case "priority":
        // Verificar se o operador é administrador para alterar prioridade
        if (operator.role !== "ADMIN") {
          return NextResponse.json(
            {
              error:
                "Acesso negado. Apenas administradores podem alterar a prioridade de processos.",
            },
            { status: 403 }
          );
        }
        result = await handlePriorityAction(
          processId,
          data?.priority || "HIGH",
          operatorId
        );
        break;

      case "reminder":
        result = await handleReminderAction(
          processId,
          data?.reminderDate,
          data?.reminderMessage,
          operatorId
        );
        break;

      case "note":
        result = await handleNoteAction(
          processId,
          data?.noteContent || "",
          operatorId
        );
        break;

      case "contact":
        result = await handleContactAction(
          processId,
          data?.contactMethod || "whatsapp",
          data?.contactMessage,
          operatorId
        );
        break;

      case "favorite":
        result = await handleFavoriteAction(processId, operatorId);
        break;

      case "duplicate":
        // Verificar se o operador é administrador para duplicar processo
        if (operator.role !== "ADMIN") {
          return NextResponse.json(
            {
              error:
                "Acesso negado. Apenas administradores podem duplicar processos.",
            },
            { status: 403 }
          );
        }
        result = await handleDuplicateAction(processId, operatorId);
        break;

      case "issue":
        result = await handleIssueAction(
          processId,
          data?.issueDescription || "",
          data?.issueType || "technical",
          operatorId
        );
        break;

      default:
        return NextResponse.json(
          { error: "Ação não reconhecida" },
          { status: 400 }
        );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erro ao executar ação:", error);
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}

// Função para alterar prioridade
async function handlePriorityAction(
  processId: string,
  priority: string,
  operatorId: string
) {
  const updatedProcess = await prisma.process.update({
    where: { id: processId },
    data: { priority: priority as any },
  });

  // Criar evento na timeline
  await prisma.timelineEvent.create({
    data: {
      title: `Prioridade alterada para ${
        priority === "HIGH" ? "Alta" : priority === "MEDIUM" ? "Média" : "Baixa"
      }`,
      description: `Prioridade do processo foi alterada pelo operador`,
      type: "INFO",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
    },
  });

  return { success: true, process: updatedProcess };
}

// Função para criar lembrete
async function handleReminderAction(
  processId: string,
  reminderDate: string | undefined,
  message: string | undefined,
  operatorId: string
) {
  const expiresAt = reminderDate
    ? new Date(reminderDate)
    : new Date(Date.now() + 24 * 60 * 60 * 1000); // 24h padrão

  const notification = await prisma.notification.create({
    data: {
      title: "Lembrete do Processo",
      message: message || "Lembrete criado para este processo",
      type: "INFO",
      category: "PROCESS",
      priority: "NORMAL",
      status: "PENDING",
      source: "MANUAL",
      processId,
      senderId: operatorId,
      recipientId: operatorId,
      expiresAt,
      actionType: "reminder",
      actionUrl: `/operador/process/${processId}`,
    },
  });

  // Criar evento na timeline
  await prisma.timelineEvent.create({
    data: {
      title: "Lembrete adicionado",
      description: `Lembrete criado para ${expiresAt.toLocaleDateString(
        "pt-BR"
      )}`,
      type: "INFO",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
    },
  });

  return { success: true, notification };
}

// Função para adicionar anotação
async function handleNoteAction(
  processId: string,
  content: string,
  operatorId: string
) {
  const timelineEvent = await prisma.timelineEvent.create({
    data: {
      title: "Anotação adicionada",
      description: content || "Nova anotação do operador",
      type: "INFO",
      category: "DATA",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
      metadata: JSON.stringify({ type: "note", isOperatorNote: true }),
    },
  });

  return { success: true, timelineEvent };
}

// Função para entrar em contato
async function handleContactAction(
  processId: string,
  method: string,
  message: string | undefined,
  operatorId: string
) {
  // Buscar dados do cliente para contato
  const process = await prisma.process.findUnique({
    where: { id: processId },
    include: { client: true },
  });

  if (!process) {
    throw new Error("Processo não encontrado");
  }

  // Criar evento na timeline
  const timelineEvent = await prisma.timelineEvent.create({
    data: {
      title: `Contato via ${
        method === "whatsapp"
          ? "WhatsApp"
          : method === "email"
          ? "E-mail"
          : "Telefone"
      }`,
      description: message || `Contato iniciado com ${process.client.name}`,
      type: "INFO",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
      metadata: JSON.stringify({
        contactMethod: method,
        clientPhone: process.client.phone,
        clientEmail: process.client.email,
      }),
    },
  });

  // Se for WhatsApp, preparar dados para envio de mensagem
  let contactInfo = {};
  if (method === "whatsapp") {
    contactInfo = {
      phone: process.client.phone,
      message:
        message ||
        `Olá ${process.client.name}, entrando em contato sobre seu processo.`,
    };
  } else if (method === "email") {
    contactInfo = {
      email: process.client.email,
      subject: `Processo ${processId.slice(-8)}`,
      message:
        message ||
        `Olá ${process.client.name}, entrando em contato sobre seu processo.`,
    };
  }

  return { success: true, timelineEvent, contactInfo };
}

// Função para favoritar processo
async function handleFavoriteAction(processId: string, operatorId: string) {
  // Como não temos campo de favoritos no schema, vamos usar uma notificação especial
  const notification = await prisma.notification.create({
    data: {
      title: "Processo Favoritado",
      message: "Este processo foi adicionado aos seus favoritos",
      type: "INFO",
      category: "PROCESS",
      priority: "LOW",
      status: "PENDING",
      source: "MANUAL",
      processId,
      senderId: operatorId,
      recipientId: operatorId,
      actionType: "favorite",
      actionUrl: `/operador/process/${processId}`,
      metadata: JSON.stringify({ isFavorite: true }),
    },
  });

  // Criar evento na timeline
  await prisma.timelineEvent.create({
    data: {
      title: "Processo favoritado",
      description: "Processo adicionado aos favoritos do operador",
      type: "SUCCESS",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
    },
  });

  return { success: true, notification };
}

// Função para duplicar processo
async function handleDuplicateAction(processId: string, operatorId: string) {
  const originalProcess = await prisma.process.findUnique({
    where: { id: processId },
    include: {
      client: true,
      company: true,
      documents: true,
    },
  });

  if (!originalProcess) {
    throw new Error("Processo original não encontrado");
  }

  // Criar novo processo baseado no original
  const newProcess = await prisma.process.create({
    data: {
      clientId: originalProcess.clientId,
      companyId: originalProcess.companyId,
      operatorId: operatorId,
      status: "CREATED",
      priority: originalProcess.priority,
      type: originalProcess.type,
      progress: 0,
      source: "MANUAL",
      pendingTypeData: originalProcess.pendingTypeData,
    },
  });

  // Duplicar documentos como PENDING
  for (const doc of originalProcess.documents) {
    await prisma.document.create({
      data: {
        name: doc.name,
        status: "PENDING",
        type: doc.type,
        source: "MANUAL",
        processId: newProcess.id,
        uploadedById: operatorId,
      },
    });
  }

  // Criar evento na timeline do processo original
  await prisma.timelineEvent.create({
    data: {
      title: "Processo duplicado",
      description: `Novo processo ${newProcess.id.slice(
        -8
      )} criado baseado neste`,
      type: "INFO",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
    },
  });

  // Criar evento na timeline do novo processo
  await prisma.timelineEvent.create({
    data: {
      title: "Processo criado por duplicação",
      description: `Processo criado baseado em ${processId.slice(-8)}`,
      type: "SUCCESS",
      category: "STATUS",
      source: "MANUAL",
      processId: newProcess.id,
      operatorId,
      createdBy: operatorId,
    },
  });

  return { success: true, newProcess };
}

// Função para reportar problema
async function handleIssueAction(
  processId: string,
  description: string,
  type: string,
  operatorId: string
) {
  const notification = await prisma.notification.create({
    data: {
      title: `Problema Reportado: ${
        type === "technical"
          ? "Técnico"
          : type === "process"
          ? "Processo"
          : type === "document"
          ? "Documento"
          : "Cliente"
      }`,
      message: description || "Problema reportado pelo operador",
      type: "WARNING",
      category: "SYSTEM",
      priority: "HIGH",
      status: "PENDING",
      source: "MANUAL",
      processId,
      senderId: operatorId,
      recipientId: operatorId, // Por enquanto notifica o próprio operador, mas poderia ser admin
      actionType: "issue",
      actionUrl: `/operador/process/${processId}`,
      metadata: JSON.stringify({ issueType: type, reportedBy: operatorId }),
    },
  });

  // Criar evento na timeline
  await prisma.timelineEvent.create({
    data: {
      title: "Problema reportado",
      description: `${
        type === "technical"
          ? "Problema técnico"
          : type === "process"
          ? "Problema no processo"
          : type === "document"
          ? "Problema no documento"
          : "Problema com cliente"
      }: ${description}`,
      type: "WARNING",
      category: "STATUS",
      source: "MANUAL",
      processId,
      operatorId,
      createdBy: operatorId,
    },
  });

  return { success: true, notification };
}
