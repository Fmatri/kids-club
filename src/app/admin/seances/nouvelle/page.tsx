import EnTetePage from "@/components/EnTetePage";
import FormulaireSeance from "@/components/FormulaireSeance";
import { exigerAdmin } from "@/lib/session";

export default async function PageNouvelleSeance() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage titre="Nouvelle" accent="séance" description="Ajoutez un créneau régulier à la semaine." />
      <FormulaireSeance
        initial={{ jour: "3", heureDebut: "", heureFin: "", public: "enfant", tarif: "100", capacite: "", animateur: "" }}
      />
    </>
  );
}