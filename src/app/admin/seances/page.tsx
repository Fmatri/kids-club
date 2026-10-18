import { CalendarDays } from "lucide-react";
import EnTetePage from "@/components/EnTetePage";
import EtatVide from "@/components/EtatVide";
import { exigerAdmin } from "@/lib/session";

export default async function Page() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Les"
        accent="séances"
        description="Créneaux de la semaine : horaires, public, tarif et capacité."
      />
      <EtatVide icone={CalendarDays} couleur="bg-pastel-menthe" />
    </>
  );
}