"use client";

import { useActionState } from "react";
import Link from "next/link";
import { enregistrerSeance, type EtatFormulaire } from "@/app/admin/seances/actions";
import { cn } from "@/lib/utils";

export type ValeursSeance = {
  id?: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
  public: string;
  tarif: string;
  capacite: string;
  animateur: string;
};

const JOURS: [string, string][] = [
  ["1", "Lundi"],
  ["2", "Mardi"],
  ["3", "Mercredi"],
  ["4", "Jeudi"],
  ["5", "Vendredi"],
  ["6", "Samedi"],
  ["7", "Dimanche"],
];

const classeChamp =
  "h-12 w-full rounded-2xl border border-[#e7e0d9] bg-surface px-4 text-[15px] outline-none transition focus:border-encre focus:ring-4 focus:ring-encre/8 aria-invalid:border-attention";

function Champ({
  id,
  label,
  aide,
  erreur,
  className,
  children,
}: {
  id: string;
  label: string;
  aide?: string;
  erreur?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {erreur ? (
        <p className="text-[13px] font-medium text-attention">{erreur}</p>
      ) : aide ? (
        <p className="text-[13px] text-encre-pale">{aide}</p>
      ) : null}
    </div>
  );
}

export default function FormulaireSeance({ initial }: { initial: ValeursSeance }) {
  const [etat, action, enCours] = useActionState<EtatFormulaire, FormData>(enregistrerSeance, {});
  const v = { ...initial, ...etat.valeurs };
  const e = etat.erreurs ?? {};

  return (
    <form
      action={action}
      noValidate
      className="apparition flex max-w-2xl flex-col gap-6 rounded-carte border border-bordure bg-surface p-6 shadow-carte md:p-8"
    >
      {initial.id && <input type="hidden" name="id" value={initial.id} />}

      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
          {etat.message}
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Champ id="jour" label="Jour" erreur={e.jour}>
          <select id="jour" name="jour" defaultValue={v.jour} aria-invalid={!!e.jour} className={classeChamp}>
            {JOURS.map(([valeur, nom]) => (
              <option key={valeur} value={valeur}>
                {nom}
              </option>
            ))}
          </select>
        </Champ>

        <Champ id="public" label="Public" erreur={e.public}>
          <select id="public" name="public" defaultValue={v.public} aria-invalid={!!e.public} className={classeChamp}>
            <option value="enfant">Enfants</option>
            <option value="adulte">Adultes</option>
          </select>
        </Champ>

        <Champ id="heureDebut" label="Heure de début" erreur={e.heureDebut}>
          <input id="heureDebut" name="heureDebut" type="time" defaultValue={v.heureDebut} aria-invalid={!!e.heureDebut} className={classeChamp} />
        </Champ>

        <Champ id="heureFin" label="Heure de fin" erreur={e.heureFin}>
          <input id="heureFin" name="heureFin" type="time" defaultValue={v.heureFin} aria-invalid={!!e.heureFin} className={classeChamp} />
        </Champ>

        <Champ id="tarif" label="Tarif mensuel (DT)" erreur={e.tarif}>
          <input id="tarif" name="tarif" inputMode="decimal" defaultValue={v.tarif} aria-invalid={!!e.tarif} className={classeChamp} />
        </Champ>

        <Champ id="capacite" label="Capacité (places)" aide="Vide = pas de limite" erreur={e.capacite}>
          <input id="capacite" name="capacite" inputMode="numeric" defaultValue={v.capacite} aria-invalid={!!e.capacite} className={classeChamp} />
        </Champ>

        <Champ id="animateur" label="Animateur" aide="Facultatif" erreur={e.animateur} className="sm:col-span-2">
          <input id="animateur" name="animateur" defaultValue={v.animateur} aria-invalid={!!e.animateur} className={classeChamp} />
        </Champ>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="h-12 rounded-full bg-encre px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link
          href="/admin/seances"
          className="inline-flex h-12 items-center rounded-full border border-bordure bg-surface px-6 text-sm font-semibold"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}