"use client";

import { useEffect, useRef } from "react";

/**
 * Curseur personnalisé (desktop uniquement) : un cercle qui suit la souris
 * en douceur (lerp) et grossit au survol des liens / éléments [data-cursor].
 * Désactivé sur écrans tactiles via la classe .custom-cursor (cf. globals.css).
 */
export default function Cursor() {
  const dot = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const hovering = useRef(false);

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      target.current = { x: e.clientX, y: e.clientY };
    };

    const onOver = (e: MouseEvent) => {
      const el = (e.target as HTMLElement)?.closest(
        "a, button, [data-cursor]"
      );
      hovering.current = !!el;
    };

    let raf = 0;
    const loop = () => {
      pos.current.x += (target.current.x - pos.current.x) * 0.18;
      pos.current.y += (target.current.y - pos.current.y) * 0.18;
      const el = dot.current;
      if (el) {
        const s = hovering.current ? 2.6 : 1;
        el.style.transform = `translate(${pos.current.x}px, ${pos.current.y}px) translate(-50%, -50%) scale(${s})`;
        el.style.opacity = "1";
      }
      raf = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={dot}
      className="custom-cursor fixed left-0 top-0 z-[60] h-3 w-3 rounded-full bg-accent opacity-0 mix-blend-multiply"
      style={{ pointerEvents: "none", transition: "opacity 0.3s" }}
      aria-hidden
    />
  );
}
