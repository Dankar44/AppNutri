"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Tooltip } from "@/components/ui/tooltip";

export interface NotifMini {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  createdAt: Date | string;
}

interface Props {
  notificaciones: NotifMini[];
  /**
   * Si `true` (default), el badge se autoposiciona absoluto en la esquina superior derecha
   * del contenedor `relative` padre. Pensado para solaparse sobre un avatar.
   * Si `false`, se renderiza inline.
   */
  overlay?: boolean;
}

export function NotificationDot({ notificaciones, overlay = true }: Props) {
  if (!notificaciones || notificaciones.length === 0) return null;

  const count = notificaciones.length;
  const visible = notificaciones.slice(0, 3);
  const extra = count - visible.length;

  const tooltipContent = (
    <div className="space-y-2 text-left">
      {visible.map((n) => (
        <div key={n.id}>
          <p className="font-semibold text-[11px] leading-tight">{n.titulo}</p>
          <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
            {n.mensaje.replace(/ - [a-z0-9-]{8,}$/i, "")}
          </p>
          <p className="text-[10px] text-muted-foreground/70 mt-0.5">
            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
          </p>
        </div>
      ))}
      {extra > 0 && (
        <p className="text-[10.5px] text-muted-foreground italic pt-1 border-t border-border">
          y {extra} más
        </p>
      )}
    </div>
  );

  const ariaLabel = `${count} notificación${count === 1 ? "" : "es"} sin leer`;

  const pill = (
    <Tooltip content={tooltipContent} side="top">
      <span
        aria-label={ariaLabel}
        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold bg-red-500 text-white ring-2 ring-background shadow-sm cursor-default"
      >
        {count > 9 ? "9+" : count}
      </span>
    </Tooltip>
  );

  if (!overlay) return pill;

  // Posicionamiento absoluto forzado vía inline styles para que no dependa de
  // el orden de carga de clases Tailwind ni otros estilos ancestros.
  return (
    <span
      style={{
        position: "absolute",
        top: -6,
        right: -6,
        zIndex: 10,
        pointerEvents: "auto",
        lineHeight: 0,
      }}
    >
      {pill}
    </span>
  );
}
