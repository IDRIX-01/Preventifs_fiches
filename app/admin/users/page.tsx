import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Prisma } from "@prisma/client";
import UsersTable from "./UsersTable";

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
    select: {
      id: true,
      createdAt: true,
      name: true,
      username: true,
      passwordHash: true,
      role: true,
      actif: true,
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-3 mb-4">
        <h1 className="text-lg md:text-xl font-bold">Utilisateurs</h1>
        <Link href="/admin/templates" className="text-blue-600 hover:underline text-sm">
          ← Modèles
        </Link>
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

      <UsersTable initialUsers={users} />

      {query && users.length === 0 && (
        <p className="mt-4 text-xs sm:text-sm text-gray-500">
          Aucun utilisateur ne correspond à « {query} ».
        </p>
      )}
    </div>
  );
}