import { Role, FicheStatus } from "./enums";

/**
 * Ordre des étapes du workflow. Chaque étape correspond au rôle qui doit
 * agir pour faire avancer la fiche à l'étape suivante.
 *
 *   BROUILLON -> MACHINISTE -> CHEF_EQUIPE -> RESPONSABLE_PRODUCTION
 *   -> RESPONSABLE_MAINTENANCE -> DIRECTEUR_TECHNIQUE -> ARCHIVE
 *
 * ARCHIVE = la fiche revient à l'admin, elle est verrouillée (lecture seule
 * pour tout le monde sauf impression/export réservée à l'ADMIN).
 */
export const WORKFLOW_ORDER: FicheStatus[] = [
  FicheStatus.BROUILLON,
  FicheStatus.MACHINISTE,
  FicheStatus.CHEF_EQUIPE,
  FicheStatus.RESPONSABLE_PRODUCTION,
  FicheStatus.RESPONSABLE_MAINTENANCE,
  FicheStatus.DIRECTEUR_TECHNIQUE,
  FicheStatus.ARCHIVE,
];

// Le rôle requis pour FAIRE AVANCER la fiche depuis un statut donné.
// ex: pour faire passer une fiche de MACHINISTE à CHEF_EQUIPE, il faut être MACHINISTE.
export const ROLE_FOR_STATUS: Record<FicheStatus, Role | null> = {
  BROUILLON: Role.ADMIN, // l'admin crée la fiche (ou elle est auto-créée depuis un modèle)
  MACHINISTE: Role.MACHINISTE,
  CHEF_EQUIPE: Role.CHEF_EQUIPE,
  RESPONSABLE_PRODUCTION: Role.RESPONSABLE_PRODUCTION,
  RESPONSABLE_MAINTENANCE: Role.RESPONSABLE_MAINTENANCE,
  DIRECTEUR_TECHNIQUE: Role.DIRECTEUR_TECHNIQUE,
  ARCHIVE: null, // étape finale, personne ne "valide" depuis ARCHIVE
};

/**
 * Le MAINTENANCIER n'a pas d'étape dédiée dans le workflow : il agit
 * exactement comme un MACHINISTE à l'étape MACHINISTE (première étape),
 * mais uniquement sur les fiches qui lui sont assignées (chiller /
 * convoyeur — restriction vérifiée via `assignedTemplateIds` côté appelant,
 * pas ici). Cette fonction ramène son rôle au rôle "canonique" du workflow
 * pour toute la logique ci-dessous.
 */
function normalizeRoleForWorkflow(role: Role): Role {
  return role === Role.MAINTENANCIER ? Role.MACHINISTE : role;
}

export function nextStatus(current: FicheStatus): FicheStatus | null {
  const idx = WORKFLOW_ORDER.indexOf(current);
  if (idx === -1 || idx === WORKFLOW_ORDER.length - 1) return null;
  return WORKFLOW_ORDER[idx + 1];
}

/**
 * Un utilisateur peut MODIFIER les champs de son étape uniquement si :
 *  - la fiche est actuellement à ce statut (son tour est venu)
 *  - son rôle correspond au rôle attendu pour ce statut
 *    (le MAINTENANCIER compte comme MACHINISTE ici)
 *  - OU il est ADMIN (l'admin peut tout voir, mais ne "signe" pas à la place des autres)
 */
export function canEditStep(userRole: Role, ficheStatus: FicheStatus): boolean {
  const expected = ROLE_FOR_STATUS[ficheStatus];
  return expected !== null && normalizeRoleForWorkflow(userRole) === expected;
}

/**
 * Seul l'ADMIN peut imprimer / exporter en PDF, quel que soit le statut.
 */
export function canPrint(userRole: Role): boolean {
  return userRole === Role.ADMIN;
}

/**
 * Seul l'ADMIN peut accéder aux routes /admin/*.
 */
export function isAdmin(userRole: Role): boolean {
  return userRole === Role.ADMIN;
}

/**
 * Une étape déjà signée devient en lecture seule pour tout le monde
 * (y compris pour le rôle qui l'a signée) — on ne revient jamais en arrière.
 */
export function isStepLocked(ficheStatus: FicheStatus, stepRole: Role): boolean {
  const normalizedStepRole = normalizeRoleForWorkflow(stepRole);
  const stepIndex = WORKFLOW_ORDER.findIndex((s) => ROLE_FOR_STATUS[s] === normalizedStepRole);
  const currentIndex = WORKFLOW_ORDER.indexOf(ficheStatus);
  return stepIndex !== -1 && stepIndex < currentIndex;
}
