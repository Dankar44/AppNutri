// Script temporal para probar el auto-desplazamiento de fechas del paciente demo.
// Mueve TODAS las fechas del paciente demo 1 mes hacia atrás (simula "el nutri entra tras un mes sin usarlo").
// Al recargar el dashboard, la lógica de `crearPacienteDemoSiNoExiste` debería detectar el desfase y
// desplazarlas de vuelta 1 mes hacia adelante.
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

async function main() {
  const client = await pool.connect();
  try {
    const res = await client.query<{ id: string; nombre: string; apellidos: string; dietistaEmail: string }>(
      `SELECT p.id, p.nombre, p.apellidos, d.email AS "dietistaEmail"
       FROM pacientes p
       JOIN dietistas d ON d.id = p."dietistaId"
       WHERE p.nombre = 'Paciente' AND p.apellidos = 'Prueba'`,
    );
    console.log(`\nEncontrados ${res.rows.length} pacientes demo:\n`);

    const intervalo = "-1 month";
    for (const p of res.rows) {
      await client.query(`UPDATE seguimiento_diario SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`, [intervalo, p.id]);
      await client.query(`UPDATE citas SET "fechaHora" = "fechaHora" + $1::interval WHERE "pacienteId" = $2`, [intervalo, p.id]);
      await client.query(`UPDATE medidas_antropometricas SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`, [intervalo, p.id]);
      await client.query(`UPDATE consultas SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`, [intervalo, p.id]);
      await client.query(`UPDATE entradas_diario SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`, [intervalo, p.id]);
      await client.query(
        `UPDATE enlaces_compartidos SET "expiraEn" = "expiraEn" + $1::interval
         WHERE "planId" IN (SELECT id FROM planes_alimenticios WHERE "pacienteId" = $2) AND "expiraEn" IS NOT NULL`,
        [intervalo, p.id],
      );
      await client.query(
        `UPDATE planificaciones
         SET "fechaInicio" = "fechaInicio" + $1::interval,
             "fechaUltimoCambio" = "fechaUltimoCambio" + $1::interval,
             "fechaFinPrevista" = CASE WHEN "fechaFinPrevista" IS NOT NULL THEN "fechaFinPrevista" + $1::interval ELSE NULL END
         WHERE "pacienteId" = $2`,
        [intervalo, p.id],
      );
      console.log(`  ✓ Demo de ${p.dietistaEmail} → fechas desplazadas 1 mes atrás`);
    }
    console.log(`\n✅ Listo. Ahora recarga el dashboard y se auto-corregirán.\n`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
