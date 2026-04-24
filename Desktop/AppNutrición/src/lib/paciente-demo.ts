import type { PrismaClient } from "@/generated/prisma/client";

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;
const COMIDAS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA"] as const;

const FICHA_INFORMACION = {
  consulta: {
    motivo: "Pérdida de peso saludable y mejora del hábito alimentario. Quiere aprender a comer mejor sin pasar hambre.",
    expectativas: "Perder 5 kg en 3 meses y mantener el peso a largo plazo. Mejorar energía y digestión.",
    objetivosClinicos: "control_peso",
    objetivosClinicosDetalle: "Perder 5 kg de forma saludable en 3 meses",
    otras: "Vida sedentaria por trabajo de oficina. Quiere establecer rutina de ejercicio y mejorar composición corporal.",
  },
  personalSocial: {
    funcionIntestinal: "Regular, 1 vez al día, sin molestias.",
    calidadSueno: "Buena en general, 7-8h, a veces despierta a media noche sin motivo aparente.",
    fumador: "No",
    alcohol: "Ocasional: 1-2 cervezas los fines de semana.",
    estadoCivil: "Soltero",
    actividadFisica: "Ligera-moderada: camina al trabajo (15 min) y gimnasio 3 veces por semana.",
    raza: "Caucásico",
    otrasPersonal: "Vida social activa. Come fuera 2-3 veces por semana.",
  },
  clinica: {
    patologiasDetalle: "HTA diagnosticada hace 2 años, controlada con medicación. Hipotiroidismo subclínico leve.",
    medicacion: "Enalapril 10 mg cada 24 h. Levotiroxina 50 mcg en ayunas.",
    antecedentesPersonales: "Apendicectomía a los 14 años. Sin otros antecedentes relevantes.",
    antecedentesFamiliares: "Padre con diabetes tipo 2. Madre con hipertensión. Abuelo materno con infarto.",
    otrasClinicas: "Análisis recientes: colesterol total 210, LDL 135, HDL 45, TG 160. TSH 4.5 mU/L.",
  },
  alimentaria: {
    horaLevantarse: "07:00",
    horaAcostarse: "23:30",
    tiposDieta: "Mediterránea. No sigue ninguna dieta restrictiva.",
    alimentosFavoritos: "Pescado azul, pasta, frutas cítricas, arroz con pollo, aceitunas.",
    alimentosRechazados: "Casquería, hígado, pescado crudo, kale.",
    alergiasDetalle: "Frutos secos (almendra en particular): picor en boca y garganta.",
    intoleranciasDetalle: "Lactosa en cantidades grandes: molestias digestivas.",
    deficiencias: "Vitamina D por debajo del rango en último análisis (22 ng/mL).",
    ingestaAgua: "1.5-2 litros diarios aproximadamente.",
    otrasAlimentaria: "Come fuera 2-3 veces por semana. Cocina 4-5 días en casa.",
  },
};

// Los colores válidos del componente son: trabajo | ejercicio | comida | descanso | otro
// Las horas deben ser en punto (HH:00) para que aparezcan en la rejilla del horario semanal.
const HORARIO_ENTRIES = [
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
  otrasRecomendaciones: "Cenar ligero 2-3 horas antes de dormir. Masticar despacio y comer sin pantallas. Priorizar alimentos frescos y de temporada. Cocinar al vapor, plancha o horno.",
};

