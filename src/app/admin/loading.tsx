// Affiché automatiquement pendant le chargement d'une page de l'admin
export default function Chargement() {
  const bloc = "animate-pulse rounded-carte bg-surface/70";

  return (
    <div role="status" className="flex flex-col gap-4 pt-3 pb-7">
      <span className="sr-only">Chargement…</span>

      {/* Titre */}
      <div className="h-4 w-40 animate-pulse rounded-full bg-[#ece6e0]" />
      <div className="h-14 w-80 max-w-full animate-pulse rounded-2xl bg-[#ece6e0]" />

      {/* Cartes */}
      <div className="mt-4 grid grid-cols-2 gap-3 md:gap-4 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`h-40 ${bloc}`} style={{ animationDelay: `${i * 120}ms` }} />
        ))}
      </div>

      {/* Contenu */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={`h-72 ${bloc}`} />
        <div className={`h-72 ${bloc}`} style={{ animationDelay: "200ms" }} />
      </div>
    </div>
  );
}