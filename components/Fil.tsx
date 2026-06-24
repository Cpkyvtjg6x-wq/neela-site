"use client";

import { useScroll, useSpring, useTransform, motion } from "framer-motion";
import { useMotionAllowed } from "@/lib/useCanRenderHeavy";

/**
 * « Le Fil » — trait de lumière conducteur, monté une seule fois dans le layout
 * du site et donc PERSISTANT entre les pages. Il se « dessine » au fil du scroll
 * (strokeDashoffset) et passe du bleu (digital) au chaud (humain) vers le bas.
 *
 * - aria-hidden : pur décor, le sens reste dans le DOM.
 * - reduced-motion : tracé figé, aucune tête animée.
 * - desktop (lg+) uniquement : sur mobile la barre de progression de la Nav suffit.
 * - pointer-events-none : ne capture jamais les clics.
 */
const LEN = 1000; // hauteur logique du tracé

export default function Fil() {
  const allowed = useMotionAllowed();

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 30,
    restDelta: 0.001,
  });

  // Le tracé se révèle : dashoffset de LEN (rien) → 0 (tout).
  const dashOffset = useTransform(progress, [0, 1], [LEN, 0]);
  // La tête lumineuse descend le long du tracé.
  const headY = useTransform(progress, [0, 1], [0, LEN]);
  const headOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-y-0 left-5 z-[5] hidden w-[40px] lg:block xl:left-8"
    >
      <svg
        width="40"
        height="100%"
        viewBox="0 0 40 1000"
        preserveAspectRatio="none"
        fill="none"
        className="h-full w-full"
      >
        <defs>
          <linearGradient id="filGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="62%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#E0A458" />
          </linearGradient>
          <filter id="filGlow" x="-200%" y="-50%" width="500%" height="200%">
            <feGaussianBlur stdDeviation="6" />
          </filter>
        </defs>

        {/* Tracé fantôme (toujours visible, très discret) */}
        <line x1="20" y1="0" x2="20" y2="1000" stroke="rgba(10,10,10,0.07)" strokeWidth="2" />

        {allowed ? (
          <>
            {/* Tracé lumineux révélé au scroll */}
            <motion.line
              x1="20"
              y1="0"
              x2="20"
              y2="1000"
              stroke="url(#filGrad)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeDasharray={LEN}
              style={{ strokeDashoffset: dashOffset }}
              vectorEffect="non-scaling-stroke"
            />
            {/* Halo de la tête */}
            <motion.circle
              cx="20"
              r="9"
              fill="#2563EB"
              filter="url(#filGlow)"
              style={{ cy: headY, opacity: headOpacity }}
            />
            {/* Tête nette */}
            <motion.circle
              cx="20"
              r="3.5"
              fill="#3b82f6"
              style={{ cy: headY, opacity: headOpacity }}
            />
          </>
        ) : (
          // reduced-motion : tracé figé, dégradé complet, sans tête animée.
          <line
            x1="20"
            y1="0"
            x2="20"
            y2="1000"
            stroke="url(#filGrad)"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
        )}
      </svg>
    </div>
  );
}
