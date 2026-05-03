"use client";

import { useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { actualizarTemaPdf } from "@/app/actions/perfil";
import { TEMAS_PDF, getTheme, type PdfColorTheme } from "@/lib/pdf/pdf-themes";

const TEMAS_LISTA = [
  { id: "verde", label: "Verde", color: "#6b9e80" },
  { id: "azul", label: "Azul", color: "#5b8fb9" },
  { id: "morado", label: "Morado", color: "#8b6baa" },
  { id: "naranja", label: "Naranja", color: "#c28550" },
  { id: "oscuro", label: "Oscuro", color: "#4a5568" },
] as const;

interface Props {
  temaPdfInicial: string | null;
  colorPrimarioInicial: string | null;
  onThemeChange?: (theme: PdfColorTheme) => void;
}

export function TemaPdfForm({ temaPdfInicial, colorPrimarioInicial, onThemeChange }: Props) {
  const [selected, setSelected] = useState(temaPdfInicial || "verde");
  const [customColor, setCustomColor] = useState(colorPrimarioInicial || "#6b9e80");
  const [isPending, startTransition] = useTransition();

  const currentTheme = getTheme(
    selected,
    selected === "personalizado" ? customColor : null
  );

  function handleSelectTheme(id: string) {
    setSelected(id);
    const theme = getTheme(id, id === "personalizado" ? customColor : null);
    onThemeChange?.(theme);
  }

  function handleColorChange(hex: string) {
    setCustomColor(hex);
    if (selected === "personalizado") {
      onThemeChange?.(getTheme("personalizado", hex));
    }
  }

  function handleSave() {
    startTransition(async () => {
      try {
        await actualizarTemaPdf(selected, selected === "personalizado" ? customColor : null);
        toast.success("Tema actualizado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Error al guardar");
      }
    });
  }

  const hasChanges = selected !== (temaPdfInicial || "verde") ||
    (selected === "personalizado" && customColor !== colorPrimarioInicial);

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Palette className="w-4 h-4 text-muted-foreground" />
        Tema de color
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        Elige los colores de tus documentos PDF (plan alimenticio, reportes, lista de la compra).
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        {TEMAS_LISTA.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => handleSelectTheme(t.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all min-w-[64px]",
              selected === t.id
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-border"
            )}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: t.color }}
            >
              {selected === t.id && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-[11px] font-medium">{t.label}</span>
          </button>
        ))}

        <button
          type="button"
          onClick={() => handleSelectTheme("personalizado")}
          className={cn(
            "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all min-w-[64px]",
            selected === "personalizado"
              ? "border-primary bg-primary/5"
              : "border-transparent hover:border-border"
          )}
        >
          <div
            className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center overflow-hidden"
            style={selected === "personalizado" ? { backgroundColor: customColor, borderStyle: "solid", borderColor: customColor } : {}}
          >
            {selected === "personalizado" && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-[11px] font-medium">Custom</span>
        </button>
      </div>

      {selected === "personalizado" && (
        <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-muted/50 border border-border">
          <input
            type="color"
            value={customColor}
            onChange={(e) => handleColorChange(e.target.value)}
            className="w-10 h-10 rounded-lg cursor-pointer border-0 p-0"
          />
          <div>
            <p className="text-sm font-medium">Color personalizado</p>
            <p className="text-xs text-muted-foreground font-mono">{customColor}</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.primary }} title="Primario" />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} title="Acento" />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.sectionBg }} title="Fondo sección" />
          <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: currentTheme.lightBg }} title="Fondo claro" />
        </div>
        <span className="text-xs text-muted-foreground">Vista previa de la paleta</span>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !hasChanges}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          hasChanges
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isPending ? "Guardando..." : "Guardar tema"}
      </button>
    </div>
  );
}
