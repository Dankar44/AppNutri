export interface HelpEntry {
  id: string;
  section: string;
  question: string;
  answer: string;
  related: string[];
  keywords: string[];
}

export const HELP_ENTRIES: HelpEntry[] = [
  // ─── GENERAL ───
  {
    id: "g1",
    section: "general",
    question: "¿Qué es NutriApp?",
    answer: "NutriApp es una plataforma profesional para dietistas-nutricionistas. Te permite gestionar pacientes, crear planes alimenticios semanales, hacer seguimiento de evolución con medidas antropométricas, generar dietas con inteligencia artificial, compartir planes con pacientes y mucho más.",
    related: ["g2", "g3"],
    keywords: ["qué es", "aplicación", "para qué sirve", "plataforma"],
  },
  {
    id: "g2",
    section: "general",
    question: "¿Por dónde empiezo?",
    answer: "Te recomendamos seguir estos pasos:\n\n1. Crea tu primer paciente en la sección Pacientes\n2. Añade alimentos a tu base de datos (o importa desde Open Food Facts)\n3. Crea un plan alimenticio y asígnaselo al paciente\n4. Comparte el plan con tu paciente mediante un enlace\n\nTambién puedes configurar tu perfil en Ajustes y explorar el Dashboard para ver un resumen de tu actividad.",
    related: ["p1", "a1", "d1", "g3"],
    keywords: ["empezar", "primeros pasos", "inicio", "nuevo", "comenzar"],
  },
  {
    id: "g3",
    section: "general",
    question: "¿Cómo navego por la app?",
    answer: "El menú lateral (sidebar) tiene todas las secciones principales:\n\n• Dashboard — Resumen general\n• Pacientes — Gestión de pacientes\n• Dietas — Planes alimenticios\n• Alimentos — Base de datos nutricional\n• Recetas — Combinaciones de alimentos\n• Agenda — Citas y calendario\n• Reportes — Estadísticas e informes\n• Ajustes — Tu perfil y suscripción\n\nEn móvil, pulsa el icono de menú (☰) arriba a la izquierda.",
    related: ["g1", "g4"],
    keywords: ["navegar", "menú", "sidebar", "secciones", "moverse"],
  },
  {
    id: "g4",
    section: "general",
    question: "¿Puedo usar la app desde el móvil?",
    answer: "Sí, NutriApp es completamente responsive. Puedes acceder desde cualquier navegador en tu teléfono o tablet. El menú lateral se convierte en un menú desplegable en pantallas pequeñas.",
    related: ["g3"],
    keywords: ["móvil", "celular", "tablet", "responsive", "teléfono"],
  },
  {
    id: "g5",
    section: "general",
    question: "¿Mis datos están seguros?",
    answer: "Sí. Todos los datos se almacenan en servidores seguros con cifrado. Cada dietista solo puede ver sus propios pacientes y datos. Las contraseñas se almacenan con hash seguro y las sesiones tienen expiración automática.",
    related: ["g1"],
    keywords: ["seguridad", "datos", "privacidad", "cifrado", "seguro"],
  },

  // ─── DASHBOARD ───
  {
    id: "dash1",
    section: "dashboard",
    question: "¿Qué veo en el Dashboard?",
    answer: "El Dashboard es tu resumen diario. Muestra:\n\n• Tarjetas con métricas clave: pacientes totales, consultas del mes, planes activos y citas de la semana\n• Un gráfico de actividad de los últimos 6 meses\n• Pacientes que necesitan atención (sin consulta reciente, sin medidas, planes antiguos)\n• Las citas programadas para hoy",
    related: ["dash2", "dash3"],
    keywords: ["dashboard", "panel", "resumen", "inicio", "métricas"],
  },
  {
    id: "dash2",
    section: "dashboard",
    question: "¿Qué son los pacientes que necesitan atención?",
    answer: "Son alertas automáticas que te avisan cuando:\n\n• Un paciente lleva más de 30 días sin consulta\n• Un paciente lleva más de 30 días sin registrar medidas\n• Un plan alimenticio no se ha actualizado en más de 30 días\n\nHaz clic en cualquier paciente de la lista para ir directamente a su ficha.",
    related: ["dash1", "not1"],
    keywords: ["atención", "alertas", "sin consulta", "sin medidas", "avisos"],
  },
  {
    id: "dash3",
    section: "dashboard",
    question: "¿Las citas de hoy aparecen automáticamente?",
    answer: "Sí, en la parte inferior del Dashboard verás todas las citas programadas para hoy con la hora, duración, nombre del paciente y motivo. También puedes ir a la Agenda para ver la vista semanal o mensual completa.",
    related: ["dash1", "ag1"],
    keywords: ["citas hoy", "agenda", "programadas", "hoy"],
  },
  {
    id: "dash4",
    section: "dashboard",
    question: "¿Los datos del Dashboard se actualizan solos?",
    answer: "Sí, cada vez que entras al Dashboard se recalculan todas las métricas y se generan las notificaciones automáticas. No necesitas hacer nada manualmente.",
    related: ["dash1"],
    keywords: ["actualizar", "refrescar", "automático", "datos"],
  },

  // ─── PACIENTES ───
  {
    id: "p1",
    section: "pacientes",
    question: "¿Cómo creo un nuevo paciente?",
    answer: "Ve a Pacientes y pulsa el botón \"Nuevo paciente\" arriba a la derecha. Rellena los datos:\n\n• Nombre y apellidos (obligatorios)\n• Email, teléfono (opcionales)\n• Fecha de nacimiento, sexo, peso, altura\n• Alergias, intolerancias, patologías, medicamentos\n• Objetivo (perder peso, ganar masa, etc.)\n• Preferencias alimentarias y notas\n\nAl guardar, se creará la ficha del paciente.",
    related: ["p2", "p3", "pd1"],
    keywords: ["crear paciente", "nuevo paciente", "añadir paciente", "registrar"],
  },
  {
    id: "p2",
    section: "pacientes",
    question: "¿Qué datos del paciente son obligatorios?",
    answer: "Solo el nombre y los apellidos son obligatorios. Todo lo demás (email, teléfono, peso, altura, alergias, etc.) es opcional. Te recomendamos rellenar cuanta más información mejor, especialmente alergias e intolerancias, ya que la IA los usa para generar planes.",
    related: ["p1", "ia3"],
    keywords: ["obligatorio", "requerido", "datos", "campos"],
  },
  {
    id: "p3",
    section: "pacientes",
    question: "¿Puedo desactivar un paciente sin borrarlo?",
    answer: "Sí. En la ficha del paciente, pulsa el menú de Acciones (tres puntos) y selecciona \"Desactivar\". El paciente quedará inactivo: no aparecerá en las métricas ni en las alertas, pero sus datos se conservan. Puedes reactivarlo cuando quieras.",
    related: ["p1", "pd1"],
    keywords: ["desactivar", "inactivo", "archivar", "ocultar", "borrar"],
  },
  {
    id: "p4",
    section: "pacientes",
    question: "¿Cómo busco un paciente?",
    answer: "En la página de Pacientes hay un buscador en la parte superior. Escribe el nombre o apellido y la lista se filtrará automáticamente. También puedes filtrar solo pacientes activos con el selector correspondiente.",
    related: ["p1", "p5"],
    keywords: ["buscar", "filtrar", "encontrar", "busqueda"],
  },
  {
    id: "p5",
    section: "pacientes",
    question: "¿Qué es el IMC que aparece en la lista?",
    answer: "El IMC (Índice de Masa Corporal) se calcula automáticamente dividiendo el peso (kg) entre la altura (m) al cuadrado. Es un indicador estándar del estado nutricional:\n\n• < 18.5: Bajo peso\n• 18.5 - 24.9: Normal\n• 25 - 29.9: Sobrepeso\n• ≥ 30: Obesidad",
    related: ["med1", "p1"],
    keywords: ["imc", "índice masa corporal", "peso", "altura", "calcular"],
  },
  {
    id: "p6",
    section: "pacientes",
    question: "¿Cómo cambio entre vista tabla y tarjetas?",
    answer: "En la página de Pacientes, arriba a la derecha de la lista verás dos iconos: uno de tabla y otro de cuadrícula. Haz clic en el que prefieras para cambiar la visualización.",
    related: ["p4"],
    keywords: ["vista", "tabla", "tarjetas", "cards", "grid", "lista"],
  },

  // ─── DETALLE DEL PACIENTE ───
  {
    id: "pd1",
    section: "paciente-detalle",
    question: "¿Qué puedo ver en la ficha del paciente?",
    answer: "La ficha del paciente muestra toda su información:\n\n• Datos personales (email, teléfono, edad, sexo)\n• Historial médico (alergias, intolerancias, patologías, medicamentos)\n• Preferencias alimentarias\n• Mini gráfica de evolución de peso\n• Medidas actuales (peso, altura, IMC)\n• Planes alimenticios asignados\n• Accesos rápidos a consultas, medidas, diario y portal",
    related: ["pd2", "pd3", "pd4"],
    keywords: ["ficha", "detalle", "perfil", "información", "paciente"],
  },
  {
    id: "pd2",
    section: "paciente-detalle",
    question: "¿Cómo registro una consulta?",
    answer: "Desde la ficha del paciente, pulsa \"Consultas\" y luego \"Nueva consulta\". Puedes añadir:\n\n• Fecha de la consulta\n• Motivo de la visita\n• Notas y observaciones\n• Opcionalmente, vincular medidas del mismo día\n\nLas consultas quedan como historial de visitas.",
    related: ["con1", "pd3"],
    keywords: ["consulta", "registrar", "visita", "nueva consulta"],
  },
  {
    id: "pd3",
    section: "paciente-detalle",
    question: "¿Cómo registro medidas antropométricas?",
    answer: "Desde la ficha del paciente, pulsa \"Medidas\". En el formulario lateral puedes registrar:\n\n• Peso y altura (calcula el IMC automáticamente)\n• Porcentaje de grasa corporal\n• Masa muscular\n• Perímetros (cintura, cadera, brazo)\n• Notas adicionales\n\nCada medida nueva aparecerá en las gráficas de evolución.",
    related: ["med1", "pd2"],
    keywords: ["medidas", "peso", "grasa", "perímetro", "antropométricas", "registrar"],
  },
  {
    id: "pd4",
    section: "paciente-detalle",
    question: "¿Qué es el portal del paciente?",
    answer: "Es un acceso web independiente para tus pacientes. Les permite:\n\n• Ver su plan alimenticio actual\n• Registrar lo que comen en un diario\n• Ver su evolución (gráficas de peso, IMC, etc.)\n\nPara activarlo, ve a la ficha del paciente > Portal > configura un email y contraseña. El paciente entrará desde una URL separada.",
    related: ["pd5", "pd1"],
    keywords: ["portal", "acceso paciente", "login paciente", "web paciente"],
  },
  {
    id: "pd5",
    section: "paciente-detalle",
    question: "¿Cómo configuro el portal del paciente?",
    answer: "En la ficha del paciente, pulsa \"Portal\":\n\n1. Introduce el email del paciente\n2. Establece un PIN o contraseña\n3. Activa el acceso\n\nEl paciente podrá acceder desde la página de login de pacientes con esas credenciales. Puedes desactivar el acceso en cualquier momento.",
    related: ["pd4"],
    keywords: ["configurar portal", "activar portal", "acceso", "credenciales"],
  },

  // ─── CONSULTAS Y MEDIDAS ───
  {
    id: "con1",
    section: "paciente-consultas",
    question: "¿Cuál es la diferencia entre consulta y medida?",
    answer: "Son dos cosas diferentes pero complementarias:\n\n• Consulta: es el registro de una visita. Incluye fecha, motivo y notas del dietista. Es como un \"acta\" de la sesión.\n\n• Medida: son datos antropométricos concretos (peso, % grasa, perímetros). Sirven para seguir la evolución con gráficas.\n\nPuedes vincular medidas a una consulta para que queden asociadas.",
    related: ["pd2", "med1"],
    keywords: ["diferencia", "consulta", "medida", "visita", "antropométrica"],
  },
  {
    id: "med1",
    section: "paciente-medidas",
    question: "¿Cómo veo la evolución del paciente?",
    answer: "En la sección Medidas del paciente verás gráficas de evolución que muestran la tendencia a lo largo del tiempo:\n\n• Peso (kg)\n• IMC\n• Porcentaje de grasa corporal\n• Masa muscular\n• Perímetro de cintura\n\nNecesitas al menos 2 medidas registradas para que las gráficas aparezcan.",
    related: ["pd3", "con1"],
    keywords: ["evolución", "gráficas", "tendencia", "progreso", "charts"],
  },

  // ─── DIETAS / PLANES ───
  {
    id: "d1",
    section: "dietas",
    question: "¿Cómo creo un plan alimenticio?",
    answer: "Ve a Dietas > \"Nuevo plan\":\n\n1. Selecciona el paciente\n2. Pon un nombre al plan\n3. Opcionalmente, configura objetivos de macros (calorías, proteínas, carbohidratos, grasas)\n4. Puedes empezar desde cero o usar una plantilla guardada\n\nAl crear el plan se genera automáticamente la estructura de 7 días con 6 comidas cada uno.",
    related: ["d2", "d3", "d5"],
    keywords: ["crear plan", "nuevo plan", "dieta", "alimenticio"],
  },
  {
    id: "d2",
    section: "dietas",
    question: "¿Qué comidas incluye cada día?",
    answer: "Cada día tiene 6 franjas horarias:\n\n1. Desayuno\n2. Media mañana\n3. Almuerzo\n4. Merienda\n5. Cena\n6. Recena (snack nocturno)\n\nPuedes dejar vacía cualquier comida si el paciente no la necesita.",
    related: ["d1", "d3"],
    keywords: ["comidas", "desayuno", "almuerzo", "cena", "merienda", "recena"],
  },
  {
    id: "d3",
    section: "dieta-editor",
    question: "¿Cómo añado alimentos a una comida?",
    answer: "En el editor del plan, cada comida tiene un botón \"+\" para añadir alimentos:\n\n1. Pulsa \"+\" en la comida deseada\n2. Busca un alimento o receta por nombre\n3. Selecciónalo\n4. Ajusta la cantidad (en gramos u otra unidad)\n\nLos macros se recalculan automáticamente. También puedes arrastrar alimentos entre comidas.",
    related: ["d1", "d4", "d6"],
    keywords: ["añadir alimento", "agregar", "comida", "buscar", "editor"],
  },
  {
    id: "d4",
    section: "dieta-editor",
    question: "¿Puedo arrastrar alimentos entre comidas?",
    answer: "Sí, el editor de planes soporta drag & drop. Simplemente mantén pulsado un alimento y arrástralo a otra comida del mismo día o de otro día. Los macros se recalculan automáticamente.",
    related: ["d3"],
    keywords: ["arrastrar", "drag", "drop", "mover", "reorganizar"],
  },
  {
    id: "d5",
    section: "dietas",
    question: "¿Qué son los objetivos de macros?",
    answer: "Son las metas nutricionales diarias que puedes configurar para el plan:\n\n• Calorías (kcal)\n• Proteínas (g)\n• Carbohidratos (g)\n• Grasas (g)\n\nSon opcionales. Si los configuras, el editor mostrará la diferencia entre lo planificado y el objetivo para ayudarte a ajustar el plan.",
    related: ["d1", "d3"],
    keywords: ["macros", "objetivos", "calorías", "proteínas", "carbohidratos", "grasas", "target"],
  },
  {
    id: "d6",
    section: "dietas",
    question: "¿Qué es una plantilla?",
    answer: "Una plantilla es un plan alimenticio guardado como modelo reutilizable. Cuando tienes un plan que funciona bien, puedes guardarlo como plantilla y usarlo como punto de partida para otros pacientes.\n\nPara guardar: abre el plan > botón \"Guardar como plantilla\".\nPara usar: al crear un nuevo plan, selecciona la plantilla en el formulario.",
    related: ["d1", "d7"],
    keywords: ["plantilla", "template", "reutilizar", "modelo", "guardar"],
  },
  {
    id: "d7",
    section: "dieta-compartir",
    question: "¿Cómo comparto un plan con mi paciente?",
    answer: "En el detalle del plan, pulsa \"Compartir\":\n\n1. Se genera un enlace único\n2. Copia el enlace y envíaselo al paciente (por WhatsApp, email, etc.)\n3. El paciente puede abrir el enlace sin necesidad de crear una cuenta\n4. Verá el plan completo y podrá generar una lista de la compra\n\nPuedes crear varios enlaces y desactivarlos cuando quieras.",
    related: ["d6", "pd4"],
    keywords: ["compartir", "enlace", "link", "enviar", "paciente", "whatsapp"],
  },

  // ─── GENERACIÓN CON IA ───
  {
    id: "ia1",
    section: "dieta-ia",
    question: "¿Cómo genero un plan con IA?",
    answer: "Desde el detalle de un plan, pulsa el botón \"IA\" (con icono de estrella):\n\n1. Verifica los datos del paciente (objetivo, alergias, preferencias)\n2. Configura los macros objetivo\n3. Añade instrucciones especiales si quieres (ej: \"sin lácteos por la noche\")\n4. Pulsa \"Generar\"\n\nLa IA creará un plan semanal completo que podrás revisar y editar como cualquier otro plan.",
    related: ["ia2", "ia3", "d1"],
    keywords: ["ia", "inteligencia artificial", "generar", "automático", "groq"],
  },
  {
    id: "ia2",
    section: "dieta-ia",
    question: "¿Necesito configurar algo para usar la IA?",
    answer: "Sí, la IA requiere claves API de Groq configuradas en el servidor (archivo .env.local). Si no están configuradas, el botón de IA mostrará un aviso. Contacta con el administrador si necesitas que se active.",
    related: ["ia1"],
    keywords: ["configurar", "api", "groq", "claves", "activar ia"],
  },
  {
    id: "ia3",
    section: "dieta-ia",
    question: "¿La IA tiene en cuenta los datos del paciente?",
    answer: "Sí, la IA usa toda la información disponible del paciente:\n\n• Objetivo (perder peso, ganar masa, etc.)\n• Alergias e intolerancias\n• Patologías y medicamentos\n• Preferencias alimentarias\n• Macros objetivo del plan\n\nPor eso es importante rellenar bien la ficha del paciente antes de generar con IA.",
    related: ["ia1", "p2"],
    keywords: ["ia datos", "personalizado", "alergias", "objetivo", "preferencias"],
  },
  {
    id: "ia4",
    section: "dieta-ia",
    question: "¿Puedo editar el plan generado por IA?",
    answer: "Sí, el plan generado es completamente editable. Puedes añadir, quitar o modificar cualquier alimento, cambiar cantidades o reorganizar comidas igual que con un plan creado manualmente.",
    related: ["ia1", "d3"],
    keywords: ["editar", "modificar", "cambiar", "ia generado"],
  },

  // ─── ALIMENTOS ───
  {
    id: "a1",
    section: "alimentos",
    question: "¿Cómo añado un alimento nuevo?",
    answer: "Ve a Alimentos > \"Nuevo alimento\". Introduce:\n\n• Nombre del alimento\n• Categoría (frutas, verduras, carnes, etc.)\n• Valores nutricionales por 100g: calorías, proteínas, carbohidratos, grasas y fibra\n• Porción estándar y unidad de medida\n\nEl alimento quedará disponible para usar en planes y recetas.",
    related: ["a2", "a3"],
    keywords: ["crear alimento", "nuevo alimento", "añadir", "nutrientes"],
  },
  {
    id: "a2",
    section: "alimentos",
    question: "¿Puedo importar alimentos de una base de datos?",
    answer: "Sí. Ve a Alimentos > \"Importar\". Podrás buscar en la base de datos de Open Food Facts (millones de alimentos con datos nutricionales verificados). Selecciona un alimento y pulsa \"Importar\" para añadirlo a tu base de datos personal.",
    related: ["a1", "a4"],
    keywords: ["importar", "open food facts", "base de datos", "buscar", "api"],
  },
  {
    id: "a3",
    section: "alimentos",
    question: "¿Los valores nutricionales son siempre por 100g?",
    answer: "Sí, en la base de datos todos los valores se almacenan por 100g. Cuando añades un alimento a un plan con una cantidad diferente (ej: 150g de pollo), los macros se recalculan automáticamente según la proporción.",
    related: ["a1", "d3"],
    keywords: ["100g", "porción", "cantidad", "gramos", "recalcular"],
  },
  {
    id: "a4",
    section: "alimentos",
    question: "¿Qué categorías de alimentos hay?",
    answer: "Las categorías disponibles son:\n\nFrutas, Verduras, Cereales, Legumbres, Carnes, Pescados, Lácteos, Huevos, Frutos secos, Aceites, Bebidas, Condimentos, Dulces y Otros.\n\nPuedes filtrar por categoría en la lista de alimentos para encontrar lo que buscas más rápido.",
    related: ["a1", "a2"],
    keywords: ["categorías", "frutas", "verduras", "carnes", "filtrar", "tipos"],
  },
  {
    id: "a5",
    section: "alimentos",
    question: "¿Puedo editar un alimento importado?",
    answer: "Solo puedes editar los alimentos que hayas creado tú (marcados como \"Personalizado\"). Los alimentos importados desde Open Food Facts (marcados como \"Importado\") no se pueden modificar para mantener la integridad de los datos.",
    related: ["a2", "a1"],
    keywords: ["editar", "modificar", "importado", "personalizado", "cambiar"],
  },

  // ─── RECETAS ───
  {
    id: "r1",
    section: "recetas",
    question: "¿Cuál es la diferencia entre alimento y receta?",
    answer: "Un alimento es un ingrediente individual (ej: pechuga de pollo, arroz, tomate). Una receta es una combinación de varios alimentos con cantidades específicas (ej: ensalada César con pollo, lechuga, queso y salsa).\n\nLos macros de la receta se calculan automáticamente sumando los de todos sus ingredientes.",
    related: ["r2", "a1"],
    keywords: ["diferencia", "alimento", "receta", "ingrediente"],
  },
  {
    id: "r2",
    section: "recetas",
    question: "¿Cómo creo una receta?",
    answer: "Ve a Recetas > \"Nueva receta\":\n\n1. Pon nombre a la receta\n2. Añade una descripción e instrucciones (opcionales)\n3. Indica el número de porciones\n4. Añade ingredientes: busca alimentos, selecciónalos e indica la cantidad\n5. Los macros por porción se calculan automáticamente\n\nLa receta quedará disponible para usar en cualquier plan alimenticio.",
    related: ["r1", "r3"],
    keywords: ["crear receta", "nueva receta", "ingredientes", "porciones"],
  },
  {
    id: "r3",
    section: "recetas",
    question: "¿Los macros de la receta se calculan solos?",
    answer: "Sí. Los macros totales se calculan sumando los de cada ingrediente según su cantidad, y luego se dividen entre el número de porciones. Así obtienes los macros por porción automáticamente. Si cambias un ingrediente, los macros se actualizan al instante.",
    related: ["r2", "r1"],
    keywords: ["macros", "calcular", "automático", "porciones", "nutricional"],
  },
  {
    id: "r4",
    section: "recetas",
    question: "¿Puedo usar recetas dentro de un plan?",
    answer: "Sí. Cuando añades alimentos a una comida en el editor de planes, el buscador muestra tanto alimentos individuales como recetas. Selecciona la receta y los macros se incorporarán automáticamente al plan.",
    related: ["r2", "d3"],
    keywords: ["receta en plan", "usar receta", "plan", "comida"],
  },

  // ─── AGENDA ───
  {
    id: "ag1",
    section: "agenda",
    question: "¿Cómo creo una cita?",
    answer: "Ve a Agenda > \"Nueva cita\":\n\n1. Selecciona el paciente\n2. Elige fecha y hora\n3. Selecciona la duración (15, 30, 45, 60 o 90 minutos)\n4. Añade un motivo (opcional)\n5. Añade notas (opcional)\n\nLa cita aparecerá en el calendario y en el Dashboard si es para hoy.",
    related: ["ag2", "ag3"],
    keywords: ["crear cita", "nueva cita", "programar", "agendar", "reservar"],
  },
  {
    id: "ag2",
    section: "agenda",
    question: "¿Qué significan los colores de las citas?",
    answer: "Cada color indica el estado de la cita:\n\n• Azul — Confirmada\n• Ámbar/Amarillo — Pendiente\n• Verde — Completada\n• Gris — Cancelada\n\nPuedes cambiar el estado de una cita desde su detalle.",
    related: ["ag1", "ag3"],
    keywords: ["colores", "estado", "confirmada", "pendiente", "completada", "cancelada"],
  },
  {
    id: "ag3",
    section: "agenda",
    question: "¿Puedo ver la agenda por mes?",
    answer: "Sí. En la parte superior de la Agenda hay dos botones: \"Semana\" y \"Mes\". Pulsa \"Mes\" para ver el calendario mensual completo. Puedes navegar entre semanas/meses con las flechas o pulsar \"Hoy\" para volver al día actual.",
    related: ["ag1", "ag2"],
    keywords: ["mes", "mensual", "semana", "calendario", "vista"],
  },
  {
    id: "ag4",
    section: "agenda",
    question: "¿El día actual se abre automáticamente?",
    answer: "Sí, en la vista semanal el día actual aparece expandido por defecto mostrando sus citas. Si pulsas otro día se expandirá ese y se cerrará el anterior.",
    related: ["ag3"],
    keywords: ["hoy", "actual", "expandir", "abrir", "automático"],
  },

  // ─── REPORTES ───
  {
    id: "rep1",
    section: "reportes",
    question: "¿Qué estadísticas puedo ver?",
    answer: "La sección de Reportes muestra:\n\n• Tasa de retención de pacientes\n• Media de consultas por paciente\n• Planes generados con IA\n• Pacientes con portal activo\n• Distribución de pacientes por objetivo\n• Actividad mensual (consultas por mes, últimos 12 meses)\n• Lista de pacientes con resumen para exportar informes individuales",
    related: ["rep2", "rep3"],
    keywords: ["estadísticas", "reportes", "métricas", "informes", "datos"],
  },
  {
    id: "rep2",
    section: "reportes",
    question: "¿Puedo exportar informes en PDF?",
    answer: "Sí. Ve a Reportes > selecciona un paciente > \"Ver informes\". Podrás generar PDFs con:\n\n• Ficha del paciente (datos personales y médicos)\n• Evolución de peso (gráficas y tabla)\n• Historial de consultas\n• Plan dietético actual\n\nLos PDFs son profesionales y puedes compartirlos con el paciente o con otros profesionales.",
    related: ["rep1"],
    keywords: ["pdf", "exportar", "imprimir", "informe", "descargar"],
  },
  {
    id: "rep3",
    section: "reportes",
    question: "¿Qué incluye el PDF de un paciente?",
    answer: "El informe PDF completo incluye:\n\n• Datos demográficos del paciente\n• Historial médico (alergias, intolerancias, patologías)\n• Tabla de medidas antropométricas a lo largo del tiempo\n• Gráfica de evolución de peso\n• Resumen de consultas\n• El plan alimenticio actual detallado por día y comida",
    related: ["rep2"],
    keywords: ["contenido pdf", "incluye", "informe", "datos"],
  },

  // ─── NOTIFICACIONES ───
  {
    id: "not1",
    section: "notificaciones",
    question: "¿Qué notificaciones recibo?",
    answer: "NutriApp genera notificaciones automáticas para:\n\n• Citas programadas para hoy\n• Pacientes sin consulta en más de 30 días\n• Pacientes sin medidas en más de 30 días\n• Nuevas entradas en el diario de un paciente\n\nCada notificación incluye un enlace directo al recurso relacionado.",
    related: ["not2", "dash2"],
    keywords: ["notificaciones", "alertas", "avisos", "tipos"],
  },
  {
    id: "not2",
    section: "notificaciones",
    question: "¿Cómo marco las notificaciones como leídas?",
    answer: "Tienes dos opciones:\n\n• Pulsar \"Marcar todas como leídas\" (botón arriba a la derecha)\n• Hacer clic en una notificación individual para navegar al recurso\n\nEl contador del icono de campana se actualiza automáticamente.",
    related: ["not1"],
    keywords: ["marcar leída", "leer", "campana", "contador", "descartar"],
  },

  // ─── AJUSTES ───
  {
    id: "aj1",
    section: "ajustes",
    question: "¿Cómo cambio mi foto de perfil?",
    answer: "Ve a Ajustes y haz clic en tu avatar (el círculo con tus iniciales o tu foto actual). Se abrirá el selector de archivos. Elige una imagen JPG o PNG de máximo 2MB. La foto se actualiza al instante y será visible para tus pacientes en los enlaces compartidos.",
    related: ["aj2"],
    keywords: ["foto", "avatar", "perfil", "imagen", "cambiar"],
  },
  {
    id: "aj2",
    section: "ajustes",
    question: "¿Qué datos de perfil puedo editar?",
    answer: "En Ajustes puedes editar:\n\n• Nombre y apellidos\n• Teléfono\n• Especialidad\n• Número de colegiado\n• Nombre de clínica/consulta\n\nEl email no se puede cambiar ya que está vinculado a tu cuenta de acceso.",
    related: ["aj1", "aj3"],
    keywords: ["editar perfil", "datos", "nombre", "especialidad", "colegiado"],
  },
  {
    id: "aj3",
    section: "ajustes",
    question: "¿Cómo elimino mi cuenta?",
    answer: "En Ajustes, al final de la columna derecha verás la sección \"Zona peligrosa\". Pulsa \"Eliminar cuenta\" y confirma.\n\n⚠️ Esta acción es irreversible. Se borrarán permanentemente TODOS tus datos: pacientes, dietas, recetas, consultas, medidas y configuración.",
    related: ["aj2"],
    keywords: ["eliminar", "borrar", "cuenta", "cancelar", "peligro"],
  },
  {
    id: "aj4",
    section: "ajustes",
    question: "¿Qué planes de suscripción hay?",
    answer: "NutriApp ofrece dos planes:\n\n• Básico (9.99€/mes): hasta 25 pacientes, planes y recetas ilimitados, portal del paciente\n\n• Profesional (11.99€/mes): pacientes ilimitados, todo lo del Básico más generación con IA, informes PDF y soporte prioritario\n\nAmbos planes incluyen 14 días de prueba gratuita.",
    related: ["aj2"],
    keywords: ["suscripción", "plan", "precio", "básico", "profesional", "pagar"],
  },
];

