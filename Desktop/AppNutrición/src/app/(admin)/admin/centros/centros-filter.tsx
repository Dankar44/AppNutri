"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Search, Plus } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";

export function CentrosFilter({ busqueda }: { busqueda?: string }) {
  const t = useTranslations("admin.centros");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState(busqueda || "");

  function handleSearch(value: string) {
    setQuery(value);
    startTransition(() => {
      const params = new URLSearchParams();
      if (value.trim()) params.set("busqueda", value.trim());
      router.push(`/admin/centros${params.toString() ? `?${params}` : ""}`);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
      </div>
      <Link
        href="/admin/centros/crear"
        className="inline-flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
      >
        <Plus className="w-4 h-4" />
        {t("crearCentro")}
      </Link>
    </div>
  );
}
