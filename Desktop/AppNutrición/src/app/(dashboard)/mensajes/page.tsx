import Link from "next/link";
import { Mail } from "lucide-react";

export default function MensajesPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Mensajes</h1>
        <p className="text-muted-foreground mt-1">
          Bandeja de mensajes con tus pacientes
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Mail className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-lg">Próximamente</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Aquí podrás gestionar conversaciones y seguimiento por mensaje. Por
          ahora puedes usar{" "}
          <Link
            href="/notificaciones"
            className="text-primary font-medium hover:underline"
          >
            notificaciones
          </Link>{" "}
          para avisos del sistema.
        </p>
      </div>
    </div>
  );
}
