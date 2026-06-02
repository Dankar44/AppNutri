"use client";

import { useState } from "react";
import { Copy, Check, MessageCircle } from "lucide-react";

export function CopyPhone({ phone }: { phone: string }) {
  const [copied, setCopied] = useState(false);
  const waNumber = phone.replace(/[^\d]/g, "");

  async function copiar() {
    try {
      await navigator.clipboard.writeText(phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard no disponible */
    }
  }

  return (
    <div className="flex items-center gap-2 whitespace-nowrap">
      <span>{phone}</span>
      <button
        type="button"
        onClick={copiar}
        title="Copiar número"
        aria-label="Copiar número"
        className="text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
      </button>
      <a
        href={`https://wa.me/${waNumber}`}
        target="_blank"
        rel="noopener noreferrer"
        title="Abrir WhatsApp"
        aria-label="Abrir WhatsApp"
        className="text-muted-foreground transition-colors hover:text-green-600"
      >
        <MessageCircle className="h-4 w-4" />
      </a>
    </div>
  );
}
