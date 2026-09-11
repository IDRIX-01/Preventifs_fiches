"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const usernameValue = (formData.get("username") as string) ?? "";
    const passwordValue = (formData.get("password") as string) ?? "";

    try {
      const result = await signIn("credentials", {
        username: usernameValue,
        password: passwordValue,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === "Compte désactivé"
            ? "Votre compte a été désactivé. Contactez l'administrateur."
            : "Identifiant ou mot de passe incorrect."
        );
        setLoading(false);
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Une erreur est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-bold text-center">Fiches d'entretien</h1>
        <input
          name="username"
          className="border w-full p-2 rounded"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
        />
        <input
          name="password"
          className="border w-full p-2 rounded"
          placeholder="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
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