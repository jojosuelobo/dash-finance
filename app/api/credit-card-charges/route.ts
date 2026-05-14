import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";
import type { CreditCardCharge } from "@/types/creditCard";

function toCharge(row: {
  id: string; cardId: string; name: string; value: number;
  type: string; installments: number | null; currentInstallment: number | null;
  startDate: string; endDate: string | null; categoryId: string | null;
  subcategoryId: string | null; notes: string | null; active: boolean; createdAt: Date;
}): CreditCardCharge {
  return {
    id: row.id,
    cardId: row.cardId,
    name: row.name,
    value: row.value,
    type: row.type as CreditCardCharge["type"],
    installments: row.installments ?? undefined,
    currentInstallment: row.currentInstallment ?? undefined,
    startDate: row.startDate,
    endDate: row.endDate ?? undefined,
    categoryId: row.categoryId ?? undefined,
    subcategoryId: row.subcategoryId ?? undefined,
    notes: row.notes ?? undefined,
    active: row.active,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const rows = await prisma.creditCardCharge.findMany({
    where: { userId: session.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(rows.map(toCharge));
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const data: Omit<CreditCardCharge, "id" | "createdAt"> = await request.json();

  const card = await prisma.creditCard.findFirst({
    where: { id: data.cardId, userId: session.userId },
  });
  if (!card) return NextResponse.json({ error: "Cartão não encontrado" }, { status: 404 });

  const row = await prisma.creditCardCharge.create({
    data: {
      userId: session.userId,
      cardId: data.cardId,
      name: data.name,
      value: data.value,
      type: data.type,
      installments: data.installments ?? null,
      currentInstallment: data.currentInstallment ?? null,
      startDate: data.startDate,
      endDate: data.endDate ?? null,
      categoryId: data.categoryId ?? null,
      subcategoryId: data.subcategoryId ?? null,
      notes: data.notes ?? null,
      active: data.active ?? true,
    },
  });

  return NextResponse.json(toCharge(row), { status: 201 });
}
