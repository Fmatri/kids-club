import type { ReactNode } from "react";
import { exigerAdmin } from "@/lib/session";
import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";

export default async function LayoutAdmin({ children }: { children: ReactNode }) {
  const session = await exigerAdmin();

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-3">
        <span className="font-semibold text-neutral-900">Pygmalion · Gestion</span>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-neutral-600 sm:inline">{session.user.name}</span>
          <BoutonDeconnexion />
        </div>
      </header>
      {children}
    </div>
  );
}