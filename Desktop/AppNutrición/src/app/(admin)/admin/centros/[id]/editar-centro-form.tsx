"use client";

import { useState, useTransition } from "react";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { editarCentroAdmin } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface Props {
  centro: {
    id: string;
    nombre: string;
    slug: string;
    descripcion: string | null;
    maxMiembros: number;
  };
}

export function EditarCentroForm({ centro }: Props) {
  const t = useTranslations("admin.centros");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [nombre, setNombre] = useState(centro.nombre);
  const [slug, setSlug] = useState(centro.slug);
  const [descripcion, setDescripcion] = useState(centro.descripcion || "");
  const [maxMiembros, setMaxMiembros] = useState(centro.maxMiembros);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      const result = await editarCentroAdmin(centro.id, {
        nombre,
        slug,
        descripcion,
        maxMiembros,
      });
      if (result.ok) {
        toast.success(t("toastCentroEditado"));
        router.refresh();
      } else {
        toast.error(result.error || t("toastErrorEditar"));
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.nombre")}</label>
        <input
          type="text"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          required
          maxLength={200}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.slug")}</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
          required
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.descripcion")}</label>
        <textarea
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          maxLength={500}
          rows={2}
          className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30 resize-none"
        />
      </div>

      <div>
        <label className="text-xs font-medium text-muted-foreground">{t("form.maxMiembros")}</label>
        <input
          type="number"
          value={maxMiembros}
          onChange={(e) => setMaxMiembros(Math.max(1, Math.min(100, Number(e.target.value))))}
          min={1}
          max={100}
          className="mt-1 w-32 rounded-lg border border-border bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
      >
        {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        {t("form.guardar")}
      </button>
    </form>
  );
}
