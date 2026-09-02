/**
 * #39 — Deja listas las cuentas de DESARROLLO para probar el módulo docente a mano.
 *
 *   DB=dev npx tsx scripts/preparar-prueba-docente.ts
 *
 * Crea (o rehace) una universidad, un profesor con su clase y una alumna ya matriculada en ella,
 * las dos con contraseña. Repetirlo borra lo anterior y lo deja limpio, así que se puede lanzar
 * tantas veces como haga falta. Solo con DB=dev.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const PROFESOR = { email: "profesor.prueba@annonia.dev", pass: "ProfesorPrueba2026", nombre: "Profesor", apellidos: "de prueba" };
const ALUMNA = { email: "alumna.prueba@annonia.dev", pass: "AlumnaPrueba2026", nombre: "Alumna", apellidos: "de prueba" };
const INSTITUCION = "Universidad de prueba (Guillermo)";

/** Crea el usuario de autenticación y su ficha. Devuelve el id del dietista. */
async function crearCuenta(
  client: pg.PoolClient,
  quien: { email: string; pass: string; nombre: string; apellidos: string },
  extra: Record<string, unknown>,
) {
  const { rows: u } = await client.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [quien.email, quien.pass]);
  const authId = u[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, quien.email]);

  const campos = Object.keys(extra);
  const { rows } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "fuenteContacto", "createdAt", "updatedAt"${campos.map((c) => `, "${c}"`).join("")})
     VALUES (gen_random_uuid()::text, $1, $2, $3, $4, true, 'universidad', NOW(), NOW()${campos.map((_, i) => `, $${5 + i}`).join("")})
     RETURNING id`,
    [authId, quien.email, quien.nombre, quien.apellidos, ...campos.map((c) => extra[c])]);
  return rows[0].id as string;
}

async function main() {
  const client = await pool.connect();
  try {
    // Limpieza de la vez anterior, para que la prueba empiece siempre igual.
    await client.query(`DELETE FROM clases WHERE nombre LIKE 'Dietoterapia 3º A%'`);
    await client.query(`DELETE FROM casos_clinicos WHERE nombre LIKE 'Caso 3: mujer vegana%'`);
    for (const quien of [PROFESOR, ALUMNA]) {
      const { rows: viejos } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [quien.email]);
      for (const v of viejos) {
        await client.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE "authId" = $1)`, [v.id]);
        await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [v.id]);
        await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [v.id]);
        await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [v.id]);
      }
    }
    await client.query(`DELETE FROM licencias_docentes WHERE institucion = $1`, [INSTITUCION]);

    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (id, institucion, "personaContacto", "maxProfesores", "maxAlumnos",
         curso, "fechaFin", "dominioEmail", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Guillermo', 3, 30, '2026/27', '2027-08-31', 'urjc.es,alumnos.urjc.es', NOW(), NOW())
       RETURNING id`, [INSTITUCION]);
    const licenciaId = lic[0].id as string;

    const profesorId = await crearCuenta(client, PROFESOR, {
      rolDocente: "PROFESOR",
      licenciaDocenteId: licenciaId,
    });

    const { rows: cl } = await client.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, curso, "fechaFinCurso", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Dietoterapia 3º A', '2026/27', '2027-08-31', NOW(), NOW())
       RETURNING id`, [profesorId, licenciaId]);
    const claseId = cl[0].id as string;
    await client.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [claseId, profesorId]);

    // La alumna, ya matriculada: igual que si el profesor la hubiese dado de alta por correo y
    // ella hubiese aceptado. `cuentaDeClase` marca que su cuenta nació en el aula.
    const alumnaId = await crearCuenta(client, ALUMNA, {
      rolDocente: "ALUMNO",
      licenciaDocenteId: licenciaId,
      cuentaDeClase: true,
    });
    await client.query(
      `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", "altaAt") VALUES (gen_random_uuid()::text, $1, $2, NOW())`,
      [claseId, alumnaId]);

    // Un caso ya creado, con su paciente plantilla rellenado como lo haría el profesor.
    const { rows: pl } = await client.query(
      `INSERT INTO pacientes (id, "dietistaId", nombre, apellidos, sexo, peso, altura, objetivo, "nivelActividad",
         patologias, notas, "esCasoDocente", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, 'Marta', 'Vegana', 'FEMENINO', 58, 165, 'PATOLOGIA',
         'Sedentaria, camina 30 min al día', ARRAY['Anemia ferropénica'],
         'Mujer de 28 años, vegana desde hace tres. Acude por cansancio y analítica con ferritina baja (9 ng/ml).',
         true, NOW(), NOW()) RETURNING id`, [profesorId]);
    await client.query(
      `INSERT INTO medidas_antropometricas (id, "pacienteId", fecha, peso, altura, "createdAt")
       VALUES (gen_random_uuid()::text, $1, NOW() - INTERVAL '7 days', 58, 165, NOW())`, [pl[0].id]);
    const { rows: caso } = await client.query(
      `INSERT INTO casos_clinicos (id, "profesorId", "licenciaDocenteId", nombre, consigna, "pacienteId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'Caso 3: mujer vegana con anemia',
         'Haz un plan semanal cubriendo el hierro con alimentos vegetales y explica la pauta de suplementación.',
         $3, NOW(), NOW()) RETURNING id`, [profesorId, licenciaId, pl[0].id]);
    await client.query(
      `INSERT INTO asignaciones_caso (id, "casoId", "claseId", "fechaLimite", "asignadoPor", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, CURRENT_DATE + 10, $3, NOW(), NOW())`,
      [caso[0].id, claseId, profesorId]);

    console.log(`
  Listo. En http://localhost:3001/login:

    PROFESOR   ${PROFESOR.email}   /  ${PROFESOR.pass}
    ALUMNA     ${ALUMNA.email}     /  ${ALUMNA.pass}

  La clase "Dietoterapia 3º A" tiene 30 plazas, a la alumna ya dentro, y un caso asignado
  ("Caso 3: mujer vegana con anemia", con su paciente rellenado) con 10 días de plazo.
  Para volver a empezar de cero, vuelve a lanzar este mismo comando.
`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
