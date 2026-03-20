"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";

export async function getMetricasDashboard() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const ahora = new Date();
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);
  const inicioSemana = new Date(ahora);
  inicioSemana.setDate(ahora.getDate() - ahora.getDay() + (ahora.getDay() === 0 ? -6 : 1));
  inicioSemana.setHours(0, 0, 0, 0);
  const finSemana = new Date(inicioSemana);
  finSemana.setDate(finSemana.getDate() + 7);

  const [
    totalPacientes,
    pacientesActivos,
    pacientesMesActual,
    pacientesMesAnterior,
    consultasMesActual,
    consultasMesAnterior,
    planesActivos,
    citasSemana,
  ] = await Promise.all([
    prisma.paciente.count({ where: { dietistaId: dietista.id } }),
    prisma.paciente.count({ where: { dietistaId: dietista.id, activo: true } }),
    prisma.paciente.count({ where: { dietistaId: dietista.id, createdAt: { gte: inicioMesActual } } }),
    prisma.paciente.count({ where: { dietistaId: dietista.id, createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
    prisma.consulta.count({ where: { dietistaId: dietista.id, fecha: { gte: inicioMesActual } } }),
    prisma.consulta.count({ where: { dietistaId: dietista.id, fecha: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
    prisma.planAlimenticio.count({ where: { dietistaId: dietista.id, activo: true } }),
    prisma.cita.count({ where: { dietistaId: dietista.id, fechaHora: { gte: inicioSemana, lt: finSemana } } }),
  ]);

  const cambioPacientes = pacientesMesAnterior > 0
    ? Math.round(((pacientesMesActual - pacientesMesAnterior) / pacientesMesAnterior) * 100)
    : pacientesMesActual > 0 ? 100 : 0;

  const cambioConsultas = consultasMesAnterior > 0
    ? Math.round(((consultasMesActual - consultasMesAnterior) / consultasMesAnterior) * 100)
    : consultasMesActual > 0 ? 100 : 0;

  return {
    totalPacientes,
    pacientesActivos,
    pacientesNuevosMes: pacientesMesActual,
    cambioPacientes,
    consultasMes: consultasMesActual,
    cambioConsultas,
    planesActivos,
    citasSemana,
  };
}

export async function getActividadMensual() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const meses: { mes: string; consultas: number; pacientesNuevos: number }[] = [];

  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(d.getMonth() - i);
    const inicio = new Date(d.getFullYear(), d.getMonth(), 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = inicio.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

    const [consultas, pacientesNuevos] = await Promise.all([
      prisma.consulta.count({ where: { dietistaId: dietista.id, fecha: { gte: inicio, lt: fin } } }),
      prisma.paciente.count({ where: { dietistaId: dietista.id, createdAt: { gte: inicio, lt: fin } } }),
    ]);

    meses.push({ mes: label, consultas, pacientesNuevos });
  }

  return meses;
}

export async function getPacientesAtencion() {
  const dietista = await getCurrentDietista();
  if (!dietista) return { sinConsulta: [], sinMedidas: [], planesAntiguos: [] };

  const hace30Dias = new Date();
  hace30Dias.setDate(hace30Dias.getDate() - 30);

  const pacientes = await prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      consultas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      medidas: { orderBy: { fecha: "desc" }, take: 1, select: { fecha: true } },
      planes: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
    },
  });

  const sinConsulta = pacientes
    .filter((p) => p.consultas.length === 0 || new Date(p.consultas[0].fecha) < hace30Dias)
    .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` }))
    .slice(0, 5);

  const sinMedidas = pacientes
    .filter((p) => p.medidas.length === 0 || new Date(p.medidas[0].fecha) < hace30Dias)
    .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` }))
    .slice(0, 5);

  const planesAntiguos = pacientes
    .filter((p) => p.planes.length > 0 && new Date(p.planes[0].updatedAt) < hace30Dias)
    .map((p) => ({ id: p.id, nombre: `${p.nombre} ${p.apellidos}` }))
    .slice(0, 5);

  return { sinConsulta, sinMedidas, planesAntiguos };
}
