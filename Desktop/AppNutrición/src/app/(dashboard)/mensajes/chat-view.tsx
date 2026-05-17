"use client";

import { useState, useRef, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Send, MoreVertical, Archive, Loader2, User, Paperclip, X, FileText, Image as ImageIcon, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/locale-provider";
import {
  enviarMensaje,
  archivarConversacion,
  desarchivarConversacion,
  type ConversacionConPaciente,
  type Mensaje,
} from "@/app/actions/mensajes";
import { subirAdjuntoMensaje } from "@/app/actions/mensajes-adjuntos";

interface Props {
  conversacion: ConversacionConPaciente;
  mensajes: Mensaje[];
  cargando: boolean;
  onMensajeEnviado: (m: Mensaje) => void;
  onVolver?: () => void;
}

export function ChatView({ conversacion, mensajes, cargando, onMensajeEnviado, onVolver }: Props) {
  const t = useTranslations("chat");

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <ChatHeader conversacion={conversacion} onVolver={onVolver} t={t} />
      <MensajesList mensajes={mensajes} cargando={cargando} t={t} />
      <MensajeInput
        conversacionId={conversacion.id}
        onEnviado={onMensajeEnviado}
        t={t}
      />
    </div>
  );
}

function ChatHeader({ conversacion: c, onVolver, t }: { conversacion: ConversacionConPaciente; onVolver?: () => void; t: ReturnType<typeof useTranslations<"chat">> }) {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleArchivar() {
    startTransition(async () => {
      try {
        if (c.archivadaDietista) {
          await desarchivarConversacion(c.id);
          toast.success(t("chatView.toastUnarchived"));
        } else {
          await archivarConversacion(c.id);
          toast.success(t("chatView.toastArchived"));
        }
        router.refresh();
        setMenuOpen(false);
      } catch {
        toast.error(t("chatView.toastUpdateError"));
      }
    });
  }

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-border shrink-0 bg-card">
      {onVolver && (
        <button
          type="button"
          onClick={onVolver}
          className="md:hidden p-1 -ml-1 rounded-lg hover:bg-muted transition-colors shrink-0"
          aria-label={t("soporte.backLabel")}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <AvatarPaciente
        nombre={c.paciente.nombre}
        apellidos={c.paciente.apellidos}
        fotoUrl={c.paciente.fotoUrl}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {c.paciente.nombre} {c.paciente.apellidos}
        </p>
        <p className="text-[11px] text-muted-foreground">
          {t("chatView.patientLabel")}
        </p>
      </div>

      <Link
        href={`/pacientes/${c.paciente.id}`}
        className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border hover:bg-muted transition-colors text-xs font-medium"
      >
        <User className="w-3.5 h-3.5" />
        {t("chatView.viewFile")}
      </Link>

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={t("chatView.moreOptions")}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setMenuOpen(false)}
            />
            <div className="absolute right-0 top-full mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-20 py-1">
              <button
                type="button"
                onClick={toggleArchivar}
                disabled={pending}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors text-left disabled:opacity-50"
              >
                <Archive className="w-4 h-4" />
                {c.archivadaDietista ? t("chatView.unarchive") : t("chatView.archive")}
              </button>
              <Link
                href={`/pacientes/${c.paciente.id}`}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors sm:hidden"
              >
                <User className="w-4 h-4" />
                {t("chatView.viewFile")}
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function MensajesList({ mensajes, cargando, t }: { mensajes: Mensaje[]; cargando: boolean; t: ReturnType<typeof useTranslations<"chat">> }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { locale } = useLocale();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes.length]);

  if (cargando) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (mensajes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
        <p className="text-sm text-muted-foreground">
          {t("chatView.noMessages")}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {t("chatView.sendFirst")}
        </p>
      </div>
    );
  }

  // Agrupar por día
  const grupos = agruparPorDia(mensajes, t, locale);

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
            <MensajeBubble key={m.id} mensaje={m} t={t} locale={locale} />
          ))}
        </div>
      ))}
    </div>
  );
}

