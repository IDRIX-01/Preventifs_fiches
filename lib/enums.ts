export const Role = {
  ADMIN: "ADMIN",
  MACHINISTE: "MACHINISTE",
  CHEF_EQUIPE: "CHEF_EQUIPE",
  RESPONSABLE_PRODUCTION: "RESPONSABLE_PRODUCTION",
  RESPONSABLE_MAINTENANCE: "RESPONSABLE_MAINTENANCE",
  DIRECTEUR_TECHNIQUE: "DIRECTEUR_TECHNIQUE",
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const FicheStatus = {
  BROUILLON: "BROUILLON",
  MACHINISTE: "MACHINISTE",
  CHEF_EQUIPE: "CHEF_EQUIPE",
  RESPONSABLE_PRODUCTION: "RESPONSABLE_PRODUCTION",
  RESPONSABLE_MAINTENANCE: "RESPONSABLE_MAINTENANCE",
  DIRECTEUR_TECHNIQUE: "DIRECTEUR_TECHNIQUE",
  ARCHIVE: "ARCHIVE",
} as const;
export type FicheStatus = (typeof FicheStatus)[keyof typeof FicheStatus];

// Libellés affichables — utilisés pour "Rôle : Nom" dans le dashboard
export const ROLE_LABELS: Record<Role, string> = {
  [Role.ADMIN]: "Administrateur",
  [Role.MACHINISTE]: "Machiniste",
  [Role.CHEF_EQUIPE]: "Chef d'équipe",
  [Role.RESPONSABLE_PRODUCTION]: "Responsable Production",
  [Role.RESPONSABLE_MAINTENANCE]: "Responsable Maintenance",
  [Role.DIRECTEUR_TECHNIQUE]: "Directeur Technique",
};