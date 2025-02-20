import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, { params }: { params: { remoteJid: string } }) {
    const { remoteJid } = params

    console.log(remoteJid)
    const existingClient = await prisma.client.findFirst({
        where: { phone: remoteJid },
        include: {
            processes: {
                where: {
                    status: {
                        in: ['PENDING_DATA', 'PENDING_COMPANY', 'PENDING_DOCS', 'CREATED']
                    }
                }
            }
        }
    });
    if (!existingClient) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 })
    }
    return NextResponse.json(existingClient)
}