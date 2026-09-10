"use client";

import { getEnlaceEventoGoogleCita } from "@/app/actions/google-integracion";

const CLAVE_AVISO_COPIA_GOOGLE = "annonia-ocultar-aviso-copia-google";

export function estaOcultoAvisoCopiaGoogle(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_AVISO_COPIA_GOOGLE) === "true";
  } catch {
    return false;
  }
}

export function ocultarAvisoCopiaGoogle(): void {
  try {
    window.localStorage.setItem(CLAVE_AVISO_COPIA_GOOGLE, "true");
  } catch {
    // Sin almacenamiento local, el aviso simplemente volverá a mostrarse.
  }
}

export function abrirCopiaGoogleManual(url: string): void {
  window.open(url, "_blank", "noopener,noreferrer");
}

export async function abrirEventoGoogleSincronizado(
  citaId: string,
): Promise<"abierto" | "bloqueado" | "no-disponible"> {
  const ventanaGoogle = window.open("about:blank", "_blank");
  if (!ventanaGoogle) return "bloqueado";
  ventanaGoogle.opener = null;

  try {
    const resultado = await getEnlaceEventoGoogleCita(citaId);
    if (!resultado.ok) {
      ventanaGoogle.close();
      return "no-disponible";
    }
    ventanaGoogle.location.href = resultado.url;
    return "abierto";
  } catch {
    ventanaGoogle.close();
    return "no-disponible";
  }
}
