// Carga .env y luego .env.local (este último manda), PERO respetando una DATABASE_URL que ya
// venga en el entorno. Antes esta línea llevaba `override: true` sin excepciones, así que
// machacaba cualquier variable indicada por delante del comando y TODOS los comandos de Prisma
// acababan apuntando a PRODUCCIÓN, aunque pidieras explícitamente otra base. Eso provocó un
// `prisma db push` accidental contra producción (18 ago 2026; sin daño, pero con un cambio
// destructivo de esquema habría borrado columnas con datos reales).
// Ahora: sin variable en el entorno el comportamiento es el de siempre (producción);
// con `DATABASE_URL=... npx prisma ...` se respeta lo que pidas.
import { config } from "dotenv";

const urlDelEntorno = process.env.DATABASE_URL;

config({ path: ".env" });
config({ path: ".env.local", override: true });

if (urlDelEntorno) process.env.DATABASE_URL = urlDelEntorno;

// Deja claro en pantalla a qué base se va a conectar antes de hacer nada (la falta de este
// aviso es lo que impidió detectar el fallo de arriba a tiempo).
const REF_PRODUCCION = "kzbrugggurcjwxsmutic";
const ref = process.env.DATABASE_URL?.match(/postgres\.([a-z0-9]+):/)?.[1] ?? "desconocida";
console.log(
  ref === REF_PRODUCCION
    ? `[prisma] ⚠️  BASE DE DATOS DESTINO: PRODUCCIÓN (${ref}) — datos reales de nutricionistas y pacientes`
    : `[prisma] base de datos destino: ${ref}`,
);

import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
