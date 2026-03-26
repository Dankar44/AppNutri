"use client";

import Link from "next/link";
import {
  BookOpen,
  Calendar,
  Clock3,
  Heart,
  Mail,
  NotebookText,
  Phone,
  Pill,
  Ruler,
  Scale,
  Shield,
  Stethoscope,
  Target,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import type { HorarioEntry } from "@/app/actions/pacientes";
import { HorarioSemanal } from "@/components/horario-semanal";
import { RecomendacionesCard } from "@/components/recomendaciones-card";

type PacienteGeneral = {
  id: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  sexo: string | null;
  peso: number | null;
  altura: number | null;
  objetivo: string | null;
  objetivoDetalle: string | null;
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  medicamentos: string[];
  suplementos: string[];
};

type PlanResumen = {
  id: string;
  nombre: string;
  caloriasObjetivo: number | null;
  createdAt: string;
  activo: boolean;
};

function renderObjetivo(objetivo: string | null, detalle: string | null) {
  if (detalle?.trim()) return detalle;
  if (!objetivo) return "No registrado";

  const labels: Record<string, string> = {
    PERDER_PESO: "Perdida de peso",
    GANAR_MASA: "Ganar masa",
    MANTENIMIENTO: "Mantenimiento",
    PATOLOGIA: "Patologia",
    DEPORTIVO: "Deportivo",
    OTRO: "Otro",
  };

  return labels[objetivo] ?? objetivo;
}

function renderLista(items: string[]) {
  return items.length > 0 ? items.join(", ") : "Ninguna registrada";
}

export function PacienteFichaGeneralTab({
  paciente,
  horario,
  recomendaciones,
  planes,
}: {
  paciente: PacienteGeneral;
  horario: HorarioEntry[];
  recomendaciones: string;
  planes: PlanResumen[];
}) {
  const planesOrdenados = [...planes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const previewPlanes = planesOrdenados.slice(0, 3);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[2fr_1fr] gap-5 items-start">
      <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <UserRound className="w-5 h-5 text-green-600" />
          Datos personales
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </p>
            <p className="font-medium">{paciente.email || "No registrado"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Teléfono
            </p>
            <p className="font-medium">{paciente.telefono || "No registrado"}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Fecha nacimiento
            </p>
            <p className="font-medium">
              {paciente.fechaNacimiento ? formatDate(paciente.fechaNacimiento) : "No registrada"}
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <UserRound className="w-4 h-4" />
              Sexo
            </p>
            <p className="font-medium">{paciente.sexo || "No registrado"}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Heart className="w-5 h-5 text-rose-500" />
          Historial médico
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Alergias
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.alergias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Stethoscope className="w-4 h-4" />
              Intolerancias
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.intolerancias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Heart className="w-4 h-4" />
              Patologías
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.patologias)}</p>
          </div>
          <div>
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Medicamentos
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.medicamentos)}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-muted-foreground inline-flex items-center gap-2">
              <Pill className="w-4 h-4" />
              Suplementos
            </p>
            <p className="font-medium mt-1">{renderLista(paciente.suplementos)}</p>
          </div>
        </div>
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-2 inline-flex items-center gap-2">
          <Clock3 className="w-5 h-5 text-indigo-500" />
          Horario semanal
        </h3>
        <p className="text-sm text-muted-foreground mb-3">
          Horario compartido con el paciente. Haz clic en una celda para añadir una actividad.
        </p>
        <HorarioSemanal initialEntries={horario} readOnly onSave={async () => {}} />
      </section>
      <section className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
            <UtensilsCrossed className="w-5 h-5 text-green-600" />
            Planes alimenticios
          </h3>
          <Link
            href={`/dietas/nuevo?pacienteId=${paciente.id}`}
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
          >
            + Nuevo plan
          </Link>
        </div>

        <div className="space-y-2">
          {previewPlanes.map((plan) => (
            <Link
              key={plan.id}
              href={`/dietas/${plan.id}`}
              className="flex items-center justify-between rounded-xl border border-border px-4 py-3 hover:bg-muted/40"
            >
              <div>
                <p className="font-medium">{plan.nombre}</p>
                <p className="text-sm text-muted-foreground">{formatDate(plan.createdAt)}</p>
              </div>
              {plan.caloriasObjetivo != null && (
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-sm font-medium text-amber-700">
                  {plan.caloriasObjetivo} kcal
                </span>
              )}
            </Link>
          ))}
        </div>

        {planesOrdenados.length > 0 && (
          <Link
            href={`/pacientes/${paciente.id}?pestana=plan-alimentacion`}
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border border-border px-3 py-2 text-base font-medium text-primary hover:bg-muted/50"
          >
            Ver todos los planes ({planesOrdenados.length})
          </Link>
        )}
      </section>
      </div>

      <div className="space-y-5">
      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          Objetivo
        </h3>
        <div className="w-full rounded-lg bg-sidebar-accent px-3 py-2.5 text-sidebar-foreground font-semibold flex items-center justify-center text-center">
          {renderObjetivo(paciente.objetivo, paciente.objetivoDetalle)}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-5 space-y-4">
        <h3 className="text-2xl font-semibold inline-flex items-center gap-2">
          <Ruler className="w-5 h-5 text-blue-500" />
          Medidas
        </h3>
        <div className="text-sm space-y-2">
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Scale className="w-4 h-4" />
              Peso
            </span>
            <span className="font-medium">{paciente.peso != null ? `${paciente.peso} kg` : "-"}</span>
          </p>
          <p className="flex items-center justify-between">
            <span className="text-muted-foreground inline-flex items-center gap-2">
              <Ruler className="w-4 h-4" />
              Altura
            </span>
            <span className="font-medium">{paciente.altura != null ? `${paciente.altura} cm` : "-"}</span>
          </p>
        </div>
        <Link
          href={`/pacientes/${paciente.id}?pestana=mediciones`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver evolución y registrar medidas
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4">Consultas</h3>
        <Link
          href={`/pacientes/${paciente.id}?pestana=seguimiento`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver historial de consultas
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          Diario alimentario
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/diario`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Ver diario del paciente
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-5">
        <h3 className="text-2xl font-semibold mb-4 inline-flex items-center gap-2">
          <Shield className="w-5 h-5 text-violet-500" />
          Portal del paciente
        </h3>
        <Link
          href={`/pacientes/${paciente.id}/portal`}
          className="inline-flex w-full items-center justify-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          Configurar acceso al portal
        </Link>
      </section>

      <div>
        <RecomendacionesCard pacienteId={paciente.id} initialText={recomendaciones} />
      </div>
      </div>
    </div>
  );
}
