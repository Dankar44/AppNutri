/**
 * Test del parseo/normalización de teléfonos (selector de prefijo de paciente).
 * Sin BD ni red. Verifica que se separan bien los prefijos y que los datos
 * antiguos sin prefijo NO se corrompen.
 *   npx tsx scripts/test-telefono.ts
 */
import { parsearTelefono, combinarTelefono } from "../src/lib/telefono";

let fallos = 0;
function check(cond: boolean, msg: string) {
  console.log(`  ${cond ? "✓" : "✗ FALLO:"} ${msg}`);
  if (!cond) fallos++;
}

console.log("[1] Parseo de teléfonos");
const casos: Array<{ in: string; prefijo: string; numero: string; nota: string }> = [
  { in: "", prefijo: "+34", numero: "", nota: "vacío → default España" },
  { in: "+34 612345678", prefijo: "+34", numero: "612345678", nota: "España con espacio" },
  { in: "+34612345678", prefijo: "+34", numero: "612345678", nota: "España sin espacio" },
  { in: "+351 912345678", prefijo: "+351", numero: "912345678", nota: "Portugal (+351, no +3/+35)" },
  { in: "+54 11 2233 4455", prefijo: "+54", numero: "1122334455", nota: "Argentina con espacios" },
  { in: "+1 5551234567", prefijo: "+1", numero: "5551234567", nota: "EE.UU./+1" },
  { in: "612345678", prefijo: "", numero: "612345678", nota: "ANTIGUO sin prefijo → NO inventa país" },
  { in: "0034612345678", prefijo: "", numero: "0034612345678", nota: "00xx no reconocido → se conserva" },
];
for (const c of casos) {
  const r = parsearTelefono(c.in);
  check(r.prefijo === c.prefijo && r.numero === c.numero,
    `"${c.in}" → {${r.prefijo}|${r.numero}}  (${c.nota})`);
}

console.log("\n[2] Combinación (lo que se guarda)");
check(combinarTelefono("+34", "612345678") === "+34 612345678", "prefijo + número → '+34 612345678'");
check(combinarTelefono("", "612345678") === "612345678", "sin prefijo → solo número (no corrompe viejo)");
check(combinarTelefono("+34", "") === "", "prefijo sin número → vacío (no guarda prefijo suelto)");
check(combinarTelefono("+34", "  612 345 678 ") === "+34 612 345 678", "recorta extremos, mantiene interiores");

console.log("\n[3] Round-trip (parsear → combinar no debe corromper)");
for (const v of ["+34 612345678", "+351 912345678", "612345678", ""]) {
  const p = parsearTelefono(v);
  const out = combinarTelefono(p.prefijo, p.numero);
  // Para el viejo sin prefijo, debe quedar EXACTAMENTE igual (no añade +34).
  if (v === "612345678") check(out === "612345678", `viejo "${v}" se conserva intacto → "${out}"`);
  else if (v === "") check(out === "", `vacío se mantiene vacío`);
  else check(out.replace(/\s/g, "") === v.replace(/\s/g, ""), `"${v}" round-trip → "${out}"`);
}

console.log(`\n${fallos === 0 ? "✅ TODOS LOS CHECKS OK" : `❌ ${fallos} FALLO(S)`}`);
process.exit(fallos === 0 ? 0 : 1);
