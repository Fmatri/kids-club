"use server";

import { Error as ErreurMongoose, isValidObjectId } from "mongoose";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Programme } from "@/models/Programme";

export type EtatProgramme = { erreurs?: Record<string, string>; message?: string };

const REGEX_DATE = /^\d{4}-\d{2}-\d{2}$/;
const texte = (fd: FormData, cle: string) => String(fd.get(cle) ?? "").trim();

// Lit un nombre facultatif ; note une erreur s'il est invalide
function lireEntier(fd: FormData, cle: string, erreurs: Record<string, string>) {
  const brut = texte(fd, cle);
  if (!brut) return undefined;
  const n = Number(brut);
  if (!Number.isInteger(n)) {
    erreurs[cle] = "Nombre entier attendu";
    return undefined;
  }
  return n;
}

// Publier ou retirer un programme du site vitrine
export async function basculerPublication(id: string): Promise<{ message?: string }> {
  await exigerAdmin(); // OBLIGATOIRE

  if (!isValidObjectId(id)) return { message: "Programme introuvable." };
  await connectDB();
  const programme = await Programme.findById(id);
  if (!programme) return { message: "Programme introuvable." };

  programme.publieSurLeSite = !programme.publieSurLeSite;
  try {
    await programme.save();
  } catch (e) {
    console.error(e);
    return { message: "Impossible de modifier la publication. Réessayez." };
  }

  revalidatePath("/admin/programmes");
  revalidatePath("/admin");
  return {};
}

// Créer (id = null) ou modifier un programme
export async function enregistrerProgramme(
  id: string | null,
  _etat: EtatProgramme,
  fd: FormData,
): Promise<EtatProgramme> {
  await exigerAdmin(); // OBLIGATOIRE

  const erreurs: Record<string, string> = {};

  const dateDebut = texte(fd, "dateDebut");
  const dateFin = texte(fd, "dateFin");
  if (!REGEX_DATE.test(dateDebut)) erreurs.dateDebut = "Indiquez la date de début";
  if (!REGEX_DATE.test(dateFin)) erreurs.dateFin = "Indiquez la date de fin";

  const ageMin = lireEntier(fd, "ageMin", erreurs);
  const ageMax = lireEntier(fd, "ageMax", erreurs);
  const capacite = lireEntier(fd, "capacite", erreurs);

  // Formules : les 3 listes de champs arrivent dans le même ordre
  const noms = fd.getAll("formuleNom").map(String);
  const prix = fd.getAll("formulePrix").map(String);
  const descriptions = fd.getAll("formuleDescription").map(String);
  const formules: { nom: string; prix: number; description?: string }[] = [];
  noms.forEach((nomBrut, i) => {
    const nom = nomBrut.trim();
    const prixBrut = (prix[i] ?? "").trim();
    const description = (descriptions[i] ?? "").trim();
    if (!nom && !prixBrut && !description) return; // ligne vide : ignorée
    const valeur = Number(prixBrut.replace(",", "."));
    if (!prixBrut || !Number.isFinite(valeur) || valeur < 0) {
      erreurs.formules = `Prix invalide pour la formule ${i + 1}`;
      return;
    }
    formules.push({ nom, prix: Math.round(valeur * 1000), description: description || undefined });
  });

  if (id && !isValidObjectId(id)) return { message: "Programme introuvable." };
  await connectDB();
  const programme = id ? await Programme.findById(id) : new Programme();
  if (!programme) return { message: "Programme introuvable." };

  programme.set({
    type: texte(fd, "type"),
    titre: texte(fd, "titre"),
    description: texte(fd, "description") || undefined,
    activites: texte(fd, "activites")
      .split(",")
      .map((a) => a.trim())
      .filter(Boolean)
      .slice(0, 30),
    dateDebut: REGEX_DATE.test(dateDebut) ? dateDebut : undefined,
    dateFin: REGEX_DATE.test(dateFin) ? dateFin : undefined,
    horaires: texte(fd, "horaires") || undefined,
    ageMin,
    ageMax,
    capacite,
    formules,
    publieSurLeSite: fd.get("publieSurLeSite") === "on",
  });

  try {
    await programme.validate();
  } catch (e) {
    if (e instanceof ErreurMongoose.ValidationError) {
      for (const [champ, err] of Object.entries(e.errors)) {
        erreurs[champ.startsWith("formules") ? "formules" : champ] ??= err.message;
      }
    }
  }
  if (Object.keys(erreurs).length > 0) {
    return { erreurs, message: "Certaines informations sont à corriger." };
  }

  try {
    await programme.save();
  } catch (e) {
    if (typeof e === "object" && e !== null && "code" in e && e.code === 11000) {
      return { erreurs: { titre: "Un programme avec ce titre existe déjà cette année : modifiez le titre." } };
    }
    console.error(e);
    return { message: "L’enregistrement a échoué. Réessayez." };
  }

  revalidatePath("/admin/programmes");
  revalidatePath("/admin");
  redirect("/admin/programmes");
}