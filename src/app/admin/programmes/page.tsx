import { Palette } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Stages &"
        accent="événements"
        description="Clubs de vacances, stages, ateliers et événements affichés sur le site."
      />
      <EtatVide icone={Palette} couleur="bg-pastel-citron" />
    </>
  );
}