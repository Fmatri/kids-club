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