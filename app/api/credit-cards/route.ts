import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CreditCard } from "@/types/creditCard";

function toCard(row: { id: string; name: string; bank: string; closingDay: number | null; dueDay: number | null; color: string | null; createdAt: Date }): CreditCard {
  return {
    id: row.id,
    name: row.name,
    bank: row.bank,
    closingDay: row.closingDay ?? undefined,
    dueDay: row.dueDay ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rows = await prisma.creditCard.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(rows.map(toCard));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const data: Omit<CreditCard, "id" | "createdAt"> = await request.json();
  if (!data.name?.trim() || !data.bank?.trim()) {
    return NextResponse.json({ error: "Nome e banco são obrigatórios" }, { status: 400 });
  }

  const row = await prisma.creditCard.create({
    data: {
      userId: session.userId,
      name: data.name.trim(),
      bank: data.bank.trim(),
      closingDay: data.closingDay ?? null,
      dueDay: data.dueDay ?? null,
      color: data.color ?? null,
    },
  });

  return NextResponse.json(toCard(row), { status: 201 });
}
