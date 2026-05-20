"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getTranslations } from "next-intl/server";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";

export async function getEstadisticasDietista() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const [
    totalPacientes,
    pacientesActivos,
    totalConsultas,
    totalPlanes,
    planesIA,
    pacientesConPortal,
  ] = await Promise.all([
    prisma.paciente.count({ where: { dietistaId: dietista.id, esDemo: false } }),
    prisma.paciente.count({ where: { dietistaId: dietista.id, activo: true, esDemo: false } }),
    prisma.consulta.count({ where: { dietistaId: dietista.id, paciente: { esDemo: false } } }),
    prisma.planAlimenticio.count({ where: { dietistaId: dietista.id, paciente: { esDemo: false } } }),
    prisma.generacionIA.count({ where: { dietistaId: dietista.id, estado: "APLICADO" } }),
    prisma.accesoPaciente.count({
      where: { activo: true, paciente: { dietistaId: dietista.id, esDemo: false } },
    }),
  ]);

  const tasaRetencion = totalPacientes > 0
    ? Math.round((pacientesActivos / totalPacientes) * 100)
    : 0;
  const mediaConsultas = totalPacientes > 0
    ? Math.round((totalConsultas / totalPacientes) * 10) / 10
    : 0;

  return {
    totalPacientes,
    pacientesActivos,
    tasaRetencion,
    totalConsultas,
    mediaConsultas,
    totalPlanes,
    planesIA,
    planesManuales: totalPlanes - planesIA,
    pacientesConPortal,
  };
}

export async function getDistribucionObjetivos() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];
  const t = await getTranslations("validation");

  const pacientes = await prisma.paciente.groupBy({
    by: ["objetivo"],
    where: { dietistaId: dietista.id, esDemo: false },
    _count: true,
  });

  const labels: Record<string, string> = {
    PERDER_PESO: t("estadisticas.objetivos.perderPeso"),
    GANAR_MASA: t("estadisticas.objetivos.ganarMasa"),
    MANTENIMIENTO: t("estadisticas.objetivos.mantenimiento"),
    PATOLOGIA: t("estadisticas.objetivos.patologia"),
    DEPORTIVO: t("estadisticas.objetivos.deportivo"),
    OTRO: t("estadisticas.objetivos.otro"),
  };

  return pacientes.map((p) => ({
    objetivo: labels[p.objetivo] || p.objetivo,
    cantidad: p._count,
  }));
}

export async function getConsultasPorMes() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const locale = await getLocale();
  const tag = intlTag(locale);

  const meses: { mes: string; consultas: number; pacientes: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = inicio.toLocaleDateString(tag, { month: "short", year: "2-digit" });

    const [consultas, pacientes] = await Promise.all([
      prisma.consulta.count({ where: { dietistaId: dietista.id, fecha: { gte: inicio, lt: fin }, paciente: { esDemo: false } } }),
      prisma.paciente.count({ where: { dietistaId: dietista.id, createdAt: { gte: inicio, lt: fin }, esDemo: false } }),
    ]);

    meses.push({ mes: label, consultas, pacientes });
  }

  return meses;
}
