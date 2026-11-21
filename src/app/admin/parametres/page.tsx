import EnTetePage from "@/components/EnTetePage";
import FormulaireParametres from "@/components/FormulaireParametres";
import { connectDB } from "@/lib/db";
import { exigerAdmin } from "@/lib/session";
import { Parametres } from "@/models/Parametres";

export default async function PageParametres() {
  await exigerAdmin();
  await connectDB();

  const p = await Parametres.findOne({ cle: "club" }).lean();

  return (
    <>
      <EnTetePage
        titre="Paramètres du"
        accent="club"
        description="Ces informations seront affichées sur le site vitrine."
      />
      <FormulaireParametres
        v={{
          nomClub: p?.nomClub ?? "Pygmalion Art Club",
          adresse: p?.adresse ?? "",
          lienCarte: p?.lienCarte ?? "",
          telephone: p?.telephone ?? "",
          whatsapp: p?.whatsapp ?? "",
          email: p?.email ?? "",
          facebook: p?.reseauxSociaux?.facebook ?? "",
          instagram: p?.reseauxSociaux?.instagram ?? "",
        }}
      />
    </>
  );
}