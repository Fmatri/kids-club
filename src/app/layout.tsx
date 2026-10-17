import type { Metadata } from "next";
import { Inter, Instrument_Serif } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

// Police du texte (menus, chiffres, listes, boutons)
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

// Police d'accent des grands titres (ex. « Bonjour Wejden » en italique)
const instrumentSerif = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-instrument-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pygmalion · Gestion",
  description: "Espace de gestion du Pygmalion Art Club",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn(inter.variable, instrumentSerif.variable, "font-sans")}>
      <body className="antialiased">{children}</body>
    </html>
  );
}