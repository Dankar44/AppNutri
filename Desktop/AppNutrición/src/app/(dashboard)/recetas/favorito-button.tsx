"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { toggleFavoritoReceta } from "@/app/actions/recetas";

interface Props {
  recetaId: string;
  inicial: boolean;
  size?: "sm" | "md";
}

export function FavoritoButton({ recetaId, inicial, size = "md" }: Props) {
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
        setFavorito(res.favorito);
        toast.success(res.favorito ? "Añadida a tus recetas" : "Quitada de favoritas");
      } catch {
        setFavorito(prev);
        toast.error("No se pudo actualizar el favorito");
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={favorito ? "Quitar de favoritas" : "Marcar como favorita"}
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
