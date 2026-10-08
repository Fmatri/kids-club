import "server-only";
import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { versJourCalendaire } from "@/lib/regles";

export const TYPES_PROGRAMME = ["stage", "club_vacances", "atelier", "evenement"] as const;

// Transforme un titre en "slug" pour les adresses web :
// "Club d'été créatif" + 2027 -> "club-d-ete-creatif-2027"
export function creerSlug(titre: string, annee?: number) {
  const base = titre
    .normalize("NFD") // sépare les lettres de leurs accents : "é" -> "e" + accent
    .replace(/[\u0300-\u036f]/g, "") // supprime les accents
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // tout ce qui n'est pas lettre/chiffre devient "-"
    .replace(/^-+|-+$/g, ""); // enlève les "-" au début et à la fin
  return annee ? `${base}-${annee}` : base;
}

// Entier positif ou vide
const entierOuVide = (v: number | null | undefined) => v == null || Number.isInteger(v);

// Une formule de prix (sous-document intégré)
const formuleSchema = new Schema(
  {
    nom: {
      type: String,
      required: [true, "Le nom de la formule est obligatoire"],
      trim: true,
      maxlength: [60, "60 caractères maximum"],
    },
    prix: {
      type: Number, // en millimes : 180 DT = 180000
      required: [true, "Le prix est obligatoire"],
      min: [0, "Le prix ne peut pas être négatif"],
      validate: { validator: Number.isInteger, message: "Le prix doit être en millimes (nombre entier)" },
    },
    description: { type: String, trim: true, maxlength: [200, "200 caractères maximum"] },
  },
  { _id: false },
);

const programmeSchema = new Schema(
  {
    type: {
      type: String,
      enum: { values: TYPES_PROGRAMME, message: "Type invalide (stage, club de vacances, atelier ou événement)" },
      required: [true, "Le type est obligatoire"],
    },
    titre: {
      type: String,
      required: [true, "Le titre est obligatoire"],
      trim: true,
      maxlength: [120, "120 caractères maximum"],
    },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, trim: true, maxlength: [5000, "5000 caractères maximum"] },
    activites: { type: [{ type: String, trim: true }], default: [] },
    dateDebut: {
      type: Date,
      required: [true, "La date de début est obligatoire"],
      set: versJourCalendaire,
    },
    dateFin: {
      type: Date,
      required: [true, "La date de fin est obligatoire"],
      set: versJourCalendaire,
    },
    horaires: { type: String, trim: true, maxlength: [200, "200 caractères maximum"] },
    ageMin: {
      type: Number,
      min: [0, "Âge invalide"],
      max: [99, "Âge invalide"],
      validate: { validator: entierOuVide, message: "L'âge doit être un nombre entier" },
    },
    ageMax: {
      type: Number,
      min: [0, "Âge invalide"],
      max: [99, "Âge invalide"],
      validate: { validator: entierOuVide, message: "L'âge doit être un nombre entier" },
    },
    formules: { type: [formuleSchema], default: [] },
    capacite: {
      type: Number, // vide = pas de limite
      min: [1, "La capacité doit être d'au moins 1 place"],
      validate: { validator: entierOuVide, message: "La capacité doit être un nombre entier" },
    },
    photos: { type: [{ type: String, trim: true }], default: [] },
    publieSurLeSite: { type: Boolean, default: false },
  },
  { timestamps: true },
);

programmeSchema.pre("validate", function () {
  // La fin ne peut pas être avant le début (même jour accepté)
  if (this.dateDebut && this.dateFin && this.dateFin < this.dateDebut) {
    this.invalidate("dateFin", "La date de fin ne peut pas être avant la date de début");
  }

  // L'âge maximum doit être >= à l'âge minimum
  if (this.ageMin != null && this.ageMax != null && this.ageMax < this.ageMin) {
    this.invalidate("ageMax", "L'âge maximum doit être supérieur ou égal à l'âge minimum");
  }

  // Au moins une formule de prix
  if (this.formules.length === 0) {
    this.invalidate("formules", "Il faut au moins une formule de prix");
  }

  // Slug créé une seule fois, à partir du titre et de l'année de début
  if (!this.slug && this.titre) {
    this.slug = creerSlug(this.titre, this.dateDebut?.getUTCFullYear());
  }
});

// Liste des programmes publiés, du plus récent au plus ancien (page de la vitrine)
programmeSchema.index({ publieSurLeSite: 1, dateDebut: -1 });

export type ProgrammeType = InferSchemaType<typeof programmeSchema>;

export const Programme: Model<ProgrammeType> =
  (models.Programme as Model<ProgrammeType> | undefined) ??
  model<ProgrammeType>("Programme", programmeSchema);