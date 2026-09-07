"use client";

import { Target, Lock } from "lucide-react";
import { useTranslations } from "next-intl";
import { PlanificacionPorDefectoTab } from "@/components/paciente/planificacion-por-defecto-tab";
import type { MedidaSerializada } from "@/components/paciente/paciente-ficha-mediciones-tab";
import type { FichaInformacionData } from "@/lib/ficha-informacion-types";
import type { Planificacion } from "@/app/actions/planificaciones";
import type { PacienteCongelado, PlanificacionCongelada } from "@/lib/entrega-congelada";

/**
 * #40 — La planificación del alumno, EXACTAMENTE con la misma pestaña que ve él o el nutricionista
 * (Guillermo, 3 sep 2026: "no tiene que haber ningún resumen, tiene que verlo tal cual").
 *
 * Se pinta la pestaña de siempre con los datos de la entrega y se bloquea entera con `inert`: no
 * se puede pulsar ni escribir nada, así que ninguno de sus botones (guardar, crear, aplicar
 * objetivos) llega a llamar al servidor. La pestaña no guarda nada sola: solo al pulsar.
 */
export function PlanificacionDelAlumno({
  paciente,
  planificaciones,
  medidas,
  fichaInformacion,
}: {
  paciente: PacienteCongelado;
  planificaciones: PlanificacionCongelada[];
  medidas: unknown[];
  fichaInformacion: unknown | null;
}) {
  const t = useTranslations("casos");
  const planis: Planificacion[] = planificaciones.map((p) => ({
    id: p.id,
    pacienteId: paciente.id,
    nombre: p.nombre,
    estado: p.estado,
    esDefecto: p.esDefecto,
    // Las fechas van en la foto desde el 7 sep 2026; las entregas viejas no las tienen.
    fechaInicio: p.fechaInicio ?? "",
    fechaUltimoCambio: p.fechaUltimoCambio ?? "",
    fechaFinPrevista: p.fechaFinPrevista ?? null,
    datos: p.datos,
    origenId: p.origenId ?? null,
  }));

  return (
    <section className="py-4 lg:px-6 lg:py-6 lg:border lg:border-border lg:rounded-xl lg:bg-card">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="font-semibold inline-flex items-center gap-2">
          <Target className="w-4 h-4 text-muted-foreground" />
          {t("planificacion.titulo")}
        </h2>
        <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
          <Lock className="w-3.5 h-3.5" />
          {t("planificacion.talCual")}
        </span>
      </div>
      {planis.length === 0 ? (
        <p className="text-sm text-muted-foreground mt-2">{t("planificacion.ninguna")}</p>
      ) : (
        <div inert className="mt-3 select-none">
          <PlanificacionPorDefectoTab
            paciente={{
              nombre: paciente.nombre,
              apellidos: paciente.apellidos,
              fechaNacimiento: paciente.fechaNacimiento,
              sexo: paciente.sexo,
              peso: paciente.peso,
              altura: paciente.altura,
              objetivoDetalle: paciente.objetivoDetalle,
              createdAt: paciente.createdAt,
            }}
            medidas={medidas as MedidaSerializada[]}
            ficha={(fichaInformacion ?? null) as FichaInformacionData | null}
            planificaciones={planis}
            pacienteId={paciente.id}
          />
        </div>
      )}
    </section>
  );
}
