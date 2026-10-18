import Link from "next/link";
import { Pencil, Users } from "lucide-react";
import InterrupteurSeance from "@/components/InterrupteurSeance";
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
  const horaire = `${formatHeure(seance.heureDebut)} – ${formatHeure(seance.heureFin)}`;

  return (
    <article
      className={cn(
        "group apparition relative flex flex-col gap-5 rounded-carte p-5 shadow-carte transition duration-300 ease-premium hover:-translate-y-[3px] hover:shadow-carte-survol",
        !seance.active
          ? "border border-bordure bg-surface"
          : seance.public === "enfant"
            ? "bg-linear-145 from-pastel-lavande to-[#ebe6fb]"
            : "bg-linear-145 from-pastel-peche to-[#fcebd9]",
      )}
      style={{ animationDelay: `${delai}ms` }}
    >
      {/* Lien invisible qui recouvre toute la carte → page de modification */}
      <Link
        href={`/admin/seances/${seance.id}`}
        className="absolute inset-0 rounded-carte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre"
      >
        <span className="sr-only">Modifier la séance {horaire}</span>
      </Link>

      <div className={cn("pointer-events-none relative flex items-start justify-between gap-3", !seance.active && "opacity-60")}>
        <div>
          <p className="text-2xl font-semibold tracking-tight">{horaire}</p>
          <p className="mt-1 text-sm text-encre-douce">
            {seance.animateur ? `Avec ${seance.animateur}` : "Arts plastiques"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-white/70 opacity-0 transition group-hover:opacity-100">
            <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          </span>
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">
            {seance.public === "enfant" ? "Enfants" : "Adultes"}
          </span>
        </div>
      </div>

      <div className={cn("pointer-events-none relative flex flex-wrap items-center gap-2 text-sm", !seance.active && "opacity-60")}>
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

      <InterrupteurSeance id={seance.id} active={seance.active} />
    </article>
  );
}