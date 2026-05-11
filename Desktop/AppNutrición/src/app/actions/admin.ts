"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, verifyAdminCredentials, createAdminSession, clearAdminSession } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  getFakeDietistas,
  getFakeDietistaDetalle,
  getFakeStats,
  getFakeRegistrosMensuales,
  getFakeDistribucion,
  getFakeSuscripciones,
  getFakeActividadDietistas,
  getFakeUltimosDietistas,
} from "@/lib/admin-fake-data";

export async function loginAdmin(email: string, password: string): Promise<{ error?: string }> {
  const result = verifyAdminCredentials(email, password);
  if (!result) {
    return { error: "Email o contraseña incorrectos" };
  }
  await createAdminSession(email, result.role);
  redirect(result.role === "creator" ? "/admin/crear-cuenta" : "/admin");
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

  const fake = getFakeStats();
  const tDietistas = totalDietistas + fake.dietistas;
  const tPacientes = totalPacientes + fake.pacientes;
  const tPlanes = totalPlanes + fake.planes;
  const tConsultas = totalConsultas + fake.consultas;
  const dEsteMes = dietistasEsteMes + fake.dietistasEsteMes;
  const dMesAnt = dietistasMesAnterior + fake.mesAnterior;
  const pEsteMes = pacientesEsteMes + fake.pacientesEsteMes;

  const cambioDietistas = dMesAnt > 0
    ? Math.round(((dEsteMes - dMesAnt) / dMesAnt) * 100)
    : dEsteMes > 0 ? 100 : 0;

  const cambioPacientes = pacientesMesAnterior > 0
    ? Math.round(((pEsteMes - pacientesMesAnterior) / pacientesMesAnterior) * 100)
    : pEsteMes > 0 ? 100 : 0;

  return {
    totalDietistas: tDietistas,
    totalPacientes: tPacientes,
    totalPlanes: tPlanes,
    totalConsultas: tConsultas,
    dietistasEsteMes: dEsteMes,
    cambioDietistas,
    pacientesEsteMes: pEsteMes,
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

  const fakeRegistros = getFakeRegistrosMensuales();
  for (const m of meses) {
    const match = fakeRegistros.find((f) => f.mes === m.mes);
    if (match) {
      m.dietistas += match.dietistas;
      m.pacientes += match.pacientes;
    }
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

    const fakeDist = getFakeDistribucion();
    for (const [k, v] of Object.entries(fakeDist.porPlan)) porPlan[k] = (porPlan[k] || 0) + v;
    for (const [k, v] of Object.entries(fakeDist.porEstado)) porEstado[k] = (porEstado[k] || 0) + v;

    return { porPlan, porEstado, total: suscripciones.length + fakeDist.total };
  } catch {
    const fakeDist = getFakeDistribucion();
    return { porPlan: fakeDist.porPlan, porEstado: fakeDist.porEstado, total: fakeDist.total };
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
  lastAccessAt: Date | null;
  lastSignIn: Date | null;
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
      authId: true,
      email: true,
      nombre: true,
      apellidos: true,
      especialidad: true,
      clinica: true,
      createdAt: true,
      lastAccessAt: true,
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

  const authIds = dietistas.map((d) => d.authId).filter(Boolean);
  const signInMap: Record<string, Date> = {};
  if (authIds.length > 0) {
    try {
      const signInRows = await prisma.$queryRawUnsafe<{ id: string; last_sign_in_at: Date | null }[]>(
        `SELECT id, last_sign_in_at FROM auth.users WHERE id = ANY($1::uuid[])`,
        authIds
      );
      for (const r of signInRows) {
        if (r.last_sign_in_at) signInMap[r.id] = r.last_sign_in_at;
      }
    } catch { /* auth schema might not be accessible */ }
  }

  const real: DietistaAdminItem[] = dietistas.map((d) => ({
    ...d,
    lastSignIn: (d.authId && signInMap[d.authId]) || null,
    suscripcion: suscMap[d.id] || null,
  }));

  const fake = getFakeDietistas(busqueda);
  return [...real, ...fake].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
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

  if (dietistaId.startsWith("fake-")) return getFakeDietistaDetalle(dietistaId);

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

  const fakeUltimos = getFakeUltimosDietistas();
  const fakeActivos = getFakeActividadDietistas();

  const mergedUltimos = [...ultimosDietistas, ...fakeUltimos]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 10);

  const realActivos = dietistasActivos.map((d) => ({
    id: d.id,
    nombre: `${d.nombre} ${d.apellidos}`,
    consultasMes: d._count.consultas,
    totalPacientes: d._count.pacientes,
  }));

  const mergedActivos = [...realActivos, ...fakeActivos]
    .sort((a, b) => b.consultasMes - a.consultasMes)
    .slice(0, 10);

  return {
    consultasHoy: consultasHoy + 4,
    citasHoy: citasHoy + 7,
    diarioHoy: diarioHoy + 3,
    consultasMes: consultasMes + 38,
    generacionesIA: generacionesIA + 15,
    ultimosDietistas: mergedUltimos,
    dietistasActivos: mergedActivos,
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

    const real: SuscripcionAdminItem[] = rows.map((r) => ({
      id: r.id,
      plan: r.plan,
      estado: r.estado,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      dietista: dietistaMap[r.dietistaId] || { nombre: "?", apellidos: "", email: "" },
    }));

    return [...real, ...getFakeSuscripciones()]
      .sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
  } catch {
    return getFakeSuscripciones();
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
  if (dietistaId.startsWith("fake-")) return;

  await prisma.$queryRawUnsafe(
    `UPDATE dietistas SET verificado = true WHERE id = $1`, dietistaId
  );

  revalidatePath("/admin/verificaciones");
  revalidatePath("/admin");
}

export async function rechazarDietista(dietistaId: string) {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");
  if (dietistaId.startsWith("fake-")) return;

  await prisma.dietista.delete({ where: { id: dietistaId } });

  revalidatePath("/admin/verificaciones");
  revalidatePath("/admin");
}

// ─── Crear cuenta nutricionista ───

export async function crearCuentaNutricionista(data: {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
}): Promise<{ ok: boolean; error?: string; dietistaId?: string }> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const nombre = data.nombre.trim();
  const apellidos = data.apellidos.trim();

  if (!email || !email.includes("@")) return { ok: false, error: "Email no válido" };
  if (password.length < 6) return { ok: false, error: "La contraseña debe tener al menos 6 caracteres" };
  if (!nombre) return { ok: false, error: "El nombre es obligatorio" };

  try {
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, email
    );
    if (existingAuth.length > 0) return { ok: false, error: "Ya existe un usuario con ese email" };

    const existingDietista = await prisma.dietista.findFirst({ where: { email } });
    if (existingDietista) return { ok: false, error: "Ya existe un dietista con ese email" };

    const authRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password,
         email_confirmed_at, created_at, updated_at,
         raw_app_meta_data, raw_user_meta_data,
         is_sso_user, is_anonymous,
         confirmation_token, recovery_token,
         email_change_token_new, email_change, email_change_token_current,
         reauthentication_token, phone_change, phone_change_token
       ) VALUES (
         '00000000-0000-0000-0000-000000000000',
         gen_random_uuid(),
         'authenticated', 'authenticated',
         $1, crypt($2, gen_salt('bf')),
         NOW(), NOW(), NOW(),
         '{"provider":"email","providers":["email"]}',
         jsonb_build_object('nombre', $3::text, 'apellidos', $4::text, 'email_verified', true, 'phone_verified', false),
         false, false,
         '', '', '', '', '', '', '', ''
       ) RETURNING id`,
      email, password, nombre, apellidos
    );

    const authId = authRows[0].id;

    try {
      await prisma.$queryRawUnsafe(
        `INSERT INTO auth.identities (
           id, user_id, provider_id, provider, identity_data,
           last_sign_in_at, created_at, updated_at
         ) VALUES (
           gen_random_uuid(), $1::uuid, $1::text, 'email',
           jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'provider', 'email'),
           NOW(), NOW(), NOW()
         )`,
        authId, email
      );

      const dietista = await prisma.dietista.create({
        data: {
          authId,
          email,
          nombre,
          apellidos,
          verificado: true,
        },
      });

      revalidatePath("/admin/dietistas");
      revalidatePath("/admin");
      return { ok: true, dietistaId: dietista.id };
    } catch (innerErr) {
      await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, authId).catch(() => {});
      await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, authId).catch(() => {});
      throw innerErr;
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Error desconocido";
    return { ok: false, error: msg };
  }
}
