import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import FormulaireProgramme from "@/components/FormulaireProgramme";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Programme } from "@/models/Programme";

// Date stockée à minuit UTC → "AAAA-MM-JJ" pour un champ date
const versChampDate = (d?: Date | null) => (d ? d.toISOString().slice(0, 10) : "");
const versTexte = (n?: number | null) => (n != null ? String(n) : "");

export default async function PageModifierProgramme({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const p = await Programme.findById(id).lean();
  if (!p) notFound();

  return (
    <>
      <Link
        href="/admin/programmes"
        className="apparition mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
        Programmes
      </Link>

      <EnTetePage titre="Modifier" accent={p.titre} description={p.slug ? `Adresse sur le site : /${p.slug}` : ""} />

      <FormulaireProgramme
        v={{
          id,
          type: p.type,
          titre: p.titre,
          description: p.description ?? "",
          activites: (p.activites ?? []).join(", "),
          dateDebut: versChampDate(p.dateDebut),
          dateFin: versChampDate(p.dateFin),
          horaires: p.horaires ?? "",
          ageMin: versTexte(p.ageMin),
          ageMax: versTexte(p.ageMax),
          capacite: versTexte(p.capacite),
          formules: p.formules.map((f) => ({
            nom: f.nom,
            prix: String(f.prix / 1000),
            description: f.description ?? "",
          })),
          publie: p.publieSurLeSite,
        }}
      />
    </>
  );
}