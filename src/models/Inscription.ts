import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { versJourCalendaire } from "@/lib/regles";

const inscriptionSchema = new Schema(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: [true, "Le participant est obligatoire"],
    },
    seance: {
      type: Schema.Types.ObjectId,
      ref: "Seance",
      required: [true, "La séance est obligatoire"],
    },
    saison: {
      type: Schema.Types.ObjectId,
      ref: "Saison",
      required: [true, "La saison est obligatoire"],
    },
    dateDebut: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
      set: versJourCalendaire,
    },
    dateFin: {
      type: Date, // vide = inscription en cours
      set: versJourCalendaire,
    },
    // Calculé automatiquement : true tant qu'il n'y a pas de date de fin
    enCours: { type: Boolean, default: true },
  },
  { timestamps: true },
);

inscriptionSchema.pre("validate", function () {
  // La fin ne peut pas être avant le début
  if (this.dateDebut && this.dateFin && this.dateFin < this.dateDebut) {
    this.invalidate(
      "dateFin",
      "La date de fin ne peut pas être avant la date de début",
    );
  }
  // Mise à jour automatique de "enCours"
  this.enCours = !this.dateFin;
});

// Pas deux inscriptions EN COURS du même participant à la même séance
inscriptionSchema.index(
  { participant: 1, seance: 1 },
  { unique: true, partialFilterExpression: { enCours: true } },
);
// Retrouver vite les participants actuels d'une séance (écran d'appel)
inscriptionSchema.index({ seance: 1, enCours: 1 });
// Retrouver vite l'historique d'un participant (bilan de présence)
inscriptionSchema.index({ participant: 1, dateDebut: -1 });

export type InscriptionType = InferSchemaType<typeof inscriptionSchema>;

export const Inscription: Model<InscriptionType> =
  (models.Inscription as Model<InscriptionType> | undefined) ??
  model<InscriptionType>("Inscription", inscriptionSchema);
