import { cn } from "@/lib/utils";

export type Semaine = { label: string; valeur: number; courante: boolean };

export default function GraphiquePresences({ semaines }: { semaines: Semaine[] }) {
  const max = Math.max(1, ...semaines.map((s) => s.valeur));

  return (
    <section className="apparition flex flex-col gap-4 rounded-carte border border-bordure bg-surface p-6 shadow-carte [animation-delay:240ms]">
      <div>
        <h2 className="text-lg font-semibold">Présences par semaine</h2>
        <p className="mt-1 text-[13px] text-encre-douce">
          Présences enregistrées à l’appel · 7 dernières semaines
        </p>
      </div>

      {/* Barres (visuel) */}
      <div className="grid h-56 grid-cols-7 gap-2 border-b border-bordure sm:gap-3" aria-hidden>
        {semaines.map((s, i) => (
          <div key={s.label} className="group flex h-full flex-col items-center justify-end">
            <span
              className={cn(
                "mb-1.5 text-xs font-semibold tabular-nums transition-opacity",
                s.courante ? "opacity-100" : "opacity-0 group-hover:opacity-100",
              )}
            >
              {s.valeur}
            </span>
            <div
              className="pousse w-full max-w-12 rounded-t-[6px]"
              style={{
                height: `${(s.valeur / max) * 85}%`,
                minHeight: s.valeur > 0 ? 4 : 0,
                backgroundColor: s.courante ? "#8b7be0" : "#d9d0f7",
                animationDelay: `${300 + i * 70}ms`,
              }}
            />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-2 sm:gap-3" aria-hidden>
        {semaines.map((s) => (
          <span key={s.label} className="text-center text-[11px] text-encre-pale">
            {s.label}
          </span>
        ))}
      </div>

      {/* Même données en tableau, pour les lecteurs d'écran */}
      <table className="sr-only">
        <caption>Présences par semaine</caption>
        <thead>
          <tr>
            <th>Semaine du</th>
            <th>Présences</th>
          </tr>
        </thead>
        <tbody>
          {semaines.map((s) => (
            <tr key={s.label}>
              <td>{s.label}</td>
              <td>{s.valeur}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}