"use server";

import { Error as ErreurMongoose, isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { PUBLICS_SEANCE, Seance } from "@/models/Seance";

export type EtatFormulaire = {
  erreurs?: Record<string, string>;
  message?: string;
  valeurs?: Record<string, string>;
};

const REGEX_HEURE = /^([01]\d|2[0-3]):[0-5]\d$/;

// Champ vide → undefined ; "12,5" → 12.5
const versNombre = (v: unknown) =>
  v === "" || v == null ? undefined : Number(String(v).replace(",", "."));

const schemaSeance = z
  .object({
    id: z.string().optional(),
    jour: z.preprocess(versNombre, z.number({ error: "Choisissez un jour" }).int().min(1).max(7)),
    heureDebut: z.string().regex(REGEX_HEURE, "Indiquez l'heure de début"),
    heureFin: z.string().regex(REGEX_HEURE, "Indiquez l'heure de fin"),
    public: z.enum(PUBLICS_SEANCE, { error: "Choisissez le public" }),
    tarif: z.preprocess(
      versNombre,
      z.number({ error: "Indiquez le tarif en dinars" }).min(0, "Le tarif ne peut pas être négatif"),
    ),
    capacite: z.preprocess(
      versNombre,
      z
        .number({ error: "Capacité invalide" })
        .int("Nombre entier attendu")
        .min(1, "Au moins 1 place")
        .optional(),
    ),
    animateur: z.string().trim().max(60, "60 caractères maximum").optional(),
  })
  .refine((d) => d.heureFin > d.heureDebut, {
    path: ["heureFin"],
    message: "L'heure de fin doit être après l'heure de début",
  });

function erreurMongo(e: unknown): EtatFormulaire {
  if (e instanceof ErreurMongoose.ValidationError) {
    const erreurs: Record<string, string> = {};
    for (const [champ, err] of Object.entries(e.errors)) {
      erreurs[champ === "tarifMensuel" ? "tarif" : champ] = err.message;
    }
    return { erreurs };
  }
  if (typeof e === "object" && e !== null && "code" in e && e.code === 11000) {
    return { message: "Une séance active existe déjà ce jour-là, à cette heure, pour ce public." };
  }
  console.error(e);
  return { message: "Erreur inattendue. Réessayez." };
}

export async function enregistrerSeance(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  await exigerAdmin(); // OBLIGATOIRE : une Server Action est accessible depuis Internet

  const valeurs = Object.fromEntries(
    [...formData.entries()].map(([cle, v]) => [cle, String(v)]),
  );

  const resultat = schemaSeance.safeParse(valeurs);
  if (!resultat.success) {
    const erreurs: Record<string, string> = {};
    for (const probleme of resultat.error.issues) {
      const champ = String(probleme.path[0]);
      erreurs[champ] ??= probleme.message;
    }
    return { erreurs, valeurs };
  }
  const d = resultat.data;

  await connectDB();
  try {
    if (d.id && !isValidObjectId(d.id)) return { message: "Séance introuvable.", valeurs };
    const seance = d.id ? await Seance.findById(d.id) : new Seance();
    if (!seance) return { message: "Séance introuvable.", valeurs };

    seance.set({
      jour: d.jour,
      heureDebut: d.heureDebut,
      heureFin: d.heureFin,
      public: d.public,
      tarifMensuel: Math.round(d.tarif * 1000), // dinars → millimes
      capacite: d.capacite ?? undefined,
      animateur: d.animateur || undefined,
    });
    await seance.save(); // save() → les règles du modèle s'appliquent
  } catch (e) {
    return { ...erreurMongo(e), valeurs };
  }

  revalidatePath("/admin/seances");
  redirect("/admin/seances");
}