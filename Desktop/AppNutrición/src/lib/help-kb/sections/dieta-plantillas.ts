import type { HelpEntry } from "../types";

export const DIETA_PLANTILLAS_ENTRIES: HelpEntry[] = [
  {
    id: "dpl-1",
    section: "dieta-plantillas",
    question: "¿Qué es una plantilla de dieta?",
    answer:
      "Una plantilla es un plan de alimentación guardado como modelo reutilizable, sin paciente asociado. Funciona como un molde: conserva la estructura de días, comidas, alimentos y cantidades, pero no pertenece a nadie en concreto. Cuando necesitas crear un plan nuevo para un paciente, puedes partir de una plantilla y ahorrarte empezar desde cero. Se listan en /dietas/plantillas, con una tarjeta por plantilla que muestra el nombre, la fecha de creación y un resumen de días y alimentos.",
    related: ["dpl-2", "dpl-3", "dpl-5"],
    keywords: ["plantilla", "qué es", "modelo", "reutilizable", "base"],
  },
  {
    id: "dpl-2",
    section: "dieta-plantillas",
    question: "¿Qué diferencia hay entre una plantilla y un plan?",
    answer:
      "Un plan está asignado a un paciente concreto y aparece en su ficha, en la pestaña Plan alimenticio; es el documento real que el paciente consulta desde su portal. Una plantilla, en cambio, no tiene paciente: es solo una estructura de días y comidas que te guardas para reutilizarla. Editar un plan afecta a ese paciente en particular; editar una plantilla no cambia ningún plan ya creado. Una plantilla nunca se entrega al paciente tal cual: siempre hay que convertirla antes en un plan.",
    related: ["dpl-1", "dpl-27", "dpl-5"],
    keywords: ["diferencia", "plantilla", "plan", "paciente", "comparar"],
  },
  {
    id: "dpl-3",
    section: "dieta-plantillas",
    question: "¿Cómo creo una plantilla?",
    answer:
      "Las plantillas se crean a partir de un plan existente. Abre cualquier plan desde /dietas, pulsa el botón Plantilla en la parte superior, introduce un nombre descriptivo y confirma. El sistema copia la estructura completa de días, comidas, alimentos y cantidades en una nueva plantilla que aparecerá en /dietas/plantillas. El plan original queda intacto; la plantilla es independiente desde ese momento.",
    related: ["dpl-4", "dpl-1", "dpl-13"],
    keywords: ["crear", "guardar", "plantilla", "cómo", "nueva"],
  },
  {
    id: "dpl-4",
    section: "dieta-plantillas",
    question: "¿Puedo crear una plantilla desde cero, sin partir de un plan?",
    answer:
      "No directamente. La aplicación no tiene un editor de plantillas independiente: siempre se guardan a partir de un plan existente. Si quieres preparar una plantilla nueva desde cero, el flujo recomendado es crear un plan de prueba asociado a cualquier paciente, construir en él la estructura que quieras reutilizar y, cuando esté lista, pulsar Plantilla para guardarla. Después puedes eliminar ese plan de prueba si no lo necesitas.",
    related: ["dpl-3", "dpl-18", "dpl-2"],
    keywords: ["desde cero", "crear", "sin plan", "flujo", "editor"],
  },
  {
    id: "dpl-5",
    section: "dieta-plantillas",
    question: "¿Cómo uso una plantilla para crear un plan nuevo?",
    answer:
      "Hay dos caminos. El primero: desde /dietas/plantillas, pulsa Usar plantilla en la tarjeta; te lleva a /dietas/nuevo con la plantilla preseleccionada, solo tienes que elegir paciente y nombre del plan. El segundo: desde /dietas/nuevo, usa el selector de plantillas para escoger una antes de rellenar los datos. En ambos casos, al confirmar se crea un plan nuevo asociado al paciente copiando por completo la estructura de la plantilla.",
    related: ["dpl-1", "dpl-21", "dpl-3"],
    keywords: ["usar", "aplicar", "nuevo plan", "copiar", "crear desde"],
  },
  {
    id: "dpl-6",
    section: "dieta-plantillas",
    question: "¿Cómo edito una plantilla ya guardada?",
    answer:
      "Las plantillas no se editan directamente desde /dietas/plantillas: la vista solo permite usarlas o eliminarlas. Si quieres cambiar el contenido de una plantilla, el flujo es crear un plan con esa plantilla, modificarlo en el editor y volver a guardarlo como plantilla con el mismo nombre (o uno nuevo). Después puedes borrar la plantilla anterior si quieres evitar duplicados.",
    related: ["dpl-3", "dpl-20", "dpl-7"],
    keywords: ["editar", "modificar", "actualizar", "cambiar", "rehacer"],
  },
  {
    id: "dpl-7",
    section: "dieta-plantillas",
    question: "¿Puedo duplicar una plantilla?",
    answer:
      "No hay un botón Duplicar directo en la tarjeta de la plantilla. Para obtener una copia, usa la plantilla para crear un plan nuevo y después guarda ese plan como plantilla con otro nombre. Así tendrás dos plantillas con el mismo contenido y nombres distintos. Es el único camino porque las plantillas solo se generan a partir de planes.",
    related: ["dpl-6", "dpl-3", "dpl-5"],
    keywords: ["duplicar", "copia", "clonar", "replicar", "copiar"],
  },
  {
    id: "dpl-8",
    section: "dieta-plantillas",
    question: "¿Cómo elimino una plantilla?",
    answer:
      "En /dietas/plantillas, cada tarjeta tiene un icono de papelera en la esquina inferior derecha. Al pulsarlo se pide confirmación mostrando el nombre de la plantilla; si aceptas, se elimina de forma definitiva. La eliminación solo afecta a la plantilla: los planes que creaste antes a partir de ella no se borran ni se modifican, porque en el momento de crearlos se copió su contenido en el plan.",
    related: ["dpl-27", "dpl-6", "dpl-12"],
    keywords: ["eliminar", "borrar", "papelera", "quitar", "descartar"],
  },
  {
    id: "dpl-9",
    section: "dieta-plantillas",
    question: "¿Cómo busco una plantilla concreta?",
    answer:
      "Arriba del listado hay un campo Buscar plantilla por nombre. Escribes una palabra y, con un pequeño retardo (unos 300 ms), la lista se filtra mostrando solo las plantillas cuyo nombre contiene ese texto. La búsqueda no distingue mayúsculas y minúsculas y se guarda en el parámetro de URL busqueda, así que puedes enlazar o compartir un listado filtrado. Para volver a ver todas, vacía el campo.",
    related: ["dpl-26", "dpl-13", "dpl-1"],
    keywords: ["buscar", "filtrar", "nombre", "búsqueda", "texto"],
  },
  {
    id: "dpl-10",
    section: "dieta-plantillas",
    question: "¿Puedo organizar las plantillas por categorías o etiquetas?",
    answer:
      "No. La aplicación no tiene carpetas, categorías ni etiquetas para plantillas: todas se muestran juntas en una sola lista ordenada por fecha de creación. Si quieres imitar una clasificación, la solución práctica es usar un prefijo en el nombre: por ejemplo, Pérdida – 1500 kcal mujer activa o Mediterránea – mantenimiento hombre. Al buscar por esa palabra, agrupas todas las plantillas de esa categoría.",
    related: ["dpl-13", "dpl-23", "dpl-24"],
    keywords: ["categorías", "etiquetas", "carpetas", "organizar", "clasificar"],
  },
  {
    id: "dpl-11",
    section: "dieta-plantillas",
    question: "¿Puedo compartir una plantilla con otro dietista?",
    answer:
      "No. Las plantillas están vinculadas a tu cuenta y solo tú puedes verlas y usarlas. No existe una opción de compartir plantillas entre dietistas, ni un marketplace, ni un enlace público. Si colaboras con otra persona y queréis usar la misma plantilla, la única alternativa a día de hoy es reproducirla manualmente en cada cuenta, creando un plan idéntico y guardándolo como plantilla.",
    related: ["dpl-28", "dpl-29", "dpl-30"],
    keywords: ["compartir", "otro dietista", "colaborar", "enviar", "exportar"],
  },
  {
    id: "dpl-12",
    section: "dieta-plantillas",
    question: "¿Cuántas plantillas puedo tener guardadas?",
    answer:
      "No hay un límite práctico: puedes guardar tantas plantillas como necesites. El contador de la cabecera refleja el total (X plantillas guardadas). Si acumulas demasiadas, la única molestia es que el listado se alarga y cuesta más encontrar la que buscas; por eso conviene usar nombres descriptivos y eliminar las que ya no utilizas.",
    related: ["dpl-8", "dpl-26", "dpl-13"],
    keywords: ["cuántas", "límite", "cantidad", "máximo", "total"],
  },
  {
    id: "dpl-13",
    section: "dieta-plantillas",
    question: "¿Qué buenas prácticas debería seguir con el nombre de la plantilla?",
    answer:
      "El nombre es lo único visible en la tarjeta y en el selector al crear un plan, así que conviene que sea descriptivo. Incluye objetivo, calorías aproximadas y perfil: por ejemplo, Pérdida 1500 kcal mujer activa o Volumen 3000 kcal deportista. Evita nombres genéricos como Plantilla 1 o Dieta, porque dentro de seis meses no sabrás qué contienen. Puedes usar hasta 200 caracteres, aunque lo habitual son entre 20 y 60.",
    related: ["dpl-10", "dpl-14", "dpl-23"],
    keywords: ["nombre", "buenas prácticas", "descriptivo", "convenciones", "título"],
  },
  {
    id: "dpl-14",
    section: "dieta-plantillas",
    question: "¿Puedo añadir una descripción a la plantilla?",
    answer:
      "No. El modelo de plantilla solo guarda el nombre, la fecha de creación y la estructura de días y comidas. No hay un campo de descripción, notas ni comentarios asociados. Si necesitas anotar contexto (por ejemplo, a quién va dirigida o qué supuestos asume), inclúyelo dentro del propio nombre o lleva un registro externo. Alternativamente, al crear el plan desde la plantilla podrás añadir las aclaraciones pertinentes en el plan concreto.",
    related: ["dpl-13", "dpl-10", "dpl-1"],
    keywords: ["descripción", "notas", "comentarios", "campo", "texto"],
  },
  {
    id: "dpl-15",
    section: "dieta-plantillas",
    question: "¿Hay plantillas preinstaladas o de ejemplo?",
    answer:
      "No. Al crear tu cuenta no se instala ningún catálogo de plantillas por defecto: la lista empieza vacía y la vas construyendo tú a partir de los planes que diseñas. Es una decisión deliberada: cada dietista tiene un estilo propio y cada paciente necesita personalización, así que preferimos que las plantillas nazcan de tu trabajo real y no de modelos genéricos.",
    related: ["dpl-3", "dpl-17", "dpl-1"],
    keywords: ["preinstaladas", "ejemplos", "por defecto", "catálogo", "iniciales"],
  },
  {
    id: "dpl-16",
    section: "dieta-plantillas",
    question: "¿La plantilla guarda calorías objetivo o macros por defecto?",
    answer:
      "La plantilla guarda la estructura de alimentos y cantidades, y el total de kcal y macros se calcula dinámicamente al sumar lo que contenga. No existe un campo separado Kcal objetivo ni Macros objetivo en el propio registro de la plantilla: son cifras derivadas. Al usar la plantilla para crear un plan, el plan hereda esos alimentos y, si cambias cantidades, los totales se recalculan.",
    related: ["dpl-1", "dpl-21", "dpl-23"],
    keywords: ["calorías", "macros", "kcal", "objetivo", "totales"],
  },
  {
    id: "dpl-17",
    section: "dieta-plantillas",
    question: "¿Cuándo conviene usar una plantilla en lugar de la IA?",
    answer:
      "Usa una plantilla cuando ya tengas un molde muy afinado que se repite entre pacientes similares: ahorras tiempo, mantienes coherencia entre planes y el resultado es idéntico a lo que guardaste. Usa la IA cuando necesites algo nuevo, el paciente tenga preferencias o restricciones particulares, o quieras explorar una combinación que aún no tienes en tu catálogo. Las dos herramientas se complementan: la IA genera el borrador, tú lo afinas y, cuando te convence, lo guardas como plantilla.",
    related: ["dpl-18", "dpl-5", "dpl-1"],
    keywords: ["plantilla", "ia", "cuándo", "comparar", "decidir"],
  },
  {
    id: "dpl-18",
    section: "dieta-plantillas",
    question: "¿Cuándo conviene crear el plan desde cero en lugar de usar una plantilla?",
    answer:
      "Si el paciente tiene un perfil muy concreto que ninguna plantilla cubre (alergias poco habituales, dieta vegana estricta, horarios rotatorios, patologías), es más rápido y seguro construir el plan desde cero en /dietas/nuevo sin seleccionar ninguna plantilla. También es preferible cuando solo coincidirían unos pocos alimentos con tus plantillas: partir de una base que vas a cambiar casi entera aporta poco valor.",
    related: ["dpl-17", "dpl-5", "dpl-4"],
    keywords: ["desde cero", "nuevo", "cuándo", "plantilla", "partir"],
  },
  {
    id: "dpl-19",
    section: "dieta-plantillas",
    question: "¿Puedo guardar una plantilla con solo algunos días de la semana?",
    answer:
      "Sí. Una plantilla conserva exactamente los días que tenía el plan de origen en el momento de guardarla. Si el plan solo tenía lunes, miércoles y viernes, la plantilla tendrá esos tres días; si tenía los siete, los tendrá todos. Al usar la plantilla, el plan resultante nace con la misma configuración. Puedes completar o borrar días después en el editor del plan, sin que eso afecte a la plantilla original.",
    related: ["dpl-20", "dpl-5", "dpl-1"],
    keywords: ["días", "parcial", "semana", "incompleta", "algunos días"],
  },
  {
    id: "dpl-20",
    section: "dieta-plantillas",
    question: "¿Cómo actualizo una plantilla cuando cambio mi criterio?",
    answer:
      "Crea un plan a partir de la plantilla actual, aplícale los cambios que quieras incorporar y vuelve a guardarlo como plantilla con el mismo nombre. Eso te deja con dos plantillas: la antigua y la nueva. Si quieres sustituir la versión previa, elimina la antigua desde /dietas/plantillas. Es una forma sencilla de versionar: si prefieres conservar la anterior para comparar, solo tienes que añadirle un sufijo como v2 al nuevo nombre.",
    related: ["dpl-6", "dpl-8", "dpl-27"],
    keywords: ["actualizar", "versionar", "rehacer", "cambiar", "nueva versión"],
  },
  {
    id: "dpl-21",
    section: "dieta-plantillas",
    question: "¿Cómo aparecen las plantillas en el selector al crear un plan nuevo?",
    answer:
      "En /dietas/nuevo hay un selector de plantillas que lista todas las tuyas por nombre, ordenadas de la más reciente a la más antigua. Al elegir una, el formulario muestra el nombre y, al confirmar la creación del plan, copia su estructura completa. Si no seleccionas ninguna, el plan se crea vacío y lo construyes manualmente. Puedes cambiar la plantilla seleccionada antes de confirmar, pero una vez creado el plan la asociación se pierde: el plan es independiente.",
    related: ["dpl-5", "dpl-26", "dpl-27"],
    keywords: ["selector", "crear plan", "desplegable", "elegir", "lista"],
  },
  {
    id: "dpl-22",
    section: "dieta-plantillas",
    question: "¿Puedo marcar plantillas como favoritas?",
    answer:
      "No. El listado de plantillas no incluye un sistema de favoritos, ni de destacadas ni de fijadas arriba. Todas aparecen con el mismo peso y ordenadas por fecha de creación descendente. Si quieres que una plantilla destaque, una opción práctica es anteponer un símbolo al nombre (por ejemplo, un asterisco o un número) para que aparezca primero al ordenar alfabéticamente cuando busques.",
    related: ["dpl-10", "dpl-26", "dpl-13"],
    keywords: ["favoritas", "destacadas", "marcar", "prioridad", "fijar"],
  },
  {
    id: "dpl-23",
    section: "dieta-plantillas",
    question: "¿Puedo tener plantillas por objetivo (perder peso, ganar masa, mantenimiento)?",
    answer:
      "Sí, y es una forma muy útil de organizarlas. No hay un campo objetivo en la propia plantilla, pero puedes incluirlo en el nombre: Pérdida 1400 kcal, Mantenimiento 2000 kcal, Volumen 2800 kcal, y así tantas variantes como necesites. Al buscar por la palabra pérdida o volumen, la lista se filtra al conjunto correspondiente. Con tres o cuatro plantillas por objetivo y niveles calóricos típicos cubres la mayoría de casos.",
    related: ["dpl-10", "dpl-13", "dpl-24"],
    keywords: ["objetivo", "pérdida", "volumen", "mantenimiento", "organizar"],
  },
  {
    id: "dpl-24",
    section: "dieta-plantillas",
    question: "¿Puedo tener plantillas por tipo de dieta (mediterránea, baja en carbos, etc.)?",
    answer:
      "Sí, con la misma estrategia: inclúyelo en el nombre. Plantillas como Mediterránea 1800 kcal, Low carb 1600 kcal, Flexible 2200 kcal o Vegetariana 2000 kcal te permiten tener un catálogo propio por estilo nutricional. Al crear un plan nuevo para un paciente que prefiere un enfoque concreto, buscas por ese término en el selector o en /dietas/plantillas y eliges la que mejor encaje.",
    related: ["dpl-23", "dpl-10", "dpl-13"],
    keywords: ["tipo de dieta", "mediterránea", "keto", "low carb", "vegetariana"],
  },
  {
    id: "dpl-25",
    section: "dieta-plantillas",
    question: "¿Puedo ordenar las plantillas por fecha o por nombre?",
    answer:
      "El listado se muestra ordenado por fecha de creación descendente (las más recientes primero) y no hay selector visible para cambiar la ordenación a alfabética. Si necesitas buscar por nombre, apóyate en el campo de búsqueda: filtra las plantillas cuyo nombre contiene el texto introducido. Para un catálogo grande, un buen nombre descriptivo es más útil que reordenar la lista.",
    related: ["dpl-9", "dpl-13", "dpl-10"],
    keywords: ["ordenar", "fecha", "nombre", "alfabético", "orden"],
  },
  {
    id: "dpl-26",
    section: "dieta-plantillas",
    question: "¿Qué ocurre con las plantillas si dejo de usarlas durante un tiempo?",
    answer:
      "Nada especial. Las plantillas no caducan ni se archivan por inactividad: permanecen disponibles indefinidamente mientras no las elimines. Sí conviene revisarlas cada varios meses, porque los criterios nutricionales evolucionan: una plantilla de hace dos años puede apoyarse en alimentos que ya no prescribes o en cantidades que has ajustado. Actualizarlas o eliminarlas de vez en cuando mantiene tu catálogo útil.",
    related: ["dpl-20", "dpl-8", "dpl-12"],
    keywords: ["inactivas", "caducidad", "antiguas", "sin usar", "revisar"],
  },
  {
    id: "dpl-27",
    section: "dieta-plantillas",
    question: "Si edito una plantilla, ¿se actualizan los planes que creé antes a partir de ella?",
    answer:
      "No. La plantilla y los planes son independientes: en el momento de crear un plan desde una plantilla se hace una copia completa de su estructura, y a partir de ahí plan y plantilla no comparten datos. Puedes cambiar la plantilla todo lo que quieras, que los planes ya creados no se alteran; al revés también ocurre lo mismo, modificar un plan no afecta a la plantilla. Si quieres propagar un cambio a pacientes activos, tendrás que editar cada plan individualmente o rehacerlos.",
    related: ["dpl-2", "dpl-20", "dpl-8"],
    keywords: ["propagar", "editar", "planes anteriores", "sincronizar", "copia"],
  },
  {
    id: "dpl-28",
    section: "dieta-plantillas",
    question: "¿Quién puede ver mis plantillas?",
    answer:
      "Solo tú. Las plantillas están vinculadas a tu cuenta de dietista mediante el campo dietistaId y todas las consultas filtran por ese identificador, así que ningún otro dietista ni ningún paciente puede acceder a ellas. Los pacientes tampoco ven la lista desde su portal: ni siquiera saben que existe ese concepto. Es un espacio privado pensado para tu trabajo interno.",
    related: ["dpl-11", "dpl-1", "dpl-29"],
    keywords: ["privacidad", "ver", "quién", "privadas", "acceso"],
  },
  {
    id: "dpl-29",
    section: "dieta-plantillas",
    question: "¿Puedo exportar una plantilla a un archivo (PDF, JSON, Excel)?",
    answer:
      "No. Hoy no hay opción de exportar plantillas ni en PDF, ni en JSON, ni en Excel. Lo que sí puedes exportar es un plan concreto creado a partir de la plantilla: desde la vista de detalle del plan tienes la opción de descargar un PDF para el paciente. Si necesitas un archivo con el contenido de la plantilla, el camino es usarla para crear un plan y exportar ese plan.",
    related: ["dpl-11", "dpl-30", "dpl-28"],
    keywords: ["exportar", "pdf", "json", "excel", "archivo"],
  },
  {
    id: "dpl-30",
    section: "dieta-plantillas",
    question: "¿Puedo importar una plantilla desde un archivo externo?",
    answer:
      "No. No existe un importador de plantillas: ni desde archivo, ni desde enlace, ni desde la cuenta de otro dietista. La única forma de introducir una plantilla es crear un plan en la aplicación y guardarlo como plantilla. Si tienes una estructura detallada en un documento externo, tendrás que reproducirla manualmente en el editor la primera vez; una vez guardada, ya podrás reutilizarla todas las veces que quieras.",
    related: ["dpl-29", "dpl-11", "dpl-4"],
    keywords: ["importar", "archivo", "subir", "cargar", "migrar"],
  },
];
