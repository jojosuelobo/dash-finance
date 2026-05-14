import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CreditCard } from "@/types/creditCard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const data: Partial<Omit<CreditCard, "id" | "createdAt">> = await request.json();

  const row = await prisma.creditCard.update({
    where: { id, userId: session.userId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.bank !== undefined && { bank: data.bank }),
      ...(data.closingDay !== undefined && { closingDay: data.closingDay ?? null }),
      ...(data.dueDay !== undefined && { dueDay: data.dueDay ?? null }),
      ...(data.color !== undefined && { color: data.color ?? null }),
    },
  });

  return NextResponse.json({
    id: row.id,
    name: row.name,
    bank: row.bank,
    closingDay: row.closingDay ?? undefined,
    dueDay: row.dueDay ?? undefined,
    color: row.color ?? undefined,
    createdAt: row.createdAt.toISOString(),
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  await prisma.creditCard.delete({ where: { id, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
