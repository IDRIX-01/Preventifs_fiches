import { prisma } from "@/lib/prisma";

async function main() {
  const template = await prisma.ficheTemplate.findUnique({ where: { ref: "MTC.EN:032" } });
  if (!template) {
    console.log("Aucun template MTC.EN:032 trouvé.");
    return;
  }

  const deletedSignatures = await prisma.ficheSignature.deleteMany({
    where: { fiche: { templateId: template.id } },
  });
  console.log(`${deletedSignatures.count} signature(s) supprimée(s).`);

  const deletedFiches = await prisma.ficheInstance.deleteMany({
    where: { templateId: template.id },
  });
  console.log(`${deletedFiches.count} fiche(s) supprimée(s).`);

  await prisma.ficheTemplate.delete({ where: { id: template.id } });
  console.log("Template MTC.EN:032 supprimé.");
}

main().finally(() => prisma.$disconnect());