/**
 * El campo `recomendaciones` del paciente puede guardarse como JSON estructurado
 * ({ agua, ejercicios, alimentosEvitar, otrasRecomendaciones }) o como texto plano
 * (formato antiguo). Esta función devuelve el texto limpio de "otras recomendaciones"
 * en ambos casos — nunca el JSON crudo.
 *
 * Se usa tanto en el PDF del nutricionista (getRecomendaciones) como en el del
 * paciente (portal/exportar-pdf), para que ambos muestren lo mismo.
 */
export function extraerOtrasRecomendaciones(raw: string | null | undefined): string {
  const texto = raw || "";
  try {
    const parsed = JSON.parse(texto);
    if (parsed && typeof parsed === "object" && "otrasRecomendaciones" in parsed) {
      return parsed.otrasRecomendaciones || "";
    }
  } catch {
    // No es JSON → es texto plano (formato antiguo), se devuelve tal cual.
  }
  return texto;
}
