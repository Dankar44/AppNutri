/**
 * Monta una universidad de prueba entera y te da todas las llaves.
 *
 * Para probar a mano sin tener que inventarse correos ni pasar por el registro: las cuentas que
 * monta aquí nacen ya verificadas y entran directas. Las que se creen desde los enlaces sí piden
 * verificar el correo, como en producción; en local no hay servidor de correo, así que el enlace de
 * verificación sale en la propia pantalla y en el log del servidor.
 *
 *   DB=dev npx tsx scripts/preparar-banco-de-pruebas.ts                 (2 profesores, 4 alumnos)
 *   DB=dev npx tsx scripts/preparar-banco-de-pruebas.ts 3 10            (3 y 10)
 *
 * Deja: la universidad con sus plazas justas, los profesores, una clase con alumnos dentro, los dos
 * enlaces (el de profesorado y el de la clase) y una cuenta de nutricionista normal para probar el
 * caso de "ya usa Annonia". Lanzarlo otra vez borra lo anterior y lo deja limpio.
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const MARCA = "BANCO";
const DOMINIO = "banco.dev";
const PASS = "Banco2026";
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

const nProfes = Math.max(1, Math.min(Number(process.argv[2]) || 2, 10));
const nAlumnos = Math.max(1, Math.min(Number(process.argv[3]) || 4, 40));

async function main() {
  const c = await pool.connect();
  try {
    await limpiar(c);

    // Las plazas, justas a lo que se monta: así se ve enseguida qué pasa al llenarlas.
    const { rows: lic } = await c.query(
      `INSERT INTO licencias_docentes (id, institucion, "personaContacto", "maxProfesores", "maxAlumnos", activa, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Universidad de pruebas', 'Representante', $1, $2, true, $3::date, $4::date, NOW(), NOW())
       RETURNING id`, [nProfes, nAlumnos, `${anioDelCurso()}-09-01`, finDeCurso()]);
    const licenciaId = lic[0].id as string;

    const profes: string[] = [];
    for (let i = 1; i <= nProfes; i++) {
      const email = `profe${i}@${DOMINIO}`;
      await cuenta(c, email, `Profesor ${i}`, "PROFESOR", licenciaId);
      profes.push(email);
    }
    const { rows: p1 } = await c.query(`SELECT id FROM dietistas WHERE email = $1`, [profes[0]]);

    // Una clase del primer profesor, con su enlace abierto y su cupo propio.
    const { rows: clase } = await c.query(
      `INSERT INTO clases (id, "profesorId", "licenciaDocenteId", nombre, "fechaInicioCurso", "fechaFinCurso",
              "invitacionAbierta", "tokenInvitacion", "cupoEnlace", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, '${MARCA} Clase de pruebas', CURRENT_DATE, $3::date,
               true, replace(gen_random_uuid()::text,'-',''), $4, NOW(), NOW())
       RETURNING id, "tokenInvitacion"`,
      [p1[0].id, licenciaId, finDeCurso(), nAlumnos]);
    await c.query(
      `INSERT INTO profesores_clase (id, "claseId", "profesorId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())`, [clase[0].id, p1[0].id]);

    // La mitad de los alumnos dentro; la otra mitad de plazas, libres para probar el enlace.
    const dentro = Math.max(1, Math.floor(nAlumnos / 2));
    const alumnos: string[] = [];
    for (let i = 1; i <= dentro; i++) {
      const email = `alumno${i}@${DOMINIO}`;
      const id = await cuenta(c, email, `Alumno ${i}`, "ALUMNO", licenciaId);
      await c.query(
        `INSERT INTO alumnos_clase (id, "claseId", "alumnoId", activa, "altaAt", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, true, NOW(), NOW(), NOW())`, [clase[0].id, id]);
      alumnos.push(email);
    }

    // Y una cuenta de nutricionista SIN rol: es la que hace falta para probar "ya uso Annonia".
    const normal = `nutri@${DOMINIO}`;
    await cuenta(c, normal, "Nutricionista", null, null);

    // Las demás situaciones en las que alguien puede abrir un enlace ya con la sesión puesta.
    // Cada una ve una cosa distinta, y es donde se esconden los callejones sin salida
    // (Guillermo, 9 sep 2026: "quiero mirar todos los ángulos posibles").
    const { rows: otraLic } = await c.query(
      `INSERT INTO licencias_docentes (id, institucion, "maxProfesores", "maxAlumnos", activa, "fechaInicio", "fechaFin", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, '${MARCA} Otra universidad', 3, 10, true, $1::date, $2::date, NOW(), NOW())
       RETURNING id`, [`${anioDelCurso()}-09-01`, finDeCurso()]);
    const profeOtra = `profe.otrauni@${DOMINIO}`;
    await cuenta(c, profeOtra, "De otra universidad", "PROFESOR", otraLic[0].id);
    const profeSinUni = `profe.sinuni@${DOMINIO}`;
    const sinUniId = await cuenta(c, profeSinUni, "Sin universidad", "PROFESOR", null);
    // Se fue de su facultad este curso, así que conserva el espacio docente hasta el 31 de agosto:
    // sin esa fecha sería un profesor al que ya se le acabó el plazo, que es otro caso distinto.
    await c.query(`UPDATE dietistas SET "docenciaHasta" = $2 WHERE id = $1`, [sinUniId, finDeCurso()]);
    const profeCaducado = `profe.plazoacabado@${DOMINIO}`;
    const caducadoId = await cuenta(c, profeCaducado, "Con el plazo acabado", "PROFESOR", null);
    await c.query(`UPDATE dietistas SET "docenciaHasta" = '2020-08-31' WHERE id = $1`, [caducadoId]);

    // Un alumno de otra facultad: se puede apuntar igual, un alumno no está atado a una sola.
    const alumnoOtra = `alumno.otrauni@${DOMINIO}`;
    await cuenta(c, alumnoOtra, "De otra universidad", "ALUMNO", otraLic[0].id);

    // El enlace de profesorado, con plazas de sobra para que puedas probarlo.
    const { rows: enl } = await c.query(
      `INSERT INTO enlaces_profesores (id, "licenciaDocenteId", token, "cursoAnio", plazas, "creadoPor")
       VALUES (gen_random_uuid()::text, $1, replace(gen_random_uuid()::text,'-',''), $2, 2, 'banco')
       RETURNING token`, [licenciaId, anioDelCurso()]);
    await c.query(`UPDATE licencias_docentes SET "maxProfesores" = "maxProfesores" + 2 WHERE id = $1`, [licenciaId]);

    const base = "http://localhost:3001";
    const plazasProfe = nProfes + 2;
    console.log(`
  ══════════════════════════════════════════════════════════════
   ${MARCA} · universidad de pruebas lista
  ══════════════════════════════════════════════════════════════

   Todas las cuentas usan la misma contraseña:  ${PASS}
   Entra en ${base}/login

   PROFESORES — ${plazasProfe} plazas en la universidad, ${nProfes} ya ocupadas por estos:
${profes.map((e) => `     ${e}`).join("\n")}
   Quedan ${plazasProfe - nProfes} libres. El admin enseña esa cuenta (los de arriba + tú si
   entras por el enlace), no los usos del enlace: el tope es la universidad entera.

   ALUMNOS — ${nAlumnos} plazas, ${dentro} ya ocupadas por estos:
${alumnos.map((e) => `     ${e}`).join("\n")}
   Quedan ${nAlumnos - dentro} libres.

   NUTRICIONISTA SIN ROL — para probar «ya uso Annonia»
     ${normal}

   Y PARA VER QUÉ PASA CON LA SESIÓN YA PUESTA (abre los enlaces con cada una):
     ${profes[0]}  → profesor de ESTA universidad
     ${profeOtra}  → profesor de OTRA universidad
     ${profeSinUni}  → profesor que se fue de su facultad (conserva el espacio hasta agosto)
     ${profeCaducado}  → profesor al que ya se le acabó el plazo (ya no tiene espacio docente)
     ${alumnos[0]}  → alumno YA matriculado en esta clase
     ${alumnoOtra}  → alumno de otra facultad
     ${normal}  → nutricionista sin nada de docencia

   ENLACE DE PROFESORADO (2 usos)
${base}/profesorado/${enl[0].token}

   ENLACE DE LA CLASE (cupo ${nAlumnos})
${base}/clase/${clase[0].tokenInvitacion}

   Al darte de alta por un enlace se te pedirá verificar el correo. Aquí no hay servidor de
   correo, así que en esa misma pantalla te sale el enlace de verificación para pulsarlo.

   ADMIN
     ${base}/admin-login  ·  la universidad se llama «${MARCA} Universidad de pruebas»

   Para empezar de cero: vuelve a lanzar este mismo comando.
`);
  } finally {
    c.release();
    await pool.end();
  }
}

/** El año en que empieza el curso en el que estamos: 2026 es el curso 2026/27. */
function anioDelCurso(hoy = new Date()): number {
  return hoy.getUTCMonth() >= 8 ? hoy.getUTCFullYear() : hoy.getUTCFullYear() - 1;
}

