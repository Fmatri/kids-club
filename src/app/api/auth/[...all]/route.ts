import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

// Toutes les adresses /api/auth/... sont gérées par Better Auth
// (connexion, déconnexion, session...)
export const { POST, GET } = toNextJsHandler(auth);