import Link from "next/link";
import { ArrowRight, MessageSquare } from "lucide-react";

interface MensajePreview {
  texto: string;
  createdAt: Date;
  remitenteNombre: string;
  fotoUrl?: string | null;
}

interface Props {
  noLeidos: number;
  ultimo: MensajePreview | null;
  className?: string;
}

function formatTimeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "ahora";
  if (min < 60) return `hace ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return new Date(date).toLocaleDateString("es-ES", { day: "2-digit", month: "short" });
}

export function MensajesPreviewCard({ noLeidos, ultimo, className = "" }: Props) {
  return (
    <Link
      href="/paciente/portal/mensajes"
      className={`flex flex-col rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-sm transition-all ${className}`}
    >
      <header className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <span className="relative inline-flex items-center justify-center w-10 h-10 rounded-xl border border-border text-foreground">
            <MessageSquare className="w-5 h-5" strokeWidth={1.75} />
            {noLeidos > 0 && (
              <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {noLeidos > 9 ? "9+" : noLeidos}
              </span>
            )}
          </span>
          <div>
            <h2 className="text-base font-semibold">Mensajes</h2>
            <p className="text-[11px] text-muted-foreground">
              {noLeidos > 0
                ? `${noLeidos} sin leer`
                : "Sin mensajes pendientes"}
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
      </header>

      {ultimo ? (
        <div className="flex items-start gap-2.5 rounded-xl bg-muted/40 p-3">
          {ultimo.fotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={ultimo.fotoUrl}
              alt=""
              className="w-7 h-7 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-[10px] font-bold shrink-0">
              {ultimo.remitenteNombre[0]?.toUpperCase()}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="text-xs font-semibold truncate">{ultimo.remitenteNombre}</p>
              <span className="text-[10px] text-muted-foreground shrink-0">
                {formatTimeAgo(ultimo.createdAt)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
              {ultimo.texto}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Cuando tu nutricionista te escriba aparecerá aquí.
        </p>
      )}
    </Link>
  );
}
