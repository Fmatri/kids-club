import { Error as MongooseError } from "mongoose";
import { connectDB } from "@/lib/db";
import { Saison } from "@/models/Saison";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";
import { Seance } from "@/models/Seance";
import { Inscription } from "@/models/Inscription";
import { Appel } from "@/models/Appel";

// Page de test TEMPORAIRE : http://localhost:3000/api/dev/test-modeles
export async function GET() {
  // Sécurité : cette page n'existe qu'en développement
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  await connectDB();

  // Attend que MongoDB ait créé les index uniques (sinon les tests de doublons seraient faussés)
  await Promise.all([
    Saison.init(),
    Parent.init(),
    Participant.init(),
    Seance.init(),
    Inscription.init(),
    Appel.init(),
  ]);

  // Liste des suppressions à faire à la fin (nettoyage)
  const nettoyages: (() => Promise<unknown>)[] = [];

  try {
    // ---------- 1. Données CORRECTES ----------
    const saison = await Saison.create({
      nom: "2099-2100",
      dateDebut: new Date("2099-09-01"),
      dateFin: new Date("2100-06-30"),
    });
    nettoyages.push(() => Saison.deleteOne({ _id: saison._id }));

    const parent = await Parent.create({
      nom: "Ben Ali",
      prenom: "Sonia",
      telephone: "22 123 456",
    });
    nettoyages.push(() => Parent.deleteOne({ _id: parent._id }));

    const adam = await Participant.create({
      type: "enfant",
      nom: "Ben Ali",
      prenom: "Adam",
      dateNaissance: new Date("2018-03-12"),
      parents: [{ parent: parent._id, lien: "mere" }],
      sante: { allergies: ["arachides"] },
    });
    nettoyages.push(() => Participant.deleteOne({ _id: adam._id }));

    const lina = await Participant.create({
      type: "enfant",
      nom: "Ben Ali",
      prenom: "Lina",
      dateNaissance: new Date("2016-07-20"),
      parents: [{ parent: parent._id, lien: "mere" }],
    });
    nettoyages.push(() => Participant.deleteOne({ _id: lina._id }));

    const seance = await Seance.create({
      jour: 3, // mercredi
      heureDebut: "15:00",
      heureFin: "16:30",
      public: "enfant",
      tarifMensuel: 100000, // 100 DT
      capacite: 12,
    });
    nettoyages.push(() => Seance.deleteOne({ _id: seance._id }));

    const inscriptionAdam = await Inscription.create({
      participant: adam._id,
      seance: seance._id,
      saison: saison._id,
      dateDebut: "2026-09-02T14:37:00", // l'heure doit disparaître
    });
    nettoyages.push(() => Inscription.deleteOne({ _id: inscriptionAdam._id }));

    const inscriptionLina = await Inscription.create({
      participant: lina._id,
      seance: seance._id,
      saison: saison._id,
      dateDebut: "2026-09-02",
    });
    nettoyages.push(() => Inscription.deleteOne({ _id: inscriptionLina._id }));

    const appel = await Appel.create({
      seance: seance._id,
      date: "2026-09-30", // un mercredi passé
      presences: [
        { participant: adam._id, statut: "absent", motif: "malade" },
        {
          participant: lina._id,
          statut: "present",
          motif: "ce motif doit disparaître",
        },
      ],
    });
    nettoyages.push(() => Appel.deleteOne({ _id: appel._id }));

    // ---------- 2. Relectures ----------
    const enfantsDeSonia = await Participant.find({
      "parents.parent": parent._id,
    })
      .select("prenom")
      .lean();

    const listeAppelSeance = await Inscription.find({
      seance: seance._id,
      enCours: true,
    })
      .populate("participant", "prenom nom")
      .lean();

    const bilanSeptembreAdam = await Appel.find({
      "presences.participant": adam._id,
      date: { $gte: new Date("2026-09-01"), $lt: new Date("2026-10-01") },
    })
      .select("date presences")
      .lean();

    // ---------- 3. Données INCORRECTES : chaque essai doit être refusé ----------
    const erreurs = {
      enfantSansParent: await messageErreur(() =>
        Participant.create({
          type: "enfant",
          nom: "X",
          prenom: "Y",
          dateNaissance: new Date("2019-01-01"),
        }),
      ),
      adulteSansTelephone: await messageErreur(() =>
        Participant.create({ type: "adulte", nom: "X", prenom: "Y" }),
      ),
      telephoneInvalide: await messageErreur(() =>
        Parent.create({ nom: "X", prenom: "Y", telephone: "abc" }),
      ),
      saisonDatesInversees: await messageErreur(() =>
        Saison.create({
          nom: "2098-2099",
          dateDebut: new Date("2099-06-30"),
          dateFin: new Date("2098-09-01"),
        }),
      ),
      seanceHeuresInversees: await messageErreur(() =>
        Seance.create({
          jour: 3,
          heureDebut: "16:30",
          heureFin: "15:00",
          public: "enfant",
          tarifMensuel: 100000,
        }),
      ),
      seanceJourInvalide: await messageErreur(() =>
        Seance.create({
          jour: 9,
          heureDebut: "10:00",
          heureFin: "11:30",
          public: "enfant",
          tarifMensuel: 100000,
        }),
      ),
      seanceDoublon: await messageErreur(() =>
        Seance.create({
          jour: 3,
          heureDebut: "15:00",
          heureFin: "16:30",
          public: "enfant",
          tarifMensuel: 100000,
        }),
      ),
      inscriptionDoublon: await messageErreur(() =>
        Inscription.create({
          participant: adam._id,
          seance: seance._id,
          saison: saison._id,
          dateDebut: "2026-09-09",
        }),
      ),
      inscriptionFinAvantDebut: await messageErreur(() =>
        Inscription.create({
          participant: lina._id,
          seance: seance._id,
          saison: saison._id,
          dateDebut: "2026-09-09",
          dateFin: "2026-09-01",
        }),
      ),
      appelFutur: await messageErreur(() =>
        Appel.create({
          seance: seance._id,
          date: "2099-01-07",
          presences: [{ participant: adam._id }],
        }),
      ),
      appelSansParticipant: await messageErreur(() =>
        Appel.create({ seance: seance._id, date: "2026-09-23", presences: [] }),
      ),
      appelParticipantEnDouble: await messageErreur(() =>
        Appel.create({
          seance: seance._id,
          date: "2026-09-16",
          presences: [{ participant: adam._id }, { participant: adam._id }],
        }),
      ),
      appelDoublon: await messageErreur(() =>
        Appel.create({
          seance: seance._id,
          date: "2026-09-30",
          presences: [{ participant: adam._id }],
        }),
      ),
    };

    // ---------- 4. Affichage du résultat ----------
    return Response.json({
      dateInscriptionNettoyee: inscriptionAdam.dateDebut,
      inscriptionEnCours: inscriptionAdam.enCours,
      motifLinaApresEnregistrement: appel.presences[1]?.motif ?? "(effacé)",
      enfantsDeSonia,
      listeAppelSeance,
      bilanSeptembreAdam,
      erreurs,
    });
  } finally {
    // ---------- 5. Nettoyage : suppression dans l'ordre inverse de création ----------
    for (const nettoyer of nettoyages.reverse()) {
      await nettoyer();
    }
  }
}

// Exécute une action qui DOIT échouer, et renvoie le message d'erreur obtenu
async function messageErreur(action: () => Promise<unknown>) {
  try {
    await action();
    return "PROBLÈME : aucune erreur, la donnée incorrecte a été acceptée !";
  } catch (error) {
    // Erreur de règle (schéma Mongoose)
    if (error instanceof MongooseError.ValidationError) {
      return Object.values(error.errors).map((e) => e.message);
    }
    // Erreur de doublon (index unique MongoDB, code 11000)
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      error.code === 11000
    ) {
      return "Doublon refusé par la base de données (index unique)";
    }
    return String(error);
  }
}
