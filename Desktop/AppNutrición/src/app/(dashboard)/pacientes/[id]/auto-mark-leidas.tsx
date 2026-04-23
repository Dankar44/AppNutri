"use client";

import { useEffect } from "react";
import { marcarLeidasDePacientePorTipo } from "@/app/actions/notificaciones";

// Mapa de pestaña → tipos de notificación que debería marcar como leídas al entrar.
const TIPOS_POR_PESTANA: Record<string, string[]> = {
  mediciones: ["PACIENTE_SIN_MEDIDAS"],
  seguimiento: ["DIARIO_NUEVO"],
  general: ["PACIENTE_SIN_CONSULTA"],
  "plan-alimentacion": ["PLAN_ANTIGUO"],
  planificacion: ["PLAN_ANTIGUO"],
};

/**
 * Al estar en una pestaña concreta de la ficha, marca como leídas solo las
 * notificaciones del paciente correspondientes a esa pestaña. No se marcan
 * todas de golpe al entrar en la ficha — solo las que el usuario "visita".
 */
export function AutoMarkLeidas({
  pacienteId,
  pestana,
}: {
  pacienteId: string;
  pestana: string;
}) {
  useEffect(() => {
    const tipos = TIPOS_POR_PESTANA[pestana];
    if (!tipos || tipos.length === 0) return;
    marcarLeidasDePacientePorTipo(pacienteId, tipos as never[]).catch(() => {});
  }, [pacienteId, pestana]);
  return null;
}
