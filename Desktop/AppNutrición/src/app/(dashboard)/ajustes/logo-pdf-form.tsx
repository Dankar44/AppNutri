"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { actualizarLogoPdf, eliminarLogoPdf, actualizarMarcaPdf } from "@/app/actions/perfil";
import { validateImageDataUrl } from "@/lib/validation";
import { compressImage, IMAGE_PRESETS } from "@/lib/image-compress";
import { useTranslations } from "next-intl";

interface Props {
  logoUrlInicial: string | null;
  marcaPdfInicial: string | null;
  onBrandChange?: (brandName: string, logoUrl: string | null) => void;
}

export function LogoPdfForm({ logoUrlInicial, marcaPdfInicial, onBrandChange }: Props) {
  const t = useTranslations("settings.logoPdf");
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrlInicial);
  const [marca, setMarca] = useState(marcaPdfInicial || "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const raw = reader.result as string;
      if (!validateImageDataUrl(raw)) {
        toast.error(t("errorImagenInvalida"));
        return;
      }

      startTransition(async () => {
        try {
          const dataUrl = await compressImage(raw, IMAGE_PRESETS.LOGO);
          setLogoPreview(dataUrl);
          onBrandChange?.(marca || "Annonia", dataUrl);
          await actualizarLogoPdf(dataUrl);
          toast.success(t("toastLogoActualizado"));
        } catch (err) {
          toast.error(err instanceof Error ? err.message : t("toastErrorSubirLogo"));
          setLogoPreview(logoUrlInicial);
        }
      });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  }

  function handleDeleteLogo() {
    startTransition(async () => {
      try {
        await eliminarLogoPdf();
        setLogoPreview(null);
        onBrandChange?.(marca || "Annonia", null);
        toast.success(t("toastLogoEliminado"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("toastErrorEliminar"));
      }
    });
  }

  function handleSaveMarca() {
    startTransition(async () => {
      try {
        await actualizarMarcaPdf(marca);
        onBrandChange?.(marca || "Annonia", logoPreview);
        toast.success(t("toastMarcaActualizada"));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("toastErrorGuardar"));
      }
    });
  }

  const marcaChanged = marca !== (marcaPdfInicial || "");

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-muted-foreground" />
          {t("titulo")}
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          {t("descripcion")}
        </p>

        <div className="flex items-center gap-4">
          <div className="w-[180px] h-[80px] rounded-lg border-2 border-dashed border-border flex items-center justify-center bg-white overflow-hidden">
            {logoPreview ? (
              <img
                src={logoPreview}
                alt="Logo PDF"
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <span className="text-xs text-muted-foreground">{t("sinLogo")}</span>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              {logoPreview ? t("cambiar") : t("subirLogo")}
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={handleDeleteLogo}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t("eliminar")}
              </button>
            )}
          </div>
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">{t("nombreMarcaTitulo")}</h4>
        <p className="text-xs text-muted-foreground mb-3">
          {t("nombreMarcaDescripcion")}
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder={t("nombreMarcaPlaceholder")}
            maxLength={200}
            className="flex-1 px-3 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={handleSaveMarca}
            disabled={isPending || !marcaChanged}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0",
              marcaChanged
                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            {isPending ? "..." : t("guardar")}
          </button>
        </div>
      </div>
    </div>
  );
}
