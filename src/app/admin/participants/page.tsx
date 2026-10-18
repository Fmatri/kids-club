import { Users } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Nos"
        accent="participants"
        description="Enfants et adultes inscrits au club."
      />
      <EtatVide icone={Users} couleur="bg-pastel-lavande" />
    </>
  );
}