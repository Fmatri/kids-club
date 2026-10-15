import { exigerAdmin } from "@/lib/session";

export default async function PageAdmin() {
  // Vérification dans CHAQUE page : la layout seule ne suffit pas
  const session = await exigerAdmin();

  return (
    <main className="p-4 sm:p-8">
      <h1 className="text-2xl font-semibold text-neutral-900">Bonjour {session.user.name} 👋</h1>
      <p className="mt-2 text-neutral-600">Le tableau de bord arrivera bientôt ici.</p>
    </main>
  );
}