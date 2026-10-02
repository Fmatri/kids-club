import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { REGEX_EMAIL, REGEX_TELEPHONE, nettoyerTelephone } from "@/lib/regles";

const parentSchema = new Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom est obligatoire"],
      trim: true,
      maxlength: [60, "60 caractères maximum"],
    },
    prenom: {
      type: String,
      required: [true, "Le prénom est obligatoire"],
      trim: true,
      maxlength: [60, "60 caractères maximum"],
    },
    telephone: {
      type: String,
      required: [true, "Le téléphone est obligatoire"],
      set: nettoyerTelephone, // nettoie le numéro AVANT la vérification
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
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "1000 caractères maximum"],
    },
  },
  { timestamps: true },
);

// Index pour accélérer la recherche par nom et par téléphone
parentSchema.index({ nom: 1, prenom: 1 });
parentSchema.index({ telephone: 1 });

export type ParentType = InferSchemaType<typeof parentSchema>;

export const Parent: Model<ParentType> =
  (models.Parent as Model<ParentType> | undefined) ??
  model<ParentType>("Parent", parentSchema);
