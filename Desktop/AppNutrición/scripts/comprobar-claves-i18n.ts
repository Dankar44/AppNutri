/**
 * Comprueba que ninguna pantalla pide un texto que no existe.
 *
 * next-intl no falla al compilar: revienta en cuanto alguien abre la pantalla, y solo en el idioma
 * al que le falta la clave. Ya ha pasado dos veces (una en portugués, que casi nadie mira). Esto
 * lee el código, saca cada `t("...")` con su namespace y lo busca en los dos idiomas.
 *
 *   npx tsx scripts/comprobar-claves-i18n.ts
 *
 * No toca la base de datos.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const RAIZ = process.cwd();
const IDIOMAS = ["es", "pt"] as const;

function ficheros(dir: string, ext: RegExp, acc: string[] = []): string[] {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) ficheros(p, ext, acc);
    else if (ext.test(n)) acc.push(p);
  }
  return acc;
}

function aplanar(obj: unknown, prefijo = "", acc = new Set<string>()): Set<string> {
  if (obj && typeof obj === "object") {
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const clave = prefijo ? `${prefijo}.${k}` : k;
      if (v && typeof v === "object") aplanar(v, clave, acc);
      else acc.add(clave);
    }
  }
  return acc;
}

const mensajes: Record<string, Map<string, Set<string>>> = {};
for (const idioma of IDIOMAS) {
  const dir = join(RAIZ, "src/messages", idioma);
  const porNamespace = new Map<string, Set<string>>();
  for (const f of readdirSync(dir).filter((n) => n.endsWith(".json"))) {
    porNamespace.set(f.replace(/\.json$/, ""), aplanar(JSON.parse(readFileSync(join(dir, f), "utf8"))));
  }
  mensajes[idioma] = porNamespace;
}

let fallos = 0;

console.log("── Los dos idiomas tienen las mismas claves ──");
const namespaces = new Set([...mensajes.es.keys(), ...mensajes.pt.keys()]);
for (const ns of [...namespaces].sort()) {
  const es = mensajes.es.get(ns) ?? new Set<string>();
  const pt = mensajes.pt.get(ns) ?? new Set<string>();
  const faltanEnPt = [...es].filter((k) => !pt.has(k));
  const faltanEnEs = [...pt].filter((k) => !es.has(k));
  if (faltanEnPt.length || faltanEnEs.length) {
    fallos++;
    if (faltanEnPt.length) console.log(`  ✗ ${ns}: faltan en pt → ${faltanEnPt.slice(0, 8).join(", ")}${faltanEnPt.length > 8 ? ` (+${faltanEnPt.length - 8})` : ""}`);
    if (faltanEnEs.length) console.log(`  ✗ ${ns}: faltan en es → ${faltanEnEs.slice(0, 8).join(", ")}${faltanEnEs.length > 8 ? ` (+${faltanEnEs.length - 8})` : ""}`);
  }
}
if (fallos === 0) console.log(`  ✓ ${namespaces.size} namespaces cuadran en es y pt`);

console.log("\n── Cada t(\"...\") del código existe ──");
let usos = 0, rotas = 0;
for (const fichero of ficheros(join(RAIZ, "src"), /\.tsx?$/)) {
  const código = readFileSync(fichero, "utf8");
  // Los namespaces que usa el fichero, tal cual los declara.
  const suyos = [...código.matchAll(/(?:useTranslations|getTranslations)\(\s*["'`]([\w.-]+)["'`]/g)].map((m) => m[1]);
  if (suyos.length === 0) continue;
  // Cada literal que se le pasa a t(...), incluidos los de un ternario: t(x ? "a" : "b").
  for (const m of código.matchAll(/\bt\(\s*([^)]*?)\)/g)) {
    for (const lit of m[1].matchAll(/["'`]([\w.-]+)["'`]/g)) {
      const clave = lit[1];
      usos++;
      for (const idioma of IDIOMAS) {
        const existe = suyos.some((ns) => (mensajes[idioma].get(ns) ?? new Set()).has(clave));
        const existeEnOtro = suyos.some((ns) => (mensajes[idioma === "es" ? "pt" : "es"].get(ns) ?? new Set()).has(clave));
        // Solo se avisa de lo que es una clave de verdad: existe al menos en un idioma y falta en el otro.
        if (!existe && existeEnOtro) {
          console.log(`  ✗ ${relative(RAIZ, fichero)} pide "${clave}" y no está en ${idioma}`);
          rotas++;
        }
      }
    }
  }
}
if (rotas === 0) console.log(`  ✓ ${usos} usos revisados, ninguno se queda sin traducción`);

const total = fallos + rotas;
console.log(`\n${total === 0 ? "✓ TODO CORRECTO" : `✗ ${total} problemas`}`);
process.exit(total === 0 ? 0 : 1);
