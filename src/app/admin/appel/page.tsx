import { ClipboardCheck } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Appel"
        accent="du jour"
        description="Cochez les présents en un geste : tout le monde est présent par défaut."
      />
      <EtatVide icone={ClipboardCheck} couleur="bg-pastel-rose" />
    </>
  );
}