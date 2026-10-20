"use server";

import mongoose, { Error as ErreurMongoose, isValidObjectId, type HydratedDocument } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Inscription } from "@/models/Inscription";
import { Parent, type ParentType } from "@/models/Parent";
import { Participant } from "@/models/Participant";
import { Saison } from "@/models/Saison";
import { Seance } from "@/models/Seance";

export type EtatInscription = { erreurs?: Record<string, string>; message?: string; ok?: boolean };

const LIENS = ["mere", "pere", "tuteur"];
const REGEX_DATE = /^\d{4}-\d{2}-\d{2}$/;
const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

// Erreurs Mongoose → { "nom du champ": "message" } (avec un préfixe pour les parents)
function erreursDe(e: unknown, prefixe = ""): Record<string, string> {
  const r: Record<string, string> = {};
  if (e instanceof ErreurMongoose.ValidationError) {
    for (const [champ, err] of Object.entries(e.errors)) r[prefixe + champ] ??= err.message;
  }
  return r;
}

// Premier message d'erreur lisible
function messageErreur(e: unknown) {
  const premier = Object.values(erreursDe(e))[0];
  if (premier) return premier;
  if (typeof e === "object" && e !== null && "code" in e && e.code === 11000) {
    return "Déjà inscrit(e) à cette séance.";
  }
  console.error(e);
  return "L’enregistrement a échoué : rien n’a été modifié. Réessayez.";
}

// La séance peut-elle accueillir ce participant ?
async function verifierSeance(idSeance: string, type: string): Promise<string | null> {
  if (!isValidObjectId(idSeance)) return "Choisissez une séance.";
  const s = await Seance.findById(idSeance).lean();
  if (!s || !s.active) return "Cette séance n’existe plus ou est désactivée.";
  if (s.public !== type) return "Cette séance ne correspond pas au public (enfant / adulte).";
  if (s.capacite != null) {
    const inscrits = await Inscription.countDocuments({ seance: s._id, enCours: true });
    if (inscrits >= s.capacite) return "Cette séance est complète.";
  }
  return null;
}

function rafraichir(idParticipant: unknown) {
  revalidatePath(`/admin/participants/${String(idParticipant)}`);
  revalidatePath("/admin/participants");
  revalidatePath("/admin/seances");
}

// Date du jour à Tunis (minuit UTC, comme toutes nos dates de calendrier)
function aujourdhuiDate() {
  return new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date()));
}

// ---------- 1. Nouvelle inscription ----------

