/* eslint-disable @typescript-eslint/no-unused-vars */
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.notification.delete({
      where: { id: params.id }
    })
    return new Response('OK')
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
} 

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.notification.update({
      where: { id: params.id },
      data: { viewed: true }
    })
    return new Response('OK')
  } catch (error) {
    return new Response('Error', { status: 500 })
  }
} 