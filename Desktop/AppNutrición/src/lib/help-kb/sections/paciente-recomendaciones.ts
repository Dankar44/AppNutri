import type { HelpEntry } from "../types";

export const PACIENTE_RECOMENDACIONES_ENTRIES: HelpEntry[] = [
  {
    id: "rec-1",
    section: "paciente-recomendaciones",
    question: "¿Qué es la pestaña Recomendaciones de la ficha del paciente?",
    answer:
      "Es un área de texto libre dentro de la ficha del paciente donde escribes consejos generales y pautas complementarias al plan alimenticio: hidratación, descanso, suplementación, motivación, pauta semanal de rutinas, recordatorios. Se guardan en el campo recomendaciones del paciente y son visibles desde su portal, junto al plan. No sustituyen al plan de comidas: lo acompañan.",
    related: ["rec-2", "rec-11", "rec-12"],
    keywords: ["recomendaciones", "texto libre", "consejos", "pestaña", "ficha"],
  },
  {
    id: "rec-2",
    section: "paciente-recomendaciones",
    question: "¿Dónde ve el paciente las recomendaciones que escribo?",
    answer:
      "En su portal, dentro de la sección Recomendaciones del menú lateral. Al entrar, ve una página con el texto tal y como lo guardaste, firmado con tu nombre (Escritas por Nombre Apellidos). El paciente no puede editarlas, solo leerlas. También aparecen al exportar el PDF del plan completo.",
    related: ["rec-1", "rec-16"],
    keywords: ["portal", "paciente", "visibles", "leer", "dónde"],
  },
  {
    id: "rec-3",
    section: "paciente-recomendaciones",
    question: "¿Cómo escribo las recomendaciones?",
    answer:
      "Abre la ficha del paciente, entra en la pestaña Recomendaciones y escribe directamente en el área de texto. Puedes redactar en el tono que prefieras (cercano, formal, directo), pero piensa que lo va a leer el paciente: evita tecnicismos que no vaya a entender. Escribe frases cortas y organízalas en párrafos.",
    related: ["rec-4", "rec-5", "rec-19"],
    keywords: ["escribir", "redactar", "cómo", "tono", "lenguaje"],
  },
  {
    id: "rec-4",
    section: "paciente-recomendaciones",
    question: "¿Puedo dar formato al texto con párrafos y saltos de línea?",
    answer:
      "Sí. El área de texto respeta los saltos de línea que introduces con la tecla Enter. Puedes separar ideas en párrafos para que se lean mejor. No hay formato enriquecido (no hay negritas, cursivas ni listas con viñetas automáticas), pero puedes simular listas con guiones o asteriscos al inicio de cada línea.",
    related: ["rec-3", "rec-5"],
    keywords: ["formato", "párrafos", "saltos de línea", "enter", "listas"],
  },
  {
    id: "rec-5",
    section: "paciente-recomendaciones",
    question: "¿Cuánto texto es recomendable escribir?",
    answer:
      "Lo suficiente para ser útil sin saturar. Una buena guía son entre 150 y 600 palabras: un bloque de hidratación, uno de descanso, otro de actividad o suplementos y un cierre motivacional. Si escribes demasiado, el paciente no lo lee; si escribes dos líneas, no aporta valor. Prioriza claridad sobre extensión.",
    related: ["rec-3", "rec-4"],
    keywords: ["longitud", "extensión", "palabras", "cuánto", "límite"],
  },
  {
    id: "rec-6",
    section: "paciente-recomendaciones",
    question: "¿Cómo se guardan los cambios en las recomendaciones?",
    answer:
      "Se guardan automáticamente. Mientras escribes, el sistema aplica un debounce y envía los cambios al servidor aproximadamente cada segundo y medio. Cuando haces clic fuera del área de texto (blur), se fuerza un guardado inmediato. Verás un indicador Guardando mientras se sincroniza. No hace falta pulsar ningún botón.",
    related: ["rec-7", "rec-8"],
    keywords: ["guardar", "autoguardado", "cambios", "persistir", "automático"],
  },
  {
    id: "rec-7",
    section: "paciente-recomendaciones",
    question: "¿Cómo edito las recomendaciones ya guardadas?",
    answer:
      "Entra en la pestaña Recomendaciones del paciente y modifica el texto directamente. Puedes añadir frases, borrar párrafos o reescribir lo que haga falta. Cada cambio se guarda automáticamente. Si el paciente está en ese momento en su portal, verá la versión actualizada al refrescar la página.",
    related: ["rec-6", "rec-8"],
    keywords: ["editar", "modificar", "cambiar", "actualizar", "rehacer"],
  },
  {
    id: "rec-8",
    section: "paciente-recomendaciones",
    question: "¿Cómo vacío todas las recomendaciones de golpe?",
    answer:
      "Selecciona todo el contenido del área de texto (Ctrl+A o Cmd+A) y pulsa Suprimir o Retroceso. El campo quedará vacío y, al hacer clic fuera, se guardará la cadena vacía. En ese caso el paciente verá en su portal una pantalla indicando que aún no tiene recomendaciones escritas por su nutricionista.",
    related: ["rec-6", "rec-7"],
    keywords: ["vaciar", "borrar todo", "limpiar", "eliminar", "reset"],
  },
  {
    id: "rec-9",
    section: "paciente-recomendaciones",
    question: "¿Qué puedo incluir sobre hidratación?",
    answer:
      "Indica la cantidad diaria recomendada (por ejemplo, 2 a 2,5 litros de agua), cuándo beber (al despertar, entre comidas, antes de entrenar), qué cuenta como hidratación (agua, infusiones sin azúcar, caldos) y qué limitar (refrescos, zumos industriales, alcohol). Personaliza según clima, actividad y patología: un deportista o alguien en verano necesita más.",
    related: ["rec-10", "rec-11"],
    keywords: ["hidratación", "agua", "litros", "beber", "infusiones"],
  },
  {
    id: "rec-10",
    section: "paciente-recomendaciones",
    question: "¿Qué escribo sobre descanso y sueño?",
    answer:
      "Recomienda 7-9 horas de sueño, rutina de acostarse y levantarse a la misma hora, evitar pantallas una hora antes de dormir, cenar al menos 2 horas antes de ir a la cama y reducir cafeína después del mediodía. Si el paciente duerme mal, incide en esto: el mal descanso sabotea la adherencia al plan y aumenta el apetito.",
    related: ["rec-9", "rec-28"],
    keywords: ["descanso", "sueño", "horas", "rutina", "cafeína"],
  },
  {
    id: "rec-11",
    section: "paciente-recomendaciones",
    question: "¿Puedo indicar suplementos en las recomendaciones?",
    answer:
      "Sí, siempre dentro de tus competencias. Puedes recomendar suplementos nutricionales habituales (proteína en polvo, creatina, omega-3, vitamina D, magnesio, probióticos) indicando dosis orientativa, momento del día y duración. No prescribas medicamentos. Si el paciente tiene patología o medicación, remite al médico para valorar interacciones.",
    related: ["rec-9", "rec-12"],
    keywords: ["suplementos", "proteína", "omega-3", "vitamina", "dosis"],
  },
  {
    id: "rec-12",
    section: "paciente-recomendaciones",
    question: "¿Cómo escribo una pauta semanal de hábitos?",
    answer:
      "Estructúrala por días o por bloques. Por ejemplo: Lunes, miércoles y viernes entrenamiento de fuerza; martes y jueves caminar 40 minutos; domingo cocina batch para toda la semana. También puedes plantear micro-objetivos semanales: esta semana, cenar siempre antes de las 21:30. Una pauta clara se sigue mejor que una vaga.",
    related: ["rec-13", "rec-24"],
    keywords: ["pauta semanal", "rutina", "días", "hábitos", "planning"],
  },
  {
    id: "rec-13",
    section: "paciente-recomendaciones",
    question: "¿Qué tipo de mensaje motivacional funciona mejor?",
    answer:
      "Mensajes cortos, concretos y realistas. Evita frases hechas tipo tú puedes. Mejor: los resultados llegan con constancia, no con intensidad. Acepta que habrá días peores y vuelve al plan sin culpa. Reconoce el esfuerzo. Si el paciente tiene un objetivo específico (boda, operación bikini, salud), conecta el mensaje con ese porqué personal.",
    related: ["rec-14", "rec-21"],
    keywords: ["motivación", "mensajes", "ánimo", "adherencia", "porqué"],
  },
  {
    id: "rec-14",
    section: "paciente-recomendaciones",
    question: "¿Cómo personalizo las recomendaciones según el objetivo?",
    answer:
      "Adapta el contenido al objetivo del paciente. Para pérdida de peso: déficit moderado, saciedad, control de picoteo, ejercicio sostenible. Para ganancia de masa muscular: superávit, proteína, entrenamiento de fuerza, descanso. Para salud metabólica: fibra, omega-3, actividad diaria. Para rendimiento deportivo: hidratación, pre/post entreno, recuperación.",
    related: ["rec-12", "rec-21"],
    keywords: ["personalizar", "objetivo", "pérdida", "masa", "salud"],
  },
  {
    id: "rec-15",
    section: "paciente-recomendaciones",
    question: "¿Cuál es la diferencia entre las recomendaciones y el plan alimenticio?",
    answer:
      "El plan alimenticio es la estructura concreta de comidas (desayuno, almuerzo, cena, cantidades, recetas). Las recomendaciones son los consejos complementarios que rodean al plan: hidratación, descanso, actividad, suplementos, pautas de comportamiento, motivación. El plan dice qué comer; las recomendaciones dicen cómo vivir mejor alrededor de esa comida.",
    related: ["rec-1", "rec-16"],
    keywords: ["diferencia", "plan alimenticio", "comidas", "consejos", "complementario"],
  },
  {
    id: "rec-16",
    section: "paciente-recomendaciones",
    question: "¿Las recomendaciones son lo mismo que las notas internas?",
    answer:
      "No. Las recomendaciones son visibles para el paciente en su portal. Las notas internas, si existen en otras pestañas de la ficha, son privadas y solo las ves tú como nutri. Nunca escribas valoraciones personales, dudas clínicas o comentarios privados en las recomendaciones: todo lo que escribes ahí lo lee el paciente.",
    related: ["rec-2", "rec-15"],
    keywords: ["notas internas", "privadas", "diferencia", "visible", "confidencial"],
  },
  {
    id: "rec-17",
    section: "paciente-recomendaciones",
    question: "¿Cada cuánto debo revisar y actualizar las recomendaciones?",
    answer:
      "Al menos en cada consulta de seguimiento. Si el paciente ha progresado, retira consejos ya interiorizados y añade otros nuevos. Si ha estancado, refuerza las recomendaciones clave. Unas recomendaciones fijas durante 6 meses pierden valor: el paciente deja de leerlas. Actualizar cada 3-4 semanas mantiene vivo el mensaje.",
    related: ["rec-7", "rec-20"],
    keywords: ["revisar", "actualizar", "periodicidad", "seguimiento", "frecuencia"],
  },
  {
    id: "rec-18",
    section: "paciente-recomendaciones",
    question: "¿Puedo incluir enlaces a páginas web o vídeos?",
    answer:
      "Puedes pegar la URL completa en el texto (por ejemplo https://ejemplo.com/video) y el paciente la verá como texto. El área actual no convierte los enlaces en clicables automáticamente, así que el paciente tendría que copiarlos y pegarlos en el navegador. Si quieres compartir materiales enlazados de forma más cómoda, utiliza la pestaña Entregables y sube el documento directamente.",
    related: ["rec-19", "rec-20"],
    keywords: ["enlaces", "url", "links", "web", "vídeos"],
  },
  {
    id: "rec-19",
    section: "paciente-recomendaciones",
    question: "¿Uso recomendaciones estándar para todos o las personalizo?",
    answer:
      "Lo ideal es combinar ambas. Puedes tener una base estándar (hidratación, descanso, actividad) que copias y pegas entre pacientes para no reescribir cada vez, y un bloque personalizado con su nombre, su objetivo y sus obstáculos concretos. El paciente detecta rápido si le hablas a él o si le has pegado una plantilla genérica.",
    related: ["rec-14", "rec-20"],
    keywords: ["estándar", "personalizar", "plantilla", "genérico", "copiar"],
  },
  {
    id: "rec-20",
    section: "paciente-recomendaciones",
    question: "¿Las recomendaciones se exportan cuando genero el PDF del paciente?",
    answer:
      "Sí. Al exportar el PDF del plan desde el portal o desde la ficha, las recomendaciones se incluyen como una sección dedicada al final del documento. Esto permite al paciente tenerlas impresas o compartirlas con su médico. Revisa antes de exportar que el texto esté al día y bien redactado.",
    related: ["rec-2", "rec-17"],
    keywords: ["exportar", "pdf", "imprimir", "documento", "descargar"],
  },
  {
    id: "rec-21",
    section: "paciente-recomendaciones",
    question: "¿Puedo repasar las recomendaciones con el paciente en consulta?",
    answer:
      "Sí, y es muy recomendable. En cada consulta de seguimiento, abre la pestaña Recomendaciones, léela en alto con el paciente, pregúntale cuáles le están costando y ajústalas en directo. Ese ritual refuerza su valor: no son un texto olvidado, son un acuerdo vivo que revisáis juntos. Guardar en tiempo real hace que sienta que lo tomas en serio.",
    related: ["rec-13", "rec-17"],
    keywords: ["consulta", "revisar", "repasar", "seguimiento", "en directo"],
  },
  {
    id: "rec-22",
    section: "paciente-recomendaciones",
    question: "¿Qué recomendaciones deportivas puedo incluir?",
    answer:
      "Recomienda un tipo de actividad según el perfil (fuerza, cardio, movilidad, caminar), frecuencia semanal, duración, intensidad subjetiva (RPE o escala 1-10) y cuándo hacerla respecto a las comidas (entrenar 1-2 horas después de comer suele funcionar bien). Incluye consejos de hidratación antes, durante y después, y días de descanso activo o completo.",
    related: ["rec-12", "rec-23"],
    keywords: ["deporte", "ejercicio", "entrenamiento", "rutina", "fuerza"],
  },
  {
    id: "rec-23",
    section: "paciente-recomendaciones",
    question: "¿Y sobre ocasiones sociales como bodas, cenas de empresa o vacaciones?",
    answer:
      "Incluye una sección específica. Consejos útiles: no llegar con hambre, elegir plato principal proteico y acompañar con verdura, moderar alcohol (1-2 copas máximo), permitirse el postre si apetece y volver al plan habitual al día siguiente sin compensar en exceso. Normaliza estas situaciones: forman parte de la vida y no tienen por qué romper el progreso.",
    related: ["rec-14", "rec-22"],
    keywords: ["ocasiones", "sociales", "bodas", "restaurante", "flexibilidad"],
  },
  {
    id: "rec-24",
    section: "paciente-recomendaciones",
    question: "¿Qué recomendaciones de sueño son más útiles?",
    answer:
      "Mantener horario regular (acostarse y levantarse a la misma hora, incluso en fin de semana), exponerse a luz natural por la mañana, evitar pantallas y luz azul 60 minutos antes de dormir, cena ligera 2-3 horas antes, habitación oscura y fresca (18-20 °C), nada de cafeína después de las 16:00 y técnicas de relajación si hay dificultad para dormir.",
    related: ["rec-10", "rec-25"],
    keywords: ["sueño", "dormir", "horario", "luz azul", "higiene"],
  },
  {
    id: "rec-25",
    section: "paciente-recomendaciones",
    question: "¿Cómo escribo recomendaciones sobre gestión del estrés?",
    answer:
      "Incluye técnicas prácticas: respiración 4-7-8 o respiración diafragmática, 10 minutos de meditación guiada al día, paseos sin móvil, registrar pensamientos en un diario, reducir estimulantes (cafeína, alcohol, nicotina) y priorizar actividades placenteras. Recuérdale que el estrés crónico eleva cortisol, aumenta el apetito y dificulta la pérdida de grasa.",
    related: ["rec-10", "rec-24"],
    keywords: ["estrés", "gestión", "respiración", "meditación", "cortisol"],
  },
  {
    id: "rec-26",
    section: "paciente-recomendaciones",
    question: "¿Puedo usar emojis o símbolos para ordenar el texto?",
    answer:
      "Puedes, con moderación. Usar un pequeño marcador al inicio de cada bloque (por ejemplo un guión, una flecha → o un emoji puntual) ayuda a visualizar mejor secciones. Evita sobrecargar el texto de emojis: resta profesionalidad. Un uso funcional (hidratación, descanso, rutina) puede funcionar; una recomendación llena de corazones no.",
    related: ["rec-4", "rec-19"],
    keywords: ["emojis", "símbolos", "formato", "visual", "marcadores"],
  },
  {
    id: "rec-27",
    section: "paciente-recomendaciones",
    question: "¿Cómo enfoco las recomendaciones si el paciente tiene patología?",
    answer:
      "Adapta el contenido a su condición. En hipertensión, refuerza reducir sal, controlar alcohol y movimiento diario. En diabetes, hidratación, horarios regulares y actividad postprandial. En colon irritable, comer sin prisa, masticar bien y evitar sus FODMAP personales. Siempre dentro de tus competencias y en coordinación con el médico que lleve la patología.",
    related: ["rec-11", "rec-14"],
    keywords: ["patología", "enfermedad", "hipertensión", "diabetes", "crónica"],
  },
  {
    id: "rec-28",
    section: "paciente-recomendaciones",
    question: "¿Qué hago si el paciente me dice que no lee las recomendaciones?",
    answer:
      "Replantea el formato. Puede que sean demasiado largas, genéricas o poco claras. Reduce a 5-6 puntos concretos, persónalas por su nombre y obstáculos, y léelas con él en la siguiente consulta. También puedes acordar revisar una recomendación por semana. Si ve que las usas activamente, las leerá. Si son un texto fijo que nunca cambia, las ignorará.",
    related: ["rec-5", "rec-21"],
    keywords: ["no lee", "ignorar", "adherencia", "replantear", "concreto"],
  },
  {
    id: "rec-29",
    section: "paciente-recomendaciones",
    question: "¿Puedo copiar las recomendaciones de un paciente a otro?",
    answer:
      "No hay un botón de copia directa entre pacientes, pero puedes seleccionar todo el texto con Ctrl+A (o Cmd+A), copiarlo con Ctrl+C y pegarlo en la ficha de otro paciente. Imprescindible: revisa y personaliza antes de guardar. Cambia nombres, ajusta los consejos a su objetivo y elimina lo que no aplique. Una recomendación copia-pega sin ajustar se nota enseguida.",
    related: ["rec-19", "rec-20"],
    keywords: ["copiar", "duplicar", "plantilla", "reutilizar", "otro paciente"],
  },
  {
    id: "rec-30",
    section: "paciente-recomendaciones",
    question: "¿Qué relación tienen las recomendaciones con el horario del paciente?",
    answer:
      "Las recomendaciones y el horario del paciente (horarioPaciente) son campos distintos. Las recomendaciones son texto libre visible en su portal; el horario se gestiona en otra pestaña específica y sirve para planificar comidas y citas alrededor de su disponibilidad real. Puedes referenciar su horario dentro de las recomendaciones (por ejemplo, beber 500 ml al llegar al trabajo a las 9:00), pero el horario se edita fuera de esta pestaña.",
    related: ["rec-1", "rec-12"],
    keywords: ["horario", "horarioPaciente", "diferencia", "pestaña", "planificación"],
  },
];
