import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;
  const { actif } = await req.json();

  if (typeof actif !== "boolean") {
    return NextResponse.json({ error: "Paramètre 'actif' invalide" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { actif },
    select: { id: true, username: true, name: true, role: true, actif: true },
  });

  return NextResponse.json(user);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { id } = await params;

  if (session.user.id === id) {
    return NextResponse.json(
      { error: "Impossible de supprimer votre propre compte" },
      { status: 400 }
    );
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch {
    // Cas fréquent : l'utilisateur est référencé ailleurs (signatures, fiches...)
    // → on désactive plutôt que de casser l'intégrité référentielle.
    return NextResponse.json(
      {
        error:
          "Suppression impossible (utilisateur référencé dans des fiches/signatures). Désactivez-le plutôt.",
      },
      { status: 409 }
    );
  }

  return NextResponse.json({ success: true });
}