import type { PrismaClient } from "@/generated/prisma/client";
import { AVATAR_DEMO } from "@/lib/tour-demo-data";

export { AVATAR_DEMO };

const DIAS = ["LUNES", "MARTES", "MIERCOLES", "JUEVES", "VIERNES", "SABADO", "DOMINGO"] as const;
const COMIDAS = ["DESAYUNO", "MEDIA_MANANA", "ALMUERZO", "MERIENDA", "CENA"] as const;

// ─── Locale-keyed demo strings (seed data stored in DB) ──────────────

type Locale = "es" | "pt";

interface HorarioEntry { dia: string; hora: string; actividad: string; color: string }

interface DemoStrings {
  objetivoDetalle: string;
  preferencias: string[];
  alergias: string[];
  intolerancias: string[];
  patologias: string[];
  medicamentos: string[];
  suplementos: string[];
  nota: string;
  ficha: {
    consulta: { motivo: string; expectativas: string; objetivosClinicos: string; objetivosClinicosDetalle: string; otras: string };
    personalSocial: { funcionIntestinal: string; calidadSueno: string; fumador: string; alcohol: string; estadoCivil: string; actividadFisica: string; raza: string; otrasPersonal: string };
    clinica: { patologiasDetalle: string; medicacion: string; antecedentesPersonales: string; antecedentesFamiliares: string; otrasClinicas: string };
    alimentaria: { horaLevantarse: string; horaAcostarse: string; tiposDieta: string; alimentosFavoritos: string; alimentosRechazados: string; alergiasDetalle: string; intoleranciasDetalle: string; deficiencias: string; ingestaAgua: string; otrasAlimentaria: string };
  };
  horario: HorarioEntry[];
  recomendaciones: {
    agua: string;
    ejercicios: { nombre: string; met: number; duracion: number; frecuencia: string }[];
    alimentosEvitar: string[];
    otrasRecomendaciones: string;
  };
  planNames: string[];
  planificacionNombre: string;
  medidaNotas: string[];
  consultaMotivos: string[];
  consultaNotas: string[];
  citaMotivos: string[];
  citaNotas: string[];
  pagoConceptos: string[];
  pagoNotas: string[];
  seguimientoNotas: (string | null)[];
  entradaDescripciones: string[];
  entradaNotas: (string | null)[];
}

