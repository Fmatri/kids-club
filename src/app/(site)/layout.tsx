import type { Metadata } from "next";
import { Bricolage_Grotesque, Caveat, Fraunces } from "next/font/google";
import "./site.css";

// Polices du site vitrine (différentes de l'admin)
const bricolage = Bricolage_Grotesque({ subsets: ["latin"], variable: "--font-bricolage", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], style: "italic", axes: ["opsz"], variable: "--font-fraunces", display: "swap" });
const caveat = Caveat({ subsets: ["latin"], variable: "--font-caveat", display: "swap" });

export const metadata: Metadata = {
  title: "Pygmalion Art Club · Atelier d’art à Ennasr",
  description:
    "Cours d’arts plastiques pour enfants et adultes, stages et clubs de vacances à Ennasr. Un espace pour créer, explorer et laisser parler son imagination.",
};

export default function LayoutSite({ children }: { children: React.ReactNode }) {
  return (
    <div className={`vitrine ${bricolage.variable} ${fraunces.variable} ${caveat.variable}`}>
      <div className="fond" aria-hidden="true">
        <div className="lavis a" />
        <div className="lavis b" />
        <div className="lavis c" />
      </div>
      {children}
    </div>
  );
}