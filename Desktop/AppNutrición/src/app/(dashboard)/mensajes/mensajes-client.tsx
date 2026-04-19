"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConversacionesList } from "./conversaciones-list";
import { ChatView } from "./chat-view";
import type { ConversacionConPaciente, Mensaje } from "@/app/actions/mensajes";
import { getMensajes, marcarConversacionLeida } from "@/app/actions/mensajes";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  conversaciones: ConversacionConPaciente[];
  conversacionActivaId: string | null;
  mensajesIniciales: Mensaje[];
  archivadas: boolean;
  dietistaId: string;
}

export function MensajesClient({
  conversaciones,
  conversacionActivaId,
  mensajesIniciales,
  archivadas,
  dietistaId,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const mensajesRef = useRef<Mensaje[]>(mensajesIniciales);
  mensajesRef.current = mensajes;

  const conversacionActiva =
    conversaciones.find((c) => c.id === conversacionActivaId) ?? null;

  // Cambiar de conversación: actualizar mensajes
  useEffect(() => {
    if (!conversacionActivaId) {
      setMensajes([]);
      return;
    }
    setCargandoMensajes(true);
    getMensajes(conversacionActivaId)
      .then((m) => setMensajes(m))
      .finally(() => setCargandoMensajes(false));

    // Marcar como leída al abrir
    marcarConversacionLeida(conversacionActivaId).then(() => router.refresh());
  }, [conversacionActivaId, router]);

  // Realtime: suscripción al canal de la conversación activa
  useEffect(() => {
    if (!conversacionActivaId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`conv:${conversacionActivaId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "nuevo_mensaje" }, (payload) => {
        const nuevo = payload.payload?.mensaje as Mensaje | undefined;
        if (!nuevo) return;
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevo.id)) return prev;
          return [...prev, normalizarFechas(nuevo)];
        });
        // Marcar como leído si nos llega un mensaje del paciente
        if (nuevo.autor === "PACIENTE") {
          marcarConversacionLeida(conversacionActivaId).then(() =>
            router.refresh(),
          );
        }
      })
      .on("broadcast", { event: "leido" }, (payload) => {
        if (payload.payload?.por !== "PACIENTE") return;
        // Marcar mis mensajes como leídos en UI
        setMensajes((prev) =>
          prev.map((m) =>
            m.autor === "DIETISTA" && !m.leidoEn
              ? { ...m, leidoEn: new Date() }
              : m,
          ),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [conversacionActivaId, router]);

  // Realtime: suscripción al inbox del dietista (badge sidebar / lista)
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`inbox:d:${dietistaId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "actualizacion" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [dietistaId, router]);

  // Polling fallback cada 60s (por si Realtime cae)
  useEffect(() => {
    if (!conversacionActivaId) return;
    const interval = setInterval(() => {
      getMensajes(conversacionActivaId).then((m) => {
        setMensajes((prev) => {
          if (
            prev.length === m.length &&
            prev[prev.length - 1]?.id === m[m.length - 1]?.id
          ) {
            return prev;
          }
          return m;
        });
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [conversacionActivaId]);

  const seleccionarConversacion = useCallback(
    (id: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("c", id);
      router.push(`/mensajes?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const volverAlListado = useCallback(() => {
    const sp = new URLSearchParams(searchParams.toString());
    sp.delete("c");
    router.push(sp.toString() ? `/mensajes?${sp.toString()}` : "/mensajes");
  }, [router, searchParams]);

  const onMensajeEnviado = useCallback((nuevoMensaje: Mensaje) => {
    setMensajes((prev) => [...prev, nuevoMensaje]);
    router.refresh();
  }, [router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Lista de conversaciones (izq) */}
      <div
        className={cn(
          "bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          conversacionActivaId ? "hidden md:flex" : "flex",
        )}
      >
        <ConversacionesList
          conversaciones={conversaciones}
          conversacionActivaId={conversacionActivaId}
          onSeleccionar={seleccionarConversacion}
          archivadas={archivadas}
        />
      </div>

      {/* Chat (der) */}
      <div
        className={cn(
          "bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          conversacionActivaId ? "flex" : "hidden md:flex",
        )}
      >
        {conversacionActiva ? (
          <>
            {/* Botón volver solo en móvil */}
            <button
              type="button"
              onClick={volverAlListado}
              className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <ChatView
              conversacion={conversacionActiva}
              mensajes={mensajes}
              cargando={cargandoMensajes}
              onMensajeEnviado={onMensajeEnviado}
            />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>
    </div>
  );
}

/** Las fechas vienen como string desde el broadcast — las re-hidrato */
function normalizarFechas(m: Mensaje): Mensaje {
  return {
    ...m,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    leidoEn: m.leidoEn ? new Date(m.leidoEn) : null,
  };
}

function EmptyChat() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <svg
          className="w-8 h-8 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <p className="text-sm font-semibold">Selecciona una conversación</p>
      <p className="text-xs text-muted-foreground mt-1">
        Elige un paciente de la lista para empezar a chatear
      </p>
    </div>
  );
}
