import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { saveFile } from '@/lib/upload'
import {  DocumentStatus, NotificationCategory, NotificationType, Source, TimelineEventCategory, TimelineEventType } from '@prisma/client'


export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {


    const formData = await req.formData()
    const file = formData.get('file') as File
    const documentType = formData.get('documentType') as string
    const operatorId = formData.get('operatorId') as string
    const source = formData.get('source') as string || "MANUAL"

    if (!file || !documentType) {
      return NextResponse.json(
        { error: 'Arquivo ou tipo de documento não fornecido' },
        { status: 400 }
      )
    }

    // Validar tipo do arquivo
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de arquivo não permitido' },
        { status: 400 }
      )
    }

    // Validar tamanho do arquivo (5MB)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Arquivo muito grande. Máximo permitido: 5MB' },
        { status: 400 }
      )
    }

    // Salvar arquivo e obter o caminho
    const filePath = await saveFile(file, params.id, documentType)

    // Criar documento
    const document = await prisma.document.create({
      data: {
        name: documentType,
        filePath: filePath,
        type: documentType,
        source: source as Source,
        processId: params.id,
        uploadedById: operatorId,
        status: "SENT" as DocumentStatus,
        
       
      },
      include: {
        uploadedBy: true
      }
    })

    // Criar evento na timeline


    await prisma.timelineEvent.create({
      data: {
        title: "Documento Anexado",
        description: `Documento ${documentType} foi anexado ao processo`,
        type: "SUCCESS" as TimelineEventType,
        category: "DOCUMENT" as TimelineEventCategory,
        source: source as Source,
        operatorId,

        metadata: JSON.stringify({
          documentType,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)}KB`,
          fileType: file.type
        }),
        processId: params.id
      }
    })

    // Atualizar lastInteractionAt do processo
    const processUpdated = await prisma.process.update({
      where: { id: params.id },
      data: { lastInteractionAt: new Date() },
      include: {
        operator: true
      }
    })

    //notificar o operador que esta encarregado do processo
    const sourceFormData = formData.get('source') as string || "MANUAL" //caso o documento seja anexado por algum operador operador

    const operadorQueAnexou = operatorId
    await prisma.notification.create({
      data: {
        processId: params.id,
        recipientId: processUpdated.operator?.id || '',
        title: "Documento Anexado",
        message: "O documento " + documentType + " foi anexado ao processo",
        source: sourceFormData as Source,
        type: "SUCCESS" as NotificationType,
        category: "DOCUMENT" as NotificationCategory,

        metadata: JSON.stringify({
          documentType,
          fileName: file.name,
          fileSize: `${(file.size / 1024).toFixed(2)}KB`,
          fileType: file.type,
          operadorQueAnexou: operadorQueAnexou
        }),
      }
    })

    return NextResponse.json(document)
  } catch (error) {
    console.error('Erro ao fazer upload:', error)
    return NextResponse.json(
      { error: 'Erro ao processar upload' },
      { status: 500 }
    )
  }
} 

