import "server-only";
import { z } from "zod";

// Liste des variables d'environnement obligatoires et leurs règles
const envSchema = z.object({
  MONGODB_URI: z
    .string()
    .startsWith(
      "mongodb",
      "MONGODB_URI doit commencer par mongodb:// (vérifie .env.local)",
    ),
});

// Vérifie process.env au démarrage : s'il manque quelque chose, le site s'arrête avec un message clair
export const env = envSchema.parse(process.env);
