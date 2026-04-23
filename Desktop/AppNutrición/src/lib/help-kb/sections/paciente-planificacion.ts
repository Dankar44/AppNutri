import type { HelpEntry } from "../types";

export const PACIENTE_PLANIFICACION_ENTRIES: HelpEntry[] = [
  {
    id: "plan-1",
    section: "paciente-planificacion",
    question: "¿Qué es la pestaña Planificación del paciente?",
    answer:
      "La pestaña Planificación es un tracker temporal amplio que agrupa metas, fases e hitos del paciente a lo largo de semanas o meses. No se ocupa del plan de comidas diario, sino del recorrido global: dónde empieza el paciente, qué objetivos persigue, qué fases va atravesando y cuándo espera terminar. Es la vista estratégica de su proceso, frente al detalle día a día que ves en Plan de alimentación.",
    related: ["plan-2", "plan-3", "plan-19"],
    keywords: ["planificación", "tracker", "fases", "objetivos", "proceso"],
  },
  {
    id: "plan-2",
    section: "paciente-planificacion",
    question: "¿En qué se diferencia la Planificación del Plan de alimentación?",
    answer:
      "El Plan de alimentación define qué come el paciente cada día (comidas, cantidades, recetas). La Planificación, en cambio, es un marco temporal más amplio que define el camino: fase de definición, volumen, mantenimiento, hitos por semanas o meses, cambios previstos. Puedes tener una sola planificación de seis meses con varios planes de alimentación dentro, cada uno ajustado a una fase concreta.",
    related: ["plan-1", "plan-19", "plan-17"],
    keywords: [
      "diferencia",
      "plan alimentación",
      "plan comidas",
      "estratégico",
      "fases",
    ],
  },
  {
    id: "plan-3",
    section: "paciente-planificacion",
    question: "¿Qué es la planificación por defecto?",
    answer:
      "La planificación por defecto es la que se crea automáticamente la primera vez que entras en la pestaña Planificación de un paciente. Aparece con el flag esDefecto en true y sirve como punto de partida para que no tengas que crear nada a mano para empezar a trabajar. Puedes renombrarla, editar sus datos o sustituirla por otra cuando te convenga.",
    related: ["plan-4", "plan-10", "plan-11"],
    keywords: [
      "por defecto",
      "automática",
      "esDefecto",
      "inicial",
      "primera vez",
    ],
  },
  {
    id: "plan-4",
    section: "paciente-planificacion",
    question: "¿Por qué aparece ya una planificación la primera vez que entro?",
    answer:
      "Porque la aplicación crea una planificación por defecto en cuanto abres la pestaña la primera vez. Es un comportamiento intencionado para evitar que el apartado quede vacío y para que puedas empezar a registrar metas y fases desde el minuto cero. Si no encaja con tu forma de trabajar, puedes editarla, cerrarla o marcar otra como la principal más adelante.",
    related: ["plan-3", "plan-11"],
    keywords: ["automática", "crear sola", "primera vez", "vacío", "inicial"],
  },
  {
    id: "plan-5",
    section: "paciente-planificacion",
    question: "¿Cómo creo una nueva planificación?",
    answer:
      "Dentro de la pestaña Planificación, pulsa Nueva planificación. Aparece un formulario con el nombre, la fecha de inicio, la fecha de fin prevista y un bloque de datos libres. Rellena lo que necesites y guarda: la nueva planificación queda registrada junto a las anteriores y puedes cambiar su estado o marcarla como predeterminada cuando quieras.",
    related: ["plan-6", "plan-11", "plan-14"],
    keywords: ["crear", "nueva", "planificación", "formulario", "añadir"],
  },
  {
    id: "plan-6",
    section: "paciente-planificacion",
    question: "¿Puedo tener varias planificaciones para un mismo paciente?",
    answer:
      "Sí. Un paciente puede tener tantas planificaciones como hagan falta: una activa, varias cerradas que reflejan etapas pasadas, alguna pausada a la espera de retomarse. Esto te permite trazar el historial del proceso sin perder ninguna fase y mantener siempre visible cuál es la planificación vigente en cada momento.",
    related: ["plan-5", "plan-11", "plan-7"],
    keywords: [
      "varias",
      "múltiples",
      "historial",
      "planificaciones",
      "mismo paciente",
    ],
  },
  {
    id: "plan-7",
    section: "paciente-planificacion",
    question: "¿Qué estados puede tener una planificación?",
    answer:
      "Una planificación puede estar en uno de tres estados: ACTIVA cuando el paciente la está siguiendo en este momento, PAUSADA cuando se ha dejado en espera temporalmente (por lesión, viaje, cambio de rutina) y CERRADA cuando ya ha terminado, sea porque se cumplió el objetivo o porque se abandonó. El estado marca cómo se ve en filtros y en el resumen de la ficha.",
    related: ["plan-8", "plan-9", "plan-15"],
    keywords: ["estado", "activa", "pausada", "cerrada", "status"],
  },
  {
    id: "plan-8",
    section: "paciente-planificacion",
    question: "¿Cómo cambio el estado de una planificación?",
    answer:
      "Abre la planificación y usa el selector de estado para elegir ACTIVA, PAUSADA o CERRADA. El cambio se guarda al momento y se registra la fecha de última modificación. Pasar a PAUSADA no borra nada, solo deja la planificación en espera. Pasar a CERRADA la archiva como proceso finalizado sin perder sus datos.",
    related: ["plan-7", "plan-9", "plan-15"],
    keywords: ["cambiar estado", "activar", "pausar", "cerrar", "selector"],
  },
  {
    id: "plan-9",
    section: "paciente-planificacion",
    question: "¿Puedo tener más de una planificación ACTIVA a la vez?",
    answer:
      "Puedes marcar varias como ACTIVA si tu flujo lo requiere, pero la recomendación es mantener una sola planificación activa por paciente. Así queda claro cuál es el recorrido vigente y el resto del equipo no se confunde al mirar la ficha. Si inicias una nueva, lo natural es cerrar la anterior y dejar únicamente la nueva en estado ACTIVA.",
    related: ["plan-7", "plan-8", "plan-15"],
    keywords: ["varias activas", "a la vez", "simultánea", "única", "activa"],
  },
  {
    id: "plan-10",
    section: "paciente-planificacion",
    question: "¿Qué significa el flag esDefecto?",
    answer:
      "El flag esDefecto identifica la planificación que se considera principal en la ficha del paciente. La planificación por defecto es la que se abre automáticamente en el resumen y la que se usa como referencia para ciertas vistas agregadas. Solo una planificación puede tener esDefecto en true por paciente.",
    related: ["plan-3", "plan-11", "plan-12"],
    keywords: [
      "esDefecto",
      "por defecto",
      "flag",
      "principal",
      "predeterminada",
    ],
  },
  {
    id: "plan-11",
    section: "paciente-planificacion",
    question: "¿Cómo marco una planificación como por defecto?",
    answer:
      "En la lista de planificaciones del paciente, pulsa la opción Marcar como por defecto en la planificación que quieras destacar. El flag esDefecto pasa automáticamente a esa planificación y se retira de la anterior, de modo que solo una queda como principal en cada momento.",
    related: ["plan-10", "plan-3", "plan-12"],
    keywords: [
      "marcar",
      "por defecto",
      "predeterminada",
      "principal",
      "cambiar",
    ],
  },
  {
    id: "plan-12",
    section: "paciente-planificacion",
    question: "¿Qué pasa si cambio la planificación por defecto a otra?",
    answer:
      "La anterior deja de ser la predeterminada pero no se borra ni se cierra: sigue existiendo con sus datos intactos. Solo cambia cuál aparece como principal en el resumen y como referencia del paciente. Puedes volver a marcar la antigua como por defecto en cualquier momento.",
    related: ["plan-11", "plan-10"],
    keywords: [
      "cambiar defecto",
      "reemplazar",
      "antigua",
      "conservar",
      "historial",
    ],
  },
  {
    id: "plan-13",
    section: "paciente-planificacion",
    question: "¿Qué significan las fechas de inicio y de fin prevista?",
    answer:
      "La fecha de inicio marca cuándo arranca el proceso al que corresponde la planificación. La fecha de fin prevista es el horizonte que te propones alcanzar: puede coincidir con el final de una temporada, un viaje, una competición o simplemente un tope teórico de seis meses. Son referencias para ti; no obligan a cerrar la planificación en esa fecha.",
    related: ["plan-14", "plan-20"],
    keywords: ["fecha inicio", "fecha fin", "prevista", "horizonte", "duración"],
  },
  {
    id: "plan-14",
    section: "paciente-planificacion",
    question: "¿Tengo que rellenar la fecha de fin prevista sí o sí?",
    answer:
      "No. La fecha de fin prevista es opcional. Si no la indicas, la planificación queda abierta sin tope y podrás cerrarla cuando consideres. Ponerla ayuda a organizar la carga de trabajo y sirve de recordatorio visual del momento en que toca revisar el proceso completo.",
    related: ["plan-13", "plan-20"],
    keywords: ["opcional", "fin prevista", "sin fecha", "indefinida", "abierta"],
  },
  {
    id: "plan-15",
    section: "paciente-planificacion",
    question: "¿Qué es la fecha de último cambio?",
    answer:
      "La fecha de último cambio (fechaUltimoCambio) es la marca de tiempo en la que se editó por última vez la planificación. Se actualiza sola cada vez que guardas modificaciones en el nombre, el estado, los datos o cualquier campo. Te sirve para saber de un vistazo cuándo se tocó por última vez y para detectar planificaciones que llevan demasiado tiempo sin revisarse.",
    related: ["plan-16", "plan-31"],
    keywords: [
      "fechaUltimoCambio",
      "última modificación",
      "actualización",
      "cuándo",
      "revisión",
    ],
  },
  {
    id: "plan-16",
    section: "paciente-planificacion",
    question: "¿La fecha de último cambio se actualiza sola al editar?",
    answer:
      "Sí. Cada guardado en la planificación actualiza la fecha de último cambio al momento, sin que tengas que tocarla a mano. Vale para cambios de nombre, de estado, de fechas o de contenido del JSON de datos. Si abres una planificación y solo miras sin guardar, la fecha no cambia.",
    related: ["plan-15", "plan-31"],
    keywords: ["automática", "guardar", "editar", "actualiza", "fecha"],
  },
  {
    id: "plan-17",
    section: "paciente-planificacion",
    question: "¿Qué se guarda dentro del campo datos?",
    answer:
      "El campo datos es un JSON flexible donde puedes definir los bloques y fases propios de esa planificación: nombres de fases, descripciones, metas parciales, pesos objetivo, hitos por semana o por mes, notas libres. No tiene un esquema cerrado: se adapta al estilo de trabajo que uses con cada paciente, por lo que puedes guardar desde una fase simple a un calendario completo de trabajo.",
    related: ["plan-18", "plan-24", "plan-25"],
    keywords: ["datos", "JSON", "bloques", "fases", "contenido"],
  },
  {
    id: "plan-18",
    section: "paciente-planificacion",
    question: "¿Cómo edito los bloques y fases de una planificación?",
    answer:
      "Abre la planificación y entra en el editor del campo datos. Desde ahí puedes añadir, renombrar o borrar bloques y fases, reordenarlos y escribir las notas que necesites. Al guardar, los cambios se persisten en el JSON y se actualiza la fecha de último cambio.",
    related: ["plan-17", "plan-24", "plan-25"],
    keywords: ["editar", "bloques", "fases", "añadir", "modificar"],
  },
  {
    id: "plan-19",
    section: "paciente-planificacion",
    question: "¿Qué relación hay entre la planificación y los planes alimenticios?",
    answer:
      "La planificación marca el marco temporal y los objetivos, y dentro de ese marco vas colgando los planes de alimentación concretos que toquen en cada momento. Por ejemplo: en una planificación de seis meses dividida en definición y mantenimiento, puedes tener dos o tres planes de alimentación distintos, uno para cada fase, siempre alineados con el guion que fija la planificación.",
    related: ["plan-1", "plan-2", "plan-22"],
    keywords: [
      "relación",
      "planes alimenticios",
      "plan alimentación",
      "coordinación",
      "fase",
    ],
  },
  {
    id: "plan-20",
    section: "paciente-planificacion",
    question: "¿Cuánto suele durar una planificación?",
    answer:
      "Depende del objetivo, pero lo habitual son ciclos de tres, seis o doce meses. Tres meses encaja con objetivos puntuales de definición o volumen, seis meses con procesos combinados (pérdida de grasa más mantenimiento) y un año con cambios profundos de hábitos o seguimientos deportivos. Nada impide hacerlas más cortas o más largas si el caso lo requiere.",
    related: ["plan-13", "plan-23", "plan-14"],
    keywords: ["duración", "3 meses", "6 meses", "1 año", "ciclo"],
  },
  {
    id: "plan-21",
    section: "paciente-planificacion",
    question: "¿Cuándo conviene cerrar una planificación?",
    answer:
      "Conviene cerrarla cuando el objetivo al que apuntaba se ha cumplido, cuando se ha alcanzado la fecha de fin prevista y toca abrir una nueva etapa, o cuando el paciente abandona el proceso. Cerrarla la archiva como histórico, deja de contar como activa y te permite arrancar una planificación nueva limpia con las metas siguientes.",
    related: ["plan-7", "plan-8", "plan-32"],
    keywords: ["cerrar", "cuándo", "objetivo cumplido", "finalizar", "archivar"],
  },
  {
    id: "plan-22",
    section: "paciente-planificacion",
    question: "¿Puedo duplicar una planificación existente?",
    answer:
      "Sí. En la lista de planificaciones, pulsa Duplicar sobre la que quieras copiar. Se crea una réplica con el mismo nombre más el sufijo copia, los mismos bloques y fases en el JSON y el estado ACTIVA por defecto. Úsalo para arrancar rápido una etapa similar o para probar variantes sin tocar la original.",
    related: ["plan-5", "plan-25", "plan-23"],
    keywords: ["duplicar", "copiar", "clon", "réplica", "plantilla"],
  },
  {
    id: "plan-23",
    section: "paciente-planificacion",
    question: "¿Cómo elimino una planificación?",
    answer:
      "Dentro de la planificación pulsa Eliminar y confirma la acción. Se borra por completo, junto con su JSON de datos, y no se puede recuperar. Si no quieres perder el histórico, plantea cerrarla en vez de eliminarla: así deja de contar como activa pero los datos siguen disponibles para consultarlos.",
    related: ["plan-21", "plan-22", "plan-33"],
    keywords: ["eliminar", "borrar", "quitar", "confirmar", "irreversible"],
  },
  {
    id: "plan-24",
    section: "paciente-planificacion",
    question: "¿Cómo visualizo las fases de una planificación?",
    answer:
      "Dentro de la planificación, las fases se listan en orden según el JSON de datos y se muestran con su nombre, fechas aproximadas y una descripción corta. Puedes desplegar cada fase para ver el detalle, las notas y los hitos asociados, y plegarla para tener una visión general del recorrido completo.",
    related: ["plan-17", "plan-18", "plan-25"],
    keywords: ["visualizar", "fases", "ver", "listado", "despliegue"],
  },
  {
    id: "plan-25",
    section: "paciente-planificacion",
    question: "¿Qué son los hitos dentro de una planificación?",
    answer:
      "Los hitos (milestones) son puntos concretos del recorrido que marcan un antes y un después: revisión a las seis semanas, fin de la fase de definición, test de fuerza, primera competición. Puedes registrar hitos dentro del JSON de datos con su fecha prevista, una descripción y una nota con el resultado cuando llegues a él.",
    related: ["plan-24", "plan-26", "plan-17"],
    keywords: ["hitos", "milestones", "puntos clave", "revisiones", "marcas"],
  },
  {
    id: "plan-26",
    section: "paciente-planificacion",
    question: "¿Cómo añado un hito a la planificación?",
    answer:
      "Desde el editor de la planificación entra en la fase correspondiente y usa Añadir hito. Escribe el nombre, la fecha prevista y la descripción. Al guardar, el hito pasa a formar parte del JSON de datos y aparece en la línea temporal de la fase. Cuando llegue la fecha, podrás marcarlo como cumplido o anotar una observación.",
    related: ["plan-25", "plan-24", "plan-30"],
    keywords: ["añadir hito", "milestone", "crear", "nuevo", "fase"],
  },
  {
    id: "plan-27",
    section: "paciente-planificacion",
    question: "¿Qué es una fase de definición?",
    answer:
      "Una fase de definición es un bloque pensado para reducir porcentaje graso manteniendo masa muscular. Suele durar de ocho a doce semanas, implica un déficit calórico controlado y un seguimiento fino de medidas y peso. Dentro de la planificación, suele ir precedida de una fase de adaptación y seguida de una etapa de mantenimiento o recarga.",
    related: ["plan-28", "plan-29", "plan-17"],
    keywords: ["definición", "fase", "déficit", "grasa", "ejemplo"],
  },
  {
    id: "plan-28",
    section: "paciente-planificacion",
    question: "¿Qué es una fase de volumen?",
    answer:
      "La fase de volumen busca ganar masa muscular con un superávit calórico controlado. Suele durar varios meses y se centra en entrenamiento de fuerza, ingesta proteica elevada y un aumento progresivo de peso. En la planificación se refleja como un bloque con sus propias metas (kilos objetivo, fuerza, perímetros) y sus hitos de revisión.",
    related: ["plan-27", "plan-29", "plan-17"],
    keywords: ["volumen", "fase", "superávit", "masa muscular", "ejemplo"],
  },
  {
    id: "plan-29",
    section: "paciente-planificacion",
    question: "¿Qué es una fase de mantenimiento?",
    answer:
      "La fase de mantenimiento sirve para consolidar los cambios logrados en fases anteriores sin buscar ya ni pérdida ni ganancia grande. Es clave para asentar hábitos y estabilizar peso. Suele ser más larga que las fases de definición o volumen y exige menos ajustes, aunque conviene seguir registrando mediciones para detectar desviaciones.",
    related: ["plan-27", "plan-28", "plan-17"],
    keywords: ["mantenimiento", "fase", "estabilizar", "hábitos", "ejemplo"],
  },
  {
    id: "plan-30",
    section: "paciente-planificacion",
    question: "¿La planificación ofrece un seguimiento visual del progreso?",
    answer:
      "Sí. La vista de planificación muestra una línea temporal con fases, hitos y fechas, y marca dónde se sitúa el paciente en este momento respecto al inicio y a la fecha de fin prevista. Combinado con los datos de mediciones y seguimiento diario, puedes ver de un vistazo si el ritmo encaja con lo planteado o si toca reajustar.",
    related: ["plan-24", "plan-25", "plan-19"],
    keywords: ["progreso", "visual", "línea temporal", "timeline", "avance"],
  },
  {
    id: "plan-31",
    section: "paciente-planificacion",
    question: "¿Qué es la notificación PLAN_ANTIGUO?",
    answer:
      "PLAN_ANTIGUO es el tipo de aviso que salta cuando los planes de un paciente no se actualizan en más de treinta días. Es una forma de recordarte que el paciente lleva demasiado tiempo sin revisión y que quizá toca ajustar la planificación, cambiar el plan de alimentación o al menos comprobar cómo va su proceso.",
    related: ["plan-32", "plan-15", "plan-16"],
    keywords: [
      "PLAN_ANTIGUO",
      "notificación",
      "aviso",
      "30 días",
      "desactualizado",
    ],
  },
  {
    id: "plan-32",
    section: "paciente-planificacion",
    question: "¿Cómo desaparece el aviso PLAN_ANTIGUO?",
    answer:
      "El aviso PLAN_ANTIGUO desaparece al actualizar la planificación o el plan de alimentación del paciente. Puede bastar con editar el nombre, guardar cambios en las fases, tocar el estado o crear una planificación nueva: cualquier movimiento que actualice la fecha de último cambio reinicia el contador de los treinta días.",
    related: ["plan-31", "plan-15", "plan-16"],
    keywords: [
      "quitar aviso",
      "PLAN_ANTIGUO",
      "desaparece",
      "actualizar",
      "resetear",
    ],
  },
  {
    id: "plan-33",
    section: "paciente-planificacion",
    question: "¿Puedo reabrir una planificación cerrada?",
    answer:
      "Sí. Abre la planificación y cambia su estado de CERRADA a ACTIVA o PAUSADA. Los datos se conservan tal cual, por lo que recuperas el histórico completo de fases e hitos. Es útil cuando un paciente retoma un proceso antiguo o cuando cerraste la planificación antes de tiempo por error.",
    related: ["plan-7", "plan-8", "plan-21"],
    keywords: ["reabrir", "reactivar", "cerrada", "volver", "recuperar"],
  },
  {
    id: "plan-34",
    section: "paciente-planificacion",
    question: "¿Cómo filtro las planificaciones por estado?",
    answer:
      "En la cabecera de la pestaña Planificación tienes un filtro por estado que permite mostrar solo ACTIVAS, PAUSADAS, CERRADAS o todas. Úsalo para centrarte en lo que está en curso sin distraerte con planificaciones antiguas o para revisar el historial sin mezclar las vigentes.",
    related: ["plan-7", "plan-35"],
    keywords: ["filtrar", "estado", "activa", "pausada", "cerrada"],
  },
  {
    id: "plan-35",
    section: "paciente-planificacion",
    question: "¿Puedo ver solo la planificación vigente?",
    answer:
      "Sí. Aplica el filtro por estado ACTIVA o abre la planificación marcada como por defecto: cualquiera de las dos opciones te deja solo con la vigente a la vista y oculta las cerradas o pausadas. El flag esDefecto es la vía rápida cuando trabajas con un paciente que tiene mucho historial.",
    related: ["plan-34", "plan-10", "plan-11"],
    keywords: ["vigente", "activa", "actual", "filtrar", "defecto"],
  },
  {
    id: "plan-36",
    section: "paciente-planificacion",
    question: "¿Puedo exportar la planificación a PDF?",
    answer:
      "Sí. Dentro de la planificación pulsa Exportar a PDF. Se genera un documento con el nombre, las fechas, el estado, la lista de fases e hitos y las notas principales. Es útil para enviárselo al paciente como guion, para adjuntarlo a un informe o para tenerlo como respaldo externo del proceso.",
    related: ["plan-37", "plan-30"],
    keywords: ["exportar", "PDF", "descargar", "imprimir", "documento"],
  },
  {
    id: "plan-37",
    section: "paciente-planificacion",
    question: "¿Qué aparece en el PDF exportado de una planificación?",
    answer:
      "El PDF incluye los metadatos (nombre, estado, fechas, flag por defecto), el resumen del JSON de datos con las fases y los hitos ordenados por fecha, y las notas que hayas añadido. No incluye mediciones ni los planes de alimentación completos: para eso usa los PDF específicos de esas pestañas.",
    related: ["plan-36", "plan-25"],
    keywords: ["contenido PDF", "exportar", "fases", "hitos", "resumen"],
  },
  {
    id: "plan-38",
    section: "paciente-planificacion",
    question: "¿Qué papel juegan las notas en la planificación?",
    answer:
      "Las notas son texto libre que acompaña a la planificación o a cada fase. Sirven para registrar el porqué de una decisión, los aspectos a vigilar, las indicaciones específicas al paciente o cualquier detalle que no encaja en una casilla estructurada. Al ser texto libre, se adaptan a cada estilo de trabajo sin imponer un esquema rígido.",
    related: ["plan-17", "plan-39"],
    keywords: ["notas", "texto libre", "anotaciones", "comentarios", "detalle"],
  },
  {
    id: "plan-39",
    section: "paciente-planificacion",
    question: "¿Qué son las fases de trabajo?",
    answer:
      "Las fases de trabajo son los bloques que componen la planificación: adaptación, definición, volumen, mantenimiento, recarga, mesociclo competitivo, etcétera. Cada fase tiene su propio propósito, duración, metas e hitos, y se colocan en orden dentro del JSON de datos. Juntas forman el recorrido completo que sigue el paciente.",
    related: ["plan-24", "plan-17", "plan-40"],
    keywords: ["fases", "trabajo", "bloques", "etapas", "recorrido"],
  },
  {
    id: "plan-40",
    section: "paciente-planificacion",
    question: "¿Puedo reordenar las fases dentro de una planificación?",
    answer:
      "Sí. En el editor del JSON de datos puedes mover fases arriba o abajo para ajustar el orden. Al guardar, la vista de la planificación se actualiza y la línea temporal refleja la nueva secuencia. Es útil cuando cambian las circunstancias del paciente y hay que adelantar o retrasar una fase.",
    related: ["plan-39", "plan-18"],
    keywords: ["reordenar", "mover fases", "orden", "cambiar", "secuencia"],
  },
  {
    id: "plan-41",
    section: "paciente-planificacion",
    question: "¿Qué pasa si un paciente lleva meses sin actualizar su planificación?",
    answer:
      "Después de treinta días sin cambios, salta el aviso PLAN_ANTIGUO como recordatorio de que hay que revisarla. Si siguen pasando los meses sin tocarla, la planificación continúa existiendo, pero pierde utilidad como marco de trabajo: conviene entonces cerrarla y abrir una nueva ajustada a la situación real del paciente.",
    related: ["plan-31", "plan-32", "plan-21"],
    keywords: [
      "meses",
      "sin actualizar",
      "abandonada",
      "PLAN_ANTIGUO",
      "obsoleta",
    ],
  },
  {
    id: "plan-42",
    section: "paciente-planificacion",
    question: "¿Se puede tener una planificación sin fases definidas?",
    answer:
      "Sí. El campo datos es opcional: puedes guardar la planificación solo con nombre, fechas y estado, sin fases ni hitos. Es habitual al crearla y todavía no saber cómo se estructurará el proceso. Luego vas añadiendo fases conforme el trabajo con el paciente se concreta.",
    related: ["plan-17", "plan-5"],
    keywords: ["sin fases", "vacía", "mínima", "básica", "opcional"],
  },
  {
    id: "plan-43",
    section: "paciente-planificacion",
    question: "¿Cómo renombro una planificación?",
    answer:
      "Abre la planificación, pulsa sobre el nombre y escribe el nuevo título. Al guardar, el cambio se refleja en la lista y en el resumen de la ficha, y se actualiza la fecha de último cambio. Mantén nombres descriptivos como Definición verano o Temporada 2026 para que el historial se lea con claridad.",
    related: ["plan-5", "plan-15"],
    keywords: ["renombrar", "nombre", "título", "cambiar", "editar"],
  },
  {
    id: "plan-44",
    section: "paciente-planificacion",
    question: "¿El paciente ve la planificación desde su portal?",
    answer:
      "La planificación es una vista profesional de uso interno: no se expone tal cual en el portal del paciente. Si quieres compartir el guion, exporta la planificación a PDF y envíala como entregable, o resume sus fases en el apartado de recomendaciones. Así el paciente recibe el plan en un formato más adaptado y tú conservas el detalle operativo en tu ficha.",
    related: ["plan-36", "plan-37"],
    keywords: ["portal", "paciente", "visibilidad", "compartir", "interna"],
  },
  {
    id: "plan-45",
    section: "paciente-planificacion",
    question: "¿Cuál es el flujo recomendado para trabajar con la pestaña Planificación?",
    answer:
      "Lo habitual es: entrar por primera vez y quedarte con la planificación por defecto o crear una nueva a tu gusto; definir nombre, fechas de inicio y fin prevista y las fases principales en el JSON de datos; marcarla como ACTIVA y por defecto; ir añadiendo hitos y notas conforme avanza el proceso; revisar al menos cada treinta días para evitar el aviso PLAN_ANTIGUO; y cerrarla cuando se cumpla el objetivo, momento en el que abres una nueva para la siguiente etapa.",
    related: ["plan-3", "plan-5", "plan-21", "plan-31"],
    keywords: ["flujo", "recomendado", "uso", "proceso", "cómo trabajar"],
  },
];
