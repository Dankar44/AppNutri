"use client";

import { useEffect } from "react";
import { marcarLeidasDeCita } from "@/app/actions/notificaciones";

export function AutoMarkLeidasCita({ citaId }: { citaId: string }) {
  useEffect(() => {
    marcarLeidasDeCita(citaId).catch(() => {});
  }, [citaId]);
  return null;
}
