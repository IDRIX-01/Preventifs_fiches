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

/**
 * Le MAINTENANCIER n'a pas d'étape dédiée dans le workflow : il agit
 * exactement comme un MACHINISTE à l'étape MACHINISTE (voir lib/workflow.ts,
 * normalizeRoleForWorkflow). On applique la même règle ici pour que les
 * comparaisons de statut/rôle dans cette route restent cohérentes.
 */
function normalizeRoleForWorkflow(role: Role): Role {
  return role === Role.MAINTENANCIER ? Role.MACHINISTE : role;
}

/**
 * Compare deux noms de façon tolérante (espaces multiples, espaces en
 * début/fin, casse, forme Unicode) — filet de sécurité pour les fiches
 * qui n'ont pas encore de `superviseurUsername` persisté (anciennes
 * fiches, ou avant migration complète du schéma).
 */
function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

/**
 * Détermine si l'utilisateur connecté est bien le chef d'équipe désigné
 * sur la fiche. Priorité à l'identifiant stable `superviseurUsername`
 * (persisté sur la fiche) comparé au `username` de la session ; à défaut
 * (fiche plus ancienne, ou session sans username), repli sur une
 * comparaison de nom tolérante.
 *
 * C'est cette vérification — auparavant une comparaison stricte de nom —
 * qui empêchait le chef d'équipe maintenance de modifier/signer les
 * fiches transmises par un maintenancier dès que son nom en session ne
 * matchait pas au caractère près le nom codé en dur côté front.
 */
function isDesignatedChefEquipe(fiche: { superviseur: string | null; superviseurUsername?: string | null }, sessionUser: any): boolean {
  const ficheUsername = fiche.superviseurUsername;
  const userUsername = sessionUser?.username as string | undefined;

  if (ficheUsername && userUsername) {
    return ficheUsername === userUsername;
  }

  return normalizeName(fiche.superviseur) === normalizeName(sessionUser?.name);
}

/**
 * Rôles autorisés à corriger les champs saisis par le machiniste
 * (actionsCochees, observation, heures, etc.) tant que la fiche est à
 * leur étape dans le workflow, sans faire avancer le statut.
 */
const ROLES_AVEC_DROIT_MODIFICATION: Role[] = [
  Role.CHEF_EQUIPE,
  Role.RESPONSABLE_PRODUCTION,
  Role.RESPONSABLE_MAINTENANCE,
];

/**
 * Un template est considéré réservé aux maintenanciers (chillers,
 * convoyeurs...) s'il est assigné à au moins un utilisateur MAINTENANCIER
 * (voir prisma/seed.ts : templatesMaintenanciers). On s'appuie directement
 * sur cette relation existante plutôt que sur un pattern de nom
 * (equipement contenant "CHIL"/"CONV"), qui serait fragile et pourrait se
 * désynchroniser silencieusement du seed — même type de bug que la
 * comparaison de nom du superviseur corrigée plus haut.
 *
 * Un machiniste ayant `assignedTemplates` vide a normalement accès à
 * "toutes les fiches" (voir seed), mais ce "toutes" ne doit jamais inclure
 * les fiches réservées maintenance : cette fonction comble ce trou.
 */
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

  // Un machiniste (ou un maintenancier, qui agit comme lui) ne peut voir que
  // la fiche de la machine qui lui est assignée.
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

  // Les fiches chillers/convoyeurs sont exclusivement réservées aux
  // maintenanciers, quelle que soit la liste `assignedTemplates` du
  // machiniste (même vide, ce qui signifie normalement "accès à toutes
  // les fiches" — mais pas à celles-ci).
  if (role === Role.MACHINISTE && (await isReservedForMaintenancier(fiche.templateId))) {
    return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
  }

  // Nom de la personne responsable de l'étape en cours (affiché dans "Statut actuel")
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

  // On compare le statut de la fiche au rôle "canonique" (le maintenancier
  // compte comme machiniste ici), sinon il est toujours rejeté à tort.
  if (fiche.status !== effectiveRole) {
    return NextResponse.json({ error: "Ce n'est pas votre tour" }, { status: 403 });
  }

  // Un machiniste (ou un maintenancier) ne peut modifier que la fiche de la
  // machine qui lui est assignée.
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

  // Les fiches chillers/convoyeurs sont exclusivement réservées aux
  // maintenanciers — un machiniste ne peut pas les transmettre, même si sa
  // propre liste `assignedTemplates` est vide (voir isReservedForMaintenancier).
  if (role === Role.MACHINISTE && (await isReservedForMaintenancier(fiche.templateId))) {
    return NextResponse.json({ error: "Cette fiche ne vous est pas assignée" }, { status: 403 });
  }

  // Un chef d'équipe ne peut agir que sur la fiche où il a été désigné par le
  // machiniste (ou par défaut pour le maintenancier). Comparaison par
  // identifiant stable (superviseurUsername), avec repli sur le nom
  // normalisé pour les fiches qui n'ont pas encore ce champ.
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
        // Identifiant stable du chef d'équipe désigné — permet de ne plus
        // dépendre d'une comparaison de nom fragile pour les droits de
        // modification/signature (voir isDesignatedChefEquipe ci-dessus).
        // Nécessite la colonne `superviseurUsername` sur FicheInstance
        // (voir schema.prisma).
        superviseurUsername: body.superviseurUsername ?? null,
        status: nextStatus,
      },
    });
    return NextResponse.json(updated);
  }

  // Le chef d'équipe et les responsables (production/maintenance) peuvent
  // corriger les actions/observations tant que la fiche est à leur étape,
  // sans faire avancer le statut (ils pourront ensuite "signer" normalement).
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