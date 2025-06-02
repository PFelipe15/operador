import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const operatorId = searchParams.get("operatorId");
    const role = searchParams.get("role");

    let clients;

    if (role === "ADMIN") {
      // Admin vê todos os clientes
      clients = await prisma.client.findMany({
        include: {
          _count: {
            select: {
              processes: true,
            },
          },
          processes: {
            include: {
              operator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    } else {
      // Operador vê apenas clientes dos processos atribuídos a ele
      clients = await prisma.client.findMany({
        where: {
          processes: {
            some: {
              operatorId: operatorId,
            },
          },
        },
        include: {
          _count: {
            select: {
              processes: true,
            },
          },
          processes: {
            where: {
              operatorId: operatorId,
            },
            include: {
              operator: {
                select: {
                  id: true,
                  name: true,
                },
              },
            },
          },
          address: true,
        },
        orderBy: {
          createdAt: "desc",
        },
      });
    }

    return NextResponse.json(clients);
  } catch (error) {
    console.error("Erro ao buscar clientes:", error);
    return NextResponse.json(
      { error: "Erro ao carregar clientes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const clientData = await request.json();

    // Remover birthDate se estiver vazio ou undefined
    if (!clientData.birthDate) {
      delete clientData.birthDate;
    }

    // Se houver data, garantir formato ISO
    if (clientData.birthDate) {
      try {
        const date = new Date(clientData.birthDate);
        clientData.birthDate = date.toISOString();
      } catch (error) {
        console.error(error);
        delete clientData.birthDate; // Se a data for inválida, remover o campo
      }
    }

    const existingClient = await prisma.client.findFirst({
      where: { phone: clientData.phone },
    });

    if (existingClient) {
      return NextResponse.json(
        { error: "Cliente já existe", client: existingClient },
        { status: 400 }
      );
    }

    const client = await prisma.client.create({
      data: {
        ...clientData,
        address: clientData.address
          ? {
              create: clientData.address,
            }
          : undefined,
      },
    });

    return NextResponse.json(client);
  } catch (error) {
    console.error("Erro ao criar cliente:", error);
    return NextResponse.json(
      { error: "Erro ao criar cliente" },
      { status: 500 }
    );
  }
}
