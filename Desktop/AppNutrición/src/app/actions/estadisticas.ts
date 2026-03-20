"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";

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
    prisma.paciente.count({ where: { dietistaId: dietista.id } }),
    prisma.paciente.count({ where: { dietistaId: dietista.id, activo: true } }),
    prisma.consulta.count({ where: { dietistaId: dietista.id } }),
    prisma.planAlimenticio.count({ where: { dietistaId: dietista.id } }),
    prisma.generacionIA.count({ where: { dietistaId: dietista.id, estado: "APLICADO" } }),
    prisma.accesoPaciente.count({
      where: { activo: true, paciente: { dietistaId: dietista.id } },
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

  const pacientes = await prisma.paciente.groupBy({
    by: ["objetivo"],
    where: { dietistaId: dietista.id },
    _count: true,
  });

  const labels: Record<string, string> = {
    PERDER_PESO: "Perder peso",
    GANAR_MASA: "Ganar masa",
    MANTENIMIENTO: "Mantenimiento",
    PATOLOGIA: "Patología",
    DEPORTIVO: "Deportivo",
    OTRO: "Otro",
  };

  return pacientes.map((p) => ({
    objetivo: labels[p.objetivo] || p.objetivo,
    cantidad: p._count,
  }));
}

export async function getConsultasPorMes() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const meses: { mes: string; consultas: number; pacientes: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = inicio.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

    const [consultas, pacientes] = await Promise.all([
      prisma.consulta.count({ where: { dietistaId: dietista.id, fecha: { gte: inicio, lt: fin } } }),
      prisma.paciente.count({ where: { dietistaId: dietista.id, createdAt: { gte: inicio, lt: fin } } }),
    ]);

    meses.push({ mes: label, consultas, pacientes });
  }

  return meses;
}
