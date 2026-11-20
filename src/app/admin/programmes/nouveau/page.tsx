import EnTetePage from "@/components/EnTetePage";
import FormulaireProgramme from "@/components/FormulaireProgramme";
import { exigerAdmin } from "@/lib/session";

export default async function PageNouveauProgramme() {
  await exigerAdmin();

  return (
    <>
      <EnTetePage
        titre="Nouveau"
        accent="programme"
        description="Stage, club de vacances, atelier ou événement."
      />
      <FormulaireProgramme
        v={{
          id: null,
          type: "stage",
          titre: "",
          description: "",
          activites: "",
          dateDebut: "",
          dateFin: "",
          horaires: "",
          ageMin: "",
          ageMax: "",
          capacite: "",
          formules: [],
          publie: false,
        }}
      />
    </>
  );
}