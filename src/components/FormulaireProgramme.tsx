"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { enregistrerProgramme, type EtatProgramme } from "@/app/admin/programmes/actions";
import Champ, { classeChamp } from "@/components/Champ";
import { cn } from "@/lib/utils";

export type Formule = { nom: string; prix: string; description: string };
export type ValeursProgramme = {
  id: string | null;
  type: string;
  titre: string;
  description: string;
  activites: string;
  dateDebut: string;
  dateFin: string;
  horaires: string;
  ageMin: string;
  ageMax: string;
  capacite: string;
  formules: Formule[];
  publie: boolean;
};

export default function FormulaireProgramme({ v }: { v: ValeursProgramme }) {
  const [etat, action, enCours] = useActionState<EtatProgramme, FormData>(
    enregistrerProgramme.bind(null, v.id),
    {},
  );
  const e = etat.erreurs ?? {};

  // Lignes de formules (chacune avec une clé fixe pour React)
  const [lignes, setLignes] = useState(() =>
    (v.formules.length > 0 ? v.formules : [{ nom: "", prix: "", description: "" }]).map((f, i) => ({ ...f, cle: i })),
  );
  const [prochaineCle, setProchaineCle] = useState(() => Math.max(v.formules.length, 1));

  function ajouterFormule() {
    setLignes((avant) => [...avant, { nom: "", prix: "", description: "", cle: prochaineCle }]);
    setProchaineCle((c) => c + 1);
  }
  function retirerFormule(cle: number) {
    setLignes((avant) => avant.filter((l) => l.cle !== cle));
  }

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

      {/* 1. Le programme */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Le programme</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="type" label="Type" erreur={e.type}>
            <select id="type" name="type" defaultValue={v.type} className={classeChamp}>
              <option value="stage">Stage</option>
              <option value="club_vacances">Club de vacances</option>
              <option value="atelier">Atelier</option>
              <option value="evenement">Événement</option>
            </select>
          </Champ>
          <Champ id="titre" label="Titre" erreur={e.titre}>
            <input id="titre" name="titre" defaultValue={v.titre} aria-invalid={!!e.titre} className={classeChamp} />
          </Champ>
          <Champ id="description" label="Description" aide="Affichée sur le site vitrine" erreur={e.description} className="sm:col-span-2">
            <textarea id="description" name="description" rows={5} defaultValue={v.description} className={cn(classeChamp, "h-auto py-3")} />
          </Champ>
          <Champ id="activites" label="Activités" aide="Séparées par des virgules (ex. peinture, argile, origami)" erreur={e.activites} className="sm:col-span-2">
            <input id="activites" name="activites" defaultValue={v.activites} className={classeChamp} />
          </Champ>
        </div>
      </section>

      {/* 2. Dates & public */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Dates & public</h2>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="dateDebut" label="Date de début" erreur={e.dateDebut}>
            <input id="dateDebut" name="dateDebut" type="date" defaultValue={v.dateDebut} aria-invalid={!!e.dateDebut} className={classeChamp} />
          </Champ>
          <Champ id="dateFin" label="Date de fin" erreur={e.dateFin}>
            <input id="dateFin" name="dateFin" type="date" defaultValue={v.dateFin} aria-invalid={!!e.dateFin} className={classeChamp} />
          </Champ>
          <Champ id="horaires" label="Horaires" aide="Ex. Lun.–Ven., 8h00–15h00" erreur={e.horaires} className="sm:col-span-2">
            <input id="horaires" name="horaires" defaultValue={v.horaires} className={classeChamp} />
          </Champ>
          <Champ id="ageMin" label="Âge minimum" aide="Facultatif" erreur={e.ageMin}>
            <input id="ageMin" name="ageMin" inputMode="numeric" defaultValue={v.ageMin} aria-invalid={!!e.ageMin} className={classeChamp} />
          </Champ>
          <Champ id="ageMax" label="Âge maximum" aide="Facultatif" erreur={e.ageMax}>
            <input id="ageMax" name="ageMax" inputMode="numeric" defaultValue={v.ageMax} aria-invalid={!!e.ageMax} className={classeChamp} />
          </Champ>
          <Champ id="capacite" label="Capacité (places)" aide="Vide = pas de limite" erreur={e.capacite}>
            <input id="capacite" name="capacite" inputMode="numeric" defaultValue={v.capacite} aria-invalid={!!e.capacite} className={classeChamp} />
          </Champ>
        </div>
      </section>

      {/* 3. Formules de prix */}
      <section className={carte}>
        <h2 className="text-base font-semibold">Formules de prix</h2>
        {e.formules && <p className="text-[13px] font-medium text-attention">{e.formules}</p>}

        <div className="flex flex-col gap-3">
          {lignes.map((l, i) => (
            <div key={l.cle} className="grid gap-3 rounded-2xl bg-surface-douce p-4 sm:grid-cols-[1fr_8rem_auto]">
              <Champ id={`formuleNom-${l.cle}`} label={`Formule ${i + 1}`}>
                <input id={`formuleNom-${l.cle}`} name="formuleNom" defaultValue={l.nom} placeholder="Ex. Semaine" className={classeChamp} />
              </Champ>
              <Champ id={`formulePrix-${l.cle}`} label="Prix (DT)">
                <input id={`formulePrix-${l.cle}`} name="formulePrix" inputMode="decimal" defaultValue={l.prix} className={classeChamp} />
              </Champ>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => retirerFormule(l.cle)}
                  disabled={lignes.length === 1}
                  aria-label={`Retirer la formule ${i + 1}`}
                  className="flex size-12 items-center justify-center rounded-full border border-bordure bg-surface transition hover:-translate-y-px disabled:pointer-events-none disabled:opacity-30"
                >
                  <X className="size-4" strokeWidth={2} aria-hidden />
                </button>
              </div>
              <Champ id={`formuleDescription-${l.cle}`} label="Description" className="sm:col-span-3">
                <input
                  id={`formuleDescription-${l.cle}`}
                  name="formuleDescription"
                  defaultValue={l.description}
                  placeholder="Ex. du lundi au vendredi, 8h–15h"
                  className={classeChamp}
                />
              </Champ>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={ajouterFormule}
          className="inline-flex h-10 w-fit items-center gap-2 rounded-full border border-dashed border-encre/30 px-4 text-sm font-semibold transition hover:border-encre"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Ajouter une formule
        </button>
      </section>

      {/* 4. Publication */}
      <section className={carte}>
        <label className="flex items-center gap-3 text-sm font-semibold">
          <input type="checkbox" name="publieSurLeSite" defaultChecked={v.publie} className="size-5 accent-encre" />
          Publier sur le site vitrine
        </label>
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
          href="/admin/programmes"
          className="inline-flex h-12 items-center rounded-full border border-bordure bg-surface px-6 text-sm font-semibold"
        >
          Annuler
        </Link>
      </div>
    </form>
  );
}