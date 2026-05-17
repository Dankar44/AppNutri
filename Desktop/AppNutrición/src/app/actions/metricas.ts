"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";

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

  const locale = await getLocale();
  const tag = intlTag(locale);

  interface MesRow { mes_inicio: Date; consultas_mes: bigint; pacientes_acumulados: bigint }

  const rows = await prisma.$queryRaw<MesRow[]>`
    WITH meses AS (
      SELECT generate_series(
        date_trunc('month', NOW()) - '5 months'::interval,
        date_trunc('month', NOW()),
        '1 month'::interval
      )::date AS mes_inicio
    )
    SELECT
      m.mes_inicio,
      (SELECT COUNT(*) FROM consultas c
       WHERE c."dietistaId" = ${dietista.id}
         AND c.fecha >= m.mes_inicio
         AND c.fecha < (m.mes_inicio + '1 month'::interval)
      ) AS consultas_mes,
      (SELECT COUNT(*) FROM pacientes p
       WHERE p."dietistaId" = ${dietista.id}
         AND p."createdAt" < (m.mes_inicio + '1 month'::interval)
         AND NOT (p.nombre = 'Paciente' AND p.apellidos = 'Prueba')
      ) AS pacientes_acumulados
    FROM meses m
    ORDER BY m.mes_inicio
  `;

  return rows.map((r) => {
    const d = new Date(r.mes_inicio);
    return {
      mes: d.toLocaleDateString(tag, { month: "short", year: "2-digit" }),
      consultas: Number(r.consultas_mes),
      pacientesTotales: Number(r.pacientes_acumulados),
    };
  });
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
