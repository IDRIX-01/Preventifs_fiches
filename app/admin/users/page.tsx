import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";

// Rappel important : seul l'admin peut créer des comptes (voir lib/auth.ts,
// il n'y a pas d'auto-inscription). C'est cette page qui doit porter le
// formulaire de création — à brancher sur une future route
// POST /api/admin/users protégée par isAdmin().
export default async function AdminUsers({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = q?.trim();

  const where: Prisma.UserWhereInput = query
    ? {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
<div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
  <h1 className="text-lg md:text-xl font-bold">Utilisateurs</h1>
  <Link href="/admin/templates" className="text-blue-600 hover:underline text-sm">← Modèles</Link>
</div>

      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Rechercher par nom ou identifiant..."
          className="w-full sm:max-w-sm px-3 py-2 border rounded text-sm"
        />
      </form>

      <div className="overflow-x-auto rounded shadow-sm">
        <table className="w-full min-w-[420px] bg-white">
          <thead className="bg-gray-200 text-left text-xs sm:text-sm">
            <tr>
              <th className="p-2 whitespace-nowrap">Identifiant</th>
              <th className="p-2">Nom</th>
              <th className="p-2 whitespace-nowrap">Rôle</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t text-xs sm:text-sm">
                <td className="p-2 whitespace-nowrap">{u.username}</td>
                <td className="p-2">{u.name}</td>
                <td className="p-2 whitespace-nowrap">{u.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {query && users.length === 0 && (
        <p className="mt-4 text-xs sm:text-sm text-gray-500">
          Aucun utilisateur ne correspond à « {query} ».
        </p>
      )}
    </div>
  );
}