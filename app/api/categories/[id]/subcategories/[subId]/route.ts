import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; subId: string }> }
) {
  const session = await getSession();
  if (!session.userId) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { id: categoryId, subId } = await params;

  const category = await prisma.category.findUnique({ where: { id: categoryId } });
  if (!category || category.userId !== session.userId) {
    return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  }

  await prisma.subcategory.delete({ where: { id: subId, categoryId } });

  return NextResponse.json({ ok: true });
}