// ─── Mapeo ruta → sección ───

export function getSection(pathname: string): string {
  if (pathname === "/dashboard") return "dashboard";
  if (pathname === "/pacientes" || pathname === "/pacientes/nuevo") return "pacientes";
  if (/^\/pacientes\/[^/]+\/consultas/.test(pathname)) return "paciente-consultas";
  if (/^\/pacientes\/[^/]+\/medidas/.test(pathname)) return "paciente-medidas";
  if (/^\/pacientes\/[^/]+\/portal/.test(pathname)) return "paciente-detalle";
  if (/^\/pacientes\/[^/]+\/diario/.test(pathname)) return "paciente-detalle";
  if (/^\/pacientes\/[^/]+/.test(pathname)) return "paciente-detalle";
  if (pathname === "/dietas" || pathname === "/dietas/nuevo") return "dietas";
  if (/\/generar-ia/.test(pathname)) return "dieta-ia";
  if (/\/compartir/.test(pathname)) return "dieta-compartir";
  if (/^\/dietas\/[^/]+/.test(pathname)) return "dieta-editor";
  if (pathname === "/alimentos/importar") return "alimentos";
  if (pathname.startsWith("/alimentos")) return "alimentos";
  if (pathname.startsWith("/recetas")) return "recetas";
  if (pathname.startsWith("/agenda")) return "agenda";
  if (pathname.startsWith("/reportes")) return "reportes";
  if (pathname.startsWith("/notificaciones")) return "notificaciones";
  if (pathname.startsWith("/ajustes")) return "ajustes";
  return "general";
}

