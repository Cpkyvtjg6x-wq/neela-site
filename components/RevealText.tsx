"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { EASE } from "@/lib/site";

/**
 * Révèle un texte mot par mot (fondu + légère montée) au scroll.
 * Robuste : l'état final est toujours visible (opacity 1), et les mots
 * restent séparés par de vraies espaces (le titre peut donc revenir à la ligne).
 */
export default function RevealText({
  text,
  className = "",
  delay = 0,
  stagger = 0.04,
  once = true,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  once?: boolean;
}) {
  const words = text.split(" ");

  return (
    <span className={className} aria-label={text}>
      {words.map((word, i) => (
        <Fragment key={i}>
          <motion.span
            aria-hidden
            className="inline-block"
            initial={{ opacity: 0, y: "0.35em" }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once, margin: "-8% 0px" }}
            transition={{
              duration: 0.6,
              ease: EASE,
              delay: delay + i * stagger,
            }}
          >
            {word}
          </motion.span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </span>
  );
}
