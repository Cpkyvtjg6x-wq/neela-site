"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion } from "framer-motion";

type Props = {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
  className?: string;
};

/**
 * Bouton « magnétique » : attire légèrement le curseur au survol (desktop).
 * Sur mobile l'effet est inerte (pas de hover), le bouton reste normal.
 */
export default function MagneticButton({
  href,
  children,
  variant = "solid",
  className = "",
}: Props) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const x = (e.clientX - (r.left + r.width / 2)) * 0.25;
    const y = (e.clientY - (r.top + r.height / 2)) * 0.4;
    el.style.transform = `translate(${x}px, ${y}px)`;
  };

  const reset = () => {
    if (ref.current) ref.current.style.transform = "";
  };

  const base =
    "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold transition-colors duration-300 will-change-transform";
  const styles =
    variant === "solid"
      ? "bg-ink text-paper hover:bg-accent"
      : "border border-line text-ink hover:border-ink";

  return (
    <Link
      ref={ref}
      href={href}
      onMouseMove={onMove}
      onMouseLeave={reset}
      className={`${base} ${styles} ${className}`}
      style={{ transition: "transform 0.25s cubic-bezier(0.16,1,0.3,1), background-color 0.3s, border-color 0.3s" }}
    >
      {children}
    </Link>
  );
}
