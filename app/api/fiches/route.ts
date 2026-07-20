import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMIN) {
    return NextResponse.json({ error: "Réservé à l'administrateur" }, { status: 403 });
  }

  const body = await req.json();
  const { templateId, numeroOT, zone, centreCharge, datePrevue, dateFinPrevue } = body;

  if (!templateId || !numeroOT || !zone || !centreCharge || !datePrevue || !dateFinPrevue) {
    return NextResponse.json({ error: "Champs manquants" }, { status: 400 });
  }

  try {
    const fiche = await prisma.ficheInstance.create({
      data: {
        templateId,
        numeroOT,
        zone,
        centreCharge,
        superviseur: "", // renseigné plus tard par le machiniste à la transmission
        datePrevue: new Date(datePrevue),
        dateFinPrevue: new Date(dateFinPrevue),
        status: "MACHINISTE",
      },
    });
    return NextResponse.json(fiche, { status: 201 });
  } catch (e: any) {
    if (e.code === "P2002") {
      return NextResponse.json({ error: "Ce numéro d'OT existe déjà" }, { status: 409 });
    }
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}