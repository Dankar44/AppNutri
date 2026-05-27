"use client";

import { useState, useMemo } from "react";
import { Search, ArrowUpDown, Clock, User, Instagram, Linkedin, MessageCircle, Filter, AlertCircle, Sprout } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { EliminarDietistaButton } from "../dietistas/eliminar-dietista-button";
import { intlTag, type Locale } from "@/i18n/config";

const ADMIN_NAMES: Record<string, string> = {
  "guillermoprieto17@gmail.com": "Guillermo",
  "daniel.karimi.alvarez@gmail.com": "Daniel",
  "i.dellibardavarela@gmail.com": "Iñaki",
};

function adminDisplayName(email: string): string {
  return ADMIN_NAMES[email.toLowerCase()] ?? email.split("@")[0];
}

const FUENTE_BADGE: Record<string, { icon: typeof Instagram; color: string; label?: string }> = {
  instagram: { icon: Instagram, color: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  linkedin: { icon: Linkedin, color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  whatsapp: { icon: MessageCircle, color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  organico: { icon: Sprout, color: "bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400", label: "Orgánico" },
};

type SortKey = "actividad" | "reciente" | "pacientes" | "nombre";

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: "actividad", labelKey: "sort.ultimaActividad" },
  { key: "reciente", labelKey: "sort.masRecientes" },
  { key: "pacientes", labelKey: "sort.masPacientes" },
  { key: "nombre", labelKey: "sort.nombreAZ" },
];

export interface SeguimientoDietista {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  lastAccessAt: string | null;
  createdAt: string;
  verificado: boolean;
  creadoPor: string | null;
  fuenteContacto: string | null;
  pacientesCount: number;
}

function capitalizarNombre(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function timeAgo(date: string | null, t: (key: string, values?: Record<string, string | number>) => string): string {
  if (!date) return t("timeAgo.nunca");
  const now = new Date();
  const diff = now.getTime() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("timeAgo.ahoraMismo");
  if (mins < 60) return t("timeAgo.minutos", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("timeAgo.horas", { count: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t("timeAgo.dias", { count: days });
  if (days < 30) return t("timeAgo.semanas", { count: Math.floor(days / 7) });
  const months = Math.floor(days / 30);
  return t("timeAgo.meses", { count: months, plural: months > 1 ? "es" : "" });
}

function statusBadge(date: string | null, t: (key: string) => string) {
  if (!date) return { label: t("statusBadge.sinAcceso"), color: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400" };
  const days = (Date.now() - new Date(date).getTime()) / 86400000;
  if (days < 1) return { label: t("statusBadge.activoHoy"), color: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-400" };
  if (days < 7) return { label: t("statusBadge.estaSemana"), color: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400" };
  if (days < 30) return { label: t("statusBadge.esteMes"), color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400" };
  return { label: t("statusBadge.inactivo"), color: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400" };
}

function sortDietistas(list: SeguimientoDietista[], key: SortKey): SeguimientoDietista[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case "actividad": {
        const aT = a.lastAccessAt ? new Date(a.lastAccessAt).getTime() : 0;
        const bT = b.lastAccessAt ? new Date(b.lastAccessAt).getTime() : 0;
        return bT - aT;
      }
      case "reciente":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "pacientes":
        return b.pacientesCount - a.pacientesCount || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "nombre":
        return (a.nombre + " " + a.apellidos).localeCompare(b.nombre + " " + b.apellidos, "es");
      default:
        return 0;
    }
  });
}

interface Props {
  dietistas: SeguimientoDietista[];
}

export function SeguimientoDietistas({ dietistas }: Props) {
  const t = useTranslations("admin.seguimiento");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);
  const [busqueda, setBusqueda] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("actividad");
  const [fuenteFilter, setFuenteFilter] = useState<string | null>(null);
  const [creadorFilter, setCreadorFilter] = useState<string | null>(null);
  const [sinAccesoFilter, setSinAccesoFilter] = useState(false);

  function formatFecha(date: string | null): string {
    if (!date) return "—";
    return new Date(date).toLocaleDateString(tag, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filtered = useMemo(() => {
    let list = dietistas;
    if (fuenteFilter) {
      list = list.filter((d) => d.fuenteContacto === fuenteFilter);
    }
    if (creadorFilter) {
      list = list.filter((d) => d.creadoPor && adminDisplayName(d.creadoPor) === creadorFilter);
    }
    if (sinAccesoFilter) {
      list = list.filter((d) => !d.lastAccessAt);
    }
    const search = busqueda.trim().toLowerCase();
    if (search) {
      list = list.filter(
        (d) =>
          d.nombre.toLowerCase().includes(search) ||
          d.apellidos.toLowerCase().includes(search) ||
          d.email.toLowerCase().includes(search)
      );
    }
    return list;
  }, [dietistas, busqueda, fuenteFilter, creadorFilter, sinAccesoFilter]);

  const sorted = useMemo(() => sortDietistas(filtered, sortKey), [filtered, sortKey]);

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      <div className="px-5 py-4 border-b border-border space-y-3">
        <h2 className="font-semibold">{t("tablaDietistas.title", { count: filtered.length })}</h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <ArrowUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => setSortKey(opt.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  sortKey === opt.key
                    ? "bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {([
            { key: "instagram", label: "Instagram", icon: Instagram, active: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" },
            { key: "linkedin", label: "LinkedIn", icon: Linkedin, active: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
            { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, active: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
            { key: "organico", label: "Orgánico", icon: Sprout, active: "bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400" },
          ] as const).map((f) => (
            <button
              key={f.key}
              onClick={() => setFuenteFilter(fuenteFilter === f.key ? null : f.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                fuenteFilter === f.key
                  ? f.active
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <f.icon className="w-3.5 h-3.5" />
              {f.label}
            </button>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          {([
            { key: "Guillermo", active: "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400" },
            { key: "Daniel", active: "bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400" },
            { key: "Claudia", active: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400" },
          ] as const).map((c) => (
            <button
              key={c.key}
              onClick={() => setCreadorFilter(creadorFilter === c.key ? null : c.key)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                creadorFilter === c.key
                  ? c.active
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {c.key}
            </button>
          ))}
          <span className="w-px h-4 bg-border mx-1" />
          <button
            onClick={() => setSinAccesoFilter(!sinAccesoFilter)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sinAccesoFilter
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            {t("tablaDietistas.filtroSinAcceso")}
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("tablaDietistas.columns.dietista")}</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden sm:table-cell">{t("tablaDietistas.columns.email")}</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden md:table-cell">{t("tablaDietistas.columns.pacientes")}</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("tablaDietistas.columns.ultimoAcceso")}</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground hidden lg:table-cell">{t("tablaDietistas.columns.fechaExacta")}</th>
              <th className="text-left px-5 py-3 font-medium text-muted-foreground">{t("tablaDietistas.columns.estado")}</th>
              <th className="px-5 py-3 w-16"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((d) => {
              const badge = statusBadge(d.lastAccessAt, t);
              return (
                <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium">
                      {capitalizarNombre(`${d.nombre} ${d.apellidos}`)}
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {!d.verificado && (
                        <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400 px-1.5 py-0.5 rounded">
                          {t("tablaDietistas.noVerificado")}
                        </span>
                      )}
                      {d.creadoPor && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                          <User className="w-2.5 h-2.5" />
                          {adminDisplayName(d.creadoPor)}
                        </span>
                      )}
                      {d.fuenteContacto && FUENTE_BADGE[d.fuenteContacto] && (() => {
                        const fb = FUENTE_BADGE[d.fuenteContacto!];
                        const abbr: Record<string, string> = { instagram: "IG", linkedin: "LI", whatsapp: "WA" };
                        return (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium ${fb.color}`}>
                            <fb.icon className="w-2.5 h-2.5" />
                            {fb.label ?? abbr[d.fuenteContacto!] ?? d.fuenteContacto}
                          </span>
                        );
                      })()}
                    </div>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground hidden sm:table-cell">{d.email}</td>
                  <td className="px-5 py-3 hidden md:table-cell">{d.pacientesCount}</td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      {timeAgo(d.lastAccessAt, t)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground text-xs hidden lg:table-cell">
                    {formatFecha(d.lastAccessAt)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.color}`}>
                      {badge.label}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <EliminarDietistaButton
                      dietistaId={d.id}
                      nombre={`${capitalizarNombre(d.nombre)} ${capitalizarNombre(d.apellidos)}`}
                    />
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-8 text-center text-muted-foreground">
                  {t("tablaDietistas.empty")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
