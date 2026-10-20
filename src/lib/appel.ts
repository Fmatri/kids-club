import "server-only";
import type { Types } from "mongoose";
import { Inscription } from "@/models/Inscription";

export const REGEX_DATE = /^\d{4}-\d{2}-\d{2}$/;

// Date du jour à Tunis, au format AAAA-MM-JJ
export function aujourdhuiTexte() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());
}

// Jour de la semaine d'une date : 1 = lundi … 7 = dimanche
export function jourSemaineIso(jour: Date) {
  const j = jour.getUTCDay();
  return j === 0 ? 7 : j;
}

// Participants inscrits à une séance À CETTE DATE
export async function inscritsDuJour(idSeance: Types.ObjectId | string, jour: Date) {
  const inscriptions = await Inscription.find({
    seance: idSeance,
    dateDebut: { $lte: jour },
    $or: [{ dateFin: null }, { dateFin: { $gte: jour } }],
  })
    .select("participant")
    .lean();
  // Sans doublon
  return [...new Map(inscriptions.map((i) => [String(i.participant), i.participant])).values()];
}