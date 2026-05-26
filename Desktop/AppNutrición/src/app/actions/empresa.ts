"use server";

import { prisma } from "@/lib/prisma";
import { getCurrentDietista } from "./auth";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import {
  sanitizeString,
  sanitizeStringOptional,
  validateId,
  validateUuid,
  validateSlug,
  LIMITS,
} from "@/lib/validation";
import { sendEmail } from "@/lib/mailer";
import { TipoNotificacion } from "@/generated/prisma/client";
import { crearPacienteDemoSiNoExiste } from "@/lib/paciente-demo";
import { generarSlug } from "@/lib/empresa-utils";
import { isNextNavigation } from "@/lib/utils";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function revalidateEmpresa() {
  revalidatePath("/ajustes");
  revalidatePath("/alimentos");
  revalidatePath("/notificaciones");
  revalidatePath("/", "layout");
}

async function getMemberCount(empresaId: string): Promise<number> {
  const count = await prisma.dietista.count({ where: { empresaId } });
  return count;
}

async function getMaxMiembros(empresaId: string): Promise<number> {
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { maxMiembros: true },
  });
  return empresa?.maxMiembros ?? 5;
}

async function getPendingInvitationCount(empresaId: string): Promise<number> {
  return prisma.solicitudEmpresa.count({
    where: { empresaId, estado: "PENDIENTE" },
  });
}

// ─── Crear mi propio centro (cualquier nutricionista) ───

const MAX_MIEMBROS_DEFAULT = 10;

export async function crearMiCentro(data: {
  nombre: string;
  descripcion?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (d?.empresaId) return { ok: false, error: t("empresa.yaEnEmpresa") };

  const nombre = sanitizeString(data.nombre, LIMITS.EMPRESA_NOMBRE);
  if (!nombre || nombre.length < 2) return { ok: false, error: t("empresa.nombreRequerido") };

  try {
    let slug = generarSlug(nombre);
    const existeSlug = await prisma.empresa.findUnique({ where: { slug } });
    if (existeSlug) slug = `${slug}-${Date.now().toString(36)}`;

    const empresa = await prisma.empresa.create({
      data: {
        nombre,
        slug,
        descripcion: sanitizeStringOptional(data.descripcion, LIMITS.EMPRESA_DESCRIPCION) || null,
        liderId: dietista.id,
        maxMiembros: MAX_MIEMBROS_DEFAULT,
      },
    });

    await prisma.dietista.update({
      where: { id: dietista.id },
      data: { empresaId: empresa.id, clinica: nombre },
    });

    revalidateEmpresa();
    return { ok: true };
  } catch (e) {
    if (isNextNavigation(e)) throw e;
    console.error("[empresa] Error creando centro:", e);
    return { ok: false, error: t("general.errorDesconocido") };
  }
}

// ─── Obtener empresa del dietista actual ───

export async function obtenerEmpresa() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return null;

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    include: {
      lider: { select: { id: true, nombre: true, apellidos: true, email: true } },
      miembros: {
        select: { id: true, nombre: true, apellidos: true, email: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      },
      solicitudes: {
        where: { estado: "PENDIENTE" },
        include: {
          dietista: { select: { id: true, nombre: true, apellidos: true, email: true } },
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!empresa) return null;

  return {
    ...empresa,
    esLider: empresa.liderId === dietista.id,
    createdAt: empresa.createdAt.toISOString(),
    updatedAt: empresa.updatedAt.toISOString(),
    miembros: empresa.miembros.map((m) => ({
      ...m,
      esLider: m.id === empresa.liderId,
      createdAt: m.createdAt.toISOString(),
    })),
    solicitudes: empresa.solicitudes.map((s) => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
      updatedAt: s.updatedAt.toISOString(),
    })),
  };
}

// ─── Invitar miembro (líder invita por email) ───

export async function invitarMiembro(email: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const emailClean = sanitizeString(email, 200).toLowerCase().trim();
  if (!emailClean || !emailClean.includes("@")) {
    return { ok: false, error: t("empresa.emailObligatorio") };
  }

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    select: { id: true, nombre: true, liderId: true, maxMiembros: true },
  });
  if (!empresa || empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  const [memberCount, pendingCount] = await Promise.all([
    getMemberCount(empresa.id),
    getPendingInvitationCount(empresa.id),
  ]);
  if (memberCount + pendingCount >= empresa.maxMiembros) {
    return { ok: false, error: t("empresa.maxMiembrosAlcanzado") };
  }

  const targetDietista = await prisma.dietista.findUnique({
    where: { email: emailClean },
    select: { id: true, nombre: true, empresaId: true },
  });

  if (targetDietista) {
    if (targetDietista.empresaId === empresa.id) {
      return { ok: false, error: t("empresa.yaEsMiembro") };
    }
    if (targetDietista.empresaId) {
      return { ok: false, error: t("empresa.solicitanteYaEnOtraEmpresa") };
    }

    const existente = await prisma.solicitudEmpresa.findFirst({
      where: { empresaId: empresa.id, dietistaId: targetDietista.id, estado: "PENDIENTE" },
    });
    if (existente) return { ok: false, error: t("empresa.emailYaInvitado") };

    await prisma.solicitudEmpresa.create({
      data: { empresaId: empresa.id, dietistaId: targetDietista.id },
    });

    await prisma.notificacion.create({
      data: {
        dietistaId: targetDietista.id,
        tipo: "EMPRESA_SOLICITUD",
        titulo: `${escapeHtml(dietista.nombre)} te invita a ${escapeHtml(empresa.nombre)}`,
        mensaje: `Has sido invitado/a a unirte al centro ${empresa.nombre}.`,
        enlace: "/ajustes",
      },
    });
  } else {
    const existente = await prisma.solicitudEmpresa.findFirst({
      where: { empresaId: empresa.id, email: emailClean, estado: "PENDIENTE" },
    });
    if (existente) return { ok: false, error: t("empresa.emailYaInvitado") };

    await prisma.solicitudEmpresa.create({
      data: { empresaId: empresa.id, email: emailClean },
    });
  }

  sendEmail({
    to: emailClean,
    subject: `Te han invitado a ${empresa.nombre} — Annonia`,
    html: buildEmpresaEmail({
      titulo: "Invitación a un centro",
      saludo: `Hola,`,
      cuerpo: `${escapeHtml(dietista.nombre)} te ha invitado a unirte al centro ${escapeHtml(empresa.nombre)} en Annonia.`,
      botonTexto: "Ver invitación",
      botonUrl: "https://annonia.com/ajustes",
    }),
  }).catch((err) => console.error("[empresa] Error email invitación:", err));

  revalidateEmpresa();
  return { ok: true };
}

