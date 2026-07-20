"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

type FicheLite = {
  id: string;
  numeroOT: string;
  status: string;
  machinisteNom: string | null;
  templateId: string;
  template: { titre: string; systeme: string };
};

export default function MachinisteFicheSelector({
  fichesParSysteme,
  assignedTemplateIds,
  userName,
}: {
  fichesParSysteme: Record<string, FicheLite[]>;
  assignedTemplateIds: string[] | null; // null = pas de restriction (accès total)
  userName: string;
}) {
  const lignes = useMemo(() => Object.keys(fichesParSysteme).sort(), [fichesParSysteme]);
  const [ligne, setLigne] = useState<string>("");
  const [ficheId, setFicheId] = useState<string>("");

  const fichesDeLaLigne = ligne ? fichesParSysteme[ligne] ?? [] : [];
  const assignedSet = assignedTemplateIds ? new Set(assignedTemplateIds) : null;
  const ficheSelectionnee = fichesDeLaLigne.find((f) => f.id === ficheId) ?? null;

  const isDone = (f: FicheLite) => f.machinisteNom === userName;
  const isLocked = (f: FicheLite) =>
    !isDone(f) && assignedSet !== null && !assignedSet.has(f.templateId);

  if (lignes.length === 0) {
    return (
      <div className="bg-white rounded shadow-sm p-6 text-center text-gray-400">
        Aucune fiche pour le moment.
      </div>
    );
  }

  return (
    <div className="bg-white rounded shadow-sm p-6 mb-6 space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Ligne</label>
        <select
          className="w-full border rounded p-2"
          value={ligne}
          onChange={(e) => {
            setLigne(e.target.value);
            setFicheId("");
          }}
        >
          <option value="">— Choisir une ligne —</option>
          {lignes.map((l) => (
            <option key={l} value={l}>
              {l} ({fichesParSysteme[l].length})
            </option>
          ))}
        </select>
      </div>

      {ligne && (
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Fiche à renseigner</label>
          <select
            className="w-full border rounded p-2"
            value={ficheId}
            onChange={(e) => setFicheId(e.target.value)}
          >
            <option value="">— Choisir une fiche —</option>
            {fichesDeLaLigne.map((f) => (
              <option key={f.id} value={f.id} disabled={isLocked(f)}>
                {f.numeroOT} — {f.template.titre}
                {isDone(f) ? " (déjà effectuée)" : isLocked(f) ? " (non assignée)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {ficheSelectionnee && (
        <div className="pt-2">
          {isDone(ficheSelectionnee) ? (
            <span className="text-green-600 font-medium">Cette fiche a déjà été effectuée.</span>
          ) : isLocked(ficheSelectionnee) ? (
            <span className="text-gray-400" title="Fiche non assignée">
              Cette fiche ne vous est pas assignée.
            </span>
          ) : (
            <Link
              href={`/fiches/${ficheSelectionnee.id}`}
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Ouvrir la fiche
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
