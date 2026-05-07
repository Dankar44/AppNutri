"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, Loader2, Paperclip, X, FileText, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  enviarMensajePaciente,
  getMensajesPaciente,
  marcarLeidoPaciente,
  type Mensaje,
} from "@/app/actions/mensajes";
import { subirAdjuntoMensaje } from "@/app/actions/mensajes-adjuntos";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

interface Dietista {
  id: string;
  nombre: string;
  apellidos: string;
  especialidad: string | null;
}

interface Props {
  dietista: Dietista;
  mensajesIniciales: Mensaje[];
  conversacionId: string | null;
  pacienteId: string;
}

export function PacienteMensajesClient({
  dietista,
  mensajesIniciales,
  conversacionId,
  pacienteId,
}: Props) {
  const [mensajes, setMensajes] = useState<Mensaje[]>(mensajesIniciales);

  // Marcar como leído al entrar
  useEffect(() => {
    marcarLeidoPaciente().catch(() => {});
  }, []);

  // Realtime: suscripción al canal de la conversación
  useEffect(() => {
    if (!conversacionId) return;
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`conv:${conversacionId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "nuevo_mensaje" }, (payload) => {
        const nuevo = payload.payload?.mensaje as Mensaje | undefined;
        if (!nuevo) return;
        setMensajes((prev) => {
          if (prev.some((m) => m.id === nuevo.id)) return prev;
          return [...prev, normalizarFechas(nuevo)];
        });
        if (nuevo.autor === "DIETISTA") {
          marcarLeidoPaciente().catch(() => {});
        }
      })
      .on("broadcast", { event: "leido" }, (payload) => {
        if (payload.payload?.por !== "DIETISTA") return;
        setMensajes((prev) =>
          prev.map((m) =>
            m.autor === "PACIENTE" && !m.leidoEn
              ? { ...m, leidoEn: new Date() }
              : m,
          ),
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [conversacionId]);

  // Realtime: inbox del paciente (para refresh badges layout)
  useEffect(() => {
    const supabase = getSupabaseBrowser();
    if (!supabase) return;

    const canal = supabase
      .channel(`inbox:p:${pacienteId}`, {
        config: { broadcast: { self: false } },
      })
      .on("broadcast", { event: "actualizacion" }, () => {
        // El layout server component se refresca al navegar
      })
      .subscribe();

    return () => {
      supabase.removeChannel(canal).catch(() => {});
    };
  }, [pacienteId]);

  // Polling fallback cada 60s (por si Realtime cae)
  useEffect(() => {
    const interval = setInterval(() => {
      getMensajesPaciente().then((m) => {
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
  }, []);

  const onEnviado = useCallback((m: Mensaje) => {
    setMensajes((prev) => {
      if (prev.some((existing) => existing.id === m.id)) return prev;
      return [...prev, m];
    });
  }, []);

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden flex flex-col h-[calc(100vh-220px)] min-h-[500px]">
      <ChatHeader dietista={dietista} />
      <MensajesListPaciente mensajes={mensajes} />
      <MensajeInputPaciente onEnviado={onEnviado} />
    </div>
  );
}

function ChatHeader({ dietista }: { dietista: Dietista }) {
  const initials = `${dietista.nombre[0] || ""}${dietista.apellidos[0] || ""}`.toUpperCase();
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card shrink-0">
      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0">
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {dietista.nombre} {dietista.apellidos}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {dietista.especialidad || "Nutricionista"}
        </p>
      </div>
    </div>
  );
}

function MensajesListPaciente({ mensajes }: { mensajes: Mensaje[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [mensajes.length]);

  if (mensajes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-medium">Escríbele a tu nutricionista</p>
        <p className="text-xs text-muted-foreground mt-1">
          Resuelve dudas sobre tu dieta o envía fotos de comidas
        </p>
      </div>
    );
  }

  const grupos = agruparPorDia(mensajes);

  return (
    <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/20">
      {grupos.map((g) => (
        <div key={g.label} className="space-y-1">
          <div className="flex items-center justify-center my-2">
            <span className="text-[10px] uppercase tracking-wide font-semibold text-muted-foreground bg-card border border-border px-2.5 py-1 rounded-full">
              {g.label}
            </span>
          </div>
          {g.mensajes.map((m) => (
            <MensajeBubblePaciente key={m.id} mensaje={m} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MensajeBubblePaciente({ mensaje }: { mensaje: Mensaje }) {
  const esMio = mensaje.autor === "PACIENTE";
  const hora = new Date(mensaje.createdAt).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

  return (
    <div className={cn("flex", esMio ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] sm:max-w-[70%] flex flex-col", esMio ? "items-end" : "items-start")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            esMio
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md",
          )}
        >
          {mensaje.adjuntoUrl && <AdjuntoPreviewPaciente mensaje={mensaje} esMio={esMio} />}
          {mensaje.texto && (
            <p className="whitespace-pre-wrap break-words leading-relaxed">
              {mensaje.texto}
            </p>
          )}
        </div>
        <div className={cn("flex items-center gap-1 mt-0.5 px-1", esMio ? "flex-row-reverse" : "")}>
          <span className="text-[10px] text-muted-foreground tabular-nums">{hora}</span>
          {esMio && (
            <span className="text-[10px] text-muted-foreground">
              {mensaje.leidoEn ? "✓✓" : "✓"}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function AdjuntoPreviewPaciente({ mensaje, esMio }: { mensaje: Mensaje; esMio: boolean }) {
  const esImagen = mensaje.adjuntoTipo?.startsWith("image/");
  if (esImagen) {
    return (
      <a
        href={mensaje.adjuntoUrl!}
        target="_blank"
        rel="noopener noreferrer"
        className="block mb-1.5 -mx-1 -mt-0.5"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={mensaje.adjuntoUrl!}
          alt={mensaje.adjuntoNombre || "adjunto"}
          className="max-h-60 w-auto rounded-xl object-cover"
        />
      </a>
    );
  }
  return (
    <a
      href={mensaje.adjuntoUrl!}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "flex items-center gap-2 rounded-lg px-2 py-1.5 mb-1.5",
        esMio ? "bg-primary-foreground/10" : "bg-muted",
      )}
    >
      <FileText className="w-4 h-4 shrink-0" />
      <span className="text-xs truncate">{mensaje.adjuntoNombre || "Archivo"}</span>
    </a>
  );
}

function MensajeInputPaciente({ onEnviado }: { onEnviado: (m: Mensaje) => void }) {
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [adjunto, setAdjunto] = useState<{ file: File; url: string; tipo: string } | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const enviandoRef = useRef(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + "px";
    }
  }, [texto]);

  async function handleAdjuntar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("El archivo no puede superar los 10 MB");
      return;
    }
    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      const res = await subirAdjuntoMensaje(formData);
      setAdjunto({ file, url: res.url, tipo: file.type });
    } catch {
      toast.error("No se pudo subir el archivo");
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleEnviar(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!texto.trim() && !adjunto) || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const m = await enviarMensajePaciente(
        texto,
        adjunto
          ? { url: adjunto.url, nombre: adjunto.file.name, tipo: adjunto.tipo }
          : undefined,
      );
      setTexto("");
      setAdjunto(null);
      onEnviado(m);
    } catch {
      toast.error("No se pudo enviar");
    } finally {
      enviandoRef.current = false;
      setEnviando(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleEnviar();
    }
  }

  return (
    <form onSubmit={handleEnviar} className="border-t border-border bg-card p-3 shrink-0">
      {adjunto && (
        <div className="mb-2 flex items-center gap-2 rounded-lg border border-border bg-muted/40 p-2">
          {adjunto.tipo.startsWith("image/") ? (
            <ImageIcon className="w-4 h-4 text-primary shrink-0" />
          ) : (
            <FileText className="w-4 h-4 text-primary shrink-0" />
          )}
          <span className="text-xs flex-1 truncate">{adjunto.file.name}</span>
          <button
            type="button"
            onClick={() => setAdjunto(null)}
            className="p-1 rounded hover:bg-muted"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          onChange={handleAdjuntar}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={subiendo || enviando}
          className="p-2 rounded-lg hover:bg-muted transition-colors shrink-0 disabled:opacity-50"
          aria-label="Adjuntar archivo"
        >
          {subiendo ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Paperclip className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
        <textarea
          ref={textareaRef}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe un mensaje..."
          rows={1}
          disabled={enviando}
          className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-[120px]"
        />
        <button
          type="submit"
          disabled={enviando || subiendo || (!texto.trim() && !adjunto)}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Enviar mensaje"
        >
          {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
    </form>
  );
}

function normalizarFechas(m: Mensaje): Mensaje {
  return {
    ...m,
    createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
    leidoEn: m.leidoEn ? new Date(m.leidoEn) : null,
  };
}

function agruparPorDia(mensajes: Mensaje[]) {
  const grupos: { key: string; label: string; mensajes: Mensaje[] }[] = [];
  for (const m of mensajes) {
    const d = new Date(m.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let grupo = grupos.find((g) => g.key === key);
    if (!grupo) {
      grupo = { key, label: formatLabelDia(d), mensajes: [] };
      grupos.push(grupo);
    }
    grupo.mensajes.push(m);
  }
  return grupos;
}

function formatLabelDia(d: Date): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const fecha = new Date(d);
  fecha.setHours(0, 0, 0, 0);
  if (fecha.getTime() === hoy.getTime()) return "Hoy";
  if (fecha.getTime() === ayer.getTime()) return "Ayer";
  const formato = fecha.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formato.charAt(0).toUpperCase() + formato.slice(1);
}
