import Link from "next/link";
import { Pencil, Users } from "lucide-react";
import { formatDinars, formatHeure, pluriel } from "@/lib/format";
import { cn } from "@/lib/utils";

export type DonneesSeance = {
  id: string;
  heureDebut: string;
  heureFin: string;
  public: "enfant" | "adulte";
  tarifMensuel: number;
  capacite: number | null;
  animateur: string | null;
  inscrits: number;
  active: boolean;
};

export default function CarteSeance({ seance, delai }: { seance: DonneesSeance; delai: number }) {
  const complet = seance.capacite != null && seance.inscrits >= seance.capacite;
  const texteInscrits =
    seance.capacite != null
      ? `${seance.inscrits} / ${seance.capacite} places`
      : pluriel(seance.inscrits, "inscrit");

  return (
    <Link
      href={`/admin/seances/${seance.id}`}
      className={cn(
        "group apparition flex flex-col gap-5 rounded-carte p-5 shadow-carte transition duration-300 ease-premium hover:-translate-y-[3px] hover:shadow-carte-survol",
        !seance.active
          ? "border border-bordure bg-surface opacity-70"
          : seance.public === "enfant"
            ? "bg-linear-145 from-pastel-lavande to-[#ebe6fb]"
            : "bg-linear-145 from-pastel-peche to-[#fcebd9]",
      )}
      style={{ animationDelay: `${delai}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold tracking-tight">
            {formatHeure(seance.heureDebut)} – {formatHeure(seance.heureFin)}
          </p>
          <p className="mt-1 text-sm text-encre-douce">
            {seance.animateur ? `Avec ${seance.animateur}` : "Arts plastiques"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
            {seance.public === "enfant" ? "Enfants" : "Adultes"}
          </span>
          <span className="flex size-8 items-center justify-center rounded-full bg-white/70 opacity-0 transition group-hover:opacity-100">
            <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
            <span className="sr-only">Modifier</span>
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/70 px-3 py-1.5 font-medium">
          <Users className="size-4" strokeWidth={1.8} aria-hidden />
          {texteInscrits}
        </span>
        <span className="rounded-full bg-white/70 px-3 py-1.5 font-medium">
          {formatDinars(seance.tarifMensuel)} / mois
        </span>
        {complet && (
          <span className="rounded-full bg-attention-fond px-3 py-1.5 font-semibold text-attention">
            Complet
          </span>
        )}
      </div>
    </Link>
  );
}