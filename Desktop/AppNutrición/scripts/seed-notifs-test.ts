// Crea notificaciones de prueba para verificar:
//  - Dot rojo en listado de pacientes
//  - Tooltip al hover
//  - Auto-mark al entrar en ficha
//  - Botón ✓ hover en /notificaciones
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Elegir dietista: primero por email, si no el primero
  const emailArg = process.argv[2];
  const dietista = emailArg
    ? await prisma.dietista.findFirst({
        where: { email: emailArg },
        select: { id: true, nombre: true, email: true },
      })
    : await prisma.dietista.findFirst({
        where: { email: { contains: "gprieto" } },
        select: { id: true, nombre: true, email: true },
      }) ||
      (await prisma.dietista.findFirst({ select: { id: true, nombre: true, email: true } }));
  if (!dietista) {
    console.error("No hay dietistas en BD");
    process.exit(1);
  }
  console.log(`→ Usando dietista: ${dietista.nombre} (${dietista.email})`);

  // Coger hasta 2 pacientes del dietista
  const pacientes = await prisma.paciente.findMany({
    where: { dietistaId: dietista.id, activo: true },
    select: { id: true, nombre: true, apellidos: true },
    take: 2,
  });
  if (pacientes.length === 0) {
    console.error("No hay pacientes activos. Crea al menos uno antes.");
    process.exit(1);
  }

  const p1 = pacientes[0];
  const p2 = pacientes[1]; // puede ser undefined

  // Limpiar notifs previas para que los tests sean idempotentes
  await prisma.notificacion.deleteMany({
    where: {
      dietistaId: dietista.id,
      titulo: { startsWith: "[TEST]" },
    },
  });

  // 4 notificaciones para p1 (probar tooltip con 3 + "y 1 más")
  const datos = [
    {
      dietistaId: dietista.id,
      pacienteId: p1.id,
      tipo: "PACIENTE_SIN_MEDIDAS" as const,
      titulo: "[TEST] Sin medidas recientes",
      mensaje: `${p1.nombre} ${p1.apellidos} lleva >30 días sin medidas`,
      enlace: `/pacientes/${p1.id}/medidas`,
    },
    {
      dietistaId: dietista.id,
      pacienteId: p1.id,
      tipo: "PACIENTE_SIN_CONSULTA" as const,
      titulo: "[TEST] Sin consulta reciente",
      mensaje: `${p1.nombre} ${p1.apellidos} lleva >30 días sin consulta`,
      enlace: `/pacientes/${p1.id}`,
    },
    {
      dietistaId: dietista.id,
      pacienteId: p1.id,
      tipo: "DIARIO_NUEVO" as const,
      titulo: "[TEST] Nuevo seguimiento diario",
      mensaje: `${p1.nombre} ${p1.apellidos} registró su seguimiento hoy`,
      enlace: `/pacientes/${p1.id}/seguimiento`,
    },
    {
      dietistaId: dietista.id,
      pacienteId: p1.id,
      tipo: "PLAN_ANTIGUO" as const,
      titulo: "[TEST] Plan antiguo",
      mensaje: `Revisar plan alimenticio de ${p1.nombre}`,
      enlace: `/pacientes/${p1.id}`,
    },
  ];
  if (p2) {
    datos.push({
      dietistaId: dietista.id,
      pacienteId: p2.id,
      tipo: "PACIENTE_SIN_MEDIDAS" as const,
      titulo: "[TEST] Sin medidas recientes",
      mensaje: `${p2.nombre} ${p2.apellidos} lleva >30 días sin medidas`,
      enlace: `/pacientes/${p2.id}/medidas`,
    });
  }

  await prisma.notificacion.createMany({ data: datos });

  console.log(`✓ Notificaciones [TEST] creadas para dietista ${dietista.nombre}`);
  console.log(`  · ${p1.nombre} ${p1.apellidos} — 4 notifs (dot + tooltip con 3 + "y 1 más")`);
  if (p2) {
    console.log(`  · ${p2.nombre} ${p2.apellidos} — 1 notif (dot + tooltip simple)`);
  }
  console.log(`\nPruebas a hacer:`);
  console.log(`  1. Abre /pacientes → debería verse el dot rojo encima del avatar de ${p1.nombre}.`);
  console.log(`  2. Pasa el ratón por el dot → tooltip con 3 mensajes + "y 1 más".`);
  console.log(`  3. Abre /notificaciones → hover sobre una notificación → aparecen iconos ✓ y 🗑️.`);
  console.log(`  4. Click en ✓ → la notificación se marca como leída (no navega).`);
  console.log(`  5. Click en la notificación completa → navega Y marca como leída.`);
  console.log(`  6. Entra en la ficha de ${p1.nombre} → TODAS las notifs del paciente se marcan leídas al volver a /pacientes el dot desaparece.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