export async function crearPacienteDemoSiNoExiste(
  prisma: PrismaClient,
  dietistaId: string,
): Promise<{ id: string; creado: boolean }> {
  // Respetar la decisión del nutri: si eliminó el demo conscientemente, NO re-crearlo.
  // Puede restaurarlo con un botón en la lista de pacientes.
  const flagRows = await prisma.$queryRawUnsafe<{ demoEliminado: boolean }[]>(
    `SELECT "demoEliminado" FROM dietistas WHERE id = $1`,
    dietistaId,
  );
  if (flagRows[0]?.demoEliminado) {
    return { id: "", creado: false };
  }

  // Raw SQL también para el findFirst — defensivo por si el cliente Prisma está desactualizado
  const existentes = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `SELECT id FROM pacientes WHERE "dietistaId" = $1 AND nombre = 'Paciente' AND apellidos = 'Prueba' LIMIT 1`,
    dietistaId,
  );
  const existente = existentes[0] ?? null;
  if (existente) {
    // Auto-alineación del paciente demo al mes actual.
    // Solo se ejecuta si el mes más reciente del seguimiento diario no coincide con el mes actual.
    // Es una operación barata (UPDATEs con INTERVAL) y solo se dispara UNA vez por mes
    // cuando el nutri vuelve tras un cambio de mes. No toca NUNCA pacientes reales.
    // Usamos raw SQL porque algunos modelos (seguimiento_diario) no se acceden bien por el cliente
    // con el adaptador de pg en todas las versiones.
    const ultimoRows = await prisma.$queryRawUnsafe<{ fecha: Date }[]>(
      `SELECT fecha FROM seguimiento_diario WHERE "pacienteId" = $1 ORDER BY fecha DESC LIMIT 1`,
      existente.id,
    );
    const ultimo = ultimoRows[0];
    if (ultimo) {
      const ahora = new Date();
      const ultimaFecha = new Date(ultimo.fecha);
      const diffMeses =
        (ahora.getFullYear() - ultimaFecha.getFullYear()) * 12 +
        (ahora.getMonth() - ultimaFecha.getMonth());
      if (diffMeses !== 0) {
        // Desplazar TODAS las fechas del paciente demo diffMeses meses (+ o –)
        // Postgres mantiene el día del mes al sumar INTERVAL 'N month' (salvo ajustes por fin de mes).
        const intervalo = `${diffMeses} month`;
        await prisma.$executeRawUnsafe(
          `UPDATE seguimiento_diario SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE citas SET "fechaHora" = "fechaHora" + $1::interval WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE medidas_antropometricas SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE consultas SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE entradas_diario SET fecha = fecha + $1::interval WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE enlaces_compartidos SET "expiraEn" = "expiraEn" + $1::interval
           WHERE "planId" IN (SELECT id FROM planes_alimenticios WHERE "pacienteId" = $2)
             AND "expiraEn" IS NOT NULL`,
          intervalo, existente.id,
        );
        // Planificaciones (datos sí, fechas no cambian — solo mantenemos consistencia si tienen fecha)
        await prisma.$executeRawUnsafe(
          `UPDATE planificaciones
           SET "fechaInicio" = "fechaInicio" + $1::interval,
               "fechaUltimoCambio" = "fechaUltimoCambio" + $1::interval,
               "fechaFinPrevista" = CASE WHEN "fechaFinPrevista" IS NOT NULL THEN "fechaFinPrevista" + $1::interval ELSE NULL END
           WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
      }
    }
    return { id: existente.id, creado: false };
  }

  // Crear el paciente con raw SQL — evitamos depender del cliente Prisma generado
  // (que puede no tener todos los campos del schema si no se regeneró tras un cambio).
  const pacienteIdRows = await prisma.$queryRawUnsafe<{ id: string }[]>(
    `INSERT INTO pacientes (
      id, "dietistaId", nombre, apellidos, email, telefono, "fotoUrl", sexo,
      "fechaNacimiento", altura, peso, objetivo, "objetivoDetalle",
      "nivelActividad", "frecuenciaEjercicio", "tipoEjercicio",
      "horarioTrabajo", "horarioEjercicio", "horasDescanso", ocupacion,
      preferencias, alergias, intolerancias, patologias, medicamentos, suplementos,
      "fichaInformacion", horario, recomendaciones, notas, activo, "createdAt", "updatedAt"
    ) VALUES (
      gen_random_uuid()::text, $1, 'Paciente', 'Prueba', $2, $3, $4, 'MASCULINO',
      $5, 175, 78, 'PERDER_PESO', $6,
      'moderado', '3 veces por semana', 'Entrenamiento de fuerza y cardio',
      '09:00 – 18:00', 'L/X/V 19:00', '7-8 horas', 'Oficina',
      $7::text[], $8::text[], $9::text[], $10::text[], $11::text[], $12::text[],
      $13::jsonb, $14::jsonb, $15, $16, true, NOW(), NOW()
    ) RETURNING id`,
    dietistaId,
    "paciente.prueba@demo.annonia.com",
    "+34 600 123 456",
    "/demo-paciente-avatar.svg",
    new Date(Date.UTC(1992, 5, 15)),
    "Perder 5 kg de forma saludable en 3 meses",
    ["Mediterránea", "Pescado azul", "Verduras de temporada", "Sin ultraprocesados"],
    ["Frutos secos (almendras)", "Polen estacional"],
    ["Lactosa (parcial)"],
    ["Hipertensión controlada", "Hipotiroidismo subclínico leve"],
    ["Enalapril 10 mg cada 24 h", "Levotiroxina 50 mcg en ayunas"],
    ["Vitamina D3 1000 UI", "Omega-3 EPA/DHA", "Magnesio bisglicinato"],
    JSON.stringify(FICHA_INFORMACION),
    JSON.stringify(HORARIO_ENTRIES),
    JSON.stringify(RECOMENDACIONES),
    "Paciente de prueba preconfigurado para que explores las funciones de la app. Puedes editarlo o eliminarlo cuando quieras.",
  );
  const paciente = { id: pacienteIdRows[0].id };

  const buscar = (nombre: string) =>
    prisma.alimento.findFirst({
      where: { nombre: { contains: nombre, mode: "insensitive" } },
      select: { id: true },
    });

  const [
    avena, platano, lecheEntera, pollo, arroz, brocoli, aceite, manzana, yogur, nueces,
    huevo, aguacate, salmon, espinacas, patata, pastaIntegral, tomate, pepino,
    lentejas, garbanzos, queso, panIntegral, ternera, merluza, cebolla, pimiento,
    naranja, pera, almendras, jamonSerrano, aceitunas, quinoa, fresas, boniato,
  ] = await Promise.all([
    buscar("avena"), buscar("plátano"), buscar("leche entera"), buscar("pollo"),
    buscar("arroz"), buscar("brócoli"), buscar("aceite de oliva"), buscar("manzana"),
    buscar("yogur"), buscar("nueces"),
    buscar("huevo"), buscar("aguacate"), buscar("salmón"), buscar("espinaca"),
    buscar("patata"), buscar("pasta integral"), buscar("tomate"), buscar("pepino"),
    buscar("lentejas"), buscar("garbanzos"), buscar("queso"), buscar("pan integral"),
    buscar("ternera"), buscar("merluza"), buscar("cebolla"), buscar("pimiento"),
    buscar("naranja"), buscar("pera"), buscar("almendra"), buscar("jamón serrano"),
    buscar("aceitunas"), buscar("quinoa"), buscar("fresa"), buscar("boniato"),
  ]);

  type LunesRellenos = Record<string, Array<{ alimentoId?: string; cantidad: number }>>;

  async function crearPlanConDias(
    nombre: string,
    caloriasObj: number,
    macros: { prot: number; carb: number; grasa: number },
    activo: boolean,
    diasAntes: number,
    lunesRellenos: LunesRellenos,
  ) {
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - diasAntes);
    const plan = await prisma.planAlimenticio.create({
      data: {
        dietistaId, pacienteId: paciente.id,
        nombre,
        caloriasObjetivo: caloriasObj,
        proteinasObjetivo: macros.prot,
        carbohidratosObjetivo: macros.carb,
        grasasObjetivo: macros.grasa,
        activo,
        createdAt,
        dias: {
          create: DIAS.map((dia) => ({
            dia,
            comidas: { create: COMIDAS.map((tipo, orden) => ({ tipo, orden })) },
          })),
        },
      },
      include: { dias: { include: { comidas: { select: { id: true, tipo: true } } } } },
    });
    // Replicar los mismos alimentos en los 7 días de la semana
    const items: { comidaId: string; alimentoId: string; cantidad: number; orden: number }[] = [];
    for (const diaObj of plan.dias) {
      for (const [tipo, alimentos] of Object.entries(lunesRellenos)) {
        const comida = diaObj.comidas.find((c) => c.tipo === tipo);
        if (!comida) continue;
        let orden = 0;
        for (const a of alimentos) {
          if (!a.alimentoId) continue;
          items.push({ comidaId: comida.id, alimentoId: a.alimentoId, cantidad: a.cantidad, orden });
          orden++;
        }
      }
    }
    if (items.length > 0) {
      await prisma.alimentoEnComida.createMany({
        data: items.map((i) => ({ ...i, unidad: "GRAMOS" })),
      });
    }
  }

  const now = new Date();

  // Plan 1 — Inicial (activo)
  await crearPlanConDias("Plan inicial — ejemplo", 2000, { prot: 150, carb: 220, grasa: 70 }, true, 0, {
    DESAYUNO: [
      { alimentoId: avena?.id, cantidad: 60 },
      { alimentoId: platano?.id, cantidad: 100 },
      { alimentoId: lecheEntera?.id, cantidad: 200 },
    ],
    ALMUERZO: [
      { alimentoId: pollo?.id, cantidad: 150 },
      { alimentoId: arroz?.id, cantidad: 80 },
      { alimentoId: brocoli?.id, cantidad: 150 },
      { alimentoId: aceite?.id, cantidad: 10 },
    ],
    MERIENDA: [
      { alimentoId: manzana?.id, cantidad: 180 },
      { alimentoId: yogur?.id, cantidad: 125 },
      { alimentoId: nueces?.id, cantidad: 20 },
    ],
    CENA: [
      { alimentoId: pollo?.id, cantidad: 120 },
      { alimentoId: brocoli?.id, cantidad: 200 },
      { alimentoId: aceite?.id, cantidad: 8 },
    ],
  });

  // Plan 2 — Mantenimiento
  await crearPlanConDias("Plan de mantenimiento", 2200, { prot: 140, carb: 260, grasa: 75 }, false, 20, {
    DESAYUNO: [
      { alimentoId: panIntegral?.id, cantidad: 60 },
      { alimentoId: huevo?.id, cantidad: 100 },
      { alimentoId: aguacate?.id, cantidad: 50 },
    ],
    ALMUERZO: [
      { alimentoId: pastaIntegral?.id, cantidad: 100 },
      { alimentoId: ternera?.id, cantidad: 120 },
      { alimentoId: tomate?.id, cantidad: 100 },
      { alimentoId: aceite?.id, cantidad: 10 },
    ],
    MERIENDA: [
      { alimentoId: naranja?.id, cantidad: 150 },
      { alimentoId: almendras?.id, cantidad: 25 },
    ],
    CENA: [
      { alimentoId: merluza?.id, cantidad: 150 },
      { alimentoId: patata?.id, cantidad: 200 },
      { alimentoId: espinacas?.id, cantidad: 100 },
    ],
  });

  // Plan 3 — Deportivo
  await crearPlanConDias("Plan deportivo — alto volumen", 2600, { prot: 180, carb: 320, grasa: 75 }, false, 40, {
    DESAYUNO: [
      { alimentoId: avena?.id, cantidad: 80 },
      { alimentoId: platano?.id, cantidad: 120 },
      { alimentoId: huevo?.id, cantidad: 150 },
    ],
    ALMUERZO: [
      { alimentoId: ternera?.id, cantidad: 180 },
      { alimentoId: boniato?.id, cantidad: 250 },
      { alimentoId: pimiento?.id, cantidad: 100 },
      { alimentoId: aceite?.id, cantidad: 12 },
    ],
    MERIENDA: [
      { alimentoId: yogur?.id, cantidad: 200 },
      { alimentoId: fresas?.id, cantidad: 100 },
      { alimentoId: almendras?.id, cantidad: 30 },
    ],
    CENA: [
      { alimentoId: salmon?.id, cantidad: 180 },
      { alimentoId: quinoa?.id, cantidad: 80 },
      { alimentoId: espinacas?.id, cantidad: 150 },
    ],
  });

  // Plan 4 — Low-carb
  await crearPlanConDias("Plan low-carb", 1800, { prot: 140, carb: 90, grasa: 115 }, false, 60, {
    DESAYUNO: [
      { alimentoId: huevo?.id, cantidad: 150 },
      { alimentoId: aguacate?.id, cantidad: 80 },
      { alimentoId: aceitunas?.id, cantidad: 30 },
    ],
    ALMUERZO: [
      { alimentoId: salmon?.id, cantidad: 180 },
      { alimentoId: espinacas?.id, cantidad: 200 },
      { alimentoId: aceite?.id, cantidad: 15 },
    ],
    MERIENDA: [
      { alimentoId: queso?.id, cantidad: 50 },
      { alimentoId: nueces?.id, cantidad: 25 },
    ],
    CENA: [
      { alimentoId: ternera?.id, cantidad: 150 },
      { alimentoId: brocoli?.id, cantidad: 200 },
      { alimentoId: aceite?.id, cantidad: 10 },
    ],
  });

  // Plan 5 — Mediterránea legumbres
  await crearPlanConDias("Plan mediterráneo — legumbres", 1900, { prot: 110, carb: 230, grasa: 65 }, false, 75, {
    DESAYUNO: [
      { alimentoId: panIntegral?.id, cantidad: 50 },
      { alimentoId: tomate?.id, cantidad: 80 },
      { alimentoId: aceite?.id, cantidad: 8 },
      { alimentoId: jamonSerrano?.id, cantidad: 30 },
    ],
    ALMUERZO: [
      { alimentoId: lentejas?.id, cantidad: 80 },
      { alimentoId: cebolla?.id, cantidad: 40 },
      { alimentoId: pimiento?.id, cantidad: 60 },
      { alimentoId: aceite?.id, cantidad: 8 },
    ],
    MERIENDA: [
      { alimentoId: pera?.id, cantidad: 180 },
      { alimentoId: yogur?.id, cantidad: 125 },
    ],
    CENA: [
      { alimentoId: garbanzos?.id, cantidad: 70 },
      { alimentoId: espinacas?.id, cantidad: 150 },
      { alimentoId: pepino?.id, cantidad: 100 },
      { alimentoId: aceite?.id, cantidad: 8 },
    ],
  });

  // Medidas (8 puntos con evolución)
  const medidas = [
    { diasAtras: 90, peso: 83.2, imc: 27.2, grasa: 24.1, muscular: 31.8, cintura: 98, cadera: 102.5, brazo: 33.8, notas: "Primera toma de contacto. Se pactan objetivos." },
    { diasAtras: 75, peso: 82.5, imc: 26.9, grasa: 23.5, muscular: 32.2, cintura: 97, cadera: 102, brazo: 34, notas: "Medida inicial tras arranque del plan." },
    { diasAtras: 60, peso: 81.3, imc: 26.5, grasa: 23.0, muscular: 32.5, cintura: 96, cadera: 101.5, brazo: 34, notas: "Evolución lenta pero positiva." },
    { diasAtras: 45, peso: 80.2, imc: 26.1, grasa: 22.4, muscular: 32.8, cintura: 94.5, cadera: 101, brazo: 34.2, notas: "Buena adherencia al plan." },
    { diasAtras: 30, peso: 79.1, imc: 25.8, grasa: 21.8, muscular: 33.0, cintura: 93, cadera: 100, brazo: 34.5, notas: "Revisión mensual." },
    { diasAtras: 15, peso: 78.2, imc: 25.5, grasa: 21.0, muscular: 33.3, cintura: 92, cadera: 99.5, brazo: 34.5, notas: "Reducción de cintura notable." },
    { diasAtras: 7, peso: 77.9, imc: 25.4, grasa: 20.7, muscular: 33.4, cintura: 91.5, cadera: 99.2, brazo: 34.6, notas: "Evolución estable." },
    { diasAtras: 3, peso: 77.6, imc: 25.3, grasa: 20.5, muscular: 33.5, cintura: 91, cadera: 99, brazo: 34.8, notas: "Última medida. -5.6 kg desde el inicio." },
  ];
  const medidasCreadas: { id: string }[] = [];
  for (const m of medidas) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - m.diasAtras);
    const creada = await prisma.medidaAntropometrica.create({
      data: {
        pacienteId: paciente.id, fecha,
        peso: m.peso, altura: 175, imc: m.imc,
        grasaCorporal: m.grasa, masaMuscular: m.muscular,
        perimetroCintura: m.cintura, perimetroCadera: m.cadera, perimetroBrazo: m.brazo,
        notas: m.notas,
      },
      select: { id: true },
    });
    medidasCreadas.push(creada);
  }

  // Consultas (índices actualizados para el array de 8 medidas)
  const consultas = [
    { diasAtras: 75, motivo: "Primera consulta", notas: "Anamnesis completa, antropometría y pactación de plan.", medidaIdx: 1 },
    { diasAtras: 45, motivo: "Revisión de seguimiento", notas: "Primera revisión. Pérdida de 2.3 kg. Ajuste de raciones.", medidaIdx: 3 },
    { diasAtras: 15, motivo: "Revisión mensual", notas: "Segunda revisión. Pérdida total 4.3 kg.", medidaIdx: 5 },
  ];
  for (const c of consultas) {
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - c.diasAtras);
    await prisma.consulta.create({
      data: {
        pacienteId: paciente.id, dietistaId, fecha, motivo: c.motivo, notas: c.notas,
        medidaId: medidasCreadas[c.medidaIdx].id,
      },
    });
  }

  // Citas (1 completada, 1 cancelada, 1 futura confirmada)
  const citaPasada = new Date(now); citaPasada.setDate(now.getDate() - 15); citaPasada.setHours(10, 0, 0, 0);
  const citaCancelada = new Date(now); citaCancelada.setDate(now.getDate() - 5); citaCancelada.setHours(17, 0, 0, 0);
  const citaFutura = new Date(now); citaFutura.setDate(now.getDate() + 12); citaFutura.setHours(11, 30, 0, 0);
  await prisma.cita.createMany({
    data: [
      { pacienteId: paciente.id, dietistaId, fechaHora: citaPasada, duracion: 45, motivo: "Segunda revisión de seguimiento", estado: "COMPLETADA", notas: "Revisión presencial. Ajuste de plan." },
      { pacienteId: paciente.id, dietistaId, fechaHora: citaCancelada, duracion: 30, motivo: "Consulta puntual — duda sobre suplementación", estado: "CANCELADA", notas: "El paciente avisó con antelación; reprogramada." },
      { pacienteId: paciente.id, dietistaId, fechaHora: citaFutura, duracion: 30, motivo: "Tercera revisión mensual", estado: "CONFIRMADA", notas: "Próxima revisión." },
    ],
  });

  // Acceso al portal del paciente (PIN = 123456, perfil completado)
  async function hashPinDemo(pin: string): Promise<string> {
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
  // El email de AccesoPaciente es UNIQUE global, así que añadimos sufijo único por paciente
  const emailAccesoPortal = `paciente.prueba+${paciente.id.slice(-6)}@demo.annonia.com`;
  await prisma.accesoPaciente.create({
    data: {
      pacienteId: paciente.id,
      email: emailAccesoPortal,
      pinHash: await hashPinDemo("123456"),
      perfilCompleto: true,
      activo: true,
    },
  });

  // Enlace compartido del plan activo (entregable de ejemplo)
  const planActivo = await prisma.planAlimenticio.findFirst({
    where: { pacienteId: paciente.id, activo: true },
    select: { id: true },
  });
  if (planActivo) {
    const expira = new Date(now); expira.setDate(now.getDate() + 30);
    await prisma.enlaceCompartido.create({
      data: {
        planId: planActivo.id,
        dietistaId,
        activo: true,
        expiraEn: expira,
      },
    });
  }

  // Planificación por defecto con datos coherentes (raw SQL porque la tabla no está en schema.prisma como modelo nativo)
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
  const fechaInicio = new Date(now); fechaInicio.setDate(now.getDate() - 90);
  const fechaFin = new Date(now); fechaFin.setDate(now.getDate() + 90);
  await prisma.$queryRawUnsafe(
    `INSERT INTO planificaciones (
      "pacienteId", "dietistaId", nombre, estado, "esDefecto",
      "fechaInicio", "fechaUltimoCambio", "fechaFinPrevista", datos
    ) VALUES ($1, $2, 'Planificación por defecto', 'activa', true, $3, $4, $5, $6::jsonb)`,
    paciente.id, dietistaId, fechaInicio, now, fechaFin, JSON.stringify(planificacionDatos),
  );

  // Cargar mapa id → nombre para comidasData
  const idsAlim = [
    avena?.id, platano?.id, lecheEntera?.id, pollo?.id, arroz?.id, brocoli?.id, aceite?.id,
    manzana?.id, yogur?.id, nueces?.id, huevo?.id, aguacate?.id, salmon?.id, espinacas?.id,
    patata?.id, pastaIntegral?.id, tomate?.id, pepino?.id, lentejas?.id, garbanzos?.id,
    queso?.id, panIntegral?.id, ternera?.id, merluza?.id, cebolla?.id, pimiento?.id,
    naranja?.id, pera?.id, almendras?.id, jamonSerrano?.id, aceitunas?.id, quinoa?.id,
    fresas?.id, boniato?.id,
  ].filter((x): x is string => !!x);
  const nombresRows: Array<{ id: string; nombre: string }> = idsAlim.length > 0
    ? await prisma.alimento.findMany({ where: { id: { in: idsAlim } }, select: { id: true, nombre: true } })
    : [];
  const nombreDe = new Map(nombresRows.map((r) => [r.id, r.nombre]));
  const item = (id: string | undefined | null, cantidad: number, cumplido: boolean) =>
    (id && nombreDe.has(id)) ? { nombre: nombreDe.get(id)!, cantidad, cumplido } : null;

  const HORAS = { DESAYUNO: "08:30", MEDIA_MANANA: "11:00", ALMUERZO: "14:00", MERIENDA: "17:30", CENA: "21:00" };
  function buildComidasDia(diaIdx: number) {
    const c: boolean[] =
      diaIdx === 4 ? [true, true, false, true, true] :
      diaIdx === 8 ? [true, false, true, false, true] :
      diaIdx === 9 ? [true, true, true, false, false] :
      [true, true, true, true, true];
    const variante = diaIdx % 3;
    if (variante === 0) {
      return [
        { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(avena?.id, 50, c[0]), item(platano?.id, 100, c[0]), item(lecheEntera?.id, 200, c[0])].filter(Boolean) },
        { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(manzana?.id, 150, c[1])].filter(Boolean) },
        { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(pollo?.id, 150, c[2]), item(arroz?.id, 80, c[2]), item(brocoli?.id, 150, c[2])].filter(Boolean) },
        { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(yogur?.id, 125, c[3]), item(nueces?.id, 20, c[3])].filter(Boolean) },
        { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(salmon?.id, 150, c[4]), item(espinacas?.id, 200, c[4])].filter(Boolean) },
      ];
    }
    if (variante === 1) {
      return [
        { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(panIntegral?.id, 60, c[0]), item(huevo?.id, 100, c[0]), item(aguacate?.id, 50, c[0])].filter(Boolean) },
        { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(pera?.id, 150, c[1])].filter(Boolean) },
        { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(pastaIntegral?.id, 100, c[2]), item(ternera?.id, 120, c[2]), item(tomate?.id, 100, c[2])].filter(Boolean) },
        { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(naranja?.id, 150, c[3]), item(almendras?.id, 25, c[3])].filter(Boolean) },
        { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(merluza?.id, 150, c[4]), item(patata?.id, 200, c[4])].filter(Boolean) },
      ];
    }
    return [
      { tipo: "DESAYUNO", horaReal: HORAS.DESAYUNO, alimentos: [item(panIntegral?.id, 50, c[0]), item(tomate?.id, 80, c[0]), item(jamonSerrano?.id, 30, c[0])].filter(Boolean) },
      { tipo: "MEDIA_MANANA", horaReal: HORAS.MEDIA_MANANA, alimentos: [item(fresas?.id, 100, c[1])].filter(Boolean) },
      { tipo: "ALMUERZO", horaReal: HORAS.ALMUERZO, alimentos: [item(lentejas?.id, 80, c[2]), item(cebolla?.id, 40, c[2]), item(pimiento?.id, 60, c[2])].filter(Boolean) },
      { tipo: "MERIENDA", horaReal: HORAS.MERIENDA, alimentos: [item(yogur?.id, 125, c[3]), item(almendras?.id, 20, c[3])].filter(Boolean) },
      { tipo: "CENA", horaReal: HORAS.CENA, alimentos: [item(garbanzos?.id, 70, c[4]), item(espinacas?.id, 150, c[4]), item(pepino?.id, 100, c[4])].filter(Boolean) },
    ];
  }

  // Seguimiento diario últimos 14 días con huecos intercalados (días 3, 7, 11 sin registro)
  const SIN_REGISTRO = new Set([3, 7, 11]);
  for (let i = 0; i < 14; i++) {
    if (SIN_REGISTRO.has(i)) continue;
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - i);
    fecha.setHours(0, 0, 0, 0);
    const ejercicio = i % 2 === 0;
    const comidasDia = buildComidasDia(i);
    const cumplido = comidasDia.every((c) => !c.alimentos.length || c.alimentos.every((a) => (a as { cumplido: boolean }).cumplido));
    const notas =
      i === 0 ? "Hoy comí fuera, ensalada de quinoa." :
      i === 2 ? "Entreno intenso de piernas." :
      i === 4 ? "Se me olvidó la media mañana." :
      i === 8 ? "Día libre — picoteo ligero." :
      null;
    try {
      await prisma.$queryRawUnsafe(
        `INSERT INTO seguimiento_diario (
          id, "pacienteId", fecha, cumplido, "aguaML", ejercicio, "ejercicioMinutos", "ejercicioKcal",
          "ejercicioTipo", "ejercicioDistanciaKm", notas, "comidasData", "createdAt", "updatedAt"
        ) VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, NOW(), NOW())`,
        paciente.id, fecha, cumplido,
        1600 + Math.round(Math.random() * 800),
        ejercicio,
        ejercicio ? 30 + Math.round(Math.random() * 30) : 0,
        ejercicio ? 180 : 0,
        ejercicio ? (i % 3 === 0 ? "Cardio" : "Fuerza") : null,
        ejercicio && i % 3 === 0 ? 4.5 : 0,
        notas,
        JSON.stringify(comidasDia),
      );
    } catch {
      // ignorar si ya existe
    }
  }

  // Entradas de diario alimentario (10 entradas variadas)
  const entradas = [
    { diasAtras: 0, tipo: "DESAYUNO" as const, alimentoId: avena?.id, cantidad: 50, descripcion: "Avena con leche y fruta", notas: "Me senté a desayunar tranquilo." },
    { diasAtras: 0, tipo: "ALMUERZO" as const, alimentoId: salmon?.id, cantidad: 150, descripcion: "Salmón al horno con ensalada", notas: "Muy saciante." },
    { diasAtras: 1, tipo: "DESAYUNO" as const, alimentoId: panIntegral?.id, cantidad: 60, descripcion: "Tostadas con aguacate y huevo", notas: null },
    { diasAtras: 1, tipo: "ALMUERZO" as const, alimentoId: pollo?.id, cantidad: 150, descripcion: "Pollo a la plancha con ensalada", notas: "Muy satisfecho." },
    { diasAtras: 2, tipo: "MERIENDA" as const, alimentoId: manzana?.id, cantidad: 180, descripcion: "Manzana y yogur", notas: null },
    { diasAtras: 2, tipo: "CENA" as const, alimentoId: merluza?.id, cantidad: 150, descripcion: "Merluza al horno con patatas", notas: "Cena ligera." },
    { diasAtras: 4, tipo: "DESAYUNO" as const, alimentoId: yogur?.id, cantidad: 125, descripcion: "Yogur con fresas y almendras", notas: null },
    { diasAtras: 5, tipo: "ALMUERZO" as const, alimentoId: lentejas?.id, cantidad: 80, descripcion: "Lentejas estofadas con verduras", notas: "Plato completo." },
    { diasAtras: 6, tipo: "MERIENDA" as const, alimentoId: platano?.id, cantidad: 100, descripcion: "Plátano y nueces pre-entreno", notas: null },
    { diasAtras: 8, tipo: "CENA" as const, alimentoId: huevo?.id, cantidad: 120, descripcion: "Tortilla francesa con ensalada", notas: "Noche sencilla." },
  ];
  for (const e of entradas) {
    if (!e.alimentoId) continue;
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - e.diasAtras);
    await prisma.entradaDiario.create({
      data: {
        pacienteId: paciente.id, fecha, tipoComida: e.tipo,
        alimentoId: e.alimentoId, cantidad: e.cantidad, unidad: "GRAMOS",
        descripcion: e.descripcion, notas: e.notas,
      },
    });
  }

  return { id: paciente.id, creado: true };
}
