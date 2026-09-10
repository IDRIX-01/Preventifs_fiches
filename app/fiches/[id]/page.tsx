"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import FicheView from "@/components/FicheView";
import { canEditStep, canPrint } from "@/lib/workflow";
import { Role } from "@/lib/enums";

// Compare deux noms de personne de façon tolérante (espaces multiples,
// espaces en début/fin, casse, espaces insécables) pour éviter que la
// comparaison stricte `===` échoue silencieusement à cause d'une saisie
// ou d'un export légèrement différent entre la fiche et la session.
//
// NB: c'est un filet de sécurité. La vraie solution est de comparer un
// identifiant stable (ex. `superviseurUsername` / `username`) plutôt que
// le nom affiché — voir `matchesSuperviseur` ci-dessous.
function normalizeName(name: string | null | undefined): string {
  return (name ?? "")
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

// Détermine si l'utilisateur connecté est bien le chef d'équipe désigné
// sur la fiche. Priorité à une comparaison par identifiant stable si les
// deux côtés l'exposent (fiche.superviseurUsername / session.user.username) ;
// sinon on retombe sur une comparaison de nom tolérante.
function matchesSuperviseur(fiche: any, sessionUser: any): boolean {
  const ficheUsername = fiche?.superviseurUsername;
  const userUsername = sessionUser?.username;

  if (ficheUsername && userUsername) {
    return ficheUsername === userUsername;
  }

  return normalizeName(fiche?.superviseur) === normalizeName(sessionUser?.name);
}

export default function FichePage({ params }: { params: { id: string } }) {
  const { data: session } = useSession();
  const [fiche, setFiche] = useState<any>(null);
  const [chefEquipes, setChefEquipes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    const data = await fetch(`/api/fiches/${params.id}`).then((r) => r.json());
    setFiche(data);
    setLoading(false);
  }

  useEffect(() => {
    reload();
    fetch("/api/users?role=CHEF_EQUIPE")
      .then((r) => r.json())
      .then(setChefEquipes);
  }, [params.id]);

  if (loading || !session) return <div className="p-6">Chargement…</div>;
  if (!fiche || fiche.error) return <div className="p-6">Fiche introuvable.</div>;

  const role = (session.user as any).role as Role;
  const userName = session.user?.name as string;

  let editable = canEditStep(role, fiche.status);
  // Un chef d'équipe ne peut agir que sur la fiche où il a été désigné par le machiniste
  if (editable && role === Role.CHEF_EQUIPE) {
    editable = matchesSuperviseur(fiche, session.user);
  }

  async function handleSubmitStep(data: any) {
    const res = await fetch(`/api/fiches/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "transmettre", ...data }),
    });
    if (res.ok) {
      reload();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function handleModify(data: any) {
    const res = await fetch(`/api/fiches/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "modifier", ...data }),
    });
    if (res.ok) {
      reload();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function handleSign(signatureData: string) {
    const res = await fetch(`/api/fiches/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "signer", signatureData }),
    });
    if (res.ok) {
      reload();
    } else {
      const err = await res.json();
      alert(err.error);
    }
  }

  async function handlePrint() {
    const res = await fetch(`/api/fiches/${params.id}/print`);
    if (!res.ok) {
      const err = await res.json();
      alert(err.error);
      return;
    }
    window.print();
  }

  return (
    <div className="p-6">
      <div className="max-w-4xl mx-auto flex justify-between items-center mb-4 no-print">
        <a href="/dashboard" className="text-blue-600 hover:underline">
          ← Retour
        </a>
        {canPrint(role) && (
          <button onClick={handlePrint} className="bg-gray-800 text-white px-4 py-2 rounded">
            Imprimer / Exporter
          </button>
        )}
      </div>

      <FicheView
        fiche={fiche}
        currentUserRole={role}
        currentUserName={userName}
        chefEquipeOptions={chefEquipes}
        editable={editable}
        onSubmitStep={handleSubmitStep}
        onModify={handleModify}
        onSign={handleSign}
      />
    </div>
  );
}