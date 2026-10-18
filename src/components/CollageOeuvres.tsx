import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

type Oeuvre = { titre: string; r: string; y: string; delai: string; dessin: ReactNode };

// Dessins de remplacement : seront remplacés par les vraies photos du club
const OEUVRES: Oeuvre[] = [
  {
    titre: "Coucher de soleil, gouache",
    r: "-12deg",
    y: "22px",
    delai: "0.35s",
    dessin: (
      <>
        <rect width="180" height="230" fill="#FAD9B8" />
        <circle cx="118" cy="70" r="34" fill="#F6A97A" />
        <path d="M0 160 Q45 120 90 155 T180 145 V230 H0z" fill="#E98C6B" />
        <path d="M0 190 Q60 165 110 188 T180 182 V230 H0z" fill="#C9634A" />
      </>
    ),
  },
  {
    titre: "Formes et couleurs",
    r: "-4deg",
    y: "-10px",
    delai: "0.45s",
    dessin: (
      <>
        <rect width="180" height="230" fill="#D9D0F7" />
        <circle cx="62" cy="88" r="44" fill="#B4A5EE" />
        <circle cx="120" cy="140" r="38" fill="#F6C9CC" />
        <circle cx="98" cy="76" r="15" fill="#1C1917" />
      </>
    ),
  },
  {
    titre: "Paysage, aquarelle",
    r: "5deg",
    y: "6px",
    delai: "0.55s",
    dessin: (
      <>
        <rect width="180" height="230" fill="#C3EBDB" />
        <path d="M20 200 C40 110 70 80 90 30 C110 80 140 110 160 200z" fill="#7FCBA8" />
        <path d="M90 30 V200" stroke="#2F6B52" strokeWidth="3" />
        <circle cx="142" cy="46" r="13" fill="#E4F5A1" />
      </>
    ),
  },
  {
    titre: "Arc-en-ciel, pastel",
    r: "13deg",
    y: "28px",
    delai: "0.65s",
    dessin: (
      <>
        <rect width="180" height="230" fill="#E4F5A1" />
        <path d="M30 180 Q90 40 150 180" fill="none" stroke="#1C1917" strokeWidth="7" strokeLinecap="round" />
        <path d="M52 180 Q90 85 128 180" fill="none" stroke="#7FCBA8" strokeWidth="7" strokeLinecap="round" />
        <path d="M72 180 Q90 130 108 180" fill="none" stroke="#F6A97A" strokeWidth="7" strokeLinecap="round" />
      </>
    ),
  },
];

export default function CollageOeuvres({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center justify-center", className)}>
      {OEUVRES.map((o) => (
        <figure
          key={o.titre}
          className="oeuvre relative -mx-5 w-28 shrink-0 rounded-[20px] bg-surface p-2 shadow-[0_24px_50px_-20px_rgb(28_25_23/0.4)] sm:-mx-8 sm:w-44 lg:-mx-9 lg:w-52"
          style={{ "--r": o.r, "--y": o.y, animationDelay: o.delai } as CSSProperties}
        >
          <svg
            viewBox="0 0 180 230"
            className="block aspect-[180/230] w-full rounded-[14px]"
            role="img"
            aria-label={o.titre}
          >
            {o.dessin}
          </svg>
        </figure>
      ))}
    </div>
  );
}