// ─── Aceptar invitación (el dietista invitado acepta) ───

export async function aceptarInvitacion(solicitudId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const sId = validateUuid(solicitudId);
  if (!sId) return { ok: false, error: t("empresa.solicitudNoEncontrada") };

  const solicitud = await prisma.solicitudEmpresa.findUnique({
    where: { id: sId },
    include: {
      empresa: { select: { id: true, nombre: true, liderId: true, maxMiembros: true } },
    },
  });

  if (!solicitud || solicitud.estado !== "PENDIENTE") {
    return { ok: false, error: t("empresa.solicitudNoEncontrada") };
  }

  const isTarget =
    (solicitud.dietistaId && solicitud.dietistaId === dietista.id) ||
    (solicitud.email && solicitud.email === dietista.email);
  if (!isTarget) {
    return { ok: false, error: t("empresa.solicitudNoEncontrada") };
  }

  const existingEmpresa = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (existingEmpresa?.empresaId) {
    return { ok: false, error: t("empresa.yaEnEmpresa") };
  }

  const memberCount = await getMemberCount(solicitud.empresa.id);
  if (memberCount >= solicitud.empresa.maxMiembros) {
    return { ok: false, error: t("empresa.maxMiembrosAlcanzado") };
  }

  await prisma.$transaction([
    prisma.solicitudEmpresa.update({
      where: { id: sId },
      data: { estado: "ACEPTADA", dietistaId: dietista.id },
    }),
    prisma.dietista.update({
      where: { id: dietista.id },
      data: { empresaId: solicitud.empresaId, clinica: solicitud.empresa.nombre },
    }),
  ]);

  await prisma.notificacion.create({
    data: {
      dietistaId: solicitud.empresa.liderId,
      tipo: "EMPRESA_ACEPTADA",
      titulo: `${dietista.nombre} se ha unido a ${solicitud.empresa.nombre}`,
      mensaje: `${dietista.nombre} ha aceptado la invitación y se ha unido al centro.`,
      enlace: "/ajustes",
    },
  });

  revalidateEmpresa();
  return { ok: true };
}

