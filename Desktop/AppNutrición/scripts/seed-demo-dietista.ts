/**
 * Crea un dietista demo para el modo demo público (/demo).
 *
 * Uso:
 *   npx tsx scripts/seed-demo-dietista.ts
 *
 * Al terminar imprime el DEMO_DIETISTA_ID que hay que añadir al .env.
 * Si ya existe un dietista demo (por email), reutiliza el existente.
 *
 * El "Paciente Prueba" con 5 planes, medidas, citas, etc. se crea
 * automáticamente al primer acceso a /demo (via crearPacienteDemoSiNoExiste).
 *
 * Este script añade ADEMÁS:
 *  - 2 pacientes extra con perfiles distintos
 *  - 5 recetas propias del dietista
 *  - 2 plantillas
 */
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

const DEMO_EMAIL = "demo-showcase@annonia.com";

function buscarAlimento(client: pg.PoolClient, nombre: string) {
  return client.query(
    `SELECT id FROM alimentos WHERE nombre ILIKE $1 LIMIT 1`,
    [`%${nombre}%`],
  ).then(r => r.rows[0]?.id as string | undefined);
}

async function main() {
  const client = await pool.connect();
  try {
    // ─── 1. Dietista ───────────────────────────────────────────────────
    const existing = await client.query(
      `SELECT id FROM dietistas WHERE email = $1 LIMIT 1`,
      [DEMO_EMAIL],
    );

    let dietistaId: string;

    if (existing.rows[0]) {
      dietistaId = existing.rows[0].id;
      console.log(`Dietista demo ya existe: ${dietistaId}`);
    } else {
      const result = await client.query(
        `INSERT INTO dietistas (
          id, "authId", email, nombre, apellidos, especialidad, "numColegiado",
          verificado, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, 'Dra. Ana', 'García López',
          'Nutrición clínica y deportiva', 'ESP-12345',
          true, NOW(), NOW()
        ) RETURNING id`,
        [`demo-auth-${Date.now()}`, DEMO_EMAIL],
      );
      dietistaId = result.rows[0].id;
      console.log(`Dietista demo creado: ${dietistaId}`);
    }

    // ─── 2. Pacientes extra ──────────────────────────────────────────
    const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
    const COMIDAS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA"];

    const pacientes = [
      {
        nombre: "Laura", apellidos: "Martínez Ruiz",
        email: "laura.martinez@demo.annonia.com", telefono: "+34 612 345 678",
        sexo: "FEMENINO", fechaNac: "1988-03-22", altura: 163, peso: 62,
        objetivo: "GANAR_MASA", objetivoDetalle: "Aumentar masa muscular para mejorar rendimiento deportivo",
        actividad: "alto", ejercicio: "5 veces por semana", tipoEj: "CrossFit y running",
        ocupacion: "Fisioterapeuta",
        preferencias: ["Alta en proteína", "Sin gluten", "Alimentos integrales"],
        alergias: ["Gluten (celiaquía diagnosticada)"],
        intolerancias: [] as string[],
        patologias: ["Celiaquía"],
        notas: "Paciente muy comprometida con su alimentación. Compite en CrossFit amateur.",
        planNombre: "Plan hiperproteico — celíaca",
        planKcal: 2400, planProt: 160, planCarb: 280, planGrasa: 70,
      },
      {
        nombre: "Carlos", apellidos: "Fernández Díaz",
        email: "carlos.fernandez@demo.annonia.com", telefono: "+34 634 567 890",
        sexo: "MASCULINO", fechaNac: "1975-11-08", altura: 180, peso: 95,
        objetivo: "PERDER_PESO", objetivoDetalle: "Reducir peso y controlar glucosa en sangre",
        actividad: "sedentario", ejercicio: "2 veces por semana", tipoEj: "Caminata suave",
        ocupacion: "Conductor de autobús",
        preferencias: ["Mediterránea", "Comidas sencillas", "Poca cocina"],
        alergias: [] as string[],
        intolerancias: ["Lactosa"],
        patologias: ["Diabetes tipo 2", "Hipertensión"],
        notas: "Necesita recetas fáciles y rápidas por horarios irregulares de trabajo.",
        planNombre: "Plan control glucémico",
        planKcal: 1800, planProt: 120, planCarb: 180, planGrasa: 65,
      },
    ];

    for (const p of pacientes) {
      const existePac = await client.query(
        `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND nombre = $2 AND apellidos = $3 LIMIT 1`,
        [dietistaId, p.nombre, p.apellidos],
      );
      if (existePac.rows[0]) {
        console.log(`Paciente ${p.nombre} ${p.apellidos} ya existe`);
        continue;
      }

      const pacRes = await client.query(
        `INSERT INTO pacientes (
          id, "dietistaId", nombre, apellidos, email, telefono, sexo,
          "fechaNacimiento", altura, peso, objetivo, "objetivoDetalle",
          "nivelActividad", "frecuenciaEjercicio", "tipoEjercicio", ocupacion,
          preferencias, alergias, intolerancias, patologias,
          notas, activo, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16::text[], $17::text[], $18::text[], $19::text[],
          $20, true, NOW(), NOW()
        ) RETURNING id`,
        [
          dietistaId, p.nombre, p.apellidos, p.email, p.telefono, p.sexo,
          p.fechaNac, p.altura, p.peso, p.objetivo, p.objetivoDetalle,
          p.actividad, p.ejercicio, p.tipoEj, p.ocupacion,
          p.preferencias, p.alergias, p.intolerancias, p.patologias,
          p.notas,
        ],
      );
      const pacId = pacRes.rows[0].id;
      console.log(`Paciente ${p.nombre} creado: ${pacId}`);

      // Plan con días y comidas vacíos
      const planRes = await client.query(
        `INSERT INTO planes_alimenticios (
          id, "dietistaId", "pacienteId", nombre,
          "caloriasObjetivo", "proteinasObjetivo", "carbohidratosObjetivo", "grasasObjetivo",
          activo, "createdAt", "updatedAt"
        ) VALUES (
          gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, true, NOW(), NOW()
        ) RETURNING id`,
        [dietistaId, pacId, p.planNombre, p.planKcal, p.planProt, p.planCarb, p.planGrasa],
      );
      const planId = planRes.rows[0].id;

      for (const dia of DIAS) {
        const diaRes = await client.query(
          `INSERT INTO dias_del_plan (id, "planId", dia)
           VALUES (gen_random_uuid()::text, $1, $2) RETURNING id`,
          [planId, dia],
        );
        const diaId = diaRes.rows[0].id;
        for (let i = 0; i < COMIDAS.length; i++) {
          await client.query(
            `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden)
             VALUES (gen_random_uuid()::text, $1, $2, $3)`,
            [diaId, COMIDAS[i], i],
          );
        }
      }
      console.log(`  Plan "${p.planNombre}" con 7 días creado`);

      // Medidas (3 registros)
      const now = new Date();
      const medidasPac = [
        { diasAtras: 30, peso: p.peso + 2, imc: ((p.peso + 2) / (p.altura / 100) ** 2).toFixed(1) },
        { diasAtras: 15, peso: p.peso + 1, imc: ((p.peso + 1) / (p.altura / 100) ** 2).toFixed(1) },
        { diasAtras: 2, peso: p.peso, imc: (p.peso / (p.altura / 100) ** 2).toFixed(1) },
      ];
      for (const m of medidasPac) {
        const fecha = new Date(now); fecha.setDate(now.getDate() - m.diasAtras);
        await client.query(
          `INSERT INTO medidas_antropometricas (id, "pacienteId", fecha, peso, altura, imc, "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())`,
          [pacId, fecha, m.peso, p.altura, m.imc],
        );
      }
      console.log(`  3 medidas creadas`);
    }

    // ─── 3. Recetas propias ──────────────────────────────────────────
    const existeReceta = await client.query(
      `SELECT id FROM recetas WHERE "dietistaId" = $1 LIMIT 1`,
      [dietistaId],
    );

    if (!existeReceta.rows[0]) {
      const [
        avenaId, platanoId, lecheId, polloId, brocId, aceiteId,
        salmonId, espinId, huevoId, aguacateId, tomateId,
        garbanzosId, arroz_id, patataId, cebollaId,
      ] = await Promise.all([
        buscarAlimento(client, "avena"), buscarAlimento(client, "plátano"),
        buscarAlimento(client, "leche entera"), buscarAlimento(client, "pollo"),
        buscarAlimento(client, "brócoli"), buscarAlimento(client, "aceite de oliva"),
        buscarAlimento(client, "salmón"), buscarAlimento(client, "espinaca"),
        buscarAlimento(client, "huevo"), buscarAlimento(client, "aguacate"),
        buscarAlimento(client, "tomate"), buscarAlimento(client, "garbanzos"),
        buscarAlimento(client, "arroz"), buscarAlimento(client, "patata"),
        buscarAlimento(client, "cebolla"),
      ]);

      const recetas = [
        {
          nombre: "Porridge proteico de avena y plátano",
          desc: "Desayuno energético ideal para empezar el día con fuerza.",
          instrucciones: "1. Calentar la leche en un cazo. 2. Añadir la avena y cocinar 5 min a fuego medio removiendo. 3. Servir con plátano en rodajas.",
          porciones: 1, tiempo: 10, kcal: 420, prot: 18, carb: 62, grasa: 10, fibra: 6,
          ingredientes: [
            { id: avenaId, g: 60 }, { id: platanoId, g: 120 }, { id: lecheId, g: 250 },
          ],
        },
        {
          nombre: "Salmón al horno con espinacas salteadas",
          desc: "Rico en omega-3 y hierro. Cena perfecta para deportistas.",
          instrucciones: "1. Precalentar horno a 200°C. 2. Sazonar el salmón con limón, sal y pimienta. 3. Hornear 15 min. 4. Saltear espinacas con ajo y aceite 3 min.",
          porciones: 1, tiempo: 25, kcal: 480, prot: 42, carb: 4, grasa: 32, fibra: 3,
          ingredientes: [
            { id: salmonId, g: 180 }, { id: espinId, g: 200 }, { id: aceiteId, g: 10 },
          ],
        },
        {
          nombre: "Revuelto de huevo y aguacate en tostada",
          desc: "Desayuno saciante con grasas saludables y proteína completa.",
          instrucciones: "1. Batir los huevos con sal. 2. Hacer revuelto a fuego bajo. 3. Servir sobre tostada con aguacate laminado.",
          porciones: 1, tiempo: 8, kcal: 390, prot: 22, carb: 18, grasa: 26, fibra: 5,
          ingredientes: [
            { id: huevoId, g: 120 }, { id: aguacateId, g: 80 },
          ],
        },
        {
          nombre: "Pollo a la plancha con brócoli y arroz",
          desc: "Clásico almuerzo equilibrado. Fácil de preparar en batch cooking.",
          instrucciones: "1. Cocinar el arroz según indicaciones. 2. Hacer el pollo a la plancha con especias al gusto. 3. Cocer el brócoli al vapor 6 min. 4. Aliñar con aceite de oliva.",
          porciones: 1, tiempo: 25, kcal: 520, prot: 45, carb: 50, grasa: 14, fibra: 5,
          ingredientes: [
            { id: polloId, g: 150 }, { id: brocId, g: 150 }, { id: arroz_id, g: 80 }, { id: aceiteId, g: 8 },
          ],
        },
        {
          nombre: "Garbanzos salteados con tomate y espinacas",
          desc: "Plato vegetal completo, alto en fibra y proteína vegetal.",
          instrucciones: "1. Saltear cebolla picada con aceite 3 min. 2. Añadir tomate troceado y cocinar 5 min. 3. Incorporar garbanzos y espinacas. 4. Cocinar 5 min más a fuego medio.",
          porciones: 2, tiempo: 15, kcal: 340, prot: 16, carb: 42, grasa: 12, fibra: 10,
          ingredientes: [
            { id: garbanzosId, g: 160 }, { id: tomateId, g: 150 }, { id: espinId, g: 100 },
            { id: cebollaId, g: 60 }, { id: aceiteId, g: 10 },
          ],
        },
      ];

      for (const r of recetas) {
        const recRes = await client.query(
          `INSERT INTO recetas (
            id, "dietistaId", nombre, descripcion, instrucciones, porciones,
            "tiempoPreparacion", calorias, proteinas, carbohidratos, grasas, fibra,
            "createdAt", "updatedAt"
          ) VALUES (
            gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW()
          ) RETURNING id`,
          [dietistaId, r.nombre, r.desc, r.instrucciones, r.porciones,
           r.tiempo, r.kcal, r.prot, r.carb, r.grasa, r.fibra],
        );
        const recId = recRes.rows[0].id;

        for (const ing of r.ingredientes) {
          if (!ing.id) continue;
          await client.query(
            `INSERT INTO receta_ingredientes (id, "recetaId", "alimentoId", cantidad, unidad)
             VALUES (gen_random_uuid()::text, $1, $2, $3, 'GRAMOS')`,
            [recId, ing.id, ing.g],
          );
        }
        console.log(`Receta "${r.nombre}" creada`);
      }
    } else {
      console.log("Recetas demo ya existen");
    }

    // ─── 4. Plantillas ──────────────────────────────────────────────
    const existePlantilla = await client.query(
      `SELECT id FROM plantillas WHERE "dietistaId" = $1 LIMIT 1`,
      [dietistaId],
    );

    if (!existePlantilla.rows[0]) {
      const plantillas = [
        {
          nombre: "Plantilla mediterránea 2000 kcal",
          datos: DIAS.map(dia => ({
            dia,
            comidas: COMIDAS.map(tipo => ({ tipo, items: [] })),
          })),
        },
        {
          nombre: "Plantilla hiperproteica deportista",
          datos: DIAS.map(dia => ({
            dia,
            comidas: COMIDAS.map(tipo => ({ tipo, items: [] })),
          })),
        },
      ];

      for (const pl of plantillas) {
        await client.query(
          `INSERT INTO plantillas (id, "dietistaId", nombre, datos, "createdAt", "updatedAt")
           VALUES (gen_random_uuid()::text, $1, $2, $3::jsonb, NOW(), NOW())`,
          [dietistaId, pl.nombre, JSON.stringify(pl.datos)],
        );
        console.log(`Plantilla "${pl.nombre}" creada`);
      }
    } else {
      console.log("Plantillas demo ya existen");
    }

    // ─── Resumen ─────────────────────────────────────────────────────
    console.log("\n=== CONFIGURACIÓN ===");
    console.log(`Añade esta línea a tu .env.local (y en producción):\n`);
    console.log(`DEMO_DIETISTA_ID=${dietistaId}`);
    console.log(`\nEl enlace demo será: https://tu-dominio.com/demo`);
    console.log(`\nNota: "Paciente Prueba" (con 5 planes, medidas, citas, etc.)`);
    console.log(`se crea automáticamente al primer acceso a /demo.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
