// Les champs epi/consignesA/consignesNe/actions/ressources/actionsCochees
// sont stockés en String en base (voir prisma/schema.prisma — le type Json
// n'est pas supporté par ce connecteur SQLite). Ces helpers centralisent
// la conversion pour que le reste du code (composants, routes) manipule
// toujours de vrais objets/tableaux JS, jamais des chaînes brutes.

export function serializeTemplateFields<T extends Record<string, unknown>>(input: T) {
  return {
    ...input,
    epi: JSON.stringify((input as any).epi),
    consignesA: JSON.stringify((input as any).consignesA),
    consignesNe: JSON.stringify((input as any).consignesNe),
    actions: JSON.stringify((input as any).actions),
    ressources: JSON.stringify((input as any).ressources),
  };
}

export function parseTemplateFields(t: any) {
  if (!t) return t;
  return {
    ...t,
    epi: JSON.parse(t.epi),
    consignesA: JSON.parse(t.consignesA),
    consignesNe: JSON.parse(t.consignesNe),
    actions: JSON.parse(t.actions),
    ressources: JSON.parse(t.ressources),
  };
}

export function parseFicheInstance(f: any) {
  if (!f) return f;
  return {
    ...f,
    actionsCochees: f.actionsCochees ? JSON.parse(f.actionsCochees) : {},
    template: f.template ? parseTemplateFields(f.template) : f.template,
  };
}

export function serializeActionsCochees(obj: Record<string, boolean>) {
  return JSON.stringify(obj ?? {});
}
