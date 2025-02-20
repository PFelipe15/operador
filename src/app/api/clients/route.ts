import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
    const client = await prisma.client.findMany(
        {
            include:{
                _count:{
                    select:{
                        processes:true
                    }
                },
                processes: true
            }
        }
    )
    return NextResponse.json(client)
}

export async function POST(request: Request) {
    const clientData = await request.json()
    
    // Remover birthDate se estiver vazio ou undefined
    if (!clientData.birthDate) {
        delete clientData.birthDate
    }
    
    // Se houver data, garantir formato ISO
    if (clientData.birthDate) {
        try {
            const date = new Date(clientData.birthDate)
            clientData.birthDate = date.toISOString()
        } catch (error) {
            console.error(error)
            delete clientData.birthDate // Se a data for inválida, remover o campo
        }
    }

    
    const existingClient = await prisma.client.findFirst({
        where: { phone: clientData.phone }
    })

    if (existingClient) {
        return NextResponse.json({ error: "Cliente já existe", client: existingClient }, { status: 400 })
    }

    const client = await prisma.client.create({
        data: {
            ...clientData,
            address: clientData.address ? {
                create: clientData.address
            } : undefined
        }
    })
    
    return NextResponse.json(client)
}


