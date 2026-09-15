import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // adaptez le chemin si besoin
import bcrypt from "bcryptjs";

export async function PATCH(req: Request) {
  const { username, currentPassword, newPassword } = await req.json();

  if (!username || !currentPassword || !newPassword || newPassword.length < 4) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 4 caractères" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 400 });
  }

  const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isValid) {
    return NextResponse.json({ error: "Identifiant ou mot de passe incorrect" }, { status: 400 });
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  });

  return NextResponse.json({ success: true });
}