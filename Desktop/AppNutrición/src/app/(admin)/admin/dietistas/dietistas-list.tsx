"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users, User, ArrowUpDown, Clock, Instagram, Linkedin, MessageCircle, Filter, Sprout, GraduationCap } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { intlTag, type Locale } from "@/i18n/config";
import type { DietistaAdminItem } from "@/app/actions/admin";
import { EliminarDietistaButton } from "./eliminar-dietista-button";
import { EditarDietistaButton } from "./editar-dietista-button";
import { CuentaIncompletaActions } from "./cuenta-incompleta-actions";

const PLAN_BADGE: Record<string, string> = {
  BASICO: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PROFESIONAL: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const ESTADO_BADGE: Record<string, string> = {
  ACTIVA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
  PRUEBA: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  TRIAL: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CANCELADA: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRADA: "bg-muted text-muted-foreground",
};

const OBJETIVO_KEYS: Record<string, string> = {
  PERDER_PESO: "objetivoLabel.perderPeso",
  GANAR_MASA: "objetivoLabel.ganarMasa",
  MANTENIMIENTO: "objetivoLabel.mantenimiento",
  PATOLOGIA: "objetivoLabel.patologia",
  DEPORTIVO: "objetivoLabel.deportivo",
  OTRO: "objetivoLabel.otro",
};

const ADMIN_NAMES: Record<string, string> = {
  "guillermoprieto17@gmail.com": "Guillermo",
  "daniel.karimi.alvarez@gmail.com": "Daniel",
  "i.dellibardavarela@gmail.com": "Iñaki",
};

const FUENTE_BADGE: Record<string, { icon: typeof Instagram; color: string; label?: string }> = {
  instagram: { icon: Instagram, color: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" },
  linkedin: { icon: Linkedin, color: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  whatsapp: { icon: MessageCircle, color: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  organico: { icon: Sprout, color: "bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400", label: "Orgánico" },
  universidad: { icon: GraduationCap, color: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400", label: "Universidad" },
};

function adminDisplayName(email: string): string {
  return ADMIN_NAMES[email.toLowerCase()] ?? email.split("@")[0];
}

type SortKey = "reciente" | "pacientes" | "actividad" | "nombre";

const SORT_OPTIONS: { key: SortKey; labelKey: string }[] = [
  { key: "reciente", labelKey: "sort.masRecientes" },
  { key: "pacientes", labelKey: "sort.masPacientes" },
  { key: "actividad", labelKey: "sort.ultimaActividad" },
  { key: "nombre", labelKey: "sort.nombreAZ" },
];

function capitalizarNombre(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function tiempoRelativo(d: Date | string | null, t: (key: string, values?: Record<string, string | number>) => string): string {
  if (!d) return t("tiempoRelativo.sinAcceso");
  const ms = Date.now() - new Date(d).getTime();
  if (ms < 0) return t("tiempoRelativo.ahora");
  const min = Math.floor(ms / 60000);
  if (min < 1) return t("tiempoRelativo.ahora");
  if (min < 60) return t("tiempoRelativo.minutos", { count: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t("tiempoRelativo.horas", { count: h });
  const dias = Math.floor(h / 24);
  if (dias < 30) return t("tiempoRelativo.dias", { count: dias });
  const meses = Math.floor(dias / 30);
  return t("tiempoRelativo.meses", { count: meses });
}

function getLastActivity(d: DietistaAdminItem): Date | null {
  const candidates = [d.lastAccessAt, d.lastSignIn].filter(Boolean) as Date[];
  if (candidates.length === 0) return null;
  return new Date(Math.max(...candidates.map((c) => new Date(c).getTime())));
}

function sortDietistas(list: DietistaAdminItem[], key: SortKey): DietistaAdminItem[] {
  return [...list].sort((a, b) => {
    switch (key) {
      case "reciente":
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "pacientes":
        return b._count.pacientes - a._count.pacientes || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case "actividad": {
        const aAct = getLastActivity(a)?.getTime() ?? 0;
        const bAct = getLastActivity(b)?.getTime() ?? 0;
        return bAct - aAct;
      }
      case "nombre":
        return (a.nombre + " " + a.apellidos).localeCompare(b.nombre + " " + b.apellidos, "es");
      default:
        return 0;
    }
  });
}

interface Props {
  dietistas: DietistaAdminItem[];
}

export function DietistasList({ dietistas }: Props) {
  const t = useTranslations("admin.dietistas");
  const locale = useLocale() as Locale;
  const tag = intlTag(locale);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("reciente");
  const [fuenteFilter, setFuenteFilter] = useState<string | null>(null);
  const [creadorFilter, setCreadorFilter] = useState<string | null>(null);

  function formatDate(d: Date | string) {
    return new Date(d).toLocaleDateString(tag, { day: "numeric", month: "short", year: "numeric" });
  }

  const filtered = useMemo(() => {
    let list = dietistas;
    if (fuenteFilter) {
      list = list.filter((d) => d.fuenteContacto === fuenteFilter);
    }
    if (creadorFilter) {
      list = list.filter((d) => d.creadoPor && adminDisplayName(d.creadoPor) === creadorFilter);
    }
    return list;
  }, [dietistas, fuenteFilter, creadorFilter]);

  const sorted = useMemo(() => sortDietistas(filtered, sortKey), [filtered, sortKey]);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-4">
      {/* Sort + filter controls */}
      <div className="flex flex-col sm:flex-row gap-3">
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

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          {([
            { key: "instagram", label: "Instagram", icon: Instagram, active: "bg-pink-50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400" },
            { key: "linkedin", label: "LinkedIn", icon: Linkedin, active: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
            { key: "whatsapp", label: "WhatsApp", icon: MessageCircle, active: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
            { key: "organico", label: "Orgánico", icon: Sprout, active: "bg-lime-50 dark:bg-lime-500/10 text-lime-600 dark:text-lime-400" },
            { key: "universidad", label: "Universidad", icon: GraduationCap, active: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400" },
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
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {sorted.map((d) => {
          const isExpanded = expandedId === d.id;
          const lastActivity = getLastActivity(d);
          const relativo = tiempoRelativo(lastActivity, t);

          return (
            <div key={d.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => toggle(d.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                  {d.nombre[0]?.toUpperCase()}{d.apellidos[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold truncate">
                      {capitalizarNombre(d.nombre)} {capitalizarNombre(d.apellidos)}
                    </span>
                    {d.incompleta && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                        Sin verificar
                      </span>
                    )}
                    {d.suscripcion && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${PLAN_BADGE[d.suscripcion.plan] || ""}`}>
                        {d.suscripcion.plan === "BASICO" ? t("planBadge.basico") : t("planBadge.pro")}
                      </span>
                    )}
                    {d.suscripcion && (
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${ESTADO_BADGE[d.suscripcion.estado] || ""}`}>
                        {d.suscripcion.estado === "TRIAL" ? t("estadoBadge.prueba") : d.suscripcion.estado === "PRUEBA" ? t("estadoBadge.prueba") : d.suscripcion.estado === "ACTIVA" ? t("estadoBadge.activa") : d.suscripcion.estado === "CANCELADA" ? t("estadoBadge.cancelada") : t("estadoBadge.expirada")}
                      </span>
                    )}
                    {d.creadoPor && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 bg-muted text-muted-foreground">
                        <User className="w-2.5 h-2.5" />
                        {adminDisplayName(d.creadoPor)}
                      </span>
                    )}
                    {d.fuenteContacto && FUENTE_BADGE[d.fuenteContacto] && (() => {
                      const fb = FUENTE_BADGE[d.fuenteContacto!];
                      const names: Record<string, string> = { instagram: "Instagram", linkedin: "LinkedIn", whatsapp: "WhatsApp" };
                      return (
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${fb.color}`}>
                          <fb.icon className="w-2.5 h-2.5" />
                          {fb.label ?? names[d.fuenteContacto!] ?? d.fuenteContacto}
                        </span>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5 flex-wrap">
                    <span className="truncate">{d.email}</span>
                    {d.especialidad && <span className="hidden sm:inline">· {d.especialidad}</span>}
                    <span className="inline-flex items-center gap-1 text-[11px]">
                      <Clock className="w-3 h-3" />
                      {relativo}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center hidden sm:block">
                    <p className="text-lg font-bold">{d._count.pacientes}</p>
                    <p className="text-[10px] text-muted-foreground">{t("list.pacientes")}</p>
                  </div>
                  <div className="text-center hidden md:block">
                    <p className="text-lg font-bold">{d._count.planes}</p>
                    <p className="text-[10px] text-muted-foreground">{t("list.planes")}</p>
                  </div>
                  <div className="text-center hidden lg:block">
                    <p className="text-lg font-bold">{d._count.consultas}</p>
                    <p className="text-[10px] text-muted-foreground">{t("list.consultas")}</p>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="w-4 h-4 sm:hidden" />
                    <span className="text-sm font-medium sm:hidden">{d._count.pacientes}</span>
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </div>
              </button>

              {isExpanded && d.incompleta && (
                <div className="border-t border-border bg-muted/20 px-5 py-4 space-y-3">
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                    <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                      Cuenta sin verificar. Se registró el {formatDate(d.createdAt)} y aún no ha confirmado su email, por eso no tiene ficha creada. El email de verificación se le envió correctamente; puedes reenviárselo, activarla a mano (podrá entrar con la contraseña que puso) o corregir el email si estaba mal escrito.
                    </p>
                  </div>
                  {d.authId && (
                    <CuentaIncompletaActions
                      authId={d.authId}
                      email={d.email}
                      nombre={`${capitalizarNombre(d.nombre)} ${capitalizarNombre(d.apellidos)}`}
                    />
                  )}
                </div>
              )}
              {isExpanded && !d.incompleta && (
                <div className="border-t border-border bg-muted/20">
                  {/* Info extra del dietista */}
                  <div className="px-5 py-3 bg-muted/30 flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                    <span>{t("list.registro", { date: formatDate(d.createdAt) })}</span>
                    {lastActivity && <span>{t("list.ultimoAcceso", { date: formatDate(lastActivity) })}</span>}
                    {d.clinica && <span>{t("list.clinica", { name: d.clinica })}</span>}
                    <span>{t("list.recetas", { count: d._count.recetas })}</span>
                  </div>

                  {d.pacientes.length === 0 ? (
                    <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                      {t("list.sinPacientes")}
                    </div>
                  ) : (
                    <div className="divide-y divide-border">
                      <div className="px-5 py-2 bg-muted/40 flex items-center gap-4">
                        <div className="w-10" />
                        <span className="flex-1 text-xs font-medium text-muted-foreground">{t("list.columnas.paciente")}</span>
                        <span className="w-24 text-xs font-medium text-muted-foreground text-center hidden sm:block">{t("list.columnas.objetivo")}</span>
                        <span className="w-20 text-xs font-medium text-muted-foreground text-center hidden md:block">{t("list.columnas.estado")}</span>
                        <span className="w-24 text-xs font-medium text-muted-foreground text-right hidden lg:block">{t("list.columnas.fechaAlta")}</span>
                      </div>
                      {d.pacientes.map((p) => (
                        <div key={p.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors">
                          <div className="w-10 flex justify-center">
                            <div className="w-8 h-8 rounded-full bg-green-50 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 text-xs font-bold">
                              {p.nombre[0]?.toUpperCase()}{p.apellidos[0]?.toUpperCase()}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
                            </p>
                            {p.email && (
                              <p className="text-xs text-muted-foreground truncate">{p.email}</p>
                            )}
                          </div>
                          <span className="w-24 text-xs text-center text-muted-foreground hidden sm:block">
                            {OBJETIVO_KEYS[p.objetivo] ? t(OBJETIVO_KEYS[p.objetivo]) : p.objetivo}
                          </span>
                          <span className="w-20 text-center hidden md:block">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${p.activo ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                              {p.activo ? t("pacienteEstado.activo") : t("pacienteEstado.inactivo")}
                            </span>
                          </span>
                          <span className="w-24 text-xs text-muted-foreground text-right hidden lg:block">
                            {formatDate(p.createdAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <EditarDietistaButton
                        dietista={{
                          id: d.id,
                          nombre: d.nombre,
                          apellidos: d.apellidos,
                          email: d.email,
                          telefono: d.telefono,
                          especialidad: d.especialidad,
                          numColegiado: d.numColegiado,
                          clinica: d.clinica,
                          creadoPor: d.creadoPor,
                          fuenteContacto: d.fuenteContacto,
                        }}
                      />
                      <EliminarDietistaButton
                        dietistaId={d.id}
                        nombre={`${capitalizarNombre(d.nombre)} ${capitalizarNombre(d.apellidos)}`}
                      />
                    </div>
                    <Link
                      href={`/admin/dietistas/${d.id}`}
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                    >
                      {t("list.verDetalle")} &rarr;
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
