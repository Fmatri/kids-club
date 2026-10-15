import { BoutonDeconnexion } from "@/components/BoutonDeconnexion";

// Affichée quand un compte connecté n'a PAS le rôle admin
export default function PageAccesRefuse() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-sm ring-1 ring-neutral-200">
        <h1 className="text-xl font-semibold text-neutral-900">Accès refusé</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Ce compte n&apos;a pas accès à l&apos;espace de gestion.
        </p>
        <div className="mt-6 flex justify-center">
          <BoutonDeconnexion />
        </div>
      </div>
    </main>
  );
}