"use client";

import { useState } from "react";
import { Role } from "@/lib/enums";
import SignaturePad from "./SignaturePad";

// Chef d'équipe unique et imposé pour les fiches chillers/convoyeurs
// traitées par un maintenancier (pas de choix possible dans ce cas).
const CHEF_EQUIPE_MAINTENANCE = {
  username: "6488",
  name: "BIAGNE DIPLOH ANGE MONDESIR",
};

// Rôle(s) pouvant corriger les champs saisis par le machiniste
// (actionsCochees, heures, observation) une fois la fiche arrivée à leur étape.
// Seul le chef d'équipe a ce droit.
const ROLES_AVEC_DROIT_MODIFICATION = [Role.CHEF_EQUIPE];

// Signature du Directeur Technique restreinte selon l'équipement (UAP1 uniquement).
// Pour tout équipement non listé ici, n'importe quel directeur connecté peut signer
// (comportement inchangé).
const DIRECTEURS_AUTORISES_PAR_EQUIPEMENT: Record<string, string[]> = {
  SIPA: ["RAMZI", "WALID"],
  BTP: ["RAMZI", "WALID"],
  "05L": ["RAMZI", "WALID"],
  "17L": ["RAMZI", "WALID"],
  ERTURK1: ["MEHER", "HAMED"],
  ERTURK2: ["MEHER", "HAMED"],
  SIDEL: ["MEHER", "HAMED"],
};

function directeurAutorise(equipement: string, userName: string) {
  const liste = DIRECTEURS_AUTORISES_PAR_EQUIPEMENT[equipement?.toUpperCase()];
  if (!liste) return true; // équipement hors UAP1 → pas de restriction
  return liste.some((nom) => userName?.toUpperCase().includes(nom));
}

type Props = {
  fiche: any;
  currentUserRole: Role;
  currentUserName: string;
  chefEquipeOptions?: { username: string; name: string }[];
  editable: boolean;
  onSubmitStep?: (data: any) => void;
  onModify?: (data: any) => void;
  onSign?: (signatureData: string) => void;
};

