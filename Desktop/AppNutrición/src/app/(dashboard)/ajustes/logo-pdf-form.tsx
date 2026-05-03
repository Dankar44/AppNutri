"use client";

import { useRef, useState, useTransition } from "react";
import { ImagePlus, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { actualizarLogoPdf, eliminarLogoPdf, actualizarMarcaPdf } from "@/app/actions/perfil";
import { validateImageDataUrl } from "@/lib/validation";

interface Props {
  logoUrlInicial: string | null;
  marcaPdfInicial: string | null;
  onBrandChange?: (brandName: string, logoUrl: string | null) => void;
}

export function LogoPdfForm({ logoUrlInicial, marcaPdfInicial, onBrandChange }: Props) {
  const [logoPreview, setLogoPreview] = useState<string | null>(logoUrlInicial);
  const [marca, setMarca] = useState(marcaPdfInicial || "");
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      if (!validateImageDataUrl(dataUrl)) {
        toast.error("Imagen no válida (solo JPEG, PNG, WebP o GIF, máx ~2MB)");
        return;
      }
      setLogoPreview(dataUrl);
      onBrandChange?.(marca || "Annonia", dataUrl);

      startTransition(async () => {
        try {
          await actualizarLogoPdf(dataUrl);
          toast.success("Logo actualizado");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "Error al subir logo");
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
        toast.success("Logo eliminado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al eliminar");
      }
    });
  }

  function handleSaveMarca() {
    startTransition(async () => {
      try {
        await actualizarMarcaPdf(marca);
        onBrandChange?.(marca || "Annonia", logoPreview);
        toast.success("Nombre de marca actualizado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Error al guardar");
      }
    });
  }

  const marcaChanged = marca !== (marcaPdfInicial || "");

  return (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <ImagePlus className="w-4 h-4 text-muted-foreground" />
          Logo para documentos
        </h4>
        <p className="text-xs text-muted-foreground mb-3">
          Aparecerá en la portada, cabecera y contraportada de tus PDFs. Recomendado: 400×100px, PNG con fondo transparente.
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
              <span className="text-xs text-muted-foreground">Sin logo</span>
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
              {logoPreview ? "Cambiar" : "Subir logo"}
            </button>
            {logoPreview && (
              <button
                type="button"
                onClick={handleDeleteLogo}
                disabled={isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/30 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Eliminar
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
        <h4 className="text-sm font-semibold mb-3">Nombre de marca</h4>
        <p className="text-xs text-muted-foreground mb-3">
          Reemplaza &quot;Annonia&quot; en cabeceras y footers de tus documentos PDF.
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Annonia (por defecto)"
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
            {isPending ? "..." : "Guardar"}
          </button>
        </div>
      </div>
    </div>
  );
}
