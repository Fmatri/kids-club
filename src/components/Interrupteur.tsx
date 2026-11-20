"use client";

import { startTransition, useActionState, useOptimistic } from "react";
import { MotionConfig, motion } from "motion/react";
import { cn } from "@/lib/utils";

type Etat = { message?: string };

// Interrupteur iOS générique : on lui donne l'action serveur à exécuter
export default function Interrupteur({
  actif,
  action,
  label,
  texteActif,
  texteInactif,
}: {
  actif: boolean;
  action: () => Promise<Etat>;
  label: string;
  texteActif: string;
  texteInactif: string;
}) {
  const [etat, executer, enCours] = useActionState<Etat, void>(() => action(), {});
  // Position affichée tout de suite, corrigée si le serveur refuse
  const [affiche, setAffiche] = useOptimistic(actif);

  function basculer() {
    startTransition(() => {
      setAffiche(!affiche);
      executer();
    });
  }

  return (
    <div className="relative z-10 flex flex-col gap-3 border-t border-encre/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-semibold">{affiche ? texteActif : texteInactif}</span>
        <MotionConfig reducedMotion="user">
          <button
            type="button"
            role="switch"
            aria-checked={affiche}
            aria-label={label}
            onClick={basculer}
            disabled={enCours}
            className={cn(
              "flex h-[30px] w-[52px] shrink-0 rounded-full p-[3px] shadow-[inset_0_1px_3px_rgb(28_25_23/0.15)] transition-colors duration-300 ease-premium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre disabled:cursor-wait",
              affiche ? "bg-encre" : "bg-[#e9e3dd]",
            )}
          >
            <motion.span
              layout
              transition={{ type: "spring", stiffness: 500, damping: 32 }}
              className={cn(
                "block size-6 rounded-full bg-white shadow-[0_2px_6px_rgb(28_25_23/0.25),0_1px_1px_rgb(28_25_23/0.08)]",
                affiche && "ml-auto",
              )}
            />
          </button>
        </MotionConfig>
      </div>

      {etat.message && (
        <p role="alert" className="rounded-2xl bg-attention-fond px-3 py-2 text-[13px] font-medium text-attention">
          {etat.message}
        </p>
      )}
    </div>
  );
}