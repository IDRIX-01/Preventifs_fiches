import { prisma } from "@/lib/prisma";
import Link from "next/link";

// Cette page est protégée par middleware.ts : impossible d'y accéder sans
// être ADMIN (redirection automatique sinon), même en tapant l'URL directement.
export default async function AdminTemplates() {
  const templates = await prisma.ficheTemplate.findMany({ orderBy: { createdAt: "desc" } });

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Bibliothèque de modèles de fiches</h1>
        <div className="space-x-4 flex items-center">
          <Link
            href="/admin/fiches/new"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Nouvelle fiche
          </Link>
          <Link href="/admin/users" className="text-blue-600 hover:underline">Utilisateurs</Link>
          <Link href="/dashboard" className="text-blue-600 hover:underline">← Dashboard</Link>
        </div>
      </div>

      <table className="w-full bg-white rounded shadow-sm">
        <thead className="bg-gray-200 text-left text-sm">
          <tr>
            <th className="p-2">Réf</th>
            <th className="p-2">Titre</th>
            <th className="p-2">Version</th>
            <th className="p-2">Actif</th>
          </tr>
        </thead>
        <tbody>
          {templates.map((t) => (
            <tr key={t.id} className="border-t text-sm">
              <td className="p-2">{t.ref}</td>
              <td className="p-2">{t.titre}</td>
              <td className="p-2">{t.version}</td>
              <td className="p-2">{t.actif ? "Oui" : "Non"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="text-sm text-gray-500 mt-4">
        Pour ajouter un nouveau type de fiche à la bibliothèque, dupliquez le format JSON
        de <code>prisma/seed.ts</code> (EPI, consignes, actions, ressources).
      </p>
    </div>
  );
}