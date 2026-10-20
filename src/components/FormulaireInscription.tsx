"use client";

import { startTransition, useActionState, useState } from "react";
import Link from "next/link";
import { Check } from "lucide-react";
import { creerInscription, type EtatInscription } from "@/app/admin/participants/actions";
import { cn } from "@/lib/utils";

export type ParentExistant = { id: string; nom: string; prenom: string; telephone: string };
export type SeanceChoix = {
  id: string;
  libelle: string;
  public: "enfant" | "adulte";
  places: string;
  complet: boolean;
};

const classeChamp =
  "h-12 w-full rounded-2xl border border-[#e7e0d9] bg-surface px-4 text-[15px] outline-none transition focus:border-encre focus:ring-4 focus:ring-encre/8 aria-invalid:border-attention";

const NOMS_ETAPES: Record<number, string> = { 1: "Identité", 2: "Parents", 3: "Santé & urgence", 4: "Séances" };

// Quelle étape contient ce champ ? (pour y revenir en cas d'erreur)
function etapeDuChamp(cle: string) {
  if (cle.startsWith("parents")) return 2;
  if (cle.startsWith("sante") || cle.startsWith("contactUrgence") || cle === "notes") return 3;
  if (cle === "seances" || cle === "dateDebut") return 4;
  return 1;
}

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

function Segmente<T extends string>({
  label,
  options,
  valeur,
  onChange,
}: {
  label: string;
  options: [T, string][];
  valeur: T;
  onChange: (v: T) => void;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex w-fit gap-1 rounded-full bg-[#f5f0eb] p-1">
      {options.map(([v, libelle]) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={valeur === v}
          onClick={() => onChange(v)}
          className={cn(
            "h-9 rounded-full px-4 text-sm font-semibold transition",
            valeur === v ? "bg-surface shadow-[0_1px_3px_rgb(28_25_23/0.12)]" : "text-encre-douce hover:text-encre",
          )}
        >
          {libelle}
        </button>
      ))}
    </div>
  );
}

