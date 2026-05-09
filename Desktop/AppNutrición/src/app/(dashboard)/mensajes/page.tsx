import { MessageSquare } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getConversaciones, getMensajes } from "@/app/actions/mensajes";
import { getSoporteResumen, getMensajesSoporte, getNoLeidosSoporteCount } from "@/app/actions/soporte";
import { redirect } from "next/navigation";
import { cn } from "@/lib/utils";
import { MensajesClient } from "./mensajes-client";

export default async function MensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string; archivadas?: string }>;
}) {
  const params = await searchParams;
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");

  const archivadas = params.archivadas === "1";
  const esSoporte = params.c === "soporte";

  const [conversaciones, soporteResumen, soporteNoLeidos, soporteMensajes] = await Promise.all([
    getConversaciones({ archivadas }),
    getSoporteResumen(),
    getNoLeidosSoporteCount(),
    esSoporte ? getMensajesSoporte() : Promise.resolve([]),
  ]);

  const conversacionActiva = esSoporte
    ? null
    : params.c
      ? conversaciones.find((c) => c.id === params.c) ?? null
      : null;

  const mensajesIniciales = conversacionActiva
    ? await getMensajes(conversacionActiva.id)
    : [];

  const tieneConvActiva = !!(esSoporte || conversacionActiva);

  return (
    <div>
      <div className={cn(
        "flex items-start gap-3 mb-5 sm:mb-6",
        tieneConvActiva && "hidden md:flex",
      )}>
        <MessageSquare
          strokeWidth={1.75}
          className="w-7 h-7 sm:w-9 sm:h-9 text-foreground shrink-0 mt-1 sm:mt-1.5"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">Mensajes</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Comunicación directa con tus pacientes
          </p>
        </div>
      </div>

      <MensajesClient
        conversaciones={conversaciones}
        mensajesIniciales={mensajesIniciales}
        archivadas={archivadas}
        dietistaId={dietista.id}
        soporteNoLeidos={soporteNoLeidos}
        soporteResumen={soporteResumen}
        soporteMensajesIniciales={soporteMensajes}
      />
    </div>
  );
}
