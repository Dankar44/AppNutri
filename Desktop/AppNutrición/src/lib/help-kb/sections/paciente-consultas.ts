import type { HelpEntry } from "../types";

export const PACIENTE_CONSULTAS_ENTRIES: HelpEntry[] = [
  {
    id: "con-1",
    section: "paciente-consultas",
    question: "¿Qué es la pestaña Consultas de la ficha del paciente?",
    answer:
      "La pestaña Consultas recoge el historial de visitas presenciales o telemáticas que el paciente ha tenido contigo. Cada consulta es el acta de una visita concreta con su fecha, motivo, peso del día, observaciones del profesional y la próxima cita planificada. Se accede desde la ficha del paciente en la sub-ruta /pacientes/[id]/consultas y es uno de los pilares del seguimiento clínico.",
    related: ["con-2", "con-3", "con-4"],
    keywords: ["consultas", "pestaña", "visitas", "historial", "ficha paciente"],
  },
  {
    id: "con-2",
    section: "paciente-consultas",
    question: "¿Cuál es la diferencia entre una consulta y una medida?",
    answer:
      "Una consulta es el acta de una visita: motivo, observaciones, próxima cita y peso puntual. Una medida es antropometría pura (peso, altura, porcentajes, perímetros) que se registra en la pestaña Mediciones. Puedes tener consultas sin medidas asociadas (una revisión telefónica breve) y medidas sin consulta (una pesada rápida). No obstante, una consulta puede llevar medidas vinculadas para registrar ambas cosas a la vez.",
    related: ["con-1", "con-12", "con-13"],
    keywords: ["diferencia", "medida", "consulta", "antropometría", "acta"],
  },
  {
    id: "con-3",
    section: "paciente-consultas",
    question: "¿Cómo creo una nueva consulta?",
    answer:
      "Desde la pestaña Consultas pulsa el botón Nueva consulta. Se abrirá un formulario con los campos de fecha, motivo, peso, observaciones y próxima cita. Rellena al menos el motivo (el resto es opcional) y pulsa Guardar. La consulta aparecerá al instante en el listado, encabezando el histórico por ser la más reciente.",
    related: ["con-4", "con-5", "con-7"],
    keywords: ["crear", "nueva consulta", "registrar", "formulario", "guardar"],
  },
  {
    id: "con-4",
    section: "paciente-consultas",
    question: "¿Qué fecha aparece por defecto al crear una consulta?",
    answer:
      "El campo Fecha se rellena automáticamente con el día de hoy para agilizar el registro tras la visita. Puedes modificarla libremente si estás registrando una consulta atrasada (por ejemplo la de ayer que no pudiste apuntar). No se permiten fechas futuras: para planificar visitas usa la Agenda.",
    related: ["con-3", "con-33", "con-46"],
    keywords: ["fecha", "hoy", "por defecto", "automática", "día"],
  },
  {
    id: "con-5",
    section: "paciente-consultas",
    question: "¿Qué motivos puedo asignar a una consulta?",
    answer:
      "El desplegable de motivo incluye tipos habituales como Consulta inicial, Seguimiento, Revisión, Cierre o Alta, y también un valor Otros para casos especiales. El motivo ayuda a filtrar el historial y a entender de un vistazo qué tipo de visita fue. Si siempre usas los mismos, revisa los motivos frecuentes en la entrada con-22.",
    related: ["con-6", "con-22", "con-23"],
    keywords: ["motivo", "tipo", "seguimiento", "inicial", "cierre"],
  },
  {
    id: "con-6",
    section: "paciente-consultas",
    question: "¿Cuándo debo usar el motivo Consulta inicial?",
    answer:
      "Reserva Consulta inicial para la primera visita del paciente contigo, donde sueles hacer la historia clínica completa, medidas basales y objetivos. A partir de la segunda visita lo habitual es Seguimiento o Revisión. Tener bien marcada la inicial te permite localizarla rápidamente cuando quieras recordar el punto de partida.",
    related: ["con-5", "con-22", "con-36"],
    keywords: ["consulta inicial", "primera", "historia", "basal", "arranque"],
  },
  {
    id: "con-7",
    section: "paciente-consultas",
    question: "¿Qué campos tiene el formulario de consulta?",
    answer:
      "El formulario tiene cinco campos: fecha (por defecto hoy), motivo (desplegable), peso del día en kg (opcional, con decimales), observaciones o notas del profesional (texto libre) y próxima cita planificada (fecha opcional). De todos ellos solo el motivo es estrictamente necesario, aunque rellenar observaciones es muy recomendable para dejar trazabilidad.",
    related: ["con-3", "con-8", "con-9"],
    keywords: ["campos", "formulario", "motivo", "peso", "observaciones"],
  },
  {
    id: "con-8",
    section: "paciente-consultas",
    question: "¿Qué pongo en el campo Peso de la consulta?",
    answer:
      "El campo Peso permite apuntar de forma rápida el peso del paciente el día de la visita, en kilogramos y con decimales (por ejemplo 74,2). Es opcional y está pensado para cuando solo quieras registrar ese dato sin abrir la pestaña de Mediciones. Si necesitas guardar más parámetros (grasa, músculo, perímetros), es mejor vincular una medida completa.",
    related: ["con-7", "con-12", "con-13"],
    keywords: ["peso", "kg", "kilogramos", "decimales", "visita"],
  },
  {
    id: "con-9",
    section: "paciente-consultas",
    question: "¿Para qué sirve el campo Observaciones?",
    answer:
      "Observaciones es un campo de texto libre para que el nutricionista registre lo que considere relevante de la visita: adherencia, síntomas, acuerdos, ajustes del plan, motivación, incidencias o cualquier detalle clínico. Es la parte más valiosa del acta y lo que consultarás en visitas futuras para recordar el contexto. Admite saltos de línea y longitud larga.",
    related: ["con-7", "con-31", "con-32"],
    keywords: ["observaciones", "notas", "texto", "comentarios", "registro"],
  },
  {
    id: "con-10",
    section: "paciente-consultas",
    question: "¿Qué significa el campo Próxima cita?",
    answer:
      "Próxima cita es una fecha orientativa de cuándo esperas volver a ver al paciente. Sirve como recordatorio rápido dentro del acta y como referencia para decidir si agendar una cita formal. Es un campo informativo: no crea automáticamente una cita en la Agenda, para eso debes ir al calendario y añadirla.",
    related: ["con-11", "con-40", "con-41"],
    keywords: ["próxima cita", "siguiente", "planificar", "fecha", "recordatorio"],
  },
  {
    id: "con-11",
    section: "paciente-consultas",
    question: "¿Próxima cita crea automáticamente un evento en la Agenda?",
    answer:
      "No. Próxima cita es un apunte dentro de la consulta pero no genera un evento en la Agenda. Si quieres que aparezca en el calendario y enviar recordatorios al paciente debes crear la cita manualmente desde la pestaña Agenda. Este comportamiento evita duplicidades cuando la fecha es aproximada.",
    related: ["con-10", "con-40", "con-41"],
    keywords: ["agenda", "evento", "calendario", "cita", "automático"],
  },
  {
    id: "con-12",
    section: "paciente-consultas",
    question: "¿Puedo vincular medidas a una consulta?",
    answer:
      "Sí. Una consulta puede llevar asociadas las medidas antropométricas tomadas ese mismo día. Al guardar la consulta, las medidas registradas en la misma fecha aparecen enlazadas para que, abriendo el acta, veas en contexto peso, grasa, músculo o perímetros. Esto te ahorra saltar entre pestañas durante la revisión.",
    related: ["con-2", "con-13", "con-14"],
    keywords: ["vincular", "medidas", "asociar", "antropometría", "relación"],
  },
  {
    id: "con-13",
    section: "paciente-consultas",
    question: "¿Cómo vinculo una medida a la consulta del día?",
    answer:
      "La forma más sencilla es registrar la medida en la pestaña Mediciones con la misma fecha que la consulta. El sistema las agrupa por fecha y las muestra enlazadas al abrir el acta. Si rellenas el campo Peso dentro del formulario de consulta, también puedes generar de paso una medida ligera con ese valor.",
    related: ["con-8", "con-12", "con-14"],
    keywords: ["vincular", "medida", "fecha", "agrupar", "enlace"],
  },
  {
    id: "con-14",
    section: "paciente-consultas",
    question: "¿Qué ocurre si desvinculo una medida de una consulta?",
    answer:
      "La medida sigue existiendo en la pestaña Mediciones, solo deja de aparecer enlazada dentro del acta. No se pierde ni afecta a las gráficas de evolución. Puedes volver a vincularla en cualquier momento ajustando las fechas o desde la acción de editar la consulta.",
    related: ["con-12", "con-13", "con-18"],
    keywords: ["desvincular", "quitar", "medida", "enlace", "separar"],
  },
  {
    id: "con-15",
    section: "paciente-consultas",
    question: "¿Cómo se ordenan las consultas en el listado?",
    answer:
      "El listado se muestra por fecha descendente: primero la consulta más reciente y al final la más antigua. Este orden facilita retomar el seguimiento tal y como quedó en la última visita. No se puede cambiar el orden manualmente, pero sí filtrar por motivo o buscar por texto si el histórico es largo.",
    related: ["con-16", "con-28", "con-44"],
    keywords: ["orden", "listado", "descendente", "reciente", "fecha"],
  },
  {
    id: "con-16",
    section: "paciente-consultas",
    question: "¿Qué información veo en cada fila del listado?",
    answer:
      "Cada fila resume la consulta con la fecha, el motivo, un extracto de las observaciones y, si lo rellenaste, el peso de ese día. A la derecha aparecen las acciones para editar o borrar. Pulsando sobre la fila se despliega el detalle completo con todas las notas y las medidas vinculadas.",
    related: ["con-15", "con-17", "con-18"],
    keywords: ["fila", "listado", "información", "resumen", "detalle"],
  },
  {
    id: "con-17",
    section: "paciente-consultas",
    question: "¿Cómo abro el detalle de una consulta?",
    answer:
      "Haz clic en la fila de la consulta en el listado y se expandirá el detalle con el acta completa: fecha, motivo, peso, observaciones íntegras, próxima cita y medidas vinculadas. Desde ese detalle tienes los botones de Editar y Borrar. Un segundo clic o cerrar con la X vuelve a contraer la fila.",
    related: ["con-16", "con-18", "con-19"],
    keywords: ["detalle", "abrir", "ver", "expandir", "acta"],
  },
  {
    id: "con-18",
    section: "paciente-consultas",
    question: "¿Cómo edito una consulta existente?",
    answer:
      "Abre el detalle de la consulta y pulsa Editar, o usa el icono de lápiz en la fila del listado. Se abrirá el mismo formulario con los datos cargados para que modifiques lo que necesites (corregir una fecha, añadir notas, ajustar el peso). Al guardar, la consulta se actualiza sin crear una nueva.",
    related: ["con-17", "con-19", "con-20"],
    keywords: ["editar", "modificar", "actualizar", "cambiar", "corregir"],
  },
  {
    id: "con-19",
    section: "paciente-consultas",
    question: "¿Puedo cambiar la fecha de una consulta ya registrada?",
    answer:
      "Sí. Al editar la consulta puedes modificar la fecha libremente siempre que no sea futura. El listado se reordena automáticamente para reflejar la nueva posición. Ten en cuenta que si la movieras a un día donde ya existe una medida con el mismo paciente, esa medida pasará a quedar vinculada a la consulta.",
    related: ["con-18", "con-4", "con-13"],
    keywords: ["cambiar fecha", "editar fecha", "mover", "reordenar"],
  },
  {
    id: "con-20",
    section: "paciente-consultas",
    question: "¿Cómo borro una consulta?",
    answer:
      "Abre la consulta y pulsa Borrar, o usa el icono de papelera del listado. Aparecerá una ventana de confirmación porque la acción es irreversible: una vez borrada no se puede recuperar la consulta ni sus datos asociados. Confirma solo si estás seguro; si dudas, es más prudente editarla.",
    related: ["con-18", "con-21", "con-48"],
    keywords: ["borrar", "eliminar", "papelera", "irreversible", "confirmación"],
  },
  {
    id: "con-21",
    section: "paciente-consultas",
    question: "¿Al borrar una consulta se borran también sus medidas?",
    answer:
      "No. Las medidas antropométricas son independientes y permanecen en la pestaña Mediciones aunque elimines la consulta a la que estaban vinculadas. Si también quieres eliminarlas debes hacerlo por separado desde esa pestaña. Esto protege tus registros de antropometría ante borrados accidentales.",
    related: ["con-20", "con-14", "con-48"],
    keywords: ["borrar", "medidas", "cascada", "independiente", "proteger"],
  },
  {
    id: "con-22",
    section: "paciente-consultas",
    question: "¿Cuáles son los motivos más frecuentes de consulta?",
    answer:
      "Los motivos más usados suelen ser Consulta inicial (primera visita), Seguimiento (visitas periódicas), Revisión (control puntual), Cierre o Alta (fin del proceso) y Reincorporación (retorno tras pausa). Elegir siempre el motivo correcto te ayuda a filtrar el historial y a medir tu tasa de altas frente a cierres.",
    related: ["con-5", "con-6", "con-23"],
    keywords: ["motivos frecuentes", "tipos", "habituales", "comunes", "categorías"],
  },
  {
    id: "con-23",
    section: "paciente-consultas",
    question: "¿Puedo crear motivos de consulta personalizados?",
    answer:
      "Actualmente el desplegable de motivos es cerrado y ofrece los tipos más comunes más un valor Otros. Para particularizar el motivo usa el campo Observaciones y describe ahí el matiz (por ejemplo, Otros + nota interna explicando el caso). Es una forma flexible sin sobrecargar el desplegable.",
    related: ["con-5", "con-22", "con-9"],
    keywords: ["motivos personalizados", "custom", "propios", "añadir", "otros"],
  },
  {
    id: "con-24",
    section: "paciente-consultas",
    question: "¿Existe una plantilla de consulta para rellenar siempre lo mismo?",
    answer:
      "No hay una plantilla guardable por paciente, pero puedes copiar y pegar tu propia estructura en el campo Observaciones (por ejemplo: Adherencia, Síntomas, Ajustes, Próximos pasos). Muchos profesionales mantienen una nota personal con ese esqueleto y lo pegan en cada consulta para no saltarse ningún apartado.",
    related: ["con-9", "con-22", "con-25"],
    keywords: ["plantilla", "template", "estructura", "modelo", "esqueleto"],
  },
  {
    id: "con-25",
    section: "paciente-consultas",
    question: "¿Puedo duplicar una consulta anterior?",
    answer:
      "No hay un botón específico de duplicar, pero puedes abrir la consulta previa, copiar el texto de las observaciones y pegarlo al crear la nueva como punto de partida. Así mantienes la continuidad de tu estructura de notas y solo modificas lo que haya cambiado desde la última visita.",
    related: ["con-24", "con-3", "con-9"],
    keywords: ["duplicar", "copiar", "clonar", "repetir", "reutilizar"],
  },
  {
    id: "con-26",
    section: "paciente-consultas",
    question: "¿Cómo registro si la consulta fue telemática o presencial?",
    answer:
      "Actualmente no hay un campo separado para modalidad, pero es habitual indicarlo al principio de Observaciones (por ejemplo Telemática - videollamada o Presencial - consulta). Esta convención te permite filtrar luego por texto y saber cómo se hizo cada visita, y evita confusiones si combinas ambas modalidades.",
    related: ["con-9", "con-27", "con-28"],
    keywords: ["telemática", "presencial", "online", "videollamada", "modalidad"],
  },
  {
    id: "con-27",
    section: "paciente-consultas",
    question: "¿Puedo indicar la duración de la consulta?",
    answer:
      "El formulario no tiene un campo específico de duración. Si la información te interesa, añádela en Observaciones como por ejemplo Duración: 45 minutos. Esto te sirve para referencia interna y para calcular tu rendimiento si registras varios pacientes al día.",
    related: ["con-9", "con-26", "con-28"],
    keywords: ["duración", "tiempo", "minutos", "minutaje", "registro"],
  },
  {
    id: "con-28",
    section: "paciente-consultas",
    question: "¿Puedo buscar texto dentro de las consultas del paciente?",
    answer:
      "Sí. Sobre el listado de consultas hay un buscador que filtra por coincidencia en motivo y observaciones. Teclear, por ejemplo, telemática o ajuste hidratos te mostrará solo las consultas donde aparezca ese texto. El filtro es instantáneo y se combina con el orden descendente habitual.",
    related: ["con-15", "con-26", "con-44"],
    keywords: ["buscar", "filtrar", "texto", "buscador", "encontrar"],
  },
  {
    id: "con-29",
    section: "paciente-consultas",
    question: "¿El precio o coste de la consulta se gestiona aquí?",
    answer:
      "No. El acta de consulta es solo clínica. El cobro, el importe y el estado de pago se gestionan en la sección Pagos o desde la pestaña de Cobros del paciente si la tiene habilitada. Así la información clínica queda separada de la contable, aunque ambas pueden cruzarse por paciente y por fecha.",
    related: ["con-30", "con-1", "con-2"],
    keywords: ["precio", "coste", "pago", "cobro", "importe"],
  },
  {
    id: "con-30",
    section: "paciente-consultas",
    question: "¿Cómo relaciono una consulta con un cobro en Pagos?",
    answer:
      "Registra la consulta en esta pestaña y crea el cobro correspondiente en Pagos con la misma fecha y paciente. Al consultar el histórico de Pagos podrás ver qué consultas coinciden en fecha y asumir que ese cobro corresponde a esa visita. No hay un enlace directo entre ambas entidades, pero la fecha y el paciente hacen de puente natural.",
    related: ["con-29", "con-40", "con-42"],
    keywords: ["relación", "pagos", "cobro", "fecha", "cruzar"],
  },
  {
    id: "con-31",
    section: "paciente-consultas",
    question: "¿Las observaciones de la consulta son privadas o las ve el paciente?",
    answer:
      "Por defecto las observaciones son internas del profesional y no se muestran en el portal del paciente. Están pensadas como notas clínicas para tu uso. Si quieres que el paciente reciba un resumen, la vía adecuada es enviarle un mensaje desde la pestaña Mensajes o adjuntarlo en un entregable, donde sí tiene visibilidad.",
    related: ["con-32", "con-38", "con-45"],
    keywords: ["privadas", "internas", "paciente", "visible", "confidencial"],
  },
  {
    id: "con-32",
    section: "paciente-consultas",
    question: "¿Puedo marcar partes de la consulta como visibles al paciente?",
    answer:
      "El campo Observaciones es único y se considera nota privada, no permite marcar fragmentos como públicos. Si necesitas compartir instrucciones con el paciente, escríbelas como mensaje en la pestaña Mensajes o súbelas como documento en Entregables. De esta forma cada información viaja por el canal adecuado.",
    related: ["con-31", "con-34", "con-45"],
    keywords: ["visibles", "compartir", "paciente", "portal", "público"],
  },
  {
    id: "con-33",
    section: "paciente-consultas",
    question: "¿Puedo registrar una consulta con fecha futura?",
    answer:
      "No. El campo Fecha no permite seleccionar días posteriores a hoy porque una consulta es el registro de una visita ya ocurrida. Si quieres planificar una visita por adelantado debes crearla en la Agenda como cita; luego, cuando llegue el día y tenga lugar, la conviertes en consulta registrada.",
    related: ["con-4", "con-40", "con-41"],
    keywords: ["futura", "fecha", "planificar", "adelanto", "no permitido"],
  },
  {
    id: "con-34",
    section: "paciente-consultas",
    question: "¿Puedo adjuntar archivos a una consulta?",
    answer:
      "La consulta en sí no admite adjuntos directos dentro del acta. Para asociar documentos a la visita (analíticas, fotos, informes) súbelos en la pestaña Entregables con la misma fecha y, si quieres, referéncialos en Observaciones. De esa manera el archivo está localizable por el paciente y vinculado conceptualmente a la consulta.",
    related: ["con-9", "con-35", "con-37"],
    keywords: ["adjuntar", "archivos", "documentos", "subir", "ficheros"],
  },
  {
    id: "con-35",
    section: "paciente-consultas",
    question: "¿Dónde subo la analítica o el informe relacionado con la visita?",
    answer:
      "Las analíticas, informes médicos o imágenes se guardan en la pestaña Entregables del paciente. Desde ahí el paciente puede descargarlas si le compartes el acceso. En Observaciones de la consulta puedes anotar Analítica subida en Entregables para dejar constancia de que existe ese documento asociado a la visita.",
    related: ["con-34", "con-9", "con-38"],
    keywords: ["analítica", "informe", "entregables", "documento", "subir"],
  },
  {
    id: "con-36",
    section: "paciente-consultas",
    question: "¿Cómo consulto el historial clínico completo del paciente?",
    answer:
      "El historial clínico se construye recorriendo la pestaña Consultas (actas cronológicas) junto con Mediciones (evolución antropométrica) y Planificación (planes alimentarios entregados). Abriendo Consultas de más antigua a más reciente tienes el relato de toda la intervención. Las pestañas son complementarias: Consultas aporta el porqué y las otras aportan los datos objetivos.",
    related: ["con-1", "con-2", "con-15"],
    keywords: ["historial", "clínico", "completo", "cronológico", "evolución"],
  },
  {
    id: "con-37",
    section: "paciente-consultas",
    question: "¿Puedo imprimir una consulta?",
    answer:
      "No hay un botón directo de imprimir por consulta, pero puedes incluir las consultas en el PDF de Entregables o usar la función de imprimir del navegador (Cmd/Ctrl + P) con el detalle abierto. Si necesitas un informe formal, lo recomendable es generarlo desde Entregables, donde el formato queda más cuidado.",
    related: ["con-38", "con-34", "con-43"],
    keywords: ["imprimir", "papel", "pdf", "impresora", "print"],
  },
  {
    id: "con-38",
    section: "paciente-consultas",
    question: "¿Cómo exporto las consultas a un PDF para el paciente?",
    answer:
      "Ve a la pestaña Entregables del paciente y genera un informe incluyendo las secciones que quieras (mediciones, planes, y un resumen de consultas si el generador lo permite). El PDF resultante recoge el histórico en un formato presentable, pensado para enviar al paciente o archivarlo como documentación clínica.",
    related: ["con-37", "con-35", "con-43"],
    keywords: ["exportar", "pdf", "entregables", "informe", "descargar"],
  },
  {
    id: "con-39",
    section: "paciente-consultas",
    question: "¿Cómo marco una consulta como completada?",
    answer:
      "En Consultas no existe un estado de completada porque el simple hecho de registrarla ya implica que la visita ocurrió. El concepto de completada aplica a citas en la Agenda, donde cambias el estado de la cita confirmada a realizada. Cuando una cita se realiza, la buena práctica es crear su acta correspondiente aquí.",
    related: ["con-40", "con-41", "con-33"],
    keywords: ["completada", "realizada", "estado", "finalizada", "hecha"],
  },
  {
    id: "con-40",
    section: "paciente-consultas",
    question: "¿Cómo se relacionan las consultas con la Agenda?",
    answer:
      "La Agenda planifica las citas futuras del paciente y Consultas registra las visitas ya ocurridas. El flujo habitual es: primero agendar, después recibir al paciente y, por último, registrar la consulta aquí con las notas de lo sucedido. La Agenda no crea consultas automáticamente, pero marca el hueco temporal donde deben registrarse.",
    related: ["con-33", "con-41", "con-11"],
    keywords: ["agenda", "relación", "cita", "planificar", "flujo"],
  },
  {
    id: "con-41",
    section: "paciente-consultas",
    question: "¿Puedo convertir una cita confirmada en una consulta?",
    answer:
      "No hay un botón de convertir automático, pero el proceso es sencillo: cuando tengas lugar la cita, entra en la ficha del paciente, abre Consultas y pulsa Nueva consulta con la fecha de la cita. Los datos prácticamente coinciden, así que tardas muy poco. Es una buena costumbre hacerlo justo al terminar la visita para no olvidar detalles.",
    related: ["con-40", "con-3", "con-39"],
    keywords: ["convertir", "cita", "consulta", "confirmada", "realizar"],
  },
  {
    id: "con-42",
    section: "paciente-consultas",
    question: "¿Puede un paciente tener varias consultas el mismo día?",
    answer:
      "Sí. Puedes registrar más de una consulta en la misma fecha si realmente hubo dos visitas diferenciadas, aunque es poco habitual. En ese caso usa Observaciones y el motivo para distinguirlas (por ejemplo, una de Seguimiento por la mañana y una Revisión breve por la tarde). Ten cuidado con no duplicar por error la misma visita.",
    related: ["con-15", "con-4", "con-43"],
    keywords: ["varias", "mismo día", "duplicadas", "múltiples", "dos"],
  },
  {
    id: "con-43",
    section: "paciente-consultas",
    question: "¿Cómo detecto consultas duplicadas?",
    answer:
      "Como el listado está ordenado por fecha descendente, las duplicadas suelen aparecer consecutivas con la misma fecha y motivo muy parecido. Si detectas una duplicada, abre ambas y decide con cuál quedarte, o fusiona el texto de observaciones en una y borra la otra. Una buena práctica es revisar al final del día si te han quedado entradas repetidas.",
    related: ["con-42", "con-20", "con-18"],
    keywords: ["duplicadas", "repetidas", "detectar", "limpiar", "fusionar"],
  },
  {
    id: "con-44",
    section: "paciente-consultas",
    question: "¿Puedo filtrar consultas por motivo?",
    answer:
      "Sí. Sobre el listado hay un filtro por motivo que te permite mostrar solo las consultas iniciales, solo las de seguimiento o solo las de cierre, por ejemplo. Es útil para preparar una revisión anual o para auditar cuántas visitas de cada tipo has tenido con ese paciente. El filtro se combina con la búsqueda por texto.",
    related: ["con-28", "con-5", "con-22"],
    keywords: ["filtrar", "motivo", "tipo", "búsqueda", "filtro"],
  },
  {
    id: "con-45",
    section: "paciente-consultas",
    question: "¿El paciente ve las consultas desde el portal del paciente?",
    answer:
      "Por defecto el portal del paciente no muestra el listado de consultas internas del nutricionista, ya que son notas clínicas privadas. El paciente sí ve sus mediciones, dietas entregadas, citas en Agenda y entregables, pero no tus observaciones profesionales. Si quieres compartir un resumen, envíalo como mensaje o documento.",
    related: ["con-31", "con-32", "con-38"],
    keywords: ["portal", "paciente", "ver", "visible", "acceso"],
  },
  {
    id: "con-46",
    section: "paciente-consultas",
    question: "¿Qué es la notificación PACIENTE_SIN_CONSULTA?",
    answer:
      "PACIENTE_SIN_CONSULTA es una notificación automática que salta cuando un paciente lleva más de 30 días sin ninguna consulta registrada. Su objetivo es alertarte de posibles casos de abandono o de seguimientos que se están alargando demasiado. La verás en la campana de notificaciones del dashboard y desde ahí puedes entrar directamente a la ficha del paciente.",
    related: ["con-47", "con-1", "con-36"],
    keywords: ["notificación", "sin consulta", "30 días", "alerta", "abandono"],
  },
  {
    id: "con-47",
    section: "paciente-consultas",
    question: "¿Cuándo se marca como leída la notificación PACIENTE_SIN_CONSULTA?",
    answer:
      "En cuanto entras en la pestaña Consultas de ese paciente, la notificación asociada se marca como leída automáticamente. Registrar una nueva consulta reinicia además el contador de 30 días, por lo que la alerta no volverá a aparecer hasta que transcurra un nuevo mes sin visitas. Este comportamiento evita que tengas que gestionar las notificaciones a mano.",
    related: ["con-46", "con-3", "con-36"],
    keywords: ["marcar leída", "notificación", "entrar", "automática", "reset"],
  },
  {
    id: "con-48",
    section: "paciente-consultas",
    question: "¿Qué ocurre con las consultas si borro el paciente?",
    answer:
      "Si eliminas al paciente desde su ficha, todas sus consultas se borran en cascada junto con el resto de sus datos (mediciones, planes, entregables, mensajes). Es una acción irreversible y por eso exige confirmación con contraseña o texto. Si quieres preservar el histórico clínico antes de borrarlo, exporta primero un PDF desde Entregables.",
    related: ["con-20", "con-21", "con-38"],
    keywords: ["borrar paciente", "cascada", "eliminar", "perder", "histórico"],
  },
  {
    id: "con-49",
    section: "paciente-consultas",
    question: "¿Qué hago si he olvidado registrar varias consultas pasadas?",
    answer:
      "Puedes crearlas a posteriori eligiendo la fecha real de cada visita en el campo Fecha. No hay límite temporal hacia atrás, así que puedes completar el histórico aunque hayan pasado semanas. Rellena lo que recuerdes en Observaciones; cualquier dato es mejor que dejar el hueco vacío. El listado se ordenará automáticamente por fecha.",
    related: ["con-4", "con-33", "con-15"],
    keywords: ["pasadas", "atrasadas", "olvidadas", "retroactivo", "completar"],
  },
  {
    id: "con-50",
    section: "paciente-consultas",
    question: "¿Cuántas consultas se recomiendan para un seguimiento correcto?",
    answer:
      "La frecuencia depende de cada caso, pero como guía orientativa una consulta inicial, seguimientos cada 2 a 4 semanas durante los primeros meses y después revisiones mensuales o trimestrales funcionan bien para la mayoría de pacientes. Lo importante es registrar todas las visitas para que el histórico refleje la realidad del proceso y la notificación PACIENTE_SIN_CONSULTA te avise si se espacian demasiado.",
    related: ["con-46", "con-36", "con-22"],
    keywords: ["frecuencia", "recomendado", "cuántas", "periodicidad", "seguimiento"],
  },
];