// ─── Rechazar invitación (el dietista invitado rechaza) ───

export async function rechazarInvitacion(solicitudId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const sId = validateUuid(solicitudId);
  if (!sId) return { ok: false, error: t("empresa.solicitudNoEncontrada") };

  const solicitud = await prisma.solicitudEmpresa.findUnique({
    where: { id: sId },
    include: {
      empresa: { select: { nombre: true, liderId: true } },
    },
  });

  if (!solicitud || solicitud.estado !== "PENDIENTE") {
    return { ok: false, error: t("empresa.solicitudNoEncontrada") };
  }

  const isTarget =
    (solicitud.dietistaId && solicitud.dietistaId === dietista.id) ||
    (solicitud.email && solicitud.email === dietista.email);
  if (!isTarget) {
    return { ok: false, error: t("empresa.solicitudNoEncontrada") };
  }

  await prisma.solicitudEmpresa.update({
    where: { id: sId },
    data: { estado: "RECHAZADA" },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: solicitud.empresa.liderId,
      tipo: "EMPRESA_RECHAZADA",
      titulo: `${dietista.nombre} ha rechazado la invitación`,
      mensaje: `${dietista.nombre} ha rechazado la invitación para unirse a ${solicitud.empresa.nombre}.`,
      enlace: "/ajustes",
    },
  });

  revalidateEmpresa();
  return { ok: true };
}

// ─── Cancelar invitación (el líder cancela una invitación pendiente) ───

