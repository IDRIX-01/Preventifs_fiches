import { prisma } from "@/lib/prisma";

const CONFIRM = process.argv.includes("--confirm");
const SEMAINE = process.argv.find((a) => a.startsWith("--semaine="))?.split("=")[1];
const MOTIF =
  process.argv.find((a) => a.startsWith("--motif="))?.split("=")[1] ??
  "Clôture administrative : fiche non renseignée, aucune intervention enregistrée";
const OT = process.argv.find((a) => a.startsWith("--ot="))?.split("=")[1];
async function main() {
  if (!SEMAINE) {
    console.error("Précise la semaine à clôturer, ex. --semaine=2026W42");
    process.exit(1);
  }
  console.log(CONFIRM ? "MODE ÉCRITURE" : "SIMULATION (ajouter --confirm pour écrire)");

  const fiches = await prisma.ficheInstance.findMany({
    where: {
    status: { not: "ARCHIVE" },
  ...(OT ? { numeroOT: { in: OT.split(",") } } : {}),
    },
    include: { signatures: true },
  });

  const cibles = fiches.filter(
    (f: any) => !f.machinisteNom && !f.dateEntretien && f.signatures.length === 0
  );
  const epargnees = fiches.length - cibles.length;

  console.log(`${fiches.length} fiche(s) non archivée(s) pour ${SEMAINE}`);
  console.log(`${cibles.length} à clôturer, ${epargnees} épargnée(s) (renseignées ou déjà signées)`);

  if (CONFIRM && cibles.length) {
    const res = await prisma.ficheInstance.updateMany({
      where: { id: { in: cibles.map((f: any) => f.id) } },
      data: {
        status: "ARCHIVE",
        clotureAdministrative: true,
        motifCloture: MOTIF,
        clotureLe: new Date(),
      },
    });
    console.log(`${res.count} fiche(s) clôturée(s) et archivée(s).`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());