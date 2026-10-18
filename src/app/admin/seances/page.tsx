import CarteSeance, { type DonneesSeance } from "@/components/CarteSeance";
import EnTetePage from "@/components/EnTetePage";
import { connectDB } from "@/lib/db";
import { pluriel } from "@/lib/format";
import { exigerAdmin } from "@/lib/session";
import { Inscription } from "@/models/Inscription";
import { JOURS_SEMAINE, Seance } from "@/models/Seance";

export default async function PageSeances() {
  await exigerAdmin();
  await connectDB();

  // Les deux lectures partent en même temps (plus rapide)
  const [seances, comptes] = await Promise.all([
    Seance.find().sort({ jour: 1, heureDebut: 1 }).lean(),
    Inscription.aggregate<{ _id: unknown; total: number }>([
      { $match: { enCours: true } },
      { $group: { _id: "$seance", total: { $sum: 1 } } },
    ]),
  ]);

  // id de séance → nombre d'inscrits en cours
  const inscrits = new Map(comptes.map((c) => [String(c._id), c.total]));

  const versDonnees = (s: (typeof seances)[number]): DonneesSeance => ({
    id: String(s._id),
    heureDebut: s.heureDebut,
    heureFin: s.heureFin,
    public: s.public,
    tarifMensuel: s.tarifMensuel,
    capacite: s.capacite ?? null,
    animateur: s.animateur ?? null,
    inscrits: inscrits.get(String(s._id)) ?? 0,
    active: s.active,
  });

  const actives = seances.filter((s) => s.active);
  const inactives = seances.filter((s) => !s.active);

  const jours = ([1, 2, 3, 4, 5, 6, 7] as const)
    .map((jour) => ({
      jour,
      nom: JOURS_SEMAINE[jour],
      liste: actives.filter((s) => s.jour === jour),
    }))
    .filter((g) => g.liste.length > 0);

  return (
    <>
      <EnTetePage
        titre="Les"
        accent="séances"
        description={`${pluriel(actives.length, "séance")} par semaine · horaires, public, tarif et capacité.`}
      />

      {jours.length === 0 && (
        <p className="apparition rounded-carte border border-bordure bg-surface px-6 py-12 text-center text-encre-douce">
          Aucune séance active pour le moment.
        </p>
      )}

      <div className="flex flex-col gap-9">
        {jours.map((g, gi) => (
          <section key={g.jour} aria-labelledby={`jour-${g.jour}`} className="flex flex-col gap-3">
            <h2
              id={`jour-${g.jour}`}
              className="apparition text-lg font-semibold"
              style={{ animationDelay: `${gi * 80}ms` }}
            >
              {g.nom}{" "}
              <span className="text-sm font-medium text-encre-pale">· {pluriel(g.liste.length, "séance")}</span>
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {g.liste.map((s, i) => (
                <CarteSeance key={String(s._id)} seance={versDonnees(s)} delai={gi * 80 + i * 60} />
              ))}
            </div>
          </section>
        ))}

        {inactives.length > 0 && (
          <section aria-labelledby="desactivees" className="flex flex-col gap-3">
            <h2 id="desactivees" className="text-lg font-semibold text-encre-pale">
              Séances désactivées
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {inactives.map((s, i) => (
                <CarteSeance key={String(s._id)} seance={versDonnees(s)} delai={i * 60} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}