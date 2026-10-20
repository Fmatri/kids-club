"use server";

import { Error as ErreurMongoose, isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { inscritsDuJour, jourSemaineIso, REGEX_DATE } from "@/lib/appel";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Appel } from "@/models/Appel";
import { Seance } from "@/models/Seance";

export type EtatAppel = { message?: string; ok?: boolean };

export async function enregistrerAppel(
  idSeance: string,
  date: string,
  _etat: EtatAppel,
  fd: FormData,
): Promise<EtatAppel> {
  await exigerAdmin(); // OBLIGATOIRE

  if (!isValidObjectId(idSeance) || !REGEX_DATE.test(date)) return { message: "Données invalides." };

  await connectDB();
  const seance = await Seance.findById(idSeance).lean();
  if (!seance) return { message: "Séance introuvable." };

  const jour = new Date(date); // minuit UTC
  if (jourSemaineIso(jour) !== seance.jour) return { message: "Cette séance n’a pas lieu ce jour-là." };

  // Le serveur recalcule lui-même la liste des inscrits (on ne fait pas confiance au navigateur)
  const inscrits = await inscritsDuJour(seance._id, jour);
  if (inscrits.length === 0) return { message: "Aucun inscrit à cette séance ce jour-là." };

  const absents = new Set(fd.getAll("absents").map(String));
  const presences = inscrits.map((id) => ({
    participant: id,
    statut: absents.has(String(id)) ? "absent" : "present",
  }));

  // Un seul appel par séance et par jour : on met à jour s'il existe déjà
  const appel =
    (await Appel.findOne({ seance: seance._id, date: jour })) ?? new Appel({ seance: seance._id, date: jour });
  appel.set({ presences });

  try {
    await appel.save();
  } catch (e) {
    if (e instanceof ErreurMongoose.ValidationError) {
      return { message: Object.values(e.errors)[0]?.message ?? "Appel invalide." };
    }
    if (typeof e === "object" && e !== null && "code" in e && e.code === 11000) {
      return { message: "Cet appel vient d’être enregistré par ailleurs : rechargez la page." };
    }
    console.error(e);
    return { message: "L’enregistrement a échoué. Réessayez." };
  }

  revalidatePath("/admin/appel");
  revalidatePath(`/admin/appel/${idSeance}`);
  revalidatePath("/admin");
  return { ok: true };
}