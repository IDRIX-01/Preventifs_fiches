import { prisma } from "@/lib/prisma";

async function main() {
  const systemesExclus = ["BETAPAK2", "BETAPAK3", "BETAPAK4", "BETAPAK5", "BETAPAK6"];

  const result = await prisma.ficheTemplate.updateMany({
    where: { systeme: { in: systemesExclus } },
    data: { actif: false },
  });

  console.log(`${result.count} template(s) désactivé(s).`);
}

main().finally(() => prisma.$disconnect());