"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export default function PageConnexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); // empêche le rechargement de la page
    setErreur(null);
    setEnCours(true);

    const donnees = new FormData(event.currentTarget);
    const { error } = await authClient.signIn.email({
      email: String(donnees.get("email")).trim().toLowerCase(),
      password: String(donnees.get("motDePasse")),
    });

    setEnCours(false);

    if (error) {
      setErreur(messageErreur(error.status, error.code));
      return;
    }

    // Connexion réussie : direction l'espace de gestion
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-center text-2xl font-semibold text-neutral-900">Pygmalion Art Club</h1>
        <p className="mt-1 text-center text-sm text-neutral-500">Espace de gestion</p>

        <form onSubmit={seConnecter} className="mt-8 space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-neutral-700">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </div>

          <div>
            <label htmlFor="motDePasse" className="block text-sm font-medium text-neutral-700">
              Mot de passe
            </label>
            <input
              id="motDePasse"
              name="motDePasse"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2.5 text-base focus:border-neutral-900 focus:outline-none"
            />
          </div>

          {erreur && (
            <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="w-full rounded-lg bg-neutral-900 py-2.5 text-base font-medium text-white hover:bg-neutral-800 disabled:opacity-60"
          >
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      </div>
    </main>
  );
}

// Traduit les erreurs de Better Auth en messages clairs pour la gérante
function messageErreur(status?: number, code?: string) {
  if (status === 429) return "Trop de tentatives. Patiente une minute avant de réessayer.";
  if (code === "INVALID_EMAIL_OR_PASSWORD") return "E-mail ou mot de passe incorrect.";
  return "Connexion impossible pour le moment. Réessaie.";
}