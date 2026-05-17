"use client";

import { formatDistanceToNow, type Locale } from "date-fns";
import { Tooltip } from "@/components/ui/tooltip";
import { useTranslations } from "next-intl";
import { useLocale } from "@/components/locale-provider";
import { getDateLocale } from "@/i18n/date-locale";

export interface NotifMini {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  tituloKey?: string | null;
  mensajeKey?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
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

function useNotifText(n: NotifMini) {
  const tv = useTranslations("validation");
  let titulo = n.titulo;
  let mensaje = n.mensaje;
  if (n.tituloKey) {
    try { titulo = tv(n.tituloKey, n.params ?? {}); } catch {}
  }
  if (n.mensajeKey) {
    try { mensaje = tv(n.mensajeKey, n.params ?? {}); } catch {}
  }
  return { titulo, mensaje };
}

function NotifItem({ n, dateFnsLocale }: { n: NotifMini; dateFnsLocale: Locale }) {
  const { titulo, mensaje } = useNotifText(n);
  return (
    <div>
      <p className="font-semibold text-[11px] leading-tight">{titulo}</p>
      <p className="text-[10.5px] text-muted-foreground leading-snug mt-0.5">
        {mensaje.replace(/ - [a-z0-9-]{8,}$/i, "")}
      </p>
      <p className="text-[10px] text-muted-foreground/70 mt-0.5">
        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: dateFnsLocale })}
      </p>
    </div>
  );
}

export function NotificationDot({ notificaciones, overlay = true }: Props) {
  const t = useTranslations("notifications");
  const { locale } = useLocale();
  const dateFnsLocale = getDateLocale(locale);

  if (!notificaciones || notificaciones.length === 0) return null;

  const count = notificaciones.length;
  const visible = notificaciones.slice(0, 3);
  const extra = count - visible.length;

  const tooltipContent = (
    <div className="space-y-2 text-left">
      {visible.map((n) => (
        <NotifItem key={n.id} n={n} dateFnsLocale={dateFnsLocale} />
      ))}
      {extra > 0 && (
        <p className="text-[10.5px] text-muted-foreground italic pt-1 border-t border-border">
          {t("dot.andMore", { count: extra })}
        </p>
      )}
    </div>
  );

  const ariaLabel = t("dot.unreadCount", { count });

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
