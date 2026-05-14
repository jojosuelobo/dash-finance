import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: categoryId } = await params;
  const { name } = await request.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "Nome é obrigatório" }, { status: 400 });
  }

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== session.userId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  const subcategory = await prisma.subcategory.create({
    data: { categoryId, name: name.trim() },
  });

  return NextResponse.json(subcategory, { status: 201 });
}
