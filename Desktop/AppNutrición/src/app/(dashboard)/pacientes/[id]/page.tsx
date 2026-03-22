import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Phone,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Target,
  Heart,
  AlertTriangle,
  Pill,
  Apple,
  UtensilsCrossed,
  FileText,
  Shield,
  BookOpen,
  TrendingUp,
  Dumbbell,
  Clock,
  Briefcase,
  Moon,
  Sparkles,
} from "lucide-react";
import { getPaciente, getHorarioPaciente, getRecomendaciones } from "@/app/actions/pacientes";
import { HorarioDietistaWrapper } from "@/components/horario-dietista-wrapper";
import { RecomendacionesCard } from "@/components/recomendaciones-card";
import { MedidasRapidas } from "@/components/medidas-rapidas";
import { getPlanesPaciente } from "@/app/actions/planes";
import { getMedidasEvolucion } from "@/app/actions/medidas";
import {
  formatDate,
  calcularEdad,
  calcularIMC,
  capitalizarNombre,
  OBJETIVO_LABELS,
} from "@/lib/utils";
import { PacienteActions } from "./paciente-actions";
import { EvolucionMiniChart } from "./evolucion-mini-chart";
import { AvatarPaciente } from "@/components/avatar-paciente";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PacienteDetailPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

  const [planes, medidas, horarioEntries, recomendacionesText] = await Promise.all([
    getPlanesPaciente(id),
    getMedidasEvolucion(id),
    getHorarioPaciente(id),
    getRecomendaciones(id),
  ]);

  const nombre = capitalizarNombre(paciente.nombre);
  const apellidos = capitalizarNombre(paciente.apellidos);

  const chartData = medidas.map((m) => ({
    fecha: new Date(m.fecha).toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
    peso: m.peso,
    imc: m.imc,
    grasa: m.grasaCorporal,
    cintura: m.perimetroCintura,
  }));

  const edad = paciente.fechaNacimiento
    ? calcularEdad(new Date(paciente.fechaNacimiento))
    : null;
  const imc =
    paciente.peso && paciente.altura
      ? calcularIMC(paciente.peso, paciente.altura)
      : null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/pacientes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a pacientes
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <AvatarPaciente nombre={nombre} apellidos={apellidos} fotoUrl={paciente.fotoUrl} size="lg" />
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">
                {nombre} {apellidos}
              </h1>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                    paciente.activo
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {paciente.activo ? "Activo" : "Inactivo"}
                </span>
                <span className="text-sm text-muted-foreground">
                  Alta: {formatDate(paciente.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <Pencil className="w-4 h-4" />
              <span className="hidden sm:inline">Editar</span>
            </Link>
            <PacienteActions
              pacienteId={paciente.id}
              activo={paciente.activo}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda */}
        <div className="lg:col-span-2 space-y-6">
          {/* Datos personales */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Datos personales
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <InfoItem
                icon={Mail}
                label="Email"
                value={paciente.email || "No registrado"}
              />
              <InfoItem
                icon={Phone}
                label="Teléfono"
                value={paciente.telefono || "No registrado"}
              />
              <InfoItem
                icon={Calendar}
                label="Fecha nacimiento"
                value={
                  paciente.fechaNacimiento
                    ? `${formatDate(paciente.fechaNacimiento)} (${edad} años)`
                    : "No registrada"
                }
              />
              <InfoItem
                icon={User}
                label="Sexo"
                value={
                  paciente.sexo
                    ? paciente.sexo.charAt(0) +
                      paciente.sexo.slice(1).toLowerCase()
                    : "No registrado"
                }
              />
            </div>
          </section>

          {/* Historial médico */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-500" />
              Historial médico
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <TagList
                icon={AlertTriangle}
                label="Alergias"
                tags={paciente.alergias}
                colorClass="bg-red-50 text-red-700"
              />
              <TagList
                icon={AlertTriangle}
                label="Intolerancias"
                tags={paciente.intolerancias}
                colorClass="bg-orange-50 text-orange-700"
              />
              <TagList
                icon={Heart}
                label="Patologías"
                tags={paciente.patologias}
                colorClass="bg-purple-50 text-purple-700"
              />
              <TagList
                icon={Pill}
                label="Medicamentos"
                tags={paciente.medicamentos}
                colorClass="bg-blue-50 text-blue-700"
              />
              <TagList
                icon={Sparkles}
                label="Suplementos"
                tags={(paciente as Record<string, unknown>).suplementos as string[] || []}
                colorClass="bg-cyan-50 text-cyan-700"
              />
            </div>
          </section>

          {/* Actividad física y estilo de vida */}
          {(() => {
            const p = paciente as Record<string, unknown>;
            const hasData = p.nivelActividad || p.frecuenciaEjercicio || p.tipoEjercicio || p.horarioTrabajo || p.horarioEjercicio || p.horasDescanso || p.ocupacion;
            if (!hasData) return null;

            const NIVEL_LABELS: Record<string, string> = {
              SEDENTARIO: "Sedentario",
              LIGERO: "Ligero (1-2 días/sem)",
              MODERADO: "Moderado (3-4 días/sem)",
              ACTIVO: "Activo (5-6 días/sem)",
              MUY_ACTIVO: "Muy activo (diario)",
            };

            return (
              <section className="bg-card rounded-xl border border-border p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Dumbbell className="w-5 h-5 text-indigo-500" />
                  Actividad física y estilo de vida
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  {[
                    { val: p.ocupacion, icon: Briefcase, label: "Ocupación" },
                    { val: p.nivelActividad, icon: Dumbbell, label: "Nivel de actividad", transform: (v: string) => NIVEL_LABELS[v] || v },
                    { val: p.frecuenciaEjercicio, icon: Calendar, label: "Frecuencia" },
                    { val: p.tipoEjercicio, icon: Target, label: "Tipo de ejercicio" },
                    { val: p.horarioTrabajo, icon: Clock, label: "Horario de trabajo" },
                    { val: p.horarioEjercicio, icon: Clock, label: "Horario de ejercicio" },
                    { val: p.horasDescanso, icon: Moon, label: "Descanso" },
                  ].filter((item) => !!item.val).map((item) => (
                    <div key={item.label} className="flex items-start gap-2">
                      <item.icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <span className="text-muted-foreground">{item.label}</span>
                        <p className="font-medium">{item.transform ? item.transform(String(item.val)) : String(item.val)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            );
          })()}

          {/* Preferencias */}
          {paciente.preferencias.length > 0 && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Apple className="w-5 h-5 text-green-600" />
                Preferencias alimentarias
              </h2>
              <div className="flex flex-wrap gap-2">
                {paciente.preferencias.map((pref) => (
                  <span
                    key={pref}
                    className="px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium"
                  >
                    {pref}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Notas */}
          {paciente.notas && (
            <section className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold mb-3">Notas</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">
                {paciente.notas}
              </p>
            </section>
          )}

          {/* Horario semanal */}
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              Horario semanal
            </h2>
            <p className="text-sm text-muted-foreground mb-4">
              Horario compartido con el paciente. Haz clic en una celda para añadir una actividad.
            </p>
            <HorarioDietistaWrapper pacienteId={paciente.id} initialEntries={horarioEntries} />
          </section>

          {/* Evolución del paciente */}
          <section className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Evolución
              </h2>
              <Link
                href={`/pacientes/${paciente.id}/medidas`}
                className="text-xs text-primary hover:underline"
              >
                Ver todo + registrar
              </Link>
            </div>
            {chartData.length >= 2 ? (
              <EvolucionMiniChart data={chartData} />
            ) : (
              <p className="text-sm text-muted-foreground text-center py-6">
                {chartData.length === 0
                  ? "Sin medidas registradas"
                  : "Se necesitan al menos 2 medidas para mostrar la gráfica"}
              </p>
            )}
          </section>

          {/* Planes alimenticios */}
          <section className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                Planes alimenticios
              </h2>
              <Link
                href={`/dietas/nuevo`}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-xs font-medium"
              >
                + Nuevo plan
              </Link>
            </div>
            {planes.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay planes alimenticios para este paciente
              </p>
            ) : (
              <div className="space-y-2">
                {planes.slice(0, 3).map((plan) => (
                  <Link
                    key={plan.id}
                    href={`/dietas/${plan.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{plan.nombre}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(plan.createdAt)}
                      </p>
                    </div>
                    {plan.caloriasObjetivo && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-medium">
                        {plan.caloriasObjetivo} kcal
                      </span>
                    )}
                  </Link>
                ))}
                {planes.length > 3 && (
                  <Link
                    href="/dietas"
                    className="block text-center py-2.5 rounded-lg border border-border hover:bg-muted/50 transition-colors text-sm text-primary font-medium"
                  >
                    Ver todos los planes ({planes.length})
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Columna derecha: resumen rápido */}
        <div className="space-y-6">
          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-primary" />
              Objetivo
            </h2>
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-primary">
                  {OBJETIVO_LABELS[paciente.objetivo] || paciente.objetivo}
                </p>
                {paciente.objetivoDetalle && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {paciente.objetivoDetalle}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-blue-600" />
              Medidas
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Peso</span>
                <span className="font-medium">
                  {paciente.peso ? `${paciente.peso} kg` : "-"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Altura</span>
                <span className="font-medium">
                  {paciente.altura ? `${paciente.altura} cm` : "-"}
                </span>
              </div>
              {imc && (
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-sm text-muted-foreground">IMC</span>
                  <span className="font-bold text-lg">{imc}</span>
                </div>
              )}
              <Link
                href={`/pacientes/${paciente.id}/medidas`}
                className="block mt-3 text-center text-xs text-primary hover:underline"
              >
                Ver evolución y registrar medidas
              </Link>
            </div>

            {/* Mini formulario rápido */}
            <MedidasRapidas pacienteId={paciente.id} />
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <FileText className="w-5 h-5 text-green-600" />
              Consultas
            </h2>
            <Link
              href={`/pacientes/${paciente.id}/consultas`}
              className="block text-center px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              Ver historial de consultas
            </Link>
          </section>

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Diario alimentario
            </h2>
            <Link
              href={`/pacientes/${paciente.id}/diario`}
              className="block text-center px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              Ver diario del paciente
            </Link>
          </section>

          <RecomendacionesCard pacienteId={paciente.id} initialText={recomendacionesText} />

          <section className="bg-card rounded-xl border border-border p-6">
            <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
              <Shield className="w-5 h-5 text-purple-600" />
              Portal del paciente
            </h2>
            <Link
              href={`/pacientes/${paciente.id}/portal`}
              className="block text-center px-3 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              Configurar acceso al portal
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}

function InfoItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

function TagList({
  icon: Icon,
  label,
  tags,
  colorClass,
}: {
  icon: React.ElementType;
  label: string;
  tags: string[];
  colorClass: string;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium">{label}</span>
      </div>
      {tags.length === 0 ? (
        <p className="text-sm text-muted-foreground">Ninguna registrada</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag) => (
            <span
              key={tag}
              className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
