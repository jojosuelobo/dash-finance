import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Contribution } from "@/types/contribution";

function toContribution(row: Awaited<ReturnType<typeof prisma.contribution.findFirst>>): Contribution {
  if (!row) throw new Error("row is null");
  return {
    id: row.id,
    date: row.date,
    value: row.value,
    kind: row.kind,
    type: row.type,
    subtype: row.subtype ?? undefined,
    quantidade: row.quantidade ?? undefined,
    cotacao: row.cotacao ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rows = await prisma.contribution.findMany({
    where: { userId: session.userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(rows.map(toContribution));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data: Omit<Contribution, "id" | "createdAt"> = await request.json();

  const row = await prisma.contribution.create({
    data: {
      userId: session.userId,
      date: data.date,
      value: data.value,
      kind: data.kind,
      type: data.type,
      subtype: data.subtype ?? null,
      quantidade: data.quantidade ?? null,
      cotacao: data.cotacao ?? null,
    },
  });

  return NextResponse.json(toContribution(row), { status: 201 });
}
