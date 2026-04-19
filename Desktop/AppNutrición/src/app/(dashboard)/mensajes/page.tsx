import { MessageSquare } from "lucide-react";
import { getCurrentDietista } from "@/app/actions/auth";
import { getConversaciones, getMensajes } from "@/app/actions/mensajes";
import { redirect } from "next/navigation";
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
  const conversaciones = await getConversaciones({ archivadas });
  const conversacionActiva = params.c
    ? conversaciones.find((c) => c.id === params.c) ?? null
    : conversaciones[0] ?? null;

  const mensajesIniciales = conversacionActiva
    ? await getMensajes(conversacionActiva.id)
    : [];

  return (
    <div>
      <div className="flex items-start gap-3 mb-5 sm:mb-6">
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
        conversacionActivaId={conversacionActiva?.id ?? null}
        mensajesIniciales={mensajesIniciales}
        archivadas={archivadas}
        dietistaId={dietista.id}
      />
    </div>
  );
}
