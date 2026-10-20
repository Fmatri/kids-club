import Link from "next/link";
import { Check, ChevronRight } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import { aujourdhuiTexte, inscritsDuJour, jourSemaineIso, REGEX_DATE } from "@/lib/appel";
import { connectDB } from "@/lib/db";
import { formatDate, formatHeure, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Appel } from "@/models/Appel";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

export default async function PageAppel({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerAdmin();
  const sp = await searchParams;

  // Date choisie (jamais dans le futur), sinon aujourd'hui
  const aujourdhui = aujourdhuiTexte();
  const date =
    typeof sp.date === "string" && REGEX_DATE.test(sp.date) && sp.date <= aujourdhui ? sp.date : aujourdhui;
  const jour = new Date(date);
  const iso = jourSemaineIso(jour);
  const nomJour = JOURS_SEMAINE[iso as keyof typeof JOURS_SEMAINE];

  await connectDB();
  const seances = await Seance.find({ active: true, jour: iso }).sort({ heureDebut: 1 }).lean();
  const [appels, effectifs] = await Promise.all([
    Appel.find({ date: jour, seance: { $in: seances.map((s) => s._id) } }).lean(),
    Promise.all(seances.map((s) => inscritsDuJour(s._id, jour))),
  ]);
  const appelDe = new Map(appels.map((a) => [String(a.seance), a]));

  return (
    <>
      <EnTetePage
        titre="Faire"
        accent="l’appel"
        description={`${nomJour} ${formatDate(jour)}${date === aujourdhui ? " · aujourd’hui" : ""}`}
      />

      {/* Choix d'une autre date */}
      <form action="/admin/appel" className="apparition mb-7 flex flex-wrap items-end gap-3 [animation-delay:80ms]">
        <div className="flex flex-col gap-2">
          <label htmlFor="date-appel" className="text-[13px] font-semibold">
            Autre date
          </label>
          <input
            key={date}
            id="date-appel"
            name="date"
            type="date"
            max={aujourdhui}
            defaultValue={date}
            className="h-11 rounded-full border border-bordure bg-surface px-4 text-sm outline-none focus:border-encre"
          />
        </div>
        <button type="submit" className="h-11 rounded-full border border-bordure bg-surface px-5 text-sm font-semibold">
          Afficher
        </button>
        {date !== aujourdhui && (
          <Link
            href="/admin/appel"
            className="inline-flex h-11 items-center rounded-full bg-encre px-5 text-sm font-semibold text-white"
          >
            Aujourd’hui
          </Link>
        )}
      </form>

      {seances.length === 0 ? (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Aucune séance le {nomJour.toLowerCase()}.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {seances.map((s, i) => {
            const appel = appelDe.get(String(s._id));
            const total = effectifs[i].length;
            const presents = appel ? appel.presences.filter((p) => p.statut === "present").length : 0;
            return (
              <Link
                key={String(s._id)}
                href={`/admin/appel/${String(s._id)}?date=${date}`}
                className={cn(
                  "apparition flex flex-col gap-4 rounded-carte p-5 shadow-carte transition duration-300 ease-premium hover:-translate-y-[3px] hover:shadow-carte-survol",
                  s.public === "enfant"
                    ? "bg-linear-145 from-pastel-lavande to-[#ebe6fb]"
                    : "bg-linear-145 from-pastel-peche to-[#fcebd9]",
                )}
                style={{ animationDelay: `${120 + i * 60}ms` }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight">
                      {formatHeure(s.heureDebut)} – {formatHeure(s.heureFin)}
                    </p>
                    <p className="mt-1 text-sm text-encre-douce">
                      {s.public === "enfant" ? "Enfants" : "Adultes"} · {pluriel(total, "inscrit")}
                    </p>
                  </div>
                  <ChevronRight className="mt-1 size-5 shrink-0" strokeWidth={2} aria-hidden />
                </div>
                {appel ? (
                  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-succes-fond px-3 py-1.5 text-sm font-semibold text-succes">
                    <Check className="size-4" strokeWidth={2.5} aria-hidden />
                    Appel fait · {presents} / {appel.presences.length} présents
                  </span>
                ) : (
                  <span className="w-fit rounded-full bg-attention-fond px-3 py-1.5 text-sm font-semibold text-attention">
                    À faire
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </>
  );
}