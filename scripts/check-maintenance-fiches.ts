/**
 * Liste les fiches (FicheInstance) existantes pour les templates réservés
 * aux maintenanciers (chillers, convoyeurs), avec leur id — pratique pour
 * tester le blocage d'accès des machinistes sur ces fiches.
 *
 * Un template est considéré "réservé maintenance" s'il est assigné à au
 * moins un utilisateur MAINTENANCIER (même logique que
 * isReservedForMaintenancier dans app/api/fiches/[id]/route.ts).
 *
 * Usage :
 *   npx tsx scripts/check-maintenance-fiches.ts
 * ou, si le projet utilise ts-node (comme prisma/seed.ts) :
 *   npx ts-node scripts/check-maintenance-fiches.ts
 */

import { PrismaClient } from "@prisma/client";
import { Role } from "../lib/enums";

const prisma = new PrismaClient();

async function main() {
  // Tous les templates assignés à au moins un maintenancier.
  const templatesReserves = await prisma.ficheTemplate.findMany({
    where: {
      assignedUsers: {
        some: { role: Role.MAINTENANCIER },
      },
    },
    select: { id: true, ref: true, titre: true, equipement: true, systeme: true },
  });

  if (templatesReserves.length === 0) {
    console.log("Aucun template n'est actuellement assigné à un maintenancier.");
    return;
  }

  console.log(`${templatesReserves.length} template(s) réservé(s) maintenance trouvé(s) :\n`);

  for (const t of templatesReserves) {
    const fiches = await prisma.ficheInstance.findMany({
      where: { templateId: t.id },
      select: { id: true, status: true, numeroOT: true },
      orderBy: { id: "desc" },
      take: 5,
    });

    console.log(`— ${t.ref} | ${t.equipement} (${t.systeme}) — ${t.titre}`);
    if (fiches.length === 0) {
      console.log("    Aucune fiche (FicheInstance) créée pour ce template pour l'instant.");
    } else {
      fiches.forEach((f) =>
        console.log(`    id=${f.id}  status=${f.status}  N°OT=${f.numeroOT ?? "—"}`)
      );
    }
    console.log("");
  }

  console.log("Copie un id ci-dessus dans l'URL /fiche/<id> en te connectant avec un compte MACHINISTE pour tester le blocage.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());