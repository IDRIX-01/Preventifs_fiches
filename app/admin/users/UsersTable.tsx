"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type User = {
  id: string;
  username: string;
  name: string;
  role: string;
  actif: boolean;
};

const ROLES = [
  "MACHINISTE",
  "MAINTENANCIER",
  "CHEF_EQUIPE",
  "RESPONSABLE_PRODUCTION",
  "RESPONSABLE_MAINTENANCE",
  "DIRECTEUR_TECHNIQUE",
  "ADMIN",
];

export default function UsersTable({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = useState(initialUsers);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ username: "", name: "", role: ROLES[0], password: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erreur lors de la création");
        return;
      }
      setUsers((prev) => [...prev, data]);
      setForm({ username: "", name: "", role: ROLES[0], password: "" });
      setShowForm(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleActif(user: User) {
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ actif: !user.actif }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    }
  }

  async function handleDelete(user: User) {
    if (!confirm(`Supprimer définitivement ${user.name} ?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      alert(data.error || "Erreur lors de la suppression");
      return;
    }
    setUsers((prev) => prev.filter((u) => u.id !== user.id));
  }

  return (
    <div>
      <button
        onClick={() => setShowForm((s) => !s)}
        className="mb-3 bg-blue-600 text-white text-sm px-3 py-2 rounded hover:bg-blue-700"
      >
        {showForm ? "Annuler" : "+ Ajouter un utilisateur"}
      </button>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-4 p-3 border rounded bg-gray-50 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <input
            type="text"
            placeholder="Identifiant"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            className="border p-2 rounded text-sm"
            required
          />
          <input
            type="text"
            placeholder="Nom complet"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="border p-2 rounded text-sm"
            required
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="border p-2 rounded text-sm"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="password"
            placeholder="Mot de passe"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            className="border p-2 rounded text-sm"
            required
          />
          {error && <p className="text-red-600 text-xs sm:col-span-2">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="sm:col-span-2 bg-green-600 text-white text-sm px-3 py-2 rounded hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? "Création..." : "Créer l'utilisateur"}
          </button>
        </form>
      )}

      <div className="overflow-x-auto rounded shadow-sm">
        <table className="w-full min-w-[560px] bg-white">
          <thead className="bg-gray-200 text-left text-xs sm:text-sm">
            <tr>
              <th className="p-2 whitespace-nowrap">Identifiant</th>
              <th className="p-2">Nom</th>
              <th className="p-2 whitespace-nowrap">Rôle</th>
              <th className="p-2 whitespace-nowrap">Statut</th>
              <th className="p-2 whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-t text-xs sm:text-sm">
                <td className="p-2 whitespace-nowrap">{u.username}</td>
                <td className="p-2">{u.name}</td>
                <td className="p-2 whitespace-nowrap">{u.role}</td>
                <td className="p-2 whitespace-nowrap">
                  <span className={u.actif ? "text-green-700" : "text-gray-400"}>
                    {u.actif ? "Actif" : "Désactivé"}
                  </span>
                </td>
                <td className="p-2 whitespace-nowrap space-x-2">
                  <button
                    onClick={() => handleToggleActif(u)}
                    className="text-amber-600 hover:underline"
                  >
                    {u.actif ? "Désactiver" : "Activer"}
                  </button>
                  <button
                    onClick={() => handleDelete(u)}
                    className="text-red-600 hover:underline"
                  >
                    Supprimer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}