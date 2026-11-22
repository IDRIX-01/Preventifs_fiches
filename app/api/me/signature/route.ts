import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // adaptez le chemin
import { prisma } from "@/lib/prisma";    // adaptez le chemin

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { signatureImage: true },
  });

  return NextResponse.json(
    { signature: user?.signatureImage ?? null },
    { headers: { "Cache-Control": "no-store" } }
  );
}