"use client";

import Link from "next/link";
import {
  CalendarClock,
  CalendarCheck,
  CalendarX,
  CalendarPlus,
  CalendarDays,
  UserX,
  Scale,
  FileWarning,
  BookOpen,
  Bell,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  enlace: string | null;
  leida: boolean;
  createdAt: Date;
}

const TIPO_CONFIG: Record<string, { icon: LucideIcon; label: string }> = {
  CITA_HOY: { icon: CalendarClock, label: "Cita hoy" },
  CITA_SOLICITADA: { icon: CalendarPlus, label: "Solicitud de cita" },
  CITA_CONFIRMADA: { icon: CalendarCheck, label: "Cita confirmada" },
  CITA_CONTRAPROPUESTA: { icon: CalendarDays, label: "Contrapropuesta" },
  CITA_RECHAZADA: { icon: CalendarX, label: "Cita rechazada" },
  CITA_CANCELADA_POR_PACIENTE: { icon: CalendarX, label: "Cita cancelada" },
  PACIENTE_SIN_CONSULTA: { icon: UserX, label: "Sin consulta" },
  PACIENTE_SIN_MEDIDAS: { icon: Scale, label: "Sin medidas" },
  PLAN_ANTIGUO: { icon: FileWarning, label: "Plan antiguo" },
  DIARIO_NUEVO: { icon: BookOpen, label: "Diario" },
};

export function NotificacionItem({ notificacion: n }: { notificacion: Notif }) {
  const cfg = TIPO_CONFIG[n.tipo] || { icon: Bell, label: "Notificación" };
  const Icon = cfg.icon;
  const fecha = new Date(n.createdAt);
  const hora = fecha.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
  const relativo = formatDistanceToNow(fecha, { addSuffix: true, locale: es });

  const content = (
    <div
      className={`flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors ${
        n.leida ? "" : "bg-primary/5"
      } ${n.enlace ? "hover:bg-muted/40" : ""}`}
    >
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
          n.leida ? "bg-muted" : "bg-primary/10"
        }`}
      >
        <Icon
          strokeWidth={1.75}
          className={`w-5 h-5 ${n.leida ? "text-muted-foreground" : "text-primary"}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              <p className={`text-sm font-semibold leading-tight ${n.leida ? "" : ""}`}>
                {n.titulo}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {cfg.label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {n.mensaje.replace(/ - [a-z0-9-]{8,}$/i, "")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground tabular-nums hidden sm:inline">
              {hora}
            </span>
            {!n.leida && (
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                title="Sin leer"
              />
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-1 sm:hidden">{relativo}</p>
      </div>
    </div>
  );

  if (n.enlace) {
    return (
      <Link href={n.enlace} className="block">
        {content}
      </Link>
    );
  }
  return content;
}
