"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Mail,
  Phone,
  Target,
  Utensils,
  Scale,
  CalendarCheck,
  CalendarX,
  User,
  Lightbulb,
  Video,
} from "lucide-react";
import { toast } from "sonner";
import {
  crearCita,
  getPacientesParaCita,
  getPacienteContextoCita,
} from "@/app/actions/citas";
import { AvatarPaciente } from "@/components/avatar-paciente";
import { capitalizarNombre, formatDate } from "@/lib/utils";

type PacienteListItem = {
  id: string;
  nombre: string;
  apellidos: string;
  fotoUrl: string | null;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: Date | null;
  objetivo: string | null;
  objetivoDetalle: string | null;
};

type ContextoCita = Awaited<ReturnType<typeof getPacienteContextoCita>>;

const OBJETIVO_LABELS: Record<string, string> = {
  PERDER_PESO: "Pérdida de peso",
  GANAR_MASA: "Ganar masa",
  MANTENIMIENTO: "Mantenimiento",
  PATOLOGIA: "Patología",
  DEPORTIVO: "Rendimiento deportivo",
  OTRO: "Otro",
};

function calcularEdad(fecha: Date | string | null) {
  if (!fecha) return null;
  const f = new Date(fecha);
  const hoy = new Date();
  let edad = hoy.getFullYear() - f.getFullYear();
  const mes = hoy.getMonth() - f.getMonth();
  if (mes < 0 || (mes === 0 && hoy.getDate() < f.getDate())) edad--;
  return edad;
}

