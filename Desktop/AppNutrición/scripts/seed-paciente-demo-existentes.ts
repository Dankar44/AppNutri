import "./_guard-destructivo";   // salvaguarda: obliga a elegir DB=dev|prod y lo dice en pantalla
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
import pg from "pg";

const REBUILD = process.env.REBUILD === "1";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: { rejectUnauthorized: false },
});

function cuid() {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  return ("c" + ts + rand).slice(0, 25);
}

const AVATAR_DEMO = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMjAwIiBmaWxsPSJub25lIj4KICA8Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjEwMCIgZmlsbD0iI0U4RjVFOSIvPgogIDxjaXJjbGUgY3g9IjEwMCIgY3k9IjcyIiByPSIyOCIgZmlsbD0iIzY2QkI2QSIvPgogIDxwYXRoIGQ9Ik0xMDAgMTA4Yy0zMCAwLTU0IDE2LTU0IDM2djhjMCA0IDIgNyA2IDkgMTIgNiAzMCA5IDQ4IDlzMzYtMyA0OC05YzQtMiA2LTUgNi05di04YzAtMjAtMjQtMzYtNTQtMzZ6IiBmaWxsPSIjNjZCQjZBIi8+Cjwvc3ZnPgo=";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"];
const COMIDAS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA"];

const FICHA_INFORMACION = {
  consulta: {
    motivo: "Pérdida de peso saludable y mejora del hábito alimentario. Quiere aprender a comer mejor sin pasar hambre.",
    expectativas: "Perder 5 kg en 3 meses y mantener el peso a largo plazo. Mejorar energía y digestión.",
    objetivosClinicos: "control_peso",
    objetivosClinicosDetalle: "Perder 5 kg de forma saludable en 3 meses",
    otras:
      "Vida sedentaria por trabajo de oficina. Quiere establecer rutina de ejercicio y mejorar composición corporal.",
  },
  personalSocial: {
    funcionIntestinal: "Regular, 1 vez al día, sin molestias.",
    calidadSueno: "Buena en general, 7-8h, a veces despierta a media noche sin motivo aparente.",
    fumador: "No",
    alcohol: "Ocasional: 1-2 cervezas los fines de semana.",
    estadoCivil: "Soltero",
    actividadFisica: "Ligera-moderada: camina al trabajo (15 min) y gimnasio 3 veces por semana.",
    raza: "Caucásico",
    otrasPersonal:
      "Vida social activa. Come fuera 2-3 veces por semana. Viaja de vez en cuando por trabajo.",
  },
  clinica: {
    patologiasDetalle: "HTA diagnosticada hace 2 años, controlada con medicación. Hipotiroidismo subclínico leve.",
    medicacion: "Enalapril 10 mg cada 24 h. Levotiroxina 50 mcg en ayunas.",
    antecedentesPersonales: "Apendicectomía a los 14 años. Sin otros antecedentes relevantes.",
    antecedentesFamiliares: "Padre con diabetes tipo 2. Madre con hipertensión. Abuelo materno con infarto.",
    otrasClinicas:
      "Análisis de sangre recientes: colesterol total 210 mg/dL, LDL 135, HDL 45, TG 160. TSH 4.5 mU/L. Resto dentro de valores normales.",
  },
  alimentaria: {
    horaLevantarse: "07:00",
    horaAcostarse: "23:30",
    tiposDieta: "Mediterránea. No sigue ninguna dieta restrictiva.",
    alimentosFavoritos: "Pescado azul, pasta, frutas cítricas, arroz con pollo, aceitunas.",
    alimentosRechazados: "Casquería, hígado, pescado crudo, kale.",
    alergiasDetalle: "Frutos secos (almendra en particular): picor en boca y garganta.",
    intoleranciasDetalle: "Lactosa en cantidades grandes (más de 250 ml leche): molestias digestivas.",
    deficiencias: "Vitamina D por debajo del rango en último análisis (22 ng/mL).",
    ingestaAgua: "1.5-2 litros diarios aproximadamente.",
    otrasAlimentaria:
      "Come fuera 2-3 veces por semana. Cocina 4-5 días en casa. No desayuna algunos días por prisa.",
  },
};

