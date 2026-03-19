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
} from "lucide-react";
import { getPaciente } from "@/app/actions/pacientes";
import {
  formatDate,
  calcularEdad,
  calcularIMC,
  OBJETIVO_LABELS,
} from "@/lib/utils";
import { PacienteActions } from "./paciente-actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PacienteDetailPage({ params }: Props) {
  const { id } = await params;
  const paciente = await getPaciente(id);
  if (!paciente) notFound();

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
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
              {paciente.nombre[0]}
              {paciente.apellidos[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold">
                {paciente.nombre} {paciente.apellidos}
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
          <div className="flex items-center gap-2">
            <Link
              href={`/pacientes/${paciente.id}/editar`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors text-sm font-medium"
            >
              <Pencil className="w-4 h-4" />
              Editar
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
            </div>
          </section>

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
            </div>
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
