import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role } from "@/lib/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import type { Prisma } from "@prisma/client";

const PAGE_SIZE = 20;

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

function buildPageHref(
  p: number,
  filtres: { systeme: string; dateDebut: string; dateFin: string }
) {
  const params = new URLSearchParams();
  if (filtres.systeme) params.set("systeme", filtres.systeme);
  if (filtres.dateDebut) params.set("dateDebut", filtres.dateDebut);
  if (filtres.dateFin) params.set("dateFin", filtres.dateFin);
  if (p > 1) params.set("page", String(p));
  const qs = params.toString();
  return qs ? `/admin/archives?${qs}` : "/admin/archives";
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
  const dateDebut = str(searchParams.dateDebut).trim();
  const dateFin = str(searchParams.dateFin).trim();

  const pageDemandee = parseInt(str(searchParams.page), 10);
  const pageCourante =
    Number.isFinite(pageDemandee) && pageDemandee > 0 ? pageDemandee : 1;

  const systemesDisponibles = await prisma.ficheTemplate.findMany({
    select: { systeme: true },
    distinct: ["systeme"],
    orderBy: { systeme: "asc" },
  });


  const where: Prisma.FicheInstanceWhereInput = { status: "ARCHIVE" };

  if (systeme) where.template = { systeme };


  if (dateDebut || dateFin) {
    const datePrevueFilter: Prisma.DateTimeFilter = {};

    if (dateDebut) {
      datePrevueFilter.gte = new Date(dateDebut);
    }

    if (dateFin) {
 
      const finInclusive = new Date(dateFin);
      finInclusive.setDate(finInclusive.getDate() + 1);
      datePrevueFilter.lt = finInclusive;
    }

    where.datePrevue = datePrevueFilter;
  }

  const total = await prisma.ficheInstance.count({ where });
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(pageCourante, totalPages); // évite une page hors limites
  const offset = (page - 1) * PAGE_SIZE; // sert aussi à la numérotation continue

  const results = await prisma.ficheInstance.findMany({
    where,
    include: { template: true },
    orderBy: { datePrevue: "desc" },
    skip: offset,
    take: PAGE_SIZE,
  });

  const filtres = { systeme, dateDebut, dateFin };

  return (
    <div className="max-w-6xl mx-auto px-4 py-4 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center mb-6">
        <h1 className="text-lg sm:text-xl font-bold">Recherche dans les archives</h1>
        <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
          ← Retour au tableau de bord
        </Link>
      </div>

      <form
        method="get"
        className="bg-white rounded shadow-sm p-4 sm:p-6 mb-6 grid grid-cols-1 md:grid-cols-4 gap-4"
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
          <label className="block text-sm font-medium text-gray-600 mb-1">Du</label>
          <input
            type="date"
            name="dateDebut"
            defaultValue={dateDebut}
            className="w-full border rounded p-2"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Au</label>
          <input
            type="date"
            name="dateFin"
            defaultValue={dateFin}
            className="w-full border rounded p-2"
          />
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
          <div className="sm:hidden space-y-3">
            {results.map((f, index) => {
              const numero = offset + index + 1;
              const statusLabel = STATUSES.find((s) => s.value === f.status)?.label ?? f.status;
              return (
                <div key={f.id} className="bg-white rounded shadow-sm p-4 text-sm">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-semibold">
                      <span className="text-gray-400 mr-2">#{numero}</span>
                      {f.numeroOT}
                    </span>
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

          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full bg-white rounded shadow-sm overflow-hidden">
              <thead className="bg-gray-200 text-left text-sm">
                <tr>
                  <th className="p-2 w-12">N°</th>
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
                {results.map((f, index) => {
                  const numero = offset + index + 1;
                  const statusLabel = STATUSES.find((s) => s.value === f.status)?.label ?? f.status;
                  return (
                    <tr key={f.id} className="border-t text-sm">
                      <td className="p-2 text-gray-500">{numero}</td>
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

      {total > 0 && (
        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-sm">
          <p className="text-gray-500 text-center sm:text-left">
            {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} sur {total} fiche(s)
          </p>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              {page > 1 ? (
                <Link
                  href={buildPageHref(page - 1, filtres)}
                  className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100"
                >
                  ← Précédent
                </Link>
              ) : (
                <span className="border border-gray-200 text-gray-300 px-3 py-1.5 rounded">
                  ← Précédent
                </span>
              )}

              <span className="px-2 text-gray-600">
                Page {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={buildPageHref(page + 1, filtres)}
                  className="border border-gray-300 text-gray-600 px-3 py-1.5 rounded hover:bg-gray-100"
                >
                  Suivant →
                </Link>
              ) : (
                <span className="border border-gray-200 text-gray-300 px-3 py-1.5 rounded">
                  Suivant →
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}