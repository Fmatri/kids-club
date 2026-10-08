import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { REGEX_EMAIL, REGEX_TELEPHONE, nettoyerTelephone } from "@/lib/regles";

// Lien web sécurisé : doit commencer par https://
const REGEX_LIEN = /^https:\/\/\S+$/;

const parametresSchema = new Schema(
  {
    // Clé fixe : garantit qu'il n'existe qu'UN SEUL document de paramètres
    cle: { type: String, default: "club", unique: true, immutable: true },

    nomClub: {
      type: String,
      required: [true, "Le nom du club est obligatoire"],
      trim: true,
      maxlength: [100, "100 caractères maximum"],
    },
    adresse: { type: String, trim: true, maxlength: [300, "300 caractères maximum"] },
    telephone: {
      type: String,
      set: nettoyerTelephone,
      match: [REGEX_TELEPHONE, "Numéro de téléphone invalide"],
    },
    whatsapp: {
      type: String,
      set: nettoyerTelephone,
      match: [REGEX_TELEPHONE, "Numéro WhatsApp invalide"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [REGEX_EMAIL, "Adresse e-mail invalide"],
    },
    reseauxSociaux: {
      facebook: { type: String, trim: true, match: [REGEX_LIEN, "Le lien doit commencer par https://"] },
      instagram: { type: String, trim: true, match: [REGEX_LIEN, "Le lien doit commencer par https://"] },
    },
    lienCarte: { type: String, trim: true, match: [REGEX_LIEN, "Le lien doit commencer par https://"] },
    logo: { type: String, trim: true }, // chemin de l'image (l'envoi d'images viendra plus tard)
  },
  { timestamps: true },
);

export type ParametresType = InferSchemaType<typeof parametresSchema>;

export const Parametres: Model<ParametresType> =
  (models.Parametres as Model<ParametresType> | undefined) ??
  model<ParametresType>("Parametres", parametresSchema);