export default function FicheView({
  fiche,
  currentUserRole,
  currentUserName,
  chefEquipeOptions = [],
  editable,
  onSubmitStep,
  onModify,
  onSign,
}: Props) {
  const t = fiche.template;
  const isMaintenancier = currentUserRole === Role.MAINTENANCIER;
  // Le maintenancier renseigne la fiche à la même étape qu'un machiniste
  // (voir lib/workflow.ts) : nom auto-identifié, heures éditables, etc.
  const isMachinisteStep =
    (currentUserRole === Role.MACHINISTE || isMaintenancier) && editable;

  // Le chef d'équipe peut corriger les actions/heures/observation tant que
  // la fiche est à son étape, sans repasser par "Transmettre" (nom du
  // machiniste et destinataire restent inchangés).
  const canModify =
    ROLES_AVEC_DROIT_MODIFICATION.includes(currentUserRole as any) && editable;

  // Contrôle si les champs (actions, heures, observation) sont éditables,
  // que ce soit à l'étape machiniste ou lors d'une correction ultérieure.
  const canEditFields = isMachinisteStep || canModify;

  const [actionsCochees, setActionsCochees] = useState(fiche.actionsCochees ?? {});
  const [dateEntretien, setDateEntretien] = useState(
    fiche.dateEntretien ? fiche.dateEntretien.slice(0, 10) : ""
  );
  const [heureDebut, setHeureDebut] = useState(fiche.heureDebut ?? "");
  const [heureFin, setHeureFin] = useState(fiche.heureFin ?? "");
  const [observation, setObservation] = useState(fiche.observation ?? "");
  // Pour un maintenancier, le chef d'équipe destinataire est fixe et
  // pré-rempli : aucun choix à faire.
  const [chefEquipeChoice, setChefEquipeChoice] = useState(
    isMaintenancier ? CHEF_EQUIPE_MAINTENANCE.name : ""
  );
  const [signingRole, setSigningRole] = useState<Role | null>(null);

  function handleTransmettre() {
    if (!chefEquipeChoice) {
      alert("Sélectionnez le chef d'équipe destinataire");
      return;
    }
    onSubmitStep &&
      onSubmitStep({
        machinisteNom: currentUserName, // identifié via le compte connecté, jamais saisi à la main
        dateEntretien,
        heureDebut,
        heureFin,
        observation,
        actionsCochees,
        superviseur: chefEquipeChoice,
      });
  }

  function handleModifier() {
    onModify &&
      onModify({
        dateEntretien,
        heureDebut,
        heureFin,
        observation,
        actionsCochees,
      });
  }

  function handleToggleAll(checked: boolean) {
    const next = { ...actionsCochees };
    t.actions.forEach((a: any) => {
      next[a.code] = checked;
    });
    setActionsCochees(next);
  }

  const allActionsChecked =
    t.actions.length > 0 && t.actions.every((a: any) => !!actionsCochees[a.code]);

  return (
    <div className="max-w-4xl mx-auto bg-white text-black text-sm border border-gray-400 print:border-0">
      {/* En-tête : empilé sur mobile, 3 colonnes à partir de sm (comme à l'impression) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 border-b border-gray-400">
        <div className="sm:col-span-2 sm:border-r border-b sm:border-b-0 border-gray-400 p-2 font-bold text-center">
          ENREGISTREMENT
          <div className="font-normal">{t.titre}</div>
        </div>
        <div className="p-2">
          <div>Version : {t.version}</div>
          <div>Réf : {t.ref}</div>
        </div>
      </div>

      <div className="p-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 border-b border-gray-400">
        <div>N°OT : {fiche.numeroOT}</div>
        <div>Équipement : {t.equipement}</div>
        <div>Système : {t.systeme}</div>
        <div>Zone : {fiche.zone}</div>
        <div>Centre charge : {fiche.centreCharge}</div>
        <div>Intervention : {t.intervention}</div>
        <div>Superviseur : {fiche.superviseur || "—"}</div>
        <div>
          Statut actuel :{" "}
          <span className="font-semibold">
            {fiche.status === "MACHINISTE" && isMaintenancier
              ? "Maintenancier"
              : fiche.responsableName ?? fiche.status}
          </span>
        </div>
      </div>

      {/* Bloc Machiniste / Maintenancier */}
      <Section title="Intervention — Machiniste">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label={isMaintenancier ? "Nom du maintenancier" : "Nom du machiniste"}>
            <span>{isMachinisteStep ? currentUserName : fiche.machinisteNom || "—"}</span>
          </Field>
          <Field label="Chef d'équipe destinataire">
            {isMachinisteStep ? (
              isMaintenancier ? (
                // Choix unique et imposé, non modifiable : pas de select.
                <span>{CHEF_EQUIPE_MAINTENANCE.name}</span>
              ) : (
                <select
                  className="border p-1 w-full"
                  value={chefEquipeChoice}
                  onChange={(e) => setChefEquipeChoice(e.target.value)}
                >
                  <option value="">— Choisir —</option>
                  {chefEquipeOptions.map((c) => (
                    <option key={c.username} value={c.name}>
                      {c.name}
                    </option>
                  ))}
                </select>
              )
            ) : (
              <span>{fiche.superviseur || "—"}</span>
            )}
          </Field>
          <Field label="Date de l'entretien">
            {canEditFields ? (
              <input
                type="date"
                className="border p-1 w-full"
                value={dateEntretien}
                onChange={(e) => setDateEntretien(e.target.value)}
              />
            ) : (
              <span>
                {fiche.dateEntretien
                  ? new Date(fiche.dateEntretien).toLocaleDateString("fr-FR")
                  : "—"}
              </span>
            )}
          </Field>
          <Field label="Heure de début">
            {canEditFields ? (
              <input
                type="time"
                className="border p-1 w-full"
                value={heureDebut}
                onChange={(e) => setHeureDebut(e.target.value)}
              />
            ) : (
              <span>{fiche.heureDebut || "—"}</span>
            )}
          </Field>
          <Field label="Heure de fin">
            {canEditFields ? (
              <input
                type="time"
                className="border p-1 w-full"
                value={heureFin}
                onChange={(e) => setHeureFin(e.target.value)}
              />
            ) : (
              <span>{fiche.heureFin || "—"}</span>
            )}
          </Field>
          <Field label="Observations" full>
            {canEditFields ? (
              <textarea
                className="border p-1 w-full"
                rows={2}
                value={observation}
                onChange={(e) => setObservation(e.target.value)}
              />
            ) : (
              <span>{fiche.observation || "—"}</span>
            )}
          </Field>
        </div>
      </Section>

      {/* EPI — table avec scroll horizontal de secours sur mobile plutôt qu'une
          transformation en cartes : c'est un document formel destiné aussi à
          l'impression, donc on garde la structure tableau intacte. */}
      <Section title="EPI">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-1 text-left">Code EPI</th>
                <th className="border p-1 text-left">Description</th>
                <th className="border p-1 text-left">Quantité</th>
              </tr>
            </thead>
            <tbody>
              {t.epi.map((e: any) => (
                <tr key={e.code}>
                  <td className="border p-1">{e.code}</td>
                  <td className="border p-1">{e.description}</td>
                  <td className="border p-1">{e.quantite}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Consignes de sécurité — À faire">
        <ul className="list-disc pl-5 space-y-0.5">
          {t.consignesA.map((c: string, i: number) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Section>
      <Section title="Consignes de sécurité — À ne pas faire">
        <ul className="list-disc pl-5 space-y-0.5">
          {t.consignesNe.map((c: string, i: number) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </Section>

      {/* Actions à cocher */}
      <Section title="Actions">
        {canEditFields && (
          <label className="flex items-center gap-2 mb-2 text-sm font-medium select-none">
            <input
              type="checkbox"
              checked={allActionsChecked}
              onChange={(e) => handleToggleAll(e.target.checked)}
            />
            Tout cocher
          </label>
        )}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-1 text-left">Code</th>
                <th className="border p-1 text-left">Action</th>
                <th className="border p-1 text-center">Effectuée</th>
              </tr>
            </thead>
            <tbody>
              {t.actions.map((a: any) => (
                <tr key={a.code}>
                  <td className="border p-1">{a.code}</td>
                  <td className="border p-1">{a.libelle}</td>
                  <td className="border p-1 text-center">
                    <input
                      type="checkbox"
                      checked={!!actionsCochees[a.code]}
                      disabled={!canEditFields}
                      onChange={(e) =>
                        setActionsCochees({ ...actionsCochees, [a.code]: e.target.checked })
                      }
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {isMachinisteStep && (
          <button
            onClick={handleTransmettre}
            className="mt-3 w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Transmettre au chef d'équipe
          </button>
        )}
        {canModify && (
          <button
            onClick={handleModifier}
            className="mt-3 w-full sm:w-auto bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
          >
            Enregistrer les modifications
          </button>
        )}
      </Section>

      {/* Bloc signatures : 1 colonne sur mobile, 2 sur petit écran, 4 à partir de lg */}
      <Section title="Validation">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <SignatureCell
            label="Chef d'équipe"
            name={fiche.chefEquipeNom}
            signatures={fiche.signatures}
            role={Role.CHEF_EQUIPE}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            editable={editable}
            onOpenSign={() => setSigningRole(Role.CHEF_EQUIPE)}
          />
          <SignatureCell
            label="Responsable Production"
            signatures={fiche.signatures}
            role={Role.RESPONSABLE_PRODUCTION}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            editable={editable}
            onOpenSign={() => setSigningRole(Role.RESPONSABLE_PRODUCTION)}
          />
          <SignatureCell
            label="Responsable Maintenance"
            signatures={fiche.signatures}
            role={Role.RESPONSABLE_MAINTENANCE}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            editable={editable}
            onOpenSign={() => setSigningRole(Role.RESPONSABLE_MAINTENANCE)}
          />
          <SignatureCell
            label="Directeur Technique"
            signatures={fiche.signatures}
            role={Role.DIRECTEUR_TECHNIQUE}
            currentUserRole={currentUserRole}
            currentUserName={currentUserName}
            equipement={t.systeme}
            editable={editable}
            onOpenSign={() => setSigningRole(Role.DIRECTEUR_TECHNIQUE)}
          />
        </div>
      </Section>

      {signingRole && (
        <SignaturePad
          onCancel={() => setSigningRole(null)}
          onConfirm={(dataUrl) => {
            onSign && onSign(dataUrl);
            setSigningRole(null);
          }}
        />
      )}
    </div>
  );
}

function Field({
  label,
  children,
  full,
}: {
  label: string;
  children: React.ReactNode;
  full?: boolean;
}) {
  return (
    <div className={full ? "sm:col-span-2" : ""}>
      <div className="text-xs text-gray-500 mb-0.5">{label}</div>
      {children}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-400">
      <div className="bg-gray-300 font-bold text-center py-1">{title}</div>
      <div className="p-2">{children}</div>
    </div>
  );
}

function SignatureCell({
  label,
  name,
  signatures,
  role,
  currentUserRole,
  currentUserName,
  equipement,
  editable,
  onOpenSign,
}: {
  label: string;
  name?: string;
  signatures: any[];
  role: Role;
  currentUserRole: Role;
  currentUserName?: string;
  equipement?: string;
  editable: boolean;
  onOpenSign: () => void;
}) {
  const sig = signatures?.find((s) => s.role === role);

  // Pour le Directeur Technique, la signature est en plus restreinte selon
  // l'équipement de la fiche (voir DIRECTEURS_AUTORISES_PAR_EQUIPEMENT).
  // Pour les autres rôles, aucune restriction supplémentaire.
  const autorisePourCetEquipement =
    role !== Role.DIRECTEUR_TECHNIQUE ||
    directeurAutorise(equipement ?? "", currentUserName ?? "");

  const canSign =
    editable && currentUserRole === role && !sig && autorisePourCetEquipement;

  return (
    <div className="border p-2 min-h-28 flex flex-col justify-between">
      <div>
        <div className="font-semibold">{label}</div>
        {name && <div>{name}</div>}
      </div>
      {sig ? (
        <div className="text-xs text-green-700 mt-1">
          {sig.signatureData && (
            <img src={sig.signatureData} alt="Signature" className="h-8 mb-1" />
          )}
          ✓ Validé par {sig.user.name}
          <br />
          {new Date(sig.signedAt).toLocaleString("fr-FR")}
        </div>
      ) : canSign ? (
        <button
          onClick={onOpenSign}
          className="bg-green-600 text-white text-xs py-1 rounded hover:bg-green-700"
        >
          Signer et transmettre
        </button>
      ) : editable &&
        currentUserRole === role &&
        !sig &&
        !autorisePourCetEquipement ? (
        <div className="text-xs text-red-500 mt-1">
          Non autorisé pour cet équipement
        </div>
      ) : (
        <div className="text-xs text-gray-400 mt-1">En attente</div>
      )}
    </div>
  );
}