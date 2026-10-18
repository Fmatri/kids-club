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