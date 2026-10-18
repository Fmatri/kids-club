import { ShieldAlert } from "lucide-react";
import BoutonDeconnexion from "@/components/BoutonDeconnexion";

export default function PageAccesRefuse() {
  return (
    <main className="fond-degrade flex min-h-dvh items-center justify-center p-4">
      <div className="apparition flex w-full max-w-md flex-col items-center gap-5 rounded-carte border border-bordure bg-surface px-6 py-12 text-center shadow-carte">
        <span className="flex size-16 items-center justify-center rounded-full bg-pastel-rose">
          <ShieldAlert className="size-7" strokeWidth={1.6} aria-hidden />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight">
          Accès <span className="font-serif text-[1.15em] font-normal italic">réservé</span>
        </h1>
        <p className="text-sm text-encre-douce">
          Cet espace est réservé à la gérante du club. S’il s’agit d’une erreur, déconnectez-vous puis
          reconnectez-vous avec le bon compte.
        </p>
        <BoutonDeconnexion />
      </div>
    </main>
  );
}