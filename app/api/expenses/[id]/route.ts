import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { Expense } from "@/types/expense";

function toExpense(row: Awaited<ReturnType<typeof prisma.expense.findFirst>>): Expense {
  if (!row) throw new Error("row is null");
  return {
    id: row.id,
    name: row.name,
    value: row.value,
    type: row.type === "one_time" ? "one-time" : "fixed",
    fixedMode: row.fixedMode ?? undefined,
    installments: row.installments ?? undefined,
    dueDate: row.dueDate ?? undefined,
    endDate: row.endDate ?? undefined,
    excludedMonths: row.excludedMonths,
    paidMonths: row.paidMonths,
    kind: row.kind,
    categoryId: row.categoryId ?? undefined,
    subcategoryId: row.subcategoryId ?? undefined,
    notes: row.notes ?? undefined,
    attachments: (row.attachments as unknown as Expense["attachments"]) ?? [],
    createdAt: row.createdAt.toISOString(),
  };
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;
  const updates: Partial<Expense> = await request.json();

  const updateData: Record<string, unknown> = {};
  if (updates.name !== undefined) updateData.name = updates.name;
  if (updates.value !== undefined) updateData.value = updates.value;
  if (updates.type !== undefined) updateData.type = updates.type === "one-time" ? "one_time" : "fixed";
  if (updates.fixedMode !== undefined) updateData.fixedMode = updates.fixedMode ?? null;
  if (updates.installments !== undefined) updateData.installments = updates.installments ?? null;
  if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate ?? null;
  if (updates.endDate !== undefined) updateData.endDate = updates.endDate ?? null;
  if (updates.excludedMonths !== undefined) updateData.excludedMonths = updates.excludedMonths ?? [];
  if (updates.paidMonths !== undefined) updateData.paidMonths = updates.paidMonths ?? [];
  if (updates.kind !== undefined) updateData.kind = updates.kind ?? "expense";
  if (updates.categoryId !== undefined) updateData.categoryId = updates.categoryId ?? null;
  if (updates.subcategoryId !== undefined) updateData.subcategoryId = updates.subcategoryId ?? null;
  if (updates.notes !== undefined) updateData.notes = updates.notes ?? null;
  if (updates.attachments !== undefined) updateData.attachments = updates.attachments ?? [];

  const row = await prisma.expense.update({
    where: { id, userId: session.userId },
    data: updateData,
  });

  return NextResponse.json(toExpense(row));
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id } = await params;

  await prisma.expense.delete({ where: { id, userId: session.userId } });

  return NextResponse.json({ ok: true });
}
