import { Space_Grotesk, Inter } from "next/font/google";

// Police d'affichage (titres) — auto-hébergée par next/font, zéro layout shift.
export const display = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "700"],
  variable: "--font-display",
  display: "swap",
});

// Police de corps (texte courant).
export const sans = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});
