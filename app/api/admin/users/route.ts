import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

const ROLES_VALIDES = [
  "MACHINISTE",
  "MAINTENANCIER",
  "CHEF_EQUIPE",
  "RESPONSABLE_PRODUCTION",
  "RESPONSABLE_MAINTENANCE",
  "DIRECTEUR_TECHNIQUE",
  "ADMIN",
];

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const role = req.nextUrl.searchParams.get("role");
    const users = await prisma.user.findMany({
      where: role ? { role } : {},
      select: { id: true, username: true, name: true, role: true, actif: true },
      orderBy: { name: "asc" },
    });
    return NextResponse.json(users);
  } catch (err) {
    console.error("Erreur liste utilisateurs :", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la récupération des utilisateurs" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    let body: { username?: string; name?: string; role?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Corps de requête invalide" }, { status: 400 });
    }

    const username = body.username?.trim();
    const name = body.name?.trim();
    const role = body.role?.trim();
    const password = body.password;

    if (!username || !name || !role || !password) {
      return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
    }

    if (!ROLES_VALIDES.includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return NextResponse.json({ error: "Cet identifiant existe déjà" }, { status: 409 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, name, role, passwordHash: hashedPassword },
      select: { id: true, username: true, name: true, role: true, actif: true },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (err) {
    console.error("Erreur création utilisateur :", err);
    return NextResponse.json(
      { error: "Erreur serveur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}