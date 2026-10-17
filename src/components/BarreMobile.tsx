"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { Ellipsis } from "lucide-react";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";
import { LIENS_ADMIN, estActif } from "@/lib/navigation-admin";
import { cn } from "@/lib/utils";

export default function BarreMobile() {
  const chemin = usePathname();
  const [ouvert, setOuvert] = useState(false);
  const principaux = LIENS_ADMIN.filter((l) => l.mobile);
  const autres = LIENS_ADMIN.filter((l) => !l.mobile);
  const plusActif = autres.some((l) => estActif(l.href, chemin));

  return (
    <MotionConfig reducedMotion="user">
      {/* Panneau « Plus » : les liens qui ne tiennent pas dans la barre */}
      <AnimatePresence>
        {ouvert && (
          <motion.div
            key="panneau-plus"
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-x-3 bottom-24 z-40 flex flex-col gap-1 rounded-carte border border-bordure bg-surface p-2 shadow-carte md:hidden"
          >
            {autres.map(({ href, libelle, icone: Icone, bientot }) =>
              bientot ? (
                <span
                  key={href}
                  className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-encre-pale opacity-60"
                >
                  <Icone className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  {libelle}
                  <span className="ml-auto rounded-full bg-neutre-fond px-2 py-0.5 text-[11px] font-semibold text-neutre">
                    Bientôt
                  </span>
                </span>
              ) : (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOuvert(false)}
                  aria-current={estActif(href, chemin) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium",
                    estActif(href, chemin) ? "bg-encre text-white" : "text-encre hover:bg-muted",
                  )}
                >
                  <Icone className="size-[18px]" strokeWidth={1.8} aria-hidden />
                  {libelle}
                </Link>
              ),
            )}
            <BoutonDeconnexion className="mt-1 w-full" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre du bas */}
      <nav
        aria-label="Menu mobile"
        className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-full border border-bordure bg-surface/85 p-2 shadow-carte backdrop-blur-xl md:hidden"
      >
        {principaux.map(({ href, libelle, court, icone: Icone }) => {
          const actif = estActif(href, chemin);
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setOuvert(false)}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
                actif ? "text-encre" : "text-encre-pale",
              )}
            >
              <span className="relative flex size-9 items-center justify-center rounded-full">
                {actif && (
                  <motion.span
                    layoutId="barre-mobile-actif"
                    className="absolute inset-0 rounded-full bg-encre"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icone
                  className={cn("relative size-[18px]", actif && "text-white")}
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              {court ?? libelle}
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setOuvert((o) => !o)}
          aria-expanded={ouvert}
          className={cn(
            "flex min-h-12 min-w-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold",
            ouvert || plusActif ? "text-encre" : "text-encre-pale",
          )}
        >
          <span
            className={cn(
              "flex size-9 items-center justify-center rounded-full transition-colors duration-300",
              (ouvert || plusActif) && "bg-encre text-white",
            )}
          >
            <Ellipsis className="size-[18px]" strokeWidth={1.8} aria-hidden />
          </span>
          Plus
        </button>
      </nav>
    </MotionConfig>
  );
}