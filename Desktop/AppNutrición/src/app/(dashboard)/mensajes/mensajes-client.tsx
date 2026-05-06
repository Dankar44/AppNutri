"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Send, Loader2, Leaf } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ConversacionesList } from "./conversaciones-list";
import { ChatView } from "./chat-view";
import type { ConversacionConPaciente, Mensaje } from "@/app/actions/mensajes";
import { getMensajes, marcarConversacionLeida } from "@/app/actions/mensajes";
import {
  getMensajesSoporte,
  enviarMensajeSoporte,
  marcarSoporteLeido,
  type MensajeSoporteData,
  type SoporteResumen,
} from "@/app/actions/soporte";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  conversaciones: ConversacionConPaciente[];
  conversacionActivaId: string | null;
  mensajesIniciales: Mensaje[];
  archivadas: boolean;
  dietistaId: string;
  soporteNoLeidos: number;
  soporteResumen: SoporteResumen | null;
  soporteMensajesIniciales: MensajeSoporteData[];
}

export function MensajesClient({
  conversaciones,
  conversacionActivaId,
  mensajesIniciales,
  archivadas,
  dietistaId,
  soporteNoLeidos,
  soporteResumen,
  soporteMensajesIniciales,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);
  const [cargandoMensajes, setCargandoMensajes] = useState(false);
  const mensajesRef = useRef<Mensaje[]>(mensajesIniciales);
  mensajesRef.current = mensajes;

  const esSoporte = conversacionActivaId === "soporte";
  const conversacionActiva = esSoporte
    ? null
    : conversaciones.find((c) => c.id === conversacionActivaId) ?? null;

  // State para mensajes de soporte
  const [mensajesSoporte, setMensajesSoporte] = useState<MensajeSoporteData[]>(soporteMensajesIniciales);
  const [cargandoSoporte, setCargandoSoporte] = useState(false);

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
    if (!conversacionActivaId || esSoporte) return;
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
  }, [conversacionActivaId, esSoporte]);

  // Soporte: cargar mensajes y marcar leído al entrar
  useEffect(() => {
    if (!esSoporte) return;
    setCargandoSoporte(true);
    getMensajesSoporte()
      .then((m) => setMensajesSoporte(m))
      .finally(() => setCargandoSoporte(false));
    marcarSoporteLeido().then(() => router.refresh());
  }, [esSoporte, router]);

  // Soporte: realtime
  useEffect(() => {
    if (!esSoporte) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`soporte:${dietistaId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "nuevo_mensaje" }, (payload) => {
        const nuevo = payload.payload?.mensaje as MensajeSoporteData | undefined;
        if (!nuevo) return;
        setMensajesSoporte((prev) => {
          if (prev.some((m) => m.id === nuevo.id)) return prev;
          return [...prev, {
            ...nuevo,
            createdAt: nuevo.createdAt ? new Date(nuevo.createdAt) : new Date(),
            leidoEn: nuevo.leidoEn ? new Date(nuevo.leidoEn) : null,
          }];
        });
        if (nuevo.autor === "ADMIN") {
          marcarSoporteLeido().then(() => router.refresh());
        }
      })
      .on("broadcast", { event: "leido" }, (payload) => {
        if (payload.payload?.por !== "ADMIN") return;
        setMensajesSoporte((prev) =>
          prev.map((m) =>
            m.autor === "DIETISTA" && !m.leidoEn ? { ...m, leidoEn: new Date() } : m,
          ),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [esSoporte, dietistaId, router]);

  // Soporte: polling fallback 60s
  useEffect(() => {
    if (!esSoporte) return;
    const interval = setInterval(() => {
      getMensajesSoporte().then((m) => {
        setMensajesSoporte((prev) => {
          if (prev.length === m.length && prev[prev.length - 1]?.id === m[m.length - 1]?.id) return prev;
          return m;
        });
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [esSoporte]);

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
          soporteNoLeidos={soporteNoLeidos}
          soporteResumen={soporteResumen}
        />
      </div>

      {/* Chat (der) */}
      <div
        className={cn(
          "bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          conversacionActivaId ? "flex" : "hidden md:flex",
        )}
      >
        {esSoporte ? (
          <>
            <button
              type="button"
              onClick={volverAlListado}
              className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <SoporteChatView
              mensajes={mensajesSoporte}
              cargando={cargandoSoporte}
              onMensajeEnviado={(m) => setMensajesSoporte((prev) => [...prev, m])}
            />
          </>
        ) : conversacionActiva ? (
          <>
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

function SoporteChatView({
  mensajes,
  cargando,
  onMensajeEnviado,
}: {
  mensajes: MensajeSoporteData[];
  cargando: boolean;
  onMensajeEnviado: (m: MensajeSoporteData) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes.length]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [texto]);

  async function handleEnviar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const m = await enviarMensajeSoporte(texto);
      setTexto("");
      onMensajeEnviado(m);
    } catch {
      toast.error("No se pudo enviar");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
          <Leaf className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">Soporte Annonia</p>
          <p className="text-[11px] text-muted-foreground">Equipo Annonia</p>
        </div>
      </div>

      {/* Mensajes */}
      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : mensajes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
          <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
            <Leaf className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-sm font-semibold mb-1">¡Hola! 👋</p>
          <p className="text-xs text-muted-foreground max-w-xs">
            Escríbenos cualquier duda, sugerencia o error que encuentres.
            Estamos aquí para ayudarte.
          </p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/20">
          {mensajes.map((m) => {
            const esMio = m.autor === "DIETISTA";
            const hora = new Date(m.createdAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Madrid",
            });
            return (
              <div key={m.id} className={cn("flex", esMio ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[85%] sm:max-w-[70%] flex flex-col", esMio ? "items-end" : "items-start")}>
                  <div className={cn(
                    "rounded-2xl px-3.5 py-2 text-sm",
                    esMio
                      ? "bg-primary text-primary-foreground rounded-br-md"
                      : "bg-card border border-border rounded-bl-md",
                  )}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.texto}</p>
                  </div>
                  <div className={cn("flex items-center gap-1 mt-0.5 px-1", esMio ? "flex-row-reverse" : "")}>
                    <span className="text-[10px] text-muted-foreground tabular-nums">{hora}</span>
                    {esMio && (
                      <span className="text-[10px] text-muted-foreground">
                        {m.leidoEn ? "✓✓" : "✓"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleEnviar} className="border-t border-border bg-card p-3 shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleEnviar();
              }
            }}
            placeholder="Escribe a soporte..."
            rows={1}
            disabled={enviando}
            className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-[120px]"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar mensaje"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
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