// Helper to build horario for a given locale's day/activity names
function buildHorario(days: Record<string, string>, acts: Record<string, string>): HorarioEntry[] {
  const d = days; const a = acts;
  return [
    // Lunes
    { dia: d.lun, hora: "07:00", actividad: a.rutinaMañana, color: "descanso" },
    { dia: d.lun, hora: "08:00", actividad: a.desayuno, color: "comida" },
    { dia: d.lun, hora: "09:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "10:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "11:00", actividad: a.mediaMañana, color: "comida" },
    { dia: d.lun, hora: "12:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "13:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.lun, hora: "15:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "16:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "17:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "18:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.lun, hora: "19:00", actividad: a.gimFuerza, color: "ejercicio" },
    { dia: d.lun, hora: "20:00", actividad: a.duchaDescanso, color: "descanso" },
    { dia: d.lun, hora: "21:00", actividad: a.cena, color: "comida" },
    { dia: d.lun, hora: "22:00", actividad: a.lecturaSofa, color: "descanso" },
    { dia: d.lun, hora: "23:00", actividad: a.dormir, color: "descanso" },
    // Martes
    { dia: d.mar, hora: "07:00", actividad: a.rutinaMañana, color: "descanso" },
    { dia: d.mar, hora: "08:00", actividad: a.desayuno, color: "comida" },
    { dia: d.mar, hora: "09:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "10:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "11:00", actividad: a.mediaMañana, color: "comida" },
    { dia: d.mar, hora: "12:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "13:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.mar, hora: "15:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "16:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "17:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "18:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mar, hora: "19:00", actividad: a.caminataSuave, color: "ejercicio" },
    { dia: d.mar, hora: "20:00", actividad: a.recadosOcio, color: "otro" },
    { dia: d.mar, hora: "21:00", actividad: a.cena, color: "comida" },
    { dia: d.mar, hora: "22:00", actividad: a.descanso, color: "descanso" },
    { dia: d.mar, hora: "23:00", actividad: a.dormir, color: "descanso" },
    // Miércoles
    { dia: d.mie, hora: "07:00", actividad: a.rutinaMañana, color: "descanso" },
    { dia: d.mie, hora: "08:00", actividad: a.desayuno, color: "comida" },
    { dia: d.mie, hora: "09:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "10:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "11:00", actividad: a.mediaMañana, color: "comida" },
    { dia: d.mie, hora: "12:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "13:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.mie, hora: "15:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "16:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "17:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "18:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.mie, hora: "19:00", actividad: a.gimFuerza, color: "ejercicio" },
    { dia: d.mie, hora: "20:00", actividad: a.duchaDescanso, color: "descanso" },
    { dia: d.mie, hora: "21:00", actividad: a.cena, color: "comida" },
    { dia: d.mie, hora: "22:00", actividad: a.lecturaSofa, color: "descanso" },
    { dia: d.mie, hora: "23:00", actividad: a.dormir, color: "descanso" },
    // Jueves
    { dia: d.jue, hora: "07:00", actividad: a.rutinaMañana, color: "descanso" },
    { dia: d.jue, hora: "08:00", actividad: a.desayuno, color: "comida" },
    { dia: d.jue, hora: "09:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "10:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "11:00", actividad: a.mediaMañana, color: "comida" },
    { dia: d.jue, hora: "12:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "13:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.jue, hora: "15:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "16:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "17:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "18:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.jue, hora: "19:00", actividad: a.movilidadEstiramientos, color: "ejercicio" },
    { dia: d.jue, hora: "20:00", actividad: a.recadosOcio, color: "otro" },
    { dia: d.jue, hora: "21:00", actividad: a.cena, color: "comida" },
    { dia: d.jue, hora: "22:00", actividad: a.descanso, color: "descanso" },
    { dia: d.jue, hora: "23:00", actividad: a.dormir, color: "descanso" },
    // Viernes
    { dia: d.vie, hora: "07:00", actividad: a.rutinaMañana, color: "descanso" },
    { dia: d.vie, hora: "08:00", actividad: a.desayuno, color: "comida" },
    { dia: d.vie, hora: "09:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "10:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "11:00", actividad: a.mediaMañana, color: "comida" },
    { dia: d.vie, hora: "12:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "13:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.vie, hora: "15:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "16:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "17:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "18:00", actividad: a.trabajo, color: "trabajo" },
    { dia: d.vie, hora: "19:00", actividad: a.gimFuerza, color: "ejercicio" },
    { dia: d.vie, hora: "20:00", actividad: a.ducha, color: "descanso" },
    { dia: d.vie, hora: "21:00", actividad: a.cenaAmigos, color: "comida" },
    { dia: d.vie, hora: "22:00", actividad: a.social, color: "otro" },
    { dia: d.vie, hora: "23:00", actividad: a.social, color: "otro" },
    // Sábado
    { dia: d.sab, hora: "09:00", actividad: a.despertar, color: "descanso" },
    { dia: d.sab, hora: "10:00", actividad: a.desayuno, color: "comida" },
    { dia: d.sab, hora: "11:00", actividad: a.natacion, color: "ejercicio" },
    { dia: d.sab, hora: "12:00", actividad: a.recadosCompras, color: "otro" },
    { dia: d.sab, hora: "13:00", actividad: a.prepararComida, color: "otro" },
    { dia: d.sab, hora: "14:00", actividad: a.almuerzo, color: "comida" },
    { dia: d.sab, hora: "15:00", actividad: a.sobremesa, color: "descanso" },
    { dia: d.sab, hora: "16:00", actividad: a.descanso, color: "descanso" },
    { dia: d.sab, hora: "17:00", actividad: a.ocioHobbies, color: "otro" },
    { dia: d.sab, hora: "18:00", actividad: a.ocioHobbies, color: "otro" },
    { dia: d.sab, hora: "19:00", actividad: a.paseo, color: "ejercicio" },
    { dia: d.sab, hora: "20:00", actividad: a.planSocial, color: "otro" },
    { dia: d.sab, hora: "21:00", actividad: a.cenaFuera, color: "comida" },
    { dia: d.sab, hora: "22:00", actividad: a.social, color: "otro" },
    { dia: d.sab, hora: "23:00", actividad: a.social, color: "otro" },
    // Domingo
    { dia: d.dom, hora: "09:00", actividad: a.descanso, color: "descanso" },
    { dia: d.dom, hora: "10:00", actividad: a.desayunoTranquilo, color: "comida" },
    { dia: d.dom, hora: "11:00", actividad: a.caminataLarga, color: "ejercicio" },
    { dia: d.dom, hora: "12:00", actividad: a.caminataLarga, color: "ejercicio" },
    { dia: d.dom, hora: "13:00", actividad: a.prepararComida, color: "otro" },
    { dia: d.dom, hora: "14:00", actividad: a.comidaFamiliar, color: "comida" },
    { dia: d.dom, hora: "15:00", actividad: a.sobremesa, color: "descanso" },
    { dia: d.dom, hora: "16:00", actividad: a.descanso, color: "descanso" },
    { dia: d.dom, hora: "17:00", actividad: a.lectura, color: "descanso" },
    { dia: d.dom, hora: "18:00", actividad: a.ocioHobbies, color: "otro" },
    { dia: d.dom, hora: "19:00", actividad: a.prepararSemana, color: "otro" },
    { dia: d.dom, hora: "20:00", actividad: a.cenaLigera, color: "comida" },
    { dia: d.dom, hora: "21:00", actividad: a.descanso, color: "descanso" },
    { dia: d.dom, hora: "22:00", actividad: a.dormir, color: "descanso" },
  ];
}

const DAYS_ES = { lun: "Lunes", mar: "Martes", mie: "Miércoles", jue: "Jueves", vie: "Viernes", sab: "Sábado", dom: "Domingo" };
const DAYS_PT = { lun: "Segunda", mar: "Terça", mie: "Quarta", jue: "Quinta", vie: "Sexta", sab: "Sábado", dom: "Domingo" };

const ACTS_ES = {
  rutinaMañana: "Rutina mañana", desayuno: "Desayuno", trabajo: "Trabajo", mediaMañana: "Media mañana",
  almuerzo: "Almuerzo", gimFuerza: "Gimnasio (fuerza)", duchaDescanso: "Ducha / descanso", cena: "Cena",
  lecturaSofa: "Lectura / sofá", dormir: "Dormir", caminataSuave: "Caminata suave", recadosOcio: "Recados / ocio",
  descanso: "Descanso", movilidadEstiramientos: "Movilidad / estiramientos", ducha: "Ducha",
  cenaAmigos: "Cena con amigos", social: "Social", despertar: "Despertar", natacion: "Natación",
  recadosCompras: "Recados / compras", prepararComida: "Preparar comida", sobremesa: "Sobremesa",
  ocioHobbies: "Ocio / hobbies", paseo: "Paseo", planSocial: "Plan social", cenaFuera: "Cena fuera",
  desayunoTranquilo: "Desayuno tranquilo", caminataLarga: "Caminata larga", comidaFamiliar: "Comida familiar",
  lectura: "Lectura", prepararSemana: "Preparar la semana", cenaLigera: "Cena ligera",
};

const ACTS_PT = {
  rutinaMañana: "Rotina matinal", desayuno: "Café da manhã", trabajo: "Trabalho", mediaMañana: "Lanche da manhã",
  almuerzo: "Almoço", gimFuerza: "Academia (força)", duchaDescanso: "Banho / descanso", cena: "Jantar",
  lecturaSofa: "Leitura / sofá", dormir: "Dormir", caminataSuave: "Caminhada leve", recadosOcio: "Recados / lazer",
  descanso: "Descanso", movilidadEstiramientos: "Mobilidade / alongamento", ducha: "Banho",
  cenaAmigos: "Jantar com amigos", social: "Social", despertar: "Despertar", natacion: "Natação",
  recadosCompras: "Recados / compras", prepararComida: "Preparar comida", sobremesa: "Sobremesa",
  ocioHobbies: "Lazer / hobbies", paseo: "Passeio", planSocial: "Plano social", cenaFuera: "Jantar fora",
  desayunoTranquilo: "Café da manhã tranquilo", caminataLarga: "Caminhada longa", comidaFamiliar: "Almoço em família",
  lectura: "Leitura", prepararSemana: "Preparar a semana", cenaLigera: "Jantar leve",
};

const STRINGS_ES: DemoStrings = {
  objetivoDetalle: "Perder 5 kg de forma saludable en 3 meses",
  preferencias: ["Mediterránea", "Pescado azul", "Verduras de temporada", "Sin ultraprocesados"],
  alergias: ["Frutos secos (almendras)", "Polen estacional"],
  intolerancias: ["Lactosa (parcial)"],
  patologias: ["Hipertensión controlada", "Hipotiroidismo subclínico leve"],
  medicamentos: ["Enalapril 10 mg cada 24 h", "Levotiroxina 50 mcg en ayunas"],
  suplementos: ["Vitamina D3 1000 UI", "Omega-3 EPA/DHA", "Magnesio bisglicinato"],
  nota: "Paciente de prueba preconfigurado para que explores las funciones de la app. Puedes editarlo o eliminarlo cuando quieras.",
  ficha: {
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
      fumador: "No", alcohol: "Ocasional: 1-2 cervezas los fines de semana.", estadoCivil: "Soltero",
      actividadFisica: "Ligera-moderada: camina al trabajo (15 min) y gimnasio 3 veces por semana.",
      raza: "Caucásico", otrasPersonal: "Vida social activa. Come fuera 2-3 veces por semana.",
    },
    clinica: {
      patologiasDetalle: "HTA diagnosticada hace 2 años, controlada con medicación. Hipotiroidismo subclínico leve.",
      medicacion: "Enalapril 10 mg cada 24 h. Levotiroxina 50 mcg en ayunas.",
      antecedentesPersonales: "Apendicectomía a los 14 años. Sin otros antecedentes relevantes.",
      antecedentesFamiliares: "Padre con diabetes tipo 2. Madre con hipertensión. Abuelo materno con infarto.",
      otrasClinicas: "Análisis recientes: colesterol total 210, LDL 135, HDL 45, TG 160. TSH 4.5 mU/L.",
    },
    alimentaria: {
      horaLevantarse: "07:00", horaAcostarse: "23:30",
      tiposDieta: "Mediterránea. No sigue ninguna dieta restrictiva.",
      alimentosFavoritos: "Pescado azul, pasta, frutas cítricas, arroz con pollo, aceitunas.",
      alimentosRechazados: "Casquería, hígado, pescado crudo, kale.",
      alergiasDetalle: "Frutos secos (almendra en particular): picor en boca y garganta.",
      intoleranciasDetalle: "Lactosa en cantidades grandes: molestias digestivas.",
      deficiencias: "Vitamina D por debajo del rango en último análisis (22 ng/mL).",
      ingestaAgua: "1.5-2 litros diarios aproximadamente.",
      otrasAlimentaria: "Come fuera 2-3 veces por semana. Cocina 4-5 días en casa.",
    },
  },
  horario: buildHorario(DAYS_ES, ACTS_ES),
  recomendaciones: {
    agua: "Beber mínimo 2 litros de agua al día, repartidos a lo largo de la jornada. Empezar el día con un vaso en ayunas.",
    ejercicios: [
      { nombre: "Caminar rápido", met: 4, duracion: 30, frecuencia: "Diaria" },
      { nombre: "Entrenamiento de fuerza", met: 6, duracion: 45, frecuencia: "3 veces por semana" },
      { nombre: "Natación", met: 7, duracion: 30, frecuencia: "1 vez por semana" },
      { nombre: "Estiramientos/Movilidad", met: 2.5, duracion: 15, frecuencia: "Diaria" },
    ],
    alimentosEvitar: [
      "Azúcares añadidos y bollería industrial", "Refrescos azucarados y zumos envasados",
      "Carnes procesadas (embutidos, salchichas, bacon)", "Exceso de sal y snacks salados",
      "Alcohol entre semana", "Fritos y rebozados",
    ],
    otrasRecomendaciones: "Cenar ligero 2-3 horas antes de dormir. Masticar despacio y comer sin pantallas. Priorizar alimentos frescos y de temporada. Cocinar al vapor, plancha o horno.",
  },
  planNames: [
    "Plan inicial — ejemplo", "Plan de mantenimiento", "Plan deportivo — alto volumen",
    "Plan low-carb", "Plan mediterráneo — legumbres",
  ],
  planificacionNombre: "Planificación por defecto",
  medidaNotas: [
    "Primera toma de contacto. Se pactan objetivos.", "Medida inicial tras arranque del plan.",
    "Evolución lenta pero positiva.", "Buena adherencia al plan.", "Revisión mensual.",
    "Reducción de cintura notable.", "Evolución estable.", "Última medida. -5.6 kg desde el inicio.",
  ],
  consultaMotivos: ["Primera consulta", "Revisión de seguimiento", "Revisión mensual"],
  consultaNotas: [
    "Anamnesis completa, antropometría y pactación de plan.",
    "Primera revisión. Pérdida de 2.3 kg. Ajuste de raciones.",
    "Segunda revisión. Pérdida total 4.3 kg.",
  ],
  citaMotivos: [
    "Segunda revisión de seguimiento",
    "Consulta puntual — duda sobre suplementación",
    "Tercera revisión mensual",
  ],
  citaNotas: [
    "Revisión presencial. Ajuste de plan.",
    "El paciente avisó con antelación; reprogramada.",
    "Próxima revisión.",
  ],
  pagoConceptos: [
    "Consulta inicial — valoración y plan",
    "Revisión mensual — seguimiento",
    "Próxima revisión mensual",
  ],
  pagoNotas: [
    "Primera consulta. Incluye valoración completa y elaboración del plan nutricional.",
    "Revisión de evolución a los 30 días.",
    "Pendiente de cobro. Revisión programada.",
  ],
  seguimientoNotas: [
    "Hoy comí fuera, ensalada de quinoa.", null,
    "Entreno intenso de piernas.", null,
    "Se me olvidó la media mañana.", null, null, null,
    "Día libre — picoteo ligero.",
  ],
  entradaDescripciones: [
    "Avena con leche y fruta", "Salmón al horno con ensalada", "Tostadas con aguacate y huevo",
    "Pollo a la plancha con ensalada", "Manzana y yogur", "Merluza al horno con patatas",
    "Yogur con fresas y almendras", "Lentejas estofadas con verduras", "Plátano y nueces pre-entreno",
    "Tortilla francesa con ensalada",
  ],
  entradaNotas: [
    "Me senté a desayunar tranquilo.", "Muy saciante.", null, "Muy satisfecho.",
    null, "Cena ligera.", null, "Plato completo.", null, "Noche sencilla.",
  ],
};

