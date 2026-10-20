import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import FeuilleAppel from "@/components/FeuilleAppel";
import { aujourdhuiTexte, inscritsDuJour, jourSemaineIso, REGEX_DATE } from "@/lib/appel";
import { connectDB } from "@/lib/db";
import { formatDate, formatHeure } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { Appel } from "@/models/Appel";
import { Participant } from "@/models/Participant";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

export default async function PageFeuilleAppel({
  params,
  searchParams,
}: {
  params: Promise<{ seanceId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await exigerAdmin();
  const { seanceId } = await params;
  const sp = await searchParams;
  if (!isValidObjectId(seanceId)) notFound();

  const aujourdhui = aujourdhuiTexte();
  const date =
    typeof sp.date === "string" && REGEX_DATE.test(sp.date) && sp.date <= aujourdhui ? sp.date : aujourdhui;
  const jour = new Date(date);

  await connectDB();
  const seance = await Seance.findById(seanceId).lean();
  if (!seance) notFound();

  const nomJour = JOURS_SEMAINE[seance.jour as keyof typeof JOURS_SEMAINE];
  const bonJour = jourSemaineIso(jour) === seance.jour;

  const ids = bonJour ? await inscritsDuJour(seance._id, jour) : [];
  const [participants, appel] = await Promise.all([
    Participant.find({ _id: { $in: ids } }).select("prenom nom type").sort({ prenom: 1, nom: 1 }).lean(),
    Appel.findOne({ seance: seance._id, date: jour }).lean(),
  ]);

  return (
    <>
      <Link
        href={`/admin/appel?date=${date}`}
        className="apparition mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
        Toutes les séances
      </Link>

      <EnTetePage
        titre={`${nomJour}`}
        accent={`${formatHeure(seance.heureDebut)} – ${formatHeure(seance.heureFin)}`}
        description={`Appel du ${formatDate(jour)} · ${seance.public === "enfant" ? "Enfants" : "Adultes"}`}
      />

      {!bonJour ? (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Cette séance n’a pas lieu ce jour-là.
        </p>
      ) : participants.length === 0 ? (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Aucun inscrit à cette séance ce jour-là.
        </p>
      ) : (
        <FeuilleAppel
          idSeance={seanceId}
          date={date}
          dejaFait={!!appel}
          absentsInitiaux={
            appel ? appel.presences.filter((p) => p.statut !== "present").map((p) => String(p.participant)) : []
          }
          eleves={participants.map((p) => ({
            id: String(p._id),
            prenom: p.prenom,
            nom: p.nom,
            type: p.type,
          }))}
        />
      )}
    </>
  );
}