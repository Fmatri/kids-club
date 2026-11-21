"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import AlbumInfini, { type Photo } from "@/components/AlbumInfini";

const COURBE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

export default function AccueilVitrine({ photos }: { photos: Photo[] }) {
  const racine = useRef<HTMLDivElement>(null);
  const marque = useRef<HTMLAnchorElement>(null);

  // Fond papier avec grain, posé sur toute la page (comme la maquette)
  useEffect(() => {
    const toile = document.createElement("canvas");
    toile.width = toile.height = 180;
    const g = toile.getContext("2d");
    if (!g) return;
    const pixels = g.createImageData(180, 180);
    for (let i = 0; i < 180 * 180; i++) {
      const v = Math.random() * 255;
      pixels.data[i * 4] = pixels.data[i * 4 + 1] = pixels.data[i * 4 + 2] = v;
      pixels.data[i * 4 + 3] = Math.random() < 0.5 ? 14 : 0;
    }
    g.putImageData(pixels, 0, 0);

    const corps = document.body;
    const avant = { couleur: corps.style.backgroundColor, image: corps.style.backgroundImage };
    corps.style.backgroundColor = "#f5f0e8";
    corps.style.backgroundImage = `url(${toile.toDataURL()})`;
    // En quittant le site (vers l'admin), on remet le fond d'origine
    return () => {
      corps.style.backgroundColor = avant.couleur;
      corps.style.backgroundImage = avant.image;
    };
  }, []);

  // Intro : pop du logo au centre, puis il monte se poser en haut à gauche
  useEffect(() => {
    const el = racine.current;
    const logo = marque.current;
    if (!el || !logo) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let annule = false;
    const animations: Animation[] = [];
    const jouer = (cible: Element, images: Keyframe[], options: KeyframeAnimationOptions) => {
      animations.push(cible.animate(images, { fill: "backwards", ...options }));
    };

    document.fonts.ready.then(() => {
      if (annule) return;
      const r = logo.getBoundingClientRect();
      const centre = `translate(${innerWidth / 2 - (r.left + r.width / 2)}px, ${innerHeight / 2 - (r.top + r.height / 2)}px)`;
      const grand = Math.min(3.2, (innerWidth * 0.6) / r.width);

      jouer(
        logo,
        [
          { transform: `${centre} scale(${grand * 0.3})`, opacity: 0, filter: "blur(10px)", easing: "cubic-bezier(0.2, 1.5, 0.4, 1)" },
          { transform: `${centre} scale(${grand})`, opacity: 1, filter: "blur(0px)", offset: 0.34, easing: "linear" },
          { transform: `${centre} scale(${grand})`, opacity: 1, filter: "blur(0px)", offset: 0.56, easing: "cubic-bezier(0.65, 0, 0.2, 1)" },
          { transform: "translate(0, 0) scale(1)", opacity: 1, filter: "blur(0px)" },
        ],
        { duration: 2400 },
      );

      // Le reste attend que le logo soit posé
      const apres = 1900;
      el.querySelectorAll(".liens, .actions").forEach((cible) =>
        jouer(cible, [{ opacity: 0 }, { opacity: 1 }], { duration: 600, delay: apres + 300 }),
      );
      el.querySelectorAll("[data-entree]").forEach((cible, k) =>
        jouer(cible, [{ opacity: 0, transform: "translateY(24px)" }, { opacity: 1, transform: "none" }], {
          duration: 800,
          delay: apres + 150 + k * 140,
          easing: COURBE,
        }),
      );
      el.querySelectorAll("[data-album]").forEach((cible) =>
        jouer(cible, [{ opacity: 0, transform: "translateY(70px) scale(0.96)" }, { opacity: 1, transform: "none" }], {
          duration: 1100,
          delay: apres + 500,
          easing: COURBE,
        }),
      );
      // Annotations : elles se dessinent comme au stylo
      el.querySelectorAll("[data-note]").forEach((note, k) => {
        jouer(note, [{ opacity: 0 }, { opacity: 1 }], { duration: 400, delay: apres + 1200 + k * 200 });
        note.querySelectorAll("path").forEach((trait) => {
          const longueur = trait.getTotalLength();
          trait.style.strokeDasharray = String(longueur);
          jouer(trait, [{ strokeDashoffset: longueur }, { strokeDashoffset: 0 }], {
            duration: 700,
            delay: apres + 1300 + k * 200,
            easing: COURBE,
          });
        });
      });
    });

    return () => {
      annule = true;
      animations.forEach((a) => a.cancel());
    };
  }, []);

  return (
    <div ref={racine}>
      {/* Barre du haut */}
      <header className="nav">
        <Link className="marque" href="/" ref={marque} aria-label="Pygmalion Art Club, accueil">
          <svg className="marque-signe" viewBox="0 0 40 40" aria-hidden="true">
            <path
              d="M8 26 C6 14 16 6 26 9 C36 12 36 26 26 30 C18 33 12 30 12 24"
              fill="none"
              stroke="#8b7be0"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <circle cx="27" cy="19" r="4" fill="#ef6f5e" />
          </svg>
          <span className="marque-nom">Pygmalion</span>
        </Link>
        {/* Liens provisoires : ces pages viendront plus tard */}
        <nav className="liens" aria-label="Menu">
          <a href="#">Cours</a>
          <a href="#">Stages &amp; événements</a>
          <a href="#">Galerie</a>
          <a href="#">À propos</a>
          <a href="#">Contact</a>
        </nav>
        <div className="actions">
          <a className="pilule clair" href="#">
            Nous appeler
          </a>
          <a className="pilule sombre" href="#">
            S’inscrire
          </a>
        </div>
      </header>

      <main>
        {/* Texte d'accueil */}
        <section className="hero">
          <p className="pastille" data-entree>
            Atelier d’art à Ennasr · depuis 2022
          </p>
          <h1 data-entree>
            <span className="ligne">Un espace pour créer, explorer</span>
            <span className="ligne">et laisser parler son imagination</span>
          </h1>
          <p className="sous-titre" data-entree>
            Cours d’arts plastiques pour enfants et adultes, stages et clubs de vacances. Peinture, dessin, argile,
            collage : chacun expérimente et crée librement.
          </p>

          <div className="note note-titre" aria-hidden="true" data-note>
            <svg width="34" height="22" viewBox="0 0 34 22">
              <path d="M2 20 L12 4 M14 20 L22 8 M24 20 L32 10" />
            </svg>
          </div>
          <div className="note note-album" aria-hidden="true" data-note>
            nos créations
            <svg width="70" height="64" viewBox="0 0 70 64">
              <path d="M50 4 C66 18 60 42 30 52 M30 52 L42 44 M30 52 L40 60" />
            </svg>
          </div>
        </section>

        <AlbumInfini photos={photos} />
      </main>
    </div>
  );
}