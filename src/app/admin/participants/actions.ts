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

export type EtatInscription = { erreurs?: Record<string, string>; message?: string };

const LIENS = ["mere", "pere", "tuteur"];
const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

// Erreurs Mongoose → { "nom du champ": "message" } (avec un préfixe pour les parents)
function erreursDe(e: unknown, prefixe = ""): Record<string, string> {
  const r: Record<string, string> = {};
  if (e instanceof ErreurMongoose.ValidationError) {
    for (const [champ, err] of Object.entries(e.errors)) r[prefixe + champ] ??= err.message;
  }
  return r;
}

export async function creerInscription(
  _etat: EtatInscription,
  fd: FormData,
): Promise<EtatInscription> {
  await exigerAdmin(); // OBLIGATOIRE
  await connectDB();

  const type = texte(fd, "type") === "adulte" ? "adulte" : "enfant";
  const erreurs: Record<string, string> = {};

  // Saison active
  const saison = await Saison.findOne({ active: true }).lean();
  if (!saison) return { message: "Aucune saison active : il faut d’abord en créer une." };

  // Séances choisies
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
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateDebut)) erreurs.dateDebut = "Date de début invalide";

  // Parents (enfant uniquement)
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

  // Participant
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

  // Doublon : même personne déjà enregistrée ?
  const doublon = await Participant.findOne(
    type === "enfant"
      ? { nom: participant.nom, prenom: participant.prenom, dateNaissance: participant.dateNaissance }
      : { nom: participant.nom, prenom: participant.prenom, telephone: participant.telephone },
  )
    .collation({ locale: "fr", strength: 1 }) // ignore majuscules et accents
    .lean();
  if (doublon) {
    return { message: `${participant.prenom} ${participant.nom} est déjà enregistré(e). Cherchez sa fiche dans Participants.` };
  }

  // Enregistrement TOUT OU RIEN (transaction)
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
// Modifier un participant (les parents se gèrent depuis la page Parents)
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

  // Date du jour à Tunis (minuit UTC, comme toutes nos dates de calendrier)
  const aujourdhui = new Date(new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date()));

  try {
    await mongoose.connection.transaction(async (session) => {
      await participant.save({ session });
      // Passage en inactif → on termine ses inscriptions en cours
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

  revalidatePath("/admin/participants");
  revalidatePath(`/admin/participants/${id}`);
  revalidatePath("/admin/seances");
  redirect(`/admin/participants/${id}`);
}