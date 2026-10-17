import { exigerAdmin } from "@/lib/session";

export default async function PageAdmin() {
  const session = await exigerAdmin();
  const prenom = session.user.name.split(" ")[0];

  // Date du jour à Tunis, ex. « Samedi 17 octobre 2026 »
  const date = new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Tunis",
  }).format(new Date());
  const dateAffichee = date.charAt(0).toUpperCase() + date.slice(1);

  return (
    <section className="flex flex-col gap-1.5 pt-3 pb-7">
      <span className="text-sm font-medium text-encre-douce">{dateAffichee}</span>
      <h1 className="text-5xl leading-none font-semibold tracking-[-0.035em] md:text-6xl">
        Bonjour{" "}
        <span className="font-serif text-[1.12em] font-normal italic">{prenom}</span>
      </h1>
      <p className="mt-1.5 text-[15px] text-encre-douce">
        Le tableau de bord arrivera bientôt ici.
      </p>
    </section>
  );
}