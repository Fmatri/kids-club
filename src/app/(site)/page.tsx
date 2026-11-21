import { readdir } from "node:fs/promises";
import path from "node:path";
import AccueilVitrine from "@/components/AccueilVitrine";
import type { Photo } from "@/components/AlbumInfini";

const EXTENSIONS = /\.(jpe?g|png|webp|avif)$/i;

// "01-aquarelle-atelier-du-samedi.jpg" → "Aquarelle atelier du samedi"
function titreDepuisFichier(nom: string) {
  const base = nom
    .replace(EXTENSIONS, "")
    .replace(/^\d+[-_ ]*/, "")
    .replace(/[-_]+/g, " ")
    .trim();
  return base.charAt(0).toUpperCase() + base.slice(1);
}

// Les photos déposées dans public/album, triées par nom
async function lirePhotos(): Promise<Photo[]> {
  try {
    const fichiers = await readdir(path.join(process.cwd(), "public", "album"));
    return fichiers
      .filter((f) => EXTENSIONS.test(f))
      .sort((a, b) => a.localeCompare(b, "fr", { numeric: true }))
      .map((f) => ({ src: `/album/${encodeURIComponent(f)}`, titre: titreDepuisFichier(f) }));
  } catch {
    return []; // dossier absent → dessins de remplacement
  }
}

export default async function PageAccueil() {
  const photos = await lirePhotos();
  return <AccueilVitrine photos={photos} />;
}