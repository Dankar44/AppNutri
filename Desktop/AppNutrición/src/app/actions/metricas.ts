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

  // Calcular rango de 6 meses
  const ahora = new Date();
  const inicio6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

  // Para "pacientes totales" (acumulado hasta fin de mes) necesitamos TODOS
  // los pacientes del dietista, no solo los recientes.
  // Excluimos el paciente demo (nombre='Paciente' + apellidos='Prueba') para no
  // inflar la gráfica con datos de ejemplo.
  const [consultas, pacientes] = await Promise.all([
    prisma.consulta.findMany({
      where: { dietistaId: dietista.id, fecha: { gte: inicio6Meses } },
      select: { fecha: true },
    }),
    prisma.paciente.findMany({
      where: {
        dietistaId: dietista.id,
        NOT: { AND: [{ nombre: "Paciente" }, { apellidos: "Prueba" }] },
      },
      select: { createdAt: true },
    }),
  ]);

  // Agrupar en cliente
  const meses: { mes: string; consultas: number; pacientesTotales: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

    const consultasMes = consultas.filter((c) => {
      const f = new Date(c.fecha);
      return f >= d && f < fin;
    }).length;

    // Pacientes totales = acumulado hasta el fin del mes
    const pacientesTotales = pacientes.filter((p) => {
      return new Date(p.createdAt) < fin;
    }).length;

    meses.push({ mes: label, consultas: consultasMes, pacientesTotales });
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
