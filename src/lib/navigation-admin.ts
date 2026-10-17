import {
  CalendarDays,
  ClipboardCheck,
  Heart,
  LayoutGrid,
  Palette,
  SlidersHorizontal,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export type LienAdmin = {
  href: string;
  libelle: string;
  court?: string; // libellé raccourci pour la barre mobile
  icone: LucideIcon;
  mobile?: boolean; // affiché dans la barre du bas sur téléphone
  bientot?: boolean; // module pas encore disponible
};

// Liste unique des liens du menu (ordinateur + téléphone)
export const LIENS_ADMIN: LienAdmin[] = [
  { href: "/admin", libelle: "Tableau de bord", court: "Accueil", icone: LayoutGrid, mobile: true },
  { href: "/admin/appel", libelle: "Appel", icone: ClipboardCheck, mobile: true },
  { href: "/admin/participants", libelle: "Participants", icone: Users, mobile: true },
  { href: "/admin/parents", libelle: "Parents", icone: Heart },
  { href: "/admin/seances", libelle: "Séances", icone: CalendarDays, mobile: true },
  { href: "/admin/programmes", libelle: "Programmes", icone: Palette },
  { href: "/admin/paiements", libelle: "Paiements", icone: Wallet, bientot: true },
  { href: "/admin/parametres", libelle: "Paramètres", icone: SlidersHorizontal },
];

// Le lien est-il celui de la page affichée ? (/admin/participants/123 → Participants)
export function estActif(href: string, chemin: string) {
  if (href === "/admin") return chemin === "/admin";
  return chemin === href || chemin.startsWith(href + "/");
}