function BlocParent({
  index,
  parents,
  erreurs,
}: {
  index: number;
  parents: ParentExistant[];
  erreurs: Record<string, string>;
}) {
  const p = `parents.${index}.`;
  const [mode, setMode] = useState<"nouveau" | "existant">("nouveau");
  const [recherche, setRecherche] = useState("");
  const [choisi, setChoisi] = useState<ParentExistant | null>(null);

  const terme = recherche.trim().toLowerCase();
  const resultats =
    terme.length >= 2
      ? parents
          .filter((x) => `${x.prenom} ${x.nom} ${x.telephone}`.toLowerCase().includes(terme))
          .slice(0, 6)
      : [];

  return (
    <div className="flex flex-col gap-4 rounded-3xl border border-bordure bg-surface-douce p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-semibold">Parent {index + 1}</p>
        <Segmente
          label={`Parent ${index + 1}`}
          options={[
            ["nouveau", "Nouveau"],
            ["existant", "Déjà enregistré"],
          ]}
          valeur={mode}
          onChange={setMode}
        />
      </div>
      <input type="hidden" name={`${p}mode`} value={mode} />

      <Champ id={`${p}lien`} label="Lien avec l’enfant" erreur={erreurs[`${p}lien`]}>
        <select id={`${p}lien`} name={`${p}lien`} defaultValue={index === 0 ? "mere" : "pere"} className={classeChamp}>
          <option value="mere">Mère</option>
          <option value="pere">Père</option>
          <option value="tuteur">Tuteur</option>
        </select>
      </Champ>

      {mode === "existant" ? (
        choisi ? (
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-surface px-4 py-3">
            <input type="hidden" name={`${p}id`} value={choisi.id} />
            <span className="font-semibold">
              {choisi.prenom} {choisi.nom}{" "}
              <span className="font-normal text-encre-douce">· {choisi.telephone}</span>
            </span>
            <button
              type="button"
              onClick={() => setChoisi(null)}
              className="text-sm font-semibold text-encre-douce hover:text-encre"
            >
              Changer
            </button>
          </div>
        ) : (
          <Champ
            id={`${p}recherche`}
            label="Rechercher le parent"
            aide="Au moins 2 lettres du nom, ou quelques chiffres du téléphone"
            erreur={erreurs[`${p}id`]}
          >
            <input
              id={`${p}recherche`}
              value={recherche}
              onChange={(ev) => setRecherche(ev.target.value)}
              autoComplete="off"
              className={classeChamp}
            />
            {resultats.length > 0 && (
              <ul className="flex flex-col gap-1 rounded-2xl border border-bordure bg-surface p-1">
                {resultats.map((x) => (
                  <li key={x.id}>
                    <button
                      type="button"
                      onClick={() => setChoisi(x)}
                      className="w-full rounded-xl px-3 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      <span className="font-semibold">
                        {x.prenom} {x.nom}
                      </span>{" "}
                      · {x.telephone}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Champ>
        )
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Champ id={`${p}prenom`} label="Prénom" erreur={erreurs[`${p}prenom`]}>
            <input id={`${p}prenom`} name={`${p}prenom`} aria-invalid={!!erreurs[`${p}prenom`]} className={classeChamp} />
          </Champ>
          <Champ id={`${p}nom`} label="Nom" erreur={erreurs[`${p}nom`]}>
            <input id={`${p}nom`} name={`${p}nom`} aria-invalid={!!erreurs[`${p}nom`]} className={classeChamp} />
          </Champ>
          <Champ id={`${p}telephone`} label="Téléphone" erreur={erreurs[`${p}telephone`]}>
            <input id={`${p}telephone`} name={`${p}telephone`} type="tel" inputMode="tel" aria-invalid={!!erreurs[`${p}telephone`]} className={classeChamp} />
          </Champ>
          <Champ id={`${p}whatsapp`} label="WhatsApp" aide="Si différent du téléphone" erreur={erreurs[`${p}whatsapp`]}>
            <input id={`${p}whatsapp`} name={`${p}whatsapp`} type="tel" inputMode="tel" aria-invalid={!!erreurs[`${p}whatsapp`]} className={classeChamp} />
          </Champ>
          <Champ id={`${p}email`} label="E-mail" aide="Facultatif" erreur={erreurs[`${p}email`]} className="sm:col-span-2">
            <input id={`${p}email`} name={`${p}email`} type="email" aria-invalid={!!erreurs[`${p}email`]} className={classeChamp} />
          </Champ>
        </div>
      )}
    </div>
  );
}

export default function FormulaireInscription({
  parents,
  seances,
  aujourdhui,
}: {
  parents: ParentExistant[];
  seances: SeanceChoix[];
  aujourdhui: string;
}) {
  const [etat, action, enCours] = useActionState<EtatInscription, FormData>(creerInscription, {});
  const [type, setType] = useState<"enfant" | "adulte">("enfant");
  const [nbParents, setNbParents] = useState<"1" | "2">("1");
  const [etape, setEtape] = useState(1);

  // Après une réponse du serveur avec erreurs : aller à la première étape concernée
  const [etatVu, setEtatVu] = useState(etat);
  if (etat !== etatVu) {
    setEtatVu(etat);
    const cles = Object.keys(etat.erreurs ?? {});
    if (cles.length > 0) setEtape(Math.min(...cles.map(etapeDuChamp)));
  }

  const e = etat.erreurs ?? {};
  const etapes = type === "enfant" ? [1, 2, 3, 4] : [1, 3, 4];
  const position = Math.max(etapes.indexOf(etape), 0);
  const derniere = position === etapes.length - 1;
  const seancesDuType = seances.filter((s) => s.public === type);

  function changerType(v: "enfant" | "adulte") {
    setType(v);
    if (v === "adulte" && etape === 2) setEtape(1);
  }

  function envoyer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    if (!derniere) {
      setEtape(etapes[position + 1]); // « Entrée » = étape suivante
      return;
    }
    const donnees = new FormData(ev.currentTarget);
    startTransition(() => action(donnees));
  }

  const carte = "apparition flex flex-col gap-5 rounded-carte border border-bordure bg-surface p-6 shadow-carte md:p-8";

  return (
    <form onSubmit={envoyer} noValidate className="flex max-w-3xl flex-col gap-5">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="nbParents" value={nbParents} />

      {/* Étapes */}
      <ol className="apparition flex flex-wrap gap-2">
        {etapes.map((n, i) => (
          <li key={n}>
            <button
              type="button"
              onClick={() => setEtape(n)}
              aria-current={etape === n ? "step" : undefined}
              className={cn(
                "inline-flex h-10 items-center gap-2 rounded-full pr-4 pl-1.5 text-sm font-semibold transition",
                etape === n ? "bg-encre text-white" : "border border-bordure bg-surface text-encre-douce",
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full text-xs",
                  etape === n ? "bg-white/20" : "bg-neutre-fond",
                )}
              >
                {i < position ? <Check className="size-3.5" strokeWidth={2.5} aria-hidden /> : i + 1}
              </span>
              {NOMS_ETAPES[n]}
            </button>
          </li>
        ))}
      </ol>

      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
          {etat.message}
        </p>
      )}

      {/* 1. Identité */}
      <section className={cn(carte, etape !== 1 && "hidden")}>
        <Segmente
          label="Type de participant"
          options={[
            ["enfant", "Enfant"],
            ["adulte", "Adulte"],
          ]}
          valeur={type}
          onChange={changerType}
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="prenom" label="Prénom" erreur={e.prenom}>
            <input id="prenom" name="prenom" aria-invalid={!!e.prenom} className={classeChamp} />
          </Champ>
          <Champ id="nom" label="Nom" erreur={e.nom}>
            <input id="nom" name="nom" aria-invalid={!!e.nom} className={classeChamp} />
          </Champ>
          {type === "enfant" ? (
            <Champ id="dateNaissance" label="Date de naissance" erreur={e.dateNaissance}>
              <input id="dateNaissance" name="dateNaissance" type="date" max={aujourdhui} aria-invalid={!!e.dateNaissance} className={classeChamp} />
            </Champ>
          ) : (
            <>
              <Champ id="telephone" label="Téléphone" erreur={e.telephone}>
                <input id="telephone" name="telephone" type="tel" inputMode="tel" aria-invalid={!!e.telephone} className={classeChamp} />
              </Champ>
              <Champ id="email" label="E-mail" aide="Facultatif" erreur={e.email}>
                <input id="email" name="email" type="email" aria-invalid={!!e.email} className={classeChamp} />
              </Champ>
            </>
          )}
        </div>
        <label className="flex items-center gap-3 text-sm font-medium">
          <input type="checkbox" name="autorisationPhoto" className="size-5 accent-encre" />
          Autorise les photos (galerie du club, réseaux sociaux)
        </label>
      </section>

      {/* 2. Parents (enfant) */}
      {type === "enfant" && (
        <section className={cn(carte, etape !== 2 && "hidden")}>
          <Segmente
            label="Nombre de parents"
            options={[
              ["1", "Un parent"],
              ["2", "Deux parents"],
            ]}
            valeur={nbParents}
            onChange={setNbParents}
          />
          {e.parents && (
            <p className="text-[13px] font-medium text-attention">{e.parents}</p>
          )}
          <BlocParent index={0} parents={parents} erreurs={e} />
          {nbParents === "2" && (
            <>
              <BlocParent index={1} parents={parents} erreurs={e} />
              <fieldset className="flex flex-col gap-2">
                <legend className="mb-2 text-[13px] font-semibold">Parent principal (contacté en premier)</legend>
                <div className="flex gap-5">
                  {[0, 1].map((i) => (
                    <label key={i} className="inline-flex items-center gap-2 text-sm font-medium">
                      <input type="radio" name="principal" value={i} defaultChecked={i === 0} className="size-4 accent-encre" />
                      Parent {i + 1}
                    </label>
                  ))}
                </div>
              </fieldset>
            </>
          )}
        </section>
      )}

      {/* 3. Santé & urgence */}
      <section className={cn(carte, etape !== 3 && "hidden")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <Champ id="sante.allergies" label="Allergies" aide="Séparées par des virgules (ex. arachides, latex)" erreur={e["sante.allergies"]} className="sm:col-span-2">
            <input id="sante.allergies" name="sante.allergies" className={classeChamp} />
          </Champ>
          <Champ id="sante.remarques" label="Remarques santé" aide="Facultatif" erreur={e["sante.remarques"]} className="sm:col-span-2">
            <textarea id="sante.remarques" name="sante.remarques" rows={3} className={cn(classeChamp, "h-auto py-3")} />
          </Champ>
          <Champ id="contactUrgence.nom" label="Contact d’urgence" aide="Nom de la personne" erreur={e["contactUrgence.nom"]}>
            <input id="contactUrgence.nom" name="contactUrgence.nom" className={classeChamp} />
          </Champ>
          <Champ id="contactUrgence.telephone" label="Téléphone d’urgence" erreur={e["contactUrgence.telephone"]}>
            <input id="contactUrgence.telephone" name="contactUrgence.telephone" type="tel" inputMode="tel" aria-invalid={!!e["contactUrgence.telephone"]} className={classeChamp} />
          </Champ>
          <Champ id="contactUrgence.lien" label="Lien" aide="Ex. grand-mère, voisin" erreur={e["contactUrgence.lien"]}>
            <input id="contactUrgence.lien" name="contactUrgence.lien" className={classeChamp} />
          </Champ>
          <Champ id="notes" label="Notes" aide="Facultatif" erreur={e.notes} className="sm:col-span-2">
            <textarea id="notes" name="notes" rows={3} className={cn(classeChamp, "h-auto py-3")} />
          </Champ>
        </div>
      </section>

      {/* 4. Séances */}
      <section className={cn(carte, etape !== 4 && "hidden")}>
        <div className="flex flex-col gap-2">
          <p className="text-[13px] font-semibold">Séance(s)</p>
          {seancesDuType.length === 0 && (
            <p className="text-sm text-encre-douce">Aucune séance active pour ce public.</p>
          )}
          <div className="grid gap-3 sm:grid-cols-2">
            {seancesDuType.map((s) => (
              <label
                key={s.id}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-2xl border border-bordure bg-surface-douce px-4 py-3 transition has-checked:border-encre has-checked:bg-pastel-lavande/50",
                  s.complet && "cursor-not-allowed opacity-50",
                )}
              >
                <input type="checkbox" name="seances" value={s.id} disabled={s.complet} className="size-5 accent-encre" />
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">{s.libelle}</span>
                  <span className="text-xs text-encre-douce">{s.complet ? "Complet" : s.places}</span>
                </span>
              </label>
            ))}
          </div>
          {e.seances && <p className="text-[13px] font-medium text-attention">{e.seances}</p>}
        </div>
        <Champ id="dateDebut" label="Date de début" erreur={e.dateDebut} className="max-w-xs">
          <input id="dateDebut" name="dateDebut" type="date" defaultValue={aujourdhui} aria-invalid={!!e.dateDebut} className={classeChamp} />
        </Champ>
      </section>

      {/* Navigation */}
      <div className="flex flex-wrap items-center gap-3">
        {position > 0 && (
          <button
            type="button"
            onClick={() => setEtape(etapes[position - 1])}
            className="h-12 rounded-full border border-bordure bg-surface px-6 text-sm font-semibold"
          >
            Précédent
          </button>
        )}
        <button
          type="submit"
          disabled={enCours}
          className="h-12 rounded-full bg-encre px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px disabled:opacity-60"
        >
          {derniere ? (enCours ? "Enregistrement…" : "Enregistrer l’inscription") : "Suivant"}
        </button>
        <Link href="/admin/participants" className="ml-auto text-sm font-semibold text-encre-douce hover:text-encre">
          Annuler
        </Link>
      </div>
    </form>
  );
}