// Carga .env y luego .env.local (este último tiene prioridad)
import { config } from "dotenv";
config({ path: ".env" });
config({ path: ".env.local", override: true });

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
