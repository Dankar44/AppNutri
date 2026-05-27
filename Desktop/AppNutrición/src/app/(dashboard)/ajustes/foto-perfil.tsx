"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Camera } from "lucide-react";
import { actualizarFotoDietista } from "@/app/actions/perfil";
import { toast } from "sonner";
import { compressImage, IMAGE_PRESETS } from "@/lib/image-compress";
import { isNextNavigation, withTimeout } from "@/lib/utils";
import { useDemoGuard } from "@/contexts/demo-context";

interface Props {
  nombre: string;
  apellidos: string;
  fotoUrl?: string | null;
}

export function FotoPerfil({ nombre, apellidos, fotoUrl }: Props) {
  const t = useTranslations("settings");
  const router = useRouter();
  const blockIfDemo = useDemoGuard();
  const [preview, setPreview] = useState<string | null>(fotoUrl || null);
  const [loading, setLoading] = useState(false);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (blockIfDemo()) return;
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("fotoPerfil.errorTamano"));
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      setLoading(true);
      try {
        const dataUrl = await compressImage(raw, IMAGE_PRESETS.PROFILE_PHOTO);
        setPreview(dataUrl);
        await withTimeout(actualizarFotoDietista(dataUrl));
        toast.success(t("fotoPerfil.toastSuccess"));
        router.refresh();
      } catch (error) { if (isNextNavigation(error)) throw error;
        toast.error(t("fotoPerfil.toastError"));
      } finally {
        setLoading(false);
      }
    };
    reader.readAsDataURL(file);
  }

  const initials = `${nombre[0] || ""}${apellidos[0] || ""}`.toUpperCase();

  return (
    <div className="flex items-center gap-6">
      <label className="cursor-pointer group relative">
        <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-dashed border-border group-hover:border-primary transition-colors">
          {preview ? (
            <img src={preview} alt={t("fotoPerfil.altFoto")} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl">
              {initials}
            </div>
          )}
        </div>
        <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center shadow-md">
          <Camera className="w-4 h-4" />
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          className="hidden"
        />
      </label>
      <div>
        <p className="text-sm font-medium">
          {loading ? t("fotoPerfil.subiendo") : t("fotoPerfil.clickParaCambiar")}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {t("fotoPerfil.restricciones")}
        </p>
      </div>
    </div>
  );
}
