"use client";

import Link from "next/link";
import { Building2, Users, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import type { CentroAdminItem } from "@/app/actions/admin";

export function CentrosList({ centros }: { centros: CentroAdminItem[] }) {
  const t = useTranslations("admin.centros");

  if (centros.length === 0) {
    return (
      <div className="text-center py-16">
        <Building2 className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{t("empty")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {centros.map((centro) => {
        const ratio = centro._count.miembros / centro.maxMiembros;
        const colorClass =
          ratio >= 1
            ? "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
            : ratio >= 0.8
              ? "text-amber-600 bg-amber-50 dark:bg-amber-500/10 dark:text-amber-400"
              : "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400";

        return (
          <Link
            key={centro.id}
            href={`/admin/centros/${centro.id}`}
            className="block bg-card border border-border rounded-xl p-4 sm:p-5 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Building2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                  <h3 className="font-semibold truncate">{centro.nombre}</h3>
                  <span className="text-xs text-muted-foreground shrink-0">/{centro.slug}</span>
                </div>

                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                  <Crown className="w-3.5 h-3.5" />
                  <span className="truncate">
                    {centro.lider.nombre} {centro.lider.apellidos}
                  </span>
                  <span className="text-xs">({centro.lider.email})</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium", colorClass)}>
                  <Users className="w-3.5 h-3.5" />
                  {centro._count.miembros}/{centro.maxMiembros}
                </span>
              </div>
            </div>

            <div className="mt-3">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    ratio >= 1 ? "bg-red-500" : ratio >= 0.8 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                />
              </div>
            </div>

            {centro.descripcion && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                {centro.descripcion}
              </p>
            )}

            <p className="text-xs text-muted-foreground mt-2">
              {t("creadoEl", {
                date: new Date(centro.createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                }),
              })}
            </p>
          </Link>
        );
      })}
    </div>
  );
}
