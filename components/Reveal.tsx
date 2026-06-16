"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/site";

/**
 * Conteneur de révélation au scroll : fondu + translation douce.
 * Anime uniquement opacity/transform (performant, 60fps).
 */
export default function Reveal({
  children,
  delay = 0,
  y = 36,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}
