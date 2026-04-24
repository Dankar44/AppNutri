export interface TourStep {
  id: string;
  title: string;
  description: string;
  target?: string;       // data-tour attribute selector
  route?: string;        // navigate to this route before showing
  position?: "top" | "bottom" | "left" | "right";
}

export interface Tour {
  id: string;
  name: string;
  description: string;
  icon: string;
  audience: "dietista" | "paciente";
  steps: TourStep[];
}

// ─── TOURS DIETISTA ───

const DIETISTA_TOURS: Tour[] = [
  {
    id: "dietista-dashboard",
    name: "Bienvenida al Dashboard",
    description: "Conoce tu panel principal y las métricas de tu consulta",
    icon: "LayoutDashboard",
    audience: "dietista",
    steps: [
      { id: "d1-1", title: "Tu menú de navegación", description: "Desde el sidebar accedes a todas las secciones de Annonia: pacientes, dietas, alimentos, agenda y más.", target: "sidebar", route: "/dashboard", position: "right" },
      { id: "d1-2", title: "Métricas rápidas", description: "Estas tarjetas te muestran un resumen: pacientes totales, consultas del mes, planes activos y citas de la semana.", target: "stats-cards", position: "bottom" },
      { id: "d1-3", title: "Gráfico de actividad", description: "Visualiza tu actividad de los últimos 6 meses: consultas realizadas y pacientes nuevos.", target: "activity-chart", position: "top" },
      { id: "d1-4", title: "Pacientes que necesitan atención", description: "Alertas automáticas de pacientes sin consulta reciente, sin medidas o con planes antiguos.", target: "patients-attention", position: "top" },
      { id: "d1-5", title: "Citas de hoy", description: "Tus citas programadas para hoy aparecen aquí con hora, paciente y motivo.", target: "today-appointments", position: "top" },
    ],
  },
  {
    id: "dietista-pacientes",
    name: "Gestionar Pacientes",
    description: "Aprende a crear y gestionar la ficha de tus pacientes",
    icon: "Users",
    audience: "dietista",
    steps: [
      { id: "d2-1", title: "Lista de pacientes", description: "Aquí están todos tus pacientes. Puedes ver sus datos, estado y objetivo nutricional.", route: "/pacientes", target: "new-patient-btn", position: "bottom" },
      { id: "d2-2", title: "Crear nuevo paciente", description: "Pulsa este botón para registrar un nuevo paciente con todos sus datos: personales, médicos, alergias, suplementos, actividad física y más.", target: "new-patient-btn", position: "bottom" },
      { id: "d2-3", title: "Buscar y filtrar", description: "Usa el buscador para encontrar pacientes por nombre. Filtra entre activos e inactivos.", target: "patient-search", position: "bottom" },
    ],
  },
  {
    id: "dietista-ficha-paciente",
    name: "Ficha del Paciente",
    description: "Descubre todo lo que puedes ver y hacer dentro de la ficha de un paciente",
    icon: "User",
    audience: "dietista",
    steps: [
      { id: "d2b-1", title: "Paciente de demostración", description: "Te mostramos una ficha de ejemplo con datos ficticios para que veas todas las secciones disponibles.", route: "/tour-demo" },
      { id: "d2b-2", title: "Datos personales", description: "Aquí verás email, teléfono, fecha de nacimiento y sexo del paciente. Se rellena al crear el paciente.", target: "patient-personal-data", position: "bottom" },
      { id: "d2b-3", title: "Historial médico", description: "Alergias, intolerancias, patologías, medicamentos y suplementos. Todo con etiquetas de colores para verlo de un vistazo.", target: "patient-medical", position: "bottom" },
      { id: "d2b-4", title: "Actividad y estilo de vida", description: "Ocupación, nivel de actividad, tipo de ejercicio, horarios de trabajo, ejercicio y descanso. Información clave para personalizar la dieta.", target: "patient-lifestyle", position: "bottom" },
      { id: "d2b-5", title: "Horario semanal", description: "Calendario compartido entre dietista y paciente. Ambos podéis añadir actividades (trabajo, ejercicio, comidas, descanso) y se sincroniza automáticamente.", target: "patient-schedule", position: "bottom" },
      { id: "d2b-6", title: "Medidas y registro rápido", description: "Peso, altura e IMC actuales. El botón 'Registro rápido' te permite apuntar nuevas medidas directamente durante la consulta.", target: "patient-measures", position: "left" },
      { id: "d2b-7", title: "Recomendaciones", description: "Escribe recomendaciones personalizadas. El paciente las verá desde su portal. Se guardan automáticamente cada 5 segundos.", target: "patient-recommendations", position: "left" },
      { id: "d2b-8", title: "Planes alimenticios", description: "Los planes dietéticos del paciente. Máximo 3 visibles, con enlace a 'Ver todos'. Desde aquí creas nuevos planes o accedes a los existentes.", target: "patient-plans", position: "top" },
    ],
  },
  {
    id: "dietista-planes-lista",
    name: "Planes Alimenticios",
    description: "Aprende a navegar y gestionar tus planes dietéticos",
    icon: "UtensilsCrossed",
    audience: "dietista",
    steps: [
      { id: "dpl-1", title: "Tu lista de planes", description: "Aquí ves todos tus planes organizados por paciente. Cada tarjeta muestra el avatar, nombre del paciente y cuántos planes tiene.", route: "/tour-demo-planes", target: "planes-lista", position: "top" },
      { id: "dpl-2", title: "Buscar planes", description: "Usa el buscador para encontrar planes por nombre de dieta o nombre de paciente.", target: "planes-buscador", position: "bottom" },
      { id: "dpl-3", title: "Cada plan", description: "Cada plan muestra su nombre, fecha de creación y calorías objetivo. Haz clic para abrir el editor completo.", target: "plan-card", position: "bottom" },
      { id: "dpl-4", title: "Plantillas", description: "Las plantillas son planes guardados como modelo. Puedes crear un plan nuevo a partir de una plantilla para ahorrar tiempo.", target: "plantillas-btn", position: "bottom" },
      { id: "dpl-5", title: "Nuevo plan", description: "Pulsa aquí para crear un plan nuevo: selecciona paciente, pon nombre y opcionalmente configura macros objetivo.", target: "nuevo-plan-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-dietas",
    name: "Editor de Plan Dietético",
    description: "Crea planes alimenticios semanales con IA o manualmente",
    icon: "UtensilsCrossed",
    audience: "dietista",
    steps: [
      { id: "d3-1", title: "Plan de demostración", description: "Te mostramos un plan de ejemplo con datos ficticios para que veas cómo funciona el editor de dietas.", route: "/tour-demo-dieta" },
      { id: "d3-2", title: "Barra de acciones", description: "Desde aquí puedes generar con IA, guardar como plantilla, compartir, editar, exportar PDF o eliminar el plan.", target: "plan-actions", position: "bottom" },
      { id: "d3-3", title: "Macros objetivo", description: "Los objetivos diarios del plan: calorías, proteínas, carbohidratos y grasas. Se configuran al crear o editar el plan.", target: "plan-macros", position: "bottom" },
      { id: "d3-4", title: "Editor semanal", description: "Cada día tiene 6 comidas con hora, descripción del plato y alimentos con cantidades. Se muestran 3 días a la vez y puedes deslizar horizontalmente.", target: "plan-editor", position: "top" },
      { id: "d3-5", title: "Generación con IA", description: "El botón 'IA' genera un menú semanal completo. Configura fase nutricional (déficit, volumen, definición...), tipo de dieta y preferencias.", target: "ia-btn", position: "bottom" },
      { id: "d3-6", title: "Exportar PDF", description: "Genera un PDF profesional con portada, resumen semanal, detalle por día con ingredientes, recomendaciones y lista de la compra.", target: "pdf-btn", position: "bottom" },
      { id: "d3-7", title: "Compartir", description: "Genera un enlace único para que tu paciente vea su plan sin necesidad de cuenta. Perfecto para enviar por WhatsApp o email.", target: "share-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-ia",
    name: "Generar Dieta con IA",
    description: "Aprende a usar la inteligencia artificial para crear planes automáticos",
    icon: "Sparkles",
    audience: "dietista",
    steps: [
      { id: "dia-1", title: "Panel de generación IA", description: "Aquí configuras todos los parámetros antes de que la IA genere un plan semanal completo. Vamos a ver cada sección.", route: "/tour-demo-ia", target: "ia-config", position: "right" },
      { id: "dia-2", title: "Fase nutricional", description: "Selecciona la fase del paciente: déficit (perder grasa), mantenimiento, volumen (ganar masa), definición o reverse diet. Los macros se ajustan automáticamente.", target: "ia-fase", position: "bottom" },
      { id: "dia-3", title: "Tipo de dieta", description: "Elige el estilo: mediterránea, baja en carbohidratos, alta en proteínas, vegetariana, vegana, cetogénica o sin gluten.", target: "ia-tipo-dieta", position: "bottom" },
      { id: "dia-4", title: "Macros diarios", description: "Los objetivos de calorías, proteínas, carbohidratos y grasas. Se ajustan automáticamente al seleccionar una fase, pero puedes modificarlos manualmente.", target: "ia-macros", position: "bottom" },
      { id: "dia-5", title: "Preferencias rápidas", description: "Marca checkboxes para indicar si quieres recetas fáciles, aptas para batch cooking, económicas o muy variadas.", target: "ia-preferencias", position: "bottom" },
      { id: "dia-6", title: "Datos del paciente", description: "La IA usa los datos del paciente automáticamente: alergias, intolerancias, preferencias y objetivo. Por eso es importante tener la ficha completa.", target: "ia-paciente-info", position: "left" },
      { id: "dia-7", title: "Instrucciones adicionales", description: "Escribe instrucciones libres: 'rico en pescado', 'evitar lácteos en la cena', 'desayuno siempre con avena'... La IA las seguirá con prioridad máxima.", target: "ia-instrucciones", position: "left" },
      { id: "dia-8", title: "Generar", description: "Pulsa este botón y la IA generará un plan semanal completo en 10-20 segundos. Podrás revisar el resultado y aceptarlo o descartarlo.", target: "ia-generar-btn", position: "top" },
    ],
  },
  {
    id: "dietista-alimentos",
    name: "Base de Alimentos",
    description: "Gestiona tu base de datos nutricional con filtros avanzados",
    icon: "Apple",
    audience: "dietista",
    steps: [
      { id: "d4-1", title: "Tu base de datos", description: "Más de 2600 alimentos con información nutricional detallada. Filtra por categoría, macros y origen.", route: "/alimentos", target: "food-list", position: "bottom" },
      { id: "d4-2", title: "Filtros avanzados", description: "Busca alimentos por rango de calorías, proteínas, carbohidratos y grasas. Ideal para encontrar el ingrediente perfecto.", target: "food-filters", position: "bottom" },
      { id: "d4-3", title: "Importar alimentos", description: "Importa desde Open Food Facts: busca cualquier producto y añádelo a tu base de datos con un clic.", target: "import-btn", position: "bottom" },
    ],
  },
  {
    id: "dietista-agenda",
    name: "Agenda y Citas",
    description: "Gestiona tu calendario de consultas con todas sus funcionalidades",
    icon: "CalendarDays",
    audience: "dietista",
    steps: [
      { id: "d5-1", title: "Tu agenda", description: "Aquí gestionas todas tus citas. Vamos a ver cada parte del calendario.", route: "/tour-demo-agenda" },
      { id: "d5-2", title: "Nueva cita", description: "Pulsa aquí para programar una nueva cita: selecciona paciente, fecha, hora, duración (15-90 min) y motivo.", target: "agenda-nueva-cita", position: "bottom" },
      { id: "d5-3", title: "Controles de navegación", description: "Navega entre semanas o meses con las flechas. El botón 'Hoy' te lleva al día actual. También ves el rango de fechas.", target: "agenda-controles", position: "bottom" },
      { id: "d5-4", title: "Vista Semana / Mes", description: "Alterna entre vista semanal (detallada, ve cada cita) y mensual (calendario con puntos). La vista semanal es la más usada.", target: "agenda-vistas", position: "bottom" },
      { id: "d5-5", title: "Vista semanal", description: "Cada columna es un día. El día actual se resalta en verde. Las citas muestran hora, paciente, duración y motivo con colores según su estado.", target: "agenda-semana", position: "top" },
      { id: "d5-6", title: "Detalle del día", description: "Al hacer clic en un día se abre el detalle con todas las citas expandidas. El día actual se abre automáticamente al entrar a la agenda.", target: "agenda-detalle-dia", position: "top" },
      { id: "d5-7", title: "Estado de la cita", description: "Cada cita tiene un estado con color: Azul = Confirmada, Ámbar = Pendiente, Verde = Completada, Gris = Cancelada.", target: "agenda-estado-cita", position: "left" },
      { id: "d5-8", title: "Acciones de la cita", description: "Desde aquí puedes: marcar como completada, exportar a Google Calendar para sincronizarla, o eliminar la cita.", target: "agenda-acciones-cita", position: "top" },
    ],
  },
  {
    id: "dietista-reportes",
    name: "Reportes y PDF",
    description: "Estadísticas de tu consulta y exportación de informes",
    icon: "FileBarChart",
    audience: "dietista",
    steps: [
      { id: "d6-1", title: "Estadísticas", description: "Métricas de tu consulta: tasa de retención, media de consultas por paciente, planes creados y pacientes con portal.", route: "/reportes", target: "reports-kpis", position: "bottom" },
      { id: "d6-2", title: "Informes por paciente", description: "Selecciona un paciente para generar informes PDF con su ficha, evolución, consultas y plan dietético.", target: "patient-reports", position: "top" },
    ],
  },
];

// ─── TOURS PACIENTE ───

const PACIENTE_TOURS: Tour[] = [
  {
    id: "paciente-dashboard",
    name: "Bienvenida al Portal",
    description: "Conoce tu portal de nutrición personalizado",
    icon: "LayoutDashboard",
    audience: "paciente",
    steps: [
      { id: "p1-1", title: "Tu menú", description: "Desde el sidebar accedes a todas las secciones: dieta, diario, evolución, recomendaciones y más.", target: "sidebar", route: "/paciente/portal", position: "right" },
      { id: "p1-2", title: "Tu nutricionista", description: "Aquí ves los datos de tu nutricionista asignado.", target: "dietista-info", position: "bottom" },
      { id: "p1-3", title: "Accesos rápidos", description: "Tarjetas de acceso directo a tu dieta, diario alimentario, evolución y lista de la compra.", target: "quick-access", position: "top" },
    ],
  },
  {
    id: "paciente-dieta",
    name: "Tu Dieta",
    description: "Aprende a consultar tu plan alimenticio semanal",
    icon: "UtensilsCrossed",
    audience: "paciente",
    steps: [
      { id: "p2-1", title: "Tu plan semanal", description: "Aquí ves tu dieta completa: 7 días con todas las comidas, ingredientes y cantidades.", route: "/paciente/portal/dieta", target: "diet-plan", position: "bottom" },
      { id: "p2-2", title: "Lista de la compra", description: "Genera automáticamente tu lista de la compra a partir de los ingredientes de tu plan semanal.", target: "shopping-list-link", position: "bottom" },
    ],
  },
  {
    id: "paciente-evolucion",
    name: "Tu Evolución",
    description: "Visualiza tu progreso con gráficas",
    icon: "TrendingUp",
    audience: "paciente",
    steps: [
      { id: "p4-1", title: "Gráficas de progreso", description: "Aquí ves tu evolución: peso, IMC, porcentaje de grasa y perímetros a lo largo del tiempo.", route: "/paciente/portal/evolucion", target: "evolution-charts", position: "bottom" },
    ],
  },
];

// ─── Funciones de acceso ───

export function getToursByAudience(audience: "dietista" | "paciente"): Tour[] {
  return audience === "dietista" ? DIETISTA_TOURS : PACIENTE_TOURS;
}

export function getTourById(id: string): Tour | undefined {
  return [...DIETISTA_TOURS, ...PACIENTE_TOURS].find((t) => t.id === id);
}
