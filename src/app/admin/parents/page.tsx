import { Heart } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Les"
        accent="parents"
        description="Contacts des familles, reliés à leurs enfants."
      />
      <EtatVide icone={Heart} couleur="bg-pastel-peche" />
    </>
  );
}