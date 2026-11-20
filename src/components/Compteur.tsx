"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "motion/react";

// Chiffre qui défile de 0 à la valeur (désactivé si « réduire les animations »)
export default function Compteur({ valeur, suffixe = "" }: { valeur: number; suffixe?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const reduit = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (reduit) {
      el.textContent = `${valeur}${suffixe}`;
      return;
    }
    const controle = animate(0, valeur, {
      duration: 1.2,
      delay: 0.3,
      ease: [0.2, 0.8, 0.2, 1],
      onUpdate: (v) => {
        el.textContent = `${Math.round(v)}${suffixe}`;
      },
    });
    return () => controle.stop();
  }, [valeur, suffixe, reduit]);

  return (
    <span ref={ref} className="tabular-nums">
      0{suffixe}
    </span>
  );
}