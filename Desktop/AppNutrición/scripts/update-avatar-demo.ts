import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const AVATAR_DEMO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iI0U4RjVFOSIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjcyIiByPSIyOCIgZmlsbD0iIzY2QkI2QSIvPgogIDxwYXRoIGQ9Ik0xMDAgMTA4Yy0zMCAwLTU0IDE2LTU0IDM2djhjMCA0IDIgNyA2IDkgMTIgNiAzMCA5IDQ4IDlzMzYtMyA0OC05YzQtMiA2LTUgNi05di04YzAtMjAtMjQtMzYtNTQtMzZ6IiBmaWxsPSIjNjZCQjZBIi8+Cjwvc3ZnPgo=";

async function main() {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL!,
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query(
    `UPDATE pacientes SET "fotoUrl" = $1 WHERE nombre = 'Paciente' AND apellidos = 'Prueba' RETURNING id, "dietistaId"`,
    [AVATAR_DEMO],
  );

  console.log(`Actualizados ${res.rowCount} pacientes de prueba:`);
  for (const row of res.rows) {
    console.log(`  - ID: ${row.id} (dietista: ${row.dietistaId})`);
  }

  await pool.end();
}

main().catch(console.error);