// Los colores válidos del componente son: trabajo | ejercicio | comida | descanso | otro
// Las horas deben ser en punto (HH:00) para que aparezcan en la rejilla del horario semanal.
const HORARIO = [
  // ─── Lunes — jornada laboral + gimnasio ───
  { dia: "Lunes", hora: "07:00", actividad: "Rutina mañana", color: "descanso" },
  { dia: "Lunes", hora: "08:00", actividad: "Desayuno", color: "comida" },
  { dia: "Lunes", hora: "09:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "10:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "11:00", actividad: "Media mañana", color: "comida" },
  { dia: "Lunes", hora: "12:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "13:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Lunes", hora: "15:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "16:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "17:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "18:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Lunes", hora: "19:00", actividad: "Gimnasio (fuerza)", color: "ejercicio" },
  { dia: "Lunes", hora: "20:00", actividad: "Ducha / descanso", color: "descanso" },
  { dia: "Lunes", hora: "21:00", actividad: "Cena", color: "comida" },
  { dia: "Lunes", hora: "22:00", actividad: "Lectura / sofá", color: "descanso" },
  { dia: "Lunes", hora: "23:00", actividad: "Dormir", color: "descanso" },

  // ─── Martes — jornada laboral, sin gimnasio ───
  { dia: "Martes", hora: "07:00", actividad: "Rutina mañana", color: "descanso" },
  { dia: "Martes", hora: "08:00", actividad: "Desayuno", color: "comida" },
  { dia: "Martes", hora: "09:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "10:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "11:00", actividad: "Media mañana", color: "comida" },
  { dia: "Martes", hora: "12:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "13:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Martes", hora: "15:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "16:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "17:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "18:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Martes", hora: "19:00", actividad: "Caminata suave", color: "ejercicio" },
  { dia: "Martes", hora: "20:00", actividad: "Recados / ocio", color: "otro" },
  { dia: "Martes", hora: "21:00", actividad: "Cena", color: "comida" },
  { dia: "Martes", hora: "22:00", actividad: "Descanso", color: "descanso" },
  { dia: "Martes", hora: "23:00", actividad: "Dormir", color: "descanso" },

  // ─── Miércoles — jornada laboral + gimnasio ───
  { dia: "Miércoles", hora: "07:00", actividad: "Rutina mañana", color: "descanso" },
  { dia: "Miércoles", hora: "08:00", actividad: "Desayuno", color: "comida" },
  { dia: "Miércoles", hora: "09:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "10:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "11:00", actividad: "Media mañana", color: "comida" },
  { dia: "Miércoles", hora: "12:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "13:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Miércoles", hora: "15:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "16:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "17:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "18:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Miércoles", hora: "19:00", actividad: "Gimnasio (fuerza)", color: "ejercicio" },
  { dia: "Miércoles", hora: "20:00", actividad: "Ducha / descanso", color: "descanso" },
  { dia: "Miércoles", hora: "21:00", actividad: "Cena", color: "comida" },
  { dia: "Miércoles", hora: "22:00", actividad: "Lectura / sofá", color: "descanso" },
  { dia: "Miércoles", hora: "23:00", actividad: "Dormir", color: "descanso" },

  // ─── Jueves — jornada laboral, sin gimnasio ───
  { dia: "Jueves", hora: "07:00", actividad: "Rutina mañana", color: "descanso" },
  { dia: "Jueves", hora: "08:00", actividad: "Desayuno", color: "comida" },
  { dia: "Jueves", hora: "09:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "10:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "11:00", actividad: "Media mañana", color: "comida" },
  { dia: "Jueves", hora: "12:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "13:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Jueves", hora: "15:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "16:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "17:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "18:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Jueves", hora: "19:00", actividad: "Movilidad / estiramientos", color: "ejercicio" },
  { dia: "Jueves", hora: "20:00", actividad: "Recados / ocio", color: "otro" },
  { dia: "Jueves", hora: "21:00", actividad: "Cena", color: "comida" },
  { dia: "Jueves", hora: "22:00", actividad: "Descanso", color: "descanso" },
  { dia: "Jueves", hora: "23:00", actividad: "Dormir", color: "descanso" },

  // ─── Viernes — jornada laboral + gimnasio + social ───
  { dia: "Viernes", hora: "07:00", actividad: "Rutina mañana", color: "descanso" },
  { dia: "Viernes", hora: "08:00", actividad: "Desayuno", color: "comida" },
  { dia: "Viernes", hora: "09:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "10:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "11:00", actividad: "Media mañana", color: "comida" },
  { dia: "Viernes", hora: "12:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "13:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Viernes", hora: "15:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "16:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "17:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "18:00", actividad: "Trabajo", color: "trabajo" },
  { dia: "Viernes", hora: "19:00", actividad: "Gimnasio (fuerza)", color: "ejercicio" },
  { dia: "Viernes", hora: "20:00", actividad: "Ducha", color: "descanso" },
  { dia: "Viernes", hora: "21:00", actividad: "Cena con amigos", color: "comida" },
  { dia: "Viernes", hora: "22:00", actividad: "Social", color: "otro" },
  { dia: "Viernes", hora: "23:00", actividad: "Social", color: "otro" },

  // ─── Sábado — deporte por la mañana, día relajado ───
  { dia: "Sábado", hora: "09:00", actividad: "Despertar", color: "descanso" },
  { dia: "Sábado", hora: "10:00", actividad: "Desayuno", color: "comida" },
  { dia: "Sábado", hora: "11:00", actividad: "Natación", color: "ejercicio" },
  { dia: "Sábado", hora: "12:00", actividad: "Recados / compras", color: "otro" },
  { dia: "Sábado", hora: "13:00", actividad: "Preparar comida", color: "otro" },
  { dia: "Sábado", hora: "14:00", actividad: "Almuerzo", color: "comida" },
  { dia: "Sábado", hora: "15:00", actividad: "Sobremesa", color: "descanso" },
  { dia: "Sábado", hora: "16:00", actividad: "Descanso", color: "descanso" },
  { dia: "Sábado", hora: "17:00", actividad: "Ocio / hobbies", color: "otro" },
  { dia: "Sábado", hora: "18:00", actividad: "Ocio / hobbies", color: "otro" },
  { dia: "Sábado", hora: "19:00", actividad: "Paseo", color: "ejercicio" },
  { dia: "Sábado", hora: "20:00", actividad: "Plan social", color: "otro" },
  { dia: "Sábado", hora: "21:00", actividad: "Cena fuera", color: "comida" },
  { dia: "Sábado", hora: "22:00", actividad: "Social", color: "otro" },
  { dia: "Sábado", hora: "23:00", actividad: "Social", color: "otro" },

  // ─── Domingo — día tranquilo y familiar ───
  { dia: "Domingo", hora: "09:00", actividad: "Descanso", color: "descanso" },
  { dia: "Domingo", hora: "10:00", actividad: "Desayuno tranquilo", color: "comida" },
  { dia: "Domingo", hora: "11:00", actividad: "Caminata larga", color: "ejercicio" },
  { dia: "Domingo", hora: "12:00", actividad: "Caminata larga", color: "ejercicio" },
  { dia: "Domingo", hora: "13:00", actividad: "Preparar comida", color: "otro" },
  { dia: "Domingo", hora: "14:00", actividad: "Comida familiar", color: "comida" },
  { dia: "Domingo", hora: "15:00", actividad: "Sobremesa", color: "descanso" },
  { dia: "Domingo", hora: "16:00", actividad: "Descanso", color: "descanso" },
  { dia: "Domingo", hora: "17:00", actividad: "Lectura", color: "descanso" },
  { dia: "Domingo", hora: "18:00", actividad: "Ocio / hobbies", color: "otro" },
  { dia: "Domingo", hora: "19:00", actividad: "Preparar la semana", color: "otro" },
  { dia: "Domingo", hora: "20:00", actividad: "Cena ligera", color: "comida" },
  { dia: "Domingo", hora: "21:00", actividad: "Descanso", color: "descanso" },
  { dia: "Domingo", hora: "22:00", actividad: "Dormir", color: "descanso" },
];

