"use client";

import { useActionState, useState } from "react";
import { Plus } from "lucide-react";
import {
  ajouterSeance,
  changerSeance,
  terminerInscription,
  type EtatInscription,
} from "@/app/admin/participants/actions";
import Champ, { classeChamp } from "@/components/Champ";

export type InscriptionEnCours = { id: string; libelle: string; depuis: string };
export type OptionSeance = { id: string; libelle: string; info: string; complet: boolean };

const petitBouton =
  "inline-flex h-9 items-center rounded-full border border-bordure bg-surface px-4 text-xs font-semibold transition hover:-translate-y-px disabled:pointer-events-none disabled:opacity-40";
const boutonNoir =
  "h-12 rounded-full bg-encre px-5 text-sm font-semibold text-white transition hover:-translate-y-px disabled:opacity-60";

function Erreur({ message }: { message?: string }) {
  return message ? (
    <p role="alert" className="w-full text-[13px] font-medium text-attention">
      {message}
    </p>
  ) : null;
}

function ChoixSeance({ id, options }: { id: string; options: OptionSeance[] }) {
  return (
    <Champ id={id} label="Séance" className="min-w-56 flex-1">
      <select id={id} name="seance" defaultValue="" className={classeChamp}>
        <option value="" disabled>
          Choisir…
        </option>
        {options.map((o) => (
          <option key={o.id} value={o.id} disabled={o.complet}>
            {o.libelle} · {o.complet ? "complet" : o.info}
          </option>
        ))}
      </select>
    </Champ>
  );
}

function PanneauTerminer({ id, aujourdhui }: { id: string; aujourdhui: string }) {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(terminerInscription.bind(null, id), {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4">
      <Champ id={`fin-${id}`} label="Dernier jour" className="w-48">
        <input id={`fin-${id}`} name="date" type="date" defaultValue={aujourdhui} className={classeChamp} />
      </Champ>
      <button type="submit" disabled={enCours} className={boutonNoir}>
        {enCours ? "Un instant…" : "Terminer l’inscription"}
      </button>
      <Erreur message={etat.message} />
    </form>
  );
}

function PanneauChanger({ id, options, aujourdhui }: { id: string; options: OptionSeance[]; aujourdhui: string }) {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(changerSeance.bind(null, id), {});
  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-2xl bg-surface p-4">
      <ChoixSeance id={`changer-${id}`} options={options} />
      <Champ id={`date-${id}`} label="À partir du" className="w-48">
        <input id={`date-${id}`} name="date" type="date" defaultValue={aujourdhui} className={classeChamp} />
      </Champ>
      <button type="submit" disabled={enCours} className={boutonNoir}>
        {enCours ? "Un instant…" : "Changer de séance"}
      </button>
      <Erreur message={etat.message} />
    </form>
  );
}

function LigneInscription({
  ins,
  options,
  aujourdhui,
  inactif,
}: {
  ins: InscriptionEnCours;
  options: OptionSeance[];
  aujourdhui: string;
  inactif: boolean;
}) {
  const [mode, setMode] = useState<"terminer" | "changer" | null>(null);
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-pastel-lavande/60 px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-sm font-semibold">{ins.libelle}</p>
          <p className="text-[13px] text-encre-douce">depuis le {ins.depuis}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={inactif}
            onClick={() => setMode(mode === "changer" ? null : "changer")}
            aria-expanded={mode === "changer"}
            className={petitBouton}
          >
            Changer
          </button>
          <button
            type="button"
            onClick={() => setMode(mode === "terminer" ? null : "terminer")}
            aria-expanded={mode === "terminer"}
            className={petitBouton}
          >
            Terminer
          </button>
        </div>
      </div>
      {mode === "terminer" && <PanneauTerminer id={ins.id} aujourdhui={aujourdhui} />}
      {mode === "changer" && <PanneauChanger id={ins.id} options={options} aujourdhui={aujourdhui} />}
    </div>
  );
}

function AjoutSeance({
  idParticipant,
  options,
  aujourdhui,
  inactif,
}: {
  idParticipant: string;
  options: OptionSeance[];
  aujourdhui: string;
  inactif: boolean;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(
    ajouterSeance.bind(null, idParticipant),
    {},
  );

  // Ajout réussi → on referme le panneau
  const [etatVu, setEtatVu] = useState(etat);
  if (etat !== etatVu) {
    setEtatVu(etat);
    if (etat.ok) setOuvert(false);
  }

  if (!ouvert) {
    return (
      <button
        type="button"
        disabled={inactif || options.length === 0}
        onClick={() => setOuvert(true)}
        className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-dashed border-encre/30 px-4 text-sm font-semibold transition hover:border-encre disabled:pointer-events-none disabled:opacity-40"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        Ajouter une séance
      </button>
    );
  }

  return (
    <form action={action} className="flex flex-wrap items-end gap-3 rounded-2xl border border-bordure bg-surface-douce p-4">
      <ChoixSeance id="ajout-seance" options={options} />
      <Champ id="ajout-date" label="À partir du" className="w-48">
        <input id="ajout-date" name="date" type="date" defaultValue={aujourdhui} className={classeChamp} />
      </Champ>
      <button type="submit" disabled={enCours} className={boutonNoir}>
        {enCours ? "Un instant…" : "Ajouter"}
      </button>
      <button type="button" onClick={() => setOuvert(false)} className="h-12 px-2 text-sm font-semibold text-encre-douce hover:text-encre">
        Annuler
      </button>
      <Erreur message={etat.message} />
    </form>
  );
}

export default function GestionInscriptions({
  idParticipant,
  enCours,
  options,
  aujourdhui,
  inactif,
}: {
  idParticipant: string;
  enCours: InscriptionEnCours[];
  options: OptionSeance[];
  aujourdhui: string;
  inactif: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      {inactif && (
        <p className="rounded-2xl bg-neutre-fond px-4 py-3 text-[13px] font-medium text-neutre">
          Participant inactif : réactivez-le (bouton Modifier) pour ajouter ou changer une séance.
        </p>
      )}
      {enCours.length === 0 && <p className="text-sm text-encre-douce">Aucune séance en cours.</p>}
      {enCours.map((ins) => (
        <LigneInscription key={ins.id} ins={ins} options={options} aujourdhui={aujourdhui} inactif={inactif} />
      ))}
      <AjoutSeance idParticipant={idParticipant} options={options} aujourdhui={aujourdhui} inactif={inactif} />
    </div>
  );
}