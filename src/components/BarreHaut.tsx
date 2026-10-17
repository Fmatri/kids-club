import Link from "next/link";
import { Plus, Search } from "lucide-react";

export default function BarreHaut() {
  return (
    <header className="sticky top-0 z-30 -mx-4 flex items-center gap-3 bg-creme/70 px-4 py-4 backdrop-blur-xl backdrop-saturate-150 md:-mx-8 md:px-8 md:py-5">
      <Link
        href="/admin"
        aria-label="Tableau de bord"
        className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-linear-135 from-pastel-rose to-pastel-lavande font-serif text-2xl italic md:hidden"
      >
        P
      </Link>

      {/* Recherche : enverra vers la liste des participants (phase 5) */}
      <form
        action="/admin/participants"
        role="search"
        className="flex h-11 min-w-0 flex-1 items-center gap-2.5 rounded-full border border-bordure bg-surface px-4 text-encre-pale transition-colors focus-within:border-encre md:h-12"
      >
        <Search className="size-[18px] shrink-0" strokeWidth={1.8} aria-hidden />
        <label htmlFor="recherche" className="sr-only">
          Rechercher
        </label>
        <input
          id="recherche"
          name="q"
          type="search"
          placeholder="Rechercher un enfant, un parent…"
          className="w-full min-w-0 bg-transparent text-sm text-encre outline-none placeholder:text-encre-pale"
        />
      </form>

      <Link
        href="/admin/participants/nouveau"
        className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-encre px-4 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px md:h-12 md:px-5"
      >
        <Plus className="size-4" strokeWidth={2} aria-hidden />
        <span className="hidden sm:inline">Nouvelle inscription</span>
        <span className="sm:hidden">Inscrire</span>
      </Link>
    </header>
  );
}