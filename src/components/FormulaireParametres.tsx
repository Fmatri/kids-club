"use client";

import { startTransition, useActionState } from "react";
import { enregistrerParametres, type EtatParametres } from "@/app/admin/parametres/actions";
import Champ, { classeChamp } from "@/components/Champ";

export type ValeursParametres = {
  nomClub: string;
  adresse: string;
  lienCarte: string;
  telephone: string;
  whatsapp: string;
  email: string;
  facebook: string;
  instagram: string;
};

export default function FormulaireParametres({ v }: { v: ValeursParametres }) {
  const [etat, action, enCours] = useActionState<EtatParametres, FormData>(enregistrerParametres, {});
  const e = etat.erreurs ?? {};

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
      {etat.ok && (
        <p role="status" className="rounded-2xl bg-succes-fond px-4 py-3 text-sm font-medium text-succes">
          Paramètres enregistrés.
        </p>
      )}

      <section className={carte}>
        <h2 className="text-base font-semibold">Le club</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="nomClub" label="Nom du club" erreur={e.nomClub} className="sm:col-span-2">
            <input id="nomClub" name="nomClub" defaultValue={v.nomClub} aria-invalid={!!e.nomClub} className={classeChamp} />
          </Champ>
          <Champ id="adresse" label="Adresse" erreur={e.adresse} className="sm:col-span-2">
            <input id="adresse" name="adresse" defaultValue={v.adresse} className={classeChamp} />
          </Champ>
          <Champ
            id="lienCarte"
            label="Lien Google Maps"
            aide="Dans Google Maps : Partager → Copier le lien"
            erreur={e.lienCarte}
            className="sm:col-span-2"
          >
            <input id="lienCarte" name="lienCarte" type="url" defaultValue={v.lienCarte} aria-invalid={!!e.lienCarte} className={classeChamp} />
          </Champ>
        </div>
      </section>

      <section className={carte}>
        <h2 className="text-base font-semibold">Contact</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="telephone" label="Téléphone" erreur={e.telephone}>
            <input id="telephone" name="telephone" type="tel" inputMode="tel" defaultValue={v.telephone} aria-invalid={!!e.telephone} className={classeChamp} />
          </Champ>
          <Champ id="whatsapp" label="WhatsApp" aide="Si différent du téléphone" erreur={e.whatsapp}>
            <input id="whatsapp" name="whatsapp" type="tel" inputMode="tel" defaultValue={v.whatsapp} aria-invalid={!!e.whatsapp} className={classeChamp} />
          </Champ>
          <Champ id="email" label="E-mail" erreur={e.email} className="sm:col-span-2">
            <input id="email" name="email" type="email" defaultValue={v.email} aria-invalid={!!e.email} className={classeChamp} />
          </Champ>
        </div>
      </section>

      <section className={carte}>
        <h2 className="text-base font-semibold">Réseaux sociaux</h2>
        <div className="grid gap-5">
          <Champ id="reseauxSociaux.facebook" label="Page Facebook" aide="Adresse complète, commençant par https://" erreur={e["reseauxSociaux.facebook"]}>
            <input id="reseauxSociaux.facebook" name="reseauxSociaux.facebook" type="url" placeholder="https://www.facebook.com/…" defaultValue={v.facebook} aria-invalid={!!e["reseauxSociaux.facebook"]} className={classeChamp} />
          </Champ>
          <Champ id="reseauxSociaux.instagram" label="Compte Instagram" aide="Adresse complète, commençant par https://" erreur={e["reseauxSociaux.instagram"]}>
            <input id="reseauxSociaux.instagram" name="reseauxSociaux.instagram" type="url" placeholder="https://www.instagram.com/…" defaultValue={v.instagram} aria-invalid={!!e["reseauxSociaux.instagram"]} className={classeChamp} />
          </Champ>
        </div>
      </section>

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