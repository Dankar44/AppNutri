"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquareText, Check, Loader2 } from "lucide-react";
import { guardarRecomendaciones } from "@/app/actions/pacientes";

interface Props {
  pacienteId: string;
  initialText: string;
}

export function RecomendacionesCard({ pacienteId, initialText }: Props) {
  const [text, setText] = useState(initialText);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const debounceRef = useRef<NodeJS.Timeout>(null);
  const statusTimerRef = useRef<NodeJS.Timeout>(null);
  const savedRef = useRef(initialText);

  useEffect(() => {
    if (text === savedRef.current) return;
    setStatus("idle");
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setStatus("saving");
      try {
        await guardarRecomendaciones(pacienteId, text);
        savedRef.current = text;
        setStatus("saved");
        if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
        statusTimerRef.current = setTimeout(() => setStatus("idle"), 2000);
      } catch {
        setStatus("idle");
      }
    }, 5000);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    };
  }, [text, pacienteId]);

  return (
    <section data-tour="patient-recommendations" className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquareText className="w-5 h-5 text-teal-500" />
          Recomendaciones
        </h2>
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          {status === "saving" && (
            <>
              <Loader2 className="w-3 h-3 animate-spin" />
              Guardando...
            </>
          )}
          {status === "saved" && (
            <>
              <Check className="w-3 h-3 text-green-600 dark:text-green-400" />
              <span className="text-green-600 dark:text-green-400">Guardado</span>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Escribe recomendaciones para tu paciente. Se guardan automáticamente y el paciente las verá desde su portal.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        maxLength={5000}
        placeholder="Ej: Recuerda beber al menos 2L de agua al día. Evita alimentos ultraprocesados. Intenta cenar ligero 2h antes de dormir..."
        className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-y"
      />
    </section>
  );
}