export default function NuevaCitaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pacientes, setPacientes] = useState<PacienteListItem[]>([]);
  const [pacienteId, setPacienteId] = useState("");
  const [contexto, setContexto] = useState<ContextoCita>(null);
  const [contextoLoading, setContextoLoading] = useState(false);

  useEffect(() => {
    getPacientesParaCita().then((data) =>
      setPacientes(data as PacienteListItem[]),
    );
  }, []);

  useEffect(() => {
    if (!pacienteId) {
      setContexto(null);
      return;
    }
    setContextoLoading(true);
    getPacienteContextoCita(pacienteId)
      .then((data) => setContexto(data))
      .finally(() => setContextoLoading(false));
  }, [pacienteId]);

  const pacienteSeleccionado = useMemo(
    () => pacientes.find((p) => p.id === pacienteId) ?? null,
    [pacientes, pacienteId],
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const form = new FormData(e.currentTarget);
    const fecha = form.get("fecha") as string;
    const hora = form.get("hora") as string;

    const modo = (form.get("modo") as "directa" | "proponer") || "directa";
    const isOnline = form.get("isOnline") === "on";

    try {
      await crearCita({
        pacienteId: form.get("pacienteId") as string,
        fechaHora: `${fecha}T${hora}:00`,
        duracion: parseInt(form.get("duracion") as string) || 30,
        motivo: (form.get("motivo") as string) || undefined,
        notas: (form.get("notas") as string) || undefined,
        isOnline,
        modo,
      });
      toast.success(
        modo === "proponer"
          ? "Propuesta enviada al paciente"
          : "Cita creada y confirmada",
      );
      router.push("/agenda");
    } catch (error) {
      if (error && typeof error === "object" && "digest" in error) throw error;
      toast.error("Error al crear la cita");
      setLoading(false);
    }
  }

  const edad = calcularEdad(pacienteSeleccionado?.fechaNacimiento ?? null);

  return (
    <div>
      <div className="mb-5 sm:mb-6">
        <Link
          href="/agenda"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3 py-2 sm:py-0 -my-2 sm:my-0"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a agenda
        </Link>
        <h1 className="text-2xl sm:text-3xl font-bold">Nueva cita</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Programa una nueva consulta para uno de tus pacientes.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(280px,360px)] gap-4 lg:gap-6 items-start">
        {/* Form principal */}
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6 min-w-0">
          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold inline-flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Paciente y horario
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Paciente *</label>
              <select
                name="pacienteId"
                required
                value={pacienteId}
                onChange={(e) => setPacienteId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="">Seleccionar paciente...</option>
                {pacientes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {capitalizarNombre(p.nombre)} {capitalizarNombre(p.apellidos)}
                  </option>
                ))}
              </select>
              {pacientes.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  No tienes pacientes activos.{" "}
                  <Link href="/pacientes/nuevo" className="text-primary hover:underline">
                    Crear paciente
                  </Link>
                </p>
              )}
            </div>
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Fecha *</label>
                <input
                  name="fecha"
                  type="date"
                  required
                  defaultValue={new Date().toISOString().split("T")[0]}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Hora *</label>
                <input
                  name="hora"
                  type="time"
                  required
                  defaultValue="10:00"
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Duración</label>
              <select
                name="duracion"
                defaultValue="30"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              >
                <option value="15">15 minutos</option>
                <option value="30">30 minutos</option>
                <option value="45">45 minutos</option>
                <option value="60">1 hora</option>
                <option value="90">1 hora y media</option>
                <option value="120">2 horas</option>
              </select>
            </div>

            <label className="flex items-start gap-3 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
              <input type="checkbox" name="isOnline" className="mt-1 accent-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium inline-flex items-center gap-2">
                  <Video className="w-4 h-4 text-primary" />
                  Cita online (Google Meet)
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Si tienes Google Calendar conectado, se generará automáticamente un enlace de Meet.
                </p>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-1.5">Cómo crear la cita</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <label className="relative flex items-start gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="radio" name="modo" value="directa" defaultChecked className="mt-1 accent-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Cita ya acordada</p>
                    <p className="text-xs text-muted-foreground">
                      Se crea confirmada directamente. Útil si ya la has acordado con el paciente por otro canal.
                    </p>
                  </div>
                </label>
                <label className="relative flex items-start gap-2 p-3 rounded-lg border border-border cursor-pointer hover:bg-muted/40 has-[:checked]:border-primary has-[:checked]:bg-primary/5 transition-colors">
                  <input type="radio" name="modo" value="proponer" className="mt-1 accent-primary" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium">Proponer al paciente</p>
                    <p className="text-xs text-muted-foreground">
                      Queda pendiente y el paciente recibe notificación para aceptar, contraponer o rechazar.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-4 sm:p-6 space-y-4">
            <h2 className="text-base sm:text-lg font-semibold inline-flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              Detalles
            </h2>
            <div>
              <label className="block text-sm font-medium mb-1.5">Motivo</label>
              <input
                name="motivo"
                maxLength={200}
                placeholder="Ej. Primera consulta, Revisión mensual…"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Notas internas</label>
              <textarea
                name="notas"
                rows={4}
                maxLength={2000}
                placeholder="Recordatorios, preparación previa, temas a tratar…"
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 text-sm resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Sólo visible para ti, no se comparten con el paciente.
              </p>
            </div>
          </section>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <Link
              href="/agenda"
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium min-h-11"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading || !pacienteId}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium disabled:opacity-50 min-h-11"
            >
              {loading ? "Creando…" : "Crear cita"}
            </button>
          </div>
        </form>

        {/* Sidebar derecha: preview paciente o tips */}
        <aside className="lg:sticky lg:top-4 space-y-4">
          {pacienteSeleccionado ? (
            <>
              <section className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-center gap-3 mb-4">
                  <AvatarPaciente
                    nombre={pacienteSeleccionado.nombre}
                    apellidos={pacienteSeleccionado.apellidos}
                    fotoUrl={pacienteSeleccionado.fotoUrl}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-base leading-tight truncate">
                      {capitalizarNombre(pacienteSeleccionado.nombre)}{" "}
                      {capitalizarNombre(pacienteSeleccionado.apellidos)}
                    </h3>
                    {edad != null && (
                      <p className="text-xs text-muted-foreground">{edad} años</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  {pacienteSeleccionado.objetivo && (
                    <div className="inline-flex items-start gap-2 w-full">
                      <Target className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-muted-foreground">Objetivo</p>
                        <p className="font-medium text-sm leading-tight">
                          {pacienteSeleccionado.objetivoDetalle ||
                            OBJETIVO_LABELS[pacienteSeleccionado.objetivo] ||
                            pacienteSeleccionado.objetivo}
                        </p>
                      </div>
                    </div>
                  )}
                  {pacienteSeleccionado.email && (
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{pacienteSeleccionado.email}</span>
                    </div>
                  )}
                  {pacienteSeleccionado.telefono && (
                    <div className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3.5 h-3.5 shrink-0" />
                      <span>{pacienteSeleccionado.telefono}</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                  <Link
                    href={`/pacientes/${pacienteSeleccionado.id}`}
                    className="text-xs text-primary hover:underline"
                  >
                    Ver ficha completa →
                  </Link>
                </div>
              </section>

              {/* Contexto */}
              {contextoLoading ? (
                <section className="bg-card rounded-xl border border-border p-5 text-center text-xs text-muted-foreground">
                  Cargando información del paciente…
                </section>
              ) : (
                contexto && (
                  <section className="bg-card rounded-xl border border-border p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                      Contexto
                    </h3>

                    {contexto.proximaCita && (
                      <div className="flex items-start gap-2.5">
                        <CalendarCheck className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Próxima cita</p>
                          <p className="text-sm font-medium">
                            {formatDate(contexto.proximaCita.fechaHora)} ·{" "}
                            {new Date(contexto.proximaCita.fechaHora).toLocaleTimeString("es-ES", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                          {contexto.proximaCita.motivo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contexto.proximaCita.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.ultimaCita && (
                      <div className="flex items-start gap-2.5">
                        <CalendarX className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Última cita</p>
                          <p className="text-sm font-medium">
                            {formatDate(contexto.ultimaCita.fechaHora)}
                          </p>
                          {contexto.ultimaCita.motivo && (
                            <p className="text-xs text-muted-foreground truncate">
                              {contexto.ultimaCita.motivo}
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.planActivo && (
                      <div className="flex items-start gap-2.5">
                        <Utensils className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Dieta actual</p>
                          <p className="text-sm font-medium truncate">
                            {contexto.planActivo.nombre}
                          </p>
                          {contexto.planActivo.caloriasObjetivo && (
                            <p className="text-xs text-muted-foreground">
                              {contexto.planActivo.caloriasObjetivo} kcal/día
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    {contexto.ultimaMedida && (
                      <div className="flex items-start gap-2.5">
                        <Scale className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Última medida</p>
                          <p className="text-sm font-medium">
                            {contexto.ultimaMedida.peso != null
                              ? `${contexto.ultimaMedida.peso} kg`
                              : "—"}
                            {contexto.ultimaMedida.imc != null &&
                              ` · IMC ${contexto.ultimaMedida.imc}`}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatDate(contexto.ultimaMedida.fecha)}
                          </p>
                        </div>
                      </div>
                    )}

                    {!contexto.proximaCita &&
                      !contexto.ultimaCita &&
                      !contexto.planActivo &&
                      !contexto.ultimaMedida && (
                        <p className="text-xs text-muted-foreground italic">
                          Sin historial registrado todavía.
                        </p>
                      )}
                  </section>
                )
              )}
            </>
          ) : (
            // Sin paciente seleccionado: tips + atajos
            <>
              <section className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-base mb-3 inline-flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                  Cómo crear una cita útil
                </h3>
                <ul className="space-y-2.5 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      <strong className="text-foreground">Selecciona el paciente</strong> y verás aquí su perfil, dieta activa y última medida.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      Reserva <strong className="text-foreground">30-45 min</strong> para revisiones y <strong className="text-foreground">60 min</strong> para primera consulta.
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">·</span>
                    <span>
                      Anota en <strong className="text-foreground">Notas</strong> los temas a tratar para no olvidarlos durante la sesión.
                    </span>
                  </li>
                </ul>
              </section>

              <section className="bg-card rounded-xl border border-border p-5">
                <h3 className="font-semibold text-base mb-3 inline-flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" />
                  Atajos
                </h3>
                <div className="space-y-2">
                  <Link
                    href="/agenda/horario"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Configurar horario laboral
                  </Link>
                  <Link
                    href="/agenda"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Ver agenda completa
                  </Link>
                  <Link
                    href="/pacientes"
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5"
                  >
                    <User className="w-3.5 h-3.5" />
                    Ver mis pacientes
                  </Link>
                </div>
              </section>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
