"use client";

import { motion } from "framer-motion";
import { EASE } from "@/lib/site";

/**
 * Révèle un texte mot par mot (masque + translation Y) au scroll.
 * `as` permet de choisir la balise (h1, h2, p...).
 */
export default function RevealText({
  text,
  className = "",
  delay = 0,
  stagger = 0.06,
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
        <span
          key={i}
          aria-hidden
          className="inline-block overflow-hidden align-bottom"
          style={{ paddingBottom: "0.08em" }}
        >
          <motion.span
            className="inline-block"
            initial={{ y: "110%" }}
            whileInView={{ y: "0%" }}
            viewport={{ once, margin: "-8% 0px" }}
            transition={{
              duration: 0.75,
              ease: EASE,
              delay: delay + i * stagger,
            }}
          >
            {word}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </span>
  );
}
