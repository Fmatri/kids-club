import Link from "next/link";
import { ChevronLeft, ChevronRight, ClipboardCheck } from "lucide-react";
import { connectDB } from "@/lib/db";
import { formatHeure, pluriel } from "@/lib/format";
import { Appel } from "@/models/Appel";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

const VERT = "#30b158";
const ROUGE = "#e5484d";

// "2026-10" + (-1) → "2026-09"
function decalerMois(mois: string, n: number) {
  const [annee, m] = mois.split("-").map(Number);
  return new Date(Date.UTC(annee, m - 1 + n, 1)).toISOString().slice(0, 7);
}

const fleche =
  "flex size-9 items-center justify-center rounded-full border border-bordure bg-surface transition hover:-translate-y-px";

export default async function BilanPresence({
  idParticipant,
  mois,
  moisActuel,
}: {
  idParticipant: string;
  mois: string; // "AAAA-MM"
  moisActuel: string;
}) {
  await connectDB();

  const [annee, m] = mois.split("-").map(Number);
  const debut = new Date(Date.UTC(annee, m - 1, 1));
  const fin = new Date(Date.UTC(annee, m, 1));

  const appels = await Appel.find({
    "presences.participant": idParticipant,
    date: { $gte: debut, $lt: fin },
  })
    .sort({ date: 1 })
    .lean();
  const seances = await Seance.find({ _id: { $in: appels.map((a) => a.seance) } })
    .select("jour heureDebut")
    .lean();
  const seanceParId = new Map(seances.map((s) => [String(s._id), s]));

  const lignes = appels.flatMap((appel) => {
    const presence = appel.presences.find((p) => String(p.participant) === idParticipant);
    if (!presence) return [];
    const s = seanceParId.get(String(appel.seance));
    return [
      {
        id: String(appel._id),
        date: appel.date,
        present: presence.statut === "present",
        seance: s
          ? `${JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE].slice(0, 3)}. ${formatHeure(s.heureDebut)}`
          : "",
      },
    ];
  });

  const presences = lignes.filter((l) => l.present).length;
  const absences = lignes.filter((l) => !l.present);
  const taux = lignes.length > 0 ? Math.round((presences * 100) / lignes.length) : null;

  const nomMois = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric", timeZone: "UTC" }).format(debut);
  const jourLong = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });

  return (
    <section
      className="apparition flex flex-col gap-5 rounded-carte border border-bordure bg-surface p-6 shadow-carte lg:col-span-2"
      style={{ animationDelay: "360ms" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2.5 text-base font-semibold">
          <ClipboardCheck className="size-[18px]" strokeWidth={1.8} aria-hidden />
          Présence
        </h2>
        <div className="flex items-center gap-1">
          <Link href={`?mois=${decalerMois(mois, -1)}`} scroll={false} aria-label="Mois précédent" className={fleche}>
            <ChevronLeft className="size-4" strokeWidth={2} aria-hidden />
          </Link>
          <span className="min-w-36 text-center text-sm font-semibold first-letter:uppercase">{nomMois}</span>
          {mois < moisActuel ? (
            <Link href={`?mois=${decalerMois(mois, 1)}`} scroll={false} aria-label="Mois suivant" className={fleche}>
              <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
            </Link>
          ) : (
            <span className="size-9" aria-hidden />
          )}
        </div>
      </div>

      {lignes.length === 0 ? (
        <p className="text-sm text-encre-douce">Aucun appel ce mois-ci.</p>
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <div>
              <p className="text-4xl font-semibold tracking-tight">{taux} %</p>
              <p className="text-[13px] text-encre-douce">de présence</p>
            </div>
            <p className="text-sm text-encre-douce">
              {pluriel(presences, "présence")} sur {pluriel(lignes.length, "séance")} · {pluriel(absences.length, "absence")}
            </p>
          </div>

          {/* Une pastille par séance : vert = présent, rouge = absent */}
          <div className="flex flex-wrap gap-2">
            {lignes.map((l) => (
              <span
                key={l.id}
                title={`${jourLong.format(l.date)} · ${l.present ? "présent" : "absent"}`}
                className="flex h-9 min-w-9 items-center justify-center rounded-full px-2 text-xs font-semibold text-white"
                style={{ backgroundColor: l.present ? VERT : ROUGE }}
              >
                <span className="sr-only">{l.present ? "Présent le" : "Absent le"} </span>
                {l.date.getUTCDate()}
              </span>
            ))}
          </div>

          {absences.length > 0 && (
            <div className="flex flex-col gap-2">
              <p className="text-[13px] font-semibold text-encre-pale">Absences</p>
              {absences.map((l) => (
                <div
                  key={l.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-[#fdf1f1] px-4 py-3"
                >
                  <span className="text-sm font-semibold first-letter:uppercase">{jourLong.format(l.date)}</span>
                  <span className="text-[13px] text-encre-douce">{l.seance}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}