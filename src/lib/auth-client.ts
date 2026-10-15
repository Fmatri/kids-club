import { createAuthClient } from "better-auth/react";

// Client Better Auth, utilisé DANS LE NAVIGATEUR (formulaire de connexion, bouton de déconnexion…)
// Sans adresse précisée, il utilise automatiquement l'adresse du site.
export const authClient = createAuthClient();