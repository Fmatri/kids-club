// Règles de format partagées entre plusieurs collections

// Téléphone : 8 à 15 chiffres, avec éventuellement un + au début (ex : 22123456 ou +21622123456)
export const REGEX_TELEPHONE = /^\+?\d{8,15}$/;

// E-mail : texte@texte.texte
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enlève les espaces, points, tirets et parenthèses d'un numéro : "22 123 456" -> "22123456"
export function nettoyerTelephone(valeur?: string | null) {
  return valeur ? valeur.replace(/[\s.\-()]/g, "") : valeur;
}

// Ramène une date au jour du calendrier, à minuit (heure universelle) :
// "2026-10-01T14:37:00" -> "2026-10-01T00:00:00Z"
// Utilisé pour toutes les dates sans heure (inscriptions, appels…)
export function versJourCalendaire(valeur: unknown) {
  if (valeur == null || valeur === "") return valeur;
  const date = valeur instanceof Date ? valeur : new Date(String(valeur));
  if (Number.isNaN(date.getTime())) return valeur; // date invalide : Mongoose affichera l'erreur
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

// Date du jour à Tunis, au format "jour du calendrier" (minuit, heure universelle)
// Exemple : le 02/10 à 00:30 à Tunis -> 2026-10-02T00:00:00Z (et non le 01/10)
export function aujourdhuiTunis() {
  const texte = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Tunis",
  }).format(new Date());
  return new Date(`${texte}T00:00:00Z`); // texte = "2026-10-02"
}
