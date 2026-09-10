export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

const STATUSES = [
  { value: "BROUILLON", label: "Brouillon" },
  { value: "MACHINISTE", label: "En attente machiniste" },
  { value: "CHEF_EQUIPE", label: "En attente chef d'équipe" },
  { value: "RESPONSABLE_PRODUCTION", label: "En attente resp. production" },
  { value: "RESPONSABLE_MAINTENANCE", label: "En attente resp. maintenance" },
  { value: "DIRECTEUR_TECHNIQUE", label: "En attente directeur technique" },
  { value: "ARCHIVE", label: "Archivée" },
];

function str(v: string | string[] | undefined): string {
  if (Array.isArray(v)) return v[0] ?? "";
  return v ?? "";
}

export default async function ArchivesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as Role;
  if (role !== Role.ADMIN) redirect("/dashboard");

  const systeme = str(searchParams.systeme).trim();
  const date = str(searchParams.date).trim();

  const systemesDisponibles = await prisma.ficheTemplate.findMany({
    select: { systeme: true },
    distinct: ["systeme"],
    orderBy: { systeme: "asc" },
  });

  // La recherche dans /admin/archives ne doit remonter que les fiches
  // archivées, quels que soient les autres critères saisis (ligne, date).
  const where: Prisma.FicheInstanceWhereInput = { status: "ARCHIVE" };

  if (systeme) where.template = { systeme };
  if (date) {
    const start = new Date(date);
    const end = new Date(date);
    end.setDate(end.getDate() + 1);
    where.datePrevue = { gte: start, lt: end };
  }

  // On affiche toutes les fiches archivées par défaut (sans critère),
  // et on filtre dynamiquement si l'utilisateur renseigne Ligne et/ou Date.
  const results = await prisma.ficheInstance.findMany({
    where,
    include: { template: true },
    orderBy: { datePrevue: "desc" },
    take: 200,
  });

  return (
    // px-4 sur mobile, plus large sur desktop ; padding vertical réduit sur mobile
    <div className="max-w-6xl mx-auto px-4 py-4 sm:p-6">
      {/* Empile le titre et le lien au-dessus l'un de l'autre sur mobile */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold">Recherche dans les archives</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
          ← Retour au tableau de bord
        </Link>
      </div>

      {/* 1 colonne sur mobile, 3 colonnes à partir de md */}
      <form
        method="get"
        className="bg-white rounded shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Ligne</label>
          <select name="systeme" defaultValue={systeme} className="w-full border rounded p-2">
            <option value="">Toutes les lignes</option>
            {systemesDisponibles.map((s) => (
              <option key={s.systeme} value={s.systeme}>
                {s.systeme}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Date prévue</label>
          <input type="date" name="date" defaultValue={date} className="w-full border rounded p-2" />
        </div>

        {/* Boutons pleine largeur et empilés sur mobile, en ligne à partir de sm */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <button
            type="submit"
            className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Rechercher
          </button>
          <Link
            href="/admin/archives"
            className="w-full sm:w-auto text-center border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-100"
          >
            Réinitialiser
          </Link>
        </div>
      </form>

      {results.length === 0 && (
        <div className="bg-white rounded shadow-sm p-6 text-center text-gray-400">
          Aucune fiche archivée ne correspond à ces critères.
        </div>
      )}

      {results.length > 0 && (
        <>
          {/* MOBILE (< sm) : cartes empilées au lieu d'un tableau illisible */}
          <div className="sm:hidden space-y-3">
            {results.map((f) => {
              const statusLabel = STATUSES.find((s) => s.value === f.status)?.label ?? f.status;
              return (
                <div key={f.id} className="bg-white rounded shadow-sm p-4 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">{f.numeroOT}</span>
                    <Link href={`/fiches/${f.id}`} className="text-blue-600 hover:underline">
                      Ouvrir
                    </Link>
                  </div>
                  <div className="text-gray-600 space-y-1">
                    <div>Ligne : {f.template.systeme}</div>
                    <div>Fiche : {f.template.titre}</div>
                    <div>Date : {f.datePrevue.toLocaleDateString("fr-FR")}</div>
                    <div>Machiniste : {f.machinisteNom ?? "—"}</div>
                    <div>Chef d'équipe : {f.chefEquipeNom ?? "—"}</div>
                    <div>Statut : {statusLabel}</div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* DESKTOP (>= sm) : tableau classique avec scroll horizontal de secours */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full bg-white rounded shadow-sm overflow-hidden">
              <thead className="bg-gray-200 text-left text-sm">
                <tr>
                  <th className="p-2">N° OT</th>
                  <th className="p-2">Ligne</th>
                  <th className="p-2">Fiche</th>
                  <th className="p-2">Date prévue</th>
                  <th className="p-2">Machiniste</th>
                  <th className="p-2">Chef d'équipe</th>
                  <th className="p-2">Statut</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {results.map((f) => {
                  const statusLabel = STATUSES.find((s) => s.value === f.status)?.label ?? f.status;
                  return (
                    <tr key={f.id} className="border-t text-sm">
                      <td className="p-2">{f.numeroOT}</td>
                      <td className="p-2">{f.template.systeme}</td>
                      <td className="p-2">{f.template.titre}</td>
                      <td className="p-2">{f.datePrevue.toLocaleDateString("fr-FR")}</td>
                      <td className="p-2">{f.machinisteNom ?? "—"}</td>
                      <td className="p-2">{f.chefEquipeNom ?? "—"}</td>
                      <td className="p-2">{statusLabel}</td>
                      <td className="p-2">
                        <Link href={`/fiches/${f.id}`} className="text-blue-600 hover:underline">
                          Ouvrir
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {results.length === 200 && (
        <p className="text-xs text-gray-400 mt-2">
          Affichage limité aux 200 premiers résultats — affine ta recherche pour voir moins de fiches.
        </p>
      )}
    </div>
  );
}