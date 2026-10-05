import { prisma } from "@/lib/prisma";

// Ordre du workflow (le statut ARCHIVE est l'état final)
const WORKFLOW = [
  "MACHINISTE",
  "CHEF_EQUIPE",
  "RESPONSABLE_PRODUCTION",
  "RESPONSABLE_MAINTENANCE",
  "DIRECTEUR_TECHNIQUE",
] as const;

async function main() {
  const dryRun = process.argv.includes("--dry");

  // Un utilisateur par rôle, pour attribuer les signatures
  const users = await prisma.user.findMany();
  const userParRole = new Map<string, string>();
  for (const u of users) {
    if (!userParRole.has(u.role)) userParRole.set(u.role, u.id);
  }

  const fiches = await prisma.ficheInstance.findMany({
    where: { status: { not: "ARCHIVE" } },
    include: { signatures: true }, // ADAPTER : nom de la relation
  });

  console.log(`${fiches.length} fiche(s) à signer et archiver.`);

  let nbSignatures = 0;

  for (const fiche of fiches) {
    // Rôles ayant déjà signé
    const dejaSignes = new Set(fiche.signatures.map((s) => s.role)); // ADAPTER : champ "role"

    for (const role of WORKFLOW) {
      if (dejaSignes.has(role)) continue;

      const userId = userParRole.get(role);
      if (!userId) {
        console.warn(`Aucun utilisateur ${role}, signature ignorée (fiche ${fiche.id}).`);
        continue;
      }

      if (!dryRun) {
        await prisma.ficheSignature.create({
          data: {
            ficheId: fiche.id, // ADAPTER : nom de la clé étrangère
            userId,            // ADAPTER
            role,              // ADAPTER
            // signedAt: new Date(), // ADAPTER : si le champ n'a pas de default(now())
          },
        });
      }
      nbSignatures++;
    }

    if (!dryRun) {
      await prisma.ficheInstance.update({
        where: { id: fiche.id },
        data: { status: "ARCHIVE" },
      });
    }
  }

  console.log(
    `${dryRun ? "[SIMULATION] " : ""}${nbSignatures} signature(s) créée(s), ${fiches.length} fiche(s) archivée(s).`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());