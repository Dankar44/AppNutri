/**
 * Pruebas del módulo docente (#39 / issue #31) contra la base de DESARROLLO.
 *
 * En este proyecto no hay pruebas automáticas, y las pantallas se rompen por cosas que
 * `npx tsc --noEmit` no ve: una clave de traducción que falta, un redirect que no salta, una
 * página que revienta con datos límite. Esto carga las páginas de verdad por HTTP y comprueba
 * lo que sale, que es la única forma de cazarlas sin abrir el navegador.
 *
 * Cómo se usa:
 *   1. Levantar la aplicación contra desarrollo:  npm run dev:desarrollo   (puerto 3001)
 *   2. DB=dev npx tsx scripts/probar-modulo-docente.ts
 *
 * Crea sus propios datos (licencias "PRUEBA …" y una cuenta desechable) y los borra al acabar.
 * NO ejecutar con DB=prod: crearía cuentas y licencias en producción.
 */
import "./_guard";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";
import { createClient } from "@supabase/supabase-js";
import { SignJWT } from "jose";

const BASE = process.env.PRUEBAS_URL ?? "http://localhost:3001";
const EMAIL_PRUEBA = "profesor.prueba@annonia.dev";
const PASS_PRUEBA = "PruebaFase1_2026";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL!, ssl: { rejectUnauthorized: false } });

let ok = 0;
let mal = 0;
function comprobar(titulo: string, condicion: boolean, detalle = "") {
  console.log(`  ${condicion ? "✓" : "✗"} ${titulo}${detalle ? ` — ${detalle}` : ""}`);
  condicion ? ok++ : mal++;
}

/** El aviso de curso cerrado tal y como se pinta (el texto suelto también viaja en el HTML). */
const AVISO_CERRADO = /text-amber-900[^>]*>El curso está cerrado/;

/** React parte el texto con comentarios (`1<!-- -->/<!-- -->3`): hay que quitarlos para buscar. */
function limpio(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, "");
}

async function pedir(ruta: string, cookie?: string) {
  const res = await fetch(BASE + ruta, { headers: cookie ? { cookie } : {}, redirect: "manual" });
  const cuerpo = res.status === 200 ? limpio(await res.text()) : "";
  return {
    estado: res.status,
    destino: res.headers.get("location") ?? "",
    cookies: res.headers.getSetCookie?.().join(" | ") ?? "",
    cuerpo,
  };
}

/** Sesión de administrador firmada igual que `createAdminSession`. */
async function cookieAdmin(): Promise<string> {
  const email = (process.env.ADMIN_EMAILS ?? "").split(",")[0].trim();
  const token = await new SignJWT({ email, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("1d")
    .sign(new TextEncoder().encode(process.env.PATIENT_JWT_SECRET!));
  return `annonia-admin-session=${token}`;
}

/** Sesión de nutricionista con el formato de cookie de @supabase/ssr. */
async function cookieSesion(): Promise<string> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabase = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
  });
  const { data, error } = await supabase.auth.signInWithPassword({
    email: EMAIL_PRUEBA,
    password: PASS_PRUEBA,
  });
  if (error || !data.session) throw new Error(`No se ha podido iniciar sesión: ${error?.message}`);

  const ref = url.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];
  const valor = "base64-" + Buffer.from(JSON.stringify(data.session)).toString("base64");
  const nombre = `sb-${ref}-auth-token`;
  if (valor.length <= 3180) return `${nombre}=${valor}`;
  const trozos: string[] = [];
  for (let i = 0; i < valor.length; i += 3180) trozos.push(valor.slice(i, i + 3180));
  return trozos.map((t, i) => `${nombre}.${i}=${t}`).join("; ");
}

/** Cuenta desechable: la del colaborador no se toca. */
async function crearUsuarioPrueba(client: pg.PoolClient): Promise<string> {
  await borrarUsuarioPrueba(client);
  const { rows } = await client.query(
    `INSERT INTO auth.users (
       instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token
     ) VALUES (
       '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt($2, gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}',
       jsonb_build_object('nombre','Profesor','apellidos','Prueba','email_verified',true,'phone_verified',false),
       false, false, '', '', '', '', '', '', '', ''
     ) RETURNING id`,
    [EMAIL_PRUEBA, PASS_PRUEBA],
  );
  const authId = rows[0].id as string;
  await client.query(
    `INSERT INTO auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
     VALUES (gen_random_uuid(), $1::uuid, $1::text, 'email',
       jsonb_build_object('sub',$1::text,'email',$2::text,'email_verified',true,'provider','email'),
       NOW(), NOW(), NOW())`,
    [authId, EMAIL_PRUEBA],
  );
  // El id de `dietistas` lo genera Prisma en el cliente (@default(cuid())), no la base.
  const { rows: die } = await client.query(
    `INSERT INTO dietistas (id, "authId", email, nombre, apellidos, verificado, "createdAt", "updatedAt")
     VALUES (gen_random_uuid()::text, $1, $2, 'Profesor', 'Prueba', true, NOW(), NOW()) RETURNING id`,
    [authId, EMAIL_PRUEBA],
  );
  return die[0].id as string;
}

