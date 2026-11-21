"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

export type Photo = { src: string; titre: string };

const COURBE = "cubic-bezier(0.2, 0.8, 0.2, 1)";

// ---------- Peintures de remplacement (identiques à la maquette) ----------
const PALETTES = [
  ["#f6c9cc", "#e98c9a", "#1f1b18", "#fad9b8"],
  ["#d9d0f7", "#8b7be0", "#f6c9cc", "#ffffff"],
  ["#c3ebdb", "#3f8f6b", "#e4f5a1", "#1f1b18"],
  ["#fad9b8", "#e07a4f", "#d9d0f7", "#2b2622"],
  ["#e4f5a1", "#7fcba8", "#1f1b18", "#f6c9cc"],
  ["#f3e3c3", "#8b7be0", "#e07a4f", "#1f1b18"],
];
const TITRES = [
  "Aquarelle · atelier du samedi",
  "Collage de papiers découpés",
  "Argile et modelage",
  "Portraits au fusain",
  "Club de vacances · été",
  "Origami géant",
  "Gouache et grands formats",
  "Stop-motion",
  "Initiation au manga",
  "Bijoux en perles",
];
const REMPLACEMENT: Photo[] = TITRES.map((titre) => ({ src: "", titre }));

function alea(graine: number) {
  return () => {
    graine = (graine * 16807) % 2147483647;
    return (graine - 1) / 2147483646;
  };
}
function rgba(hex: string, a: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}
function peindre(i: number) {
  const W = 450;
  const H = 600;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d");
  if (!g) return "";
  const r = alea(i * 7919 + 101);
  const p = PALETTES[i % PALETTES.length];

  g.fillStyle = p[0];
  g.fillRect(0, 0, W, H);
  for (let k = 0; k < 3; k++) {
    const x = r() * W;
    const y = r() * H;
    const rayon = 160 + r() * 200;
    const d = g.createRadialGradient(x, y, 0, x, y, rayon);
    d.addColorStop(0, rgba(p[1 + (k % 2)], 0.45));
    d.addColorStop(1, rgba(p[1 + (k % 2)], 0));
    g.fillStyle = d;
    g.fillRect(0, 0, W, H);
  }
  g.globalAlpha = 0.9;
  g.fillStyle = p[2];
  g.beginPath();
  g.arc(W * (0.3 + r() * 0.4), H * (0.22 + r() * 0.3), 60 + r() * 90, 0, Math.PI * 2);
  g.fill();
  for (let k = 0; k < 5; k++) {
    const couleur = p[1 + Math.floor(r() * 3)];
    const epaisseur = 14 + r() * 30;
    const x0 = r() * W;
    const y0 = H * (0.4 + r() * 0.6);
    const x1 = r() * W;
    const y1 = r() * H;
    const cx = r() * W;
    const cy = r() * H;
    for (let b = 0; b < 6; b++) {
      const o = (b - 3) * 2.2;
      g.strokeStyle = couleur;
      g.globalAlpha = 0.16;
      g.lineWidth = epaisseur * (0.6 + b * 0.1);
      g.lineCap = "round";
      g.beginPath();
      g.moveTo(x0 + o, y0);
      g.quadraticCurveTo(cx + o, cy, x1 + o, y1 - o);
      g.stroke();
    }
  }
  g.globalAlpha = 0.85;
  g.fillStyle = p[3];
  for (let k = 0; k < 14; k++) {
    g.beginPath();
    g.arc(r() * W, r() * H, 2 + r() * 5, 0, Math.PI * 2);
    g.fill();
  }
  g.globalAlpha = 1;
  return c.toDataURL("image/jpeg", 0.86);
}

