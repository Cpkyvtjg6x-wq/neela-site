"use client";

import { Trash2 } from "lucide-react";
import { deleteProspect } from "@/app/crm/actions";
import ConfirmButton from "./ConfirmButton";

export default function DeleteProspectButton({ id, nom }: { id: string; nom: string | null }) {
  return (
    <ConfirmButton
      title={`Supprimer ${nom || "ce prospect"} ?`}
      message="Le prospect, ses appels, ses rendez-vous et ses enregistrements audio seront supprimés définitivement. Action irréversible."
      confirmLabel="Supprimer définitivement"
      danger
      onConfirm={async () => {
        const fd = new FormData();
        fd.set("id", id);
        await deleteProspect(fd);
      }}
      className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
    >
      <Trash2 size={13} /> Supprimer
    </ConfirmButton>
  );
}