async function borrarUsuarioPrueba(client: pg.PoolClient) {
  const { rows } = await client.query(`SELECT id FROM auth.users WHERE email = $1`, [EMAIL_PRUEBA]);
  for (const r of rows) {
    await client.query(`DELETE FROM dietistas WHERE "authId" = $1`, [r.id]);
    await client.query(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, [r.id]);
    await client.query(`DELETE FROM auth.users WHERE id = $1::uuid`, [r.id]);
  }
}

async function main() {
  const client = await pool.connect();
  try {
    const dietistaId = await crearUsuarioPrueba(client);
    const sesion = await cookieSesion();
    const admin = await cookieAdmin();
    console.log(`\n── Cuenta de prueba lista (${EMAIL_PRUEBA}) ──`);

    // ─── 1. Sin rol docente: para un nutricionista normal no cambia nada ───
    console.log("\n── Nutricionista normal (sin rol) ──");
    const panelNormal = await pedir("/dashboard", sesion);
    comprobar("el panel responde 200", panelNormal.estado === 200, `estado ${panelNormal.estado}`);
    comprobar("NO aparece la sección Docencia en el menú", !panelNormal.cuerpo.includes(">Espacio docente<"));
    const profesorSinRol = await pedir("/profesor", sesion);
    comprobar("/profesor le echa al panel", profesorSinRol.destino.includes("/dashboard"), profesorSinRol.destino || `estado ${profesorSinRol.estado}`);

    // ─── 2. Licencia y rol ───
    await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %'`);
    const { rows: lic } = await client.query(
      `INSERT INTO licencias_docentes (institucion, "dominioEmail", "maxProfesores", "maxAlumnos", curso, "fechaFin")
       VALUES ('PRUEBA Universidad Rey Juan Carlos', 'urjc.es,alumnos.urjc.es', 3, 300, '2026/27', '2027-08-31') RETURNING id`,
    );
    const licenciaId = lic[0].id as string;
    const { rows: caducada } = await client.query(
      `INSERT INTO licencias_docentes (institucion, "maxProfesores", "maxAlumnos", curso, "fechaFin")
       VALUES ('PRUEBA Licencia caducada', 1, 0, '2025/26', '2026-08-01') RETURNING id`,
    );
    await client.query(
      `UPDATE dietistas SET "rolDocente" = 'PROFESOR', "licenciaDocenteId" = $1 WHERE id = $2`,
      [licenciaId, dietistaId],
    );

    // ─── 3. Panel de administración ───
    console.log("\n── Panel de administración ──");
    const lista = await pedir("/admin/universidades", admin);
    comprobar("/admin/universidades responde 200", lista.estado === 200, `estado ${lista.estado}`);
    comprobar("muestra la licencia creada", lista.cuerpo.includes("PRUEBA Universidad Rey Juan Carlos"));
    comprobar("muestra el contador de profesores 1/3", lista.cuerpo.includes("1/3"));
    comprobar("muestra el contador de alumnos 0/300", lista.cuerpo.includes("0/300"));

    const alta = await pedir("/admin/universidades/crear", admin);
    comprobar("el alta de licencia responde 200", alta.estado === 200, `estado ${alta.estado}`);
    comprobar("el formulario explica que el dominio no bloquea", alta.cuerpo.includes("nunca impide dar de alta"));

    const detalle = await pedir(`/admin/universidades/${licenciaId}`, admin);
    comprobar("el detalle responde 200", detalle.estado === 200, `estado ${detalle.estado}`);
    comprobar("lista al profesor asignado", detalle.cuerpo.includes(EMAIL_PRUEBA));
    comprobar("pinta los dos dominios", detalle.cuerpo.includes("@urjc.es") && detalle.cuerpo.includes("@alumnos.urjc.es"));
    comprobar("no pinta el aviso de cerrada (está vigente)", !/text-amber-900[^>]*>Licencia cerrada/.test(detalle.cuerpo));

    const detalleCaducada = await pedir(`/admin/universidades/${caducada[0].id}`, admin);
    comprobar("una licencia caducada responde 200", detalleCaducada.estado === 200);
    comprobar("y avisa de que está cerrada", /text-amber-900[^>]*>Licencia cerrada/.test(detalleCaducada.cuerpo));
    comprobar("con cupo de 0 alumnos no rompe", detalleCaducada.cuerpo.includes("/ 0"));

    const inexistente = await pedir("/admin/universidades/no-existe-12345", admin);
    comprobar("una licencia inexistente da 404", inexistente.estado === 404, `estado ${inexistente.estado}`);

    const ficha = await pedir(`/admin/dietistas/${dietistaId}`, admin);
    comprobar("la ficha del nutricionista responde 200", ficha.estado === 200);
    comprobar("y muestra el distintivo de profesor", ficha.cuerpo.includes("PRUEBA Universidad Rey Juan Carlos"));

    // ─── 4. Espacio del profesor ───
    console.log("\n── Espacio del profesor ──");
    const espacio = await pedir("/profesor", sesion);
    comprobar("el espacio docente responde 200", espacio.estado === 200, `estado ${espacio.estado}`);
    comprobar("muestra la institución", espacio.cuerpo.includes("PRUEBA Universidad Rey Juan Carlos"));
    comprobar("muestra la bolsa de alumnos", espacio.cuerpo.includes("/ 300"));
    comprobar("muestra el curso", espacio.cuerpo.includes("2026/27"));
    comprobar("ofrece el paso a la cuenta profesional", espacio.cuerpo.includes("Acceder a mi cuenta profesional"));
    comprobar("no avisa de curso cerrado (está vigente)", !AVISO_CERRADO.test(espacio.cuerpo));

    // ─── 5. Ir y volver entre los dos espacios ───
    console.log("\n── Los dos espacios ──");
    comprobar(
      "el espacio docente enlaza a la cuenta profesional",
      espacio.cuerpo.includes('href="/dashboard"') && espacio.cuerpo.includes("Acceder a mi cuenta profesional"),
    );

    const panelProfesor = await pedir("/dashboard", sesion);
    comprobar("el panel NO expulsa al profesor", panelProfesor.estado === 200 && !/http-equiv="refresh"/.test(panelProfesor.cuerpo), `estado ${panelProfesor.estado}`);
    comprobar("y desde el panel el menú lleva al espacio docente", panelProfesor.cuerpo.includes('href="/profesor"'));
    // Ninguna dirección del menú puede tener efectos secundarios: Next hace prefetch de los
    // enlaces visibles y los dispararía él solo (por eso se quitó el endpoint de cambio de espacio).
    comprobar("ningún enlace del menú apunta a un endpoint con efectos", !panelProfesor.cuerpo.includes("/api/espacio"));

    // ─── 6. Casos límite del profesor ───
    console.log("\n── Casos límite ──");
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2026-08-01' WHERE id = $1`, [licenciaId]);
    const cerrada = await pedir("/profesor", sesion);
    comprobar("con el curso cerrado sigue entrando", cerrada.estado === 200, `estado ${cerrada.estado}`);
    comprobar("y ve el aviso de curso cerrado", AVISO_CERRADO.test(cerrada.cuerpo));

    // Una licencia que termina HOY tiene que seguir valiendo hoy: la fecha se elige en un
    // selector de día y se guarda a medianoche, así que comparar tal cual la daría por caducada
    // durante todo su último día.
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = CURRENT_DATE WHERE id = $1`, [licenciaId]);
    const ultimoDia = await pedir("/profesor", sesion);
    comprobar("una licencia que acaba hoy sigue valiendo hoy", !AVISO_CERRADO.test(ultimoDia.cuerpo));
    await client.query(`UPDATE licencias_docentes SET "fechaFin" = '2026-08-01' WHERE id = $1`, [licenciaId]);

    await client.query(`UPDATE dietistas SET "licenciaDocenteId" = NULL WHERE id = $1`, [dietistaId]);
    const sinLicencia = await pedir("/profesor", sesion);
    comprobar("un profesor sin licencia no revienta", sinLicencia.estado === 200, `estado ${sinLicencia.estado}`);
    comprobar("y se le dice claramente", sinLicencia.cuerpo.includes("todavía no tiene una licencia asignada"));
    await client.query(`UPDATE dietistas SET "licenciaDocenteId" = $1 WHERE id = $2`, [licenciaId, dietistaId]);

    // ─── 7. Sin permisos ───
    console.log("\n── Sin permisos ──");
    const adminSinCookie = await pedir("/admin/universidades");
    comprobar("el panel de admin sin sesión redirige", adminSinCookie.estado >= 300 && adminSinCookie.estado < 400, `${adminSinCookie.estado} → ${adminSinCookie.destino}`);
    const profesorSinSesion = await pedir("/profesor");
    comprobar("/profesor sin sesión va a login", profesorSinSesion.destino.includes("/login"), profesorSinSesion.destino);
    // Redirección abierta: "origin" + "@evil.com" es una URL cuyo host es evil.com.
    for (const ataque of ["@evil.com", "//evil.com", "/\\evil.com", "https://evil.com"]) {
      const r = await pedir(`/auth/callback?error=x&next=${encodeURIComponent(ataque)}`);
      let host = "sin redirección";
      try { host = new URL(r.destino, BASE).host; } catch { host = "URL inválida"; }
      comprobar(`el callback no se deja sacar del dominio con next=${ataque}`, host === new URL(BASE).host, host);
    }

    // ─── 7bis. La puerta de entrada, /entrar ───
    console.log("\n── La puerta de entrada ──");
    const entrarSinSesion = await pedir("/entrar");
    comprobar("/entrar sin sesión acaba en el login", entrarSinSesion.destino.includes("/login") || entrarSinSesion.destino.includes("/dashboard"), entrarSinSesion.destino || `estado ${entrarSinSesion.estado}`);

    const entrarProfesor = await pedir("/entrar", sesion);
    comprobar("/entrar manda al profesor a su espacio", entrarProfesor.destino.includes("/profesor"), entrarProfesor.destino);

    await client.query(`UPDATE dietistas SET "rolDocente" = NULL WHERE id = $1`, [dietistaId]);
    const entrarNormal = await pedir("/entrar", sesion);
    comprobar("y a un nutricionista normal, al panel", entrarNormal.destino.includes("/dashboard"), entrarNormal.destino);

    // Una cuenta sin verificar no puede colarse en el espacio docente por la puerta nueva.
    await client.query(`UPDATE dietistas SET "rolDocente" = 'PROFESOR', verificado = false WHERE id = $1`, [dietistaId]);
    const sinVerificar = await pedir("/profesor", sesion);
    comprobar("un profesor sin verificar acaba en pendiente", sinVerificar.destino.includes("/pendiente"), sinVerificar.destino || `estado ${sinVerificar.estado}`);
    await client.query(`UPDATE dietistas SET verificado = true WHERE id = $1`, [dietistaId]);

    // ─── 8. Portugués (una clave que falte revienta la pantalla) ───
    console.log("\n── Portugués ──");
    const ptAdmin = await pedir("/admin/universidades", `${admin}; NEXT_LOCALE=pt`);
    comprobar("la lista de licencias carga en portugués", ptAdmin.estado === 200 && ptAdmin.cuerpo.includes("licenças docentes"), `estado ${ptAdmin.estado}`);
    const ptDetalle = await pedir(`/admin/universidades/${licenciaId}`, `${admin}; NEXT_LOCALE=pt`);
    comprobar("el detalle carga en portugués", ptDetalle.estado === 200 && ptDetalle.cuerpo.includes("Professores desta licença"), `estado ${ptDetalle.estado}`);
    const ptEspacio = await pedir("/profesor", `${sesion}; NEXT_LOCALE=pt`);
    comprobar("el espacio docente carga en portugués", ptEspacio.estado === 200 && ptEspacio.cuerpo.includes("Espaço docente"), `estado ${ptEspacio.estado}`);

    // ─── 9. Limpieza ───
    console.log("\n── Limpieza ──");
    await borrarUsuarioPrueba(client);
    await client.query(`DELETE FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %'`);
    const { rows: quedan } = await client.query(
      `SELECT (SELECT count(*)::int FROM licencias_docentes WHERE institucion LIKE 'PRUEBA %') AS lic,
              (SELECT count(*)::int FROM dietistas WHERE email = $1) AS cuentas`,
      [EMAIL_PRUEBA],
    );
    comprobar("no queda nada de la prueba", quedan[0].lic === 0 && quedan[0].cuentas === 0, `licencias ${quedan[0].lic}, cuentas ${quedan[0].cuentas}`);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
