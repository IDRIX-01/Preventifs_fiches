import { prisma } from "@/lib/prisma";

async function main() {
  const systemesExclus = ["BETAPAK2", "BETAPAK3", "BETAPAK4", "BETAPAK5", "BETAPAK6"];

  const fiches = await prisma.ficheInstance.findMany({
    where: { template: { systeme: { in: systemesExclus } } },
    select: { id: true },
  });
  const ficheIds = fiches.map((f) => f.id);

  const deletedSignatures = await prisma.ficheSignature.deleteMany({
    where: { ficheId: { in: ficheIds } },
  });
  console.log(`${deletedSignatures.count} signature(s) supprimée(s).`);

  const deletedFiches = await prisma.ficheInstance.deleteMany({
    where: { id: { in: ficheIds } },
  });
  console.log(`${deletedFiches.count} fiche(s) supprimée(s).`);
}

main().finally(() => prisma.$disconnect());