export default function AlbumInfini({ photos }: { photos: Photo[] }) {
  const piste = useRef<HTMLDivElement>(null);
  const visionneuse = useRef<HTMLDivElement>(null);
  const vImg = useRef<HTMLImageElement>(null);
  const vLegende = useRef<HTMLParagraphElement>(null);

  // Une « série » d'au moins 10 photos, affichée 3 fois de suite pour la boucle
  const base = photos.length > 0 ? photos : REMPLACEMENT;
  let serie = base;
  while (serie.length < 10) serie = serie.concat(base);
  const nb = serie.length;
  const remplacement = photos.length === 0;
    // Vrai seulement dans le navigateur (le portail a besoin de la page)
  const client = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  useEffect(() => {
    const p = piste.current;
    const v = visionneuse.current;
    const vi = vImg.current;
    const vl = vLegende.current;
    if (!p || !v || !vi || !vl) return;

    // Pas encore de vraies photos → on peint les dessins de remplacement
    if (remplacement) {
      const peintures = new Map<number, string>();
      p.querySelectorAll<HTMLImageElement>("img[data-peinture]").forEach((img) => {
        const n = Number(img.dataset.peinture);
        if (!peintures.has(n)) peintures.set(n, peindre(n));
        img.src = peintures.get(n) ?? "";
      });
    }

    const reduit = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cartes = () => Array.from(p.children) as HTMLElement[];
    let largeurSerie = 0;
    let glisse: { x: number; depart: number } | null = null;
    let aBouge = false;
    let carteOuverte: HTMLElement | null = null;
    let courbeDemandee = false;

    // Courbe : petites au centre, plus grandes et tournées vers nous sur les bords
    function appliquerCourbe() {
      courbeDemandee = false;
      const centre = innerWidth / 2;
      const demi = Math.max(innerWidth / 2, 320);
      for (const c of cartes()) {
        const x = c.offsetLeft - p!.scrollLeft + c.offsetWidth / 2;
        const d = Math.max(-1.4, Math.min(1.4, (x - centre) / demi));
        const a = Math.abs(d);
        c.style.setProperty("--rot", (-d * 26).toFixed(2) + "deg");
        c.style.setProperty("--ech", (0.88 + 0.32 * a * a).toFixed(3));
      }
    }
    function demanderCourbe() {
      if (!courbeDemandee) {
        courbeDemandee = true;
        requestAnimationFrame(appliquerCourbe);
      }
    }

    // Boucle invisible : arrivé au bout, on revient d'une série
    function auDefilement() {
      if (largeurSerie) {
        let decalage = 0;
        if (p!.scrollLeft < largeurSerie * 0.5) decalage = largeurSerie;
        else if (p!.scrollLeft > largeurSerie * 1.5) decalage = -largeurSerie;
        if (decalage) {
          p!.scrollLeft += decalage;
          if (glisse) glisse.depart += decalage;
        }
      }
      demanderCourbe();
    }
    function aLaMolette(e: WheelEvent) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        p!.scrollLeft += e.deltaY;
        e.preventDefault();
      }
    }
    function auAppui(e: PointerEvent) {
      if (e.pointerType !== "mouse" || e.button !== 0) return;
      glisse = { x: e.clientX, depart: p!.scrollLeft };
      aBouge = false;
    }
    function auMouvement(e: PointerEvent) {
      if (!glisse) return;
      const dx = e.clientX - glisse.x;
      if (Math.abs(dx) > 5) {
        aBouge = true;
        p!.classList.add("saisie");
      }
      if (aBouge) p!.scrollLeft = glisse.depart - dx;
    }
    function auRelachement() {
      glisse = null;
      p!.classList.remove("saisie");
    }
    function auClavier(e: KeyboardEvent) {
      if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        e.preventDefault();
        const pas = (cartes()[0]?.offsetWidth ?? 180) + 14;
        p!.scrollBy({ left: e.key === "ArrowRight" ? pas : -pas, behavior: reduit ? "auto" : "smooth" });
      }
    }

    // Agrandir une photo (animation depuis sa place dans l'album)
    function ouvrir(carte: HTMLElement) {
      const img = carte.querySelector("img");
      if (!img) return;
      const depart = carte.getBoundingClientRect();
      carteOuverte = carte;
      vi!.src = img.src;
      vl!.textContent = carte.dataset.titre ?? "";

      const ratio = img.naturalWidth && img.naturalHeight ? img.naturalWidth / img.naturalHeight : 0.75;
      const largeur = Math.min(innerWidth * 0.86, innerHeight * 0.72 * ratio);
      vi!.style.width = largeur + "px";
      vi!.style.height = largeur / ratio + "px";

            v!.hidden = false;
      v!.parentElement?.classList.add("voile-actif");
      carte.style.visibility = "hidden";
      const arrivee = vi!.getBoundingClientRect();
      if (!reduit) {
        vi!.animate(
          [
            {
              transform: `translate(${depart.left - arrivee.left}px, ${depart.top - arrivee.top}px) scale(${depart.width / arrivee.width}, ${depart.height / arrivee.height})`,
            },
            { transform: "none" },
          ],
          { duration: 560, easing: COURBE },
        );
        v!.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 380, easing: "ease-out" });
        vl!.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], {
          duration: 420,
          delay: 260,
          easing: COURBE,
          fill: "backwards",
        });
      }
      v!.focus();
    }

    // Refermer : la photo retourne à sa place
    function fermer() {
      if (!carteOuverte) return;
      const carte = carteOuverte;
      carteOuverte = null;
      v!.parentElement?.classList.remove("voile-actif");
      const fin = () => {
        v!.hidden = true;
        carte.style.visibility = "";
        carte.focus({ preventScroll: true });
      };
      if (reduit) return fin();
      const depart = vi!.getBoundingClientRect();
      const arrivee = carte.getBoundingClientRect();
      vi!.animate(
        [
          { transform: "none" },
          {
            transform: `translate(${arrivee.left - depart.left}px, ${arrivee.top - depart.top}px) scale(${arrivee.width / depart.width}, ${arrivee.height / depart.height})`,
          },
        ],
        { duration: 460, easing: COURBE, fill: "forwards" },
      );
      vl!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 160, fill: "forwards" });
      const voile = v!.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 460, easing: "ease-in", fill: "forwards" });
      voile.onfinish = () => {
        vi!.getAnimations().forEach((a) => a.cancel());
        vl!.getAnimations().forEach((a) => a.cancel());
        voile.cancel();
        fin();
      };
    }

    // Clic sur une photo (ignoré juste après un glisser)
    function auClic(e: MouseEvent) {
      if (aBouge) {
        e.preventDefault();
        e.stopPropagation();
        aBouge = false;
        return;
      }
      const carte = (e.target as HTMLElement).closest<HTMLElement>(".carte");
      if (carte) ouvrir(carte);
    }
    function aEchap(e: KeyboardEvent) {
      if (e.key === "Escape") fermer();
    }

    // Position de départ : au milieu de la 2e série
    const premier = requestAnimationFrame(() => {
      const liste = cartes();
      largeurSerie = liste[nb].offsetLeft - liste[0].offsetLeft;
      p.scrollLeft = largeurSerie * 1.5 - p.clientWidth / 2;
      appliquerCourbe();
    });

    p.addEventListener("scroll", auDefilement, { passive: true });
    p.addEventListener("wheel", aLaMolette, { passive: false });
    p.addEventListener("pointerdown", auAppui);
    p.addEventListener("keydown", auClavier);
    p.addEventListener("click", auClic, true);
    addEventListener("pointermove", auMouvement);
    addEventListener("pointerup", auRelachement);
    addEventListener("resize", demanderCourbe);
    v.addEventListener("click", fermer);
    document.addEventListener("keydown", aEchap);

    return () => {
              v.parentElement?.classList.remove("voile-actif");
      cancelAnimationFrame(premier);
      p.removeEventListener("scroll", auDefilement);
      p.removeEventListener("wheel", aLaMolette);
      p.removeEventListener("pointerdown", auAppui);
      p.removeEventListener("keydown", auClavier);
      p.removeEventListener("click", auClic, true);
      removeEventListener("pointermove", auMouvement);
      removeEventListener("pointerup", auRelachement);
      removeEventListener("resize", demanderCourbe);
      v.removeEventListener("click", fermer);
      document.removeEventListener("keydown", aEchap);
    };
  }, [nb, remplacement, client]);

  return (
    <section className="album" aria-label="Album photo du club" data-album>
      <div className="piste" ref={piste} tabIndex={0} aria-label="Album : glissez ou utilisez les flèches pour parcourir">
        {[0, 1, 2].flatMap((copie) =>
          serie.map((photo, i) => (
            <button
              key={`${copie}-${i}`}
              type="button"
              className="carte"
              data-titre={photo.titre}
              tabIndex={copie === 1 ? 0 : -1}
              aria-hidden={copie === 1 ? undefined : true}
              aria-label={copie === 1 ? `Agrandir : ${photo.titre}` : undefined}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.src || undefined}
                data-peinture={remplacement ? i % TITRES.length : undefined}
                alt=""
                draggable={false}
                loading={copie === 1 ? "eager" : "lazy"}
              />
            </button>
          )),
        )}
      </div>

            {/* Visionneuse placée sur tout le site (portail) pour flouter toute la page */}
      {client &&
        createPortal(
          <div
            className="visionneuse"
            ref={visionneuse}
            role="dialog"
            aria-modal="true"
            aria-label="Photo agrandie"
            tabIndex={-1}
            hidden
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img ref={vImg} alt="" />
            <p className="legende" ref={vLegende} />
          </div>,
          document.querySelector(".vitrine") ?? document.body,
        )}
    </section>
  );
}