import Link from "next/link";
import { ArrowUpRight, Check, ChevronRight } from "lucide-react";
import CollageOeuvres from "@/components/CollageOeuvres";
import Compteur from "@/components/Compteur";
import GraphiquePresences from "@/components/GraphiquePresences";
import { aujourdhuiTexte, inscritsDuJour, jourSemaineIso } from "@/lib/appel";
import { connectDB } from "@/lib/db";
import { formatHeure, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { cn } from "@/lib/utils";
import { Appel } from "@/models/Appel";
import { Inscription } from "@/models/Inscription";
import { Participant } from "@/models/Participant";
import { Programme } from "@/models/Programme";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

const JOUR_MS = 86_400_000;

// % de présents sur un ensemble d'appels
function tauxPresence(appels: { presences: { statut: string }[] }[]) {
  let presents = 0;
  let total = 0;
  for (const appel of appels) {
    for (const p of appel.presences) {
      total++;
      if (p.statut === "present") presents++;
    }
  }
  return total > 0 ? Math.round((presents * 100) / total) : null;
}

function CarteStat({
  href,
  titre,
  valeur,
  detail,
  fond,
  delai,
}: {
  href: string;
  titre: string;
  valeur: React.ReactNode;
  detail: string;
  fond: string;
  delai: number;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "apparition flex min-h-40 flex-col justify-between gap-4 rounded-carte bg-linear-145 p-5 shadow-carte transition duration-300 ease-premium hover:-translate-y-[3px] hover:shadow-carte-survol md:min-h-44",
        fond,
      )}
      style={{ animationDelay: `${delai}ms` }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold">{titre}</span>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-white/60">
          <ArrowUpRight className="size-4" strokeWidth={2} aria-hidden />
        </span>
      </div>
      <div>
        <p className="text-4xl leading-none font-semibold tracking-[-0.04em] md:text-5xl">{valeur}</p>
        <p className="mt-2 text-[13px] text-encre-douce">{detail}</p>
      </div>
    </Link>
  );
}

