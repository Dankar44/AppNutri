import { PREFIJOS } from "./paises";

// Para parsear bien hay que probar primero los prefijos más largos (+351 antes que +1).
const PREFIJOS_ORDENADOS = [...PREFIJOS].sort((a, b) => b.dial.length - a.dial.length);

/**
 * Separa un teléfono guardado en { prefijo, numero }.
 * - Vacío → prefijo por defecto (+34) y número vacío (alta de paciente nuevo).
 * - Empieza por un prefijo conocido → se separan.
 * - No reconocible (dato antiguo sin prefijo) → prefijo vacío y el número tal cual,
 *   SIN inventar país (no se corrompe el dato existente).
 */
export function parsearTelefono(value: string): { prefijo: string; numero: string } {
  const v = (value || "").trim();
  if (!v) return { prefijo: "+34", numero: "" };
  const compacto = v.replace(/\s+/g, "");
  for (const p of PREFIJOS_ORDENADOS) {
    if (compacto.startsWith(p.dial)) {
      return { prefijo: p.dial, numero: compacto.slice(p.dial.length) };
    }
  }
  return { prefijo: "", numero: v };
}

/**
 * Combina prefijo + número en el valor a guardar. Si no hay prefijo elegido,
 * devuelve solo el número (para no romper datos antiguos sin prefijo). Si no hay
 * número, devuelve cadena vacía (no se guarda un prefijo suelto).
 */
export function combinarTelefono(prefijo: string, numero: string): string {
  const n = numero.trim();
  return prefijo && n ? `${prefijo} ${n}` : n;
}
