import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canPrint } from "@/lib/workflow";
import { Role } from "@/lib/enums";
import { parseFicheInstance } from "@/lib/json-fields";

// Seul l'ADMIN peut appeler cette route. Double vérification :
// 1) le middleware ne protège pas /api/* par défaut, donc on revérifie ici.
// 2) canPrint() centralise la règle pour rester cohérent avec le reste de l'app.
export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const role = (session.user as any).role as Role;
  if (!canPrint(role)) {
    return NextResponse.json(
      { error: "Seul l'administrateur peut imprimer ou exporter une fiche." },
      { status: 403 }
    );
  }

  const fiche = await prisma.ficheInstance.findUnique({
    where: { id: params.id },
    include: { template: true, signatures: { include: { user: true } } },
  });
  if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });

  // NOTE POUR LA SUITE : brancher ici @react-pdf/renderer pour générer un PDF
  // reprenant exactement la mise en page de FicheView.tsx (mêmes sections,
  // même ordre : en-tête, EPI, consignes, actions, signatures).
  // Pour l'instant, renvoie les données prêtes à être formatées.
  return NextResponse.json({ readyForPdf: true, fiche: parseFicheInstance(fiche) });
}
