/**
 * Création du compte de la gérante — à lancer depuis TON PC uniquement.
 * Lancement : pnpm admin:creer
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { betterAuth } from "better-auth";
import { MongoClient } from "mongodb";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { REGEX_EMAIL } from "@/lib/regles";

async function main() {
  // Accès direct à la collection "user" de Better Auth, pour VÉRIFIER nous-mêmes
  // (Better Auth ne dit jamais si un e-mail existe déjà : protection anti-énumération)
  const client = new MongoClient(env.MONGODB_URI);
  const utilisateurs = client.db().collection("user");

  // ---------- 1. Règle : un seul compte possible ----------
  const compteExistant = await utilisateurs.findOne({});
  if (compteExistant) {
    throw new Error(
      `Un compte existe déjà (${compteExistant.email}). Le club n'a qu'une seule utilisatrice : création refusée.`,
    );
  }

  // ---------- 2. Poser les questions ----------
  const questions = createInterface({ input: stdin, output: stdout });
  const email = (await questions.question("E-mail de la gérante : ")).trim().toLowerCase();
  const nom = (await questions.question("Nom affiché (ex : Wejden) : ")).trim();
  const motDePasse = await questions.question("Mot de passe (10 caractères minimum) : ");
  const confirmation = await questions.question("Retape le mot de passe : ");
  questions.close();

  // ---------- 3. Vérifier les réponses ----------
  if (!REGEX_EMAIL.test(email)) throw new Error("Adresse e-mail invalide.");
  if (nom.length === 0) throw new Error("Le nom est obligatoire.");
  if (motDePasse.length < 10) throw new Error("Le mot de passe doit contenir au moins 10 caractères.");
  if (motDePasse !== confirmation) throw new Error("Les deux mots de passe ne sont pas identiques.");

  // ---------- 4. Copie TEMPORAIRE de la configuration, avec inscription autorisée ----------
  // Elle n'existe que pendant ce script. Le site, lui, garde l'inscription bloquée.
  const authScript = betterAuth({
    ...auth.options,
    emailAndPassword: { ...auth.options.emailAndPassword, disableSignUp: false },
    rateLimit: { enabled: false },
    plugins: [],
  });

  // ---------- 5. Créer le compte (mot de passe chiffré par Better Auth) ----------
  await authScript.api.signUpEmail({
    body: { email, password: motDePasse, name: nom },
  });

  // ---------- 6. Vérifier que le compte est VRAIMENT dans la base ----------
  const compteCree = await utilisateurs.findOne({ email });
  if (!compteCree) {
    throw new Error("Better Auth n'a pas enregistré le compte. Rien n'a été créé.");
  }

  console.log(`✅ Compte créé et vérifié dans la base : ${compteCree.name} (${compteCree.email})`);
}

main()
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ Compte NON créé : ${message}`);
    process.exitCode = 1;
  })
  .finally(() => {
    process.exit(); // ferme aussi les connexions à MongoDB
  });