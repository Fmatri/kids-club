"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CollageOeuvres from "@/components/CollageOeuvres";
import { authClient } from "@/lib/auth-client";

function messageErreur(erreur: { status?: number; code?: string }) {
  if (erreur.status === 429) return "Trop de tentatives. Réessayez dans une minute.";
  if (erreur.code === "INVALID_EMAIL_OR_PASSWORD") return "E-mail ou mot de passe incorrect.";
  return "Une erreur est survenue. Réessayez.";
}

export default function PageConnexion() {
  const router = useRouter();
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function seConnecter(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const donnees = new FormData(e.currentTarget);
    setErreur(null);
    setEnCours(true);

    const { error } = await authClient.signIn.email({
      email: String(donnees.get("email")),
      password: String(donnees.get("password")),
    });

    if (error) {
      setErreur(messageErreur(error));
      setEnCours(false);
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="flex min-h-dvh flex-wrap bg-creme">
      {/* Gauche : formulaire */}
      <section className="flex flex-[1_1_420px] flex-col justify-between gap-10 px-5 py-7 md:px-14 md:py-10">
        <div className="apparition flex items-center gap-3">
          <span className="flex size-[42px] items-center justify-center rounded-[14px] bg-linear-135 from-pastel-rose to-pastel-lavande font-serif text-[26px] italic">
            P
          </span>
          <span className="text-base font-bold">
            Pygmalion <span className="font-medium text-encre-pale">· Gestion</span>
          </span>
        </div>

        <form
          onSubmit={seConnecter}
          className="apparition flex w-full max-w-[400px] flex-col gap-4.5 [animation-delay:100ms]"
        >
          <div className="mb-2 flex flex-col gap-2">
            <h1 className="text-[44px] leading-[1.05] font-semibold tracking-[-0.03em]">
              Bon <span className="font-serif text-[1.15em] font-normal italic">retour</span>
            </h1>
            <p className="text-[15px] text-encre-douce">Connectez-vous pour gérer le club.</p>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-[13px] font-semibold">
              Adresse e-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="vous@exemple.com"
              className="h-13 rounded-2xl border border-[#e7e0d9] bg-surface px-4.5 text-[15px] outline-none transition focus:border-encre focus:ring-4 focus:ring-encre/8"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="password" className="text-[13px] font-semibold">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="h-13 rounded-2xl border border-[#e7e0d9] bg-surface px-4.5 text-[15px] outline-none transition focus:border-encre focus:ring-4 focus:ring-encre/8"
            />
          </div>

          {erreur && (
            <p role="alert" className="rounded-2xl bg-attention-fond px-4 py-3 text-sm font-medium text-attention">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={enCours}
            className="mt-1.5 h-13.5 rounded-full bg-encre text-[15px] font-semibold text-white shadow-[0_12px_28px_-14px_rgb(28_25_23/0.7)] transition hover:-translate-y-px disabled:opacity-60"
          >
            {enCours ? "Connexion…" : "Se connecter"}
          </button>
          <p className="text-[13px] text-encre-pale">Accès réservé à la gérante du club.</p>
        </form>

        <p className="text-xs text-encre-pale">Ennasr · Avenue Hédi Nouira · Résidence Atlantique</p>
      </section>

      {/* Droite : collage d'œuvres */}
      <section
        aria-label="Créations du club"
        className="fond-collage m-3 flex min-w-0 flex-[1.3_1_520px] flex-col justify-between gap-8 overflow-hidden rounded-[32px] p-7 md:m-4 md:p-12"
      >
        <h2 className="apparition max-w-[520px] text-4xl leading-none font-semibold tracking-[-0.035em] [animation-delay:200ms] md:text-[56px]">
          Un espace pour <span className="font-serif text-[1.15em] font-normal italic">créer</span>, explorer et imaginer.
        </h2>
        <CollageOeuvres className="min-h-[240px] md:min-h-[380px]" />
        <p className="text-[13px] text-neutre">Les vraies photos des œuvres du club remplaceront ces dessins.</p>
      </section>
    </main>
  );
}