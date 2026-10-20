import EnTetePage from "@/components/EnTetePage";
import FormulaireInscription from "@/components/FormulaireInscription";
import { connectDB } from "@/lib/db";
import { formatHeure, pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { Inscription } from "@/models/Inscription";
import { Parent } from "@/models/Parent";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

export default async function PageNouvelleInscription() {
  await exigerAdmin();
  await connectDB();

  const [parents, seances, comptes] = await Promise.all([
    Parent.find().sort({ nom: 1, prenom: 1 }).select("nom prenom telephone").lean(),
    Seance.find({ active: true }).sort({ jour: 1, heureDebut: 1 }).lean(),
    Inscription.aggregate<{ _id: unknown; total: number }>([
      { $match: { enCours: true } },
      { $group: { _id: "$seance", total: { $sum: 1 } } },
    ]),
  ]);
  const inscrits = new Map(comptes.map((c) => [String(c._id), c.total]));

  // Date du jour à Tunis, au format AAAA-MM-JJ (pour les champs date)
  const aujourdhui = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());

  return (
    <>
      <EnTetePage
        titre="Nouvelle"
        accent="inscription"
        description="Un enfant ou un adulte, ses contacts et ses séances, en quelques étapes."
      />
      <FormulaireInscription
        aujourdhui={aujourdhui}
        parents={parents.map((p) => ({
          id: String(p._id),
          nom: p.nom,
          prenom: p.prenom,
          telephone: p.telephone,
        }))}
        seances={seances.map((s) => {
          const n = inscrits.get(String(s._id)) ?? 0;
          return {
            id: String(s._id),
            libelle: `${JOURS_SEMAINE[s.jour as keyof typeof JOURS_SEMAINE]} ${formatHeure(s.heureDebut)} – ${formatHeure(s.heureFin)}`,
            public: s.public,
            places: s.capacite != null ? `${n} / ${s.capacite} places` : pluriel(n, "inscrit"),
            complet: s.capacite != null && n >= s.capacite,
          };
        })}
      />
    </>
  );
}