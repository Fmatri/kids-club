"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

export function BoutonDeconnexion() {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function seDeconnecter() {
    setEnCours(true);
    await authClient.signOut(); // supprime la session dans la base et le cookie
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={seDeconnecter}
      disabled={enCours}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
    >
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}