import { SlidersHorizontal } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Paramètres du"
        accent="club"
        description="Nom, adresse, contacts et réseaux sociaux du club."
      />
      <EtatVide icone={SlidersHorizontal} couleur="bg-pastel-rose" />
    </>
  );
}