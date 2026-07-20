import { prisma } from "./prisma";

export async function generateWeeklyFiches() {
  const templates = await prisma.ficheTemplate.findMany({ where: { actif: true } });

  const today = new Date();
  const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");

  const dateFinPrevue = new Date(today);
  dateFinPrevue.setDate(dateFinPrevue.getDate() + 7);

  let created = 0;
  for (const t of templates) {
    const numeroOT = `OT-${t.ref.replace(/[.:]/g, "")}-${dateStr}`;

    const exists = await prisma.ficheInstance.findUnique({ where: { numeroOT } });
    if (exists) continue; // évite les doublons si le job tourne deux fois

    await prisma.ficheInstance.create({
      data: {
        templateId: t.id,
        numeroOT,
        zone: t.systeme,
        centreCharge: t.equipement,
        superviseur: "", // renseigné plus tard par le machiniste
        datePrevue: today,
        dateFinPrevue,
        status: "MACHINISTE",
      },
    });
    created++;
  }

  console.log(`[generateWeeklyFiches] ${created} fiche(s) créée(s) sur ${templates.length} modèle(s).`);
  return created;
}