const STRINGS_PT: DemoStrings = {
  objetivoDetalle: "Perder 5 kg de forma saudável em 3 meses",
  preferencias: ["Mediterrânea", "Peixe gordo", "Legumes da época", "Sem ultraprocessados"],
  alergias: ["Frutos secos (amêndoas)", "Pólen estacional"],
  intolerancias: ["Lactose (parcial)"],
  patologias: ["Hipertensão controlada", "Hipotiroidismo subclínico leve"],
  medicamentos: ["Enalapril 10 mg a cada 24 h", "Levotiroxina 50 mcg em jejum"],
  suplementos: ["Vitamina D3 1000 UI", "Omega-3 EPA/DHA", "Magnésio bisglicinato"],
  nota: "Paciente de teste pré-configurado para que você explore as funções do app. Pode editá-lo ou eliminá-lo quando quiser.",
  ficha: {
    consulta: {
      motivo: "Perda de peso saudável e melhora do hábito alimentar. Quer aprender a comer melhor sem passar fome.",
      expectativas: "Perder 5 kg em 3 meses e manter o peso a longo prazo. Melhorar energia e digestão.",
      objetivosClinicos: "control_peso",
      objetivosClinicosDetalle: "Perder 5 kg de forma saudável em 3 meses",
      otras: "Vida sedentária por trabalho de escritório. Quer estabelecer rotina de exercício e melhorar composição corporal.",
    },
    personalSocial: {
      funcionIntestinal: "Regular, 1 vez ao dia, sem incómodo.",
      calidadSueno: "Boa em geral, 7-8h, às vezes acorda a meio da noite sem motivo aparente.",
      fumador: "Não", alcohol: "Ocasional: 1-2 cervejas aos fins de semana.", estadoCivil: "Solteiro",
      actividadFisica: "Ligeira-moderada: caminha para o trabalho (15 min) e ginásio 3 vezes por semana.",
      raza: "Caucasiano", otrasPersonal: "Vida social ativa. Come fora 2-3 vezes por semana.",
    },
    clinica: {
      patologiasDetalle: "HTA diagnosticada há 2 anos, controlada com medicação. Hipotiroidismo subclínico leve.",
      medicacion: "Enalapril 10 mg a cada 24 h. Levotiroxina 50 mcg em jejum.",
      antecedentesPersonales: "Apendicectomia aos 14 anos. Sem outros antecedentes relevantes.",
      antecedentesFamiliares: "Pai com diabetes tipo 2. Mãe com hipertensão. Avô materno com enfarte.",
      otrasClinicas: "Análises recentes: colesterol total 210, LDL 135, HDL 45, TG 160. TSH 4.5 mU/L.",
    },
    alimentaria: {
      horaLevantarse: "07:00", horaAcostarse: "23:30",
      tiposDieta: "Mediterrânea. Não segue nenhuma dieta restritiva.",
      alimentosFavoritos: "Peixe gordo, massa, frutas cítricas, arroz com frango, azeitonas.",
      alimentosRechazados: "Vísceras, fígado, peixe cru, couve-kale.",
      alergiasDetalle: "Frutos secos (amêndoa em particular): coceira na boca e garganta.",
      intoleranciasDetalle: "Lactose em grandes quantidades: desconforto digestivo.",
      deficiencias: "Vitamina D abaixo da faixa na última análise (22 ng/mL).",
      ingestaAgua: "1.5-2 litros diários aproximadamente.",
      otrasAlimentaria: "Come fora 2-3 vezes por semana. Cozinha 4-5 dias em casa.",
    },
  },
  horario: buildHorario(DAYS_PT, ACTS_PT),
  recomendaciones: {
    agua: "Beber no mínimo 2 litros de água por dia, distribuídos ao longo do dia. Começar o dia com um copo em jejum.",
    ejercicios: [
      { nombre: "Caminhada rápida", met: 4, duracion: 30, frecuencia: "Diária" },
      { nombre: "Treino de força", met: 6, duracion: 45, frecuencia: "3 vezes por semana" },
      { nombre: "Natação", met: 7, duracion: 30, frecuencia: "1 vez por semana" },
      { nombre: "Alongamento/Mobilidade", met: 2.5, duracion: 15, frecuencia: "Diária" },
    ],
    alimentosEvitar: [
      "Açúcares adicionados e pastelaria industrial", "Refrigerantes açucarados e sumos embalados",
      "Carnes processadas (enchidos, salsichas, bacon)", "Excesso de sal e snacks salgados",
      "Álcool durante a semana", "Fritos e panados",
    ],
    otrasRecomendaciones: "Jantar leve 2-3 horas antes de dormir. Mastigar devagar e comer sem ecrãs. Priorizar alimentos frescos e da época. Cozinhar a vapor, grelhado ou forno.",
  },
  planNames: [
    "Plano inicial — exemplo", "Plano de manutenção", "Plano esportivo — alto volume",
    "Plano low-carb", "Plano mediterrâneo — leguminosas",
  ],
  planificacionNombre: "Planificação padrão",
  medidaNotas: [
    "Primeiro contacto. Objetivos acordados.", "Medida inicial após início do plano.",
    "Evolução lenta mas positiva.", "Boa adesão ao plano.", "Revisão mensal.",
    "Redução de cintura notável.", "Evolução estável.", "Última medida. -5.6 kg desde o início.",
  ],
  consultaMotivos: ["Primeira consulta", "Revisão de acompanhamento", "Revisão mensal"],
  consultaNotas: [
    "Anamnese completa, antropometria e elaboração do plano.",
    "Primeira revisão. Perda de 2.3 kg. Ajuste de porções.",
    "Segunda revisão. Perda total 4.3 kg.",
  ],
  citaMotivos: [
    "Segunda revisão de acompanhamento",
    "Consulta pontual — dúvida sobre suplementação",
    "Terceira revisão mensal",
  ],
  citaNotas: [
    "Revisão presencial. Ajuste do plano.",
    "O paciente avisou com antecedência; remarcada.",
    "Próxima revisão.",
  ],
  pagoConceptos: [
    "Consulta inicial — avaliação e plano",
    "Revisão mensal — acompanhamento",
    "Próxima revisão mensal",
  ],
  pagoNotas: [
    "Primeira consulta. Inclui avaliação completa e elaboração do plano nutricional.",
    "Revisão de evolução aos 30 dias.",
    "Pendente de cobrança. Revisão programada.",
  ],
  seguimientoNotas: [
    "Hoje comi fora, salada de quinoa.", null,
    "Treino intenso de pernas.", null,
    "Esqueci-me do lanche da manhã.", null, null, null,
    "Dia livre — petiscos leves.",
  ],
  entradaDescripciones: [
    "Aveia com leite e fruta", "Salmão assado com salada", "Torradas com abacate e ovo",
    "Frango grelhado com salada", "Maçã e iogurte", "Pescada assada com batatas",
    "Iogurte com morangos e amêndoas", "Lentilhas estufadas com legumes", "Banana e nozes pré-treino",
    "Omelete francesa com salada",
  ],
  entradaNotas: [
    "Sentei-me a tomar café da manhã tranquilo.", "Muito saciante.", null, "Muito satisfeito.",
    null, "Jantar leve.", null, "Prato completo.", null, "Noite simples.",
  ],
};

