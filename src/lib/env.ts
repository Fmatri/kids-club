import "server-only";
import { z } from "zod";

// Liste des variables d'environnement obligatoires et leurs règles
const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .startsWith("mongodb", "MONGODB_URI doit commencer par mongodb:// (vérifie .env.local)"),
  BETTER_AUTH_SECRET: z
    .string()
    .min(32, "BETTER_AUTH_SECRET doit contenir au moins 32 caractères (vérifie .env.local)"),
  BETTER_AUTH_URL: z.url("BETTER_AUTH_URL doit être une adresse web, ex : http://localhost:3000"),
});

// Vérifie process.env au démarrage : s'il manque quelque chose, le site s'arrête avec un message clair
export const env = envSchema.parse(process.env);