const RECOMENDACIONES = {
  agua: "Beber mínimo 2 litros de agua al día, repartidos a lo largo de la jornada. Empezar el día con un vaso en ayunas.",
  ejercicios: [
    { nombre: "Caminar rápido", met: 4, duracion: 30, frecuencia: "Diaria" },
    { nombre: "Entrenamiento de fuerza", met: 6, duracion: 45, frecuencia: "3 veces por semana" },
    { nombre: "Natación", met: 7, duracion: 30, frecuencia: "1 vez por semana" },
    { nombre: "Estiramientos/Movilidad", met: 2.5, duracion: 15, frecuencia: "Diaria" },
  ],
  alimentosEvitar: [
    "Azúcares añadidos y bollería industrial",
    "Refrescos azucarados y zumos envasados",
    "Carnes procesadas (embutidos, salchichas, bacon)",
    "Exceso de sal y snacks salados",
    "Alcohol entre semana",
    "Fritos y rebozados",
  ],
  otrasRecomendaciones:
    "Cenar ligero 2-3 horas antes de dormir. Masticar despacio y comer sin pantallas. Priorizar alimentos frescos y de temporada. Cocinar al vapor, plancha o horno. Evitar picar entre horas con ultraprocesados — si hay hambre, elegir fruta, yogur o frutos secos (no almendras).",
};

async function buscarAlimento(client: pg.PoolClient, patron: string): Promise<string | null> {
  const res = await client.query<{ id: string }>(
    `SELECT id FROM alimentos WHERE nombre ILIKE $1 ORDER BY nombre LIMIT 1`,
    [`%${patron}%`],
  );
  return res.rows[0]?.id ?? null;
}

async function borrarDemoExistente(client: pg.PoolClient, dietistaId: string) {
  const res = await client.query<{ id: string }>(
    `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND nombre = 'Paciente' AND apellidos = 'Prueba'`,
    [dietistaId],
  );
  for (const { id } of res.rows) {
    await client.query(`DELETE FROM pagos WHERE "pacienteId" = $1 AND EXISTS (SELECT 1 FROM pacientes WHERE id = $1 AND "esDemo" = true)`, [id]);
    // Salvaguarda: nunca borrar un paciente real que se llame igual que el de demostración.
    await client.query(`DELETE FROM pacientes WHERE id = $1 AND "esDemo" = true`, [id]);
  }
  return res.rows.length;
}

