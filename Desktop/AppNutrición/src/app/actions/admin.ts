"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, verifyAdminCredentials, createAdminSession, clearAdminSession } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function loginAdmin(email: string, password: string): Promise<{ error?: string }> {
  if (!verifyAdminCredentials(email, password)) {
    return { error: "Email o contraseña incorrectos" };
  }
  await createAdminSession(email);
  redirect("/admin");
}

export async function logoutAdmin() {
  await clearAdminSession();
  redirect("/admin-login");
}

export async function getAdminStats() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const ahora = new Date();
  const inicioMesActual = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
  const inicioMesAnterior = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1);

  const [
    totalDietistas,
    totalPacientes,
    totalPlanes,
    totalConsultas,
    dietistasEsteMes,
    dietistasMesAnterior,
    pacientesEsteMes,
    pacientesMesAnterior,
  ] = await Promise.all([
    prisma.dietista.count(),
    prisma.paciente.count(),
    prisma.planAlimenticio.count({ where: { activo: true } }),
    prisma.consulta.count({ where: { fecha: { gte: inicioMesActual } } }),
    prisma.dietista.count({ where: { createdAt: { gte: inicioMesActual } } }),
    prisma.dietista.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
    prisma.paciente.count({ where: { createdAt: { gte: inicioMesActual } } }),
    prisma.paciente.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
  ]);

  const cambioDietistas = dietistasMesAnterior > 0
    ? Math.round(((dietistasEsteMes - dietistasMesAnterior) / dietistasMesAnterior) * 100)
    : dietistasEsteMes > 0 ? 100 : 0;

  const cambioPacientes = pacientesMesAnterior > 0
    ? Math.round(((pacientesEsteMes - pacientesMesAnterior) / pacientesMesAnterior) * 100)
    : pacientesEsteMes > 0 ? 100 : 0;

  return {
    totalDietistas,
    totalPacientes,
    totalPlanes,
    totalConsultas,
    dietistasEsteMes,
    cambioDietistas,
    pacientesEsteMes,
    cambioPacientes,
  };
}

export async function getRegistrosMensuales() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const ahora = new Date();
  const inicio6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

  const [dietistas, pacientes] = await Promise.all([
    prisma.dietista.findMany({
      where: { createdAt: { gte: inicio6Meses } },
      select: { createdAt: true },
    }),
    prisma.paciente.findMany({
      where: { createdAt: { gte: inicio6Meses } },
      select: { createdAt: true },
    }),
  ]);

  const meses: { mes: string; dietistas: number; pacientes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });

    meses.push({
      mes: label,
      dietistas: dietistas.filter((x) => new Date(x.createdAt) >= d && new Date(x.createdAt) < fin).length,
      pacientes: pacientes.filter((x) => new Date(x.createdAt) >= d && new Date(x.createdAt) < fin).length,
    });
  }

  return meses;
}

export async function getDistribucionPlanes() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  try {
    const suscripciones = await prisma.$queryRawUnsafe<{ plan: string; estado: string }[]>(
      `SELECT plan, estado FROM suscripciones`
    );

    const porPlan: Record<string, number> = {};
    const porEstado: Record<string, number> = {};

    for (const s of suscripciones) {
      porPlan[s.plan] = (porPlan[s.plan] || 0) + 1;
      porEstado[s.estado] = (porEstado[s.estado] || 0) + 1;
    }

    return { porPlan, porEstado, total: suscripciones.length };
  } catch {
    return { porPlan: {}, porEstado: {}, total: 0 };
  }
}

export interface PacienteResumen {
  id: string;
  nombre: string;
  apellidos: string;
  email: string | null;
  activo: boolean;
  objetivo: string;
  createdAt: Date;
}

export interface DietistaAdminItem {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  especialidad: string | null;
  clinica: string | null;
  createdAt: Date;
  suscripcion: { plan: string; estado: string } | null;
  _count: { pacientes: number; planes: number; consultas: number; recetas: number };
  pacientes: PacienteResumen[];
}

