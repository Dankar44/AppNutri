// #104 — Orden y agrupación de comidas por hora. La hora efectiva es la propia (editable)
// o, si no tiene, la de por defecto del tipo. Se comparte entre cliente y PDF/servidor.

export const HORA_DEFAULT_TIPO: Record<string, string> = {
  DESAYUNO: "08:30",
  MEDIA_MANANA: "11:00",
  ALMUERZO: "14:00",
  MERIENDA: "17:30",
  CENA: "21:00",
  RECENA: "23:00",
  OTRA: "12:00",
};

export function horaEfectiva(comida: { tipo: string; hora?: string | null }): string {
  const h = comida.hora?.trim();
  return h || HORA_DEFAULT_TIPO[comida.tipo] || "12:00";
}

export function minutosDeHora(hhmm: string): number {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 0;
  return parseInt(m[1], 10) * 60 + parseInt(m[2], 10);
}

/** Devuelve las comidas ordenadas cronológicamente por su hora efectiva. */
export function ordenarComidasPorHora<T extends { tipo: string; hora?: string | null }>(
  comidas: T[]
): T[] {
  return [...comidas].sort(
    (a, b) => minutosDeHora(horaEfectiva(a)) - minutosDeHora(horaEfectiva(b))
  );
}
