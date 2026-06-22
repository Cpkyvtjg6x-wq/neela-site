"use client";

import type { Prospect } from "@/lib/crm";
import { useFiche } from "./FicheModal";

// Ouvre la fiche d'un prospect en modale (réutilisable dans les pages serveur).
export default function OpenFicheLink({
  prospect,
  children,
  className,
}: {
  prospect: Prospect;
  children: React.ReactNode;
  className?: string;
}) {
  const { open } = useFiche();
  return (
    <button type="button" onClick={() => open(prospect.id, prospect)} className={className}>
      {children}
    </button>
  );
}
