"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", { username, password, redirect: false });

    if (res?.error) {
      setError("Identifiant ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    // Rechargement complet (pas router.push) pour éviter que Next.js
    // affiche une page mise en cache avec l'ancienne session
    window.location.href = "/dashboard";
  }

  return (
    // px-4 pour éviter que le formulaire touche les bords sur petit écran
    <div className="min-h-screen flex items-center justify-center px-4">
      {/* w-80 fixe -> w-full avec max-w-sm : prend toute la largeur dispo
          jusqu'à un plafond raisonnable sur desktop */}
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-bold text-center">Fiches d'entretien</h1>
        <input
          className="border w-full p-2 rounded"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="border w-full p-2 rounded"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
      </form>
    </div>
  );
}