export async function creerInscription(
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE
  await connectDB();

  const type = texte(fd, "type") === "adulte" ? "adulte" : "enfant";
  const erreurs: Record<string, string> = {};

  const saison = await Saison.findOne({ active: true }).lean();
  if (!saison) return { message: "Aucune saison active : il faut d’abord en créer une." };

  const idsSeances = [...new Set(fd.getAll("seances").map(String))].filter((id) => isValidObjectId(id));
  const seances = await Seance.find({ _id: { $in: idsSeances }, active: true }).lean();
  if (idsSeances.length === 0) erreurs.seances = "Choisissez au moins une séance";
  else if (seances.length !== idsSeances.length) erreurs.seances = "Une séance choisie n’existe plus ou est désactivée";
  for (const s of seances) {
    if (s.public !== type) erreurs.seances = "Une séance choisie ne correspond pas au public (enfant / adulte)";
    if (s.capacite != null) {
      const inscrits = await Inscription.countDocuments({ seance: s._id, enCours: true });
      if (inscrits >= s.capacite) erreurs.seances = "Une séance choisie est complète";
    }
  }

  const dateDebut = texte(fd, "dateDebut");
  if (!REGEX_DATE.test(dateDebut)) erreurs.dateDebut = "Date de début invalide";

  const liens: { parent: mongoose.Types.ObjectId; lien: string; principal: boolean }[] = [];
  const nouveauxParents: HydratedDocument<ParentType>[] = [];

  if (type === "enfant") {
    const nb = texte(fd, "nbParents") === "2" ? 2 : 1;
    const principal = nb === 2 && texte(fd, "principal") === "1" ? 1 : 0;

    for (let i = 0; i < nb; i++) {
      const p = `parents.${i}.`;
      const lien = texte(fd, p + "lien");
      if (!LIENS.includes(lien)) erreurs[p + "lien"] = "Choisissez le lien";

      if (texte(fd, p + "mode") === "existant") {
        const id = texte(fd, p + "id");
        if (!isValidObjectId(id) || !(await Parent.exists({ _id: id }))) {
          erreurs[p + "id"] = "Choisissez un parent dans la liste";
          continue;
        }
        liens.push({ parent: new mongoose.Types.ObjectId(id), lien, principal: i === principal });
      } else {
        const parent = new Parent({
          prenom: texte(fd, p + "prenom"),
          nom: texte(fd, p + "nom"),
          telephone: texte(fd, p + "telephone"),
          whatsapp: texte(fd, p + "whatsapp") || undefined,
          email: texte(fd, p + "email") || undefined,
        });
        try {
          await parent.validate();
        } catch (e) {
          Object.assign(erreurs, erreursDe(e, p));
        }
        if (parent.telephone && !erreurs[p + "telephone"]) {
          const existant = await Parent.findOne({ telephone: parent.telephone }).lean();
          if (existant) {
            erreurs[p + "telephone"] =
              `Numéro déjà enregistré pour ${existant.prenom} ${existant.nom} : choisissez « Déjà enregistré ».`;
          }
        }
        nouveauxParents.push(parent);
        liens.push({ parent: parent._id, lien, principal: i === principal });
      }
    }
  }

  const participant = new Participant({
    type,
    prenom: texte(fd, "prenom"),
    nom: texte(fd, "nom"),
    dateNaissance: type === "enfant" ? texte(fd, "dateNaissance") || undefined : undefined,
    autorisationPhoto: fd.get("autorisationPhoto") === "on",
    telephone: type === "adulte" ? texte(fd, "telephone") || undefined : undefined,
    email: type === "adulte" ? texte(fd, "email") || undefined : undefined,
    parents: liens,
    contactUrgence: {
      nom: texte(fd, "contactUrgence.nom") || undefined,
      telephone: texte(fd, "contactUrgence.telephone") || undefined,
      lien: texte(fd, "contactUrgence.lien") || undefined,
    },
    sante: {
      allergies: texte(fd, "sante.allergies")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 20),
      remarques: texte(fd, "sante.remarques") || undefined,
    },
    notes: texte(fd, "notes") || undefined,
  });
  try {
    await participant.validate();
  } catch (e) {
    for (const [cle, msg] of Object.entries(erreursDe(e))) erreurs[cle] ??= msg;
  }

  if (Object.keys(erreurs).length > 0) {
    return { erreurs, message: "Certaines informations sont à corriger." };
  }

  const doublon = await Participant.findOne(
    type === "enfant"
      ? { nom: participant.nom, prenom: participant.prenom, dateNaissance: participant.dateNaissance }
      : { nom: participant.nom, prenom: participant.prenom, telephone: participant.telephone },
  )
    .collation({ locale: "fr", strength: 1 })
    .lean();
  if (doublon) {
    return { message: `${participant.prenom} ${participant.nom} est déjà enregistré(e). Cherchez sa fiche dans Participants.` };
  }

  try {
    await mongoose.connection.transaction(async (session) => {
      for (const parent of nouveauxParents) await parent.save({ session });
      await participant.save({ session });
      for (const s of seances) {
        await new Inscription({
          participant: participant._id,
          seance: s._id,
          saison: saison._id,
          dateDebut,
        }).save({ session });
      }
    });
  } catch (e) {
    console.error(e);
    return { message: "L’enregistrement a échoué : rien n’a été enregistré. Réessayez." };
  }

  revalidatePath("/admin/participants");
  revalidatePath("/admin/seances");
  redirect(`/admin/participants/${participant._id}`);
}

// ---------- 2. Modifier un participant ----------

