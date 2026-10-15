/**
 * Changement du mot de passe de la gérante (en cas d'oubli) — depuis TON PC uniquement.
 * Lancement : pnpm admin:mot-de-passe
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { auth } from "@/lib/auth";

async function main() {
  // ---------- 1. Poser les questions ----------
  const questions = createInterface({ input: stdin, output: stdout });
  const email = (await questions.question("E-mail du compte : ")).trim().toLowerCase();
  const motDePasse = await questions.question("Nouveau mot de passe (10 caractères minimum) : ");
  const confirmation = await questions.question("Retape le nouveau mot de passe : ");
  questions.close();

  // ---------- 2. Vérifier les réponses ----------
  if (motDePasse.length < 10) throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  if (motDePasse !== confirmation) throw new Error("Les deux mots de passe ne sont pas identiques.");

  // ---------- 3. Outils internes de Better Auth ----------
  const contexte = await auth.$context;

  // Retrouver le compte à partir de l'e-mail
  const trouve = await contexte.internalAdapter.findUserByEmail(email);
  if (!trouve) throw new Error(`Aucun compte avec l'e-mail ${email}.`);

  // ---------- 4. Chiffrer et enregistrer le nouveau mot de passe ----------
  const motDePasseChiffre = await contexte.password.hash(motDePasse);
  await contexte.internalAdapter.updatePassword(trouve.user.id, motDePasseChiffre);

  console.log(`✅ Mot de passe changé pour ${trouve.user.name} (${trouve.user.email})`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Mot de passe NON changé : ${message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(); // ferme aussi la connexion à MongoDB
  });