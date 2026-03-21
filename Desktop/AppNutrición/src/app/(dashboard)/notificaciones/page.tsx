import { Bell, Check } from "lucide-react";
import { getNotificaciones } from "@/app/actions/notificaciones";
import { formatDate } from "@/lib/utils";
import { NotificacionActions } from "./notificacion-actions";

const TIPO_ICONS: Record<string, string> = {
  CITA_HOY: "text-purple-600 bg-purple-50",
  PACIENTE_SIN_CONSULTA: "text-amber-600 bg-amber-50",
  PACIENTE_SIN_MEDIDAS: "text-blue-600 bg-blue-50",
  PLAN_ANTIGUO: "text-orange-600 bg-orange-50",
  DIARIO_NUEVO: "text-green-600 bg-green-50",
};

export default async function NotificacionesPage() {
  const notificaciones = await getNotificaciones();
  const noLeidas = notificaciones.filter((n) => !n.leida).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Notificaciones</h1>
          <p className="text-muted-foreground mt-1">
            {noLeidas > 0 ? `${noLeidas} sin leer` : "Todas leídas"}
          </p>
        </div>
        {noLeidas > 0 && <NotificacionActions />}
      </div>

      {notificaciones.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="font-medium text-lg mb-1">Sin notificaciones</h3>
          <p className="text-muted-foreground">No tienes notificaciones</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notificaciones.map((n) => (
            <a
              key={n.id}
              href={n.enlace || "#"}
              className={`block p-4 rounded-xl border transition-colors ${
                n.leida
                  ? "border-border bg-card opacity-60"
                  : "border-primary/20 bg-primary/5 hover:bg-primary/10"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${TIPO_ICONS[n.tipo] || "text-gray-600 bg-gray-50"}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{n.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {n.mensaje.replace(/ - [a-z0-9]+$/i, "")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.leida && (
                  <div className="w-2 h-2 rounded-full bg-primary shrink-0 mt-2" />
                )}
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
