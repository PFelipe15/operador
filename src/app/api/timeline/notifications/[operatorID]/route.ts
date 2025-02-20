import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: { operatorID: string } }) {
  const { operatorID } = params

  const notifications = await prisma.notification.findMany({
    where: { recipientId: operatorID, AND: { viewed: false } },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(notifications)
}
