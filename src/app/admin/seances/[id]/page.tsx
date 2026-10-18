import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import EnTetePage from "@/components/EnTetePage";
import FormulaireSeance from "@/components/FormulaireSeance";
import { connectDB } from "@/lib/db";
import { formatHeure } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

export default async function PageModifierSeance({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const s = await Seance.findById(id).lean();
  if (!s) notFound();

  const nomJour = JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE];

  return (
    <>
      <EnTetePage
        titre="Modifier la"
        accent="séance"
        description={`${nomJour} · ${formatHeure(s.heureDebut)} – ${formatHeure(s.heureFin)}`}
      />
      <FormulaireSeance
        initial={{
          id,
          jour: String(s.jour),
          heureDebut: s.heureDebut,
          heureFin: s.heureFin,
          public: s.public,
          tarif: String(s.tarifMensuel / 1000),
          capacite: s.capacite != null ? String(s.capacite) : "",
          animateur: s.animateur ?? "",
        }}
      />
    </>
  );
}