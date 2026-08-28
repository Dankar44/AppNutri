/**
 * Salvaguarda para los scripts que SOLO pueden correr en desarrollo.
 *
 * Se importa como primera línea:  import "./_guard-solo-dev";
 *
 * `_guard` obliga a elegir `DB=dev|prod`, pero con `prod` **avisa y sigue adelante**, que es lo
 * correcto para una migración. No lo es para un script que crea cuentas con una contraseña
 * escrita en el código, o que borra filas por un patrón de nombre: ahí un `DB=prod` tecleado sin
 * pensar dejaría una cuenta de nutricionista operativa en producción con una contraseña que está
 * en el repositorio, que es público. Esto corta antes de tocar nada.
 */
import "./_guard";
import { esProduccion } from "./_guard";

if (esProduccion) {
  console.error(`
✗ ABORTADO: este script es SOLO para desarrollo y estás apuntando a PRODUCCIÓN.

Crea cuentas con contraseñas conocidas y borra filas de prueba: en producción eso deja una cuenta
operativa con una contraseña publicada, y borra datos reales que coincidan con el patrón.

    DB=dev npx tsx scripts/<script>.ts
`);
  process.exit(1);
}
