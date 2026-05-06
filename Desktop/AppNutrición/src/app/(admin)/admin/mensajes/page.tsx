import { MessageSquare } from "lucide-react";
import { requireAdmin } from "@/lib/admin";
import { redirect } from "next/navigation";
import { getConversacionesSoporte, getMensajesSoporteAdmin } from "@/app/actions/admin-soporte";
import { AdminMensajesClient } from "./admin-mensajes-client";

export default async function AdminMensajesPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const params = await searchParams;
  const [conversaciones, mensajes] = await Promise.all([
    getConversacionesSoporte(),
    params.d ? getMensajesSoporteAdmin(params.d) : Promise.resolve([]),
  ]);

  return (
    <div>
      <div className="flex items-start gap-3 mb-5 sm:mb-6">
        <MessageSquare
          strokeWidth={1.75}
          className="w-7 h-7 sm:w-9 sm:h-9 text-foreground shrink-0 mt-1 sm:mt-1.5"
        />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl sm:text-3xl font-bold leading-tight">Mensajes Soporte</h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5">
            Conversaciones con dietistas
          </p>
        </div>
      </div>

      <AdminMensajesClient
        conversaciones={conversaciones}
        dietistaActivaId={params.d ?? null}
        mensajesIniciales={mensajes}
      />
    </div>
  );
}
