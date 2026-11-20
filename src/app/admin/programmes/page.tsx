import Link from "next/link";
import { Pencil, Plus } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import Interrupteur from "@/components/Interrupteur";
import { basculerPublication } from "@/app/admin/programmes/actions";
import { aujourdhuiTexte } from "@/lib/appel";
import { connectDB } from "@/lib/db";
import { formatDate, formatDinars, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Programme } from "@/models/Programme";

const TYPES = {
  stage: { nom: "Stage", fond: "from-pastel-lavande to-[#ebe6fb]" },
  club_vacances: { nom: "Club de vacances", fond: "from-pastel-menthe to-[#ddf4ea]" },
  atelier: { nom: "Atelier", fond: "from-pastel-peche to-[#fcebd9]" },
  evenement: { nom: "Événement", fond: "from-pastel-rose to-[#fbe1e2]" },
} as const;

type DonneesProgramme = {
  id: string;
  type: keyof typeof TYPES;
  titre: string;
  periode: string;
  ages: string | null;
  prix: string | null;
  publie: boolean;
  passe: boolean;
};

function CarteProgramme({ p, delai }: { p: DonneesProgramme; delai: number }) {
  return (
    <article
      className={cn(
        "group apparition relative flex flex-col gap-4 rounded-carte p-5 shadow-carte transition duration-300 ease-premium hover:-translate-y-[3px] hover:shadow-carte-survol",
        p.passe ? "border border-bordure bg-surface" : `bg-linear-145 ${TYPES[p.type].fond}`,
      )}
      style={{ animationDelay: `${delai}ms` }}
    >
      {/* Lien invisible sur toute la carte → modification */}
      <Link
        href={`/admin/programmes/${p.id}`}
        className="absolute inset-0 rounded-carte focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-encre"
      >
        <span className="sr-only">Modifier {p.titre}</span>
      </Link>

      <div className={cn("pointer-events-none relative flex flex-col gap-3", p.passe && "opacity-60")}>
        <div className="flex items-center justify-between gap-2">
          <span className="rounded-full bg-white/70 px-3 py-1 text-xs font-semibold">{TYPES[p.type].nom}</span>
          <span className="flex size-8 items-center justify-center rounded-full bg-white/70 opacity-0 transition group-hover:opacity-100">
            <Pencil className="size-3.5" strokeWidth={2} aria-hidden />
          </span>
        </div>
        <h3 className="text-xl leading-tight font-semibold tracking-tight">{p.titre}</h3>
        <p className="text-sm text-encre-douce">{p.periode}</p>
        <div className="flex flex-wrap gap-2 text-sm">
          {p.ages && <span className="rounded-full bg-white/70 px-3 py-1.5 font-medium">{p.ages}</span>}
          {p.prix && <span className="rounded-full bg-white/70 px-3 py-1.5 font-medium">{p.prix}</span>}
        </div>
      </div>

      <Interrupteur
        actif={p.publie}
        action={basculerPublication.bind(null, p.id)}
        label={`Publier « ${p.titre} » sur le site`}
        texteActif="Publié sur le site"
        texteInactif="Non publié"
      />
    </article>
  );
}

export default async function PageProgrammes() {
  await exigerAdmin();
  await connectDB();

  const jour = new Date(aujourdhuiTexte());
  const programmes = await Programme.find().sort({ dateDebut: 1 }).lean();

  const versDonnees = (p: (typeof programmes)[number]): DonneesProgramme => {
    const prixMin = p.formules.length > 0 ? Math.min(...p.formules.map((f) => f.prix)) : null;
    const memeJour = p.dateDebut.getTime() === p.dateFin.getTime();
    let ages: string | null = null;
    if (p.ageMin != null && p.ageMax != null) ages = `${p.ageMin} – ${p.ageMax} ans`;
    else if (p.ageMin != null) ages = `Dès ${p.ageMin} ans`;
    else if (p.ageMax != null) ages = `Jusqu’à ${p.ageMax} ans`;
    return {
      id: String(p._id),
      type: p.type,
      titre: p.titre,
      periode: memeJour ? `Le ${formatDate(p.dateDebut)}` : `Du ${formatDate(p.dateDebut)} au ${formatDate(p.dateFin)}`,
      ages,
      prix: prixMin != null ? `${p.formules.length > 1 ? "dès " : ""}${formatDinars(prixMin)}` : null,
      publie: p.publieSurLeSite,
      passe: p.dateFin < jour,
    };
  };

  const aVenir = programmes.filter((p) => p.dateFin >= jour).map(versDonnees);
  const passes = programmes
    .filter((p) => p.dateFin < jour)
    .reverse()
    .map(versDonnees);
  const publies = programmes.filter((p) => p.publieSurLeSite).length;

  return (
    <>
      <EnTetePage
        titre="Stages &"
        accent="événements"
        description={`${pluriel(programmes.length, "programme")} · ${publies} publié${publies > 1 ? "s" : ""} sur le site`}
      />

      <div className="apparition -mt-3 mb-7 [animation-delay:80ms]">
        <Link
          href="/admin/programmes/nouveau"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-encre px-5 text-sm font-semibold text-white shadow-[0_8px_20px_-10px_rgb(28_25_23/0.6)] transition hover:-translate-y-px"
        >
          <Plus className="size-4" strokeWidth={2} aria-hidden />
          Nouveau programme
        </Link>
      </div>

      <div className="flex flex-col gap-9">
        <section aria-labelledby="a-venir" className="flex flex-col gap-3">
          <h2 id="a-venir" className="text-lg font-semibold">
            À venir et en cours
          </h2>
          {aVenir.length === 0 ? (
            <p className="rounded-carte border border-bordure bg-surface px-6 py-10 text-center text-encre-douce">
              Aucun programme à venir.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {aVenir.map((p, i) => (
                <CarteProgramme key={p.id} p={p} delai={120 + i * 60} />
              ))}
            </div>
          )}
        </section>

        {passes.length > 0 && (
          <section aria-labelledby="passes" className="flex flex-col gap-3">
            <h2 id="passes" className="text-lg font-semibold text-encre-pale">
              Passés
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {passes.map((p, i) => (
                <CarteProgramme key={p.id} p={p} delai={i * 60} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}