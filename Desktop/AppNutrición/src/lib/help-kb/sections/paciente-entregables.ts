import type { HelpEntry } from "../types";

export const PACIENTE_ENTREGABLES_ENTRIES: HelpEntry[] = [
  {
    id: "entr-1",
    section: "paciente-entregables",
    question: "¿Qué es la pestaña Entregables de la ficha del paciente?",
    answer:
      "Entregables es la pestaña desde la que generas un PDF profesional con toda la información del paciente listo para imprimir o compartir. A la izquierda tienes la vista previa en tiempo real del documento y a la derecha un panel de opciones con checkboxes para decidir qué secciones incluir (información del paciente, mediciones, plan de alimentación, consultas, recomendaciones, lista de la compra). Cuando lo tengas a tu gusto, pulsas Descargar PDF.",
    related: ["entr-2", "entr-4", "entr-5"],
    keywords: ["entregables", "pestaña", "pdf", "documento", "paciente", "qué es"],
  },
  {
    id: "entr-2",
    section: "paciente-entregables",
    question: "¿Cómo accedo a la pestaña Entregables?",
    answer:
      "Entra en la ficha del paciente desde el listado de Pacientes y selecciona la pestaña Entregables. También puedes abrirla directamente con la URL /pacientes/[id]?pestana=entregables si conoces el identificador del paciente.",
    related: ["entr-1", "entr-3"],
    keywords: ["acceder", "abrir", "entregables", "pestaña", "url", "navegación"],
  },
  {
    id: "entr-3",
    section: "paciente-entregables",
    question: "¿Cómo genero el PDF de un paciente?",
    answer:
      "Desde la pestaña Entregables selecciona el plan alimenticio que quieras incluir, marca las secciones que deban aparecer en el panel de la derecha y pulsa Generar vista previa para actualizar el documento a la izquierda. Cuando el resultado te guste, pulsa Descargar PDF y la aplicación abrirá el diálogo de impresión del navegador con el documento listo para guardar.",
    related: ["entr-1", "entr-4", "entr-5", "entr-14"],
    keywords: ["generar", "pdf", "descargar", "crear", "producir"],
  },
  {
    id: "entr-4",
    section: "paciente-entregables",
    question: "¿Qué secciones puedo activar o desactivar con los checkboxes?",
    answer:
      "En el panel de opciones puedes activar o desactivar: Información del paciente (portada con sus datos), Mediciones (peso, IMC y perímetros), Plan de alimentación (comidas y menús), Consultas (historial de visitas), Recomendaciones (consejos personalizados) y Lista de la compra (ingredientes del plan). Marca solo las que quieras incluir en el PDF final.",
    related: ["entr-1", "entr-3", "entr-5", "entr-20"],
    keywords: ["checkboxes", "secciones", "opciones", "activar", "desactivar", "personalizar"],
  },
  {
    id: "entr-5",
    section: "paciente-entregables",
    question: "¿Cuáles son las secciones recomendadas a incluir?",
    answer:
      "Por defecto se activan Portada, Plan semanal completo, Detalle diario de comidas, Recomendaciones, Lista de la compra, Valores nutricionales y Micronutrientes. Esta combinación da un entregable completo y profesional. Si quieres un documento más breve, desactiva Micronutrientes y Detalle diario; si quieres el más ligero, deja solo Portada, Plan semanal y Lista de la compra.",
    related: ["entr-4", "entr-20", "entr-23"],
    keywords: ["secciones recomendadas", "por defecto", "combinación", "completo", "breve"],
  },
  {
    id: "entr-6",
    section: "paciente-entregables",
    question: "¿La vista previa se actualiza en tiempo real?",
    answer:
      "La vista previa se actualiza cuando pulsas el botón Generar vista previa, no mientras marcas los checkboxes. Esto evita recalcular el PDF cada vez que tocas una opción, que sería pesado con planes grandes. Cuando tengas marcadas todas las secciones que quieres, pulsa Generar vista previa y el documento de la izquierda se regenerará.",
    related: ["entr-3", "entr-7", "entr-8"],
    keywords: ["vista previa", "tiempo real", "actualizar", "regenerar", "preview"],
  },
  {
    id: "entr-7",
    section: "paciente-entregables",
    question: "¿Cómo veo la vista previa del PDF?",
    answer:
      "La vista previa ocupa la columna izquierda de la pestaña Entregables y muestra una página A4 a la vez con el mismo aspecto que tendrá el PDF descargado. Si el documento tiene varias páginas, aparecerá un navegador con flechas para moverte entre ellas y un contador del tipo 1 / 8.",
    related: ["entr-6", "entr-8", "entr-9"],
    keywords: ["vista previa", "preview", "ver", "iframe", "a4"],
  },
  {
    id: "entr-8",
    section: "paciente-entregables",
    question: "¿Cómo me muevo entre las páginas de la vista previa?",
    answer:
      "Debajo de la página se muestran dos flechas y un contador (por ejemplo 3 / 12). Pulsa la flecha derecha para avanzar y la izquierda para retroceder. Si el PDF solo tiene una página, el navegador no aparece.",
    related: ["entr-7", "entr-9"],
    keywords: ["páginas", "navegar", "flechas", "avanzar", "retroceder", "contador"],
  },
  {
    id: "entr-9",
    section: "paciente-entregables",
    question: "¿Por qué la vista previa se ve pequeña?",
    answer:
      "La vista previa muestra una página A4 completa escalada al ancho de la columna. En pantallas estrechas puede quedar reducida, pero el PDF descargado siempre sale en tamaño A4 real (210x297 mm). Si quieres verla más grande, amplía la ventana del navegador o descarga directamente el PDF para visualizarlo en el lector del sistema.",
    related: ["entr-7", "entr-8", "entr-15"],
    keywords: ["pequeña", "tamaño", "escala", "zoom", "a4", "preview"],
  },
  {
    id: "entr-10",
    section: "paciente-entregables",
    question: "¿Cómo descargo el PDF?",
    answer:
      "Pulsa el botón Descargar PDF situado en la parte inferior del panel de opciones. Se abrirá una pestaña nueva con el documento listo para imprimir: en el diálogo de impresión del navegador elige Guardar como PDF (o el nombre equivalente según navegador) y confirma la ubicación donde quieres guardarlo.",
    related: ["entr-3", "entr-11", "entr-17"],
    keywords: ["descargar", "pdf", "botón", "guardar", "imprimir"],
  },
  {
    id: "entr-11",
    section: "paciente-entregables",
    question: "¿Qué información aparece en la cabecera del PDF?",
    answer:
      "La cabecera de cada página incluye el nombre del paciente, el logo del nutricionista o clínica (si lo has subido en Ajustes > Perfil) y la fecha de generación. Así el documento queda identificado aunque se imprima página suelta y tiene un aspecto corporativo consistente.",
    related: ["entr-12", "entr-13", "entr-22"],
    keywords: ["cabecera", "header", "nombre", "logo", "fecha", "identificación"],
  },
  {
    id: "entr-12",
    section: "paciente-entregables",
    question: "¿Cómo añado mi logo al PDF?",
    answer:
      "Ve a Ajustes > Perfil profesional y sube tu logo en el campo correspondiente. A partir de ese momento, cualquier PDF que generes desde Entregables lo incluirá automáticamente en la cabecera. Si cambias el logo, los PDF que generes después reflejarán el nuevo (los ya descargados no se modifican).",
    related: ["entr-11", "entr-13"],
    keywords: ["logo", "imagen", "clínica", "marca", "perfil", "subir"],
  },
  {
    id: "entr-13",
    section: "paciente-entregables",
    question: "¿Puedo cambiar el nombre que aparece en la cabecera del PDF?",
    answer:
      "El nombre que aparece es el del paciente tal y como está guardado en su ficha (pestaña Información). Si quieres cambiarlo, edítalo allí y vuelve a generar el PDF: la cabecera se actualizará con el nombre nuevo.",
    related: ["entr-11", "entr-12"],
    keywords: ["nombre", "cabecera", "cambiar", "paciente", "editar"],
  },
  {
    id: "entr-14",
    section: "paciente-entregables",
    question: "¿Qué fecha se imprime en el PDF?",
    answer:
      "Se imprime la fecha en la que generas el entregable (fecha del día en tu equipo). No se puede modificar manualmente, así el paciente sabe exactamente cuándo se emitió el documento. Si quieres un PDF con otra fecha, tendrás que generarlo ese día.",
    related: ["entr-11", "entr-27"],
    keywords: ["fecha", "generación", "día", "hoy", "emisión"],
  },
  {
    id: "entr-15",
    section: "paciente-entregables",
    question: "¿En qué formato y tamaño se genera el PDF?",
    answer:
      "El PDF se genera en formato A4 vertical (210x297 mm), que es el estándar para impresión en Europa y encaja en cualquier impresora doméstica o de clínica. El peso del archivo suele ser de entre 100 KB y 1 MB dependiendo de cuántas secciones incluyas y si el logo es pesado.",
    related: ["entr-9", "entr-16", "entr-17"],
    keywords: ["a4", "formato", "tamaño", "papel", "mb", "peso"],
  },
  {
    id: "entr-16",
    section: "paciente-entregables",
    question: "¿Por qué mi PDF pesa tanto?",
    answer:
      "Si el archivo pesa más de 2 MB suele ser porque el logo que subiste al perfil es una imagen muy grande. Reduce su tamaño a 500x500 px o menos antes de subirlo en Ajustes > Perfil. También ayuda desactivar secciones grandes como Micronutrientes o Detalle diario si no son imprescindibles.",
    related: ["entr-12", "entr-15"],
    keywords: ["peso", "tamaño", "pesado", "mb", "reducir", "logo"],
  },
  {
    id: "entr-17",
    section: "paciente-entregables",
    question: "¿Puedo imprimir el PDF directamente desde el navegador?",
    answer:
      "Sí. Al pulsar Descargar PDF se abre el documento en una pestaña nueva y se lanza automáticamente el diálogo de impresión del navegador. Desde ahí puedes elegir Imprimir en tu impresora o Guardar como PDF para quedarte solo con el archivo. Usa Ctrl+P (Windows) o Cmd+P (Mac) si el diálogo se cierra y quieres volver a abrirlo.",
    related: ["entr-10", "entr-15", "entr-34"],
    keywords: ["imprimir", "impresora", "papel", "navegador", "ctrl+p", "cmd+p"],
  },
  {
    id: "entr-18",
    section: "paciente-entregables",
    question: "¿Qué tildes y caracteres especiales soporta el PDF?",
    answer:
      "El PDF soporta por completo el alfabeto castellano (á, é, í, ó, ú, ñ, ü, ¿, ¡) y signos habituales del euro, grados y símbolos matemáticos. Si ves algún carácter raro, normalmente viene del propio texto que has copiado y pegado desde otro documento con codificación distinta: bórralo y escríbelo de nuevo directamente en la aplicación.",
    related: ["entr-19", "entr-36"],
    keywords: ["tildes", "acentos", "caracteres", "especiales", "codificación", "ñ"],
  },
  {
    id: "entr-19",
    section: "paciente-entregables",
    question: "¿Qué fuente usa el PDF?",
    answer:
      "El PDF usa una fuente sans-serif legible, neutra y compatible con todos los lectores de PDF. No se puede cambiar desde la aplicación para garantizar coherencia visual entre entregables. Si ves la fuente rara al abrir el PDF, prueba con otro visor (Acrobat Reader, Vista Previa de Mac, el propio Chrome) porque algunos lectores antiguos no la renderizan bien.",
    related: ["entr-18", "entr-36"],
    keywords: ["fuente", "font", "tipografía", "texto", "letra"],
  },
  {
    id: "entr-20",
    section: "paciente-entregables",
    question: "¿Cómo personalizo el entregable según el paciente?",
    answer:
      "Cada paciente tiene su propia ficha y su propio plan, así que el contenido del PDF ya se adapta automáticamente. Para personalizar aún más el documento puedes: activar o desactivar secciones con los checkboxes, elegir qué plan incluir en el selector superior y escribir recomendaciones específicas en la pestaña Recomendaciones antes de generar el entregable.",
    related: ["entr-4", "entr-5", "entr-23"],
    keywords: ["personalizar", "paciente", "adaptar", "específico", "individual"],
  },
  {
    id: "entr-21",
    section: "paciente-entregables",
    question: "¿Puedo enviar el PDF por email directamente desde la aplicación?",
    answer:
      "Sí. Junto al botón Descargar PDF hay un botón Enviar por email que manda el entregable a la dirección registrada en la ficha del paciente. Si el paciente no tiene email guardado el botón aparece deshabilitado: añádeselo primero en la pestaña Información.",
    related: ["entr-22", "entr-30"],
    keywords: ["email", "enviar", "correo", "mail", "adjuntar"],
  },
  {
    id: "entr-22",
    section: "paciente-entregables",
    question: "¿Desde qué dirección se envía el email con el PDF?",
    answer:
      "El correo se envía desde la cuenta configurada en Ajustes > Integraciones. Si no tienes integrado tu correo propio, se usa la cuenta genérica de la aplicación y el remitente mostrará el nombre de tu clínica. Para que lleve tu dirección real conecta Gmail o un SMTP propio.",
    related: ["entr-21", "entr-30"],
    keywords: ["remitente", "email", "dirección", "smtp", "gmail"],
  },
  {
    id: "entr-23",
    section: "paciente-entregables",
    question: "¿Hay distintos tipos de entregables (inicial, seguimiento, cierre)?",
    answer:
      "No existen plantillas separadas de inicial, seguimiento y cierre: el mismo generador cubre los tres usos cambiando qué secciones marcas. Para un entregable inicial activa Información, Mediciones, Plan y Recomendaciones; para un seguimiento activa Mediciones (con gráficas), Plan actual y Recomendaciones; para un cierre marca todas las secciones para dejar constancia completa del proceso.",
    related: ["entr-4", "entr-5", "entr-24"],
    keywords: ["inicial", "seguimiento", "cierre", "tipos", "plantilla"],
  },
  {
    id: "entr-24",
    section: "paciente-entregables",
    question: "¿Con qué periodicidad debo generar el entregable del paciente?",
    answer:
      "Depende del caso, pero una buena práctica es generar un entregable cada vez que cambias el plan (normalmente cada 2 o 4 semanas) y dárselo al paciente al final de la consulta. Así se lleva siempre la última versión y tú tienes un histórico si lo guardas en la carpeta del paciente.",
    related: ["entr-23", "entr-25"],
    keywords: ["periodicidad", "cada cuánto", "frecuencia", "semanas", "consulta"],
  },
  {
    id: "entr-25",
    section: "paciente-entregables",
    question: "¿La aplicación genera automáticamente el entregable cada X semanas?",
    answer:
      "No de momento. Los entregables se generan manualmente cada vez que los necesitas. Si quieres un recordatorio, puedes crearte una cita interna o usar la agenda para apuntarte una tarea cada 2-4 semanas del tipo Generar entregable de X.",
    related: ["entr-24"],
    keywords: ["automático", "programar", "recordatorio", "periódico", "scheduled"],
  },
  {
    id: "entr-26",
    section: "paciente-entregables",
    question: "¿Puedo incluir gráficas de evolución en el PDF?",
    answer:
      "Si activas la sección Mediciones, el PDF incluye la tabla de medidas registradas hasta la fecha de generación. La representación gráfica completa con curvas de evolución se añade como parte de esa misma sección siempre que haya al menos dos mediciones registradas: con una sola no hay evolución que dibujar.",
    related: ["entr-4", "entr-5"],
    keywords: ["gráficas", "evolución", "curvas", "mediciones", "progreso"],
  },
  {
    id: "entr-27",
    section: "paciente-entregables",
    question: "¿Se calcula la lista de la compra automáticamente a partir del plan?",
    answer:
      "Sí. Cuando activas la sección Lista de la compra, la aplicación recorre las comidas del plan seleccionado, suma los ingredientes por nombre y cantidad y los agrupa por categorías (verduras, carnes, lácteos, despensa, etc.). No hace falta que la escribas: se genera sola a partir de las recetas del plan.",
    related: ["entr-4", "entr-5", "entr-28"],
    keywords: ["lista compra", "ingredientes", "automático", "suma", "categorías"],
  },
  {
    id: "entr-28",
    section: "paciente-entregables",
    question: "¿Puedo editar la lista de la compra antes de descargar el PDF?",
    answer:
      "No directamente desde Entregables. Si quieres cambiar ingredientes, ajusta las recetas del plan (cantidades o sustituciones) y regenera la vista previa: la lista de la compra se recalculará automáticamente con los cambios.",
    related: ["entr-27", "entr-20"],
    keywords: ["editar", "modificar", "lista compra", "ingredientes", "manual"],
  },
  {
    id: "entr-29",
    section: "paciente-entregables",
    question: "¿La sección Plan muestra un día o toda la semana?",
    answer:
      "Puedes elegir. La opción Plan semanal completo muestra la tabla con los 7 días y todas las comidas (ideal para imprimir en una página), y la opción Detalle diario de comidas añade una sección por cada día con ingredientes y cantidades detalladas. Puedes activar una, la otra o las dos según la profundidad que quieras dar al entregable.",
    related: ["entr-4", "entr-5", "entr-31"],
    keywords: ["día", "semana", "plan", "detalle", "completo", "resumen"],
  },
  {
    id: "entr-30",
    section: "paciente-entregables",
    question: "¿Cómo comparto el PDF con el paciente?",
    answer:
      "Tienes varias opciones: Enviar por email directamente desde el botón de la pestaña, descargar el PDF y adjuntarlo por WhatsApp o Telegram, subirlo al portal del paciente para que pueda descargarlo desde ahí o imprimirlo en papel para entregárselo en consulta.",
    related: ["entr-21", "entr-31", "entr-34"],
    keywords: ["compartir", "enviar", "whatsapp", "portal", "imprimir", "paciente"],
  },
  {
    id: "entr-31",
    section: "paciente-entregables",
    question: "¿El paciente puede descargar el PDF desde su portal?",
    answer:
      "Sí. El paciente tiene su propia vista de exportar dentro del portal, que le permite generar su entregable con una versión simplificada del mismo configurador. Así puede descargarse el documento cuando quiera sin depender de que tú se lo envíes cada vez.",
    related: ["entr-30", "entr-32", "entr-39"],
    keywords: ["portal", "paciente", "descargar", "exportar", "acceso"],
  },
  {
    id: "entr-32",
    section: "paciente-entregables",
    question: "¿Qué diferencia hay entre Entregables del nutri y Exportar PDF del paciente?",
    answer:
      "Tu pestaña Entregables permite un control total: eliges qué plan incluir, activas todas las secciones (consultas, recomendaciones, valores nutricionales, etc.), envías por email y tienes la vista previa con paginación completa. El Exportar PDF del portal del paciente es una mini-vista con menos opciones (plan activo, lista de la compra, recomendaciones básicas) pensada para que el paciente se descargue rápido su documento.",
    related: ["entr-31", "entr-39"],
    keywords: ["diferencia", "nutri", "paciente", "portal", "exportar", "comparación"],
  },
  {
    id: "entr-33",
    section: "paciente-entregables",
    question: "¿Qué datos sensibles aparecen en el PDF?",
    answer:
      "El PDF puede contener nombre completo, fecha de nacimiento, datos de contacto, mediciones antropométricas, diagnósticos y recomendaciones. Son datos de salud y por tanto están sujetos al RGPD: guarda el PDF en un lugar seguro, evita compartirlo por canales inseguros y no lo dejes en ordenadores compartidos. Si envías por email, revisa que la dirección sea correcta antes de pulsar Enviar.",
    related: ["entr-21", "entr-30"],
    keywords: ["privacidad", "rgpd", "sensibles", "datos", "salud", "seguridad"],
  },
  {
    id: "entr-34",
    section: "paciente-entregables",
    question: "¿Puedo incluir mi firma profesional en el PDF?",
    answer:
      "La firma del nutricionista aparece al final del documento si la has configurado en Ajustes > Perfil (campo Firma). Puede ser una imagen de tu firma manuscrita escaneada o simplemente tu nombre, número de colegiado y clínica. Si no la tienes configurada, al final aparecerá solo el nombre profesional.",
    related: ["entr-12", "entr-35"],
    keywords: ["firma", "profesional", "colegiado", "rubrica", "final"],
  },
  {
    id: "entr-35",
    section: "paciente-entregables",
    question: "¿Puedo añadir mi número de colegiado al entregable?",
    answer:
      "Sí. El número de colegiado se configura en Ajustes > Perfil profesional y, si lo tienes guardado, aparece automáticamente junto a tu nombre y firma al final del PDF. Es útil para dar al entregable carácter oficial y cumplir con los requisitos de los colegios profesionales.",
    related: ["entr-34", "entr-12"],
    keywords: ["colegiado", "número", "profesional", "oficial", "colegio"],
  },
  {
    id: "entr-36",
    section: "paciente-entregables",
    question: "¿Puedo cambiar el estilo visual del PDF?",
    answer:
      "El estilo del PDF es fijo: tipografía limpia, colores neutros y maquetación sobria pensada para que parezca profesional y no cargada. No puedes cambiar colores, fuentes ni espaciados individualmente, pero sí personalizas el entregable añadiendo tu logo y tu firma para que se vea corporativo.",
    related: ["entr-12", "entr-19", "entr-34"],
    keywords: ["estilo", "visual", "colores", "diseño", "limpio", "profesional"],
  },
  {
    id: "entr-37",
    section: "paciente-entregables",
    question: "El PDF no se descarga, ¿qué problemas frecuentes hay?",
    answer:
      "Los problemas más comunes son: bloqueador de pop-ups del navegador impidiendo abrir la nueva pestaña (desactívalo para el dominio de la aplicación), plan sin contenido o sin comidas (añade al menos una comida al plan), navegador muy antiguo sin soporte de impresión a PDF (usa Chrome, Firefox o Safari actualizados) o conexión lenta mientras se cargan los datos (espera a que el botón deje de mostrar el spinner).",
    related: ["entr-10", "entr-38"],
    keywords: ["problemas", "no descarga", "error", "pop-ups", "bloqueador", "solución"],
  },
  {
    id: "entr-38",
    section: "paciente-entregables",
    question: "La vista previa aparece en blanco, ¿qué hago?",
    answer:
      "Normalmente significa que el plan seleccionado está vacío o que estás generando el PDF mientras aún se cargan los datos. Espera a que desaparezca el icono de carga, verifica que el plan tenga al menos una comida y vuelve a pulsar Generar vista previa. Si el problema persiste, cambia de plan en el selector superior o recarga la página.",
    related: ["entr-6", "entr-7", "entr-37"],
    keywords: ["blanco", "vacío", "previa", "error", "carga", "plan"],
  },
  {
    id: "entr-39",
    section: "paciente-entregables",
    question: "¿Puedo exportar solo un día o un rango de fechas concretos?",
    answer:
      "De momento no hay un selector específico de rango de fechas para el entregable: el PDF incluye el plan completo que hayas seleccionado en la parte superior. Si quieres un único día, desactiva Plan semanal completo y deja solo Detalle diario; para un rango concreto tendrás que crear un plan específico con esas fechas y exportarlo.",
    related: ["entr-29", "entr-40"],
    keywords: ["día", "rango", "fechas", "exportar", "específico", "filtro"],
  },
  {
    id: "entr-40",
    section: "paciente-entregables",
    question: "¿Puedo traducir el PDF a otro idioma?",
    answer:
      "Por ahora el entregable se genera únicamente en castellano. No hay opción de cambiar el idioma del documento ni traducirlo automáticamente. Si trabajas con pacientes que hablan otro idioma, puedes descargar el PDF y traducirlo manualmente o usar servicios externos antes de compartirlo. Es una funcionalidad que tenemos en la lista de mejoras futuras.",
    related: ["entr-36", "entr-39"],
    keywords: ["idioma", "traducir", "inglés", "multilingüe", "castellano"],
  },
];
