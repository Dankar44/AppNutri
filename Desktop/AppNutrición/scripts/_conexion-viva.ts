/**
 * Una conexión que aguanta una prueba larga con navegador.
 *
 * Estas pruebas cogían UNA conexión al principio y luego se pasaban minutos haciendo clics. El
 * pooler de Supabase corta lo que lleva rato ocioso, y a partir de ahí esa conexión ya no sirve:
 * la prueba moría con «Connection terminated unexpectedly», o peor, **se quedaba colgada para
 * siempre** en la siguiente consulta (35 minutos sin decir nada, el 9 sep 2026). En los dos casos
 * parecía un fallo del código que se estaba probando.
 *
 * La salida es no quedarse con ninguna conexión: cada consulta se pide al pool, que abre otra si la
 * anterior murió, y ninguna puede tardar más de un minuto. Se usa igual que antes
 * —`client.query(...)`—, así que las pruebas no cambian.
 */
import type pg from "pg";

/** Lo único que las pruebas necesitan de una conexión. */
export interface Conexion {
  query<R extends pg.QueryResultRow = pg.QueryResultRow>(
    texto: string,
    valores?: unknown[],
  ): Promise<pg.QueryResult<R>>;
}

const LIMITE_MS = 60_000;

export function conexionResistente(pool: pg.Pool): Conexion {
  // Sin esto, una conexión caída tumba el proceso entero en vez de descartarse sin más.
  pool.on("error", (e) => console.warn("[pg] conexión descartada:", e.message));

  return {
    query(texto, valores) {
      // Una consulta que no vuelve deja la prueba muerta sin traza ninguna: mejor que reviente.
      return Promise.race([
        pool.query(texto, valores as never[]),
        new Promise<never>((_, fallar) =>
          setTimeout(() => fallar(new Error(`la consulta tardó más de ${LIMITE_MS / 1000}s: ${texto.slice(0, 80)}`)), LIMITE_MS).unref(),
        ),
      ]) as never;
    },
  };
}
