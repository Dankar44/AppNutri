"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useTransition } from "react";
import { Search, Archive, Inbox, Plus, MessageSquarePlus, Loader2 } from "lucide-react";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";
import {
  getOrCrearConversacion,
  getPacientesParaConversacion,
  type ConversacionConPaciente,
  type PacienteParaConversacion,
} from "@/app/actions/mensajes";
import { toast } from "sonner";

interface Props {
  conversaciones: ConversacionConPaciente[];
  conversacionActivaId: string | null;
  onSeleccionar: (id: string) => void;
  archivadas: boolean;
}

export function ConversacionesList({
  conversaciones,
  conversacionActivaId,
  onSeleccionar,
  archivadas,
}: Props) {
  const router = useRouter();
  const [busqueda, setBusqueda] = useState("");
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const q = busqueda.trim().toLowerCase();

  const filtradas = q
    ? conversaciones.filter((c) =>
        `${c.paciente.nombre} ${c.paciente.apellidos}`.toLowerCase().includes(q),
      )
    : conversaciones;

  // Pacientes (para iniciar nueva conversación) cargados cuando busca o cuando se abre picker
  const [pacientes, setPacientes] = useState<PacienteParaConversacion[]>([]);
  const [cargandoPacientes, setCargandoPacientes] = useState(false);
  const [iniciando, startTransition] = useTransition();
  const [pacienteEnCurso, setPacienteEnCurso] = useState<string | null>(null);

  // Cargar pacientes al buscar o al abrir picker (con pequeño debounce)
  useEffect(() => {
    const debeBuscar = (q.length > 0 && !archivadas) || mostrarPicker;
    if (!debeBuscar) {
      setPacientes([]);
      return;
    }
    setCargandoPacientes(true);
    const t = setTimeout(() => {
      getPacientesParaConversacion(q || undefined)
        .then((p) => setPacientes(p))
        .finally(() => setCargandoPacientes(false));
    }, 200);
    return () => clearTimeout(t);
  }, [q, archivadas, mostrarPicker]);

  // Pacientes a mostrar en "Empezar conversación" (excluir los que ya tienen conversación visible arriba)
  const idsConvVisibles = new Set(filtradas.map((c) => c.pacienteId));
  const pacientesParaIniciar = pacientes.filter(
    (p) => !p.conversacionId || !idsConvVisibles.has(p.id),
  );

  function abrirConversacionPaciente(p: PacienteParaConversacion) {
    setPacienteEnCurso(p.id);
    startTransition(async () => {
      try {
        const conv = await getOrCrearConversacion(p.id);
        setMostrarPicker(false);
        setBusqueda("");
        onSeleccionar(conv.id);
        router.refresh();
      } catch {
        toast.error("No se pudo abrir la conversación");
      } finally {
        setPacienteEnCurso(null);
      }
    });
  }

  return (
    <>
      {/* Header con búsqueda y botón nueva conversación */}
      <div className="p-3 border-b border-border space-y-3 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar paciente..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
          <button
            type="button"
            onClick={() => setMostrarPicker((v) => !v)}
            className={cn(
              "shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-lg transition-colors",
              mostrarPicker
                ? "bg-primary text-primary-foreground"
                : "bg-primary/10 text-primary hover:bg-primary/15",
            )}
            title="Nueva conversación"
            aria-label="Nueva conversación"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs activas / archivadas */}
        <div className="flex items-center gap-1 rounded-lg bg-muted p-1">
          <Link
            href="/mensajes"
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors",
              !archivadas
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Inbox className="w-3.5 h-3.5" />
            Bandeja
          </Link>
          <Link
            href="/mensajes?archivadas=1"
            className={cn(
              "flex-1 inline-flex items-center justify-center gap-1.5 text-xs font-medium py-1.5 rounded-md transition-colors",
              archivadas
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Archive className="w-3.5 h-3.5" />
            Archivadas
          </Link>
        </div>
      </div>

      {/* Lista scrolleable */}
      <div className="flex-1 overflow-y-auto">
        {/* Conversaciones existentes */}
        {filtradas.length > 0 && (
          <ul className="divide-y divide-border">
            {filtradas.map((c) => (
              <li key={c.id}>
                <ConversacionItem
                  conversacion={c}
                  activa={c.id === conversacionActivaId}
                  onClick={() => onSeleccionar(c.id)}
                />
              </li>
            ))}
          </ul>
        )}

        {/* Sección iniciar nueva conversación (cuando hay búsqueda o picker abierto) */}
        {(q.length > 0 || mostrarPicker) && !archivadas && (
          <div className={cn(filtradas.length > 0 && "border-t border-border mt-1")}>
            <div className="px-3 pt-3 pb-1.5 flex items-center gap-2">
              <MessageSquarePlus className="w-3.5 h-3.5 text-muted-foreground" />
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {q ? "Empezar conversación con" : "Pacientes"}
              </p>
            </div>

            {cargandoPacientes && pacientes.length === 0 ? (
              <div className="px-3 py-4 flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            ) : pacientesParaIniciar.length === 0 ? (
              <p className="px-3 py-4 text-xs text-muted-foreground text-center">
                {q ? "No hay pacientes con ese nombre" : "Sin pacientes activos"}
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {pacientesParaIniciar.map((p) => (
                  <li key={p.id}>
                    <PacienteIniciarItem
                      paciente={p}
                      cargando={iniciando && pacienteEnCurso === p.id}
                      onClick={() => abrirConversacionPaciente(p)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Empty state cuando no hay búsqueda ni picker abierto y no hay conversaciones */}
        {filtradas.length === 0 && !q && !mostrarPicker && (
          <div className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageSquarePlus className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-medium">
              {archivadas ? "Sin conversaciones archivadas" : "Sin conversaciones"}
            </p>
            {!archivadas && (
              <>
                <p className="text-xs text-muted-foreground mt-1 mb-4">
                  Empieza una conversación con un paciente
                </p>
                <button
                  type="button"
                  onClick={() => setMostrarPicker(true)}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nueva conversación
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function ConversacionItem({
  conversacion: c,
  activa,
  onClick,
}: {
  conversacion: ConversacionConPaciente;
  activa: boolean;
  onClick: () => void;
}) {
  const tieneNoLeidos = c.noLeidosDietista > 0;
  const ultimo = c.ultimoMensaje;
  const preview = ultimo
    ? `${ultimo.autor === "DIETISTA" ? "Tú: " : ""}${ultimo.texto.slice(0, 80)}`
    : "Sin mensajes todavía";
  const tiempo = c.ultimoMensajeAt
    ? formatDistanceToNow(new Date(c.ultimoMensajeAt), {
        addSuffix: false,
        locale: es,
      })
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 p-3 hover:bg-muted/40 transition-colors text-left",
        activa && "bg-primary/5",
      )}
    >
      <AvatarPaciente
        nombre={c.paciente.nombre}
        apellidos={c.paciente.apellidos}
        fotoUrl={c.paciente.fotoUrl}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p
            className={cn(
              "text-sm truncate",
              tieneNoLeidos ? "font-bold" : "font-semibold",
            )}
          >
            {c.paciente.nombre} {c.paciente.apellidos}
          </p>
          {tiempo && (
            <span
              className={cn(
                "text-[10px] tabular-nums shrink-0",
                tieneNoLeidos ? "text-primary font-semibold" : "text-muted-foreground",
              )}
            >
              {tiempo}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <p
            className={cn(
              "text-xs truncate flex-1",
              tieneNoLeidos ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {preview}
          </p>
          {tieneNoLeidos && (
            <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold shrink-0">
              {c.noLeidosDietista}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

function PacienteIniciarItem({
  paciente: p,
  cargando,
  onClick,
}: {
  paciente: PacienteParaConversacion;
  cargando: boolean;
  onClick: () => void;
}) {
  const tieneConversacion = !!p.conversacionId;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={cargando}
      className={cn(
        "w-full flex items-center gap-3 p-3 hover:bg-muted/40 transition-colors text-left disabled:opacity-60",
      )}
    >
      <AvatarPaciente
        nombre={p.nombre}
        apellidos={p.apellidos}
        fotoUrl={p.fotoUrl}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate">
          {p.nombre} {p.apellidos}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {tieneConversacion ? "Abrir conversación" : "Empezar conversación"}
        </p>
      </div>
      {cargando ? (
        <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
      ) : (
        <MessageSquarePlus className="w-4 h-4 text-primary/70 shrink-0" />
      )}
    </button>
  );
}
