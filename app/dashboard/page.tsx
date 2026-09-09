export const dynamic = "force-dynamic";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Role, ROLE_LABELS } from "@/lib/enums";
import Link from "next/link";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/LogoutButton";
import MachinisteFicheSelector from "@/components/MachinisteFicheSelector";

export default async function Dashboard() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = (session.user as any).role as Role;
  const userId = (session.user as any).id as string;
  const userName = session.user?.name as string;


  let assignedTemplateIds: Set<string> | null = null;
  if (role === Role.MACHINISTE || role === Role.MAINTENANCIER) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { assignedTemplates: true },
    });
    const ids = user?.assignedTemplates?.map((t) => t.id) ?? [];
    assignedTemplateIds = ids.length > 0 ? new Set(ids) : null;
  }


  const roleFilter =
    role === Role.ADMIN
      ? {}
      : role === Role.CHEF_EQUIPE
      ? {
          OR: [
            { status: Role.CHEF_EQUIPE, superviseur: userName }, // c'est son tour, désigné par le machiniste
            { signatures: { some: { role } } }, // historique : fiches déjà signées par lui
          ],
        }
      : role === Role.MACHINISTE || role === Role.MAINTENANCIER
      ? {
          OR: [
            { status: Role.MACHINISTE }, // en attente de saisie (le maintenancier agit comme un machiniste)
            { machinisteNom: userName }, // historique : déjà renseignées et transmises par lui
          ],
        }
      : { OR: [{ status: role as any }, { signatures: { some: { role } } }] };

  const fichesBrutes = await prisma.ficheInstance.findMany({
    where: {
      AND: [roleFilter, { status: { not: "ARCHIVE" } }],
    },
    include: { template: true, signatures: true },
    orderBy: { createdAt: "desc" },
  });


  const fiches = assignedTemplateIds
    ? fichesBrutes.filter(
        (f) => assignedTemplateIds!.has(f.templateId) || f.machinisteNom === userName,
      )
    : fichesBrutes;

  const fichesParSysteme = fiches.reduce((acc: Record<string, typeof fiches>, f) => {
    const systeme = f.template.systeme;
    if (!acc[systeme]) acc[systeme] = [];
    acc[systeme].push(f);
    return acc;
  }, {});

  const systemes = Object.keys(fichesParSysteme).sort();

  // Version allégée et sérialisable (pas d'objets Date) à passer au
  // composant client MachinisteFicheSelector.
  const fichesParSystemeLite =
    role === Role.MACHINISTE || role === Role.MAINTENANCIER
      ? Object.fromEntries(
          Object.entries(fichesParSysteme).map(([systeme, list]) => [
            systeme,
            list.map((f) => ({
              id: f.id,
              numeroOT: f.numeroOT,
              status: f.status,
              machinisteNom: f.machinisteNom,
              templateId: f.templateId,
              template: { titre: f.template.titre, systeme: f.template.systeme },
            })),
          ]),
        )
      : {};

  return (
    <div className="max-w-5xl mx-auto px-4 py-4 sm:p-6">
      {/* Empile titre/infos et actions sur mobile, côte à côte à partir de sm */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-lg sm:text-xl font-bold">Bonjour {session.user?.name}</h1>
          <p className="text-sm text-gray-500">
            {ROLE_LABELS[role]} : {session.user?.name}
          </p>
        </div>
        {/* flex-wrap pour que les boutons retombent à la ligne plutôt que de déborder */}
        <div className="flex flex-wrap items-center gap-3">
          {role === Role.ADMIN && (
            <>
              <Link href="/admin/templates" className="bg-gray-800 text-white px-4 py-2 rounded text-sm sm:text-base">
                Espace Admin
              </Link>
              <Link href="/admin/archives" className="border border-gray-300 text-gray-600 px-4 py-2 rounded hover:bg-gray-100 text-sm sm:text-base">
                Archives
              </Link>
            </>
          )}
          <LogoutButton />
        </div>
      </div>

      {role === Role.MACHINISTE || role === Role.MAINTENANCIER ? (
        <MachinisteFicheSelector
          fichesParSysteme={fichesParSystemeLite}
          assignedTemplateIds={assignedTemplateIds ? Array.from(assignedTemplateIds) : null}
          userName={userName}
        />
      ) : (
        <>
          {systemes.length === 0 && (
            <div className="bg-white rounded shadow-sm p-6 text-center text-gray-400">
              Aucune fiche pour le moment.
            </div>
          )}

          {systemes.map((systeme) => (
            <div key={systeme} className="mb-6">
              <h2 className="text-sm font-bold text-gray-600 uppercase mb-2 px-1">
                {systeme} <span className="text-gray-400 font-normal">({fichesParSysteme[systeme].length})</span>
              </h2>

              {/* MOBILE (< sm) : cartes empilées */}
              <div className="sm:hidden space-y-2">
                {fichesParSysteme[systeme].map((f) => (
                  <div key={f.id} className="bg-white rounded shadow-sm p-4 text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold">{f.numeroOT}</span>
                      <Link href={`/fiches/${f.id}`} className="text-blue-600 hover:underline">
                        Ouvrir
                      </Link>
                    </div>
                    <div className="text-gray-600 space-y-0.5">
                      <div>{f.template.titre}</div>
                      <div>{ROLE_LABELS[f.status as Role] ?? f.status}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP (>= sm) : tableau, avec scroll horizontal de secours */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full bg-white rounded shadow-sm overflow-hidden">
                  <thead className="bg-gray-200 text-left text-sm">
                    <tr>
                      <th className="p-2">N° OT</th>
                      <th className="p-2">Fiche</th>
                      <th className="p-2">Statut</th>
                      <th className="p-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fichesParSysteme[systeme].map((f) => (
                      <tr key={f.id} className="border-t text-sm">
                        <td className="p-2">{f.numeroOT}</td>
                        <td className="p-2">{f.template.titre}</td>
                        <td className="p-2">{ROLE_LABELS[f.status as Role] ?? f.status}</td>
                        <td className="p-2">
                          <Link href={`/fiches/${f.id}`} className="text-blue-600 hover:underline">
                            Ouvrir
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}