function getStrings(locale?: Locale): DemoStrings {
  return locale === "pt" ? STRINGS_PT : STRINGS_ES;
}

// ─── Main function ───────────────────────────────────────────────────

export async function crearPacienteDemoSiNoExiste(
  prisma: PrismaClient,
  dietistaId: string,
  locale?: Locale,
): Promise<{ id: string; creado: boolean }> {
  const s = getStrings(locale);

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
        await prisma.$executeRawUnsafe(
          `UPDATE planificaciones
           SET "fechaInicio" = "fechaInicio" + $1::interval,
               "fechaUltimoCambio" = "fechaUltimoCambio" + $1::interval,
               "fechaFinPrevista" = CASE WHEN "fechaFinPrevista" IS NOT NULL THEN "fechaFinPrevista" + $1::interval ELSE NULL END
           WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
        await prisma.$executeRawUnsafe(
          `UPDATE pagos
           SET "createdAt" = "createdAt" + $1::interval,
               "updatedAt" = "updatedAt" + $1::interval,
               "fechaPago" = CASE WHEN "fechaPago" IS NOT NULL THEN "fechaPago" + $1::interval ELSE NULL END
           WHERE "pacienteId" = $2`,
          intervalo, existente.id,
        );
      }
    }
    return { id: existente.id, creado: false };
  }

  // Crear el paciente con raw SQL
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
    AVATAR_DEMO,
    new Date(Date.UTC(1992, 5, 15)),
    s.objetivoDetalle,
    s.preferencias,
    s.alergias,
    s.intolerancias,
    s.patologias,
    s.medicamentos,
    s.suplementos,
    JSON.stringify(s.ficha),
    JSON.stringify(s.horario),
    JSON.stringify(s.recomendaciones),
    s.nota,
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
  await crearPlanConDias(s.planNames[0], 2000, { prot: 150, carb: 220, grasa: 70 }, true, 0, {
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
  await crearPlanConDias(s.planNames[1], 2200, { prot: 140, carb: 260, grasa: 75 }, false, 20, {
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
  await crearPlanConDias(s.planNames[2], 2600, { prot: 180, carb: 320, grasa: 75 }, false, 40, {
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
  await crearPlanConDias(s.planNames[3], 1800, { prot: 140, carb: 90, grasa: 115 }, false, 60, {
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
  await crearPlanConDias(s.planNames[4], 1900, { prot: 110, carb: 230, grasa: 65 }, false, 75, {
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
  const medidasData = [
    { diasAtras: 90, peso: 83.2, imc: 27.2, grasa: 24.1, muscular: 31.8, cintura: 98, cadera: 102.5, brazo: 33.8 },
    { diasAtras: 75, peso: 82.5, imc: 26.9, grasa: 23.5, muscular: 32.2, cintura: 97, cadera: 102, brazo: 34 },
    { diasAtras: 60, peso: 81.3, imc: 26.5, grasa: 23.0, muscular: 32.5, cintura: 96, cadera: 101.5, brazo: 34 },
    { diasAtras: 45, peso: 80.2, imc: 26.1, grasa: 22.4, muscular: 32.8, cintura: 94.5, cadera: 101, brazo: 34.2 },
    { diasAtras: 30, peso: 79.1, imc: 25.8, grasa: 21.8, muscular: 33.0, cintura: 93, cadera: 100, brazo: 34.5 },
    { diasAtras: 15, peso: 78.2, imc: 25.5, grasa: 21.0, muscular: 33.3, cintura: 92, cadera: 99.5, brazo: 34.5 },
    { diasAtras: 7, peso: 77.9, imc: 25.4, grasa: 20.7, muscular: 33.4, cintura: 91.5, cadera: 99.2, brazo: 34.6 },
    { diasAtras: 3, peso: 77.6, imc: 25.3, grasa: 20.5, muscular: 33.5, cintura: 91, cadera: 99, brazo: 34.8 },
  ];
  const medidasCreadas: { id: string }[] = [];
  for (let mi = 0; mi < medidasData.length; mi++) {
    const m = medidasData[mi];
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - m.diasAtras);
    const creada = await prisma.medidaAntropometrica.create({
      data: {
        pacienteId: paciente.id, fecha,
        peso: m.peso, altura: 175, imc: m.imc,
        grasaCorporal: m.grasa, masaMuscular: m.muscular,
        perimetroCintura: m.cintura, perimetroCadera: m.cadera, perimetroBrazo: m.brazo,
        notas: s.medidaNotas[mi],
      },
      select: { id: true },
    });
    medidasCreadas.push(creada);
  }

  // Consultas
  const consultasData = [
    { diasAtras: 75, medidaIdx: 1 },
    { diasAtras: 45, medidaIdx: 3 },
    { diasAtras: 15, medidaIdx: 5 },
  ];
  for (let ci = 0; ci < consultasData.length; ci++) {
    const c = consultasData[ci];
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - c.diasAtras);
    await prisma.consulta.create({
      data: {
        pacienteId: paciente.id, dietistaId, fecha,
        motivo: s.consultaMotivos[ci], notas: s.consultaNotas[ci],
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
      { pacienteId: paciente.id, dietistaId, fechaHora: citaPasada, duracion: 45, motivo: s.citaMotivos[0], estado: "COMPLETADA", notas: s.citaNotas[0] },
      { pacienteId: paciente.id, dietistaId, fechaHora: citaCancelada, duracion: 30, motivo: s.citaMotivos[1], estado: "CANCELADA", notas: s.citaNotas[1] },
      { pacienteId: paciente.id, dietistaId, fechaHora: citaFutura, duracion: 30, motivo: s.citaMotivos[2], estado: "CONFIRMADA", notas: s.citaNotas[2] },
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

  // Enlace compartido del plan activo
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

  // Planificación por defecto
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
    ) VALUES ($1, $2, $3, 'activa', true, $4, $5, $6, $7::jsonb)`,
    paciente.id, dietistaId, s.planificacionNombre, fechaInicio, now, fechaFin, JSON.stringify(planificacionDatos),
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
    const notas = s.seguimientoNotas[i] ?? null;
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
  const entradasData = [
    { diasAtras: 0, tipo: "DESAYUNO" as const, alimentoId: avena?.id, cantidad: 50 },
    { diasAtras: 0, tipo: "ALMUERZO" as const, alimentoId: salmon?.id, cantidad: 150 },
    { diasAtras: 1, tipo: "DESAYUNO" as const, alimentoId: panIntegral?.id, cantidad: 60 },
    { diasAtras: 1, tipo: "ALMUERZO" as const, alimentoId: pollo?.id, cantidad: 150 },
    { diasAtras: 2, tipo: "MERIENDA" as const, alimentoId: manzana?.id, cantidad: 180 },
    { diasAtras: 2, tipo: "CENA" as const, alimentoId: merluza?.id, cantidad: 150 },
    { diasAtras: 4, tipo: "DESAYUNO" as const, alimentoId: yogur?.id, cantidad: 125 },
    { diasAtras: 5, tipo: "ALMUERZO" as const, alimentoId: lentejas?.id, cantidad: 80 },
    { diasAtras: 6, tipo: "MERIENDA" as const, alimentoId: platano?.id, cantidad: 100 },
    { diasAtras: 8, tipo: "CENA" as const, alimentoId: huevo?.id, cantidad: 120 },
  ];
  for (let ei = 0; ei < entradasData.length; ei++) {
    const e = entradasData[ei];
    if (!e.alimentoId) continue;
    const fecha = new Date(now);
    fecha.setDate(now.getDate() - e.diasAtras);
    await prisma.entradaDiario.create({
      data: {
        pacienteId: paciente.id, fecha, tipoComida: e.tipo,
        alimentoId: e.alimentoId, cantidad: e.cantidad, unidad: "GRAMOS",
        descripcion: s.entradaDescripciones[ei], notas: s.entradaNotas[ei],
      },
    });
  }

  // Pagos de ejemplo (3 registros: 1 pagado transferencia, 1 pagado Stripe, 1 pendiente)
  const pagosDemo = [
    { diasAtras: 60, importe: 45, estado: "PAGADO", metodoPago: "Transferencia", diasHastaPago: 2 },
    { diasAtras: 25, importe: 30, estado: "PAGADO", metodoPago: "Stripe", diasHastaPago: 0 },
    { diasAtras: 3, importe: 30, estado: "PENDIENTE", metodoPago: null, diasHastaPago: null as number | null },
  ];
  for (let pi = 0; pi < pagosDemo.length; pi++) {
    const p = pagosDemo[pi];
    const createdAt = new Date(now);
    createdAt.setDate(now.getDate() - p.diasAtras);
    const fechaPago = p.diasHastaPago !== null
      ? (() => { const d = new Date(createdAt); d.setDate(d.getDate() + p.diasHastaPago); return d; })()
      : null;
    await prisma.$queryRawUnsafe(
      `INSERT INTO pagos (id, "dietistaId", "pacienteId", concepto, importe, estado, "metodoPago", "fechaPago", notas, "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, $8, $9, $9)`,
      dietistaId, paciente.id, s.pagoConceptos[pi], p.importe, p.estado,
      p.metodoPago, fechaPago, s.pagoNotas[pi], createdAt,
    );
  }

  return { id: paciente.id, creado: true };
}
