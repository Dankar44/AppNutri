"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Send, Loader2, ArrowLeft, Search } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  getMensajesSoporteAdmin,
  enviarMensajeSoporteAdmin,
  marcarSoporteLeidoAdmin,
  type ConversacionSoporteItem,
} from "@/app/actions/admin-soporte";
import type { MensajeSoporteData } from "@/app/actions/soporte";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Props {
  conversaciones: ConversacionSoporteItem[];
  dietistaActivaId: string | null;
  mensajesIniciales: MensajeSoporteData[];
}

export function AdminMensajesClient({
  conversaciones,
  dietistaActivaId,
  mensajesIniciales,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mensajes, setMensajes] = useState<MensajeSoporteData[]>(mensajesIniciales);
  const [cargando, setCargando] = useState(false);
  const [busqueda, setBusqueda] = useState("");

  const dietistaActiva = conversaciones.find((c) => c.dietistaId === dietistaActivaId) ?? null;

  const q = busqueda.trim().toLowerCase();
  const filtradas = q
    ? conversaciones.filter(
        (c) =>
          `${c.nombre} ${c.apellidos}`.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q),
      )
    : conversaciones;

  useEffect(() => {
    if (!dietistaActivaId) {
      setMensajes([]);
      return;
    }
    setCargando(true);
    getMensajesSoporteAdmin(dietistaActivaId)
      .then((m) => setMensajes(m))
      .finally(() => setCargando(false));
    marcarSoporteLeidoAdmin(dietistaActivaId).then(() => router.refresh());
  }, [dietistaActivaId, router]);

  // Realtime: canal de la conversación activa
  useEffect(() => {
    if (!dietistaActivaId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`soporte:${dietistaActivaId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "nuevo_mensaje" }, (payload) => {
        const nuevo = payload.payload?.mensaje as MensajeSoporteData | undefined;
        if (!nuevo) return;
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevo.id)) return prev;
          return [
            ...prev,
            {
              ...nuevo,
              createdAt: nuevo.createdAt ? new Date(nuevo.createdAt) : new Date(),
              leidoEn: nuevo.leidoEn ? new Date(nuevo.leidoEn) : null,
            },
          ];
        });
        if (nuevo.autor === "DIETISTA") {
          marcarSoporteLeidoAdmin(dietistaActivaId).then(() => router.refresh());
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [dietistaActivaId, router]);

  // Realtime: inbox admin
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel("inbox:admin", {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "actualizacion" }, () => {
        router.refresh();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [router]);

  // Polling fallback 60s
  useEffect(() => {
    if (!dietistaActivaId) return;
    const interval = setInterval(() => {
      getMensajesSoporteAdmin(dietistaActivaId).then((m) => {
        setMensajes((prev) => {
          if (prev.length === m.length && prev[prev.length - 1]?.id === m[m.length - 1]?.id)
            return prev;
          return m;
        });
      });
    }, 60_000);
    return () => clearInterval(interval);
  }, [dietistaActivaId]);

  const seleccionar = useCallback(
    (dietistaId: string) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("d", dietistaId);
      router.push(`/admin/mensajes?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const volver = useCallback(() => {
    router.push("/admin/mensajes");
  }, [router]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-[320px_1fr] lg:grid-cols-[360px_1fr] gap-4 h-[calc(100vh-200px)] min-h-[500px]">
      {/* Lista de dietistas */}
      <div
        className={cn(
          "bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          dietistaActivaId ? "hidden md:flex" : "flex",
        )}
      >
        <div className="p-3 border-b border-border shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar dietista..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtradas.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                {q ? "No hay resultados" : "No hay conversaciones de soporte"}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {filtradas.map((c) => (
                <li key={c.dietistaId}>
                  <DietistaItem
                    conversacion={c}
                    activa={c.dietistaId === dietistaActivaId}
                    onClick={() => seleccionar(c.dietistaId)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Chat */}
      <div
        className={cn(
          "bg-card rounded-2xl border border-border overflow-hidden flex flex-col",
          dietistaActivaId ? "flex" : "hidden md:flex",
        )}
      >
        {dietistaActiva ? (
          <>
            <button
              type="button"
              onClick={volver}
              className="md:hidden flex items-center gap-2 px-4 py-3 border-b border-border text-sm font-medium hover:bg-muted/40 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>
            <AdminChatView
              dietista={dietistaActiva}
              mensajes={mensajes}
              cargando={cargando}
              onMensajeEnviado={(m) => setMensajes((prev) => [...prev, m])}
            />
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4">
              <Send className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            </div>
            <p className="text-sm font-semibold">Selecciona una conversación</p>
            <p className="text-xs text-muted-foreground mt-1">
              Elige un dietista de la lista para ver sus mensajes
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function DietistaItem({
  conversacion: c,
  activa,
  onClick,
}: {
  conversacion: ConversacionSoporteItem;
  activa: boolean;
  onClick: () => void;
}) {
  const iniciales = `${c.nombre.charAt(0)}${c.apellidos.charAt(0)}`.toUpperCase();
  const preview = c.ultimoMensaje
    ? `${c.ultimoAutor === "ADMIN" ? "Tú: " : ""}${c.ultimoMensaje.slice(0, 80)}`
    : "";
  const tiempo = c.ultimoAt
    ? formatDistanceToNow(new Date(c.ultimoAt), { addSuffix: false, locale: es })
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors text-left",
        activa && "bg-indigo-50/50 dark:bg-indigo-500/5",
      )}
    >
      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
        <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">{iniciales}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className={cn("text-sm truncate", c.noLeidos > 0 ? "font-bold" : "font-semibold")}>
            {c.nombre} {c.apellidos}
          </p>
          {tiempo && (
            <span
              className={cn(
                "text-[10px] tabular-nums shrink-0",
                c.noLeidos > 0 ? "text-indigo-600 dark:text-indigo-400 font-semibold" : "text-muted-foreground",
              )}
            >
              {tiempo}
            </span>
          )}
        </div>
        <p className="text-[11px] text-muted-foreground truncate mb-0.5">{c.email}</p>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs truncate flex-1",
              c.noLeidos > 0 ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          {c.noLeidos > 0 && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
              {c.noLeidos}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function AdminChatView({
  dietista,
  mensajes,
  cargando,
  onMensajeEnviado,
}: {
  dietista: ConversacionSoporteItem;
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

  // Reset text when switching dietista
  useEffect(() => {
    setTexto("");
  }, [dietista.dietistaId]);

  async function handleEnviar(e?: React.FormEvent) {
    e?.preventDefault();
    if (!texto.trim() || enviando) return;
    setEnviando(true);
    try {
      const m = await enviarMensajeSoporteAdmin(dietista.dietistaId, texto);
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
        <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center shrink-0">
          <span className="text-sm font-bold text-indigo-700 dark:text-indigo-300">
            {`${dietista.nombre.charAt(0)}${dietista.apellidos.charAt(0)}`.toUpperCase()}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {dietista.nombre} {dietista.apellidos}
          </p>
          <p className="text-[11px] text-muted-foreground truncate">
            {dietista.email}{dietista.especialidad ? ` · ${dietista.especialidad}` : ""}
          </p>
        </div>
      </div>

      {/* Mensajes */}
      {cargando ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : mensajes.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted/20">
          <p className="text-sm text-muted-foreground">Sin mensajes todavía</p>
        </div>
      ) : (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 bg-muted/20">
          {mensajes.map((m) => {
            const esAdmin = m.autor === "ADMIN";
            const hora = new Date(m.createdAt).toLocaleTimeString("es-ES", {
              hour: "2-digit",
              minute: "2-digit",
              timeZone: "Europe/Madrid",
            });
            return (
              <div key={m.id} className={cn("flex", esAdmin ? "justify-end" : "justify-start")}>
                <div
                  className={cn(
                    "max-w-[85%] sm:max-w-[70%] flex flex-col",
                    esAdmin ? "items-end" : "items-start",
                  )}
                >
                  <div
                    className={cn(
                      "rounded-2xl px-3.5 py-2 text-sm",
                      esAdmin
                        ? "bg-indigo-600 text-white rounded-br-md"
                        : "bg-card border border-border rounded-bl-md",
                    )}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.texto}</p>
                  </div>
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-0.5 px-1",
                      esAdmin ? "flex-row-reverse" : "",
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground tabular-nums">{hora}</span>
                    {esAdmin && (
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
            placeholder={`Responder a ${dietista.nombre}...`}
            rows={1}
            disabled={enviando}
            className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/30 max-h-[120px]"
          />
          <button
            type="submit"
            disabled={enviando || !texto.trim()}
            className="p-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Enviar mensaje"
          >
            {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </div>
      </form>
    </div>
  );
}
