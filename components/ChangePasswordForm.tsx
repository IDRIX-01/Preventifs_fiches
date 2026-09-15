"use client";
import { useState } from "react";

export default function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);

    if (newPassword !== confirm) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      return;
    }

    const res = await fetch("/api/user/change-password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();

    if (!res.ok) {
      setMessage({ type: "error", text: data.error });
    } else {
      setMessage({ type: "success", text: "Mot de passe modifié avec succès" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
      <input
        type="password"
        placeholder="Mot de passe actuel"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        type="password"
        placeholder="Confirmer le nouveau mot de passe"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        className="w-full border rounded px-3 py-2"
        required
      />
      {message && (
        <p className={message.type === "error" ? "text-red-600" : "text-green-600"}>
          {message.text}
        </p>
      )}
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Modifier le mot de passe
      </button>
    </form>
  );
}