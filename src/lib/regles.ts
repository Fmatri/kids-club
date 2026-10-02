// Règles de format partagées entre plusieurs collections

// Téléphone : 8 à 15 chiffres, avec éventuellement un + au début (ex : 22123456 ou +21622123456)
export const REGEX_TELEPHONE = /^\+?\d{8,15}$/;

// E-mail : texte@texte.texte
export const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Enlève les espaces, points, tirets et parenthèses d'un numéro : "22 123 456" -> "22123456"
export function nettoyerTelephone(valeur?: string | null) {
  return valeur ? valeur.replace(/[\s.\-()]/g, "") : valeur;
}
