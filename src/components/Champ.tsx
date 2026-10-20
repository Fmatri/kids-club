import { cn } from "@/lib/utils";

// Style commun des champs de formulaire
export const classeChamp =
  "h-12 w-full rounded-2xl border border-[#e7e0d9] bg-surface px-4 text-[15px] outline-none transition focus:border-encre focus:ring-4 focus:ring-encre/8 aria-invalid:border-attention";

// Libellé + champ + message d'aide ou d'erreur
export default function Champ({
  id,
  label,
  aide,
  erreur,
  className,
  children,
}: {
  id: string;
  label: string;
  aide?: string;
  erreur?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <label htmlFor={id} className="text-[13px] font-semibold">
        {label}
      </label>
      {children}
      {erreur ? (
        <p className="text-[13px] font-medium text-attention">{erreur}</p>
      ) : aide ? (
        <p className="text-[13px] text-encre-pale">{aide}</p>
      ) : null}
    </div>
  );
}