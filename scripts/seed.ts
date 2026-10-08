/**
 * Données de test (seed) — DÉVELOPPEMENT UNIQUEMENT
 * Vide la base locale puis la remplit avec des données fictives réalistes.
 * Lancement : pnpm db:seed
 */
import mongoose, { type Collection, type Types } from "mongoose";
import { faker } from "@faker-js/faker";
import { connectDB } from "@/lib/db";
import { aujourdhuiTunis } from "@/lib/regles";
import { Saison } from "@/models/Saison";
import { Parent } from "@/models/Parent";
import { Participant } from "@/models/Participant";
import { Seance } from "@/models/Seance";
import { Inscription } from "@/models/Inscription";
import { Appel } from "@/models/Appel";
import { Parametres } from "@/models/Parametres";
import { Programme } from "@/models/Programme";

// ---------- 0. Sécurité : uniquement sur la base LOCALE ----------
const uri = process.env.MONGODB_URI ?? "";
if (process.env.NODE_ENV === "production" || !/localhost|127\.0\.0\.1/.test(uri)) {
  console.error("⛔ Refusé : le seed ne s'exécute que sur la base locale de développement.");
  process.exit(1);
}

// Même "graine" = mêmes données à chaque lancement (résultats reproductibles)
faker.seed(2026);

// ---------- Listes de noms tunisiens ----------
const PRENOMS_GARCONS = ["Adam", "Youssef", "Rayen", "Aziz", "Iyed", "Ahmed", "Skander", "Elyes", "Amine", "Omar", "Ilyes", "Hedi"];
const PRENOMS_FILLES = ["Lina", "Sarra", "Mariem", "Yasmine", "Eya", "Nour", "Farah", "Malek", "Rania", "Ines", "Salma", "Emna"];
const PRENOMS_FEMMES = ["Sonia", "Amel", "Leila", "Hela", "Nadia", "Rim", "Olfa", "Samia", "Wafa", "Imen"];
const PRENOMS_HOMMES = ["Karim", "Sami", "Mehdi", "Walid", "Nabil", "Hatem", "Bilel", "Anis", "Riadh", "Fares"];
const NOMS = [
  "Ben Ali", "Trabelsi", "Gharbi", "Jaziri", "Mansouri", "Ayari", "Hammami", "Bouaziz", "Chaabane",
  "Khelifi", "Saidi", "Ferchichi", "Mejri", "Dridi", "Jebali", "Masmoudi", "Zouari", "Belhadj",
];
const ALLERGIES = ["arachides", "lactose", "gluten", "œufs", "pollen"];
const MOTIFS = ["malade", "voyage", "rendez-vous médical", "examen scolaire", "raison familiale"];

const UN_JOUR = 24 * 60 * 60 * 1000; // en millisecondes

// Numéro tunisien fictif : 8 chiffres commençant par 2, 5 ou 9
function telephone() {
  return faker.helpers.arrayElement(["2", "5", "9"]) + faker.string.numeric(7);
}

// Jour de la semaine au format 1 = lundi … 7 = dimanche
function jourIso(date: Date) {
  const jour = date.getUTCDay(); // 0 = dimanche en JavaScript
  return jour === 0 ? 7 : jour;
}

// Supprime une collection (sans erreur si elle n'existe pas encore)
async function vider(collection: Collection) {
  try {
    await collection.drop();
  } catch {
    // la collection n'existait pas : rien à faire
  }
}

