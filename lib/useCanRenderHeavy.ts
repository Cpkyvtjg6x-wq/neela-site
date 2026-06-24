"use client";

import { useEffect, useState } from "react";

/**
 * Décide si on autorise les effets « lourds » (parallax, scrub, scènes 3D…).
 * Triple garde-fou :
 *   1. prefers-reduced-motion → jamais d'effet lourd
 *   2. capacité de l'appareil (mémoire, cœurs CPU, save-data)
 *   3. rendu côté client uniquement (SSR renvoie false → fallback statique d'abord)
 *
 * Corrige le trou actuel : le CSS global ne neutralise que les animations CSS,
 * pas les useTransform Framer / GSAP. Ce hook, lui, est lu par le JS.
 */
export function useCanRenderHeavy(): boolean {
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    const evaluate = () => {
      if (reduce.matches) return setOk(false);

      // Heuristiques de capacité (toutes optionnelles selon le navigateur).
      const nav = navigator as Navigator & {
        deviceMemory?: number;
        connection?: { saveData?: boolean };
      };
      const lowMemory = typeof nav.deviceMemory === "number" && nav.deviceMemory < 4;
      const lowCores =
        typeof navigator.hardwareConcurrency === "number" &&
        navigator.hardwareConcurrency < 4;
      const saveData = nav.connection?.saveData === true;

      setOk(!(lowMemory || lowCores || saveData));
    };

    evaluate();
    reduce.addEventListener?.("change", evaluate);
    return () => reduce.removeEventListener?.("change", evaluate);
  }, []);

  return ok;
}

/** Variante simple : true seulement si l'utilisateur ne demande pas de mouvement réduit. */
export function useMotionAllowed(): boolean {
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(prefers-reduced-motion: reduce)");
    const set = () => setAllowed(!m.matches);
    set();
    m.addEventListener?.("change", set);
    return () => m.removeEventListener?.("change", set);
  }, []);
  return allowed;
}
