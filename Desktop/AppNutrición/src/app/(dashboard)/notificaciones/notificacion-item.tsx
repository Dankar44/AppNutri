"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
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
  Trash2,
  Check,
  Wallet,
  WalletCards,
  AlertCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { eliminarNotificacion, marcarLeida } from "@/app/actions/notificaciones";
import { useTranslations } from "next-intl";
import { useLocale } from "@/components/locale-provider";
import { getDateLocale } from "@/i18n/date-locale";

interface Notif {
  id: string;
  tipo: string;
  titulo: string;
  mensaje: string;
  tituloKey?: string | null;
  mensajeKey?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: any;
  enlace: string | null;
  leida: boolean;
  createdAt: Date;
}

const TIPO_ICON: Record<string, LucideIcon> = {
  CITA_HOY: CalendarClock,
  CITA_SOLICITADA: CalendarPlus,
  CITA_CONFIRMADA: CalendarCheck,
  CITA_CONTRAPROPUESTA: CalendarDays,
  CITA_RECHAZADA: CalendarX,
  CITA_CANCELADA_POR_PACIENTE: CalendarX,
  PACIENTE_SIN_CONSULTA: UserX,
  PACIENTE_SIN_MEDIDAS: Scale,
  PLAN_ANTIGUO: FileWarning,
  DIARIO_NUEVO: BookOpen,
  PAGO_RECIBIDO: Wallet,
  PAGO_PENDIENTE: WalletCards,
  PAGO_FALLIDO: AlertCircle,
};

export function NotificacionItem({ notificacion: n }: { notificacion: Notif }) {
  const t = useTranslations("notifications");
  const tv = useTranslations("validation");
  const { locale } = useLocale();
  const dateFnsLocale = getDateLocale(locale);
  const localeTag = locale === "pt" ? "pt-BR" : "es-ES";
  const Icon = TIPO_ICON[n.tipo] || Bell;

  let displayTitulo = n.titulo;
  let displayMensaje = n.mensaje;
  if (n.tituloKey) {
    try { displayTitulo = tv(n.tituloKey, n.params ?? {}); } catch {}
  }
  if (n.mensajeKey) {
    try { displayMensaje = tv(n.mensajeKey, n.params ?? {}); } catch {}
  }
  const label = t(`tipoLabels.${n.tipo}` as Parameters<typeof t>[0]) || t("tipoLabels.default");
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const fecha = new Date(n.createdAt);
  const hora = fecha.toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });
  const relativo = formatDistanceToNow(fecha, { addSuffix: true, locale: dateFnsLocale });

  function handleEliminar(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await eliminarNotificacion(n.id);
      router.refresh();
    });
  }

  function handleLeer(e: React.MouseEvent) {
    if (n.leida) return;
    e.preventDefault();
    const destino = n.enlace;
    startTransition(async () => {
      await marcarLeida(n.id).catch(() => {});
      if (destino) router.push(destino);
      else router.refresh();
    });
  }

  function handleMarcarLeida(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (n.leida) return;
    startTransition(async () => {
      await marcarLeida(n.id).catch(() => {});
      router.refresh();
    });
  }

  const markReadBtn = !n.leida ? (
    <button
      type="button"
      onClick={handleMarcarLeida}
      disabled={pending}
      aria-label={t("item.markAsRead")}
      title={t("item.markAsRead")}
      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-500/15 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40"
    >
      <Check className="w-4 h-4" />
    </button>
  ) : null;

  const deleteBtn = (
    <button
      type="button"
      onClick={handleEliminar}
      disabled={pending}
      aria-label={t("item.deleteNotification")}
      title={t("item.delete")}
      className="shrink-0 w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/15 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity disabled:opacity-40"
    >
      <Trash2 className="w-4 h-4" />
    </button>
  );

  const content = (
    <div
      className={`group relative flex items-start gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors ${
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
                {displayTitulo}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                {label}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {displayMensaje.replace(/ - [a-z0-9-]{8,}$/i, "")}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[11px] text-muted-foreground tabular-nums hidden sm:inline">
              {hora}
            </span>
            {!n.leida && (
              <span
                className="w-2 h-2 rounded-full bg-primary shrink-0"
                title={t("item.unread")}
              />
            )}
            {markReadBtn}
            {deleteBtn}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground/70 mt-1 sm:hidden">{relativo}</p>
      </div>
    </div>
  );

  if (n.enlace) {
    return (
      <Link href={n.enlace} className="block" onClick={handleLeer}>
        {content}
      </Link>
    );
  }
  return (
    <button type="button" onClick={handleLeer} className="block w-full text-left">
      {content}
    </button>
  );
}