function MensajeBubble({ mensaje, t, locale }: { mensaje: Mensaje; t: ReturnType<typeof useTranslations<"chat">>; locale: string }) {
  const esMio = mensaje.autor === "DIETISTA";
  const localeTag = locale === "pt" ? "pt-BR" : "es-ES";
  const hora = new Date(mensaje.createdAt).toLocaleTimeString(localeTag, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Madrid",
  });

  return (
    <div className={cn("flex", esMio ? "justify-end" : "justify-start")}>
      <div className={cn("max-w-[85%] sm:max-w-[70%]", esMio ? "items-end" : "items-start", "flex flex-col")}>
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2 text-sm",
            esMio
              ? "bg-primary text-primary-foreground rounded-br-md"
              : "bg-card border border-border rounded-bl-md",
          )}
        >
          {mensaje.adjuntoUrl && <AdjuntoPreview mensaje={mensaje} esMio={esMio} t={t} />}
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

function AdjuntoPreview({ mensaje, esMio, t }: { mensaje: Mensaje; esMio: boolean; t: ReturnType<typeof useTranslations<"chat">> }) {
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
          alt={mensaje.adjuntoNombre || t("chatView.attachmentAlt")}
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
      <span className="text-xs truncate">{mensaje.adjuntoNombre || t("chatView.fileLabel")}</span>
    </a>
  );
}

function MensajeInput({
  conversacionId,
  onEnviado,
  t,
}: {
  conversacionId: string;
  onEnviado: (m: Mensaje) => void;
  t: ReturnType<typeof useTranslations<"chat">>;
}) {
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
      const max = 120;
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, max) + "px";
    }
  }, [texto]);

  async function handleAdjuntar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error(t("chatView.toastFileTooLarge"));
      return;
    }

    setSubiendo(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      const res = await subirAdjuntoMensaje(formData);
      if (!res?.url) throw new Error(t("chatView.toastUploadError"));
      setAdjunto({ file, url: res.url, tipo: file.type });
    } catch {
      toast.error(t("chatView.toastUploadError"));
    } finally {
      setSubiendo(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function quitarAdjunto() {
    setAdjunto(null);
  }

  async function handleEnviar(e?: React.FormEvent) {
    e?.preventDefault();
    if ((!texto.trim() && !adjunto) || enviandoRef.current) return;
    enviandoRef.current = true;
    setEnviando(true);
    try {
      const mensaje = await enviarMensaje(
        conversacionId,
        texto,
        adjunto
          ? { url: adjunto.url, nombre: adjunto.file.name, tipo: adjunto.tipo }
          : undefined,
      );
      setTexto("");
      setAdjunto(null);
      onEnviado(mensaje);
    } catch {
      toast.error(t("chatView.toastSendError"));
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
    <form
      onSubmit={handleEnviar}
      className="border-t border-border bg-card p-3 shrink-0 pb-[calc(env(safe-area-inset-bottom)+12px)] md:pb-3"
    >
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
            onClick={quitarAdjunto}
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
          aria-label={t("chatView.attachFile")}
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
          placeholder={t("chatView.inputPlaceholder")}
          rows={1}
          disabled={enviando}
          className="flex-1 resize-none px-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-[120px]"
        />
        <button
          type="submit"
          disabled={enviando || subiendo || (!texto.trim() && !adjunto)}
          className="p-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label={t("chatView.sendMessage")}
        >
          {enviando ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>
    </form>
  );
}

function agruparPorDia(mensajes: Mensaje[], t: ReturnType<typeof useTranslations<"chat">>, locale: string) {
  const grupos: { key: string; label: string; mensajes: Mensaje[] }[] = [];
  for (const m of mensajes) {
    const d = new Date(m.createdAt);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    let grupo = grupos.find((g) => g.key === key);
    if (!grupo) {
      grupo = { key, label: formatLabelDia(d, t, locale), mensajes: [] };
      grupos.push(grupo);
    }
    grupo.mensajes.push(m);
  }
  return grupos;
}

function formatLabelDia(d: Date, t: ReturnType<typeof useTranslations<"chat">>, locale: string): string {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const ayer = new Date(hoy);
  ayer.setDate(ayer.getDate() - 1);
  const fecha = new Date(d);
  fecha.setHours(0, 0, 0, 0);
  if (fecha.getTime() === hoy.getTime()) return t("dateLabels.today");
  if (fecha.getTime() === ayer.getTime()) return t("dateLabels.yesterday");
  const localeTag = locale === "pt" ? "pt-BR" : "es-ES";
  const formato = fecha.toLocaleDateString(localeTag, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return formato.charAt(0).toUpperCase() + formato.slice(1);
}
