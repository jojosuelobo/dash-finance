import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const categories = await prisma.creditCardCategory.findMany({
    where: { userId: session.userId },
    include: { subcategories: true },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session.userId) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { name } = await request.json();
  if (!name?.trim()) return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });

  const category = await prisma.creditCardCategory.create({
    data: { userId: session.userId, name: name.trim() },
    include: { subcategories: true },
  });

  return NextResponse.json(category, { status: 201 });
}
