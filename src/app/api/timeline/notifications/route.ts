import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET() {
 
  const notifications = await prisma.notification.findMany()
    

   return NextResponse.json(notifications)
} 