/** El 31 de agosto con el que acaba el curso en el que estamos. */
function finDeCurso(): string {
  return `${anioDelCurso() + 1}-08-31`;
}

/** Una cuenta de verdad, con su usuario de autenticación, lista para entrar. */
async function cuenta(c: pg.PoolClient, email: string, apellidos: string, rol: string | null, licenciaId: string | null) {
  const { rows: u } = await c.query(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`, [email, PASS]);
  const authId = u[0].id as string;
  await c.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'), NOW(), NOW(), NOW())`,
    [authId, email]);
  const { rows } = await c.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "rolDocente", "licenciaDocenteId", "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, '${MARCA}', $3, true, $4::"RolDocente", $5, NOW(), NOW()) RETURNING id`,
    [authId, email, apellidos, rol, licenciaId]);
  return rows[0].id as string;
}

async function limpiar(c: pg.PoolClient) {
  await c.query(`DELETE FROM clases WHERE nombre LIKE '${MARCA}%'`);
  await c.query(`DELETE FROM enlaces_profesores WHERE "licenciaDocenteId" IN (SELECT id FROM licencias_docentes WHERE institucion LIKE '${MARCA}%')`);
  const { rows } = await c.query(`SELECT "authId" FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM pacientes WHERE "dietistaId" IN (SELECT id FROM dietistas WHERE email LIKE $1)`, [`%@${DOMINIO}`]);
  await c.query(`DELETE FROM dietistas WHERE email LIKE $1`, [`%@${DOMINIO}`]);
  for (const r of rows) {
    if (!r.authId) continue;
    await c.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.authId]);
    await c.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.authId]);
  }
  await c.query(`DELETE FROM licencias_docentes WHERE institucion LIKE '${MARCA}%'`);
}

main().catch((e) => { console.error(e); process.exit(1); });
