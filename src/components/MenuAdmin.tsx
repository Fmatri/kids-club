"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MotionConfig, motion } from "motion/react";
import { LIENS_ADMIN, estActif } from "@/lib/navigation-admin";
import { cn } from "@/lib/utils";

export default function MenuAdmin() {
  const chemin = usePathname();

  return (
    <MotionConfig reducedMotion="user">
      <nav aria-label="Menu principal" className="flex flex-col gap-1.5">
        {LIENS_ADMIN.map(({ href, libelle, icone: Icone, bientot }) => {
          if (bientot) {
            return (
              <span
                key={href}
                aria-disabled="true"
                className="flex items-center gap-3 rounded-full py-1.5 pr-2.5 pl-1.5 text-sm font-medium text-encre-pale opacity-60"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border border-bordure bg-surface">
                  <Icone className="size-[18px]" strokeWidth={1.8} aria-hidden />
                </span>
                {libelle}
                <span className="ml-auto rounded-full bg-neutre-fond px-2 py-0.5 text-[11px] font-semibold text-neutre">
                  Bientôt
                </span>
              </span>
            );
          }

          const actif = estActif(href, chemin);
          return (
            <Link
              key={href}
              href={href}
              aria-current={actif ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-full py-1.5 pr-2.5 pl-1.5 text-sm transition-colors duration-300",
                actif
                  ? "font-semibold text-encre"
                  : "font-medium text-neutre hover:bg-surface/70 hover:text-encre",
              )}
            >
              <span className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-bordure bg-surface">
                {actif && (
                  <motion.span
                    layoutId="menu-actif"
                    className="absolute -inset-px rounded-full bg-encre"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <Icone
                  className={cn(
                    "relative size-[18px] transition-colors duration-300",
                    actif ? "text-white" : "text-encre",
                  )}
                  strokeWidth={1.8}
                  aria-hidden
                />
              </span>
              {libelle}
            </Link>
          );
        })}
      </nav>
    </MotionConfig>
  );
}