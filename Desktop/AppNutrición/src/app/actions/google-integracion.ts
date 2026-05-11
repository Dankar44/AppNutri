"use server";

import { cookies } from "next/headers";
import { randomBytes } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentDietista } from "@/app/actions/auth";
import { getCurrentPaciente } from "@/lib/patient-auth";
import { prisma } from "@/lib/prisma";
import { buildAuthUrl, isGoogleConfigured } from "@/lib/google-oauth";
import { deleteGoogleEvent } from "@/lib/google-calendar";
import { backfillCitasNutri, backfillCitasPaciente } from "@/lib/google-sync";

const STATE_COOKIE_NUTRI = "google_oauth_state_nutri";
const STATE_COOKIE_PACIENTE = "google_oauth_state_paciente";

async function setStateCookie(name: string, value: string) {
  const jar = await cookies();
  jar.set(name, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
}

export async function getStateCookie(name: string): Promise<string | null> {
  const jar = await cookies();
  return jar.get(name)?.value ?? null;
}

export async function clearStateCookie(name: string) {
  const jar = await cookies();
  jar.delete(name);
}

// ────────────────────────────── Nutri ──────────────────────────────

export async function conectarGoogleNutri(): Promise<never> {
  const dietista = await getCurrentDietista();
  if (!dietista) redirect("/login");
  if (dietista.isDemo) redirect("/ajustes");
  if (!isGoogleConfigured()) {
    redirect("/ajustes?google=error&reason=no_configurado");
  }
  const state = randomBytes(24).toString("hex");
  await setStateCookie(STATE_COOKIE_NUTRI, state);
  const url = buildAuthUrl("nutri", state);
  redirect(url);
}

export async function desconectarGoogleNutri(options: {
  accion: "borrar" | "dejar";
}) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autenticado");
  if (dietista.isDemo) return;

  const integracion = await prisma.googleIntegracion.findUnique({
    where: { dietistaId: dietista.id },
  });
  if (!integracion) return;

  if (options.accion === "borrar") {
    const citas = await prisma.cita.findMany({
      where: { dietistaId: dietista.id, googleEventId: { not: null } },
      select: { id: true, googleEventId: true },
    });
    const borrados: string[] = [];
    for (const c of citas) {
      if (!c.googleEventId) continue;
      try {
        await deleteGoogleEvent(integracion, "nutri", c.googleEventId);
        borrados.push(c.id);
      } catch (e) {
        console.warn(`[google] borrar evento ${c.googleEventId} falló:`, e);
      }
    }
    if (borrados.length > 0) {
      await prisma.cita.updateMany({
        where: { id: { in: borrados } },
        data: { googleEventId: null, googleMeetLink: null },
      });
    }
    const fallidos = citas.length - borrados.length;
    if (fallidos > 0) {
      console.error(`[google] ${fallidos} eventos no se pudieron borrar de Google Calendar`);
    }
  }

  await prisma.googleIntegracion.delete({
    where: { dietistaId: dietista.id },
  });

  revalidatePath("/ajustes");
}

export async function toggleSincronizarNutri(activar: boolean) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autenticado");
  if (dietista.isDemo) return;

  await prisma.googleIntegracion.update({
    where: { dietistaId: dietista.id },
    data: { sincronizar: activar },
  });

  if (activar) {
    // Al reactivar, rellenar huecos: citas sincronizables sin googleEventId
    void backfillCitasNutri(dietista.id).catch((e) =>
      console.error("[backfill-toggle]", e),
    );
  }

  revalidatePath("/ajustes");
}

export async function toggleCrearMeetNutri(activar: boolean) {
  const dietista = await getCurrentDietista();
  if (!dietista) throw new Error("No autenticado");
  if (dietista.isDemo) return;

  await prisma.googleIntegracion.update({
    where: { dietistaId: dietista.id },
    data: { crearMeet: activar },
  });

  revalidatePath("/ajustes");
}

// ────────────────────────────── Paciente ──────────────────────────────

export async function conectarGooglePaciente(): Promise<never> {
  const session = await getCurrentPaciente();
  if (!session) redirect("/paciente/login");
  if (!isGoogleConfigured()) {
    redirect("/paciente/portal/citas?google=error&reason=no_configurado");
  }
  const state = randomBytes(24).toString("hex");
  await setStateCookie(STATE_COOKIE_PACIENTE, state);
  const url = buildAuthUrl("paciente", state);
  redirect(url);
}

export async function desconectarGooglePaciente(options: {
  accion: "borrar" | "dejar";
}) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autenticado");

  // No hay campo dedicado por paciente en Cita para su googleEventId personal
  // → solo desconectamos y perdemos referencia (idéntico al caso "dejar").
  // En versión futura se puede añadir tabla de eventos sincronizados.
  await prisma.googleIntegracionPaciente.delete({
    where: { pacienteId: session.pacienteId },
  });
  void options;

  revalidatePath("/paciente/portal/citas");
}

export async function toggleSincronizarPaciente(activar: boolean) {
  const session = await getCurrentPaciente();
  if (!session) throw new Error("No autenticado");

  await prisma.googleIntegracionPaciente.update({
    where: { pacienteId: session.pacienteId },
    data: { sincronizar: activar },
  });

  if (activar) {
    void backfillCitasPaciente(session.pacienteId).catch((e) =>
      console.error("[backfill-toggle-paciente]", e),
    );
  }

  revalidatePath("/paciente/portal/citas");
}

export async function getIntegracionNutri() {
  const dietista = await getCurrentDietista();
  if (!dietista) return null;
  const integracion = await prisma.googleIntegracion.findUnique({
    where: { dietistaId: dietista.id },
    select: {
      email: true,
      sincronizar: true,
      crearMeet: true,
      createdAt: true,
    },
  });
  return integracion;
}

export async function getIntegracionPaciente() {
  const session = await getCurrentPaciente();
  if (!session) return null;
  const integracion = await prisma.googleIntegracionPaciente.findUnique({
    where: { pacienteId: session.pacienteId },
    select: {
      email: true,
      sincronizar: true,
      createdAt: true,
    },
  });
  return integracion;
}
