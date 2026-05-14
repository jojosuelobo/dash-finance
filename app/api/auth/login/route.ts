import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: Request) {
  const { username, password } = await request.json();

  const normalized = username?.toLowerCase().trim();
  if (!normalized || !password) {
    return NextResponse.json({ error: "invalid-credentials" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { username: normalized } });
  if (!user) {
    return NextResponse.json({ error: "invalid-credentials" }, { status: 401 });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "invalid-credentials" }, { status: 401 });
  }

  const session = await getSession();
  session.userId = user.id;
  session.username = user.username;
  await session.save();

  return NextResponse.json({ userId: user.id, username: user.username });
}
