import Link from "next/link";
import { isValidObjectId } from "mongoose";
import { notFound } from "next/navigation";
import { ArrowLeft, ChevronRight, Users } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import FormulaireParent from "@/components/FormulaireParent";
import { connectDB } from "@/lib/db";
import { calculerAge, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";

const NOMS_LIENS = { mere: "Mère", pere: "Père", tuteur: "Tuteur" } as const;

export default async function PageParent({ params }: { params: Promise<{ id: string }> }) {
  await exigerAdmin();
  const { id } = await params;
  if (!isValidObjectId(id)) notFound();

  await connectDB();
  const parent = await Parent.findById(id).lean();
  if (!parent) notFound();

  const enfants = await Participant.find({ "parents.parent": parent._id }).sort({ prenom: 1 }).lean();

  return (
    <>
      <Link
        href="/admin/parents"
        className="apparition mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-encre-douce hover:text-encre"
      >
        <ArrowLeft className="size-4" strokeWidth={2} aria-hidden />
        Parents
      </Link>

      <EnTetePage
        titre={parent.prenom}
        accent={parent.nom}
        description={`Parent de ${pluriel(enfants.length, "enfant")}`}
      />

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <FormulaireParent
          v={{
            id,
            prenom: parent.prenom,
            nom: parent.nom,
            telephone: parent.telephone,
            whatsapp: parent.whatsapp ?? "",
            email: parent.email ?? "",
            notes: parent.notes ?? "",
          }}
        />

        <section className="apparition flex flex-col gap-3 rounded-carte border border-bordure bg-surface p-6 shadow-carte [animation-delay:100ms]">
          <h2 className="flex items-center gap-2.5 text-base font-semibold">
            <Users className="size-[18px]" strokeWidth={1.8} aria-hidden />
            Enfants
          </h2>
          {enfants.length === 0 && <p className="text-sm text-encre-douce">Aucun enfant lié.</p>}
          {enfants.map((enfant) => {
            const lien = enfant.parents.find((l) => String(l.parent) === id);
            return (
              <Link
                key={String(enfant._id)}
                href={`/admin/participants/${String(enfant._id)}`}
                className="flex items-center justify-between gap-3 rounded-2xl bg-pastel-lavande/60 px-4 py-3 transition hover:-translate-y-px"
              >
                <span className="flex flex-col">
                  <span className="text-sm font-semibold">
                    {enfant.prenom} {enfant.nom}
                  </span>
                  <span className="text-[13px] text-encre-douce">
                    {[
                      lien ? NOMS_LIENS[lien.lien] : null,
                      enfant.dateNaissance ? `${calculerAge(enfant.dateNaissance)} ans` : null,
                      enfant.statut === "inactif" ? "inactif" : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <ChevronRight className="size-4 shrink-0" strokeWidth={2} aria-hidden />
              </Link>
            );
          })}
        </section>
      </div>
    </>
  );
}