async function main() {
  await connectDB();

  // ---------- 1. Vider les collections du club ----------
  console.log("🧹 Vidage de la base de développement…");
  await vider(Appel.collection);
  await vider(Inscription.collection);
  await vider(Participant.collection);
  await vider(Parent.collection);
  await vider(Seance.collection);
  await vider(Programme.collection);
  await vider(Saison.collection);
  await vider(Parametres.collection);

  // Recréer les index (unicité, recherches rapides)
  await Promise.all([
    Saison.init(), Parent.init(), Participant.init(), Seance.init(),
    Inscription.init(), Appel.init(), Parametres.init(), Programme.init(),
  ]);

  // ---------- 2. Paramètres et saison ----------
  await Parametres.create({
    nomClub: "Pygmalion Art Club",
    adresse: "Ennasr, Avenue Hédi Nouira, Résidence Atlantique – mezzanine",
  });

  const saison = await Saison.create({
    nom: "2026-2027",
    dateDebut: new Date("2026-09-01"),
    dateFin: new Date("2027-06-30"),
    active: true,
  });

  // ---------- 3. Les 7 séances du club ----------
  const seancesEnfants = await Seance.create([
    { jour: 3, heureDebut: "15:00", heureFin: "16:30", public: "enfant", tarifMensuel: 100000, capacite: 12, animateur: "Mme Sarra" },
    { jour: 3, heureDebut: "16:30", heureFin: "18:00", public: "enfant", tarifMensuel: 100000, capacite: 12, animateur: "Mme Sarra" },
    { jour: 6, heureDebut: "10:30", heureFin: "12:00", public: "enfant", tarifMensuel: 100000, capacite: 12 },
    { jour: 6, heureDebut: "12:00", heureFin: "13:30", public: "enfant", tarifMensuel: 100000, capacite: 12 },
    { jour: 6, heureDebut: "13:30", heureFin: "15:00", public: "enfant", tarifMensuel: 100000, capacite: 12 },
  ]);
  // Tarif adultes FICTIF en attendant la réponse de la cliente
  const seancesAdultes = await Seance.create([
    { jour: 3, heureDebut: "18:00", heureFin: "19:30", public: "adulte", tarifMensuel: 120000, capacite: 10 },
    { jour: 7, heureDebut: "15:00", heureFin: "16:30", public: "adulte", tarifMensuel: 120000, capacite: 10 },
  ]);

  // ---------- 4. Familles : parents + enfants ----------
  const inscriptionsPrevues: { participant: Types.ObjectId; seanceIndex: number; adulte: boolean; dateDebut: Date }[] = [];
  let nbParents = 0;
  let nbEnfants = 0;

  for (let i = 0; i < 18; i++) {
    const nom = NOMS[i];
    const mere = await Parent.create({ nom, prenom: faker.helpers.arrayElement(PRENOMS_FEMMES), telephone: telephone() });
    nbParents++;

    // 40 % des enfants ont aussi le père enregistré
    const pere = faker.datatype.boolean({ probability: 0.4 })
      ? await Parent.create({ nom, prenom: faker.helpers.arrayElement(PRENOMS_HOMMES), telephone: telephone() })
      : null;
    if (pere) nbParents++;

    // 1 enfant (70 %) ou 2 enfants (30 %) par famille
    const nbEnfantsFamille = faker.helpers.weightedArrayElement([
      { weight: 7, value: 1 },
      { weight: 3, value: 2 },
    ]);

    for (let k = 0; k < nbEnfantsFamille; k++) {
      const fille = faker.datatype.boolean();
      const enfant = await Participant.create({
        type: "enfant",
        nom,
        prenom: faker.helpers.arrayElement(fille ? PRENOMS_FILLES : PRENOMS_GARCONS),
        dateNaissance: faker.date.between({ from: "2014-01-01", to: "2021-06-30" }),
        autorisationPhoto: faker.datatype.boolean({ probability: 0.75 }),
        parents: pere
          ? [
              { parent: mere._id, lien: "mere", principal: true },
              { parent: pere._id, lien: "pere" },
            ]
          : [{ parent: mere._id, lien: "mere" }],
        sante: {
          allergies: faker.datatype.boolean({ probability: 0.15 }) ? [faker.helpers.arrayElement(ALLERGIES)] : [],
        },
        contactUrgence: faker.datatype.boolean({ probability: 0.5 })
          ? { nom: `${faker.helpers.arrayElement(PRENOMS_FEMMES)} ${nom}`, telephone: telephone(), lien: "tante" }
          : undefined,
      });
      nbEnfants++;

      // 80 % ont commencé à la rentrée, 20 % le 15 septembre
      inscriptionsPrevues.push({
        participant: enfant._id,
        seanceIndex: nbEnfants % seancesEnfants.length, // répartition équilibrée
        adulte: false,
        dateDebut: faker.datatype.boolean({ probability: 0.8 }) ? new Date("2026-09-01") : new Date("2026-09-15"),
      });
    }
  }

  // ---------- 5. Participants adultes ----------
  for (let i = 0; i < 8; i++) {
    const femme = faker.datatype.boolean();
    const adulte = await Participant.create({
      type: "adulte",
      nom: faker.helpers.arrayElement(NOMS),
      prenom: faker.helpers.arrayElement(femme ? PRENOMS_FEMMES : PRENOMS_HOMMES),
      telephone: telephone(),
      autorisationPhoto: faker.datatype.boolean({ probability: 0.5 }),
    });
    inscriptionsPrevues.push({
      participant: adulte._id,
      seanceIndex: i % seancesAdultes.length,
      adulte: true,
      dateDebut: new Date("2026-09-01"),
    });
  }

  // ---------- 6. Inscriptions ----------
  const inscriptions = inscriptionsPrevues.map((p) => ({
    participant: p.participant,
    seance: (p.adulte ? seancesAdultes : seancesEnfants)[p.seanceIndex]._id,
    saison: saison._id,
    dateDebut: p.dateDebut,
  }));
  await Inscription.create(inscriptions);

  // ---------- 7. Appels : depuis la rentrée jusqu'à hier ----------
  const hier = new Date(aujourdhuiTunis().getTime() - UN_JOUR);
  const toutesLesSeances = [...seancesEnfants, ...seancesAdultes];
  const appels = [];

  for (const seance of toutesLesSeances) {
    for (let date = new Date("2026-09-01"); date <= hier; date = new Date(date.getTime() + UN_JOUR)) {
      if (jourIso(date) !== seance.jour) continue; // pas le bon jour de la semaine

      // Participants inscrits à cette séance à cette date
      const presents = inscriptions.filter(
        (ins) => String(ins.seance) === String(seance._id) && ins.dateDebut <= date,
      );
      if (presents.length === 0) continue;

      appels.push({
        seance: seance._id,
        date: new Date(date),
        presences: presents.map((ins) => {
          const statut = faker.helpers.weightedArrayElement([
            { weight: 85, value: "present" },
            { weight: 10, value: "absent" },
            { weight: 5, value: "excuse" },
          ]);
          return {
            participant: ins.participant,
            statut,
            motif: statut === "present" ? undefined : faker.helpers.arrayElement(MOTIFS),
          };
        }),
      });
    }
  }
  await Appel.create(appels);

  // ---------- 8. Programmes ----------
  await Programme.create([
    {
      type: "club_vacances",
      titre: "Club d'été créatif",
      description: "Un mois d'activités artistiques, créatives et ludiques pendant les vacances d'été.",
      dateDebut: "2027-07-05",
      dateFin: "2027-07-30",
      horaires: "Lundi–vendredi, 8h00–15h00",
      ageMin: 5,
      activites: ["peinture", "poterie", "stop-motion", "échecs", "origami"],
      formules: [
        { nom: "Semaine", prix: 180000 },
        { nom: "Demi-journée", prix: 100000, description: "3 heures" },
        { nom: "Journée", prix: 40000 },
      ],
      capacite: 20,
      publieSurLeSite: true,
    },
    {
      type: "stage",
      titre: "Stage manga – vacances d'hiver",
      description: "Apprendre à dessiner ses propres personnages de manga.",
      dateDebut: "2026-12-21",
      dateFin: "2026-12-25",
      horaires: "9h00–12h00",
      ageMin: 8,
      ageMax: 14,
      activites: ["dessin", "manga", "illustration"],
      formules: [{ nom: "Stage complet (5 matinées)", prix: 150000 }],
      capacite: 12,
      publieSurLeSite: true,
    },
    {
      type: "atelier",
      titre: "Atelier poterie parent-enfant",
      dateDebut: "2026-11-14",
      dateFin: "2026-11-14",
      horaires: "Samedi 15h00–17h00",
      ageMin: 5,
      activites: ["argile", "poterie"],
      formules: [{ nom: "Duo parent + enfant", prix: 60000 }],
      publieSurLeSite: false, // brouillon
    },
  ]);

  // ---------- 9. Résumé ----------
  console.log("✅ Base remplie :");
  console.log(`   • 1 saison, 1 document de paramètres`);
  console.log(`   • ${toutesLesSeances.length} séances`);
  console.log(`   • ${nbParents} parents, ${nbEnfants} enfants, 8 adultes`);
  console.log(`   • ${inscriptions.length} inscriptions`);
  console.log(`   • ${appels.length} appels (du 01/09/2026 à hier)`);
  console.log(`   • 3 programmes`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant le seed :", error);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());