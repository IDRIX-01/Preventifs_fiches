"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";

const SYSTEMES = [
  "SIDEL",
  "ERTURK1",
  "ERTURK2",
  "SIPA",
  "05LITRES",
  "17LITRES",
];

export default function NewFiche() {
  const router = useRouter();
  const [templates, setTemplates] = useState<any[]>([]);
  const [error, setError] = useState("");
  const [systeme, setSysteme] = useState("");
  const [form, setForm] = useState({
    templateId: "",
    numeroOT: "",
    zone: "",
    centreCharge: "",
    datePrevue: "",
    dateFinPrevue: "",
  });

  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then(setTemplates);
  }, []);

  const templatesForSysteme = useMemo(
    () => templates.filter((t) => t.systeme === systeme),
    [templates, systeme]
  );

  // Systèmes ayant au moins une fiche disponible dans la bibliothèque
  const systemesDisponibles = useMemo(
    () => SYSTEMES.filter((s) => templates.some((t) => t.systeme === s)),
    [templates]
  );

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleSystemeChange(value: string) {
    setSysteme(value);
    update("templateId", ""); // reset le choix de fiche si on change de système
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const res = await fetch("/api/fiches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Erreur lors de la création");
      return;
    }
    const fiche = await res.json();
    router.push(`/fiches/${fiche.id}`);
  }

  return (
    <div className="max-w-lg mx-auto p-6">
      <h1 className="text-xl font-bold mb-4">Nouvelle fiche</h1>
      <form onSubmit={handleSubmit} className="space-y-3 bg-white p-6 rounded shadow-sm">
        <div>
          <label className="text-sm text-gray-600">Système</label>
          <select
            className="border w-full p-2 rounded"
            value={systeme}
            onChange={(e) => handleSystemeChange(e.target.value)}
            required
          >
            <option value="">— Choisir un système —</option>
            {SYSTEMES.map((s) => (
              <option
                key={s}
                value={s}
                disabled={!systemesDisponibles.includes(s)}
              >
                {s}
                {!systemesDisponibles.includes(s) ? " (aucune fiche)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">Fiche (MTC)</label>
          <select
            className="border w-full p-2 rounded"
            value={form.templateId}
            onChange={(e) => update("templateId", e.target.value)}
            required
            disabled={!systeme}
          >
            <option value="">
              {systeme ? "— Choisir une fiche —" : "Sélectionnez d'abord un système"}
            </option>
            {templatesForSysteme.map((t) => (
              <option key={t.id} value={t.id}>
                {t.ref} — {t.titre}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-600">N° OT</label>
          <input
            className="border w-full p-2 rounded"
            value={form.numeroOT}
            onChange={(e) => update("numeroOT", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Zone</label>
          <input
            className="border w-full p-2 rounded"
            value={form.zone}
            onChange={(e) => update("zone", e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-gray-600">Centre de charge</label>
          <input
            className="border w-full p-2 rounded"
            value={form.centreCharge}
            onChange={(e) => update("centreCharge", e.target.value)}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-sm text-gray-600">Date prévue</label>
            <input
              type="date"
              className="border w-full p-2 rounded"
              value={form.datePrevue}
              onChange={(e) => update("datePrevue", e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm text-gray-600">Date fin prévue</label>
            <input
              type="date"
              className="border w-full p-2 rounded"
              value={form.dateFinPrevue}
              onChange={(e) => update("dateFinPrevue", e.target.value)}
              required
            />
          </div>
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700">
          Créer la fiche
        </button>
      </form>
    </div>
  );
}