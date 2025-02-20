/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/prisma"

export async function PUT(request: Request) {
  const { operatorId } = await request.json()
  
  try {
    await prisma.notification.updateMany({
      where: { 
        recipientId: operatorId,
        viewed: false 
      },
      data: { viewed: true }
    })
    return new Response('OK')
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
} 