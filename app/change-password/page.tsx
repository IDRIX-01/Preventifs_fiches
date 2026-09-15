"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 4) {
      setMessage({ type: "error", text: "Le nouveau mot de passe doit contenir au moins 6 caractères" });
      return;
    }
    if (newPassword !== confirm) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/user/change-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, currentPassword, newPassword }),
      });
      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "Une erreur est survenue" });
        setLoading(false);
        return;
      }

      setMessage({ type: "success", text: "Mot de passe modifié. Redirection vers la connexion…" });
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue. Réessayez." });
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-6 sm:p-8 rounded-lg shadow-md w-full max-w-sm space-y-4"
      >
        <h1 className="text-lg font-bold text-center">Modifier mon mot de passe</h1>

        <input
          className="border w-full p-2 rounded"
          placeholder="Identifiant"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />

        <div className="relative">
          <input
            type={showCurrent ? "text" : "password"}
            className="border w-full p-2 pr-10 rounded"
            placeholder="Mot de passe actuel"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowCurrent((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showCurrent ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showCurrent ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            className="border w-full p-2 pr-10 rounded"
            placeholder="Nouveau mot de passe"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowNew((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showNew ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="relative">
          <input
            type={showConfirm ? "text" : "password"}
            className="border w-full p-2 pr-10 rounded"
            placeholder="Confirmer le nouveau mot de passe"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            required
          />
          <button
            type="button"
            onClick={() => setShowConfirm((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            tabIndex={-1}
            aria-label={showConfirm ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          >
            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {message && (
          <p className={message.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
            {message.text}
          </p>
        )}

        <button
          disabled={loading}
          className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Modification…" : "Modifier"}
        </button>

        <p className="text-center text-sm text-gray-500">
          <a href="/login" className="text-blue-600 hover:underline">
            Retour à la connexion
          </a>
        </p>
      </form>
    </div>
  );
}