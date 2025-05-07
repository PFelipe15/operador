 import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;

  const notifications = await prisma.notification.findMany({
    where: {
      recipientId: id,
      status: "PENDING",
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(notifications);
}