export async function cancelarInvitacion(solicitudId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const sId = validateUuid(solicitudId);
  if (!sId) return { ok: false, error: t("empresa.solicitudNoEncontrada") };

  const solicitud = await prisma.solicitudEmpresa.findUnique({
    where: { id: sId },
    include: {
      empresa: { select: { liderId: true } },
    },
  });

  if (!solicitud || solicitud.estado !== "PENDIENTE") {
    return { ok: false, error: t("empresa.solicitudNoEncontrada") };
  }

  if (solicitud.empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  await prisma.solicitudEmpresa.delete({ where: { id: sId } });

  revalidateEmpresa();
  return { ok: true };
}

// ─── Obtener mis invitaciones pendientes (para dietista sin centro) ───

export async function getMisInvitaciones() {
  const dietista = await getCurrentDietista();
  if (!dietista) return [];

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (d?.empresaId) return [];

  const invitaciones = await prisma.solicitudEmpresa.findMany({
    where: {
      estado: "PENDIENTE",
      OR: [
        { dietistaId: dietista.id },
        { email: dietista.email },
      ],
    },
    include: {
      empresa: {
        select: {
          id: true,
          nombre: true,
          slug: true,
          descripcion: true,
          lider: { select: { nombre: true, apellidos: true } },
          _count: { select: { miembros: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return invitaciones.map((inv) => ({
    id: inv.id,
    empresaNombre: inv.empresa.nombre,
    empresaSlug: inv.empresa.slug,
    empresaDescripcion: inv.empresa.descripcion,
    liderNombre: `${inv.empresa.lider.nombre} ${inv.empresa.lider.apellidos}`.trim(),
    totalMiembros: inv.empresa._count.miembros,
    createdAt: inv.createdAt.toISOString(),
  }));
}

// ─── Crear miembro del centro (líder crea cuenta nueva) ───

export async function crearMiembroCentro(data: {
  nombre: string;
  apellidos?: string;
  email: string;
  password: string;
}): Promise<{ ok: boolean; error?: string; email?: string; password?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    select: { id: true, nombre: true, liderId: true, maxMiembros: true },
  });
  if (!empresa || empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  const memberCount = await getMemberCount(empresa.id);
  if (memberCount >= empresa.maxMiembros) {
    return { ok: false, error: t("empresa.maxMiembrosAlcanzado") };
  }

  const nombre = sanitizeString(data.nombre, 100);
  if (!nombre) return { ok: false, error: t("admin.nombreObligatorio") };

  const apellidos = sanitizeStringOptional(data.apellidos, 100) ?? "";
  const email = sanitizeString(data.email, 200).toLowerCase().trim();
  if (!email || !email.includes("@")) {
    return { ok: false, error: t("admin.emailNoValido") };
  }

  const password = data.password;
  if (!password || password.length < 6) {
    return { ok: false, error: t("admin.contrasenaMinima") };
  }

  const existeEmail = await prisma.dietista.findUnique({ where: { email } });
  if (existeEmail) {
    return { ok: false, error: t("admin.yaExisteDietistaEmail") };
  }

  const existingAuth = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM auth.users WHERE email = $1 LIMIT 1`,
    email,
  );
  if (existingAuth.length > 0) {
    return { ok: false, error: t("admin.yaExisteUsuarioEmail") };
  }

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
    email, password, nombre, apellidos,
  );

  const authId = authRows[0].id;

  await prisma.$queryRawUnsafe(
    `INSERT INTO auth.identities (
       id, user_id, provider_id, provider, identity_data,
       last_sign_in_at, created_at, updated_at
     ) VALUES (
       gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub', $1::text, 'email', $2::text, 'email_verified', true, 'provider', 'email'),
       NOW(), NOW(), NOW()
     )`,
    authId, email,
  );

  const nuevoDietista = await prisma.dietista.create({
    data: {
      authId,
      email,
      nombre,
      apellidos,
      verificado: true,
      empresaId: empresa.id,
      clinica: empresa.nombre,
      creadoPor: dietista.nombre,
    },
  });

  await prisma.$queryRawUnsafe(
    `INSERT INTO suscripciones (id, "dietistaId", plan, estado, "fechaInicio", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, 'PROFESIONAL', 'ACTIVA', NOW(), NOW(), NOW())`,
    nuevoDietista.id,
  );

  crearPacienteDemoSiNoExiste(prisma, nuevoDietista.id, "es").catch(() => {});

  sendEmail({
    to: email,
    subject: `Tu cuenta en ${empresa.nombre} — Annonia`,
    html: buildEmpresaEmail({
      titulo: "Tu cuenta ha sido creada",
      saludo: `Hola ${escapeHtml(nombre)},`,
      cuerpo: `${escapeHtml(dietista.nombre)} ha creado tu cuenta en el centro ${escapeHtml(empresa.nombre)}. Tus credenciales son:<br><br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Contraseña:</strong> ${escapeHtml(password)}`,
      botonTexto: "Iniciar sesión",
      botonUrl: "https://annonia.com/login",
    }),
  }).catch((err) => console.error("[empresa] Error email crear miembro:", err));

  revalidateEmpresa();
  return { ok: true, email, password };
}

// ─── Salir de la empresa ───

export async function salirDeEmpresa(): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    include: {
      miembros: { select: { id: true, createdAt: true }, orderBy: { createdAt: "asc" } },
    },
  });
  if (!empresa) return { ok: false, error: t("empresa.empresaNoEncontrada") };

  const esLider = empresa.liderId === dietista.id;

  if (esLider) {
    const otrosMiembros = empresa.miembros.filter((m) => m.id !== dietista.id);

    if (otrosMiembros.length === 0) {
      await prisma.$transaction([
        prisma.solicitudEmpresa.deleteMany({ where: { empresaId: empresa.id } }),
        prisma.dietista.update({ where: { id: dietista.id }, data: { empresaId: null, clinica: null } }),
        prisma.empresa.delete({ where: { id: empresa.id } }),
      ]);
    } else {
      const nuevoLider = otrosMiembros[0];
      await prisma.$transaction([
        prisma.empresa.update({
          where: { id: empresa.id },
          data: { liderId: nuevoLider.id },
        }),
        prisma.dietista.update({ where: { id: dietista.id }, data: { empresaId: null, clinica: null } }),
      ]);

      await prisma.notificacion.create({
        data: {
          dietistaId: nuevoLider.id,
          tipo: "EMPRESA_LIDER_TRANSFERIDO",
          titulo: `Ahora lideras ${empresa.nombre}`,
          mensaje: `${dietista.nombre} ha abandonado la empresa y el liderazgo se te ha transferido automáticamente.`,
          enlace: "/ajustes",
        },
      });
    }
  } else {
    await prisma.dietista.update({
      where: { id: dietista.id },
      data: { empresaId: null, clinica: null },
    });

    await prisma.notificacion.create({
      data: {
        dietistaId: empresa.liderId,
        tipo: "EMPRESA_MIEMBRO_SALIO",
        titulo: `${dietista.nombre} ha salido de ${empresa.nombre}`,
        mensaje: `${dietista.nombre} ha abandonado la empresa.`,
        enlace: "/ajustes",
      },
    });
  }

  revalidateEmpresa();
  return { ok: true };
}

// ─── Expulsar miembro ───

export async function expulsarMiembro(miembroId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const mId = validateId(miembroId);
  if (!mId) return { ok: false, error: t("empresa.miembroNoEncontrado") };
  if (mId === dietista.id) return { ok: false, error: t("empresa.noPuedesExpulsarte") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    select: { id: true, nombre: true, liderId: true },
  });
  if (!empresa || empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  const miembro = await prisma.dietista.findUnique({
    where: { id: mId },
    select: { id: true, nombre: true, empresaId: true },
  });
  if (!miembro || miembro.empresaId !== empresa.id) {
    return { ok: false, error: t("empresa.miembroNoEncontrado") };
  }

  await prisma.dietista.update({
    where: { id: mId },
    data: { empresaId: null, clinica: null },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: mId,
      tipo: "EMPRESA_MIEMBRO_SALIO",
      titulo: `Has sido eliminado de ${empresa.nombre}`,
      mensaje: `El líder de ${empresa.nombre} te ha eliminado del equipo.`,
      enlace: "/ajustes",
    },
  });

  revalidateEmpresa();
  return { ok: true };
}

// ─── Transferir liderazgo ───

export async function transferirLiderazgo(nuevoLiderId: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const nId = validateId(nuevoLiderId);
  if (!nId) return { ok: false, error: t("empresa.miembroNoEncontrado") };
  if (nId === dietista.id) return { ok: false, error: t("empresa.yaEresLider") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    select: { id: true, nombre: true, liderId: true },
  });
  if (!empresa || empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  const nuevoLider = await prisma.dietista.findUnique({
    where: { id: nId },
    select: { id: true, nombre: true, email: true, empresaId: true },
  });
  if (!nuevoLider || nuevoLider.empresaId !== empresa.id) {
    return { ok: false, error: t("empresa.miembroNoEncontrado") };
  }

  await prisma.empresa.update({
    where: { id: empresa.id },
    data: { liderId: nId },
  });

  await prisma.notificacion.create({
    data: {
      dietistaId: nId,
      tipo: "EMPRESA_LIDER_TRANSFERIDO",
      titulo: `Ahora lideras ${empresa.nombre}`,
      mensaje: `${dietista.nombre} te ha transferido el liderazgo de ${empresa.nombre}.`,
      enlace: "/ajustes",
    },
  });

  sendEmail({
    to: nuevoLider.email,
    subject: `Ahora lideras ${empresa.nombre}`,
    html: buildEmpresaEmail({
      titulo: "Liderazgo transferido",
      saludo: `Hola ${escapeHtml(nuevoLider.nombre)},`,
      cuerpo: `${escapeHtml(dietista.nombre)} te ha transferido el liderazgo de ${escapeHtml(empresa.nombre)}. Ahora puedes gestionar miembros e invitaciones.`,
      botonTexto: "Gestionar centro",
      botonUrl: "https://annonia.com/ajustes",
    }),
  }).catch((err) => console.error("[empresa] Error email liderazgo:", err));

  revalidateEmpresa();
  return { ok: true };
}

// ─── Actualizar empresa ───

export async function actualizarEmpresa(data: {
  nombre?: string;
  descripcion?: string;
  slug?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations("validation");
  const dietista = await getCurrentDietista();
  if (!dietista) return { ok: false, error: t("auth.noAutorizado") };
  if (dietista.isDemo) return { ok: false, error: t("auth.noAutorizado") };

  const d = await prisma.dietista.findUnique({
    where: { id: dietista.id },
    select: { empresaId: true },
  });
  if (!d?.empresaId) return { ok: false, error: t("empresa.noEnEmpresa") };

  const empresa = await prisma.empresa.findUnique({
    where: { id: d.empresaId },
    select: { id: true, liderId: true, slug: true },
  });
  if (!empresa || empresa.liderId !== dietista.id) {
    return { ok: false, error: t("empresa.soloLider") };
  }

  const updateData: Record<string, unknown> = {};

  if (data.nombre !== undefined) {
    const nombre = sanitizeString(data.nombre, LIMITS.EMPRESA_NOMBRE);
    if (!nombre || nombre.length < 2) {
      return { ok: false, error: t("empresa.nombreRequerido") };
    }
    updateData.nombre = nombre;
  }

  if (data.descripcion !== undefined) {
    updateData.descripcion = sanitizeStringOptional(data.descripcion, LIMITS.EMPRESA_DESCRIPCION);
  }

  if (data.slug !== undefined) {
    const slug = validateSlug(data.slug, LIMITS.EMPRESA_SLUG);
    if (!slug) return { ok: false, error: t("empresa.slugInvalido") };
    if (slug !== empresa.slug) {
      const slugExiste = await prisma.empresa.findUnique({ where: { slug } });
      if (slugExiste) return { ok: false, error: t("empresa.slugDuplicado") };
      updateData.slug = slug;
    }
  }

  if (Object.keys(updateData).length > 0) {
    await prisma.empresa.update({ where: { id: empresa.id }, data: updateData });
    if (updateData.nombre) {
      await prisma.dietista.updateMany({
        where: { empresaId: empresa.id },
        data: { clinica: updateData.nombre as string },
      });
    }
  }

  revalidateEmpresa();
  return { ok: true };
}

// ─── Marcar leídas notificaciones empresa ───

export async function marcarLeidasEmpresa() {
  const dietista = await getCurrentDietista();
  if (!dietista) return;
  if (dietista.isDemo) return;

  const tiposEmpresa: TipoNotificacion[] = [
    "EMPRESA_SOLICITUD",
    "EMPRESA_ACEPTADA",
    "EMPRESA_RECHAZADA",
    "EMPRESA_MIEMBRO_SALIO",
    "EMPRESA_LIDER_TRANSFERIDO",
  ];

  const res = await prisma.notificacion.updateMany({
    where: {
      dietistaId: dietista.id,
      tipo: { in: tiposEmpresa },
      leida: false,
    },
    data: { leida: true },
  });

  if (res.count > 0) {
    revalidatePath("/notificaciones");
    revalidatePath("/", "layout");
  }
}

// ─── Email template empresa ───

function buildEmpresaEmail(opts: {
  titulo: string;
  saludo: string;
  cuerpo: string;
  botonTexto: string;
  botonUrl: string;
}): string {
  return `<div style="max-width:520px;margin:0 auto;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;">
  <div style="background:#16a34a;padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
    <img src="https://annonia.com/icon-512.png" alt="Annonia" width="56" height="56" style="border-radius:12px;" />
    <h1 style="color:#ffffff;font-size:22px;margin:12px 0 0;font-weight:700;">Annonia</h1>
  </div>
  <div style="padding:32px 24px;border:1px solid #e5e7eb;border-top:0;border-radius:0 0 12px 12px;">
    <h2 style="color:#111827;font-size:18px;margin:0 0 8px;font-weight:600;">${escapeHtml(opts.titulo)}</h2>
    <p style="color:#374151;font-size:14px;margin:0 0 8px;">${opts.saludo}</p>
    <p style="color:#374151;font-size:14px;margin:0 0 24px;">${opts.cuerpo}</p>
    <div style="text-align:center;margin:0 0 24px;">
      <a href="${escapeHtml(opts.botonUrl)}" style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;">${escapeHtml(opts.botonTexto)}</a>
    </div>
    <p style="color:#9ca3af;font-size:12px;margin:0;text-align:center;">Este correo es una notificación automática de Annonia.</p>
  </div>
</div>`;
}