export async function getDietistasAdmin(busqueda?: string): Promise<DietistaAdminItem[]> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const search = busqueda?.trim().toLowerCase();

  const dietistas = await prisma.dietista.findMany({
    where: search
      ? {
          OR: [
            { nombre: { contains: search, mode: "insensitive" } },
            { apellidos: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : undefined,
    select: {
      id: true,
      email: true,
      nombre: true,
      apellidos: true,
      especialidad: true,
      clinica: true,
      createdAt: true,
      _count: {
        select: { pacientes: true, planes: true, consultas: true, recetas: true },
      },
      pacientes: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          email: true,
          activo: true,
          objetivo: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Obtener suscripciones por separado (raw SQL porque el modelo no está generado)
  const suscMap: Record<string, { plan: string; estado: string }> = {};
  try {
    const rows = await prisma.$queryRawUnsafe<{ dietistaId: string; plan: string; estado: string }[]>(
      `SELECT "dietistaId", plan, estado FROM suscripciones`
    );
    for (const r of rows) {
      suscMap[r.dietistaId] = { plan: r.plan, estado: r.estado };
    }
  } catch { /* tabla puede no existir */ }

  return dietistas.map((d) => ({
    ...d,
    suscripcion: suscMap[d.id] || null,
  }));
}

export interface DietistaDetalle {
  id: string;
  email: string;
  nombre: string;
  apellidos: string;
  telefono: string | null;
  especialidad: string | null;
  numColegiado: string | null;
  clinica: string | null;
  logoUrl: string | null;
  createdAt: Date;
  suscripcion: { plan: string; estado: string; fechaInicio: Date; fechaFin: Date | null } | null;
  pacientes: {
    id: string;
    nombre: string;
    apellidos: string;
    email: string | null;
    objetivo: string;
    activo: boolean;
    createdAt: Date;
    _count: { planes: number; consultas: number; medidas: number };
  }[];
  _count: { pacientes: number; planes: number; consultas: number; recetas: number; alimentos: number; citas: number };
  ultimasConsultas: {
    id: string;
    fecha: Date;
    motivo: string | null;
    paciente: { nombre: string; apellidos: string };
  }[];
}

export async function getDietistaDetalle(dietistaId: string): Promise<DietistaDetalle | null> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const dietista = await prisma.dietista.findUnique({
    where: { id: dietistaId },
    include: {
      pacientes: {
        select: {
          id: true,
          nombre: true,
          apellidos: true,
          email: true,
          objetivo: true,
          activo: true,
          createdAt: true,
          _count: { select: { planes: true, consultas: true, medidas: true } },
        },
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: {
          pacientes: true,
          planes: true,
          consultas: true,
          recetas: true,
          alimentos: true,
          citas: true,
        },
      },
    },
  });

  if (!dietista) return null;

  // Suscripción por raw SQL
  let suscripcion: DietistaDetalle["suscripcion"] = null;
  try {
    const rows = await prisma.$queryRawUnsafe<{ plan: string; estado: string; fechaInicio: Date; fechaFin: Date | null }[]>(
      `SELECT plan, estado, "fechaInicio", "fechaFin" FROM suscripciones WHERE "dietistaId" = $1 LIMIT 1`,
      dietistaId
    );
    if (rows.length > 0) suscripcion = rows[0];
  } catch { /* tabla puede no existir */ }

  const ultimasConsultas = await prisma.consulta.findMany({
    where: { dietistaId },
    orderBy: { fecha: "desc" },
    take: 5,
    include: { paciente: { select: { nombre: true, apellidos: true } } },
  });

  return { ...dietista, suscripcion, ultimasConsultas } as DietistaDetalle;
}

export async function getActividadGlobal() {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const ahora = new Date();
  const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const inicioSemana = new Date(ahora);
  const day = inicioSemana.getDay();
  inicioSemana.setDate(inicioSemana.getDate() - day + (day === 0 ? -6 : 1));
  inicioSemana.setHours(0, 0, 0, 0);
  const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

  const [
    consultasHoy,
    citasHoy,
    diarioHoy,
    consultasMes,
    generacionesIA,
    ultimosDietistas,
    dietistasActivos,
  ] = await Promise.all([
    prisma.consulta.count({ where: { fecha: { gte: hoy } } }),
    prisma.cita.count({ where: { fechaHora: { gte: hoy } } }),
    prisma.entradaDiario.count({ where: { createdAt: { gte: hoy } } }),
    prisma.consulta.count({ where: { fecha: { gte: inicioMes } } }),
    prisma.generacionIA.count({ where: { createdAt: { gte: inicioMes } } }),
    prisma.dietista.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: { id: true, nombre: true, apellidos: true, email: true, createdAt: true },
    }),
    prisma.dietista.findMany({
      select: {
        id: true,
        nombre: true,
        apellidos: true,
        _count: {
          select: {
            consultas: { where: { fecha: { gte: inicioMes } } },
            pacientes: true,
          },
        },
      },
      orderBy: { consultas: { _count: "desc" } },
      take: 10,
    }),
  ]);

  return {
    consultasHoy,
    citasHoy,
    diarioHoy,
    consultasMes,
    generacionesIA,
    ultimosDietistas,
    dietistasActivos: dietistasActivos.map((d) => ({
      id: d.id,
      nombre: `${d.nombre} ${d.apellidos}`,
      consultasMes: d._count.consultas,
      totalPacientes: d._count.pacientes,
    })),
  };
}

export interface SuscripcionAdminItem {
  id: string;
  plan: string;
  estado: string;
  fechaInicio: Date;
  fechaFin: Date | null;
  dietista: { nombre: string; apellidos: string; email: string };
}

export async function getSuscripcionesAdmin(): Promise<SuscripcionAdminItem[]> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  try {
    const rows = await prisma.$queryRawUnsafe<{
      id: string;
      dietistaId: string;
      plan: string;
      estado: string;
      fechaInicio: Date;
      fechaFin: Date | null;
    }[]>(
      `SELECT id, "dietistaId", plan, estado, "fechaInicio", "fechaFin" FROM suscripciones ORDER BY "createdAt" DESC`
    );

    const dietistaIds = rows.map((r) => r.dietistaId);
    const dietistas = await prisma.dietista.findMany({
      where: { id: { in: dietistaIds } },
      select: { id: true, nombre: true, apellidos: true, email: true },
    });
    const dietistaMap = Object.fromEntries(dietistas.map((d) => [d.id, d]));

    return rows.map((r) => ({
      id: r.id,
      plan: r.plan,
      estado: r.estado,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      dietista: dietistaMap[r.dietistaId] || { nombre: "?", apellidos: "", email: "" },
    }));
  } catch {
    return [];
  }
}

// ─── Verificaciones ───

export interface DietistaPendiente {
  id: string;
  nombre: string;
  apellidos: string;
  email: string;
  numColegiado: string | null;
  especialidad: string | null;
  createdAt: Date;
}

export async function getDietistasPendientes(): Promise<DietistaPendiente[]> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  return prisma.$queryRawUnsafe<DietistaPendiente[]>(
    `SELECT id, nombre, apellidos, email, "numColegiado", especialidad, "createdAt"
     FROM dietistas WHERE verificado = false ORDER BY "createdAt" DESC`
  );
}

export async function getPendientesCount(): Promise<number> {
  const admin = await requireAdmin();
  if (!admin) return 0;

  const rows = await prisma.$queryRawUnsafe<{ count: bigint }[]>(
    `SELECT COUNT(*) as count FROM dietistas WHERE verificado = false`
  );
  return Number(rows[0]?.count ?? 0);
}

export async function verificarDietista(dietistaId: string) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  await prisma.$queryRawUnsafe(
    `UPDATE dietistas SET verificado = true WHERE id = $1`, dietistaId
  );

  revalidatePath("/admin/verificaciones");
  revalidatePath("/admin");
}

export async function rechazarDietista(dietistaId: string) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  await prisma.dietista.delete({ where: { id: dietistaId } });

  revalidatePath("/admin/verificaciones");
  revalidatePath("/admin");
}
