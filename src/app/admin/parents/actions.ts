"use server";

import { Error as ErreurMongoose, isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Parent } from "@/models/Parent";

export type EtatParent = { erreurs?: Record<string, string>; message?: string; ok?: boolean };

const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

export async function modifierParent(
  id: string,
  _etat: EtatParent,
  fd: FormData,
): Promise<EtatParent> {
  await exigerAdmin(); // OBLIGATOIRE

  if (!isValidObjectId(id)) return { message: "Parent introuvable." };
  await connectDB();
  const parent = await Parent.findById(id);
  if (!parent) return { message: "Parent introuvable." };

  parent.set({
    prenom: texte(fd, "prenom"),
    nom: texte(fd, "nom"),
    telephone: texte(fd, "telephone"),
    whatsapp: texte(fd, "whatsapp") || undefined,
    email: texte(fd, "email") || undefined,
    notes: texte(fd, "notes") || undefined,
  });

  try {
    await parent.validate();
  } catch (e) {
    const erreurs: Record<string, string> = {};
    if (e instanceof ErreurMongoose.ValidationError) {
      for (const [champ, err] of Object.entries(e.errors)) erreurs[champ] ??= err.message;
    }
    return { erreurs, message: "Certaines informations sont à corriger." };
  }

  // Numéro déjà utilisé par un AUTRE parent ?
  const autre = await Parent.findOne({ telephone: parent.telephone, _id: { $ne: parent._id } }).lean();
  if (autre) {
    return {
      erreurs: { telephone: `Numéro déjà utilisé par ${autre.prenom} ${autre.nom}.` },
      message: "Certaines informations sont à corriger.",
    };
  }

  try {
    await parent.save();
  } catch (e) {
    console.error(e);
    return { message: "L’enregistrement a échoué. Réessayez." };
  }

  revalidatePath("/admin/parents");
  revalidatePath(`/admin/parents/${id}`);
  revalidatePath("/admin/participants", "layout"); // fiches des enfants
  return { ok: true };
}