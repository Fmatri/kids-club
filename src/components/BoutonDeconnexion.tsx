"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";

export default function BoutonDeconnexion({ className }: { className?: string }) {
  const router = useRouter();
  const [enCours, setEnCours] = useState(false);

  async function seDeconnecter() {
    setEnCours(true);
    await authClient.signOut();
    router.push("/connexion");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={seDeconnecter}
      disabled={enCours}
      className={cn(
        "inline-flex h-10 items-center justify-center gap-2 rounded-full border border-bordure bg-surface px-4 text-sm font-semibold text-encre transition hover:-translate-y-px disabled:opacity-60",
        className,
      )}
    >
      <LogOut className="size-4" strokeWidth={1.8} aria-hidden />
      {enCours ? "Déconnexion…" : "Se déconnecter"}
    </button>
  );
}