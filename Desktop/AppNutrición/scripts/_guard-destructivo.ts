/**
 * Salvaguarda REFORZADA para scripts que borran o modifican datos de forma irreversible.
 * Se importa como primera línea:  import "./_guard-destructivo";
 *
 * Hace lo mismo que _guard (obliga a elegir base y lo dice en pantalla) y además, si el destino
 * es PRODUCCIÓN, exige una confirmación explícita para que no baste con teclear el comando.
 */
import { esProduccion } from "./_guard";

if (esProduccion && process.env.CONFIRMO !== "BORRAR-EN-PRODUCCION") {
  console.error(`✗ ABORTADO: este script MODIFICA O BORRA datos y el destino es PRODUCCIÓN.

Si de verdad es lo que quieres, repite el comando añadiendo:

    CONFIRMO=BORRAR-EN-PRODUCCION DB=prod npx tsx scripts/<script>.ts

Antes de hacerlo: ¿has comprobado que hay copia de seguridad reciente?
`);
  process.exit(1);
}
