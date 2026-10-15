import "server-only";
import { cache } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

/**
 * Vérifie que la personne est connectée ET qu'elle est admin.
 * À appeler au début de CHAQUE page et action de l'espace admin.
 * - pas connectée       -> renvoyée vers /connexion
 * - connectée, pas admin -> renvoyée vers /acces-refuse
 */
export const exigerAdmin = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/connexion");
  }
  if (session.user.role !== "admin") {
    redirect("/acces-refuse");
  }

  return session;
});