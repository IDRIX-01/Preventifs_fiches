import { prisma } from "@/lib/prisma";
import { generateWeeklyFiches } from "@/lib/generateFiches";

async function main() {
  const deletedSignatures = await prisma.ficheSignature.deleteMany({});
  console.log(`${deletedSignatures.count} signature(s) supprimée(s).`);

  const deleted = await prisma.ficheInstance.deleteMany({});
  console.log(`${deleted.count} fiche(s) supprimée(s).`);

  const created = await generateWeeklyFiches();
  console.log(`${created} fiche(s) régénérée(s).`);
}

main().finally(() => prisma.$disconnect());