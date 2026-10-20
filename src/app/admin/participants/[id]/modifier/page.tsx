import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import FormulaireParticipant from "@/components/FormulaireParticipant";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Inscription } from "@/models/Inscription";
import { Participant } from "@/models/Participant";

// Date stockée à minuit UTC → "AAAA-MM-JJ" pour un champ date
const versChampDate = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");

export default async function PageModifierParticipant({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const p = await Participant.findById(id).lean();
  if (!p) notFound();
  const seancesEnCours = await Inscription.countDocuments({ participant: p._id, enCours: true });

  return (
    <>
      <Link
        href={`/admin/participants/${id}`}
        className="apparition mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
        Retour à la fiche
      </Link>

      <EnTetePage
        titre="Modifier"
        accent={`${p.prenom} ${p.nom}`}
        description="Les parents se modifient depuis la page Parents."
      />

      <FormulaireParticipant
        v={{
          id,
          type: p.type,
          prenom: p.prenom,
          nom: p.nom,
          dateNaissance: versChampDate(p.dateNaissance),
          telephone: p.telephone ?? "",
          email: p.email ?? "",
          autorisationPhoto: p.autorisationPhoto ?? false,
          statut: p.statut ?? "actif",
          allergies: (p.sante?.allergies ?? []).join(", "),
          remarques: p.sante?.remarques ?? "",
          urgenceNom: p.contactUrgence?.nom ?? "",
          urgenceTelephone: p.contactUrgence?.telephone ?? "",
          urgenceLien: p.contactUrgence?.lien ?? "",
          notes: p.notes ?? "",
          seancesEnCours,
          aujourdhui: new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date()),
        }}
      />
    </>
  );
}