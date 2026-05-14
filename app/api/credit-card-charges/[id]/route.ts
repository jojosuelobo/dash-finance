import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CreditCardCharge } from "@/types/creditCard";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { id } = await params;
  const data: Partial<Omit<CreditCardCharge, "id" | "createdAt">> = await request.json();

  const row = await prisma.creditCardCharge.update({
    where: { id, userId: session.userId },
    data: {
      ...(data.cardId !== undefined && { cardId: data.cardId }),
      ...(data.name !== undefined && { name: data.name }),
      ...(data.value !== undefined && { value: data.value }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.installments !== undefined && { installments: data.installments ?? null }),
      ...(data.currentInstallment !== undefined && { currentInstallment: data.currentInstallment ?? null }),
      ...(data.startDate !== undefined && { startDate: data.startDate }),
      ...(data.endDate !== undefined && { endDate: data.endDate ?? null }),
      ...(data.categoryId !== undefined && { categoryId: data.categoryId ?? null }),
      ...(data.subcategoryId !== undefined && { subcategoryId: data.subcategoryId ?? null }),
      ...(data.notes !== undefined && { notes: data.notes ?? null }),
      ...(data.active !== undefined && { active: data.active }),
    },
  });

  return NextResponse.json({
    id: row.id, cardId: row.cardId, name: row.name, value: row.value,
    type: row.type, installments: row.installments ?? undefined,
    currentInstallment: row.currentInstallment ?? undefined,
    startDate: row.startDate, endDate: row.endDate ?? undefined,
    categoryId: row.categoryId ?? undefined, subcategoryId: row.subcategoryId ?? undefined,
    notes: row.notes ?? undefined, active: row.active,
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
  await prisma.creditCardCharge.delete({ where: { id, userId: session.userId } });
  return NextResponse.json({ ok: true });
}
