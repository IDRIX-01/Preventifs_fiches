import { prisma } from "./prisma";

function getISOWeekKey(date: Date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}W${String(weekNo).padStart(2, "0")}`;
}

export async function generateWeeklyFiches() {
  const templates = await prisma.ficheTemplate.findMany({ where: { actif: true } });
  const today = new Date();
  const weekKey = getISOWeekKey(today);

  const dateFinPrevue = new Date(today);
  dateFinPrevue.setDate(dateFinPrevue.getDate() + 7);

  let created = 0;
  for (const t of templates) {
    const numeroOT = `OT-${t.ref.replace(/[.:]/g, "")}-${weekKey}`;

    const exists = await prisma.ficheInstance.findUnique({ where: { numeroOT } });
    if (exists) continue;

    await prisma.ficheInstance.create({
      data: {
        templateId: t.id,
        numeroOT,
        zone: t.systeme,
        centreCharge: t.equipement,
        superviseur: "",
        datePrevue: today,
        dateFinPrevue,
        status: "MACHINISTE",
      },
    });
    created++;
  }

  return created;
}