async function crearDemoParaDietista(client: pg.PoolClient, dietistaId: string) {
  if (!REBUILD) {
    const existente = await client.query<{ id: string }>(
      `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND nombre = 'Paciente' AND apellidos = 'Prueba' LIMIT 1`,
      [dietistaId],
    );
    if (existente.rows.length > 0) return { creado: false, pacienteId: existente.rows[0].id };
  } else {
    await borrarDemoExistente(client, dietistaId);
  }

  const now = new Date();
  const pacienteId = cuid();

  await client.query(
    `INSERT INTO pacientes (
      id, "dietistaId", nombre, apellidos, email, telefono, "fotoUrl", sexo, "fechaNacimiento", altura, peso,
      objetivo, "objetivoDetalle", "nivelActividad", "frecuenciaEjercicio", "tipoEjercicio",
      "horarioTrabajo", "horarioEjercicio", "horasDescanso", ocupacion,
      preferencias, alergias, intolerancias, patologias, medicamentos, suplementos,
      "fichaInformacion", horario, recomendaciones,
      notas, activo, "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, 'Paciente', 'Prueba', $3, $4, $12, 'MASCULINO', $5, 175, 78,
      'PERDER_PESO', $6, 'moderado', '3 veces por semana', 'Entrenamiento de fuerza y cardio',
      '09:00 – 18:00', 'L/X/V 19:00', '7-8 horas', 'Oficina',
      ARRAY['Mediterránea','Pescado azul','Verduras de temporada','Sin ultraprocesados']::text[],
      ARRAY['Frutos secos (almendras)','Polen estacional']::text[],
      ARRAY['Lactosa (parcial)']::text[],
      ARRAY['Hipertensión controlada','Hipotiroidismo subclínico leve']::text[],
      ARRAY['Enalapril 10 mg cada 24 h','Levotiroxina 50 mcg en ayunas']::text[],
      ARRAY['Vitamina D3 1000 UI','Omega-3 EPA/DHA','Magnesio bisglicinato']::text[],
      $7::jsonb, $8::jsonb, $9,
      $10, true, $11, $11
    )`,
    [
      pacienteId,
      dietistaId,
      "paciente.prueba@demo.annonia.com",
      "+34 600 123 456",
      new Date(Date.UTC(1992, 5, 15)),
      "Perder 5 kg de forma saludable en 3 meses",
      JSON.stringify(FICHA_INFORMACION),
      JSON.stringify(HORARIO),
      JSON.stringify(RECOMENDACIONES),
      "Paciente de prueba preconfigurado para que explores las funciones de la app. Puedes editarlo o eliminarlo cuando quieras.",
      now,
      AVATAR_DEMO,
    ],
  );

  // Precargar alimentos para rellenar variantes del Lunes por plan
  const [
    avena, platano, lecheEntera, pollo, arroz, brocoli, aceite, manzana, yogur, nueces,
    huevo, aguacate, atun, salmon, espinacas, patata, pastaIntegral, tomate, pepino,
    lentejas, garbanzos, queso, panIntegral, ternera, merluza, cebolla, pimiento,
    naranja, pera, almendras, jamonSerrano, aceitunas, quinoa, fresas, boniato,
  ] = await Promise.all([
    buscarAlimento(client, "avena"),
    buscarAlimento(client, "plátano"),
    buscarAlimento(client, "leche entera"),
    buscarAlimento(client, "pollo"),
    buscarAlimento(client, "arroz"),
    buscarAlimento(client, "brócoli"),
    buscarAlimento(client, "aceite de oliva"),
    buscarAlimento(client, "manzana"),
    buscarAlimento(client, "yogur"),
    buscarAlimento(client, "nueces"),
    buscarAlimento(client, "huevo"),
    buscarAlimento(client, "aguacate"),
    buscarAlimento(client, "atún"),
    buscarAlimento(client, "salmón"),
    buscarAlimento(client, "espinaca"),
    buscarAlimento(client, "patata"),
    buscarAlimento(client, "pasta integral"),
    buscarAlimento(client, "tomate"),
    buscarAlimento(client, "pepino"),
    buscarAlimento(client, "lentejas"),
    buscarAlimento(client, "garbanzos"),
    buscarAlimento(client, "queso"),
    buscarAlimento(client, "pan integral"),
    buscarAlimento(client, "ternera"),
    buscarAlimento(client, "merluza"),
    buscarAlimento(client, "cebolla"),
    buscarAlimento(client, "pimiento"),
    buscarAlimento(client, "naranja"),
    buscarAlimento(client, "pera"),
    buscarAlimento(client, "almendra"),
    buscarAlimento(client, "jamón serrano"),
    buscarAlimento(client, "aceitunas"),
    buscarAlimento(client, "quinoa"),
    buscarAlimento(client, "fresa"),
    buscarAlimento(client, "boniato"),
  ]);

  type RellenoPorTipo = Record<string, Array<{ alimentoId: string | null; cantidad: number }>>;

  async function crearPlan(
    nombre: string,
    caloriasObj: number,
    macros: { prot: number; carb: number; grasa: number },
    activo: boolean,
    diasAntes: number,
    lunesRellenos: RellenoPorTipo,
  ) {
    const planId = cuid();
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - diasAntes);
    await client.query(
      `INSERT INTO planes_alimenticios (
        id, "pacienteId", "dietistaId", nombre, "caloriasObjetivo",
        "proteinasObjetivo", "carbohidratosObjetivo", "grasasObjetivo",
        activo, "createdAt", "updatedAt"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
      [planId, pacienteId, dietistaId, nombre, caloriasObj, macros.prot, macros.carb, macros.grasa, activo, createdAt],
    );

    const comidasPorDia: Record<string, Record<string, string>> = {};
    for (const dia of DIAS) {
      const diaId = cuid();
      await client.query(
        `INSERT INTO dias_del_plan (id, "planId", dia) VALUES ($1, $2, $3)`,
        [diaId, planId, dia],
      );
      comidasPorDia[dia] = {};
      for (let i = 0; i < COMIDAS.length; i++) {
        const tipo = COMIDAS[i];
        const comidaId = cuid();
        await client.query(
          `INSERT INTO comidas_del_dia (id, "diaId", tipo, orden) VALUES ($1, $2, $3, $4)`,
          [comidaId, diaId, tipo, i],
        );
        comidasPorDia[dia][tipo] = comidaId;
      }
    }

    // Replicar los mismos alimentos en los 7 días de la semana
    for (const dia of DIAS) {
      const comidas = comidasPorDia[dia];
      for (const tipo of Object.keys(lunesRellenos)) {
        if (!comidas[tipo]) continue;
        let orden = 0;
        for (const item of lunesRellenos[tipo]) {
          if (!item.alimentoId) continue;
          await client.query(
            `INSERT INTO alimentos_en_comida (id, "comidaId", "alimentoId", cantidad, unidad, orden)
             VALUES ($1, $2, $3, $4, 'GRAMOS', $5)`,
            [cuid(), comidas[tipo], item.alimentoId, item.cantidad, orden],
          );
          orden++;
        }
      }
    }
  }

  // Plan 1 — Inicial (activo, el más reciente)
  await crearPlan(
    "Plan inicial — ejemplo",
    2000, { prot: 150, carb: 220, grasa: 70 }, true, 0,
    {
      DESAYUNO: [
        { alimentoId: avena, cantidad: 60 },
        { alimentoId: platano, cantidad: 100 },
        { alimentoId: lecheEntera, cantidad: 200 },
      ],
      ALMUERZO: [
        { alimentoId: pollo, cantidad: 150 },
        { alimentoId: arroz, cantidad: 80 },
        { alimentoId: brocoli, cantidad: 150 },
        { alimentoId: aceite, cantidad: 10 },
      ],
      MERIENDA: [
        { alimentoId: manzana, cantidad: 180 },
        { alimentoId: yogur, cantidad: 125 },
        { alimentoId: nueces, cantidad: 20 },
      ],
      CENA: [
        { alimentoId: pollo, cantidad: 120 },
        { alimentoId: brocoli, cantidad: 200 },
        { alimentoId: aceite, cantidad: 8 },
      ],
    },
  );

  // Plan 2 — Mantenimiento (inactivo)
  await crearPlan(
    "Plan de mantenimiento",
    2200, { prot: 140, carb: 260, grasa: 75 }, false, 20,
    {
      DESAYUNO: [
        { alimentoId: panIntegral, cantidad: 60 },
        { alimentoId: huevo, cantidad: 100 },
        { alimentoId: aguacate, cantidad: 50 },
      ],
      ALMUERZO: [
        { alimentoId: pastaIntegral, cantidad: 100 },
        { alimentoId: ternera, cantidad: 120 },
        { alimentoId: tomate, cantidad: 100 },
        { alimentoId: aceite, cantidad: 10 },
      ],
      MERIENDA: [
        { alimentoId: naranja, cantidad: 150 },
        { alimentoId: almendras, cantidad: 25 },
      ],
      CENA: [
        { alimentoId: merluza, cantidad: 150 },
        { alimentoId: patata, cantidad: 200 },
        { alimentoId: espinacas, cantidad: 100 },
      ],
    },
  );

  // Plan 3 — Deportivo alto volumen (inactivo)
  await crearPlan(
    "Plan deportivo — alto volumen",
    2600, { prot: 180, carb: 320, grasa: 75 }, false, 40,
    {
      DESAYUNO: [
        { alimentoId: avena, cantidad: 80 },
        { alimentoId: platano, cantidad: 120 },
        { alimentoId: huevo, cantidad: 150 },
      ],
      ALMUERZO: [
        { alimentoId: ternera, cantidad: 180 },
        { alimentoId: boniato, cantidad: 250 },
        { alimentoId: pimiento, cantidad: 100 },
        { alimentoId: aceite, cantidad: 12 },
      ],
      MERIENDA: [
        { alimentoId: yogur, cantidad: 200 },
        { alimentoId: fresas, cantidad: 100 },
        { alimentoId: almendras, cantidad: 30 },
      ],
      CENA: [
        { alimentoId: salmon, cantidad: 180 },
        { alimentoId: quinoa, cantidad: 80 },
        { alimentoId: espinacas, cantidad: 150 },
      ],
    },
  );

  // Plan 4 — Low-carb / cetogénico suave (inactivo)
  await crearPlan(
    "Plan low-carb",
    1800, { prot: 140, carb: 90, grasa: 115 }, false, 60,
    {
      DESAYUNO: [
        { alimentoId: huevo, cantidad: 150 },
        { alimentoId: aguacate, cantidad: 80 },
        { alimentoId: aceitunas, cantidad: 30 },
      ],
      ALMUERZO: [
        { alimentoId: salmon, cantidad: 180 },
        { alimentoId: espinacas, cantidad: 200 },
        { alimentoId: aceite, cantidad: 15 },
      ],
      MERIENDA: [
        { alimentoId: queso, cantidad: 50 },
        { alimentoId: nueces, cantidad: 25 },
      ],
      CENA: [
        { alimentoId: ternera, cantidad: 150 },
        { alimentoId: brocoli, cantidad: 200 },
        { alimentoId: aceite, cantidad: 10 },
      ],
    },
  );

  // Plan 5 — Legumbres mediterránea (inactivo)
  await crearPlan(
    "Plan mediterráneo — legumbres",
    1900, { prot: 110, carb: 230, grasa: 65 }, false, 75,
    {
      DESAYUNO: [
        { alimentoId: panIntegral, cantidad: 50 },
        { alimentoId: tomate, cantidad: 80 },
        { alimentoId: aceite, cantidad: 8 },
        { alimentoId: jamonSerrano, cantidad: 30 },
      ],
      ALMUERZO: [
        { alimentoId: lentejas, cantidad: 80 },
        { alimentoId: cebolla, cantidad: 40 },
        { alimentoId: pimiento, cantidad: 60 },
        { alimentoId: aceite, cantidad: 8 },
      ],
      MERIENDA: [
        { alimentoId: pera, cantidad: 180 },
        { alimentoId: yogur, cantidad: 125 },
      ],
      CENA: [
        { alimentoId: garbanzos, cantidad: 70 },
        { alimentoId: espinacas, cantidad: 150 },
        { alimentoId: pepino, cantidad: 100 },
        { alimentoId: aceite, cantidad: 8 },
      ],
    },
  );

  // Medidas antropométricas (8 puntos de evolución)
  const medidas = [
    { diasAtras: 90, peso: 83.2, imc: 27.2, grasa: 24.1, muscular: 31.8, cintura: 98, cadera: 102.5, brazo: 33.8, notas: "Primera toma de contacto. Se pactan objetivos y se programa el plan." },
    { diasAtras: 75, peso: 82.5, imc: 26.9, grasa: 23.5, muscular: 32.2, cintura: 97, cadera: 102, brazo: 34, notas: "Medida inicial tras arranque del plan." },
    { diasAtras: 60, peso: 81.3, imc: 26.5, grasa: 23.0, muscular: 32.5, cintura: 96, cadera: 101.5, brazo: 34, notas: "Evolución lenta pero positiva. Ajustes en cenas." },
    { diasAtras: 45, peso: 80.2, imc: 26.1, grasa: 22.4, muscular: 32.8, cintura: 94.5, cadera: 101, brazo: 34.2, notas: "Buena adherencia al plan. Mejora en energía reportada." },
    { diasAtras: 30, peso: 79.1, imc: 25.8, grasa: 21.8, muscular: 33.0, cintura: 93, cadera: 100, brazo: 34.5, notas: "Revisión mensual. Continuamos con el plan." },
    { diasAtras: 15, peso: 78.2, imc: 25.5, grasa: 21.0, muscular: 33.3, cintura: 92, cadera: 99.5, brazo: 34.5, notas: "Reducción de cintura notable. Mantener entrenamiento." },
    { diasAtras: 7, peso: 77.9, imc: 25.4, grasa: 20.7, muscular: 33.4, cintura: 91.5, cadera: 99.2, brazo: 34.6, notas: "Semana previa a la revisión. Evolución estable." },
    { diasAtras: 3, peso: 77.6, imc: 25.3, grasa: 20.5, muscular: 33.5, cintura: 91, cadera: 99, brazo: 34.8, notas: "Última medida. -5.6 kg desde el inicio. Objetivo casi alcanzado." },
  ];
  const medidaIds: string[] = [];
  for (const m of medidas) {
    const id = cuid();
    medidaIds.push(id);
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - m.diasAtras);
    await client.query(
      `INSERT INTO medidas_antropometricas (
        id, "pacienteId", fecha, peso, altura, imc, "grasaCorporal", "masaMuscular",
        "perimetroCintura", "perimetroCadera", "perimetroBrazo", notas, "createdAt"
      ) VALUES ($1, $2, $3, $4, 175, $5, $6, $7, $8, $9, $10, $11, $3)`,
      [id, pacienteId, fecha, m.peso, m.imc, m.grasa, m.muscular, m.cintura, m.cadera, m.brazo, m.notas],
    );
  }

  // Consultas (vinculadas a medidas — recalcular índices según el nuevo array de 8 medidas)
  const consultas = [
    {
      diasAtras: 75,
      motivo: "Primera consulta",
      notas: "Consulta inicial. Anamnesis completa, antropometría y pactación de plan. Paciente muy motivado.",
      medidaIdx: 1,
    },
    {
      diasAtras: 45,
      motivo: "Revisión de seguimiento",
      notas: "Primera revisión a 30 días. Pérdida de 2.3 kg. Ajuste fino de raciones. Cumple objetivos de agua y ejercicio.",
      medidaIdx: 3,
    },
    {
      diasAtras: 15,
      motivo: "Revisión mensual",
      notas: "Segunda revisión. Pérdida total 4.3 kg. Paciente refiere más energía y mejor descanso.",
      medidaIdx: 5,
    },
  ];
  for (const c of consultas) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - c.diasAtras);
    await client.query(
      `INSERT INTO consultas (id, "pacienteId", "dietistaId", fecha, motivo, notas, "medidaId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $4, $4)`,
      [cuid(), pacienteId, dietistaId, fecha, c.motivo, c.notas, medidaIds[c.medidaIdx]],
    );
  }

  // Citas (1 pasada completada, 1 pasada cancelada, 1 futura confirmada)
  const citaPasada = new Date(now); citaPasada.setDate(now.getDate() - 15); citaPasada.setHours(10, 0, 0, 0);
  const citaCancelada = new Date(now); citaCancelada.setDate(now.getDate() - 5); citaCancelada.setHours(17, 0, 0, 0);
  const citaFutura = new Date(now); citaFutura.setDate(now.getDate() + 12); citaFutura.setHours(11, 30, 0, 0);
  await client.query(
    `INSERT INTO citas (id, "pacienteId", "dietistaId", "fechaHora", duracion, motivo, estado, notas, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 45, $5, 'COMPLETADA', $6, $7, $7)`,
    [cuid(), pacienteId, dietistaId, citaPasada, "Segunda revisión de seguimiento", "Revisión presencial. Ajuste de plan y sesión de educación nutricional.", now],
  );
  await client.query(
    `INSERT INTO citas (id, "pacienteId", "dietistaId", "fechaHora", duracion, motivo, estado, notas, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 30, $5, 'CANCELADA', $6, $7, $7)`,
    [cuid(), pacienteId, dietistaId, citaCancelada, "Consulta puntual — duda sobre suplementación", "El paciente avisó con antelación; reprogramada a la próxima revisión.", now],
  );
  await client.query(
    `INSERT INTO citas (id, "pacienteId", "dietistaId", "fechaHora", duracion, motivo, estado, notas, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, 30, $5, 'CONFIRMADA', $6, $7, $7)`,
    [cuid(), pacienteId, dietistaId, citaFutura, "Tercera revisión mensual", "Próxima revisión de evolución.", now],
  );

  // Acceso al portal del paciente (PIN = 123456, perfil completado)
  // hashPin: PBKDF2 SHA-256 con 100 000 iteraciones + sal aleatoria de 16 bytes (mismo formato que src/lib/patient-auth.ts)
  async function hashPinForDemo(pin: string): Promise<string> {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey("raw", encoder.encode(pin), "PBKDF2", false, ["deriveBits"]);
    const derivedBits = await crypto.subtle.deriveBits(
      { name: "PBKDF2", salt, iterations: 100000, hash: "SHA-256" },
      keyMaterial, 256,
    );
    const hashArray = Array.from(new Uint8Array(derivedBits));
    const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
    return `${saltHex}:${hashHex}`;
  }
  const pinDemoHash = await hashPinForDemo("123456");
  // El email de AccesoPaciente es UNIQUE a nivel global, así que añadimos un sufijo único por paciente
  const emailAcceso = `paciente.prueba+${pacienteId.slice(-6)}@demo.annonia.com`;
  await client.query(
    `INSERT INTO accesos_paciente (id, "pacienteId", email, "pinHash", "perfilCompleto", activo, "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, true, true, $5, $5)`,
    [cuid(), pacienteId, emailAcceso, pinDemoHash, now],
  );

  // Enlace compartido del plan activo (entregable de ejemplo)
  const planActivoRow = await client.query<{ id: string }>(
    `SELECT id FROM planes_alimenticios WHERE "pacienteId" = $1 AND activo = true LIMIT 1`,
    [pacienteId],
  );
  if (planActivoRow.rows.length > 0) {
    const expira = new Date(now); expira.setDate(now.getDate() + 30);
    await client.query(
      `INSERT INTO enlaces_compartidos (id, token, "planId", "dietistaId", activo, "expiraEn", "createdAt")
       VALUES ($1, $2, $3, $4, true, $5, $6)`,
      [cuid(), cuid(), planActivoRow.rows[0].id, dietistaId, expira, now],
    );
  }

  // Planificación por defecto con datos coherentes (objetivos + fórmulas + macros)
  const planificacionDatos = {
    actividadActual: "Sedentario",
    actividadObjetivo: "Activo",
    palCustomActual: 1.195,
    palCustomObjetivo: 1.745,
    formulaBmr: "Ecuación de la OMS",
    formulaEer: "TMB × PAL",
    formulaMasaGrasa: "Ecuación de Peterson",
    eerObjetivo: "2000",
    grasaPct: 30,
    carbPct: 45,
    protPct: 25,
    macroRefIdx: 0,
    fibraFuente: "Recomendación estándar",
    fibraCantidad: "30",
    pesoObjetivo: "72.5",
    grasaObjetivo: "18",
    imcObjetivo: "22",
  };
  await client.query(
    `INSERT INTO planificaciones (
      id, "pacienteId", "dietistaId", nombre, estado, "esDefecto",
      "fechaInicio", "fechaUltimoCambio", "fechaFinPrevista", datos,
      "createdAt", "updatedAt"
    ) VALUES (
      $1, $2, $3, 'Planificación por defecto', 'activa', true,
      $4, $5, $6, $7::jsonb, $5, $5
    )`,
    [
      cuid(), pacienteId, dietistaId,
      (() => { const d = new Date(now); d.setDate(now.getDate() - 90); return d; })(),
      now,
      (() => { const d = new Date(now); d.setDate(now.getDate() + 90); return d; })(),
      JSON.stringify(planificacionDatos),
    ],
  );

  // Cargar el mapa id → nombre para poder escribir los alimentos dentro de comidasData
  const idsAlimentos = [
    avena, platano, lecheEntera, pollo, arroz, brocoli, aceite, manzana, yogur, nueces,
    huevo, aguacate, atun, salmon, espinacas, patata, pastaIntegral, tomate, pepino,
    lentejas, garbanzos, queso, panIntegral, ternera, merluza, cebolla, pimiento,
    naranja, pera, almendras, jamonSerrano, aceitunas, quinoa, fresas, boniato,
  ].filter((x): x is string => !!x);
  const nombresRes = idsAlimentos.length > 0
    ? await client.query<{ id: string; nombre: string }>(
        `SELECT id, nombre FROM alimentos WHERE id = ANY($1::text[])`,
        [idsAlimentos],
      )
    : { rows: [] };
  const nombreDe = new Map(nombresRes.rows.map((r) => [r.id, r.nombre]));
  const item = (id: string | null, cantidad: number, cumplido: boolean) =>
    (id && nombreDe.has(id)) ? { nombre: nombreDe.get(id)!, cantidad, cumplido } : null;

  type Comida = { tipo: "DESAYUNO" | "MEDIA_MANANA" | "ALMUERZO" | "MERIENDA" | "CENA"; horaReal: string; alimentos: Array<{ nombre: string; cantidad: number; cumplido: boolean }>; notas?: string | null };
  const HORAS = { DESAYUNO: "08:30", MEDIA_MANANA: "11:00", ALMUERZO: "14:00", MERIENDA: "17:30", CENA: "21:00" };

  function buildComidasDia(diaIdx: number): Comida[] {
    // cumplido[i] = si la comida i (desayuno..cena) se cumplió
    const cumplidoArr: boolean[] =
      diaIdx === 4 ? [true, true, false, true, true] :
      diaIdx === 8 ? [true, false, true, false, true] :
      diaIdx === 9 ? [true, true, true, false, false] :
      [true, true, true, true, true];
    const variante = diaIdx % 3;
    if (variante === 0) {
      return [
        { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(avena, 50, cumplidoArr[0]), item(platano, 100, cumplidoArr[0]), item(lecheEntera, 200, cumplidoArr[0])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(manzana, 150, cumplidoArr[1])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(pollo, 150, cumplidoArr[2]), item(arroz, 80, cumplidoArr[2]), item(brocoli, 150, cumplidoArr[2])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(yogur, 125, cumplidoArr[3]), item(nueces, 20, cumplidoArr[3])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(salmon, 150, cumplidoArr[4]), item(espinacas, 200, cumplidoArr[4])].filter(Boolean) as Comida["alimentos"] },
      ];
    }
    if (variante === 1) {
      return [
        { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(panIntegral, 60, cumplidoArr[0]), item(huevo, 100, cumplidoArr[0]), item(aguacate, 50, cumplidoArr[0])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(pera, 150, cumplidoArr[1])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(pastaIntegral, 100, cumplidoArr[2]), item(ternera, 120, cumplidoArr[2]), item(tomate, 100, cumplidoArr[2])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(naranja, 150, cumplidoArr[3]), item(almendras, 25, cumplidoArr[3])].filter(Boolean) as Comida["alimentos"] },
        { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(merluza, 150, cumplidoArr[4]), item(patata, 200, cumplidoArr[4])].filter(Boolean) as Comida["alimentos"] },
      ];
    }
    return [
      { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(panIntegral, 50, cumplidoArr[0]), item(tomate, 80, cumplidoArr[0]), item(jamonSerrano, 30, cumplidoArr[0])].filter(Boolean) as Comida["alimentos"] },
      { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(fresas, 100, cumplidoArr[1])].filter(Boolean) as Comida["alimentos"] },
      { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(lentejas, 80, cumplidoArr[2]), item(cebolla, 40, cumplidoArr[2]), item(pimiento, 60, cumplidoArr[2])].filter(Boolean) as Comida["alimentos"] },
      { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(yogur, 125, cumplidoArr[3]), item(almendras, 20, cumplidoArr[3])].filter(Boolean) as Comida["alimentos"] },
      { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(garbanzos, 70, cumplidoArr[4]), item(espinacas, 150, cumplidoArr[4]), item(pepino, 100, cumplidoArr[4])].filter(Boolean) as Comida["alimentos"] },
    ];
  }

  // Seguimiento diario (últimos 14 días, con días sin registro intercalados)
  // Días SIN registro: 3, 7, 11 (queda un calendario con huecos para que se vea variedad)
  const SIN_REGISTRO = new Set([3, 7, 11]);
  for (let i = 0; i < 14; i++) {
    if (SIN_REGISTRO.has(i)) continue;
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - i);
    fecha.setHours(0, 0, 0, 0);
    const agua = 1600 + Math.round(Math.random() * 800);
    const ejercicio = i % 2 === 0;
    const minutos = ejercicio ? 30 + Math.round(Math.random() * 30) : 0;
    const kcal = ejercicio ? minutos * 6 : 0;
    const distancia = ejercicio && i % 3 === 0 ? Math.round(Math.random() * 50) / 10 : 0;
    // cumplido global: true si todas las comidas del día están cumplidas
    const comidasDia = buildComidasDia(i);
    const cumplido = comidasDia.every((c) => c.alimentos.length === 0 || c.alimentos.every((a) => a.cumplido));
    const notas =
      i === 0 ? "Hoy comí fuera, ensalada de quinoa." :
      i === 2 ? "Entreno intenso de piernas." :
      i === 4 ? "Se me olvidó la media mañana." :
      i === 8 ? "Día libre — picoteo ligero." :
      null;
    try {
      await client.query(
        `INSERT INTO seguimiento_diario (
          id, "pacienteId", fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos", "ejercicioKcal",
          "ejercicioTipo", "ejercicioDistanciaKm", notas, "comidasData", "createdAt", "updatedAt"
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12::jsonb, $13, $13)`,
        [
          cuid(), pacienteId, fecha, cumplido, agua, ejercicio, minutos, kcal,
          ejercicio ? (i % 3 === 0 ? "Cardio" : "Fuerza") : null, distancia, notas,
          JSON.stringify(comidasDia), now,
        ],
      );
    } catch (e) {
      console.warn(`  ! No se pudo insertar seguimiento de ${fecha.toISOString().slice(0, 10)}: ${(e as Error).message}`);
    }
  }

  // Entradas de diario alimentario (10 entradas variadas en días distintos)
  const entradasDiario = [
    { diasAtras: 0, tipo: "DESAYUNO", alimentoId: avena, cantidad: 50, descripcion: "Avena con leche y fruta", notas: "Me senté a desayunar tranquilo." },
    { diasAtras: 0, tipo: "ALMUERZO", alimentoId: salmon, cantidad: 150, descripcion: "Salmón al horno con ensalada", notas: "Muy saciante." },
    { diasAtras: 1, tipo: "DESAYUNO", alimentoId: panIntegral, cantidad: 60, descripcion: "Tostadas con aguacate y huevo", notas: null },
    { diasAtras: 1, tipo: "ALMUERZO", alimentoId: pollo, cantidad: 150, descripcion: "Pollo a la plancha con ensalada", notas: "Muy satisfecho, no necesité repetir." },
    { diasAtras: 2, tipo: "MERIENDA", alimentoId: manzana, cantidad: 180, descripcion: "Manzana y yogur", notas: null },
    { diasAtras: 2, tipo: "CENA", alimentoId: merluza, cantidad: 150, descripcion: "Merluza al horno con patatas", notas: "Cena ligera." },
    { diasAtras: 4, tipo: "DESAYUNO", alimentoId: yogur, cantidad: 125, descripcion: "Yogur con fresas y almendras", notas: null },
    { diasAtras: 5, tipo: "ALMUERZO", alimentoId: lentejas, cantidad: 80, descripcion: "Lentejas estofadas con verduras", notas: "Plato completo." },
    { diasAtras: 6, tipo: "MERIENDA", alimentoId: platano, cantidad: 100, descripcion: "Plátano y nueces pre-entreno", notas: null },
    { diasAtras: 8, tipo: "CENA", alimentoId: huevo, cantidad: 120, descripcion: "Tortilla francesa con ensalada", notas: "Noche sencilla." },
  ];
  for (const e of entradasDiario) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - e.diasAtras);
    try {
      await client.query(
        `INSERT INTO entradas_diario (id, "pacienteId", fecha, "tipoComida", "alimentoId", cantidad, unidad, descripcion, notas, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, 'GRAMOS', $7, $8, $9, $9)`,
        [cuid(), pacienteId, fecha, e.tipo, e.alimentoId, e.cantidad, e.descripcion, e.notas, now],
      );
    } catch (err) {
      console.warn(`  ! No se pudo insertar entrada de diario: ${(err as Error).message}`);
    }
  }

  // Pagos de ejemplo (3 registros: 1 pagado transferencia, 1 pagado Stripe, 1 pendiente)
  const pagosDemo = [
    { diasAtras: 60, concepto: "Consulta inicial — valoración y plan", importe: 45, estado: "PAGADO", metodoPago: "Transferencia", diasHastaPago: 2, notas: "Primera consulta. Incluye valoración completa y elaboración del plan nutricional." },
    { diasAtras: 25, concepto: "Revisión mensual — seguimiento", importe: 30, estado: "PAGADO", metodoPago: "Stripe", diasHastaPago: 0, notas: "Revisión de evolución a los 30 días." },
    { diasAtras: 3, concepto: "Próxima revisión mensual", importe: 30, estado: "PENDIENTE", metodoPago: null, diasHastaPago: null as number | null, notas: "Pendiente de cobro. Revisión programada." },
  ];
  for (const p of pagosDemo) {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - p.diasAtras);
    const fechaPago = p.diasHastaPago !== null
      ? (() => { const d = new Date(createdAt); d.setDate(d.getDate() + p.diasHastaPago); return d; })()
      : null;
    try {
      await client.query(
        `INSERT INTO pagos (id, "dietistaId", "pacienteId", concepto, importe, estado, "metodoPago", "fechaPago", notas, "createdAt", "updatedAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $10)`,
        [cuid(), dietistaId, pacienteId, p.concepto, p.importe, p.estado, p.metodoPago, fechaPago, p.notas, createdAt],
      );
    } catch (err) {
      console.warn(`  ! No se pudo insertar pago demo: ${(err as Error).message}`);
    }
  }

  return { creado: true, pacienteId };
}

async function main() {
  const client = await pool.connect();
  try {
    const { rows: dietistas } = await client.query<{
      id: string;
      nombre: string;
      apellidos: string;
      email: string;
    }>(`SELECT id, nombre, apellidos, email FROM dietistas ORDER BY "createdAt" ASC`);

    console.log(`Encontrados ${dietistas.length} dietistas\n`);
    if (REBUILD) console.log("⚠️  Modo REBUILD: se eliminarán los pacientes demo existentes\n");

    let creados = 0;
    let yaExistian = 0;
    for (const d of dietistas) {
      try {
        const res = await crearDemoParaDietista(client, d.id);
        if (res.creado) {
          creados++;
          console.log(`  ✓ ${d.nombre} ${d.apellidos} (${d.email}) → demo creado`);
        } else {
          yaExistian++;
          console.log(`  · ${d.nombre} ${d.apellidos} (${d.email}) → ya tenía demo`);
        }
      } catch (e) {
        console.error(`  ✗ ${d.nombre} ${d.apellidos}:`, (e as Error).message);
      }
    }

    console.log(`\n✓ Creados: ${creados}. Ya tenían: ${yaExistian}.`);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
