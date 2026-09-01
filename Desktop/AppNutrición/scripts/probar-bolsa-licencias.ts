/**
 * #39 — Comprueba las dos reglas de la bolsa de licencias, que son las que deciden lo que se cobra:
 *
 *   1. Un alumno en DOS clases consume UNA licencia, no dos.
 *   2. A quien se le ha retirado el acceso no ocupa plaza (pero conserva sus datos).
 *
 * Contarlas mal significa cobrar mal, así que se comprueban con filas de verdad.
 *
 *   DB=dev npx tsx scripts/probar-bolsa-licencias.ts
 */
import "./_guard-solo-dev";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL! }) });
const MARCA = "bolsa.prueba";

let ok = 0, mal = 0;
const comprobar = (t: string, c: boolean, d = "") => { console.log(`  ${c ? "✓" : "✗"} ${t}${d ? ` — ${d}` : ""}`); c ? ok++ : mal++; };

/** La misma regla que `contarAlumnosDeLicencia`, aquí para poder probarla sin levantar la app. */
async function contarAlumnos(licenciaId: string) {
  const alumnos = await prisma.dietista.findMany({
    where: {
      rolDocente: "ALUMNO",
      matriculas: { some: { activa: true, clase: { licenciaDocenteId: licenciaId, archivada: false } } },
    },
    select: { id: true },
  });
  return alumnos.length;
}

async function crearAlumno(nombre: string) {
  const rows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
       created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
       confirmation_token, recovery_token, email_change_token_new, email_change,
       email_change_token_current, reauthentication_token, phone_change, phone_change_token)
     VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
       $1, crypt('x', gen_salt('bf')), NOW(), NOW(), NOW(),
       '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
     RETURNING id`,
    `${MARCA}.${nombre}@annonia.dev`,
  );
  return prisma.dietista.create({
    data: {
      authId: rows[0].id,
      email: `${MARCA}.${nombre}@annonia.dev`,
      nombre: "Alumno",
      apellidos: nombre,
      verificado: true,
      rolDocente: "ALUMNO",
      cuentaDeClase: true,
    },
  });
}

async function limpiar() {
  await prisma.clase.deleteMany({ where: { nombre: { startsWith: "PRUEBA bolsa" } } });
  await prisma.licenciaDocente.deleteMany({ where: { institucion: "PRUEBA Bolsa" } });
  const cuentas = await prisma.dietista.findMany({ where: { email: { startsWith: MARCA } }, select: { id: true, authId: true } });
  for (const c of cuentas) {
    await prisma.dietista.delete({ where: { id: c.id } });
    await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, c.authId);
    await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, c.authId);
  }
  // Profesor de prueba
  const profes = await prisma.dietista.findMany({ where: { email: { startsWith: "bolsa.profe" } }, select: { id: true, authId: true } });
  for (const c of profes) {
    await prisma.dietista.delete({ where: { id: c.id } });
    await prisma.$queryRawUnsafe(`DELETE FROM auth.identities WHERE user_id = $1::uuid`, c.authId);
    await prisma.$queryRawUnsafe(`DELETE FROM auth.users WHERE id = $1::uuid`, c.authId);
  }
}

async function main() {
  try {
    await limpiar();

    const licencia = await prisma.licenciaDocente.create({
      data: { institucion: "PRUEBA Bolsa", maxProfesores: 2, maxAlumnos: 10, curso: "2026/27" },
    });

    const authProf = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `INSERT INTO auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
         created_at, updated_at, raw_app_meta_data, raw_user_meta_data, is_sso_user, is_anonymous,
         confirmation_token, recovery_token, email_change_token_new, email_change,
         email_change_token_current, reauthentication_token, phone_change, phone_change_token)
       VALUES ('00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
         'bolsa.profe@annonia.dev', crypt('x', gen_salt('bf')), NOW(), NOW(), NOW(),
         '{"provider":"email","providers":["email"]}', '{}'::jsonb, false, false, '','','','','','','','')
       RETURNING id`);
    const profesor = await prisma.dietista.create({
      data: {
        authId: authProf[0].id, email: "bolsa.profe@annonia.dev", nombre: "Profe", apellidos: "Bolsa",
        verificado: true, rolDocente: "PROFESOR", licenciaDocenteId: licencia.id,
      },
    });

    const claseA = await prisma.clase.create({
      data: { profesorId: profesor.id, licenciaDocenteId: licencia.id, nombre: "PRUEBA bolsa A", curso: "2026/27" },
    });
    const claseB = await prisma.clase.create({
      data: { profesorId: profesor.id, licenciaDocenteId: licencia.id, nombre: "PRUEBA bolsa B", curso: "2026/27" },
    });

    console.log("\n── Un alumno en dos clases ──");
    const ana = await crearAlumno("ana");
    await prisma.alumnoClase.create({ data: { claseId: claseA.id, alumnoId: ana.id } });
    comprobar("con una matrícula consume 1", (await contarAlumnos(licencia.id)) === 1);
    await prisma.alumnoClase.create({ data: { claseId: claseB.id, alumnoId: ana.id } });
    comprobar("con DOS matrículas sigue consumiendo 1", (await contarAlumnos(licencia.id)) === 1, "no puede contar doble");

    console.log("\n── Un segundo alumno ──");
    const luis = await crearAlumno("luis");
    await prisma.alumnoClase.create({ data: { claseId: claseA.id, alumnoId: luis.id } });
    comprobar("ahora consume 2", (await contarAlumnos(licencia.id)) === 2);

    console.log("\n── Retirar el acceso libera plaza, sin borrar nada ──");
    await prisma.alumnoClase.updateMany({ where: { alumnoId: luis.id }, data: { activa: false, bajaAt: new Date() } });
    comprobar("vuelve a consumir 1", (await contarAlumnos(licencia.id)) === 1);
    const sigueVivo = await prisma.dietista.findUnique({ where: { id: luis.id }, select: { id: true } });
    comprobar("pero su cuenta sigue existiendo", sigueVivo !== null);
    const matriculasIntactas = await prisma.alumnoClase.count({ where: { alumnoId: luis.id } });
    comprobar("y su matrícula también, solo desactivada", matriculasIntactas === 1);

    console.log("\n── Devolverle el acceso ──");
    await prisma.alumnoClase.updateMany({ where: { alumnoId: luis.id }, data: { activa: true, bajaAt: null } });
    comprobar("vuelve a consumir 2", (await contarAlumnos(licencia.id)) === 2);

    console.log("\n── Archivar la clase ──");
    await prisma.clase.update({ where: { id: claseA.id }, data: { archivada: true, archivadaAt: new Date() } });
    comprobar("Ana sigue contando por su clase B", (await contarAlumnos(licencia.id)) === 1, "Luis solo estaba en A");

    console.log("\n── Limpieza ──");
    await limpiar();
    const quedan = await prisma.licenciaDocente.count({ where: { institucion: "PRUEBA Bolsa" } });
    comprobar("no queda nada de la prueba", quedan === 0);

    console.log(`\n${mal === 0 ? "✓ TODO CORRECTO" : "✗ HAY FALLOS"} — ${ok} bien, ${mal} mal\n`);
    if (mal > 0) process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exitCode = 1; });
