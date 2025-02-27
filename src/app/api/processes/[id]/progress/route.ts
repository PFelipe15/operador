import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { MEI_ANALYSIS_STEPS } from "@/lib/constants";
import { translateProcessStatus } from "@/lib/utils";
import { NotificationCategory, ProcessStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const processId = params.id;
    const { step, data } = await req.json();

    // Caso especial para iniciar o processo
    if (step === "START_PROCESS") {
      const currentProcess = await prisma.process.findUnique({
        where: { id: processId },
      });

      if (!currentProcess) {
        return NextResponse.json(
          { error: "Processo não encontrado" },
          { status: 404 }
        );
      }

      const updatedProcess = await prisma.process.update({
        where: { id: processId },
        data: {
          status: "ANALYZING_DATA",
          progress: 0,
          timeline: {
            create: {
              title: "Processo Iniciado",
              description: "Análise do processo foi iniciada",
              type: "INFO",
              category: "STATUS",
              source: "SYSTEM",
              metadata: JSON.stringify({
                previousStatus: currentProcess.status,
                newStatus: "ANALYZING_DATA",
              }),
            },
          },
        },
      });

      return NextResponse.json(updatedProcess);
    }

    if (step === "PENDING_DATA_UPDATE") {
      const currentProcess = await prisma.process.findUnique({
        where: { id: processId },
      });

      if (!currentProcess) {
        return NextResponse.json(
          { error: "Processo não encontrado" },
          { status: 404 }
        );
      }

      // Atualiza diretamente com a nova lista completa de pendências
      const updatedProcess = await prisma.process.update({
        where: { id: processId },
        data: {
          status: "PENDING_DATA",
          pendingTypeData: data.pendingTypeData, // Usa a lista completa enviada
          timeline: {
            create: {
              title: "Dados Pendentes Atualizados",
              description: "Lista de dados pendentes foi atualizada",
              type: "WARNING",
              category: "DATA",
              source: "SYSTEM",
              metadata: JSON.stringify({
                previousStatus: data.previousStatus,
                newStatus: "PENDING_DATA",
                pendingTypeData: data.pendingTypeData,
                addedItems: data.addedItems,
                removedItems: data.removedItems,
              }),
            },
          },
        },
      });

      await prisma.notification.create({
        data: {
          processId: processId,
          recipientId: updatedProcess.operatorId || "",
          message: `Lista de dados pendentes do processo foi atualizada`,
          type: "WARNING",
          category: NotificationCategory.PROCESS,
          source: "SYSTEM",
          title: "Dados Pendentes Atualizados",
          metadata: JSON.stringify({
            pendingTypeData: data.pendingTypeData,
            addedItems: data.addedItems,
            removedItems: data.removedItems,
          }),
        },
      });

      return NextResponse.json(updatedProcess);
    }

    const currentStep =
      MEI_ANALYSIS_STEPS[step as keyof typeof MEI_ANALYSIS_STEPS];
    if (!currentStep) {
      return NextResponse.json({ error: "Step inválido" }, { status: 400 });
    }

    const currentProcess = await prisma.process.findUnique({
      where: { id: processId },
    });

    if (!currentProcess) {
      return NextResponse.json(
        { error: "Processo não encontrado" },
        { status: 404 }
      );
    }

    const updatedProcess = await prisma.process.update({
      where: { id: processId },
      data: {
        progress: currentStep.progress,
        status: currentStep.next_status as ProcessStatus,
        timeline: {
          create: {
            title: `${currentStep.title} Concluído`,
            description: `Etapa ${translateProcessStatus(
              currentStep.next_status as ProcessStatus
            )} finalizado com sucesso`,
            type: "SUCCESS",
            category: "STATUS",
            source: "SYSTEM",
            metadata: JSON.stringify({
              step: currentStep.id,
              progress: currentStep.progress,
              previousStatus: currentProcess.status,
              newStatus: currentStep.next_status,
              checkedItems: data.checkedItems,
            }),
          },
        },
      },
    });

    await prisma.notification.create({
      data: {
        processId: processId,
        recipientId: currentProcess.operatorId || "",
        message: `Etapa ${translateProcessStatus(
          currentStep.next_status
        )} finalizado com sucesso`,
        type: "SUCCESS",
        category: NotificationCategory.PROCESS,
        source: "SYSTEM",
        title: `Etapa ${translateProcessStatus(
          currentStep.next_status
        )} finalizado com sucesso`,
        metadata: JSON.stringify({
          step: currentStep.id,
        }),
      },
    });

    return NextResponse.json(updatedProcess);
  } catch (error) {
    console.error("Erro ao atualizar progresso:", error);
    return NextResponse.json(
      { error: "Erro ao atualizar progresso" },
      { status: 500 }
    );
  }
}
