import type { HelpEntry } from "../types";

export const PACIENTE_DETALLE_ENTRIES: HelpEntry[] = [
  {
    id: "pd-1",
    section: "paciente-detalle",
    question: "¿Qué es la ficha del paciente?",
    answer:
      "La ficha del paciente es la pantalla que se abre al entrar en /pacientes/[id]. Centraliza toda la información clínica y de seguimiento de una persona: datos personales, mediciones, planes, consultas, seguimiento diario, recomendaciones, entregables y configuración del portal. Desde aquí gestionas todo lo relacionado con ese paciente sin necesidad de saltar entre apartados sueltos.",
    related: ["pd-2", "pd-3", "pd-11"],
    keywords: [
      "ficha",
      "paciente",
      "detalle",
      "vista paciente",
      "historial",
    ],
  },
  {
    id: "pd-2",
    section: "paciente-detalle",
    question: "¿Cuántas pestañas tiene la ficha del paciente?",
    answer:
      "La ficha tiene 9 pestañas: General, Información, Mediciones, Planificación, Plan de alimentación, Seguimiento, Recomendaciones, Entregables y Portal del paciente. Cada una se centra en un área concreta del seguimiento nutricional. La pestaña General actúa como resumen y las demás permiten entrar al detalle.",
    related: ["pd-3", "pd-11", "pd-12"],
    keywords: ["pestañas", "tabs", "secciones", "nueve", "9"],
  },
  {
    id: "pd-3",
    section: "paciente-detalle",
    question: "¿Cómo navego entre las pestañas de la ficha?",
    answer:
      "Haz clic en el nombre de la pestaña en la barra superior de la ficha. En escritorio se ven todas las pestañas en una fila. En móvil la barra hace scroll horizontal: desliza con el dedo o la rueda del ratón para ver las pestañas que queden fuera de pantalla y pulsa sobre la que quieras abrir.",
    related: ["pd-2", "pd-4"],
    keywords: ["navegar", "pestañas", "móvil", "scroll horizontal", "cambiar"],
  },
  {
    id: "pd-4",
    section: "paciente-detalle",
    question: "¿Qué significa un punto rojo en una pestaña?",
    answer:
      "El punto o badge rojo en una pestaña indica que hay notificaciones pendientes del tipo correspondiente a esa pestaña. Por ejemplo, en Mediciones aparece cuando hay avisos de tipo SIN_MEDIDAS y en Seguimiento cuando hay entradas DIARIO_NUEVO sin leer. Es la forma rápida de ver dónde hay novedades del paciente sin entrar pestaña a pestaña.",
    related: ["pd-5", "pd-6"],
    keywords: [
      "badge",
      "punto rojo",
      "notificación",
      "aviso",
      "pestaña",
    ],
  },
  {
    id: "pd-5",
    section: "paciente-detalle",
    question: "¿Las notificaciones de una pestaña se marcan solas al entrar?",
    answer:
      "Sí. Al abrir una pestaña con badge rojo, las notificaciones del tipo asociado se marcan automáticamente como leídas y el punto desaparece. No tienes que tocar ningún botón: el simple hecho de visitar Mediciones, Seguimiento, etc. ya limpia el contador de esa pestaña para ese paciente.",
    related: ["pd-4", "pd-6"],
    keywords: [
      "auto marcar",
      "leídas",
      "notificaciones",
      "automático",
      "badge",
    ],
  },
  {
    id: "pd-6",
    section: "paciente-detalle",
    question: "¿Por qué no me desaparece el punto rojo de una pestaña?",
    answer:
      "El badge desaparece al entrar en la pestaña concreta que corresponde al tipo de notificación pendiente. Si el punto sigue visible en otra pestaña es porque hay avisos de otro tipo. Comprueba si el color rojo está sobre otra pestaña (por ejemplo Seguimiento en lugar de Mediciones) y entra en esa para que las notificaciones se marquen como leídas.",
    related: ["pd-4", "pd-5"],
    keywords: [
      "badge",
      "no desaparece",
      "rojo",
      "pendiente",
      "notificación",
    ],
  },
  {
    id: "pd-7",
    section: "paciente-detalle",
    question: "¿Qué se muestra en la cabecera de la ficha?",
    answer:
      "La cabecera incluye el avatar del paciente, su nombre y apellidos, su fecha de nacimiento con la edad calculada y una fila de botones de acción rápida: enviar mensaje (icono de correo), editar datos, desactivar o activar al paciente y eliminar. Es la zona fija superior que siempre ves sin importar en qué pestaña estés.",
    related: ["pd-8", "pd-9", "pd-10"],
    keywords: [
      "cabecera",
      "header",
      "avatar",
      "nombre",
      "edad",
      "botones",
    ],
  },
  {
    id: "pd-8",
    section: "paciente-detalle",
    question: "¿Cómo envío un mensaje al paciente desde la ficha?",
    answer:
      "Pulsa el icono del sobre o correo en la cabecera de la ficha. Se abre la conversación con ese paciente dentro del módulo de Mensajes, donde puedes escribirle directamente. El paciente recibirá el mensaje en su portal (si tiene acceso activado) y lo verás marcado como enviado en tu bandeja de salida.",
    related: ["pd-7", "pd-24"],
    keywords: [
      "mensaje",
      "enviar",
      "correo",
      "chat",
      "comunicar",
    ],
  },
  {
    id: "pd-9",
    section: "paciente-detalle",
    question: "¿Qué hace el botón de editar paciente?",
    answer:
      "El botón de editar (icono de lápiz) lleva a /pacientes/[id]/editar. Ahí puedes modificar datos personales como nombre, apellidos, email, teléfono, fecha de nacimiento, sexo y demás campos de contacto. Los cambios en mediciones, alergias, patologías u objetivos se hacen desde sus pestañas correspondientes, no desde editar.",
    related: ["pd-7", "pd-39", "pd-40"],
    keywords: [
      "editar",
      "modificar",
      "lápiz",
      "datos personales",
      "cambiar",
    ],
  },
  {
    id: "pd-10",
    section: "paciente-detalle",
    question: "¿Para qué sirve el botón de desactivar paciente?",
    answer:
      "Desactivar es un interruptor que oculta al paciente de la lista activa sin borrarlo. El historial, planes y mediciones se conservan. Úsalo cuando alguien deja el seguimiento y no quieres que aparezca en búsquedas o métricas del día a día. El mismo botón cambia a Activar si el paciente ya estaba desactivado, para volver a tenerlo visible.",
    related: ["pd-7", "pd-33", "pd-45"],
    keywords: [
      "desactivar",
      "activar",
      "toggle",
      "baja",
      "archivar",
      "inactivo",
    ],
  },
  {
    id: "pd-11",
    section: "paciente-detalle",
    question: "¿Qué diferencia hay entre desactivar y eliminar a un paciente?",
    answer:
      "Desactivar es reversible: mantiene todos los datos y solo lo oculta de listados. Eliminar es irreversible y borra al paciente con sus mediciones, planes, consultas, mensajes y entregables. Si dudas, desactiva. Solo usa Eliminar cuando estés seguro de que no vas a necesitar la información de esa persona nunca más.",
    related: ["pd-10", "pd-12", "pd-45"],
    keywords: [
      "desactivar",
      "eliminar",
      "borrar",
      "diferencia",
      "irreversible",
    ],
  },
  {
    id: "pd-12",
    section: "paciente-detalle",
    question: "¿Cómo elimino a un paciente desde su ficha?",
    answer:
      "Pulsa el botón de la papelera en la cabecera. Aparece un diálogo de confirmación porque el borrado es definitivo: se elimina el paciente y todo su historial asociado. Tienes que confirmar para que la operación se ejecute. Si te equivocas al pulsar, puedes cancelar el diálogo sin consecuencias.",
    related: ["pd-11", "pd-45"],
    keywords: [
      "eliminar",
      "borrar",
      "papelera",
      "confirmación",
      "suprimir",
    ],
  },
  {
    id: "pd-13",
    section: "paciente-detalle",
    question: "¿Cómo vuelvo al listado de pacientes desde la ficha?",
    answer:
      "Pulsa la flecha ← que aparece arriba a la izquierda de la ficha. Te lleva de vuelta a /pacientes conservando el filtro y la búsqueda que tuvieras activos. También puedes usar el menú lateral si prefieres moverte por los apartados principales de la aplicación.",
    related: ["pd-1", "pd-2"],
    keywords: [
      "volver",
      "atrás",
      "flecha",
      "listado",
      "pacientes",
    ],
  },
  {
    id: "pd-14",
    section: "paciente-detalle",
    question: "¿Qué muestra la pestaña General?",
    answer:
      "General es el resumen de la ficha. Reúne los datos clave del paciente (edad, sexo, contacto, última medición, objetivo), los planes de alimentación y de entrenamiento activos, las recomendaciones generales, el horario habitual y un panel lateral con cards configurables. Sirve como vistazo rápido antes de entrar a pestañas específicas.",
    related: ["pd-15", "pd-16", "pd-28"],
    keywords: [
      "general",
      "resumen",
      "overview",
      "vista general",
      "home paciente",
    ],
  },
  {
    id: "pd-15",
    section: "paciente-detalle",
    question: "¿Qué información aparece en el resumen de General?",
    answer:
      "El resumen de General muestra email, teléfono, edad, sexo, peso y altura actuales, IMC calculado, objetivo marcado, alergias, intolerancias, patologías, medicamentos, suplementos, horario habitual, recomendaciones generales y los planes asignados. Es un bloque consolidado con lo más relevante para preparar una consulta rápida.",
    related: ["pd-14", "pd-16", "pd-27"],
    keywords: [
      "resumen",
      "datos",
      "email",
      "teléfono",
      "imc",
      "objetivo",
    ],
  },
  {
    id: "pd-16",
    section: "paciente-detalle",
    question: "¿Qué es la pestaña Información?",
    answer:
      "Información es la pestaña con todos los datos personales, clínicos y de contexto del paciente: alergias, intolerancias, patologías, medicamentos, suplementos, antecedentes, objetivos y preferencias alimentarias. Aquí se edita el detalle fino de cada campo mientras que General solo los resume.",
    related: ["pd-14", "pd-17"],
    keywords: [
      "información",
      "datos",
      "clínico",
      "alergias",
      "patologías",
    ],
  },
  {
    id: "pd-17",
    section: "paciente-detalle",
    question: "¿Qué contiene la pestaña Mediciones?",
    answer:
      "Mediciones recoge el histórico de medidas antropométricas: peso, altura, perímetros, pliegues, composición corporal y cualquier métrica que registres. Permite añadir mediciones nuevas, verlas en tabla y en gráficos de evolución. Es la fuente de verdad del progreso físico del paciente.",
    related: ["pd-14", "pd-18", "pd-29"],
    keywords: [
      "mediciones",
      "peso",
      "antropometría",
      "pliegues",
      "composición",
    ],
  },
  {
    id: "pd-18",
    section: "paciente-detalle",
    question: "¿Qué muestra la pestaña Planificación?",
    answer:
      "Planificación es el espacio para organizar consultas, revisiones y objetivos del paciente a lo largo del tiempo. Aquí defines cuándo hay que hacerle seguimiento, qué pruebas repetir y en qué fechas. Funciona como la agenda personal de ese paciente dentro de su ficha.",
    related: ["pd-17", "pd-19"],
    keywords: [
      "planificación",
      "consultas",
      "revisiones",
      "agenda paciente",
    ],
  },
  {
    id: "pd-19",
    section: "paciente-detalle",
    question: "¿Qué es la pestaña Plan de alimentación?",
    answer:
      "Plan de alimentación es donde asignas, editas o sustituyes las dietas del paciente. Puedes crear un plan desde cero, usar una plantilla, generar con IA o copiar de otro paciente. Desde aquí también se marca cuál es el plan activo y se envía al portal del paciente.",
    related: ["pd-18", "pd-20", "pd-31"],
    keywords: [
      "plan",
      "alimentación",
      "dieta",
      "menú",
      "plantilla",
    ],
  },
  {
    id: "pd-20",
    section: "paciente-detalle",
    question: "¿Qué se ve en la pestaña Seguimiento?",
    answer:
      "Seguimiento muestra el diario del paciente: comidas registradas, agua, deporte, peso diario, notas y fotos de su día a día. Cada entrada del paciente desde el portal aparece aquí para que la revises. Si hay entradas nuevas, la pestaña muestra un badge rojo hasta que entres.",
    related: ["pd-4", "pd-19", "pd-32"],
    keywords: [
      "seguimiento",
      "diario",
      "registro",
      "paciente",
      "día a día",
    ],
  },
  {
    id: "pd-21",
    section: "paciente-detalle",
    question: "¿Qué contiene la pestaña Recomendaciones?",
    answer:
      "Recomendaciones es el apartado para las pautas generales que le das al paciente fuera del plan de alimentación: consejos de hidratación, sueño, actividad física, hábitos o lo que consideres. Se ven también desde el portal del paciente como referencia permanente.",
    related: ["pd-22", "pd-41"],
    keywords: [
      "recomendaciones",
      "consejos",
      "pautas",
      "hábitos",
    ],
  },
  {
    id: "pd-22",
    section: "paciente-detalle",
    question: "¿Qué es la pestaña Entregables?",
    answer:
      "Entregables es el espacio donde subes archivos para el paciente: PDF del plan, analíticas, informes, guías o cualquier documento. El paciente los ve y descarga desde su portal. Puedes ordenar, renombrar o eliminar los entregables desde esta pestaña.",
    related: ["pd-23", "pd-26"],
    keywords: [
      "entregables",
      "archivos",
      "pdf",
      "documentos",
      "descargas",
    ],
  },
  {
    id: "pd-23",
    section: "paciente-detalle",
    question: "¿Para qué sirve la pestaña Portal del paciente?",
    answer:
      "Portal del paciente configura qué ve y qué puede hacer el paciente cuando entra a su espacio. Desde aquí activas o desactivas apartados (seguimiento, citas, mensajes, horario...), gestionas credenciales de acceso y revisas cómo está configurado el acceso externo.",
    related: ["pd-22", "pd-24"],
    keywords: [
      "portal",
      "acceso paciente",
      "configurar",
      "permisos",
    ],
  },
  {
    id: "pd-24",
    section: "paciente-detalle",
    question: "¿Qué es el mini gráfico de evolución que aparece en General?",
    answer:
      "En la pestaña General se muestra un mini gráfico con la evolución reciente del peso: último valor registrado, tendencia (subida, bajada o estable) y diferencia respecto a la medición anterior. Si necesitas más detalle, entra en Mediciones para ver el histórico completo en gráficos grandes.",
    related: ["pd-17", "pd-25"],
    keywords: [
      "gráfico",
      "evolución",
      "peso",
      "tendencia",
      "mini chart",
    ],
  },
  {
    id: "pd-25",
    section: "paciente-detalle",
    question: "¿Qué es el sidebar configurable de la ficha?",
    answer:
      "El sidebar configurable (fichaSidebar) es el panel lateral de la pestaña General donde aparecen cards con información clave del paciente: última medición, planes activos, próximas consultas, recomendaciones, alergias, etc. Puedes elegir qué cards mostrar y en qué orden para adaptar la ficha a tu forma de trabajar.",
    related: ["pd-14", "pd-26"],
    keywords: [
      "sidebar",
      "panel lateral",
      "cards",
      "configurable",
      "fichaSidebar",
    ],
  },
  {
    id: "pd-26",
    section: "paciente-detalle",
    question: "¿Cómo personalizo las cards del sidebar de la ficha?",
    answer:
      "Abre el menú de configuración del sidebar (normalmente un engranaje o botón Personalizar en General) y marca qué cards quieres ver: resumen, mediciones, planes, horario, recomendaciones, alergias, etc. El orden y la visibilidad se guardan por paciente para que cada ficha muestre lo que te interesa.",
    related: ["pd-25", "pd-14"],
    keywords: [
      "personalizar",
      "cards",
      "sidebar",
      "configurar",
      "orden",
    ],
  },
  {
    id: "pd-27",
    section: "paciente-detalle",
    question: "¿Qué es el IMC que aparece en la ficha?",
    answer:
      "El IMC (Índice de Masa Corporal) se calcula automáticamente dividiendo el peso (kg) entre la altura (m) al cuadrado. Aparece en el resumen de General y se recalcula cada vez que registras una nueva medición. Es un indicador orientativo, no sustituye una valoración completa de composición corporal.",
    related: ["pd-15", "pd-17"],
    keywords: [
      "imc",
      "índice",
      "masa corporal",
      "cálculo",
    ],
  },
  {
    id: "pd-28",
    section: "paciente-detalle",
    question: "¿Qué es el objetivo del paciente?",
    answer:
      "El objetivo es la meta principal que has pactado con el paciente: pérdida de grasa, ganancia muscular, rendimiento, mantenimiento, mejora de salud, etc. Se edita desde Información y se muestra en General como referencia para orientar planes y seguimiento.",
    related: ["pd-15", "pd-16"],
    keywords: [
      "objetivo",
      "meta",
      "target",
      "pérdida peso",
      "ganancia",
    ],
  },
  {
    id: "pd-29",
    section: "paciente-detalle",
    question: "¿Qué pasa si un paciente no tiene ninguna medición registrada?",
    answer:
      "Si no hay mediciones, la pestaña Mediciones aparecerá vacía con un aviso para registrar la primera, y en General verás el IMC y el peso como no disponibles. La pestaña suele mostrar un badge rojo de tipo SIN_MEDIDAS recordándote añadir la primera medición para activar los gráficos de evolución.",
    related: ["pd-17", "pd-4", "pd-30"],
    keywords: [
      "sin mediciones",
      "sin medidas",
      "vacío",
      "primera medición",
    ],
  },
  {
    id: "pd-30",
    section: "paciente-detalle",
    question: "¿Qué es el aviso SIN_MEDIDAS en la pestaña Mediciones?",
    answer:
      "SIN_MEDIDAS es el tipo de notificación que genera la app cuando un paciente lleva demasiado tiempo sin nuevas mediciones o no tiene ninguna. Aparece como badge rojo en la pestaña Mediciones del paciente y como aviso en el dashboard, para que no se te pasen revisiones pendientes.",
    related: ["pd-4", "pd-29"],
    keywords: [
      "sin medidas",
      "SIN_MEDIDAS",
      "aviso",
      "recordatorio",
      "mediciones",
    ],
  },
  {
    id: "pd-31",
    section: "paciente-detalle",
    question: "¿Qué pasa si el paciente no tiene ningún plan asignado?",
    answer:
      "Si no hay plan de alimentación asignado, en General aparece un aviso que indica que no hay plan activo y en Plan de alimentación verás un estado vacío con accesos rápidos para crear desde cero, usar plantilla, generar con IA o copiar de otro paciente. Mientras no haya plan activo, el paciente tampoco verá menú en su portal.",
    related: ["pd-19", "pd-14"],
    keywords: [
      "sin plan",
      "sin dieta",
      "asignar",
      "crear plan",
      "vacío",
    ],
  },
  {
    id: "pd-32",
    section: "paciente-detalle",
    question: "¿Qué es el aviso DIARIO_NUEVO en la pestaña Seguimiento?",
    answer:
      "DIARIO_NUEVO es la notificación que genera la app cuando el paciente registra entradas nuevas en su diario desde el portal: comidas, peso, agua, deporte, notas... Muestra un badge rojo en la pestaña Seguimiento hasta que entres a revisarlas, momento en que se marcan solas como leídas.",
    related: ["pd-4", "pd-5", "pd-20"],
    keywords: [
      "DIARIO_NUEVO",
      "seguimiento",
      "diario",
      "nuevo registro",
      "badge",
    ],
  },
  {
    id: "pd-33",
    section: "paciente-detalle",
    question: "¿Puedo reactivar a un paciente que había desactivado?",
    answer:
      "Sí. Entra en su ficha (aparece listándolos en el filtro de inactivos de /pacientes) y pulsa el botón Activar en la cabecera. Vuelve a quedar disponible en la lista principal y conserva todo su historial. La reactivación es instantánea y no afecta a planes ni mediciones previas.",
    related: ["pd-10", "pd-11"],
    keywords: [
      "reactivar",
      "activar",
      "inactivo",
      "volver",
      "recuperar",
    ],
  },
  {
    id: "pd-34",
    section: "paciente-detalle",
    question: "¿Puedo cambiar el nombre del paciente desde su ficha?",
    answer:
      "Desde la pestaña General o las demás pestañas no puedes editar el nombre. Hay que pulsar el botón Editar de la cabecera, que lleva a /pacientes/[id]/editar, y cambiar ahí nombre, apellidos y el resto de datos personales. Así se evita que un clic accidental en la ficha modifique la identidad del paciente.",
    related: ["pd-9", "pd-35", "pd-39"],
    keywords: [
      "cambiar nombre",
      "editar",
      "apellidos",
      "datos",
    ],
  },
  {
    id: "pd-35",
    section: "paciente-detalle",
    question: "¿Cómo cambio el email del paciente?",
    answer:
      "Pulsa el botón Editar en la cabecera y modifica el campo Email en /pacientes/[id]/editar. Ten en cuenta que el email es la forma con la que el paciente accede a su portal, así que si lo cambias también cambia su usuario de acceso. Avísale si vas a modificarlo para que no pierda el acceso.",
    related: ["pd-9", "pd-34", "pd-23"],
    keywords: [
      "email",
      "correo",
      "cambiar",
      "acceso",
      "portal",
    ],
  },
  {
    id: "pd-36",
    section: "paciente-detalle",
    question: "¿Qué son las recomendaciones generales del paciente?",
    answer:
      "Las recomendaciones generales son texto libre que escribes para el paciente con consejos que no dependen del plan concreto: hidratación, sueño, pautas de actividad física, hábitos de compra, etc. Se muestran en General como resumen y en la pestaña Recomendaciones con formato completo. El paciente las ve también en su portal.",
    related: ["pd-21", "pd-41"],
    keywords: [
      "recomendaciones",
      "generales",
      "consejos",
      "texto libre",
    ],
  },
  {
    id: "pd-37",
    section: "paciente-detalle",
    question: "¿Qué es el horario del paciente que aparece en General?",
    answer:
      "El horario habitual describe a qué hora suele hacer sus actividades clave: despertar, dormir, comidas principales, entrenamientos y descansos. Sirve para que cuadres el plan de alimentación con su rutina real. Se edita en la pestaña Información o desde la sección de Horario del portal y se muestra resumido en General.",
    related: ["pd-15", "pd-38"],
    keywords: [
      "horario",
      "rutina",
      "comidas",
      "entreno",
      "sueño",
    ],
  },
  {
    id: "pd-38",
    section: "paciente-detalle",
    question: "¿Cómo edito el horario del paciente?",
    answer:
      "Abre la pestaña Información o Recomendaciones (según dónde esté ese bloque en tu configuración) y busca el apartado Horario. Marca las horas de despertar, acostarse, comidas principales, entrenos y cualquier tramo relevante. El horario aparecerá resumido en la pestaña General y también en el portal del paciente.",
    related: ["pd-37", "pd-16"],
    keywords: [
      "editar horario",
      "rutina",
      "horas",
      "cambiar",
    ],
  },
  {
    id: "pd-39",
    section: "paciente-detalle",
    question: "¿Por qué hay campos que se editan en Editar y otros en las pestañas?",
    answer:
      "Los datos identificativos (nombre, apellidos, email, teléfono, fecha de nacimiento, sexo) se editan en /pacientes/[id]/editar para evitar cambios accidentales. Los datos que evolucionan con el seguimiento (mediciones, plan, alergias, objetivos, horario...) se editan en la pestaña correspondiente para que el cambio quede en contexto.",
    related: ["pd-9", "pd-34", "pd-35"],
    keywords: [
      "editar",
      "datos",
      "dónde",
      "pestaña",
      "formulario",
    ],
  },
  {
    id: "pd-40",
    section: "paciente-detalle",
    question: "¿Qué atajos hay desde General al resto de pestañas?",
    answer:
      "En General cada bloque funciona como atajo: el resumen de mediciones lleva a Mediciones, el card de plan abre Plan de alimentación, las recomendaciones te llevan a su pestaña, y las consultas a Planificación. También puedes pulsar directamente en las pestañas de arriba, pero los atajos te llevan al bloque exacto.",
    related: ["pd-14", "pd-2", "pd-25"],
    keywords: [
      "atajos",
      "accesos rápidos",
      "desde general",
      "navegar",
    ],
  },
  {
    id: "pd-41",
    section: "paciente-detalle",
    question: "¿Dónde se muestran las recomendaciones para el paciente?",
    answer:
      "Las recomendaciones aparecen en tres sitios: en la pestaña General como resumen, en la pestaña Recomendaciones con el texto completo y en el portal del paciente cuando este inicia sesión. Si desactivas el portal o el apartado Recomendaciones en la configuración del portal, el paciente dejará de verlas pero tú las seguirás viendo en la ficha.",
    related: ["pd-21", "pd-36", "pd-23"],
    keywords: [
      "recomendaciones",
      "portal",
      "dónde",
      "ver",
    ],
  },
  {
    id: "pd-42",
    section: "paciente-detalle",
    question: "¿Cómo veo los planes activos del paciente?",
    answer:
      "En la pestaña General aparecen resumidos los planes activos del paciente (alimentación y otros si los tienes configurados). Cada tarjeta enlaza con la pestaña correspondiente para editar. Si un plan está caducado o tiene fechas pasadas, la tarjeta lo indica y te sugiere renovarlo.",
    related: ["pd-14", "pd-19"],
    keywords: [
      "planes",
      "activos",
      "ver",
      "alimentación",
    ],
  },
  {
    id: "pd-43",
    section: "paciente-detalle",
    question: "¿Qué hago si me entra mucha información en una sola pestaña?",
    answer:
      "Todas las pestañas largas tienen scroll vertical y bloques plegables. Puedes colapsar secciones que no uses a menudo (por ejemplo medicamentos, suplementos o antecedentes) y así mantener a la vista solo lo esencial. Si lo que te sobra en General son cards, personaliza el sidebar para quitar las que no necesites.",
    related: ["pd-25", "pd-26"],
    keywords: [
      "mucha información",
      "scroll",
      "plegar",
      "colapsar",
    ],
  },
  {
    id: "pd-44",
    section: "paciente-detalle",
    question: "¿Los botones de la cabecera están siempre visibles?",
    answer:
      "Sí, la cabecera con avatar, nombre, fecha de nacimiento y botones de acción (mensaje, editar, desactivar, eliminar) se mantiene visible en todas las pestañas de la ficha. En móvil la cabecera se compacta al hacer scroll para dar más espacio al contenido de la pestaña, pero los botones siguen accesibles.",
    related: ["pd-7", "pd-3"],
    keywords: [
      "cabecera",
      "botones",
      "siempre",
      "visible",
      "sticky",
    ],
  },
  {
    id: "pd-45",
    section: "paciente-detalle",
    question: "¿Puedo recuperar a un paciente eliminado?",
    answer:
      "No. Eliminar un paciente es irreversible: desaparecen sus mediciones, planes, consultas, mensajes, entregables y seguimiento. Si te planteas dejar de verlo pero podrías necesitar el historial más adelante, usa Desactivar en lugar de Eliminar. La papelera pide confirmación precisamente para evitar pérdidas accidentales.",
    related: ["pd-11", "pd-12", "pd-10"],
    keywords: [
      "recuperar",
      "eliminado",
      "irreversible",
      "borrar",
    ],
  },
  {
    id: "pd-46",
    section: "paciente-detalle",
    question: "¿Qué muestra la edad al lado de la fecha de nacimiento?",
    answer:
      "Junto a la fecha de nacimiento en la cabecera se calcula y muestra la edad actual del paciente en años. Se actualiza automáticamente cada día, así que no tienes que tocarla. Si el dato aparece mal, revisa la fecha de nacimiento en /pacientes/[id]/editar.",
    related: ["pd-7", "pd-9"],
    keywords: [
      "edad",
      "fecha nacimiento",
      "cumpleaños",
      "años",
    ],
  },
  {
    id: "pd-47",
    section: "paciente-detalle",
    question: "¿Qué información clave muestran los cards del sidebar?",
    answer:
      "Los cards del sidebar pueden incluir: última medición (peso, fecha), plan activo, próximas consultas, recomendaciones recientes, alergias e intolerancias, medicamentos y suplementos, horario, acceso al portal, avisos pendientes y cualquier otro bloque que actives en la configuración del sidebar. Cada card enlaza con la pestaña correspondiente.",
    related: ["pd-25", "pd-26", "pd-40"],
    keywords: [
      "cards",
      "sidebar",
      "información",
      "paneles",
      "resumen",
    ],
  },
  {
    id: "pd-48",
    section: "paciente-detalle",
    question: "¿Qué significan los badges en varias pestañas a la vez?",
    answer:
      "Que el paciente tiene notificaciones pendientes de más de un tipo. Por ejemplo, puede haber a la vez SIN_MEDIDAS en Mediciones y DIARIO_NUEVO en Seguimiento. Al entrar en cada pestaña se marcan como leídas solo las notificaciones de esa pestaña; las demás siguen activas hasta que las visites.",
    related: ["pd-4", "pd-5", "pd-32"],
    keywords: [
      "varios badges",
      "pestañas",
      "notificaciones",
      "múltiples",
    ],
  },
  {
    id: "pd-49",
    section: "paciente-detalle",
    question: "¿Puedo compartir la ficha con otro nutricionista de mi cuenta?",
    answer:
      "La ficha del paciente pertenece al dietista que lo ha creado. Si en tu cuenta hay varios profesionales, debes gestionar el acceso y la compartición desde Ajustes y el módulo de compartir de la dieta o el paciente, no desde la cabecera de la ficha. En la ficha en sí no hay un botón Compartir paciente.",
    related: ["pd-9", "pd-23"],
    keywords: [
      "compartir",
      "equipo",
      "nutricionistas",
      "acceso",
    ],
  },
  {
    id: "pd-50",
    section: "paciente-detalle",
    question: "¿Cómo sé de un vistazo todo lo pendiente de un paciente?",
    answer:
      "Mira la cabecera y las pestañas: los badges rojos en las pestañas te dicen en qué apartado hay notificaciones pendientes (mediciones, seguimiento, mensajes...) y el sidebar configurable de General resume la última actividad. Entre ambos tienes, en menos de dos segundos, el estado completo del paciente sin entrar a cada pestaña.",
    related: ["pd-4", "pd-14", "pd-25"],
    keywords: [
      "pendiente",
      "vistazo",
      "estado",
      "badges",
      "resumen",
    ],
  },
];
