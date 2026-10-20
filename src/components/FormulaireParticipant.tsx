"use client";

import { startTransition, useActionState } from "react";
import Link from "next/link";
import { modifierParticipant, type EtatInscription } from "@/app/admin/participants/actions";
import Champ, { classeChamp } from "@/components/Champ";
import { cn } from "@/lib/utils";

export type ValeursParticipant = {
  id: string;
  type: "enfant" | "adulte";
  prenom: string;
  nom: string;
  dateNaissance: string;
  telephone: string;
  email: string;
  autorisationPhoto: boolean;
  statut: "actif" | "inactif";
  allergies: string;
  remarques: string;
  urgenceNom: string;
  urgenceTelephone: string;
  urgenceLien: string;
  notes: string;
  seancesEnCours: number;
  aujourdhui: string;
};

export default function FormulaireParticipant({ v }: { v: ValeursParticipant }) {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(
    modifierParticipant.bind(null, v.id),
    {},
  );
  const e = etat.erreurs ?? {};

  // onSubmit (et pas action) : le formulaire n'est pas vidé en cas d'erreur
  function envoyer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const donnees = new FormData(ev.currentTarget);
    startTransition(() => action(donnees));
  }

  const carte = "apparition flex flex-col gap-5 rounded-carte border border-bordure bg-surface p-6 shadow-carte md:p-8";

  return (
    <form onSubmit={envoyer} noValidate className="flex max-w-3xl flex-col gap-5">
      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
          {etat.message}
        </p>
      )}

      {/* Identité */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Identité</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="prenom" label="Prénom" erreur={e.prenom}>
            <input id="prenom" name="prenom" defaultValue={v.prenom} aria-invalid={!!e.prenom} className={classeChamp} />
          </Champ>
          <Champ id="nom" label="Nom" erreur={e.nom}>
            <input id="nom" name="nom" defaultValue={v.nom} aria-invalid={!!e.nom} className={classeChamp} />
          </Champ>
          {v.type === "enfant" ? (
            <Champ id="dateNaissance" label="Date de naissance" erreur={e.dateNaissance}>
              <input id="dateNaissance" name="dateNaissance" type="date" max={v.aujourdhui} defaultValue={v.dateNaissance} aria-invalid={!!e.dateNaissance} className={classeChamp} />
            </Champ>
          ) : (
            <>
              <Champ id="telephone" label="Téléphone" erreur={e.telephone}>
                <input id="telephone" name="telephone" type="tel" inputMode="tel" defaultValue={v.telephone} aria-invalid={!!e.telephone} className={classeChamp} />
              </Champ>
              <Champ id="email" label="E-mail" aide="Facultatif" erreur={e.email}>
                <input id="email" name="email" type="email" defaultValue={v.email} aria-invalid={!!e.email} className={classeChamp} />
              </Champ>
            </>
          )}
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="autorisationPhoto" defaultChecked={v.autorisationPhoto} className="size-5 accent-encre" />
          Autorise les photos (galerie du club, réseaux sociaux)
        </label>
      </section>

      {/* Statut */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Statut</h2>
        <Champ
          id="statut"
          label="Le participant fréquente-t-il encore le club ?"
          aide={
            v.statut === "actif" && v.seancesEnCours > 0
              ? `Passer en « Inactif » termine aussi ses ${v.seancesEnCours} séance(s) en cours, à la date d’aujourd’hui. L’historique est gardé.`
              : undefined
          }
          className="max-w-sm"
        >
          <select id="statut" name="statut" defaultValue={v.statut} className={classeChamp}>
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </Champ>
      </section>

      {/* Santé & urgence */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Santé & urgence</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="sante.allergies" label="Allergies" aide="Séparées par des virgules" erreur={e["sante.allergies"]} className="sm:col-span-2">
            <input id="sante.allergies" name="sante.allergies" defaultValue={v.allergies} className={classeChamp} />
          </Champ>
          <Champ id="sante.remarques" label="Remarques santé" erreur={e["sante.remarques"]} className="sm:col-span-2">
            <textarea id="sante.remarques" name="sante.remarques" rows={3} defaultValue={v.remarques} className={cn(classeChamp, "h-auto py-3")} />
          </Champ>
          <Champ id="contactUrgence.nom" label="Contact d’urgence" erreur={e["contactUrgence.nom"]}>
            <input id="contactUrgence.nom" name="contactUrgence.nom" defaultValue={v.urgenceNom} className={classeChamp} />
          </Champ>
          <Champ id="contactUrgence.telephone" label="Téléphone d’urgence" erreur={e["contactUrgence.telephone"]}>
            <input id="contactUrgence.telephone" name="contactUrgence.telephone" type="tel" inputMode="tel" defaultValue={v.urgenceTelephone} aria-invalid={!!e["contactUrgence.telephone"]} className={classeChamp} />
          </Champ>
          <Champ id="contactUrgence.lien" label="Lien" erreur={e["contactUrgence.lien"]}>
            <input id="contactUrgence.lien" name="contactUrgence.lien" defaultValue={v.urgenceLien} className={classeChamp} />
          </Champ>
          <Champ id="notes" label="Notes" erreur={e.notes} className="sm:col-span-2">
            <textarea id="notes" name="notes" rows={3} defaultValue={v.notes} className={cn(classeChamp, "h-auto py-3")} />
          </Champ>
        </div>
      </section>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={enCours}
          className="h-12 rounded-full bg-encre px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Link
          href={`/admin/participants/${v.id}`}
          className="inline-flex h-12 items-center rounded-full border border-bordure bg-surface px-6 text-sm font-semibold"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}