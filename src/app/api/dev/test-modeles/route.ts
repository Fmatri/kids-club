import { Error as MongooseError } from "mongoose";
import { connectDB } from "@/lib/db";
import { Saison } from "@/models/saison";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";

// Page de test TEMPORAIRE : http://localhost:3000/api/dev/test-modeles
export async function GET() {
  // Sécurité : cette page n'existe qu'en développement
  if (process.env.NODE_ENV !== "development") {
    return new Response("Not found", { status: 404 });
  }

  await connectDB();
  const crees: { saison?: unknown; parent?: unknown; enfant?: unknown } = {};

  try {
    // 1. Création de données CORRECTES
    const saison = await Saison.create({
      nom: "2099-2100",
      dateDebut: new Date("2099-09-01"),
      dateFin: new Date("2100-06-30"),
    });
    crees.saison = saison._id;

    const parent = await Parent.create({
      nom: "Ben Ali",
      prenom: "Sonia",
      telephone: "22 123 456",
    });
    crees.parent = parent._id;

    const enfant = await Participant.create({
      type: "enfant",
      nom: "Ben Ali",
      prenom: "Adam",
      dateNaissance: new Date("2018-03-12"),
      parents: [{ parent: parent._id, lien: "mere" }],
      sante: { allergies: ["arachides"] },
    });
    crees.enfant = enfant._id;

    // 2. Relecture de l'enfant AVEC les infos du parent (populate)
    const enfantComplet = await Participant.findById(enfant._id)
      .populate("parents.parent")
      .lean();

    // 3. Essais de données INCORRECTES : chaque essai doit être refusé
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
    };

    // 4. Affichage du résultat
    return Response.json({
      telephoneNettoye: parent.telephone,
      enfantComplet,
      erreurs,
    });
  } finally {
    // 5. Nettoyage : on supprime tout ce qui a été créé
    if (crees.enfant) await Participant.deleteOne({ _id: crees.enfant });
    if (crees.parent) await Parent.deleteOne({ _id: crees.parent });
    if (crees.saison) await Saison.deleteOne({ _id: crees.saison });
  }
}

// Exécute une action qui DOIT échouer, et renvoie le message d'erreur obtenu
async function messageErreur(action: () => Promise<unknown>) {
  try {
    await action();
    return "PROBLÈME : aucune erreur, la donnée incorrecte a été acceptée !";
  } catch (error) {
    if (error instanceof MongooseError.ValidationError) {
      return Object.values(error.errors).map((e) => e.message);
    }
    return String(error);
  }
}
