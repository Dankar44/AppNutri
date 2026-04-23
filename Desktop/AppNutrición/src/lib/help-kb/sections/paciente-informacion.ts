import type { HelpEntry } from "../types";

export const PACIENTE_INFORMACION_ENTRIES: HelpEntry[] = [
  {
    id: "inf-1",
    section: "paciente-informacion",
    question: "¿Qué es la pestaña Información de la ficha del paciente?",
    answer:
      "Es la ficha informativa extendida del paciente, equivalente a una historia clínica nutricional. Contiene todos los datos relevantes para entender su estado de salud, hábitos y objetivos: antecedentes médicos, hábitos alimentarios, estilo de vida, analíticas, digestión, objetivos, motivación, preferencias y diario anterior. Es la base sobre la que construirás el plan nutricional.",
    related: ["inf-2", "inf-3", "inf-55"],
    keywords: ["información", "ficha", "historia clínica", "paciente", "extendida"],
  },
  {
    id: "inf-2",
    section: "paciente-informacion",
    question: "¿Qué diferencia hay entre la pestaña General y la pestaña Información?",
    answer:
      "La pestaña General muestra el resumen operativo del paciente (datos básicos, contacto, última medición, plan activo, próximas citas) pensado para ojeada rápida. La pestaña Información es la historia clínica completa con decenas de campos agrupados en secciones: antecedentes, hábitos, analíticas, etc. General se usa a diario; Información se rellena sobre todo en la primera consulta y se actualiza cuando haya cambios.",
    related: ["inf-1", "inf-3"],
    keywords: ["general", "información", "diferencia", "resumen", "historia"],
  },
  {
    id: "inf-3",
    section: "paciente-informacion",
    question: "¿Qué secciones contiene la pestaña Información?",
    answer:
      "La ficha está organizada en secciones desplegables: Historia médica, Hábitos alimentarios, Hábitos de vida, Analíticas, Digestión, Objetivos y expectativas, Motivación y obstáculos, Preferencias y restricciones, y Diario anterior. Cada sección agrupa campos relacionados y se puede plegar para reducir scroll.",
    related: ["inf-1", "inf-4"],
    keywords: ["secciones", "estructura", "apartados", "organización"],
  },
  {
    id: "inf-4",
    section: "paciente-informacion",
    question: "¿Puedo plegar y desplegar las secciones?",
    answer:
      "Sí. Cada sección tiene una cabecera con una flecha o chevron: al pulsarla se colapsa u oculta su contenido. Esto ayuda a trabajar solo con la parte que te interesa sin perder de vista las demás. El estado de plegado es visual, no afecta al guardado ni al contenido.",
    related: ["inf-3", "inf-5"],
    keywords: ["plegar", "desplegar", "colapsar", "secciones", "chevron"],
  },
  {
    id: "inf-5",
    section: "paciente-informacion",
    question: "¿Tengo que rellenar toda la ficha de golpe?",
    answer:
      "No. Es un formulario largo y está pensado para rellenarse a trozos. Cada campo se guarda de forma independiente en el JSON fichaInformacion del paciente. Puedes completar las partes más urgentes en la primera consulta y añadir el resto en consultas siguientes o cuando el paciente te envíe una analítica.",
    related: ["inf-6", "inf-17"],
    keywords: ["rellenar", "trozos", "parcial", "progresivo", "borrador"],
  },
  {
    id: "inf-6",
    section: "paciente-informacion",
    question: "¿Cómo se guardan los cambios en la ficha?",
    answer:
      "El guardado es campo a campo. Al salir de un campo (al cambiar de input o pulsar el botón Guardar de la sección) se persisten los datos en el servidor. Si has rellenado varios campos y ves la confirmación Guardado, puedes cerrar sin miedo. Para cambios masivos hay un botón Guardar borrador al final de cada sección.",
    related: ["inf-5", "inf-17"],
    keywords: ["guardar", "persistir", "autoguardado", "borrador", "servidor"],
  },
  {
    id: "inf-7",
    section: "paciente-informacion",
    question: "¿Qué se registra en Historia médica?",
    answer:
      "Tres bloques: antecedentes personales (enfermedades pasadas, cirugías, alergias, medicación actual), antecedentes familiares (patologías en padres, hermanos, abuelos: diabetes, obesidad, cáncer, cardiopatías) y enfermedades crónicas diagnosticadas (hipertensión, diabetes tipo 2, hipotiroidismo, celiaquía, etc.). Cuanto más detallado, mejor el plan.",
    related: ["inf-8", "inf-9"],
    keywords: ["historia médica", "antecedentes", "personales", "familiares", "crónicas"],
  },
  {
    id: "inf-8",
    section: "paciente-informacion",
    question: "¿Por qué pido antecedentes familiares?",
    answer:
      "Muchas patologías con componente nutricional tienen carga genética: diabetes tipo 2, obesidad, dislipemias, hipertensión, ciertos cánceres digestivos. Conocer los antecedentes familiares te ayuda a identificar riesgos, priorizar controles y justificar un plan más preventivo, aunque el paciente aún no tenga diagnóstico.",
    related: ["inf-7", "inf-9"],
    keywords: ["familiares", "genética", "riesgo", "prevención", "antecedentes"],
  },
  {
    id: "inf-9",
    section: "paciente-informacion",
    question: "¿Dónde apunto las enfermedades crónicas del paciente?",
    answer:
      "Dentro de Historia médica hay un campo dedicado a enfermedades crónicas con diagnóstico confirmado. Indica el nombre de la patología, la fecha aproximada de diagnóstico y, si procede, la medicación relacionada. Esto es crítico porque condiciona el plan: nada de sal alta si hipertensión, control de hidratos si diabetes, etc.",
    related: ["inf-7", "inf-10"],
    keywords: ["crónicas", "patología", "diagnóstico", "diabetes", "hipertensión"],
  },
  {
    id: "inf-10",
    section: "paciente-informacion",
    question: "¿Anoto la medicación actual del paciente?",
    answer:
      "Sí, dentro de antecedentes personales. Incluye el nombre del fármaco, la dosis si la conoce y para qué lo toma. Algunos medicamentos interaccionan con alimentos (anticoagulantes y vitamina K, IMAO y tiramina, estatinas y pomelo) o afectan al peso y al apetito (corticoides, antidepresivos, insulina).",
    related: ["inf-7", "inf-9"],
    keywords: ["medicación", "fármacos", "tratamiento", "interacciones"],
  },
  {
    id: "inf-11",
    section: "paciente-informacion",
    question: "¿Qué recojo en Hábitos alimentarios?",
    answer:
      "Número de comidas al día, horarios aproximados, duración de cada comida, si come con prisa, problemas de masticación o prótesis dentales, preferencia por alimentos fríos o calientes, si cocina o come fuera, presupuesto disponible para comida y si hay alguien más en casa que cocine. Son los condicionantes prácticos del plan.",
    related: ["inf-12", "inf-13"],
    keywords: ["hábitos alimentarios", "comidas", "horarios", "masticación", "preferencias"],
  },
  {
    id: "inf-12",
    section: "paciente-informacion",
    question: "¿Por qué pregunto si el paciente prefiere frío o caliente?",
    answer:
      "Porque condiciona la viabilidad del plan en su día a día. Quien come en el trabajo muchas veces no tiene microondas y prefiere preparaciones frías (ensaladas, táperes en frío, tortilla fría). Quien trabaja en casa puede calentar. Ajustar el plan a sus circunstancias de temperatura mejora la adherencia.",
    related: ["inf-11", "inf-13"],
    keywords: ["frío", "caliente", "microondas", "temperatura", "practicidad"],
  },
  {
    id: "inf-13",
    section: "paciente-informacion",
    question: "¿Registro si tiene problemas de masticación?",
    answer:
      "Sí, hay un campo específico. Dentaduras postizas mal ajustadas, falta de piezas dentales, dolor mandibular o disfagia cambian por completo la textura adecuada de los alimentos. Un paciente con mala masticación necesitará más cremas, purés, carnes picadas y verduras bien cocinadas, no crudas.",
    related: ["inf-11", "inf-12"],
    keywords: ["masticación", "dentadura", "textura", "disfagia", "purés"],
  },
  {
    id: "inf-14",
    section: "paciente-informacion",
    question: "¿Qué datos recojo en Hábitos de vida?",
    answer:
      "Horas de sueño al día, calidad del descanso, nivel de estrés percibido, actividad física (tipo, frecuencia, intensidad), profesión y horario laboral, consumo de alcohol (cantidad y frecuencia), tabaco y otros estimulantes. Todo esto influye en el gasto energético, el apetito y la capacidad de seguir el plan.",
    related: ["inf-15", "inf-16"],
    keywords: ["hábitos vida", "sueño", "estrés", "ejercicio", "alcohol", "tabaco"],
  },
  {
    id: "inf-15",
    section: "paciente-informacion",
    question: "¿Por qué pregunto por el sueño y el estrés?",
    answer:
      "Porque tienen impacto directo en el peso y en la conducta alimentaria. Menos de 6 horas de sueño aumenta grelina y apetito. El estrés crónico eleva cortisol y favorece acúmulo de grasa abdominal y atracones. Si el paciente duerme mal o vive estresado, el plan debe trabajar también estos ejes, no solo la comida.",
    related: ["inf-14", "inf-16"],
    keywords: ["sueño", "estrés", "cortisol", "grelina", "descanso"],
  },
  {
    id: "inf-16",
    section: "paciente-informacion",
    question: "¿Cómo anoto la actividad física?",
    answer:
      "Indica el tipo (caminar, gimnasio, ciclismo, fútbol), la frecuencia (días por semana), la duración por sesión y la intensidad subjetiva (suave, moderada, intensa). Si es totalmente sedentario, déjalo marcado como tal. Este dato alimenta el cálculo del gasto energético y la estimación del factor de actividad.",
    related: ["inf-14", "inf-15"],
    keywords: ["actividad física", "ejercicio", "deporte", "sedentario", "gasto"],
  },
  {
    id: "inf-17",
    section: "paciente-informacion",
    question: "¿Existe un botón Guardar borrador?",
    answer:
      "Sí. Al final de cada sección hay un botón Guardar borrador que persiste todos los campos de esa sección aunque aún no estén completos. Es útil cuando interrumpes la consulta o quieres guardar lo avanzado antes de salir. Los borradores se recuperan al volver a abrir la ficha.",
    related: ["inf-5", "inf-6"],
    keywords: ["borrador", "guardar", "parcial", "incompleto"],
  },
  {
    id: "inf-18",
    section: "paciente-informacion",
    question: "¿Qué analíticas se registran en la ficha?",
    answer:
      "La sección Analíticas permite registrar los marcadores más usados en nutrición: glucosa basal, hemoglobina glicosilada, colesterol total, HDL, LDL, triglicéridos, hierro, ferritina, hemoglobina, vitamina D, vitamina B12, ácido fólico, TSH, T4 libre, ácido úrico, transaminasas (GOT, GPT), creatinina y PCR. Cada campo acepta el valor numérico y guarda automáticamente la fecha.",
    related: ["inf-19", "inf-20"],
    keywords: ["analíticas", "marcadores", "laboratorio", "parámetros", "sangre"],
  },
  {
    id: "inf-19",
    section: "paciente-informacion",
    question: "¿Cuándo pido analíticas al paciente?",
    answer:
      "Lo habitual es pedirlas en la primera consulta si el paciente trae una reciente (menos de 6 meses) y, si no, recomendarle que solicite una. Para pacientes con patología metabólica, revisa cada 3-6 meses. Para seguimiento general, una vez al año es suficiente. Siempre anota la fecha exacta del análisis.",
    related: ["inf-18", "inf-20"],
    keywords: ["cuándo", "pedir", "analítica", "frecuencia", "seguimiento"],
  },
  {
    id: "inf-20",
    section: "paciente-informacion",
    question: "¿Cuáles son los valores normales de glucosa en ayunas?",
    answer:
      "Valores de referencia orientativos: glucosa en ayunas menor de 100 mg/dL normal, entre 100 y 125 mg/dL prediabetes, igual o superior a 126 mg/dL en dos determinaciones diabetes. Estos rangos pueden variar ligeramente entre laboratorios; siempre prevalece el criterio médico.",
    related: ["inf-18", "inf-21"],
    keywords: ["glucosa", "normales", "ayunas", "prediabetes", "diabetes"],
  },
  {
    id: "inf-21",
    section: "paciente-informacion",
    question: "¿Qué valores de colesterol se consideran normales?",
    answer:
      "Referencias habituales: colesterol total por debajo de 200 mg/dL, LDL idealmente menor de 100 (menor de 70 en alto riesgo cardiovascular), HDL mayor de 40 en hombres y mayor de 50 en mujeres, triglicéridos por debajo de 150 mg/dL. Son guías generales, el médico interpreta según contexto clínico.",
    related: ["inf-18", "inf-22"],
    keywords: ["colesterol", "LDL", "HDL", "triglicéridos", "normales"],
  },
  {
    id: "inf-22",
    section: "paciente-informacion",
    question: "¿Qué valores indican déficit de hierro?",
    answer:
      "La ferritina por debajo de 30 ng/mL sugiere reservas bajas y por debajo de 15 ng/mL se considera déficit claro. La hemoglobina es normal por encima de 12 g/dL en mujeres y 13 g/dL en hombres; por debajo sugiere anemia. Hierro sérico normal entre 60-170 µg/dL. Rangos orientativos según laboratorio.",
    related: ["inf-18", "inf-23"],
    keywords: ["hierro", "ferritina", "hemoglobina", "anemia", "déficit"],
  },
  {
    id: "inf-23",
    section: "paciente-informacion",
    question: "¿Qué valores de vitamina D son adecuados?",
    answer:
      "La 25-OH-vitamina D se considera: deficiencia por debajo de 20 ng/mL, insuficiencia entre 20 y 30 ng/mL, suficiencia por encima de 30 ng/mL. Valores bajos son muy frecuentes en consulta; implican reforzar pescado azul, huevos, lácteos enriquecidos y exposición solar controlada o suplementación pautada por médico.",
    related: ["inf-18", "inf-24"],
    keywords: ["vitamina D", "25-OH", "déficit", "insuficiencia", "sol"],
  },
  {
    id: "inf-24",
    section: "paciente-informacion",
    question: "¿Qué miden la TSH y la T4 libre?",
    answer:
      "Son los marcadores principales del tiroides. TSH normal entre 0,4 y 4 mUI/L (en algunos laboratorios 0,5 a 4,5). T4 libre entre 0,8 y 1,9 ng/dL. TSH alta con T4 baja sugiere hipotiroidismo; TSH baja con T4 alta sugiere hipertiroidismo. Son claves para interpretar problemas de peso persistentes.",
    related: ["inf-18", "inf-25"],
    keywords: ["TSH", "T4", "tiroides", "hipotiroidismo", "hipertiroidismo"],
  },
  {
    id: "inf-25",
    section: "paciente-informacion",
    question: "¿Para qué sirve registrar la hemoglobina glicosilada (HbA1c)?",
    answer:
      "Refleja la media de glucemia de los últimos 2-3 meses. Valores orientativos: normal por debajo de 5,7%, prediabetes entre 5,7% y 6,4%, diabetes igual o superior a 6,5%. Es el mejor indicador de control glucémico a medio plazo y se recomienda en pacientes con diabetes o prediabetes cada 3-6 meses.",
    related: ["inf-20", "inf-24"],
    keywords: ["HbA1c", "hemoglobina glicosilada", "diabetes", "control", "glucemia"],
  },
  {
    id: "inf-26",
    section: "paciente-informacion",
    question: "¿Qué datos recojo en Digestión?",
    answer:
      "Frecuencia y calidad de las deposiciones, estreñimiento, diarrea, digestiones pesadas, gases, hinchazón abdominal, reflujo gastroesofágico, acidez, náuseas, saciedad precoz, intolerancias sospechadas (lactosa, gluten, fructosa, FODMAP) y si toma antiácidos o procinéticos de forma habitual.",
    related: ["inf-27", "inf-28"],
    keywords: ["digestión", "estreñimiento", "reflujo", "gases", "intolerancias"],
  },
  {
    id: "inf-27",
    section: "paciente-informacion",
    question: "¿Por qué anotar el patrón de deposiciones?",
    answer:
      "Porque es un indicador directo de la salud digestiva y orienta el plan. Estreñimiento sugiere reforzar fibra soluble e insoluble, líquidos y movimiento. Diarrea frecuente puede indicar intolerancia, síndrome de intestino irritable o mala absorción. La escala de Bristol es útil para tipificarlas en consulta.",
    related: ["inf-26", "inf-28"],
    keywords: ["deposiciones", "heces", "Bristol", "estreñimiento", "fibra"],
  },
  {
    id: "inf-28",
    section: "paciente-informacion",
    question: "¿Cómo registro intolerancias o alergias alimentarias?",
    answer:
      "Las alergias confirmadas con IgE van en antecedentes personales de Historia médica. Las intolerancias (lactosa, fructosa, histamina) y sensibilidades se anotan en la sección Digestión. Diferencia siempre entre sospecha (lo nota el paciente) y diagnóstico confirmado (prueba clínica), y señálalo en el texto.",
    related: ["inf-26", "inf-7"],
    keywords: ["intolerancias", "alergias", "lactosa", "gluten", "FODMAP"],
  },
  {
    id: "inf-29",
    section: "paciente-informacion",
    question: "¿Qué anoto en Objetivos y expectativas?",
    answer:
      "Qué espera conseguir el paciente (perder peso, ganar masa muscular, mejorar una analítica, controlar una patología, mejorar digestiones, rendimiento deportivo), cuánto peso o cambio concreto persigue, en qué plazo, y si tiene un evento motivador (boda, operación, viaje). Es la brújula del plan.",
    related: ["inf-30", "inf-31"],
    keywords: ["objetivos", "expectativas", "meta", "plazo", "evento"],
  },
  {
    id: "inf-30",
    section: "paciente-informacion",
    question: "¿Qué hago si el paciente tiene objetivos irreales?",
    answer:
      "Anota lo que el paciente dice exactamente (por ejemplo perder 15 kg en un mes) y al lado tu propuesta realista (perder entre 0,5 y 1 kg por semana, 4-6 kg en ese mes). Tenerlo documentado ayuda a trabajar las expectativas con datos y a revisar objetivos en consultas posteriores sin que sea tu palabra contra la suya.",
    related: ["inf-29", "inf-31"],
    keywords: ["expectativas", "irreales", "objetivo", "realista", "plazo"],
  },
  {
    id: "inf-31",
    section: "paciente-informacion",
    question: "¿Qué recojo en Motivación y obstáculos?",
    answer:
      "Qué le motiva a cambiar (salud, estética, un diagnóstico reciente, una fotografía, un comentario), qué intentos previos ha hecho y por qué fallaron, y qué obstáculos prevé: falta de tiempo para cocinar, presupuesto justo, falta de apoyo en casa, viajes de trabajo, turnos rotativos, comidas sociales frecuentes.",
    related: ["inf-29", "inf-32"],
    keywords: ["motivación", "obstáculos", "barreras", "intentos", "adherencia"],
  },
  {
    id: "inf-32",
    section: "paciente-informacion",
    question: "¿Por qué pregunto por intentos previos?",
    answer:
      "Porque suelen revelar qué no funciona con ese paciente: dietas muy restrictivas, ayunos extremos, productos milagro, planes genéricos de internet. Entender qué hizo y por qué lo dejó te permite proponer algo distinto y evitar caer en el mismo patrón. También valida las resistencias que vas a encontrar.",
    related: ["inf-31", "inf-33"],
    keywords: ["intentos previos", "dietas", "fracaso", "patrón", "aprender"],
  },
  {
    id: "inf-33",
    section: "paciente-informacion",
    question: "¿Dónde registro si el paciente es vegetariano o vegano?",
    answer:
      "En la sección Preferencias y restricciones hay campos para indicar el tipo de alimentación: omnívora, flexitariana, pescetariana, ovolactovegetariana, vegetariana estricta o vegana. Marcarlo correctamente es esencial porque condiciona todo el plan y afecta a la IA generadora de dietas, que filtra alimentos automáticamente.",
    related: ["inf-34", "inf-35"],
    keywords: ["vegetariano", "vegano", "pescetariano", "preferencias", "alimentación"],
  },
  {
    id: "inf-34",
    section: "paciente-informacion",
    question: "¿Cómo adapto el plan a un paciente vegano?",
    answer:
      "Asegúrate de cubrir proteínas vegetales variadas (legumbres, tofu, tempeh, seitán, quinoa), combinar cereales con legumbres para completar aminoácidos, revisar aportes de hierro, B12 (suplementación obligatoria), zinc, calcio, omega-3 vegetal (lino, chía, nueces) y vitamina D. En la ficha registra si suplementa B12.",
    related: ["inf-33", "inf-35"],
    keywords: ["vegano", "proteína vegetal", "B12", "suplementación", "hierro"],
  },
  {
    id: "inf-35",
    section: "paciente-informacion",
    question: "¿Cómo anoto restricciones religiosas?",
    answer:
      "En Preferencias y restricciones hay un campo libre para este tipo de indicaciones. Ejemplos frecuentes: halal (sin cerdo ni alcohol, carne sacrificada según rito), kosher (sin cerdo, marisco ni mezclar lácteos y carne), cuaresma, ramadán (ajusta horarios al ayuno diurno), hinduismo (sin vacuno). Respetarlas es innegociable.",
    related: ["inf-33", "inf-34"],
    keywords: ["religión", "halal", "kosher", "ramadán", "restricciones"],
  },
  {
    id: "inf-36",
    section: "paciente-informacion",
    question: "¿Qué pido en Diario anterior?",
    answer:
      "Que describa un día típico de comida: qué desayuna, si pica a media mañana, qué come, merienda, cena y si come algo antes de dormir. Pide también variantes de fin de semana y de comidas sociales. Cuanto más concreto (cantidades aproximadas, bebidas, aceite usado), mejor se detectan los puntos a mejorar.",
    related: ["inf-37", "inf-38"],
    keywords: ["diario", "día típico", "recordatorio", "hábitos", "comidas"],
  },
  {
    id: "inf-37",
    section: "paciente-informacion",
    question: "¿Qué formato recomiendas para el diario anterior?",
    answer:
      "Formato sencillo: una línea por toma con hora aproximada, alimentos y cantidades. Por ejemplo: 8:00 café con leche y dos tostadas con aceite; 11:00 fruta; 14:30 plato de pasta con tomate y pollo, fruta; 18:00 yogur; 21:30 tortilla francesa y ensalada. También admite fin de semana aparte si varía mucho.",
    related: ["inf-36", "inf-38"],
    keywords: ["formato", "diario", "recordatorio", "24h", "estructura"],
  },
  {
    id: "inf-38",
    section: "paciente-informacion",
    question: "¿Cuántos días de diario debe describir el paciente?",
    answer:
      "Mínimo un día laboral y un día de fin de semana, porque suelen diferir bastante. Si el paciente trabaja por turnos, pide un día de cada turno. Tres o cinco días dan una foto más fiel, pero en consulta se empieza por el recordatorio de 24 horas del día anterior, que es el menos sesgado.",
    related: ["inf-37", "inf-36"],
    keywords: ["días", "diario", "24h", "registro", "fines de semana"],
  },
  {
    id: "inf-39",
    section: "paciente-informacion",
    question: "¿Puedo imprimir la ficha completa?",
    answer:
      "Sí, desde la pestaña Entregables PDF del paciente puedes generar un PDF con toda la ficha informativa, incluidas las analíticas y fechas. Es útil para archivarlo físicamente, enviarlo al médico o entregárselo al paciente. El PDF respeta el orden de las secciones y marca con un guion los campos vacíos.",
    related: ["inf-17", "inf-40"],
    keywords: ["imprimir", "PDF", "ficha", "entregables", "exportar"],
  },
  {
    id: "inf-40",
    section: "paciente-informacion",
    question: "¿Cada cuánto debo actualizar la ficha informativa?",
    answer:
      "Revisa y actualiza al menos cada 3-6 meses los hábitos, peso, actividad y motivación, que cambian con frecuencia. Las analíticas según se hagan nuevas. Los antecedentes médicos y familiares solo cuando haya algo nuevo (diagnóstico, cirugía, medicación). Deja anotada la fecha de la última revisión de la ficha.",
    related: ["inf-18", "inf-39"],
    keywords: ["actualizar", "periódico", "revisión", "frecuencia"],
  },
  {
    id: "inf-41",
    section: "paciente-informacion",
    question: "¿La ficha informativa influye en la IA generadora de planes?",
    answer:
      "Sí, directamente. La IA lee los campos relevantes (edad, sexo, peso, altura, actividad, objetivos, patologías, alergias, preferencias alimentarias, restricciones religiosas, intolerancias) y genera un plan adaptado. Cuanto más completa la ficha, menos correcciones manuales necesitarás. Campos vacíos se asumen neutros.",
    related: ["inf-1", "inf-42"],
    keywords: ["IA", "planes", "generador", "ficha", "contexto"],
  },
  {
    id: "inf-42",
    section: "paciente-informacion",
    question: "¿Qué campos son críticos para que la IA genere bien el plan?",
    answer:
      "Los imprescindibles son: edad, sexo, peso y altura actuales, nivel de actividad física, objetivo principal, alergias e intolerancias, preferencias alimentarias (vegetariano, vegano, etc.) y patologías crónicas relevantes (diabetes, hipertensión, insuficiencia renal). Sin estos datos la IA tira de valores por defecto y pierde precisión.",
    related: ["inf-41", "inf-43"],
    keywords: ["IA", "campos", "críticos", "imprescindibles", "plan"],
  },
  {
    id: "inf-43",
    section: "paciente-informacion",
    question: "¿Qué hago si el paciente no sabe algún dato?",
    answer:
      "Déjalo en blanco y márcalo mentalmente para pedirlo más adelante. No inventes valores ni metas estimaciones sin avisar. Si es una analítica, pídele que te la envíe cuando la tenga. Si es peso o altura, pésalo y mídelo en consulta. Si es un antecedente familiar, pídele que pregunte en casa para la siguiente cita.",
    related: ["inf-44", "inf-5"],
    keywords: ["no sabe", "falta", "incompleto", "pendiente"],
  },
  {
    id: "inf-44",
    section: "paciente-informacion",
    question: "¿Puedo dejar campos en blanco sin que pase nada?",
    answer:
      "Sí. Solo son obligatorios los datos básicos del paciente (nombre, contacto) que están fuera de esta pestaña. Todos los campos de fichaInformacion son opcionales. En el plan y los informes se mostrará un guion o nada para los campos vacíos, sin errores. Rellena lo que tengas y completa el resto con el tiempo.",
    related: ["inf-43", "inf-5"],
    keywords: ["blanco", "opcional", "vacío", "obligatorio"],
  },
  {
    id: "inf-45",
    section: "paciente-informacion",
    question: "¿Es mejor rellenar la ficha en consulta o enviarla para que la complete el paciente?",
    answer:
      "Lo ideal es un mixto. En la primera consulta rellena en directo lo que preguntes al paciente (historia médica, hábitos, objetivos). Para el diario anterior y las analíticas es práctico pedirle que los envíe por el portal o por mensaje antes de la cita. Así optimizas el tiempo y la ficha queda más completa.",
    related: ["inf-46", "inf-5"],
    keywords: ["consulta", "rellenar", "paciente", "portal", "tiempo"],
  },
  {
    id: "inf-46",
    section: "paciente-informacion",
    question: "¿Cómo completar la ficha en consulta sin que se note mucho?",
    answer:
      "Ten la ficha abierta en pantalla y ve anotando mientras conversas: haz preguntas abiertas y transcribe respuestas clave en los campos adecuados. Evita la tentación de leer preguntas en voz alta; cambia el orden según la conversación fluye. Usa los 10 últimos minutos para revisar qué falta y pedírselo al paciente.",
    related: ["inf-45", "inf-5"],
    keywords: ["consulta", "conversación", "entrevista", "registro", "abiertas"],
  },
  {
    id: "inf-47",
    section: "paciente-informacion",
    question: "¿Qué unidades usan los campos numéricos?",
    answer:
      "Los campos numéricos muestran la unidad junto al input para evitar errores: peso en kg, altura en cm, glucosa en mg/dL, colesterol en mg/dL, hemoglobina en g/dL, ferritina en ng/mL, vitamina D en ng/mL, TSH en mUI/L, horas de sueño en h, alcohol en UBE semanales. Respeta siempre la unidad indicada.",
    related: ["inf-18", "inf-48"],
    keywords: ["unidades", "numérico", "kg", "mg/dL", "ng/mL"],
  },
  {
    id: "inf-48",
    section: "paciente-informacion",
    question: "¿Puedo cambiar las unidades de medida?",
    answer:
      "Las unidades de los campos clínicos están fijadas en el estándar habitual en España (sistema internacional y convencional según analítica). No se pueden cambiar por paciente. Si un informe del laboratorio trae otra unidad (por ejemplo mmol/L en lugar de mg/dL) tendrás que convertirla antes de introducir el valor.",
    related: ["inf-47", "inf-18"],
    keywords: ["unidades", "convertir", "mmol", "mg/dL", "laboratorio"],
  },
  {
    id: "inf-49",
    section: "paciente-informacion",
    question: "¿Estos datos son confidenciales? ¿Quién puede verlos?",
    answer:
      "Sí, son datos de salud sensibles. Solo tú (el profesional) y, si aplica, los colaboradores autorizados de tu cuenta pueden ver la ficha. El paciente ve sus propios datos en su portal. No se comparten con terceros sin tu orden. Están cifrados en tránsito (HTTPS) y protegidos por los permisos de la aplicación.",
    related: ["inf-50", "inf-51"],
    keywords: ["privacidad", "confidencial", "datos salud", "RGPD", "seguridad"],
  },
  {
    id: "inf-50",
    section: "paciente-informacion",
    question: "¿Cumple esta ficha con el RGPD?",
    answer:
      "El tratamiento está diseñado para cumplir con el RGPD y la LOPDGDD españolas: finalidad legítima (asistencia sanitaria), base jurídica (consentimiento del paciente y relación profesional), almacenamiento proporcional y derechos de acceso, rectificación y supresión. Es tu responsabilidad recabar el consentimiento informado del paciente.",
    related: ["inf-49", "inf-51"],
    keywords: ["RGPD", "LOPD", "consentimiento", "datos", "legal"],
  },
  {
    id: "inf-51",
    section: "paciente-informacion",
    question: "¿El paciente puede ver su propia ficha informativa?",
    answer:
      "En el portal del paciente se muestra un subconjunto limitado: sus datos básicos, objetivos y preferencias alimentarias declaradas. Los detalles clínicos (diagnósticos, analíticas, valoraciones) los gestionas tú y no se muestran por defecto. Si quieres compartir algo puntual, hazlo por mensaje o como entregable.",
    related: ["inf-49", "inf-39"],
    keywords: ["paciente", "portal", "visibilidad", "compartir"],
  },
  {
    id: "inf-52",
    section: "paciente-informacion",
    question: "¿Puedo buscar pacientes por un dato de la ficha informativa?",
    answer:
      "La búsqueda general del listado busca por nombre, apellidos, email y teléfono. Los filtros avanzados permiten filtrar por algunas etiquetas (por ejemplo vegetariano, con diabetes) si las has marcado en su ficha. Los campos libres (texto largo) no son buscables directamente; úsalos como información interna.",
    related: ["inf-33", "inf-44"],
    keywords: ["buscar", "filtrar", "etiquetas", "ficha"],
  },
  {
    id: "inf-53",
    section: "paciente-informacion",
    question: "¿Cómo anoto el consumo de alcohol y tabaco?",
    answer:
      "En Hábitos de vida. Para alcohol indica tipo (vino, cerveza, destilados), frecuencia (diario, fin de semana, esporádico) y cantidad aproximada. Para tabaco: fumador, exfumador (años que lleva sin fumar) o nunca, con número de cigarrillos/día si aplica. Son factores de riesgo relevantes que el plan debe considerar.",
    related: ["inf-14", "inf-15"],
    keywords: ["alcohol", "tabaco", "hábitos tóxicos", "consumo"],
  },
  {
    id: "inf-54",
    section: "paciente-informacion",
    question: "¿Qué hago si el paciente cambia de medicación o le diagnostican algo nuevo?",
    answer:
      "Actualiza inmediatamente la sección Historia médica con el nuevo diagnóstico, fecha y medicación. Revisa si el plan vigente sigue siendo seguro (por ejemplo si le recetan anticoagulantes, ajusta el consumo de vitamina K). Deja constancia también en Consultas, para tener el historial de cambios cronológico.",
    related: ["inf-7", "inf-10"],
    keywords: ["cambio", "medicación", "diagnóstico", "actualizar", "historia"],
  },
  {
    id: "inf-55",
    section: "paciente-informacion",
    question: "¿Qué buena práctica recomiendas para mantener la ficha útil?",
    answer:
      "Dedícale 5 minutos al final de cada consulta a actualizar lo que haya cambiado (peso, hábitos, motivación, eventos). Revisa la ficha entera una vez al año como mínimo. Anota la fecha en el campo correspondiente tras cada revisión. Una ficha viva y actualizada te ahorra decenas de preguntas repetidas y mejora la calidad de tus planes.",
    related: ["inf-40", "inf-46"],
    keywords: ["buenas prácticas", "mantener", "actualizar", "rutina", "calidad"],
  },
];
