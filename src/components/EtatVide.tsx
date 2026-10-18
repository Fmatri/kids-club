import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export default function EtatVide({ icone: Icone, couleur }: { icone: LucideIcon; couleur: string }) {
  return (
    <div className="apparition flex flex-col items-center gap-4 rounded-carte border border-bordure bg-surface px-6 py-16 text-center shadow-carte [animation-delay:120ms]">
      <span className={cn("flex size-16 items-center justify-center rounded-full", couleur)}>
        <Icone className="size-7" strokeWidth={1.6} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <p className="text-lg font-semibold">Bientôt ici</p>
        <p className="max-w-sm text-sm text-encre-douce">
          Ce module sera construit à la phase 5. La page est prête, le menu y mène déjà.
        </p>
      </div>
    </div>
  );
}