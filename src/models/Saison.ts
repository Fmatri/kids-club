import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";

const saisonSchema = new Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la saison est obligatoire"],
      trim: true,
      unique: true,
      match: [/^\d{4}-\d{4}$/, "Format attendu : 2026-2027"],
    },
    dateDebut: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
    },
    dateFin: { type: Date, required: [true, "La date de fin est obligatoire"] },
    active: { type: Boolean, default: false },
  },
  { timestamps: true }, // ajoute createdAt et updatedAt automatiquement
);

// Vérification avant chaque enregistrement
saisonSchema.pre("validate", function () {
  if (this.dateDebut && this.dateFin && this.dateFin <= this.dateDebut) {
    this.invalidate(
      "dateFin",
      "La date de fin doit être après la date de début",
    );
  }
});

// Une seule saison peut être active à la fois (la base refuse une 2e saison active)
saisonSchema.index(
  { active: 1 },
  { unique: true, partialFilterExpression: { active: true } },
);

export type SaisonType = InferSchemaType<typeof saisonSchema>;

// Réutilise le modèle s'il existe déjà (évite une erreur quand Next.js recharge le code)
export const Saison: Model<SaisonType> =
  (models.Saison as Model<SaisonType> | undefined) ??
  model<SaisonType>("Saison", saisonSchema);
