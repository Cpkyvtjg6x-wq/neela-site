import { tagColor } from "@/lib/crm";

// Pastille de tag colorée (couleur stable selon le libellé).
export default function Tag({ label, hash = false }: { label: string; hash?: boolean }) {
  const c = tagColor(label);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
      style={{ background: c.bg, color: c.text }}
    >
      {hash ? "#" : ""}
      {label}
    </span>
  );
}