export function getEntriesForSection(section: string): HelpEntry[] {
  const sectionEntries = HELP_ENTRIES.filter((e) => e.section === section);
  const generalEntries = HELP_ENTRIES.filter((e) => e.section === "general");
  // Sección actual primero, luego general (sin duplicados)
  const ids = new Set(sectionEntries.map((e) => e.id));
  return [...sectionEntries, ...generalEntries.filter((e) => !ids.has(e.id))];
}

export function getEntryById(id: string): HelpEntry | undefined {
  return HELP_ENTRIES.find((e) => e.id === id);
}

export function getRelatedEntries(entry: HelpEntry): HelpEntry[] {
  return entry.related
    .map((id) => HELP_ENTRIES.find((e) => e.id === id))
    .filter(Boolean) as HelpEntry[];
}

// ─── Búsqueda ───

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function searchHelp(query: string): HelpEntry[] {
  const q = normalize(query.trim());
  if (!q || q.length < 2) return [];

  const words = q.split(/\s+/);

  return HELP_ENTRIES.map((entry) => {
    const questionNorm = normalize(entry.question);
    const answerNorm = normalize(entry.answer);
    const keywordsNorm = entry.keywords.map(normalize);

    let score = 0;
    for (const word of words) {
      if (questionNorm.includes(word)) score += 10;
      if (keywordsNorm.some((k) => k.includes(word))) score += 5;
      if (answerNorm.includes(word)) score += 1;
    }

    return { entry, score };
  })
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((r) => r.entry);
}
