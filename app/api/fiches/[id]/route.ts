import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";

const WORKFLOW: string[] = [
  "MACHINISTE",
  "CHEF_EQUIPE",
  "RESPONSABLE_PRODUCTION",
  "RESPONSABLE_MAINTENANCE",
  "DIRECTEUR_TECHNIQUE",
  "ARCHIVE",
];

const SINGLE_PERSON_ROLES = ["RESPONSABLE_PRODUCTION", "RESPONSABLE_MAINTENANCE", "DIRECTEUR_TECHNIQUE"];


function normalizeRoleForWorkflow(role: Role): Role {
  return role === Role.MAINTENANCIER ? Role.MACHINISTE : role;
}


function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}


function isDesignatedChefEquipe(fiche: { superviseur: string | null; superviseurUsername?: string | null }, sessionUser: any): boolean {
  const ficheUsername = fiche.superviseurUsername;
  const userUsername = sessionUser?.username as string | undefined;

  if (ficheUsername && userUsername) {
    return ficheUsername === userUsername;
  }

  return normalizeName(fiche.superviseur) === normalizeName(sessionUser?.name);
}


const ROLES_AVEC_DROIT_MODIFICATION: Role[] = [
  Role.CHEF_EQUIPE,
  Role.RESPONSABLE_PRODUCTION,
  Role.RESPONSABLE_MAINTENANCE,
];


async function isReservedForMaintenancier(templateId: string): Promise<boolean> {
  const maintenancierAvecAcces = await prisma.user.findFirst({
    where: {
      role: Role.MAINTENANCIER,
      assignedTemplates: { some: { id: templateId } },
    },
    select: { id: true },
  });
  return !!maintenancierAvecAcces;
}

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role as Role;
  const userId = (session.user as any).id as string;

  const fiche = await prisma.ficheInstance.findUnique({
    where: { id: params.id },
    include: { template: true, signatures: { include: { user: true } } },
  });
  if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });


  if (role === Role.MACHINISTE || role === Role.MAINTENANCIER) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { assignedTemplates: true },
    });

    const hasRestriction = user?.assignedTemplates && user.assignedTemplates.length > 0;
    const isAssigned = user?.assignedTemplates.some((t) => t.id === fiche.templateId);

    if (hasRestriction && !isAssigned) {
      return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
    }
  }


  if (role === Role.MACHINISTE && (await isReservedForMaintenancier(fiche.templateId))) {
    return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
  }

  let responsableName: string | null = null;
  if (fiche.status === "CHEF_EQUIPE") {
    responsableName = fiche.superviseur || null;
  } else if (SINGLE_PERSON_ROLES.includes(fiche.status)) {
    const u = await prisma.user.findFirst({ where: { role: fiche.status } });
    responsableName = u?.name ?? null;
  }

  return NextResponse.json({
    ...fiche,
    responsableName,
    template: {
      ...fiche.template,
      epi: JSON.parse(fiche.template.epi),
      consignesA: JSON.parse(fiche.template.consignesA),
      consignesNe: JSON.parse(fiche.template.consignesNe),
      actions: JSON.parse(fiche.template.actions),
      ressources: JSON.parse(fiche.template.ressources),
    },
    actionsCochees: fiche.actionsCochees ? JSON.parse(fiche.actionsCochees) : {},
  });
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const role = (session.user as any).role as Role;
  const effectiveRole = normalizeRoleForWorkflow(role);
  const userId = (session.user as any).id as string;
  const userName = session.user?.name as string;
  const body = await req.json();

  const fiche = await prisma.ficheInstance.findUnique({ where: { id: params.id } });
  if (!fiche) return NextResponse.json({ error: "Fiche introuvable" }, { status: 404 });


  if (fiche.status !== effectiveRole) {
    return NextResponse.json({ error: "Ce n'est pas votre tour" }, { status: 403 });
  }


  if (role === Role.MACHINISTE || role === Role.MAINTENANCIER) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { assignedTemplates: true },
    });

    const hasRestriction = user?.assignedTemplates && user.assignedTemplates.length > 0;
    const isAssigned = user?.assignedTemplates.some((t) => t.id === fiche.templateId);

    if (hasRestriction && !isAssigned) {
      return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
    }
  }


  if (role === Role.MACHINISTE && (await isReservedForMaintenancier(fiche.templateId))) {
    return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
  }


  if (role === Role.CHEF_EQUIPE && !isDesignatedChefEquipe(fiche, session.user)) {
    return NextResponse.json({ error: "Cette fiche est assignée à un autre chef d'équipe" }, { status: 403 });
  }

  const currentIndex = WORKFLOW.indexOf(fiche.status);
  const nextStatus = WORKFLOW[currentIndex + 1];

  if (body.action === "transmettre" && effectiveRole === Role.MACHINISTE) {
    const updated = await prisma.ficheInstance.update({
      where: { id: params.id },
      data: {
        machinisteNom: body.machinisteNom,
        dateEntretien: body.dateEntretien ? new Date(body.dateEntretien) : null,
        heureDebut: body.heureDebut,
        heureFin: body.heureFin,
        observation: body.observation,
        actionsCochees: JSON.stringify(body.actionsCochees ?? {}),
        superviseur: body.superviseur,

        superviseurUsername: body.superviseurUsername ?? null,
        status: nextStatus,
      },
    });
    return NextResponse.json(updated);
  }


  if (body.action === "modifier" && ROLES_AVEC_DROIT_MODIFICATION.includes(role)) {
    const updated = await prisma.ficheInstance.update({
      where: { id: params.id },
      data: {
        machinisteNom: body.machinisteNom,
        dateEntretien: body.dateEntretien ? new Date(body.dateEntretien) : null,
        heureDebut: body.heureDebut,
        heureFin: body.heureFin,
        observation: body.observation,
        actionsCochees: JSON.stringify(body.actionsCochees ?? {}),
      },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "signer") {
    await prisma.ficheSignature.upsert({
      where: { ficheId_role: { ficheId: params.id, role } },
      update: {},
      create: { ficheId: params.id, userId, role, signatureData: body.signatureData },
    });

    const data: any = { status: nextStatus };
    if (role === Role.CHEF_EQUIPE) data.chefEquipeNom = userName;

    const updated = await prisma.ficheInstance.update({ where: { id: params.id }, data });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
}