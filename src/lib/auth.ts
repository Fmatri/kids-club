import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { MongoClient } from "mongodb";
import { env } from "./env";

// Client MongoDB réservé à Better Auth.
// On le garde en mémoire pour ne pas en recréer un à chaque rechargement de Next.js.
const globalForAuth = globalThis as unknown as { authMongoClient?: MongoClient };
const client = globalForAuth.authMongoClient ?? new MongoClient(env.MONGODB_URI);
globalForAuth.authMongoClient = client;

const UNE_HEURE = 60 * 60; // en secondes
const UN_JOUR = 24 * UNE_HEURE;

export const auth = betterAuth({
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,

  // Les comptes sont enregistrés dans MongoDB (base "kids-club").
  // Passer "client" active les transactions (replica set rs0).
  database: mongodbAdapter(client.db(), { client }),

  // Connexion par e-mail + mot de passe, SANS inscription publique
  emailAndPassword: {
    enabled: true,
    disableSignUp: true, // personne ne peut créer de compte depuis le site
    minPasswordLength: 10,
    autoSignIn: false,
  },

  // Session : 7 jours, prolongée au plus une fois par jour quand la gérante utilise l'application
  session: {
    expiresIn: 7 * UN_JOUR,
    updateAge: UN_JOUR,
  },

  // Champ "role" ajouté au compte, toujours "admin" (prévu pour l'avenir, non modifiable depuis le site)
  user: {
    additionalFields: {
      role: { type: "string", defaultValue: "admin", input: false },
    },
  },

  // Protection contre les attaques : 5 tentatives de connexion par minute maximum
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    customRules: {
      "/sign-in/email": { window: 60, max: 5 },
    },
  },

  // Permet aux actions serveur de Next.js de gérer les cookies de session (doit rester en dernier)
  plugins: [nextCookies()],
});