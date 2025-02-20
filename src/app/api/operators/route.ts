import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import bcrypt from "bcryptjs";
import { NotificationCategory, NotificationPriority, NotificationStatus, NotificationType } from '@prisma/client';
 
export async function GET() {
  try {
    const operators = await prisma.operator.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        processesCount: true,
        role: true
      },
      where: {
        status: {
          not: 'INACTIVE'
        }
      }
    })

    return NextResponse.json(operators)
  } catch (error) {
    console.error('Erro ao buscar operadores:', error)
    return NextResponse.json(
      { error: 'Erro ao buscar operadores' },
      { status: 500 }
    )
  }
} 


export async function POST(request: Request) {
  const { name, email, password, role   } = await request.json()

  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    const operator = await prisma.operator.create({
        data: {
            name,
            email,
            password: hashedPassword,
            role,
         }
    })

    //Notificacao de boas vindas ao operador
    await prisma.notification.create({
      data: {
        title: "Bem-vindo ao sistema!",
        message: `Olá ${name}, seja bem-vindo(a) à nossa plataforma!`,
        type: NotificationType.SUCCESS,
        category: NotificationCategory.SYSTEM,
        priority: NotificationPriority.HIGH,
        status: NotificationStatus.SENT,
        source: "SYSTEM",
        recipientId: operator.id,
        metadata: JSON.stringify({
          operatorRole: role
        })
      }
    })

    return NextResponse.json(operator)
  } catch (error) {
    console.error('Erro ao criar operador:', error)
    return NextResponse.json(
      { error: 'Erro ao criar operador' },
      { status: 500 }
    )
  }
}     

