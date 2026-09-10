import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Cette page est protégée par middleware.ts : impossible d'y accéder sans
// être ADMIN (redirection automatique sinon), même en tapant l'URL directement.
export default async function AdminTemplates() {
  const templates = await prisma.ficheTemplate.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
  <h1 className="text-lg md:text-xl font-bold">Bibliothèque de modèles de fiches</h1>
  <div className="flex flex-wrap items-center gap-3 md:gap-4 text-sm">
    <Link href="/admin/users" className="text-blue-600 hover:underline">Utilisateurs</Link>
    <Link href="/dashboard" className="text-blue-600 hover:underline">← Dashboard</Link>
  </div>
</div>

      <div className="overflow-x-auto rounded shadow-sm">
        <table className="w-full min-w-[480px] bg-white">
          <thead className="bg-gray-200 text-left text-xs sm:text-sm">
            <tr>
              <th className="p-2 whitespace-nowrap">Réf</th>
              <th className="p-2">Titre</th>
              <th className="p-2 whitespace-nowrap">Version</th>
              <th className="p-2 whitespace-nowrap">Actif</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} className="border-t text-xs sm:text-sm">
                <td className="p-2 whitespace-nowrap">{t.ref}</td>
                <td className="p-2">{t.titre}</td>
                <td className="p-2 whitespace-nowrap">{t.version}</td>
                <td className="p-2 whitespace-nowrap">{t.actif ? "Oui" : "Non"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs sm:text-sm text-gray-500 mt-4">
        Pour ajouter un nouveau type de fiche à la bibliothèque, dupliquez le format JSON
        de <code>prisma/seed.ts</code> (EPI, consignes, actions, ressources).
      </p>
    </div>
  );
}