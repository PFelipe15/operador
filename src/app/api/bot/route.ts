import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"


export async function GET() {
    const bot = await prisma.botWhatsapp.findUnique({
      where: { id: "singleton" },
    })
    return NextResponse.json(bot)
  }
  
  

export  async function POST() {
   await prisma.botWhatsapp.create({
    data: {
        id: "singleton",
        qrcode: "não gerado",
        hasConnected: false,
        status: "NOT_CREATED",
        lastConnection: null,
        phoneNumber: null,
        batteryLevel: null,
        isOnline: false,
        errorMessage: null,
    }
   })
  return NextResponse.json({ message: 'bot gerado com sucesso' }, { status: 201 })
}


export async function PUT(request: NextRequest) {
  const { qrcode } = await request.json()
  await prisma.botWhatsapp.update({
    where: { id: "singleton" },
    data: { qrcode: qrcode, status:"AGUARDANDO_CONEXAO" },
  })
  return NextResponse.json({ message: 'QrCode do Bot foi Atualizado com sucesso' }, { status: 200 })
}

 