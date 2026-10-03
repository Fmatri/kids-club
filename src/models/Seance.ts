import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

// Jours de la semaine : 1 = lundi … 7 = dimanche (norme internationale ISO)
export const JOURS_SEMAINE = {
  1: "Lundi",
  2: "Mardi",
  3: "Mercredi",
  4: "Jeudi",
  5: "Vendredi",
  6: "Samedi",
  7: "Dimanche",
} as const;

export const PUBLICS_SEANCE = ["enfant", "adulte"] as const;

// Heure au format HH:MM (00:00 à 23:59)
const REGEX_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

const seanceSchema = new Schema(
  {
    jour: {
      type: Number,
      required: [true, "Le jour est obligatoire"],
      min: [1, "Jour invalide (1 = lundi … 7 = dimanche)"],
      max: [7, "Jour invalide (1 = lundi … 7 = dimanche)"],
      validate: {
        validator: Number.isInteger,
        message: "Le jour doit être un nombre entier",
      },
    },
    heureDebut: {
      type: String,
      required: [true, "L'heure de début est obligatoire"],
      match: [REGEX_HEURE, "Format attendu : 15:00"],
    },
    heureFin: {
      type: String,
      required: [true, "L'heure de fin est obligatoire"],
      match: [REGEX_HEURE, "Format attendu : 16:30"],
    },
    public: {
      type: String,
      enum: {
        values: PUBLICS_SEANCE,
        message: "Public invalide (enfant ou adulte)",
      },
      required: [true, "Le public est obligatoire"],
    },
    tarifMensuel: {
      type: Number, // en millimes : 100 DT = 100000
      required: [true, "Le tarif mensuel est obligatoire"],
      min: [0, "Le tarif ne peut pas être négatif"],
      validate: {
        validator: Number.isInteger,
        message: "Le tarif doit être en millimes (nombre entier)",
      },
    },
    capacite: {
      type: Number, // vide = pas de limite
      min: [1, "La capacité doit être d'au moins 1 place"],
      validate: {
        validator: (v: number | null | undefined) =>
          v == null || Number.isInteger(v),
        message: "La capacité doit être un nombre entier",
      },
    },
    animateur: {
      type: String,
      trim: true,
      maxlength: [60, "60 caractères maximum"],
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

// L'heure de fin doit être après l'heure de début
seanceSchema.pre("validate", function () {
  if (this.heureDebut && this.heureFin && this.heureFin <= this.heureDebut) {
    this.invalidate(
      "heureFin",
      "L'heure de fin doit être après l'heure de début",
    );
  }
});

// Pas deux séances ACTIVES au même jour, même heure de début, même public
seanceSchema.index(
  { jour: 1, heureDebut: 1, public: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);

export type SeanceType = InferSchemaType<typeof seanceSchema>;

export const Seance: Model<SeanceType> =
  (models.Seance as Model<SeanceType> | undefined) ??
  model<SeanceType>("Seance", seanceSchema);