export default async function PageAdmin() {
  const session = await exigerAdmin();
  const prenom = session.user.name.split(" ")[0];

  // Repères de dates (Tunis, minuit UTC)
  const aujourdhui = aujourdhuiTexte();
  const jour = new Date(aujourdhui);
  const iso = jourSemaineIso(jour);
  const [annee, mois] = aujourdhui.split("-").map(Number);
  const debutMois = new Date(Date.UTC(annee, mois - 1, 1));
  const debutMoisPrecedent = new Date(Date.UTC(annee, mois - 2, 1));
  const lundi = new Date(jour.getTime() - (iso - 1) * JOUR_MS);
  const debutGraphique = new Date(lundi.getTime() - 6 * 7 * JOUR_MS);

  await connectDB();
  const [enfants, adultes, seancesActives, programmes, appelsMois, appelsMoisPrecedent, appelsGraphique, dernieres] =
    await Promise.all([
      Participant.countDocuments({ type: "enfant", statut: "actif" }),
      Participant.countDocuments({ type: "adulte", statut: "actif" }),
      Seance.find({ active: true }).sort({ heureDebut: 1 }).lean(),
      Programme.find({ publieSurLeSite: true }).select("titre").lean(),
      Appel.find({ date: { $gte: debutMois, $lte: jour } }).select("presences.statut").lean(),
      Appel.find({ date: { $gte: debutMoisPrecedent, $lt: debutMois } }).select("presences.statut").lean(),
      Appel.find({ date: { $gte: debutGraphique, $lte: jour } }).select("date presences.statut").lean(),
      Inscription.find().sort({ createdAt: -1 }).limit(5).lean(),
    ]);

  // Présence du mois et écart avec le mois précédent
  const taux = tauxPresence(appelsMois);
  const tauxPrecedent = tauxPresence(appelsMoisPrecedent);
  const ecart = taux != null && tauxPrecedent != null ? taux - tauxPrecedent : null;
  const nomMois = new Intl.DateTimeFormat("fr-FR", { month: "long", timeZone: "UTC" }).format(debutMois);

  // Séances d'aujourd'hui
  const seancesDuJour = seancesActives.filter((s) => s.jour === iso);
  const [effectifs, appelsDuJour] = await Promise.all([
    Promise.all(seancesDuJour.map((s) => inscritsDuJour(s._id, jour))),
    Appel.find({ date: jour, seance: { $in: seancesDuJour.map((s) => s._id) } }).select("seance").lean(),
  ]);
  const appelFait = new Set(appelsDuJour.map((a) => String(a.seance)));
  const attendus = effectifs.reduce((total, liste) => total + liste.length, 0);

  // Graphique : présences par semaine (lundi → dimanche)
  const formatSemaine = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", timeZone: "UTC" });
  const semaines = Array.from({ length: 7 }, (_, k) => {
    const debut = new Date(debutGraphique.getTime() + k * 7 * JOUR_MS);
    return { label: formatSemaine.format(debut), valeur: 0, courante: k === 6 };
  });
  for (const appel of appelsGraphique) {
    const k = Math.floor((appel.date.getTime() - debutGraphique.getTime()) / (7 * JOUR_MS));
    if (k >= 0 && k < 7) semaines[k].valeur += appel.presences.filter((p) => p.statut === "present").length;
  }

  // Dernières inscriptions
  const [participantsDernieres, seancesDernieres] = await Promise.all([
    Participant.find({ _id: { $in: dernieres.map((i) => i.participant) } }).select("prenom nom type").lean(),
    Seance.find({ _id: { $in: dernieres.map((i) => i.seance) } }).select("jour heureDebut").lean(),
  ]);
  const participantParId = new Map(participantsDernieres.map((p) => [String(p._id), p]));
  const seanceParId = new Map(seancesDernieres.map((s) => [String(s._id), s]));

  const dateLongue = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(jour);

  return (
    <>
      {/* Bonjour */}
      <section className="apparition flex flex-col gap-1.5 pt-3 pb-7">
        <span className="text-sm font-medium text-encre-douce first-letter:uppercase">{dateLongue}</span>
        <h1 className="text-5xl leading-none font-semibold tracking-[-0.035em] md:text-6xl">
          Bonjour <span className="font-serif text-[1.12em] font-normal italic">{prenom}</span>
        </h1>
        <p className="mt-1.5 text-[15px] text-encre-douce">
          {seancesDuJour.length > 0
            ? `${pluriel(seancesDuJour.length, "séance")} aujourd’hui · ${pluriel(attendus, "participant")} attendu${attendus > 1 ? "s" : ""}`
            : "Pas de séance aujourd’hui."}
        </p>
      </section>

      {/* Chiffres clés */}
      <section className="grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4" aria-label="Chiffres clés">
        <CarteStat
          href="/admin/participants"
          titre="Participants actifs"
          fond="from-pastel-rose to-[#fbe1e2]"
          delai={60}
          valeur={<Compteur valeur={enfants + adultes} />}
          detail={`${pluriel(enfants, "enfant")} · ${pluriel(adultes, "adulte")}`}
        />
        <CarteStat
          href="/admin/appel"
          titre={`Présence · ${nomMois}`}
          fond="from-pastel-lavande to-[#e9e4fb]"
          delai={120}
          valeur={taux != null ? <Compteur valeur={taux} suffixe=" %" /> : "—"}
          detail={
            ecart != null
              ? `${ecart >= 0 ? "+" : ""}${ecart} pts par rapport au mois dernier`
              : "Pas encore d’appel ce mois-ci"
          }
        />
        <CarteStat
          href="/admin/seances"
          titre="Séances par semaine"
          fond="from-pastel-menthe to-[#ddf4ea]"
          delai={180}
          valeur={<Compteur valeur={seancesActives.length} />}
          detail={`${seancesActives.filter((s) => s.public === "enfant").length} enfants · ${seancesActives.filter((s) => s.public === "adulte").length} adultes`}
        />
        <CarteStat
          href="/admin/programmes"
          titre="Programmes en ligne"
          fond="from-pastel-peche to-[#fce9d6]"
          delai={240}
          valeur={<Compteur valeur={programmes.length} />}
          detail={programmes.length > 0 ? programmes.slice(0, 2).map((p) => p.titre).join(", ") : "Aucun pour l’instant"}
        />
      </section>

      {/* Graphique + séances du jour */}
      <section className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <GraphiquePresences semaines={semaines} />

        <div className="apparition flex flex-col gap-3 rounded-carte border border-bordure bg-surface p-6 shadow-carte [animation-delay:300ms]">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Séances d’aujourd’hui</h2>
            <span className="rounded-full bg-neutre-fond px-3 py-1 text-xs font-semibold text-neutre first-letter:uppercase">
              {JOURS_SEMAINE[iso as keyof typeof JOURS_SEMAINE]}
            </span>
          </div>

          {seancesDuJour.length === 0 && (
            <div className="flex flex-col items-start gap-3 py-4">
              <p className="text-sm text-encre-douce">Aucune séance prévue aujourd’hui.</p>
              <Link href="/admin/appel" className="text-sm font-semibold underline-offset-4 hover:underline">
                Faire l’appel d’un autre jour
              </Link>
            </div>
          )}

          {seancesDuJour.map((s, i) => {
            const fait = appelFait.has(String(s._id));
            return (
              <div key={String(s._id)} className="flex items-center gap-3 rounded-2xl bg-surface-douce p-3">
                <span
                  className={cn(
                    "flex size-14 shrink-0 items-center justify-center rounded-2xl text-sm font-bold",
                    s.public === "enfant" ? "bg-pastel-lavande" : "bg-pastel-peche",
                  )}
                >
                  {s.heureDebut}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {s.public === "enfant" ? "Enfants" : "Adultes"} · {formatHeure(s.heureDebut)} – {formatHeure(s.heureFin)}
                  </p>
                  <p className="text-xs text-encre-douce">{pluriel(effectifs[i].length, "inscrit")}</p>
                </div>
                <Link
                  href={`/admin/appel/${String(s._id)}?date=${aujourdhui}`}
                  className={cn(
                    "inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition hover:-translate-y-px",
                    fait ? "bg-succes-fond text-succes" : "bg-encre text-white",
                  )}
                >
                  {fait && <Check className="size-3.5" strokeWidth={2.5} aria-hidden />}
                  {fait ? "Appel fait" : "Faire l’appel"}
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Créations récentes */}
      <section className="apparition mt-4 overflow-hidden rounded-carte border border-bordure bg-linear-180 from-surface to-[#fcf7f2] p-6 shadow-carte [animation-delay:360ms]">
        <h2 className="text-3xl font-semibold tracking-[-0.02em]">
          Créations <span className="font-serif text-[1.15em] font-normal italic">récentes</span>
        </h2>
        <p className="mt-1 text-[13px] text-encre-douce">Les photos de vos ateliers apparaîtront ici.</p>
        <CollageOeuvres className="min-h-[220px] py-6 md:min-h-[320px]" />
      </section>

      {/* Dernières inscriptions */}
      <section className="apparition mt-4 rounded-carte border border-bordure bg-surface p-6 shadow-carte [animation-delay:420ms]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Dernières inscriptions</h2>
          <Link href="/admin/participants" className="inline-flex items-center gap-1 text-sm font-semibold hover:underline">
            Tous les participants
            <ChevronRight className="size-4" strokeWidth={2} aria-hidden />
          </Link>
        </div>
        {dernieres.length === 0 && <p className="text-sm text-encre-douce">Aucune inscription pour le moment.</p>}
        <ul className="flex flex-col">
          {dernieres.map((ins) => {
            const p = participantParId.get(String(ins.participant));
            const s = seanceParId.get(String(ins.seance));
            if (!p) return null;
            return (
              <li key={String(ins._id)} className="border-t border-bordure first:border-t-0">
                <Link
                  href={`/admin/participants/${String(p._id)}`}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-2xl px-2 py-3 transition hover:bg-surface-douce"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
                      p.type === "enfant" ? "bg-pastel-lavande" : "bg-pastel-peche",
                    )}
                  >
                    {`${p.prenom.charAt(0)}${p.nom.charAt(0)}`.toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 basis-40 truncate font-semibold">
                    {p.prenom} {p.nom}
                  </span>
                  <span className="text-[13px] text-encre-douce">
                    {s
                      ? `${JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE].slice(0, 3)}. ${formatHeure(s.heureDebut)}`
                      : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}