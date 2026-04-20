"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Users, User } from "lucide-react";
import type { DietistaAdminItem } from "@/app/actions/admin";

const PLAN_BADGE: Record<string, string> = {
  BASICO: "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400",
  PROFESIONAL: "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400",
};

const ESTADO_BADGE: Record<string, string> = {
  ACTIVA: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400",
  PRUEBA: "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400",
  CANCELADA: "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400",
  EXPIRADA: "bg-muted text-muted-foreground",
};

const OBJETIVO_LABEL: Record<string, string> = {
  PERDER_PESO: "Perder peso",
  GANAR_MASA: "Ganar masa",
  MANTENIMIENTO: "Mantenimiento",
  PATOLOGIA: "Patología",
  DEPORTIVO: "Deportivo",
  OTRO: "Otro",
};

function capitalizarNombre(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

interface Props {
  dietistas: DietistaAdminItem[];
}

export function DietistasList({ dietistas }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function toggle(id: string) {
    setExpandedId((prev) => (prev === id ? null : id));
  }

  return (
    <div className="space-y-3">
      {dietistas.map((d) => {
        const isExpanded = expandedId === d.id;

        return (
          <div key={d.id} className="bg-card rounded-xl border border-border overflow-hidden">
            {/* Fila del dietista */}
            <button
              onClick={() => toggle(d.id)}
              className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm shrink-0">
                {d.nombre[0]?.toUpperCase()}{d.apellidos[0]?.toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-semibold truncate">
                    {capitalizarNombre(d.nombre)} {capitalizarNombre(d.apellidos)}
                  </span>
                  {d.suscripcion && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${PLAN_BADGE[d.suscripcion.plan] || ""}`}>
                      {d.suscripcion.plan === "BASICO" ? "Básico" : "Pro"}
                    </span>
                  )}
                  {d.suscripcion && (
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${ESTADO_BADGE[d.suscripcion.estado] || ""}`}>
                      {d.suscripcion.estado === "PRUEBA" ? "Prueba" : d.suscripcion.estado === "ACTIVA" ? "Activa" : d.suscripcion.estado === "CANCELADA" ? "Cancelada" : "Expirada"}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground mt-0.5">
                  <span>{d.email}</span>
                  {d.especialidad && <span className="hidden sm:inline">· {d.especialidad}</span>}
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-center hidden sm:block">
                  <p className="text-lg font-bold">{d._count.pacientes}</p>
                  <p className="text-[10px] text-muted-foreground">pacientes</p>
                </div>
                <div className="text-center hidden md:block">
                  <p className="text-lg font-bold">{d._count.planes}</p>
                  <p className="text-[10px] text-muted-foreground">planes</p>
                </div>
                <div className="text-center hidden lg:block">
                  <p className="text-lg font-bold">{d._count.consultas}</p>
                  <p className="text-[10px] text-muted-foreground">consultas</p>
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

            {/* Pacientes expandidos */}
            {isExpanded && (
              <div className="border-t border-border bg-muted/20">
                {d.pacientes.length === 0 ? (
                  <div className="px-5 py-6 text-center text-sm text-muted-foreground">
                    Este dietista no tiene pacientes
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    <div className="px-5 py-2 bg-muted/40 flex items-center gap-4">
                      <div className="w-10" />
                      <span className="flex-1 text-xs font-medium text-muted-foreground">Paciente</span>
                      <span className="w-24 text-xs font-medium text-muted-foreground text-center hidden sm:block">Objetivo</span>
                      <span className="w-20 text-xs font-medium text-muted-foreground text-center hidden md:block">Estado</span>
                      <span className="w-24 text-xs font-medium text-muted-foreground text-right hidden lg:block">Fecha alta</span>
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
                          {OBJETIVO_LABEL[p.objetivo] || p.objetivo}
                        </span>
                        <span className="w-20 text-center hidden md:block">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${p.activo ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-muted text-muted-foreground"}`}>
                            {p.activo ? "Activo" : "Inactivo"}
                          </span>
                        </span>
                        <span className="w-24 text-xs text-muted-foreground text-right hidden lg:block">
                          {formatDate(p.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="px-5 py-2.5 border-t border-border bg-muted/30 flex justify-end">
                  <Link
                    href={`/admin/dietistas/${d.id}`}
                    className="text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 font-medium transition-colors"
                  >
                    Ver detalle completo &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
