"use server";

import { prisma } from "@/lib/prisma";
import { requireAdmin, verifyAdminCredentials, createAdminSession, clearAdminSession } from "@/lib/admin";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale } from "@/i18n/locale";
import { intlTag } from "@/i18n/config";
import { getTranslations } from "next-intl/server";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { stripe } from "@/lib/stripe";
import { isNextNavigation } from "@/lib/utils";
export async function loginAdmin(email: string, password: string): Promise<{ error?: string }> {
  const t = await getTranslations("validation");
  const result = verifyAdminCredentials(email, password);
  if (!result) {
    return { error: t("admin.emailOContrasenaIncorrectos") };
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
    prisma.paciente.count({ where: { esDemo: false } }),
    prisma.planAlimenticio.count({ where: { activo: true, paciente: { esDemo: false } } }),
    prisma.consulta.count({ where: { fecha: { gte: inicioMesActual }, paciente: { esDemo: false } } }),
    prisma.dietista.count({ where: { createdAt: { gte: inicioMesActual } } }),
    prisma.dietista.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual } } }),
    prisma.paciente.count({ where: { createdAt: { gte: inicioMesActual }, esDemo: false } }),
    prisma.paciente.count({ where: { createdAt: { gte: inicioMesAnterior, lt: inicioMesActual }, esDemo: false } }),
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

  const locale = await getLocale();
  const tag = intlTag(locale);
  const ahora = new Date();
  const inicio6Meses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

  const [dietistas, pacientes] = await Promise.all([
    prisma.dietista.findMany({
      where: { createdAt: { gte: inicio6Meses } },
      select: { createdAt: true },
    }),
    prisma.paciente.findMany({
      where: { createdAt: { gte: inicio6Meses }, esDemo: false },
      select: { createdAt: true },
    }),
  ]);

  const meses: { mes: string; dietistas: number; pacientes: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1);
    const fin = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    const label = d.toLocaleDateString(tag, { month: "short", year: "2-digit" });

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
  creadoPor: string | null;
  fuenteContacto: string | null;
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
      creadoPor: true,
      fuenteContacto: true,
      createdAt: true,
      lastAccessAt: true,
      _count: {
        select: {
          pacientes: { where: { esDemo: false } },
          planes: { where: { paciente: { esDemo: false } } },
          consultas: { where: { paciente: { esDemo: false } } },
          recetas: true,
        },
      },
      pacientes: {
        where: { esDemo: false },
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

  return dietistas.map((d) => ({
    ...d,
    lastSignIn: (d.authId && signInMap[d.authId]) || null,
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
        where: { esDemo: false },
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
          pacientes: { where: { esDemo: false } },
          planes: { where: { paciente: { esDemo: false } } },
          consultas: { where: { paciente: { esDemo: false } } },
          recetas: true,
          alimentos: true,
          citas: { where: { paciente: { esDemo: false } } },
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
    where: { dietistaId, paciente: { esDemo: false } },
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
    prisma.consulta.count({ where: { fecha: { gte: hoy }, paciente: { esDemo: false } } }),
    prisma.cita.count({ where: { fechaHora: { gte: hoy }, paciente: { esDemo: false } } }),
    prisma.entradaDiario.count({ where: { createdAt: { gte: hoy }, paciente: { esDemo: false } } }),
    prisma.consulta.count({ where: { fecha: { gte: inicioMes }, paciente: { esDemo: false } } }),
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
            pacientes: { where: { esDemo: false } },
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

    const real: SuscripcionAdminItem[] = rows.map((r) => ({
      id: r.id,
      plan: r.plan,
      estado: r.estado,
      fechaInicio: r.fechaInicio,
      fechaFin: r.fechaFin,
      dietista: dietistaMap[r.dietistaId] || { nombre: "?", apellidos: "", email: "" },
    }));

    return real.sort((a, b) => new Date(b.fechaInicio).getTime() - new Date(a.fechaInicio).getTime());
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

// ─── Crear cuenta nutricionista ───

export async function crearCuentaNutricionista(data: {
  email: string;
  password: string;
  nombre: string;
  apellidos: string;
  fuenteContacto?: string;
  creadoPorNombre?: string;
}): Promise<{ ok: boolean; error?: string; dietistaId?: string }> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");

  const t = await getTranslations("validation");

  const email = data.email.trim().toLowerCase();
  const password = data.password;
  const nombre = data.nombre.trim();
  const apellidos = data.apellidos.trim();

  if (!email || !email.includes("@")) return { ok: false, error: t("admin.emailNoValido") };
  if (password.length < 6) return { ok: false, error: t("admin.contrasenaMinima") };
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };

  try {
    const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`, email
    );
    if (existingAuth.length > 0) return { ok: false, error: t("admin.yaExisteUsuarioEmail") };

    const existingDietista = await prisma.dietista.findFirst({ where: { email } });
    if (existingDietista) return { ok: false, error: t("admin.yaExisteDietistaEmail") };

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
          creadoPor: data.creadoPorNombre || admin.email,
          fuenteContacto: data.fuenteContacto || null,
        },
      });

      await prisma.$queryRawUnsafe(
        `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`,
        dietista.id
      );

      crearPacienteDemoSiNoExiste(prisma, dietista.id, "es").catch((err) => {
        console.error("[admin] Error creando paciente demo:", err);
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
    const msg = e instanceof Error ? e.message : t("general.errorDesconocido");
    return { ok: false, error: msg };
  }
}

// ─── Eliminar nutricionista completamente ───

export async function eliminarDietista(dietistaId: string): Promise<{ ok: boolean; error?: string }> {
  const admin = await requireAdmin();
  if (!admin) redirect("/admin-login");
  if (admin.role !== "admin") return { ok: false, error: "No autorizado" };

  const t = await getTranslations("validation");

  try {
    const dietista = await prisma.dietista.findUnique({
      where: { id: dietistaId },
      select: { id: true, authId: true, nombre: true, apellidos: true, stripeAccountId: true },
    });
    if (!dietista) return { ok: false, error: t("admin.dietistaNoEncontrado") };

    // 1. Cancelar suscripción Stripe
    try {
      const suscRows = await prisma.$queryRawUnsafe<{ stripeSubscriptionId: string | null; stripeCustomerId: string | null }[]>(
        `SELECT "stripeSubscriptionId", "stripeCustomerId" FROM suscripciones WHERE "dietistaId" = $1 LIMIT 1`,
        dietistaId
      );
      const susc = suscRows[0];
      if (susc?.stripeSubscriptionId) {
        try { await stripe.subscriptions.cancel(susc.stripeSubscriptionId); } catch { /* ya cancelada */ }
      }
    } catch { /* tabla puede no existir */ }

    // 2. Eliminar cuenta Stripe Connect
    if (dietista.stripeAccountId) {
      try { await stripe.accounts.del(dietista.stripeAccountId); } catch { /* ya eliminada */ }
    }

    // 3. Eliminar suscripción (raw SQL, fuera de Prisma ORM)
    try {
      await prisma.$queryRawUnsafe(`DELETE FROM suscripciones WHERE "dietistaId" = $1`, dietistaId);
    } catch { /* tabla puede no existir */ }

    // 4. Eliminar dietista (cascada Prisma: ~26 modelos)
    await prisma.dietista.delete({ where: { id: dietistaId } });

    // 5. Eliminar usuario de Supabase Auth
    if (dietista.authId) {
      await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, dietista.authId).catch(() => {});
      await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, dietista.authId).catch(() => {});
    }

    revalidatePath("/admin/dietistas");
    revalidatePath("/admin/seguimiento");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[admin] Error eliminando dietista:", e);
    return { ok: false, error: t("admin.errorEliminarDietista") };
  }
}
