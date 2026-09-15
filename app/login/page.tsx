"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
            ? "Votre compte a été désactivé. Contactez l'administrateur ___Service Informatique"
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

        <div className="relative">
          <input
            name="password"
            className="border w-full p-2 pr-10 rounded"
            placeholder="Mot de passe"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Connexion…" : "Se connecter"}
        </button>
        <p className="text-center text-sm text-gray-500">
          <Link href="/change-password" className="text-blue-600 hover:underline">
            Modifier mon mot de passe
          </Link>
        </p>
      </form>
    </div>
  );
}