"use client";

import { MessageSquare } from "lucide-react";
import { SMS_TEMPLATES, fillTemplate } from "@/lib/templates";

export default function SmsTemplates({ phone, nom }: { phone: string | null; nom: string | null }) {
  if (!phone) return null;
  const clean = phone.replace(/[^\d+]/g, "");
  if (!clean) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-mut">Modèles SMS</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {SMS_TEMPLATES.map((t) => {
          const body = fillTemplate(t.text, { nom: nom ?? "" });
          const href = `sms:${clean}?&body=${encodeURIComponent(body)}`;
          return (
            <a key={t.label} href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-[11px] font-medium text-mut hover:border-accent hover:text-accent">
              <MessageSquare size={11} /> {t.label}
            </a>
          );
        })}
      </div>
    </div>
  );
}
