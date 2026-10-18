// Montant stocké en millimes → texte en dinars : 100000 → "100 DT"
export function formatDinars(millimes: number) {
  const dinars = millimes / 1000;
  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(dinars)} DT`;
}

// "15:00" → "15h00"
export function formatHeure(hhmm: string) {
  return hhmm.replace(":", "h");
}

// 1 → "1 séance", 3 → "3 séances"
export function pluriel(n: number, mot: string) {
  return `${n} ${mot}${n > 1 ? "s" : ""}`;
}
// "22345678" → "22 345 678" (les numéros internationaux restent tels quels)
export function formatTelephone(tel: string) {
  return /^\d{8}$/.test(tel) ? tel.replace(/(\d{2})(\d{3})(\d{3})/, "$1 $2 $3") : tel;
}

// Âge en années révolues à partir de la date de naissance
export function calculerAge(naissance: Date, maintenant = new Date()) {
  let age = maintenant.getUTCFullYear() - naissance.getUTCFullYear();
  const mois = maintenant.getUTCMonth() - naissance.getUTCMonth();
  if (mois < 0 || (mois === 0 && maintenant.getUTCDate() < naissance.getUTCDate())) age--;
  return age;
}
// Date du calendrier (stockée à minuit UTC) → "12 mars 2018"
export function formatDate(date: Date) {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

// Numéro → lien WhatsApp (8 chiffres = numéro tunisien → indicatif 216)
export function lienWhatsApp(tel: string) {
  const chiffres = tel.replace(/\D/g, "");
  return `https://wa.me/${chiffres.length === 8 ? `216${chiffres}` : chiffres}`;
}