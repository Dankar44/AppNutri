/**
 * #39 — Deja lista una cuenta de profesor en DESARROLLO para probar a mano.
 *
 *   DB=dev npx tsx scripts/preparar-prueba-docente.ts
 *
 * Crea (o rehace) una universidad, un profesor y una clase vacía. Repetirlo borra lo anterior y
 * lo deja limpio, así que se puede lanzar tantas veces como haga falta. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const EMAIL = "profesor.prueba@annonia.dev";
const PASS = "ProfesorPrueba2026";
const INSTITUCION = "Universidad de prueba (Guillermo)";

async function main() {
  const client = await pool.connect();
  try {
    // Limpieza de la vez anterior, para que la prueba empiece siempre igual.
    await client.query(`DELETE FROM clases WHERE nombre LIKE 'Dietoterapia 3º A%'`);
    const { rows: viejos } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [EMAIL]);
    for (const v of viejos) {
      await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [v.id]);
      await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [v.id]);
      await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [v.id]);
    }
    await client.query(`DELETE FROM licencias_docentes WHERE institucion = $1`, [INSTITUCION]);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "personaContacto", "maxProfesores", "maxAlumnos",
         curso, "fechaFin", "dominioEmail", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Guillermo', 3, 30, '2026/27', '2027-08-31', 'urjc.es,alumnos.urjc.es', NOW(), NOW())
       RETURNING id`, [INSTITUCION]);
    const licenciaId = lic[0].id as string;

    const { rows: u } = await client.query(
      `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
         confirmation_token, recovery_token, email_change_token_new, email_change,
         email_change_token_current, reauthentication_token, phone_change, phone_change_token)
       VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
         '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
       RETURNING id`, [EMAIL, PASS]);
    const authId = u[0].id as string;
    await client.query(
      `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
       VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
         jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
      [authId, EMAIL]);
    const { rows: d } = await client.query(
      `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "fuenteContacto",
         "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Profesor', 'de prueba', true, 'universidad', 'PROFESOR', $3, NOW(), NOW())
       RETURNING id`, [authId, EMAIL, licenciaId]);

    await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Dietoterapia 3º A', '2026/27', '2027-08-31', NOW(), NOW())`,
      [d[0].id, licenciaId]);

    console.log(`
  Listo. En http://localhost:3001/login:

    Correo:      ${EMAIL}
    Contraseña:  ${PASS}

  Tiene la clase "Dietoterapia 3º A" con 30 plazas y ningún alumno.
  Para volver a empezar de cero, vuelve a lanzar este mismo comando.
`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
