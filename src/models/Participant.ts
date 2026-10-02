import "server-only";
import {
  Schema,
  model,
  models,
  type InferSchemaType,
  type Model,
} from "mongoose";
import { REGEX_EMAIL, REGEX_TELEPHONE, nettoyerTelephone } from "@/lib/regles";

// Listes de valeurs autorisées (réutilisables plus tard dans les formulaires)
export const TYPES_PARTICIPANT = ["enfant", "adulte"] as const;
export const STATUTS_PARTICIPANT = ["actif", "inactif"] as const;
export const LIENS_PARENT = ["mere", "pere", "tuteur"] as const;

// Un parent lié à un enfant (sous-document intégré)
const lienParentSchema = new Schema(
  {
    parent: { type: Schema.Types.ObjectId, ref: "Parent", required: true },
    lien: {
      type: String,
      enum: {
        values: LIENS_PARENT,
        message: "Lien invalide (mère, père ou tuteur)",
      },
      required: [true, "Le lien avec l'enfant est obligatoire"],
    },
    principal: { type: Boolean, default: false },
  },
  { _id: false }, // pas besoin d'identifiant propre pour ce sous-document
);

const participantSchema = new Schema(
  {
    type: {
      type: String,
      enum: {
        values: TYPES_PARTICIPANT,
        message: "Type invalide (enfant ou adulte)",
      },
      required: [true, "Le type est obligatoire"],
    },
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
    dateNaissance: { type: Date },
    photo: { type: String, trim: true }, // chemin de l'image (l'envoi de photos viendra plus tard)
    autorisationPhoto: { type: Boolean, default: false },

    // Contact direct : utilisé pour les adultes
    telephone: {
      type: String,
      set: nettoyerTelephone,
      match: [REGEX_TELEPHONE, "Numéro de téléphone invalide"],
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [REGEX_EMAIL, "Adresse e-mail invalide"],
    },

    // Parents : utilisés pour les enfants
    parents: { type: [lienParentSchema], default: [] },

    contactUrgence: {
      nom: { type: String, trim: true },
      telephone: {
        type: String,
        set: nettoyerTelephone,
        match: [REGEX_TELEPHONE, "Numéro d'urgence invalide"],
      },
      lien: { type: String, trim: true },
    },

    sante: {
      allergies: { type: [{ type: String, trim: true }], default: [] },
      remarques: {
        type: String,
        trim: true,
        maxlength: [1000, "1000 caractères maximum"],
      },
    },

    statut: {
      type: String,
      enum: {
        values: STATUTS_PARTICIPANT,
        message: "Statut invalide (actif ou inactif)",
      },
      default: "actif",
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, "1000 caractères maximum"],
    },
  },
  { timestamps: true },
);

// Règles qui dépendent du type (enfant ou adulte), vérifiées avant chaque enregistrement
participantSchema.pre("validate", function () {
  if (this.type === "enfant") {
    // Date de naissance
    if (!this.dateNaissance) {
      this.invalidate(
        "dateNaissance",
        "La date de naissance est obligatoire pour un enfant",
      );
    } else if (this.dateNaissance > new Date()) {
      this.invalidate(
        "dateNaissance",
        "La date de naissance ne peut pas être dans le futur",
      );
    }

    // Parents : 1 ou 2, sans doublon, un seul principal
    if (this.parents.length === 0) {
      this.invalidate("parents", "Un enfant doit avoir au moins un parent");
    } else if (this.parents.length > 2) {
      this.invalidate(
        "parents",
        "Un enfant ne peut pas avoir plus de 2 parents",
      );
    } else {
      const ids = this.parents.map((p) => String(p.parent));
      if (new Set(ids).size !== ids.length) {
        this.invalidate("parents", "Le même parent est ajouté deux fois");
      }
      if (this.parents.length === 1) {
        this.parents[0].principal = true; // un seul parent = forcément le principal
      }
      const nbPrincipaux = this.parents.filter((p) => p.principal).length;
      if (nbPrincipaux !== 1) {
        this.invalidate("parents", "Il faut exactement un parent principal");
      }
    }
  }

  if (this.type === "adulte") {
    if (!this.telephone) {
      this.invalidate(
        "telephone",
        "Le téléphone est obligatoire pour un adulte",
      );
    }
    if (this.parents.length > 0) {
      this.invalidate("parents", "Un adulte ne peut pas avoir de parents liés");
    }
  }
});

// Index pour les recherches fréquentes
participantSchema.index({ statut: 1, type: 1 });
participantSchema.index({ nom: 1, prenom: 1 });
participantSchema.index({ "parents.parent": 1 }); // retrouver vite les enfants d'un parent

export type ParticipantType = InferSchemaType<typeof participantSchema>;

export const Participant: Model<ParticipantType> =
  (models.Participant as Model<ParticipantType> | undefined) ??
  model<ParticipantType>("Participant", participantSchema);
