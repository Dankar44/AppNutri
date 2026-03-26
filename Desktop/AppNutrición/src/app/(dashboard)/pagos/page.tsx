import Link from "next/link";
import { Wallet } from "lucide-react";

export default function PagosPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground mt-1">
          Cobros, facturas y estado de suscripciones
        </p>
      </div>
      <div className="rounded-xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Wallet className="h-7 w-7 text-muted-foreground" />
        </div>
        <h2 className="font-semibold text-lg">Próximamente</h2>
        <p className="text-muted-foreground text-sm mt-2 max-w-md mx-auto">
          Este apartado está preparado para integrar pagos y facturación. La
          suscripción de la app sigue gestionándose desde{" "}
          <Link
            href="/ajustes"
            className="text-primary font-medium hover:underline"
          >
            Ajustes
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
