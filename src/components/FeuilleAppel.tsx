"use client";

import { startTransition, useActionState, useState } from "react";
import { MotionConfig, motion } from "motion/react";
import { Check } from "lucide-react";
import { enregistrerAppel, type EtatAppel } from "@/app/admin/appel/actions";
import { cn } from "@/lib/utils";

export type Eleve = { id: string; prenom: string; nom: string; type: "enfant" | "adulte" };

const VERT = "#30b158";
const ROUGE = "#e5484d";

function Interrupteur({ present, label, onClick }: { present: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={present}
      aria-label={label}
      onClick={onClick}
      className="flex h-[32px] w-[56px] shrink-0 rounded-full p-[3px] shadow-[inset_0_1px_3px_rgb(28_25_23/0.15)] transition-colors duration-300 ease-premium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre"
      style={{ backgroundColor: present ? VERT : ROUGE }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn(
          "block size-[26px] rounded-full bg-white shadow-[0_2px_6px_rgb(28_25_23/0.25),0_1px_1px_rgb(28_25_23/0.08)]",
          present && "ml-auto",
        )}
      />
    </button>
  );
}

export default function FeuilleAppel({
  idSeance,
  date,
  eleves,
  absentsInitiaux,
  dejaFait,
}: {
  idSeance: string;
  date: string;
  eleves: Eleve[];
  absentsInitiaux: string[];
  dejaFait: boolean;
}) {
  const [absents, setAbsents] = useState<Set<string>>(() => new Set(absentsInitiaux));
  const [modifie, setModifie] = useState(false);
  const [etat, action, enCours] = useActionState<EtatAppel, FormData>(
    enregistrerAppel.bind(null, idSeance, date),
    {},
  );

  // Après un enregistrement réussi, on repart de « rien de modifié »
  const [etatVu, setEtatVu] = useState(etat);
  if (etat !== etatVu) {
    setEtatVu(etat);
    if (etat.ok) setModifie(false);
  }

  function basculer(id: string) {
    setAbsents((avant) => {
      const apres = new Set(avant);
      if (apres.has(id)) apres.delete(id);
      else apres.add(id);
      return apres;
    });
    setModifie(true);
  }

  function envoyer(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const donnees = new FormData(ev.currentTarget);
    startTransition(() => action(donnees));
  }

  const nbAbsents = absents.size;
  const nbPresents = eleves.length - nbAbsents;
  const enregistre = (dejaFait || etat.ok) && !modifie;

  return (
    <form onSubmit={envoyer} className="flex max-w-3xl flex-col gap-5">
      {/* Seuls les absents sont envoyés au serveur */}
      {[...absents].map((id) => (
        <input key={id} type="hidden" name="absents" value={id} />
      ))}

      {/* Compteur */}
      <div className="apparition flex flex-wrap items-center gap-2 [animation-delay:80ms]">
        <span className="rounded-full px-4 py-2 text-sm font-semibold text-white" style={{ backgroundColor: VERT }}>
          {nbPresents} présent{nbPresents > 1 ? "s" : ""}
        </span>
        <span
          className="rounded-full px-4 py-2 text-sm font-semibold text-white transition-opacity"
          style={{ backgroundColor: ROUGE, opacity: nbAbsents > 0 ? 1 : 0.35 }}
        >
          {nbAbsents} absent{nbAbsents > 1 ? "s" : ""}
        </span>
        {enregistre && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-succes-fond px-4 py-2 text-sm font-semibold text-succes">
            <Check className="size-4" strokeWidth={2.5} aria-hidden />
            Appel enregistré
          </span>
        )}
      </div>

      {/* Liste */}
      <MotionConfig reducedMotion="user">
        <ul className="apparition flex flex-col overflow-hidden rounded-carte border border-bordure bg-surface shadow-carte [animation-delay:140ms]">
          {eleves.map((eleve) => {
            const present = !absents.has(eleve.id);
            return (
              <li
                key={eleve.id}
                className={cn(
                  "flex min-h-16 items-center gap-4 border-t border-bordure px-5 py-3 transition-colors first:border-t-0",
                  !present && "bg-[#fdf1f1]",
                )}
              >
                <span
                  className={cn(
                    "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-bold",
                    eleve.type === "enfant" ? "bg-pastel-lavande" : "bg-pastel-peche",
                  )}
                >
                  {`${eleve.prenom.charAt(0)}${eleve.nom.charAt(0)}`.toUpperCase()}
                </span>
                <span className="min-w-0 flex-1 truncate font-semibold">
                  {eleve.prenom} {eleve.nom}
                </span>
                <span className="hidden text-xs font-semibold sm:inline" style={{ color: present ? "#17603f" : "#b42318" }}>
                  {present ? "Présent" : "Absent"}
                </span>
                <Interrupteur
                  present={present}
                  label={`${eleve.prenom} ${eleve.nom} présent`}
                  onClick={() => basculer(eleve.id)}
                />
              </li>
            );
          })}
        </ul>
      </MotionConfig>

      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
          {etat.message}
        </p>
      )}

      <button
        type="submit"
        disabled={enCours}
        className="h-12 w-fit rounded-full bg-encre px-6 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px disabled:opacity-60"
      >
        {enCours ? "Enregistrement…" : dejaFait || etat.ok ? "Mettre à jour l’appel" : "Enregistrer l’appel"}
      </button>
    </form>
  );
}