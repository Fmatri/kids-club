"use server";

import { Error as ErreurMongoose } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Parametres } from "@/models/Parametres";

export type EtatParametres = { erreurs?: Record<string, string>; message?: string; ok?: boolean };

const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

export async function enregistrerParametres(
  _etat: EtatParametres,
  fd: FormData,
): Promise<EtatParametres> {
  await exigerAdmin(); // OBLIGATOIRE
  await connectDB();

  // Un seul document de paramètres pour tout le club
  const parametres = (await Parametres.findOne({ cle: "club" })) ?? new Parametres({ cle: "club" });

  parametres.set({
    nomClub: texte(fd, "nomClub"),
    adresse: texte(fd, "adresse") || undefined,
    lienCarte: texte(fd, "lienCarte") || undefined,
    telephone: texte(fd, "telephone") || undefined,
    whatsapp: texte(fd, "whatsapp") || undefined,
    email: texte(fd, "email") || undefined,
    reseauxSociaux: {
      facebook: texte(fd, "reseauxSociaux.facebook") || undefined,
      instagram: texte(fd, "reseauxSociaux.instagram") || undefined,
    },
  });

  try {
    await parametres.save();
  } catch (e) {
    if (e instanceof ErreurMongoose.ValidationError) {
      const erreurs: Record<string, string> = {};
      for (const [champ, err] of Object.entries(e.errors)) erreurs[champ] ??= err.message;
      return { erreurs, message: "Certaines informations sont à corriger." };
    }
    console.error(e);
    return { message: "L’enregistrement a échoué. Réessayez." };
  }

  revalidatePath("/admin/parametres");
  return { ok: true };
}