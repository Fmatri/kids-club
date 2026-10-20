"use client";

import { startTransition, useActionState } from "react";
import { modifierParent, type EtatParent } from "@/app/admin/parents/actions";
import Champ, { classeChamp } from "@/components/Champ";
import { cn } from "@/lib/utils";

export type ValeursParent = {
  id: string;
  prenom: string;
  nom: string;
  telephone: string;
  whatsapp: string;
  email: string;
  notes: string;
};

export default function FormulaireParent({ v }: { v: ValeursParent }) {
  const [etat, action, enCours] = useActionState<EtatParent, FormData>(modifierParent.bind(null, v.id), {});
  const e = etat.erreurs ?? {};

  function envoyer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const donnees = new FormData(ev.currentTarget);
    startTransition(() => action(donnees));
  }

  return (
    <form
      onSubmit={envoyer}
      noValidate
      className="apparition flex flex-col gap-5 rounded-carte border border-bordure bg-surface p-6 shadow-carte md:p-8"
    >
      <h2 className="text-base font-semibold">Informations</h2>

      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
          {etat.message}
        </p>
      )}
      {etat.ok && (
        <p role="status" className="rounded-2xl bg-succes-fond px-4 py-3 text-sm font-medium text-succes">
          Modifications enregistrées.
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <Champ id="prenom" label="Prénom" erreur={e.prenom}>
          <input id="prenom" name="prenom" defaultValue={v.prenom} aria-invalid={!!e.prenom} className={classeChamp} />
        </Champ>
        <Champ id="nom" label="Nom" erreur={e.nom}>
          <input id="nom" name="nom" defaultValue={v.nom} aria-invalid={!!e.nom} className={classeChamp} />
        </Champ>
        <Champ id="telephone" label="Téléphone" erreur={e.telephone}>
          <input id="telephone" name="telephone" type="tel" inputMode="tel" defaultValue={v.telephone} aria-invalid={!!e.telephone} className={classeChamp} />
        </Champ>
        <Champ id="whatsapp" label="WhatsApp" aide="Si différent du téléphone" erreur={e.whatsapp}>
          <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={v.whatsapp} aria-invalid={!!e.whatsapp} className={classeChamp} />
        </Champ>
        <Champ id="email" label="E-mail" aide="Facultatif" erreur={e.email} className="sm:col-span-2">
          <input id="email" name="email" type="email" defaultValue={v.email} aria-invalid={!!e.email} className={classeChamp} />
        </Champ>
        <Champ id="notes" label="Notes" erreur={e.notes} className="sm:col-span-2">
          <textarea id="notes" name="notes" rows={3} defaultValue={v.notes} className={cn(classeChamp, "h-auto py-3")} />
        </Champ>
      </div>

      <button
        type="submit"
        disabled={enCours}
        className="h-12 w-fit rounded-full bg-encre px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px disabled:opacity-60"
      >
        {enCours ? "Enregistrement…" : "Enregistrer"}
      </button>
    </form>
  );
}