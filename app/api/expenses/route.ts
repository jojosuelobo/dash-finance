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

export async function GET() {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const rows = await prisma.expense.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(toExpense));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const data: Omit<Expense, "id" | "createdAt"> = await request.json();

  const row = await prisma.expense.create({
    data: {
      userId: session.userId,
      name: data.name,
      value: data.value,
      type: data.type === "one-time" ? "one_time" : "fixed",
      fixedMode: data.fixedMode ?? null,
      installments: data.installments ?? null,
      dueDate: data.dueDate ?? null,
      endDate: data.endDate ?? null,
      excludedMonths: data.excludedMonths ?? [],
      paidMonths: data.paidMonths ?? [],
      kind: data.kind ?? "expense",
      categoryId: data.categoryId ?? null,
      subcategoryId: data.subcategoryId ?? null,
      notes: data.notes ?? null,
      attachments: (data.attachments ?? []) as unknown as Parameters<typeof prisma.expense.create>[0]["data"]["attachments"],
    },
  });

  return NextResponse.json(toExpense(row), { status: 201 });
}
