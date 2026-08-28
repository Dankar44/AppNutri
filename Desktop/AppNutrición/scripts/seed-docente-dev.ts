/**
 * Deja el módulo docente listo para trastear en DESARROLLO: una licencia de universidad y una
 * cuenta de profesor con credenciales conocidas.
 *
 *   DB=dev npx tsx scripts/seed-docente-dev.ts
 *
 * Se puede ejecutar las veces que haga falta: rehace la cuenta y la licencia desde cero.
 * ABORTA si se le apunta a producción: crea una cuenta con una contraseña escrita aquí.
 */
import "./_guard";
import { esProduccion } from "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

if (esProduccion) {
  console.error("\n✗ ABORTADO: esto es solo para desarrollo. Crearía una cuenta con contraseña conocida en producción.\n");
  process.exit(1);
}

const EMAIL = "profesor@annonia.dev";
const PASS = "profesor1234";
const INSTITUCION = "Universidad Pablo de Olavide";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

async function main() {
  const client = await pool.connect();
  try {
    // Cuenta desde cero (así la contraseña siempre es la de aquí)
    const { rows: viejos } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [EMAIL]);
    for (const v of viejos) {
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [v.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [v.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [v.id]);
    }
    const { rows: u } = await client.query(
      `INSERT INTO auth.users (
         instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
         confirmation_token, recovery_token, email_change_token_new, email_change,
         email_change_token_current, reauthentication_token, phone_change, phone_change_token
       ) VALUES (
         '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
         '{"provider":"email","providers":["email"]}',
         jsonb_build_object('nombre','José Miguel','apellidos','Martínez','email_verified',true,'phone_verified',false),
         false, false, '', '', '', '', '', '', '', ''
       ) RETURNING id`,
      [EMAIL, PASS],
    );
    const authId = u[0].id as string;
    await client.query(
      `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
         jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'),
         NOW(), NOW(), NOW())`,
      [authId, EMAIL],
    );
    const { rows: die } = await client.query(
      `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "fuenteContacto", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'José Miguel', 'Martínez', true, 'universidad', NOW(), NOW())
       RETURNING id`,
      [authId, EMAIL],
    );
    const dietistaId = die[0].id as string;

    await client.query(`DELETE FROM licencias_docentes WHERE institucion = $1`, [INSTITUCION]);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (institucion, "dominioEmail", "maxProfesores", "maxAlumnos", curso, "fechaFin", notas)
       VALUES ($1, 'upo.es,alu.upo.es', 3, 300, '2026/27', '2027-08-31', 'Licencia de ejemplo para desarrollo')
       RETURNING id`,
      [INSTITUCION],
    );
    await client.query(
      `UPDATE dietistas SET "rolDocente" = 'PROFESOR', "licenciaDocenteId" = $1 WHERE id = $2`,
      [lic[0].id, dietistaId],
    );

    console.log(`
✓ Listo para probar en desarrollo

  Licencia:  ${INSTITUCION} — 3 profesores y 300 alumnos, curso 2026/27
  Profesor:  ${EMAIL}
  Clave:     ${PASS}

  1. npm run dev:desarrollo          (puerto 3001)
  2. http://localhost:3001/login     y entra con esas credenciales
     → aterrizas en el espacio docente

  El panel de administración está en http://localhost:3001/admin/universidades
`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
