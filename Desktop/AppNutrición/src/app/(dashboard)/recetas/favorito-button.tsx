"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { toggleFavoritoReceta } from "@/app/actions/recetas";

interface Props {
  recetaId: string;
  inicial: boolean;
  size?: "sm" | "md";
}

export function FavoritoButton({ recetaId, inicial, size = "md" }: Props) {
  const t = useTranslations("recipes");
  const [favorito, setFavorito] = useState(inicial);
  const [pending, startTransition] = useTransition();
  const dim = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const prev = favorito;
    setFavorito(!prev);
    startTransition(async () => {
      try {
        const res = await toggleFavoritoReceta(recetaId);
        if (res) {
          setFavorito(res.favorito);
          toast.success(res.favorito ? t("favorito.anadidaFavoritas") : t("favorito.quitadaFavoritas"));
        }
      } catch {
        setFavorito(prev);
        toast.error(t("favorito.errorActualizar"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorito ? t("favorito.quitarFavoritas") : t("favorito.marcarFavorita")}
      aria-pressed={favorito}
      className={`inline-flex items-center justify-center rounded-full p-1.5 transition-colors ${
        favorito
          ? "text-amber-500 hover:bg-amber-500/10"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      } ${pending ? "opacity-60 pointer-events-none" : ""}`}
    >
      <Star className={dim} fill={favorito ? "currentColor" : "none"} />
    </button>
  );
}
