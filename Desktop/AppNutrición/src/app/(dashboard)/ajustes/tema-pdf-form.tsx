"use client";

import { useState, useTransition } from "react";
import { Check, Palette } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { actualizarTemaPdf } from "@/app/actions/perfil";
import { TEMAS_PDF, getTheme, type PdfColorTheme } from "@/lib/pdf/pdf-themes";
import { useTranslations } from "next-intl";

const TEMAS_LISTA = [
  { id: "verde", key: "verde" as const, color: "#6b9e80" },
  { id: "azul", key: "azul" as const, color: "#5b8fb9" },
  { id: "morado", key: "morado" as const, color: "#8b6baa" },
  { id: "naranja", key: "naranja" as const, color: "#c28550" },
  { id: "oscuro", key: "oscuro" as const, color: "#4a5568" },
] as const;

const COLOR_PERSONALIZADO_DEFAULT = "#6b9e80";
const COLOR_HEX_REGEX = /^#[0-9a-fA-F]{6}$/;

function colorInicialValido(color: string | null): string {
  return color && COLOR_HEX_REGEX.test(color) ? color.toLowerCase() : COLOR_PERSONALIZADO_DEFAULT;
}

interface Props {
  temaPdfInicial: string | null;
  colorPrimarioInicial: string | null;
  onThemeChange?: (theme: PdfColorTheme) => void;
}

export function TemaPdfForm({ temaPdfInicial, colorPrimarioInicial, onThemeChange }: Props) {
  const t = useTranslations("settings.temaPdf");
  const [selected, setSelected] = useState(temaPdfInicial || "verde");
  const colorInicial = colorInicialValido(colorPrimarioInicial);
  const [customColor, setCustomColor] = useState(colorInicial);
  const [mostrarErrorColor, setMostrarErrorColor] = useState(false);
  const [isPending, startTransition] = useTransition();
  const customColorValido = COLOR_HEX_REGEX.test(customColor) ? customColor.toLowerCase() : null;
  const colorParaVistaPrevia = customColorValido || colorInicial;

  const currentTheme = getTheme(
    selected,
    selected === "personalizado" ? colorParaVistaPrevia : null
  );

  function handleSelectTheme(id: string) {
    setSelected(id);
    const theme = getTheme(id, id === "personalizado" ? colorParaVistaPrevia : null);
    onThemeChange?.(theme);
  }

  function handleColorChange(hex: string) {
    const valor = hex.slice(0, 7);
    setCustomColor(valor);
    if (selected === "personalizado" && COLOR_HEX_REGEX.test(valor)) {
      onThemeChange?.(getTheme("personalizado", valor));
    }
  }

  function handleColorTextChange(hex: string) {
    setMostrarErrorColor(false);
    handleColorChange(hex);
  }

  function handleSave() {
    startTransition(async () => {
      try {
        if (selected === "personalizado" && !customColorValido) {
          toast.error(t("colorFormato"));
          return;
        }
        await actualizarTemaPdf(selected, selected === "personalizado" ? customColorValido : null);
        toast.success(t("toastSuccess"));
      } catch (e) {
        toast.error(e instanceof Error ? e.message : t("toastErrorGenerico"));
      }
    });
  }

  const hasChanges = selected !== (temaPdfInicial || "verde") ||
    (selected === "personalizado" && customColorValido !== colorInicialValido(colorPrimarioInicial));
  const puedeGuardar = hasChanges && (selected !== "personalizado" || Boolean(customColorValido));

  return (
    <div>
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <Palette className="w-4 h-4 text-muted-foreground" />
        {t("titulo")}
      </h4>
      <p className="text-xs text-muted-foreground mb-4">
        {t("descripcion")}
      </p>

      <div className="flex flex-wrap gap-3 mb-4">
        {TEMAS_LISTA.map((tema) => (
          <button
            key={tema.id}
            type="button"
            onClick={() => handleSelectTheme(tema.id)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-2 rounded-lg border-2 transition-all min-w-[64px]",
              selected === tema.id
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-border"
            )}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: tema.color }}
            >
              {selected === tema.id && <Check className="w-4 h-4 text-white" />}
            </div>
            <span className="text-[11px] font-medium">{t(`temas.${tema.key}`)}</span>
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
            style={selected === "personalizado" ? { backgroundColor: colorParaVistaPrevia, borderStyle: "solid", borderColor: colorParaVistaPrevia } : {}}
          >
            {selected === "personalizado" && <Check className="w-4 h-4 text-white" />}
          </div>
          <span className="text-[11px] font-medium">{t("temas.custom")}</span>
        </button>
      </div>

      {selected === "personalizado" && (
        <div className="mb-4 flex items-start gap-3 rounded-lg border border-border bg-muted/50 p-3">
          <input
            type="color"
            value={colorParaVistaPrevia}
            onChange={(e) => handleColorChange(e.target.value)}
            aria-label={t("abrirSelectorColor")}
            title={t("abrirSelectorColor")}
            className="h-11 w-11 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent p-0.5 focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="min-w-0 flex-1">
            <label htmlFor="color-personalizado-hex" className="text-sm font-medium">
              {t("colorPersonalizado")}
            </label>
            <input
              id="color-personalizado-hex"
              type="text"
              value={customColor}
              onChange={(e) => handleColorTextChange(e.target.value)}
              onBlur={() => setMostrarErrorColor(true)}
              maxLength={7}
              spellCheck={false}
              autoCapitalize="none"
              aria-invalid={mostrarErrorColor && !customColorValido}
              aria-describedby={mostrarErrorColor && !customColorValido ? "color-personalizado-error" : undefined}
              className={cn(
                "mt-1 w-full max-w-36 rounded-md border bg-background px-2.5 py-1.5 font-mono text-sm uppercase focus:outline-none focus:ring-2 focus:ring-primary/30",
                mostrarErrorColor && !customColorValido ? "border-destructive" : "border-border",
              )}
            />
            {mostrarErrorColor && !customColorValido && (
              <p id="color-personalizado-error" className="mt-1 text-xs text-destructive">
                {t("colorFormato")}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 mb-4">
        <div className="flex gap-1">
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.primary }} title={t("colorPrimario")} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.accent }} title={t("colorAcento")} />
          <div className="w-6 h-6 rounded" style={{ backgroundColor: currentTheme.sectionBg }} title={t("colorFondoSeccion")} />
          <div className="w-6 h-6 rounded border border-border" style={{ backgroundColor: currentTheme.lightBg }} title={t("colorFondoClaro")} />
        </div>
        <span className="text-xs text-muted-foreground">{t("vistaPreviaPaleta")}</span>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={isPending || !puedeGuardar}
        className={cn(
          "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
          puedeGuardar
            ? "bg-primary text-primary-foreground hover:bg-primary/90"
            : "bg-muted text-muted-foreground cursor-not-allowed"
        )}
      >
        {isPending ? t("guardando") : t("guardarTema")}
      </button>
    </div>
  );
}
