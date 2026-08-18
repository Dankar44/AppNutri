/**
 * Salvaguarda para los scripts que tocan la base de datos.
 *
 * Se importa como primera línea del script:  import "./_guard";
 * (los imports se ejecutan antes del cuerpo del módulo, así que esto corre antes de que el
 *  script abra su conexión; y como los scripts hacen dotenv.config SIN override, no pisan
 *  lo que se decide aquí)
 *
 * POR QUÉ EXISTE: antes, todos los scripts cargaban .env.local y acababan escribiendo en
 * PRODUCCIÓN sin decirlo. El 18 ago 2026 un comando que se creía apuntando a desarrollo fue a
 * producción; no hubo daño por suerte. Aquí no hay destino por defecto: hay que elegirlo.
 */
import dotenv from "dotenv";

const REF_PRODUCCION = "kzbrugggurcjwxsmutic";

const destino = process.env.DB;
if (destino !== "dev" && destino !== "prod") {
  console.error(`
✗ Falta indicar en qué base de datos quieres trabajar.

    DB=dev   npx tsx scripts/<script>.ts     → desarrollo (datos de prueba, se puede romper)
    DB=prod  npx tsx scripts/<script>.ts     → PRODUCCIÓN (datos reales de nutricionistas y pacientes)

No hay destino por defecto a propósito.
`);
  process.exit(1);
}

dotenv.config({ path: destino === "dev" ? ".env.dev.local" : ".env.local", override: true });

const url = process.env.DATABASE_URL ?? "";
const ref = url.match(/postgres\.([a-z0-9]+):/)?.[1] ?? "desconocida";
export const esProduccion = ref === REF_PRODUCCION;

// Si el fichero de entorno no existe o no trae DATABASE_URL, la referencia queda "desconocida"
// y el dotenv.config del propio script rellenaría la conexión desde .env.local, que es
// PRODUCCIÓN. Antes de este corte, el guard llegaba a imprimir "desarrollo" y dejaba pasar.
if (ref === "desconocida") {
  console.error(`
✗ ABORTADO: no he podido determinar a qué base de datos apunta ${destino === "dev" ? ".env.dev.local" : ".env.local"}.

Comprueba que el fichero existe y que tiene DATABASE_URL. Se aborta a propósito: seguir
adelante significaría acabar escribiendo en producción sin saberlo.
`);
  process.exit(1);
}

// Coherencia: que pedir "dev" no acabe escribiendo en producción por un fichero mal configurado.
if (destino === "dev" && esProduccion) {
  console.error("✗ ABORTADO: has pedido DB=dev pero la conexión apunta a PRODUCCIÓN. Revisa .env.dev.local");
  process.exit(1);
}
if (destino === "prod" && !esProduccion) {
  console.error(`✗ ABORTADO: has pedido DB=prod pero la conexión apunta a "${ref}". Revisa .env.local`);
  process.exit(1);
}

// Decir SIEMPRE dónde se va a escribir, antes de tocar nada.
console.log(
  esProduccion
    ? `\n⚠️  BASE DE DATOS: PRODUCCIÓN (${ref}) — datos reales de nutricionistas y pacientes\n`
    : `\nBASE DE DATOS: desarrollo (${ref})\n`,
);
