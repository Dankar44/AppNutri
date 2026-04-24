import type { HelpEntry } from "../types";

export const AGENDA_CITAS_ENTRIES: HelpEntry[] = [
  {
    id: "ac-1",
    section: "agenda-citas",
    question: "¿Cómo creo una nueva cita desde la Agenda?",
    answer:
      "Para crear una nueva cita ve a la ruta `/agenda/nueva` o pulsa el botón \"Nueva cita\" que aparece en la esquina superior derecha de la Agenda. Se abrirá un formulario donde debes rellenar los campos del paciente, fecha, hora, duración, motivo y notas. Al final del formulario eliges entre el modo \"directa\" (crea la cita confirmada) o \"proponer\" (envía una propuesta al paciente). Tras guardar, la cita aparece automáticamente en tu calendario y, si tienes Google Calendar conectado, se sincroniza en segundos.",
    related: ["ac-2", "ac-3", "ac-12"],
    keywords: ["crear", "nueva", "cita", "agenda"],
  },
  {
    id: "ac-2",
    section: "agenda-citas",
    question: "¿Qué campos tiene el formulario de nueva cita?",
    answer:
      "El formulario de `/agenda/nueva` incluye: selector de paciente, fecha, hora de inicio, duración en minutos (por defecto 30), motivo de la consulta, notas internas, un interruptor para marcarla como online (Google Meet) y un selector de modo (\"directa\" o \"proponer\"). Todos los campos tienen validación en tiempo real y algunos son obligatorios, como paciente, fecha y hora. El motivo es visible para el paciente en su portal; las notas, en cambio, son privadas. Antes de guardar, revisa la previsualización para evitar errores de horario.",
    related: ["ac-1", "ac-3", "ac-5"],
    keywords: ["campos", "formulario", "nueva", "cita"],
  },
  {
    id: "ac-3",
    section: "agenda-citas",
    question: "¿Cómo selecciono al paciente en la nueva cita?",
    answer:
      "En la parte superior del formulario encontrarás un selector tipo combobox donde puedes buscar pacientes por nombre o apellidos. La lista se filtra según escribes y solo muestra pacientes activos asignados a ti. Al seleccionar uno, su nombre aparece como chip y el resto del formulario se desbloquea. Si no encuentras al paciente, probablemente esté archivado o aún no lo hayas creado; en ese caso, ve primero a `/pacientes/nuevo` para darlo de alta.",
    related: ["ac-2", "ac-22", "ac-36"],
    keywords: ["paciente", "selector", "buscar", "asignar"],
  },
  {
    id: "ac-4",
    section: "agenda-citas",
    question: "¿Cómo elijo la fecha de la cita?",
    answer:
      "El campo fecha abre un date picker en formato español (dd/mm/aaaa) con la zona horaria de Madrid por defecto. No puedes seleccionar fechas pasadas; si intentas hacerlo, el formulario mostrará un error de validación y no dejará guardar. Los días en los que ya tienes citas aparecen marcados con un punto para ayudarte a distribuir mejor tu agenda. Puedes también teclear la fecha manualmente si prefieres no usar el calendario.",
    related: ["ac-5", "ac-14", "ac-45"],
    keywords: ["fecha", "calendario", "día", "picker"],
  },
  {
    id: "ac-5",
    section: "agenda-citas",
    question: "¿Cómo configuro la hora de inicio?",
    answer:
      "El campo hora se introduce en formato 24h (HH:mm) con incrementos de 15 minutos sugeridos en el desplegable. Puedes teclear la hora directamente o elegir un slot predefinido. La Agenda valida que la hora caiga dentro de tu horario laboral configurado en `/agenda/horario`; si no, verás un aviso suave pero podrás guardar igualmente. Ten en cuenta que todas las horas se guardan en zona horaria Europe/Madrid.",
    related: ["ac-4", "ac-14", "ac-16"],
    keywords: ["hora", "inicio", "horario", "slot"],
  },
  {
    id: "ac-6",
    section: "agenda-citas",
    question: "¿Cuál es la duración por defecto y cómo la cambio?",
    answer:
      "La duración por defecto es de 30 minutos, pensada para consultas de seguimiento habituales. Puedes modificarla en el campo duración introduciendo cualquier valor entre el mínimo y el máximo permitidos. Se recomienda usar múltiplos de 15 minutos (15, 30, 45, 60, 75, 90) para que los bloques encajen limpiamente en el grid de la vista semana. Si sueles hacer primeras visitas largas, puedes cambiar el default global en `/ajustes/perfil`.",
    related: ["ac-7", "ac-8", "ac-44"],
    keywords: ["duración", "default", "30", "minutos"],
  },
  {
    id: "ac-7",
    section: "agenda-citas",
    question: "¿Cuál es la duración mínima de una cita?",
    answer:
      "La duración mínima aceptada por el formulario es de 15 minutos. Si introduces un valor inferior, el campo mostrará un error y no permitirá guardar. Este límite evita citas residuales sin contenido real y ayuda a que los bloques encajen con el grid de la Agenda. Para consultas muy breves, lo habitual es usar 15 o 20 minutos; por debajo, probablemente no sea una cita sino una llamada rápida o un mensaje.",
    related: ["ac-6", "ac-8", "ac-44"],
    keywords: ["duración", "mínima", "15", "minutos"],
  },
  {
    id: "ac-8",
    section: "agenda-citas",
    question: "¿Cuál es la duración máxima de una cita?",
    answer:
      "La duración máxima admitida es de 180 minutos (3 horas), suficiente para primeras visitas exhaustivas o evaluaciones iniciales completas. Si introduces un valor superior, el formulario mostrará un error de validación. En la práctica, la mayoría de consultas se mantienen entre 30 y 60 minutos; sobrepasar dos horas es poco habitual y sólo tiene sentido en evaluaciones muy profundas. Para sesiones grupales o talleres, considera usar la funcionalidad específica en vez de una cita individual.",
    related: ["ac-6", "ac-7", "ac-44"],
    keywords: ["duración", "máxima", "180", "minutos"],
  },
  {
    id: "ac-9",
    section: "agenda-citas",
    question: "¿Qué escribo en el campo motivo?",
    answer:
      "El motivo es una descripción breve de la razón de la cita: \"Primera visita\", \"Seguimiento mensual\", \"Revisión tras plan\", etc. Este campo es visible para el paciente en su portal, así que escríbelo con un tono claro y respetuoso. Procura mantenerlo corto (menos de 80 caracteres) para que se lea bien en las tarjetas de la Agenda. Si necesitas apuntar información más detallada o privada, usa el campo notas, que no es visible para el paciente.",
    related: ["ac-10", "ac-41", "ac-42"],
    keywords: ["motivo", "descripción", "visible", "paciente"],
  },
  {
    id: "ac-10",
    section: "agenda-citas",
    question: "¿Qué escribo en el campo notas?",
    answer:
      "El campo notas es un espacio privado para tus apuntes internos sobre la cita: recordatorios previos, preguntas a hacer, material a preparar o detalles clínicos relevantes. No se muestra al paciente bajo ningún concepto, ni en su portal ni en recordatorios. Puedes escribir texto libre sin límite estricto y consultarlo desde el detalle de la cita cuando llegue el momento. Es un apoyo útil para preparar la consulta sin saturar el historial clínico.",
    related: ["ac-9", "ac-41", "ac-42"],
    keywords: ["notas", "privado", "interno", "apuntes"],
  },
  {
    id: "ac-11",
    section: "agenda-citas",
    question: "¿Cómo marco una cita como online con Google Meet?",
    answer:
      "En el formulario encontrarás un interruptor llamado \"Cita online\" o \"isOnline\". Al activarlo, la cita se marcará como telemática y, si tienes Google Calendar conectado, se generará automáticamente un enlace de Google Meet al sincronizar. El enlace aparece en el detalle de la cita y también se envía al paciente en su portal. Si no tienes Google conectado, la cita se marcará como online pero deberás indicar el enlace manualmente en las notas o por mensaje.",
    related: ["ac-28", "ac-29", "ac-19"],
    keywords: ["online", "meet", "google", "telemática"],
  },
  {
    id: "ac-12",
    section: "agenda-citas",
    question: "¿Qué diferencia hay entre modo \"directa\" y \"proponer\"?",
    answer:
      "El modo \"directa\" crea la cita ya confirmada (estado CONFIRMADA), como si tú y el paciente ya hubierais acordado el horario. El modo \"proponer\" crea una cita pendiente (estado PENDIENTE con origen DIETISTA) y envía una notificación al paciente para que la acepte, rechace o contraproponga desde su portal. Usa \"directa\" cuando ya has hablado con el paciente o cuando reprogramas algo acordado; usa \"proponer\" cuando sugieres un hueco que el paciente aún no ha validado. La diferencia afecta al flujo, no al contenido.",
    related: ["ac-13", "ac-33", "ac-34"],
    keywords: ["modo", "directa", "proponer", "diferencia"],
  },
  {
    id: "ac-13",
    section: "agenda-citas",
    question: "¿Qué pasa cuando uso el modo \"proponer\"?",
    answer:
      "Al usar el modo \"proponer\", la cita se crea en estado PENDIENTE con origen DIETISTA, lo que la distingue de una solicitud hecha por el paciente. El paciente recibe una notificación de tipo CITA_SOLICITADA en su portal con el detalle de tu propuesta y tres opciones: aceptar, rechazar o contraproponer otro horario. Hasta que responda, la cita figura como pendiente en tu Agenda pero no bloquea definitivamente el slot. Si no responde en un plazo razonable, puedes enviarle un mensaje recordatorio o cancelar la propuesta.",
    related: ["ac-12", "ac-15", "ac-34"],
    keywords: ["proponer", "pendiente", "notificación", "paciente"],
  },
  {
    id: "ac-14",
    section: "agenda-citas",
    question: "¿Qué validaciones aplica el formulario al guardar?",
    answer:
      "Antes de guardar, el formulario valida varios puntos: la fecha no puede estar en el pasado, la hora debe caer en un slot válido, la duración debe estar entre el mínimo y máximo permitidos y no debe haber solape con otra cita confirmada en el mismo tramo. También avisa (pero no bloquea) si la hora cae fuera de tu horario laboral. Si alguna validación falla, el botón \"Guardar\" queda deshabilitado y aparece el mensaje de error junto al campo problemático.",
    related: ["ac-4", "ac-15", "ac-16"],
    keywords: ["validaciones", "errores", "fecha", "solape"],
  },
  {
    id: "ac-15",
    section: "agenda-citas",
    question: "¿Qué pasa si hay solape con otra cita?",
    answer:
      "Si la fecha y hora que eliges solapan con otra cita confirmada existente, el formulario mostrará un error rojo con el detalle de la cita conflictiva (paciente y horario). No podrás guardar hasta resolver el conflicto, bien cambiando la hora, bien ajustando la duración para que no se toquen. Los solapes con citas pendientes generan un aviso suave pero sí permiten guardar, ya que esas aún pueden cancelarse. Esta validación evita dobles reservas accidentales.",
    related: ["ac-14", "ac-4", "ac-5"],
    keywords: ["solape", "conflicto", "doble", "validación"],
  },
  {
    id: "ac-16",
    section: "agenda-citas",
    question: "¿Qué ocurre si la cita cae fuera de mi horario laboral?",
    answer:
      "Si la hora elegida cae fuera del horario laboral que has configurado en `/agenda/horario`, el formulario muestra un aviso amarillo indicándolo, pero te permite guardar igualmente. Esto es útil para citas puntuales fuera de tu horario habitual (tardes, fines de semana, casos urgentes) sin forzarte a cambiar tu configuración permanente. Si ves este aviso con frecuencia, plantéate actualizar tu horario laboral real para que la validación refleje mejor tu rutina.",
    related: ["ac-14", "ac-5", "ac-4"],
    keywords: ["horario", "laboral", "fuera", "aviso"],
  },
  {
    id: "ac-17",
    section: "agenda-citas",
    question: "¿Cómo sincroniza la cita con Google Calendar tras crearla?",
    answer:
      "Si tienes Google Calendar conectado en `/ajustes/integraciones`, la cita se sincroniza automáticamente al guardar, normalmente en menos de 5 segundos. Aparece en tu calendario de Google con el título, la duración y, si es online, un enlace de Meet generado. Cualquier edición posterior en Annonia se propaga también a Google, y viceversa si has activado la sincronización bidireccional. Si Google no está conectado, la cita se guarda solo en Annonia sin ningún error.",
    related: ["ac-11", "ac-28", "ac-29"],
    keywords: ["sincronización", "google", "calendar", "automática"],
  },
  {
    id: "ac-18",
    section: "agenda-citas",
    question: "¿Puedo crear una cita desde el dashboard?",
    answer:
      "Sí, en el dashboard principal hay una tarjeta de accesos rápidos con un botón \"Nueva cita\" que te lleva directamente al formulario `/agenda/nueva`. Es útil cuando, al entrar por la mañana, decides agendar una consulta sin pasar por la Agenda completa. También puedes llegar desde la tarjeta de próximas citas pulsando el icono de suma. El formulario que se abre es exactamente el mismo que desde la Agenda, sin diferencias funcionales.",
    related: ["ac-1", "ac-22", "ac-36"],
    keywords: ["dashboard", "accesos", "rápidos", "nueva"],
  },
  {
    id: "ac-19",
    section: "agenda-citas",
    question: "¿Puedo crear una cita desde la ficha del paciente?",
    answer:
      "Sí, dentro de la ficha de un paciente en `/pacientes/[id]` hay un botón \"Nueva cita\" que abre el formulario con el paciente ya preseleccionado. Es el flujo más cómodo cuando estás revisando el historial de alguien y decides agendar su próxima visita. Los demás campos (fecha, hora, duración, motivo) se rellenan igual que en el flujo general. Al guardar, vuelves a la ficha del paciente y la nueva cita aparece en su lista de próximas consultas.",
    related: ["ac-18", "ac-1", "ac-22"],
    keywords: ["ficha", "paciente", "nueva", "cita"],
  },
  {
    id: "ac-20",
    section: "agenda-citas",
    question: "¿Cómo edito una cita ya creada?",
    answer:
      "Para editar una cita existente, pulsa sobre ella en la Agenda para abrir el modal de detalle, y dentro verás un botón \"Editar\" que despliega el formulario con los campos actuales. Puedes cambiar fecha, hora, duración, motivo, notas y modo online sin tener que borrar y recrear. Al guardar, los cambios se propagan a Google Calendar (si está conectado) y se notifica al paciente si la cita ya estaba confirmada. No puedes editar citas completadas ni canceladas: para esas, crea una nueva.",
    related: ["ac-21", "ac-24", "ac-35"],
    keywords: ["editar", "modificar", "cita", "cambiar"],
  },
  {
    id: "ac-21",
    section: "agenda-citas",
    question: "¿Cómo cancelo una cita desde el detalle?",
    answer:
      "Abre el modal de detalle de la cita pulsando sobre ella y busca el botón rojo \"Cancelar cita\". Al pulsarlo, el sistema te pide confirmación y, opcionalmente, un motivo de cancelación que se comparte con el paciente. Tras confirmar, la cita pasa a estado CANCELADA, desaparece del grid principal (pero queda en el historial) y el paciente recibe una notificación. Si estaba sincronizada con Google Calendar, también se elimina del calendario externo.",
    related: ["ac-20", "ac-23", "ac-25"],
    keywords: ["cancelar", "cita", "detalle", "estado"],
  },
  {
    id: "ac-22",
    section: "agenda-citas",
    question: "¿Cómo marco una cita como completada tras realizarla?",
    answer:
      "Cuando termines una consulta, abre el detalle de la cita y pulsa el botón \"Marcar como completada\". La cita pasa a estado COMPLETADA y queda fuera del calendario activo pero disponible en el historial del paciente. Al hacerlo, Annonia te sugiere registrar medidas, entregar un plan o enviar un resumen al paciente, enlazando con los siguientes pasos típicos tras una consulta. Mantener las citas bien cerradas te da estadísticas fiables en el dashboard.",
    related: ["ac-21", "ac-20", "ac-18"],
    keywords: ["completada", "terminada", "realizada", "cerrar"],
  },
  {
    id: "ac-23",
    section: "agenda-citas",
    question: "¿Cómo reprogramo una cita a otra fecha u hora?",
    answer:
      "Reprogramar una cita es tan simple como editarla: abre el detalle, pulsa \"Editar\" y cambia la fecha y/o la hora al nuevo slot deseado. Annonia valida que el nuevo horario no solape con otras citas ni caiga en el pasado. Al guardar, el paciente recibe una notificación informándole del cambio y, si está activada la sincronización, Google Calendar se actualiza automáticamente. En la vista semana puedes también arrastrar la cita a otro slot para reprogramarla rápidamente.",
    related: ["ac-20", "ac-21", "ac-14"],
    keywords: ["reprogramar", "mover", "cambiar", "fecha"],
  },
  {
    id: "ac-24",
    section: "agenda-citas",
    question: "¿Cómo hago una contrapropuesta a una solicitud del paciente?",
    answer:
      "Cuando un paciente te envía una solicitud (estado PENDIENTE con origen PACIENTE), abre el detalle y verás tres botones: aceptar, rechazar y contraproponer. Si el horario que pide no te encaja, pulsa \"Contraponer\" para abrir un formulario pequeño donde eliges una nueva fecha y hora. Al enviar la contrapropuesta, la cita pasa a estado CONTRAPROPUESTA y el paciente recibe una notificación para que acepte, rechace o vuelva a contraproner. Es el mecanismo ideal para negociar horarios sin intercambio de mensajes.",
    related: ["ac-25", "ac-26", "ac-32"],
    keywords: ["contrapropuesta", "contraponer", "solicitud", "paciente"],
  },
  {
    id: "ac-25",
    section: "agenda-citas",
    question: "¿Cómo es el formulario de contrapropuesta?",
    answer:
      "Es un formulario compacto con dos campos principales: nueva fecha y nueva hora. Puedes también modificar la duración si lo consideras necesario, aunque lo habitual es mantenerla igual que la solicitud original. Hay un campo opcional de comentario para explicar al paciente por qué propones otro horario, que aparecerá en su notificación. Al enviar, la cita cambia a estado CONTRAPROPUESTA y queda a la espera de la decisión del paciente.",
    related: ["ac-24", "ac-26", "ac-32"],
    keywords: ["contrapropuesta", "formulario", "campos", "comentario"],
  },
  {
    id: "ac-26",
    section: "agenda-citas",
    question: "¿Cómo acepto una solicitud del paciente tal cual?",
    answer:
      "Si el horario que pide el paciente te viene bien, abre el detalle de la solicitud y pulsa el botón \"Aceptar\". La cita pasa inmediatamente de PENDIENTE a CONFIRMADA y el paciente recibe una notificación confirmando el horario. Si tienes Google Calendar conectado, la cita se sincroniza también en ese momento generando, si aplica, el enlace de Meet. Es el flujo más rápido y el más frecuente cuando el paciente pide un hueco razonable dentro de tu horario laboral.",
    related: ["ac-24", "ac-27", "ac-34"],
    keywords: ["aceptar", "solicitud", "confirmar", "paciente"],
  },
  {
    id: "ac-27",
    section: "agenda-citas",
    question: "¿Cómo rechazo una solicitud del paciente con motivo?",
    answer:
      "Abre el detalle de la solicitud y pulsa \"Rechazar\". Aparecerá un pequeño formulario donde puedes (y debes) escribir un motivo breve: \"No tengo hueco esa semana\", \"Propón otro día\", etc. Al confirmar, la cita pasa a CANCELADA y el paciente recibe una notificación con tu motivo para que entienda la decisión y pueda solicitar otro horario. Rechazar con motivo es más respetuoso que rechazar en silencio y mejora la relación con el paciente; si simplemente no te encaja el horario, suele ser mejor contraponer en vez de rechazar.",
    related: ["ac-24", "ac-26", "ac-33"],
    keywords: ["rechazar", "motivo", "solicitud", "cancelar"],
  },
  {
    id: "ac-28",
    section: "agenda-citas",
    question: "¿Se notifica al paciente de los cambios en la cita?",
    answer:
      "Sí, cada cambio relevante en la cita genera una notificación al paciente: confirmación, cancelación, reprogramación, contrapropuesta o marcado como completada. Las notificaciones llegan a su portal en tiempo real y, si tiene email habilitado, también por correo electrónico. En cambio, editar únicamente las notas internas (privadas) no genera notificación, ya que el paciente no ve esos campos. Esto mantiene al paciente informado sin saturarle con alertas innecesarias.",
    related: ["ac-13", "ac-21", "ac-23"],
    keywords: ["notificación", "paciente", "cambios", "avisar"],
  },
  {
    id: "ac-29",
    section: "agenda-citas",
    question: "¿Cómo se genera el enlace de Google Meet automáticamente?",
    answer:
      "Si la cita tiene el interruptor isOnline activado y tienes Google Calendar conectado, al sincronizarse el sistema crea un evento en Calendar con conferencia Meet, y Google genera un enlace único. Ese enlace se guarda en la cita y aparece en el detalle tanto para ti como para el paciente. No tienes que hacer nada manual: el flujo es automático en unos segundos tras guardar. Si Google no está conectado, isOnline marca la cita como online pero no genera enlace; deberás añadirlo manualmente.",
    related: ["ac-11", "ac-17", "ac-30"],
    keywords: ["meet", "enlace", "automático", "google"],
  },
  {
    id: "ac-30",
    section: "agenda-citas",
    question: "¿Dónde veo el enlace de Google Meet de la cita?",
    answer:
      "En el modal de detalle de la cita, dentro de la Agenda, verás una sección \"Videollamada\" con el enlace Meet visible y un botón para copiarlo o abrirlo. El paciente lo ve en el detalle de la cita en su portal, en `/paciente/portal/citas`. También se envía por correo si tiene activadas las notificaciones por email. Si no ves el enlace cuando debería estar, probablemente la sincronización con Google esté en curso o haya fallado; revisa `/ajustes/integraciones` para confirmar.",
    related: ["ac-11", "ac-29", "ac-31"],
    keywords: ["meet", "enlace", "detalle", "ver"],
  },
  {
    id: "ac-31",
    section: "agenda-citas",
    question: "¿Cómo ve el paciente la cita en su portal?",
    answer:
      "El paciente ve sus citas en la ruta `/paciente/portal/citas` y también como tarjeta destacada en el dashboard de su portal si la cita es inminente. Ve la fecha, hora, duración, motivo, estado y, si aplica, el enlace de Meet. No tiene acceso a las notas internas del nutricionista, solo al motivo y a los datos visibles. Puede filtrar por estado para separar próximas, pendientes, completadas y canceladas, lo que le ayuda a hacer seguimiento sin perder citas pasadas.",
    related: ["ac-28", "ac-32", "ac-30"],
    keywords: ["paciente", "portal", "ver", "citas"],
  },
  {
    id: "ac-32",
    section: "agenda-citas",
    question: "¿Qué puede hacer el paciente desde su portal con una cita?",
    answer:
      "Desde `/paciente/portal/citas`, el paciente puede solicitar nuevas citas, aceptar o rechazar las que le propongas, contraproner otro horario si el tuyo no le encaja y cancelar una cita confirmada si no va a poder asistir. Cada acción genera una notificación hacia ti para mantener el flujo transparente. El paciente no puede, sin embargo, editar el motivo ni las notas de una cita creada por ti; solo puede reaccionar al horario y al estado. Este diseño evita cambios unilaterales y mantiene el control clínico.",
    related: ["ac-31", "ac-24", "ac-26"],
    keywords: ["paciente", "portal", "acciones", "gestión"],
  },
  {
    id: "ac-33",
    section: "agenda-citas",
    question: "¿Cuál es el ciclo de estados de una cita?",
    answer:
      "El ciclo típico es: PENDIENTE → CONFIRMADA → COMPLETADA, que es el camino feliz. Desde PENDIENTE, la cita también puede derivar a CONTRAPROPUESTA (si tú o el paciente proponéis otro horario) o a CANCELADA (si alguien la rechaza). Desde CONFIRMADA, puede acabar también en CANCELADA si surge un imprevisto. El estado COMPLETADA es final y se alcanza al marcarla como realizada. Conocer estos estados ayuda a interpretar los colores y etiquetas en la Agenda.",
    related: ["ac-34", "ac-12", "ac-22"],
    keywords: ["ciclo", "estados", "flujo", "cita"],
  },
  {
    id: "ac-34",
    section: "agenda-citas",
    question: "¿Qué significa PENDIENTE con origen PACIENTE frente a origen DIETISTA?",
    answer:
      "Cuando una cita está en estado PENDIENTE, su origen indica quién la inició. Origen PACIENTE significa que el paciente te la solicitó desde su portal y tú debes aceptar, rechazar o contraponer. Origen DIETISTA significa que tú se la propusiste con el modo \"proponer\" y es el paciente quien debe responder. La Agenda distingue ambos con iconos y etiquetas diferentes, para que identifiques rápidamente qué acción esperas de quién. Esta distinción es clave para no perder solicitudes ni dejar propuestas sin respuesta.",
    related: ["ac-33", "ac-13", "ac-12"],
    keywords: ["pendiente", "origen", "paciente", "dietista"],
  },
  {
    id: "ac-35",
    section: "agenda-citas",
    question: "¿Puedo editar una cita completada o cancelada?",
    answer:
      "No, las citas en estado COMPLETADA o CANCELADA son inmutables y no se pueden editar. Esto preserva la integridad del historial clínico y evita modificaciones retroactivas que podrían confundir el seguimiento. Si necesitas registrar algo tras una cita completada, hazlo en la ficha del paciente (medidas, notas clínicas, plan) en lugar de editar la cita original. Si cancelaste por error y quieres rehacer, crea una nueva cita con los datos correctos.",
    related: ["ac-20", "ac-21", "ac-22"],
    keywords: ["editar", "completada", "cancelada", "inmutable"],
  },
  {
    id: "ac-36",
    section: "agenda-citas",
    question: "¿Puedo agendar una cita con un paciente archivado?",
    answer:
      "No directamente: el selector de paciente en `/agenda/nueva` solo muestra pacientes activos. Si necesitas agendar con alguien archivado (por ejemplo, porque retoma tratamiento), primero desarchívalo desde `/pacientes` usando el filtro de archivados y el botón correspondiente. Una vez vuelva a estar activo, aparecerá en el selector y podrás crearle citas con normalidad. Este diseño evita agendar accidentalmente con perfiles que ya no sigues.",
    related: ["ac-3", "ac-19", "ac-18"],
    keywords: ["archivado", "paciente", "agendar", "activo"],
  },
  {
    id: "ac-37",
    section: "agenda-citas",
    question: "¿Qué pasa si creo una cita en el pasado por error?",
    answer:
      "El formulario bloquea la creación de citas con fecha anterior al momento actual: verás un mensaje de error claro y el botón \"Guardar\" quedará deshabilitado. Esta validación evita registros retroactivos que falsearían las estadísticas y el calendario. Si necesitas anotar una consulta que ya realizaste pero no estaba registrada, usa el registro de consultas pasadas en la ficha del paciente, no el formulario de nueva cita. Así mantienes la Agenda limpia y los datos coherentes.",
    related: ["ac-4", "ac-14", "ac-22"],
    keywords: ["pasado", "fecha", "error", "validación"],
  },
  {
    id: "ac-38",
    section: "agenda-citas",
    question: "¿Hay recordatorios automáticos para las citas?",
    answer:
      "De momento Annonia no envía recordatorios automáticos antes de la cita (ni al paciente ni al nutricionista); es una funcionalidad en el roadmap pero aún no disponible. Mientras tanto, puedes apoyarte en Google Calendar (si lo tienes conectado) que sí dispara sus notificaciones nativas unos minutos antes. También puedes enviar mensajes manuales al paciente el día previo para confirmar asistencia. Cuando esté disponible el recordatorio automático lo anunciaremos en la sección de novedades.",
    related: ["ac-17", "ac-28", "ac-31"],
    keywords: ["recordatorio", "automático", "aviso", "previo"],
  },
  {
    id: "ac-39",
    section: "agenda-citas",
    question: "¿Por qué se recomiendan duraciones múltiplos de 15 minutos?",
    answer:
      "Aunque técnicamente puedes poner cualquier duración entre el mínimo y el máximo, se recomienda usar múltiplos de 15 minutos (15, 30, 45, 60, 75, 90, etc.) por dos razones. Primero, los slots de la vista semana están pintados en franjas de 15 minutos, así que los bloques encajan limpiamente y son más legibles. Segundo, duraciones redondas facilitan la planificación mental y la coordinación con el paciente. Duraciones tipo 37 o 53 minutos son legales pero se verán peor en el grid.",
    related: ["ac-6", "ac-7", "ac-8"],
    keywords: ["duración", "múltiplos", "15", "recomendado"],
  },
  {
    id: "ac-40",
    section: "agenda-citas",
    question: "¿En qué zona horaria se guardan las citas?",
    answer:
      "Todas las citas se guardan y muestran en zona horaria Europe/Madrid por defecto, independientemente del dispositivo desde el que las crees. Esto evita desajustes si viajas o si el paciente está en una zona distinta. Si en el futuro se añade soporte multi-zona, se configurará por paciente. Mientras tanto, si tienes un paciente en otro huso horario, conviene aclararle la hora de Madrid en el motivo o por mensaje para evitar malentendidos.",
    related: ["ac-5", "ac-4", "ac-17"],
    keywords: ["zona", "horaria", "madrid", "timezone"],
  },
  {
    id: "ac-41",
    section: "agenda-citas",
    question: "¿El motivo de la cita lo ve el paciente?",
    answer:
      "Sí, el motivo es un campo visible para el paciente: aparece en su portal `/paciente/portal/citas`, en las notificaciones relacionadas y en el email si está activo. Por eso es importante que uses un tono claro, respetuoso y profesional al redactarlo. Nada de abreviaturas internas tipo \"pac. complicado\" o comentarios poco cuidados: cualquier cosa que escribas aquí puede leerla el paciente. Para información que quieras mantener privada, usa el campo notas.",
    related: ["ac-9", "ac-42", "ac-31"],
    keywords: ["motivo", "visible", "paciente", "portal"],
  },
  {
    id: "ac-42",
    section: "agenda-citas",
    question: "¿Las notas de la cita son privadas?",
    answer:
      "Sí, el campo notas es estrictamente privado del nutricionista y no se comparte con el paciente en ningún canal: ni portal, ni email, ni notificaciones. Es el lugar adecuado para apuntes clínicos sensibles, recordatorios personales o información contextual que no debe salir de tu control. Aun así, trátalo con el cuidado habitual de cualquier dato personal, especialmente si contiene información sanitaria, por cumplimiento con la normativa de protección de datos.",
    related: ["ac-10", "ac-41", "ac-9"],
    keywords: ["notas", "privadas", "nutricionista", "interno"],
  },
  {
    id: "ac-43",
    section: "agenda-citas",
    question: "¿Puedo cambiar el modo de una cita después de crearla?",
    answer:
      "No directamente: el modo \"directa\" o \"proponer\" solo aplica en el momento de la creación y determina el estado inicial (CONFIRMADA o PENDIENTE). Una vez creada, el cambio de estado ocurre mediante acciones específicas: aceptar, rechazar, cancelar, completar o contraproner. Si propusiste una cita y quieres pasarla directamente a confirmada sin esperar al paciente, no es posible por diseño: el paciente debe dar el visto bueno. Si te urge, cancela la propuesta y crea una nueva en modo \"directa\" si ya hablaste con él.",
    related: ["ac-12", "ac-13", "ac-33"],
    keywords: ["modo", "cambiar", "después", "estado"],
  },
  {
    id: "ac-44",
    section: "agenda-citas",
    question: "¿Puedo definir un default de duración distinto a 30 min?",
    answer:
      "Sí, en `/ajustes/perfil` hay una opción para cambiar la duración por defecto de nuevas citas. Por defecto está en 30 minutos, que es el estándar más común para seguimientos, pero si haces mayoritariamente primeras visitas largas puedes subirla a 60 o 90 minutos. El valor configurado aparece precargado en el formulario de nueva cita, aunque siempre puedes sobreescribirlo por cita. Este ajuste es personal y no afecta a otros usuarios del sistema.",
    related: ["ac-6", "ac-7", "ac-8"],
    keywords: ["default", "duración", "configuración", "perfil"],
  },
  {
    id: "ac-45",
    section: "agenda-citas",
    question: "¿Qué hago si la cita creada no aparece en mi Agenda?",
    answer:
      "Si acabas de guardar una cita y no la ves en el grid, revisa primero los filtros activos de la Agenda: puede que esté ocultando estados como pendientes o canceladas. Comprueba también que estás mirando la semana correcta, no la actual si la cita era para otra fecha. Si persiste, refresca la página y vuelve a comprobar; en casos raros la sincronización con Google puede devolver un error visible en `/ajustes/integraciones`. Si el problema sigue, abre el chat de soporte con la fecha exacta de la cita para investigar.",
    related: ["ac-17", "ac-14", "ac-4"],
    keywords: ["no", "aparece", "problema", "agenda"],
  },
];
