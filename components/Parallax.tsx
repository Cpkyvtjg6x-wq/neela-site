"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** Parallax vertical doux d'un bloc pendant le scroll. */
export default function Parallax({
  children,
  offset = 80,
  className = "",
}: {
  children: React.ReactNode;
  offset?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [offset, -offset]);

  return (
    <motion.div ref={ref} style={{ y }} className={className}>
      {children}
    </motion.div>
  );
}
