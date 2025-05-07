import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  console.log(id);
  const operator = await prisma.operator.findUnique({
    where: {
      id: id,
    },
    select: {
      processes: {
        select: {
          client: true,
        },
      },
    },
  });
  console.log(operator);

  return NextResponse.json(operator);
}