export async function modifierParticipant(
  id: string,
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE

  if (!isValidObjectId(id)) return { message: "Participant introuvable." };
  await connectDB();
  const participant = await Participant.findById(id);
  if (!participant) return { message: "Participant introuvable." };

  const ancienStatut = participant.statut;
  const statut = texte(fd, "statut") === "inactif" ? "inactif" : "actif";

  participant.set({
    prenom: texte(fd, "prenom"),
    nom: texte(fd, "nom"),
    dateNaissance: participant.type === "enfant" ? texte(fd, "dateNaissance") || undefined : undefined,
    telephone: participant.type === "adulte" ? texte(fd, "telephone") || undefined : undefined,
    email: participant.type === "adulte" ? texte(fd, "email") || undefined : undefined,
    autorisationPhoto: fd.get("autorisationPhoto") === "on",
    statut,
    contactUrgence: {
      nom: texte(fd, "contactUrgence.nom") || undefined,
      telephone: texte(fd, "contactUrgence.telephone") || undefined,
      lien: texte(fd, "contactUrgence.lien") || undefined,
    },
    sante: {
      allergies: texte(fd, "sante.allergies")
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean)
        .slice(0, 20),
      remarques: texte(fd, "sante.remarques") || undefined,
    },
    notes: texte(fd, "notes") || undefined,
  });

  try {
    await participant.validate();
  } catch (e) {
    return { erreurs: erreursDe(e), message: "Certaines informations sont à corriger." };
  }

  const aujourdhui = aujourdhuiDate();
  try {
    await mongoose.connection.transaction(async (session) => {
      await participant.save({ session });
      if (ancienStatut === "actif" && statut === "inactif") {
        const enCours = await Inscription.find({ participant: participant._id, enCours: true }).session(session);
        for (const inscription of enCours) {
          inscription.dateFin = inscription.dateDebut > aujourdhui ? inscription.dateDebut : aujourdhui;
          await inscription.save({ session });
        }
      }
    });
  } catch (e) {
    console.error(e);
    return { message: "L’enregistrement a échoué : rien n’a été modifié. Réessayez." };
  }

  rafraichir(id);
  redirect(`/admin/participants/${id}`);
}

// ---------- 3. Gérer les inscriptions depuis la fiche ----------

export async function terminerInscription(
  idInscription: string,
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE

  const date = texte(fd, "date");
  if (!REGEX_DATE.test(date)) return { message: "Date invalide." };
  if (!isValidObjectId(idInscription)) return { message: "Inscription introuvable." };

  await connectDB();
  const inscription = await Inscription.findById(idInscription);
  if (!inscription || !inscription.enCours) return { message: "Inscription introuvable ou déjà terminée." };

  inscription.set({ dateFin: date });
  try {
    await inscription.save();
  } catch (e) {
    return { message: messageErreur(e) };
  }
  rafraichir(inscription.participant);
  return { ok: true };
}

export async function changerSeance(
  idInscription: string,
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE

  const date = texte(fd, "date");
  const idSeance = texte(fd, "seance");
  if (!REGEX_DATE.test(date)) return { message: "Date invalide." };
  if (!isValidObjectId(idInscription)) return { message: "Inscription introuvable." };

  await connectDB();
  const ancienne = await Inscription.findById(idInscription);
  if (!ancienne || !ancienne.enCours) return { message: "Inscription introuvable ou déjà terminée." };
  const participant = await Participant.findById(ancienne.participant).lean();
  if (!participant) return { message: "Participant introuvable." };
  if (participant.statut === "inactif") return { message: "Réactivez d’abord ce participant (bouton Modifier)." };
  if (String(ancienne.seance) === idSeance) return { message: "C’est déjà sa séance actuelle." };

  const probleme = await verifierSeance(idSeance, participant.type);
  if (probleme) return { message: probleme };

  ancienne.set({ dateFin: date });
  const nouvelle = new Inscription({
    participant: participant._id,
    seance: idSeance,
    saison: ancienne.saison,
    dateDebut: date,
  });

  try {
    await mongoose.connection.transaction(async (session) => {
      await ancienne.save({ session });
      await nouvelle.save({ session });
    });
  } catch (e) {
    return { message: messageErreur(e) };
  }
  rafraichir(participant._id);
  return { ok: true };
}

export async function ajouterSeance(
  idParticipant: string,
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE

  const date = texte(fd, "date");
  const idSeance = texte(fd, "seance");
  if (!REGEX_DATE.test(date)) return { message: "Date invalide." };
  if (!isValidObjectId(idParticipant)) return { message: "Participant introuvable." };

  await connectDB();
  const participant = await Participant.findById(idParticipant).lean();
  if (!participant) return { message: "Participant introuvable." };
  if (participant.statut === "inactif") return { message: "Réactivez d’abord ce participant (bouton Modifier)." };

  const probleme = await verifierSeance(idSeance, participant.type);
  if (probleme) return { message: probleme };

  const saison = await Saison.findOne({ active: true }).lean();
  if (!saison) return { message: "Aucune saison active." };

  try {
    await new Inscription({
      participant: participant._id,
      seance: idSeance,
      saison: saison._id,
      dateDebut: date,
    }).save();
  } catch (e) {
    return { message: messageErreur(e) };
  }
  rafraichir(participant._id);
  return { ok: true };
}