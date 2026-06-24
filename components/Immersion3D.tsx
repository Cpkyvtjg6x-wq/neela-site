"use client";

import dynamic from "next/dynamic";
import { Box } from "lucide-react";
import { useCanRenderHeavy } from "@/lib/useCanRenderHeavy";
import Reveal from "./Reveal";

// La scène WebGL n'est chargée QUE côté client et QUE si l'appareil le permet.
const Scene3D = dynamic(() => import("./Scene3D"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-[13px] text-white/40">
      Chargement de la scène 3D…
    </div>
  ),
});

export default function Immersion3D() {
  const heavy = useCanRenderHeavy();

  return (
    <section className="relative overflow-hidden bg-[#070b16] py-28 text-white md:py-36">
      {/* Halo d'ambiance */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/20 blur-[160px]"
      />
      <div className="container-wide relative">
        <Reveal>
          <div className="mb-4 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9CC2FF]">
              <Box size={13} /> 3D · temps réel
            </span>
            <span className="h-px flex-1 bg-white/10" />
          </div>
          <h2 className="max-w-2xl font-display text-[clamp(2rem,5vw,4rem)] font-bold leading-[1.03] tracking-[-0.03em]">
            Au-delà de l'écran.
          </h2>
          <p className="mt-5 max-w-md text-[15px] leading-relaxed text-white/70">
            On ne se contente pas de captures : on vous fait entrer dans la
            matière. Profondeur, lumière, mouvement — rendus en temps réel dans
            votre navigateur.
          </p>
        </Reveal>

        <div className="relative mt-12 h-[420px] overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent md:h-[520px]">
          {heavy ? (
            <Scene3D />
          ) : (
            // Repli statique (mobile / mouvement réduit / appareil limité)
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/20 text-[#9CC2FF]">
                <Box size={28} />
              </span>
              <p className="max-w-xs text-[14px] text-white/55">
                La scène 3D interactive s'active sur ordinateur. Profondeur et
                mouvement, rendus en temps réel.
              </p>
            </div>
          )}
          {heavy && (
            <span className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.18em] text-white/40">
              Bougez la souris
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
