import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { aujourdhuiTunis, versJourCalendaire } from "@/lib/regles";

export const STATUTS_PRESENCE = ["present", "absent", "excuse"] as const;

// La présence d'UN participant dans un appel (sous-document intégré)
const presenceSchema = new Schema(
  {
    participant: {
      type: Schema.Types.ObjectId,
      ref: "Participant",
      required: [true, "Le participant est obligatoire"],
    },
    statut: {
      type: String,
      enum: {
        values: STATUTS_PRESENCE,
        message: "Statut invalide (présent, absent ou excusé)",
      },
      required: [true, "Le statut est obligatoire"],
      default: "present",
    },
    motif: {
      type: String,
      trim: true,
      maxlength: [200, "200 caractères maximum"],
    },
  },
  { _id: false },
);

const appelSchema = new Schema(
  {
    seance: {
      type: Schema.Types.ObjectId,
      ref: "Seance",
      required: [true, "La séance est obligatoire"],
    },
    date: {
      type: Date,
      required: [true, "La date est obligatoire"],
      set: versJourCalendaire,
    },
    presences: { type: [presenceSchema], default: [] },
  },
  { timestamps: true },
);

appelSchema.pre("validate", function () {
  // Pas d'appel dans le futur (selon la date de Tunis)
  if (this.date && this.date > aujourdhuiTunis()) {
    this.invalidate("date", "On ne peut pas faire l'appel d'une date future");
  }

  // Au moins un participant
  if (this.presences.length === 0) {
    this.invalidate(
      "presences",
      "L'appel doit contenir au moins un participant",
    );
  }

  // Pas deux fois le même participant
  const ids = this.presences.map((p) => String(p.participant));
  if (new Set(ids).size !== ids.length) {
    this.invalidate(
      "presences",
      "Un participant apparaît deux fois dans l'appel",
    );
  }

  // Pas de motif pour un participant présent
  for (const p of this.presences) {
    if (p.statut === "present") p.motif = undefined;
  }
});

// Un seul appel par séance et par date
appelSchema.index({ seance: 1, date: 1 }, { unique: true });
// Retrouver vite les présences d'un participant sur une période (bilan du mois)
appelSchema.index({ "presences.participant": 1, date: 1 });

export type AppelType = InferSchemaType<typeof appelSchema>;

export const Appel: Model<AppelType> =
  (models.Appel as Model<AppelType> | undefined) ??
  model<AppelType>("Appel", appelSchema);
