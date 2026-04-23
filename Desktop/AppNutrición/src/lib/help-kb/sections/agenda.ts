import type { HelpEntry } from "../types";

export const AGENDA_ENTRIES: HelpEntry[] = [
  {
    id: "ag-1",
    section: "agenda",
    question: "¿Qué es la sección Agenda de AppNutrición?",
    answer:
      "La Agenda es la sección donde gestionas todas las citas con tus pacientes, accesible en la ruta `/agenda` del panel del nutricionista. Te permite ver, crear, reprogramar, cancelar y completar consultas desde tres vistas distintas: semana, mes y día. Funciona como un calendario interactivo con soporte para citas presenciales y online a través de Google Meet. Es el punto central donde se cruzan las citas creadas por ti y las solicitudes enviadas por tus pacientes desde su portal.",
    related: ["ag-2", "ag-3", "ag-11"],
    keywords: ["agenda", "citas", "calendario", "consultas"],
  },
  {
    id: "ag-2",
    section: "agenda",
    question: "¿Para qué sirve la Agenda en mi día a día?",
    answer:
      "Sirve para organizar tu jornada como nutricionista: saber a quién atiendes, cuándo y dónde, y reaccionar a las solicitudes de consulta que llegan desde el portal del paciente. También te permite marcar citas como completadas al terminar, añadir notas y enlazar cada consulta con la ficha clínica correspondiente. Al estar sincronizada con Google Calendar y Meet, evita la doble gestión y garantiza que todos tus dispositivos muestren lo mismo. En la práctica, es tu centro de operaciones diario.",
    related: ["ag-1", "ag-51", "ag-55"],
    keywords: ["uso", "día", "productividad", "organización"],
  },
  {
    id: "ag-3",
    section: "agenda",
    question: "¿Cómo accedo a la Agenda?",
    answer:
      "Desde el sidebar izquierdo del panel del nutricionista encontrarás el icono de calendario con la etiqueta \"Agenda\". Al hacer clic te lleva a `/agenda` mostrando por defecto la vista semana centrada en la semana actual. También puedes entrar desde el dashboard haciendo clic en la tarjeta de próxima consulta, o desde una notificación relacionada con una cita. En móvil, abre primero el menú lateral con el botón de hamburguesa.",
    related: ["ag-1", "ag-4", "ag-19"],
    keywords: ["acceso", "ruta", "sidebar", "navegación"],
  },
  {
    id: "ag-4",
    section: "agenda",
    question: "¿Qué vistas tiene la Agenda?",
    answer:
      "La Agenda ofrece tres vistas diferentes: semana (por defecto), mes y día. La vista semana muestra un grid con los siete días y franjas horarias, ideal para ver la carga de trabajo general. La vista mes muestra un calendario mensual con contadores de citas por día, perfecta para visión panorámica. La vista día ofrece un listado detallado con toda la información de las citas de una jornada concreta. Puedes cambiar entre ellas en cualquier momento desde el selector superior.",
    related: ["ag-1", "ag-5", "ag-6", "ag-7"],
    keywords: ["vistas", "semana", "mes", "día"],
  },
  {
    id: "ag-5",
    section: "agenda",
    question: "¿Cómo es la vista semana?",
    answer:
      "La vista semana es un grid con los días de lunes a domingo en columnas y las horas en filas. Cada cita aparece como un bloque coloreado en su franja horaria, con el nombre del paciente y la hora de inicio. Es la vista por defecto al abrir la Agenda y la más utilizada porque permite ver la distribución completa de tu semana de un vistazo. Al hacer clic en cualquier día se abre un panel lateral con el detalle de ese día.",
    related: ["ag-4", "ag-6", "ag-30", "ag-38"],
    keywords: ["semana", "grid", "slots", "vista"],
  },
  {
    id: "ag-6",
    section: "agenda",
    question: "¿Cómo es la vista mes?",
    answer:
      "La vista mes muestra un calendario mensual clásico con una celda por cada día. Dentro de cada celda ves un contador del número de citas y, si hay espacio, una lista resumida con las primeras. Es útil para planificar a medio plazo, detectar semanas sobrecargadas o vacías y moverse rápidamente a una fecha concreta. Al pulsar sobre un día, se abre un panel lateral con el detalle completo de esa jornada.",
    related: ["ag-4", "ag-5", "ag-31", "ag-32"],
    keywords: ["mes", "calendario", "contadores", "vista"],
  },
  {
    id: "ag-7",
    section: "agenda",
    question: "¿Cómo es la vista día?",
    answer:
      "La vista día ofrece un listado vertical con todas las citas de una jornada concreta, ordenadas por hora. Cada cita se muestra con paciente, hora, duración, motivo, estado y notas, sin compresión. Es la vista ideal cuando estás a punto de empezar tu jornada o cuando quieres revisar exhaustivamente el día. Al final de la pantalla puedes ver un pequeño resumen con el total de citas del día y su estado.",
    related: ["ag-4", "ag-5", "ag-6", "ag-33"],
    keywords: ["día", "listado", "detalle", "vista"],
  },
  {
    id: "ag-8",
    section: "agenda",
    question: "¿Cómo cambio entre las tres vistas?",
    answer:
      "En la parte superior de la Agenda hay un selector con tres botones: Semana, Mes y Día. Al hacer clic en uno, la URL cambia añadiendo el parámetro `?vista=semana`, `?vista=mes` o `?vista=dia` y se actualiza el contenido. Esto significa que puedes guardar un enlace concreto de una vista en favoritos o compartirlo. La vista por defecto, si no especificas nada, es la semana.",
    related: ["ag-4", "ag-5", "ag-6", "ag-7"],
    keywords: ["cambiar", "vista", "selector", "parámetro"],
  },
  {
    id: "ag-9",
    section: "agenda",
    question: "¿Cómo me muevo entre semanas, meses o días?",
    answer:
      "Encima del calendario tienes tres botones de navegación: una flecha izquierda para ir al periodo anterior, una flecha derecha para ir al siguiente y un botón \"Hoy\" para volver al día actual. En vista semana avanzas de semana en semana, en vista mes de mes en mes y en vista día de jornada en jornada. El título central siempre indica el periodo que estás viendo. Si te pierdes navegando, pulsa \"Hoy\" para centrarte otra vez en la fecha actual.",
    related: ["ag-4", "ag-10", "ag-49"],
    keywords: ["navegar", "anterior", "siguiente", "hoy"],
  },
  {
    id: "ag-10",
    section: "agenda",
    question: "¿Qué hace el botón \"Hoy\"?",
    answer:
      "El botón \"Hoy\" te devuelve al periodo que contiene la fecha actual, manteniendo la vista en la que estés. Si estás en vista semana, te lleva a la semana actual; si estás en vista mes, al mes actual; y en vista día, al día de hoy. Es especialmente útil cuando has navegado varias semanas o meses adelante o atrás y quieres volver sin contar clics. Además, resalta visualmente la celda del día actual para que se vea a primera vista.",
    related: ["ag-9", "ag-19"],
    keywords: ["hoy", "actual", "botón", "volver"],
  },
  {
    id: "ag-11",
    section: "agenda",
    question: "¿Cómo creo una nueva cita?",
    answer:
      "Pulsa el botón \"+ Nueva cita\" que aparece en la parte superior derecha de la Agenda y se abrirá un formulario modal. Rellena el paciente, la fecha, la hora de inicio, la duración, el motivo y, opcionalmente, notas internas y si la cita es online. Al guardar, la cita se crea con estado CONFIRMADA si la creas tú (origen DIETISTA) y aparece inmediatamente en el calendario. Si tienes Google Calendar conectado, también se sincroniza automáticamente.",
    related: ["ag-12", "ag-13", "ag-14", "ag-55"],
    keywords: ["crear", "nueva", "cita", "formulario"],
  },
  {
    id: "ag-12",
    section: "agenda",
    question: "¿Qué campos tiene el formulario de nueva cita?",
    answer:
      "El formulario de nueva cita incluye: paciente (selector con buscador sobre tus pacientes activos), fecha, hora de inicio, duración en minutos, motivo de la consulta (texto libre o plantilla), notas internas opcionales y un interruptor para marcarla como online con Google Meet. El paciente y la fecha/hora son obligatorios; el resto tiene valores por defecto razonables (60 minutos de duración, motivo vacío). También puedes ajustar el estado inicial si lo necesitas, aunque por defecto quedará como CONFIRMADA.",
    related: ["ag-11", "ag-13", "ag-14", "ag-15"],
    keywords: ["campos", "formulario", "nueva", "cita"],
  },
  {
    id: "ag-13",
    section: "agenda",
    question: "¿Qué pasa si la cita es online?",
    answer:
      "Si activas el interruptor \"Cita online\" en el formulario, AppNutrición genera automáticamente una sala de Google Meet al guardar, siempre que tengas Google Calendar conectado en Ajustes. El enlace de Meet se guarda con la cita y se incluye en los recordatorios enviados al paciente. Tanto tú como el paciente veréis el botón \"Unirse\" cerca de la hora de inicio. Si no tienes Google conectado, la cita se marcará como online pero sin enlace de Meet automático.",
    related: ["ag-14", "ag-54", "ag-55", "ag-56"],
    keywords: ["online", "meet", "google", "videollamada"],
  },
  {
    id: "ag-14",
    section: "agenda",
    question: "¿Dónde encuentro el enlace de Google Meet?",
    answer:
      "Al abrir el detalle de una cita online, verás un botón destacado \"Unirse a Meet\" con el enlace de la sala. Ese mismo enlace se copia en la invitación de Google Calendar si tienes la integración activa y también se envía al paciente por correo cuando se crea la cita. Puedes copiar el enlace manualmente para pegarlo en un chat o enviarlo por otro canal. Si la cita se cancela, el enlace deja de ser válido.",
    related: ["ag-13", "ag-54", "ag-55"],
    keywords: ["meet", "enlace", "google", "videollamada"],
  },
  {
    id: "ag-15",
    section: "agenda",
    question: "¿Puedo ajustar la duración de una cita?",
    answer:
      "Sí, el campo \"Duración\" del formulario te permite indicar los minutos que estimas que durará la consulta, con valores típicos de 30, 45, 60 o 90 minutos. Ese dato se refleja visualmente en la vista semana ocupando el espacio proporcional del slot horario. También se incluye en la invitación de Google Calendar para que el bloque aparezca con la longitud correcta. Puedes editar la duración más adelante si la primera consulta se alarga o se acorta.",
    related: ["ag-12", "ag-21", "ag-30"],
    keywords: ["duración", "minutos", "cita", "tiempo"],
  },
  {
    id: "ag-16",
    section: "agenda",
    question: "¿Qué estados puede tener una cita?",
    answer:
      "Una cita puede estar en uno de estos cinco estados: PENDIENTE (solicitud sin respuesta), CONFIRMADA (aceptada por ambas partes), CONTRAPROPUESTA (el nutri ha propuesto otra fecha), CANCELADA (anulada por nutri o paciente) o COMPLETADA (ya ha ocurrido y la has marcado como terminada). Cada estado se representa con un color distinto en el calendario para identificarlo de un vistazo. El estado condiciona qué acciones puedes realizar sobre la cita.",
    related: ["ag-17", "ag-18", "ag-25", "ag-35"],
    keywords: ["estados", "pendiente", "confirmada", "cancelada"],
  },
  {
    id: "ag-17",
    section: "agenda",
    question: "¿Qué significa que una cita esté PENDIENTE?",
    answer:
      "PENDIENTE significa que la cita está propuesta pero aún no ha sido confirmada. Si el origen es DIETISTA (la has creado tú), significa que estás esperando que el paciente la acepte desde su portal. Si el origen es PACIENTE (la ha solicitado él), significa que tú tienes que responder aceptando, proponiendo otra fecha o rechazando. Las citas pendientes generan notificaciones y badges en la Agenda para que no se te pasen.",
    related: ["ag-16", "ag-18", "ag-22", "ag-58"],
    keywords: ["pendiente", "estado", "solicitud", "respuesta"],
  },
  {
    id: "ag-18",
    section: "agenda",
    question: "¿Qué significa CONFIRMADA, CANCELADA y COMPLETADA?",
    answer:
      "CONFIRMADA es una cita aceptada por ambas partes que ocurrirá según lo previsto. CANCELADA es una cita que ya no se celebrará, ya sea por iniciativa tuya o del paciente, y no cuenta para los horarios futuros. COMPLETADA es una cita que ya ha tenido lugar y has marcado manualmente como terminada al finalizarla. El estado COMPLETADA sirve para llevar el histórico y calcular métricas de consultas realizadas.",
    related: ["ag-16", "ag-17", "ag-25", "ag-26"],
    keywords: ["confirmada", "cancelada", "completada", "estados"],
  },
  {
    id: "ag-19",
    section: "agenda",
    question: "¿Qué hago con una cita pendiente que he creado yo?",
    answer:
      "Si la cita pendiente tiene origen DIETISTA, lo que debes hacer es esperar a que el paciente la acepte desde su portal. El paciente recibe una notificación y un correo con la propuesta y puede aceptarla, rechazarla o contraproponer otra fecha. Mientras tanto, verás la cita marcada como PENDIENTE en tu Agenda. Si el paciente no responde en un tiempo razonable puedes contactarlo por mensajes o cancelar la cita para liberar el hueco.",
    related: ["ag-17", "ag-20", "ag-22"],
    keywords: ["pendiente", "dietista", "esperar", "paciente"],
  },
  {
    id: "ag-20",
    section: "agenda",
    question: "¿Qué hago con una solicitud de cita del paciente?",
    answer:
      "Si una cita pendiente tiene origen PACIENTE, es una solicitud que él ha enviado desde su portal y requiere una respuesta tuya. Al abrir el detalle verás tres botones: \"Aceptar\", \"Proponer otra fecha\" (contrapropuesta) y \"Rechazar\". Al aceptar pasa a CONFIRMADA; al contraproponer, se marca como CONTRAPROPUESTA y la pelota vuelve al paciente; al rechazar, queda CANCELADA. Estas solicitudes suelen generar notificaciones tipo CITA_SOLICITADA.",
    related: ["ag-17", "ag-21", "ag-22", "ag-23", "ag-24"],
    keywords: ["solicitud", "paciente", "aceptar", "responder"],
  },
  {
    id: "ag-21",
    section: "agenda",
    question: "¿Cómo acepto una solicitud de cita?",
    answer:
      "Abre el detalle de la cita pendiente (con origen PACIENTE) haciendo clic sobre ella en el calendario y pulsa el botón \"Aceptar\". La cita pasa inmediatamente a estado CONFIRMADA y el paciente recibe una notificación y un correo confirmando la reserva. Si tienes Google Calendar conectado, también se sincroniza al aceptar. Es la respuesta más rápida cuando la fecha y hora propuestas te encajan tal cual.",
    related: ["ag-20", "ag-22", "ag-23", "ag-55"],
    keywords: ["aceptar", "solicitud", "confirmar", "botón"],
  },
  {
    id: "ag-22",
    section: "agenda",
    question: "¿Cómo propongo otra fecha a una solicitud?",
    answer:
      "En el detalle de una cita pendiente del paciente pulsa \"Proponer otra fecha\" y se abrirá un pequeño formulario donde indicas la nueva fecha, hora y, opcionalmente, un mensaje explicando el cambio. Al guardar, la cita pasa a estado CONTRAPROPUESTA y el paciente recibe una notificación con tu propuesta alternativa. Él podrá aceptarla, rechazarla o volver a contraproponer. Es útil cuando la fecha original te coincide con otra cita o no encaja en tu horario.",
    related: ["ag-20", "ag-23", "ag-24"],
    keywords: ["contrapropuesta", "proponer", "fecha", "alternativa"],
  },
  {
    id: "ag-23",
    section: "agenda",
    question: "¿Cómo rechazo una solicitud de cita?",
    answer:
      "En el detalle de la cita pendiente pulsa \"Rechazar\" y la cita pasa a estado CANCELADA. El paciente recibe una notificación explicando que la solicitud no ha sido aceptada. Puedes añadir un comentario opcional explicando el motivo, aunque no es obligatorio. Utiliza esta opción cuando no puedas atender al paciente en absoluto durante ese periodo; si puedes reubicar la cita, es mejor usar la contrapropuesta.",
    related: ["ag-20", "ag-22", "ag-25"],
    keywords: ["rechazar", "solicitud", "cancelar", "denegar"],
  },
  {
    id: "ag-24",
    section: "agenda",
    question: "¿Qué es una contrapropuesta?",
    answer:
      "Una contrapropuesta es una respuesta intermedia a una solicitud del paciente en la que, en lugar de aceptar o rechazar, propones una fecha u hora distintas. La cita queda marcada como CONTRAPROPUESTA y el paciente recibe la nueva sugerencia para valorarla. Si él acepta, pasa a CONFIRMADA; si vuelve a contraproponer, la pelota vuelve a tu lado. Es la mejor opción cuando quieres atender al paciente pero no puedes hacerlo en el hueco que él pidió.",
    related: ["ag-22", "ag-20", "ag-16"],
    keywords: ["contrapropuesta", "proponer", "negociar", "fecha"],
  },
  {
    id: "ag-25",
    section: "agenda",
    question: "¿Cómo cancelo una cita?",
    answer:
      "Abre el detalle de la cita y pulsa \"Cancelar cita\". Se te pedirá confirmación y, opcionalmente, un motivo que se enviará al paciente. La cita pasa a estado CANCELADA y deja de contar en tu agenda activa, liberando el hueco para otras consultas. El paciente recibe una notificación automática del cambio. Si tenías la cita sincronizada con Google Calendar, también se elimina o marca allí como cancelada.",
    related: ["ag-16", "ag-23", "ag-27", "ag-55"],
    keywords: ["cancelar", "anular", "cita", "borrar"],
  },
  {
    id: "ag-26",
    section: "agenda",
    question: "¿Cómo marco una cita como completada?",
    answer:
      "Una vez has terminado la consulta, abre el detalle de la cita y pulsa \"Marcar como completada\". La cita pasa a estado COMPLETADA y se archiva en el histórico de consultas del paciente. Es importante hacerlo al final de cada consulta porque las métricas del dashboard y los reportes cuentan las citas completadas, no las simplemente confirmadas. Puedes marcar como completada también citas pasadas que olvidaste cerrar en su momento.",
    related: ["ag-16", "ag-18", "ag-35"],
    keywords: ["completar", "terminada", "finalizar", "marcar"],
  },
  {
    id: "ag-27",
    section: "agenda",
    question: "¿Cómo reprogramo una cita?",
    answer:
      "Abre el detalle de la cita y pulsa \"Editar\" o directamente \"Reprogramar\" y cambia la fecha u hora. Al guardar, la cita mantiene el mismo id y estado pero con las nuevas coordenadas temporales. El paciente recibe una notificación del cambio con la nueva fecha. Si la cita estaba sincronizada con Google, la sincronización se actualiza automáticamente al guardar. Es la vía habitual cuando un paciente confirmado quiere mover la cita a otro momento.",
    related: ["ag-25", "ag-28", "ag-55"],
    keywords: ["reprogramar", "cambiar", "mover", "fecha"],
  },
  {
    id: "ag-28",
    section: "agenda",
    question: "¿Puedo duplicar una cita existente?",
    answer:
      "Sí, en el detalle de una cita encontrarás un botón \"Duplicar\" que crea una nueva cita idéntica en paciente, duración, motivo y modalidad (online/presencial), pero con fecha y hora que tendrás que fijar tú. Es útil para programar consultas de seguimiento con el mismo paciente sin tener que rellenar todo el formulario otra vez. La cita duplicada se crea en estado CONFIRMADA y sigue el flujo normal. No arrastra las notas internas de la cita original.",
    related: ["ag-11", "ag-27"],
    keywords: ["duplicar", "copiar", "repetir", "cita"],
  },
  {
    id: "ag-29",
    section: "agenda",
    question: "¿Qué pasa si hago clic sobre una cita?",
    answer:
      "Al hacer clic sobre el bloque de una cita en cualquier vista, se abre un panel lateral (o modal en móvil) con el detalle completo: paciente, fecha, hora, duración, motivo, notas, estado, origen y, si aplica, enlace de Meet. Desde ese panel puedes editar, cancelar, marcar como completada, duplicar o acceder a la ficha del paciente. Al abrir el detalle se marcan como leídas las notificaciones asociadas a esa cita para reducir el ruido.",
    related: ["ag-30", "ag-57", "ag-58"],
    keywords: ["clic", "detalle", "panel", "cita"],
  },
  {
    id: "ag-30",
    section: "agenda",
    question: "¿Qué muestra el sidebar con el detalle del día?",
    answer:
      "Al hacer clic en un día concreto (en vista semana o mes), se abre un sidebar con todas las citas de esa jornada ordenadas por hora, más un botón rápido \"Añadir cita\" prerellenado con esa fecha. Cada cita del sidebar es clicable y te lleva al detalle completo. Es la forma más rápida de ver a quién tienes ese día sin cambiar a vista día. El sidebar se cierra pulsando fuera o con la X superior.",
    related: ["ag-5", "ag-6", "ag-29"],
    keywords: ["sidebar", "detalle", "día", "panel"],
  },
  {
    id: "ag-31",
    section: "agenda",
    question: "¿Cómo identifico un día vacío en la vista mes?",
    answer:
      "En la vista mes, los días sin citas aparecen con la celda vacía y el número del día sin ningún contador. Los días con citas muestran un pequeño badge con el número de consultas y, si hay espacio, una lista truncada de las primeras. Los días vacíos del mes actual se ven en color normal, y los de meses contiguos (fin o inicio de mes) en un gris más claro para distinguirse. Un mes sin citas aparecerá completamente limpio.",
    related: ["ag-6", "ag-32"],
    keywords: ["vacío", "mes", "sin citas", "calendario"],
  },
  {
    id: "ag-32",
    section: "agenda",
    question: "¿Y si tengo muchas citas el mismo día en vista mes?",
    answer:
      "Si un día tiene más citas de las que caben en la celda del calendario mensual, verás las primeras listadas y un indicador tipo \"+3 más\" con el total que queda oculto. Haz clic sobre la celda (o sobre el indicador) y se abrirá el sidebar lateral con todas las citas de esa jornada ordenadas por hora. También puedes cambiar a vista día o semana si necesitas ver el detalle sin sidebar. La celda no crece para no romper la cuadrícula del mes.",
    related: ["ag-6", "ag-30", "ag-31", "ag-38"],
    keywords: ["muchas", "citas", "día", "mes"],
  },
  {
    id: "ag-33",
    section: "agenda",
    question: "¿Qué información resume la vista día?",
    answer:
      "En la vista día, al final del listado de citas, encontrarás un pequeño resumen con el número total de consultas, cuántas están confirmadas, cuántas pendientes y cuántas ya has completado. También se indica el total de minutos de consulta del día y los huecos libres entre citas. Es útil para revisar de un vistazo si la jornada está llena o todavía tiene disponibilidad. Si el día está vacío, el resumen te invita a crear la primera cita.",
    related: ["ag-7", "ag-9"],
    keywords: ["día", "resumen", "total", "estadísticas"],
  },
  {
    id: "ag-34",
    section: "agenda",
    question: "¿Dónde veo mi próxima cita?",
    answer:
      "La próxima cita aparece de forma destacada en el sidebar superior de la Agenda (y también en el dashboard principal), con el paciente, la hora, el motivo y un acceso rápido al detalle. Se calcula tomando la primera cita CONFIRMADA desde el momento actual en adelante. Si no tienes ninguna cita futura, el widget muestra un mensaje invitando a crear una. Al hacer clic saltas directamente al detalle de esa cita.",
    related: ["ag-1", "ag-29", "ag-57"],
    keywords: ["próxima", "cita", "siguiente", "sidebar"],
  },
  {
    id: "ag-35",
    section: "agenda",
    question: "¿Cómo se distingue una \"primera consulta\"?",
    answer:
      "Cuando una cita corresponde a la primera consulta de un paciente (es decir, no tiene citas anteriores completadas con ese paciente), aparece destacada con una etiqueta \"Primera consulta\" de color diferenciado. Esto te ayuda a prepararte con antelación porque suele requerir más tiempo y preguntas iniciales. La etiqueta se muestra tanto en el calendario como en el detalle de la cita. El cálculo se hace automáticamente en base al histórico del paciente.",
    related: ["ag-16", "ag-29"],
    keywords: ["primera", "consulta", "nueva", "etiqueta"],
  },
  {
    id: "ag-36",
    section: "agenda",
    question: "¿Puedo filtrar las citas por estado?",
    answer:
      "Sí, en la parte superior de la Agenda hay un panel de filtros donde puedes marcar qué estados quieres ver: pendientes, confirmadas, contrapropuestas, canceladas o completadas. Por defecto se muestran todas excepto las canceladas, para que no ensucien la vista. Los filtros se aplican en tiempo real sobre cualquier vista (semana, mes o día). Resetear filtros es tan simple como pulsar el botón \"Limpiar\" o marcar todas las casillas de nuevo.",
    related: ["ag-16", "ag-37", "ag-38"],
    keywords: ["filtros", "estado", "pendientes", "confirmadas"],
  },
  {
    id: "ag-37",
    section: "agenda",
    question: "¿Puedo filtrar o buscar por paciente?",
    answer:
      "Sí, en los filtros de la Agenda hay un buscador donde puedes escribir el nombre o apellido de un paciente y solo se mostrarán sus citas. Es útil cuando quieres revisar el historial de consultas con una persona concreta. La búsqueda es incremental y funciona mientras escribes, sin necesidad de pulsar Enter. Para volver a ver todas las citas, basta con vaciar el buscador.",
    related: ["ag-36", "ag-38"],
    keywords: ["buscar", "paciente", "filtro", "nombre"],
  },
  {
    id: "ag-38",
    section: "agenda",
    question: "¿Qué ocurre si varias citas se solapan en la vista semana?",
    answer:
      "Si tienes dos o más citas en el mismo rango horario, aparecerán como bloques paralelos dentro de la misma franja, compartiendo el ancho de la columna del día. Esto permite identificar a simple vista un conflicto de agenda, aunque la práctica recomendada es evitar solapamientos. Si hay más de tres citas solapadas en la misma franja, verás un indicador \"+n\" al hacer clic para abrir la lista completa. En general, AppNutrición no bloquea la creación de solapamientos, solo los muestra.",
    related: ["ag-5", "ag-30", "ag-47"],
    keywords: ["solapadas", "semana", "conflicto", "horas"],
  },
  {
    id: "ag-39",
    section: "agenda",
    question: "¿Qué significan los colores de las citas?",
    answer:
      "Cada estado de cita tiene un color distinto para identificarlo de un vistazo: las CONFIRMADAS aparecen en verde, las PENDIENTES en ámbar, las CONTRAPROPUESTAS en morado, las CANCELADAS en gris atenuado y las COMPLETADAS en azul. Las citas online tienen además un pequeño icono de Meet para distinguirlas de las presenciales. Los colores se mantienen consistentes en las tres vistas (semana, mes y día). Esta codificación facilita leer la Agenda sin tener que hacer clic en cada cita.",
    related: ["ag-16", "ag-18"],
    keywords: ["colores", "estados", "visual", "código"],
  },
  {
    id: "ag-40",
    section: "agenda",
    question: "¿Cuál es la escala horaria por defecto en la vista semana?",
    answer:
      "Por defecto, la vista semana muestra las horas entre las 6:00 y las 22:00 en franjas de 30 o 60 minutos. Este rango cubre la gran mayoría de horarios laborales de nutricionistas sin ocupar demasiada pantalla. Las filas están alineadas con las horas en punto y las medias para facilitar situar las citas. Si tienes una cita fuera de ese rango (por ejemplo a las 5:30 o a las 23:00) la Agenda ajusta automáticamente el rango para mostrarla.",
    related: ["ag-5", "ag-41", "ag-47"],
    keywords: ["horario", "escala", "horas", "rango"],
  },
  {
    id: "ag-41",
    section: "agenda",
    question: "¿Puedo ajustar el rango horario visible?",
    answer:
      "Puedes definir tu horario laboral habitual en Ajustes → Horario, indicando hora de inicio, hora de fin y los días que trabajas. La Agenda usará esa configuración para resaltar el horario laboral y atenuar el resto, aunque las citas fuera del horario se siguen mostrando. Esto también afecta a qué huecos se ofrecen al paciente cuando solicita una cita desde su portal. Puedes cambiarlo en cualquier momento y el efecto es inmediato.",
    related: ["ag-40", "ag-42", "ag-43"],
    keywords: ["ajustar", "horario", "rango", "configuración"],
  },
  {
    id: "ag-42",
    section: "agenda",
    question: "¿Cómo configuro mi horario laboral?",
    answer:
      "Ve a Ajustes → Horario y define los días de la semana que trabajas y sus tramos horarios (por ejemplo, lunes a viernes de 9:00 a 14:00 y de 16:00 a 20:00). Puedes tener tramos distintos por día y añadir pausas intermedias. Esta configuración alimenta la disponibilidad que ve el paciente al solicitar cita y también cómo se pinta el horario laboral en la Agenda. Tenerlo bien definido evita recibir solicitudes fuera de tus horas de consulta.",
    related: ["ag-41", "ag-43", "ag-44"],
    keywords: ["configurar", "horario", "laboral", "ajustes"],
  },
  {
    id: "ag-43",
    section: "agenda",
    question: "¿Qué disponibilidad ve el paciente al pedir cita?",
    answer:
      "Cuando un paciente solicita cita desde su portal, ve únicamente los huecos dentro de tu horario laboral configurado que no estén ocupados por otra cita confirmada o pendiente. También se descartan bloqueos personales o vacaciones que hayas definido. Si no tienes ningún hueco libre en un día, simplemente no aparece como opción. De esta forma evitas solapamientos y solicitudes imposibles de cumplir.",
    related: ["ag-42", "ag-44", "ag-46"],
    keywords: ["disponibilidad", "paciente", "huecos", "portal"],
  },
  {
    id: "ag-44",
    section: "agenda",
    question: "¿Puedo bloquear horas que no trabajo?",
    answer:
      "Sí, desde Ajustes → Horario puedes definir bloqueos ad hoc (una tarde concreta, una mañana, un rango de días enteros) además de tu horario recurrente. Esos bloqueos desaparecen de la disponibilidad que ve el paciente y se pintan como franjas sombreadas en la Agenda. Es útil para ausencias puntuales, formaciones, reuniones internas o días personales. Puedes crear tantos bloqueos como necesites y eliminarlos cuando ya no apliquen.",
    related: ["ag-42", "ag-43", "ag-46"],
    keywords: ["bloquear", "horas", "ausencia", "vacaciones"],
  },
  {
    id: "ag-45",
    section: "agenda",
    question: "¿Qué zona horaria usa la Agenda?",
    answer:
      "La Agenda utiliza siempre la zona horaria Europa/Madrid como referencia, independientemente del reloj del dispositivo del nutri o del paciente. Esto garantiza que las citas se interpreten de forma consistente entre ambas partes y no haya malentendidos horarios. Si viajas a otro país, la hora mostrada sigue siendo la de Madrid. El paciente también ve las citas en esa misma referencia, por lo que la comunicación es siempre clara.",
    related: ["ag-42", "ag-55"],
    keywords: ["zona", "horaria", "madrid", "timezone"],
  },
  {
    id: "ag-46",
    section: "agenda",
    question: "¿Cómo marco vacaciones o días libres?",
    answer:
      "Ve a Ajustes → Horario → \"Bloqueos y vacaciones\" y añade un rango de fechas con un motivo opcional (vacaciones, baja, formación). Esos días quedarán bloqueados para solicitudes del paciente y aparecerán sombreados en la Agenda con el motivo visible. Puedes programarlos con antelación y el sistema se ocupa de no ofrecer huecos a los pacientes en ese periodo. Al volver de vacaciones no hace falta hacer nada: los huecos vuelven a ser visibles automáticamente.",
    related: ["ag-44", "ag-43"],
    keywords: ["vacaciones", "bloqueos", "libres", "ausencia"],
  },
  {
    id: "ag-47",
    section: "agenda",
    question: "¿Se pueden crear citas recurrentes automáticas?",
    answer:
      "Actualmente AppNutrición no soporta citas recurrentes automáticas (por ejemplo \"cada lunes a las 10:00 durante 3 meses\"). Cada cita se crea de forma individual. Sí puedes usar la función \"Duplicar\" para agilizar la creación de consultas de seguimiento con el mismo paciente sin rellenar el formulario entero. Es una funcionalidad en la hoja de ruta del producto pero todavía no disponible.",
    related: ["ag-28", "ag-11"],
    keywords: ["recurrentes", "repetir", "automáticas", "no soportado"],
  },
  {
    id: "ag-48",
    section: "agenda",
    question: "¿Se envían recordatorios al paciente?",
    answer:
      "Sí, AppNutrición envía recordatorios automáticos al paciente por correo: uno cuando se confirma la cita y otro 24 horas antes de la hora prevista. Si la cita es online, el recordatorio incluye el enlace de Google Meet. También generamos notificaciones internas tipo CITA_HOY en el portal del paciente el mismo día. Puedes ajustar algunas preferencias de envío en Ajustes → Notificaciones, aunque los recordatorios clave están activos por defecto.",
    related: ["ag-13", "ag-14", "ag-58"],
    keywords: ["recordatorios", "aviso", "paciente", "correo"],
  },
  {
    id: "ag-49",
    section: "agenda",
    question: "¿Puedo exportar mi agenda?",
    answer:
      "Sí, desde el menú de opciones de la Agenda puedes exportar tus citas en formato iCal (archivo .ics), compatible con Google Calendar, Apple Calendar, Outlook y prácticamente cualquier gestor de calendarios. Eliges el rango de fechas a exportar (mes actual, próximos tres meses, etc.) y se descarga un archivo con todas las citas en esos límites. Si ya tienes Google Calendar conectado, la sincronización directa suele ser más cómoda que la exportación manual.",
    related: ["ag-50", "ag-55"],
    keywords: ["exportar", "ical", "ics", "descargar"],
  },
  {
    id: "ag-50",
    section: "agenda",
    question: "¿Puedo imprimir la agenda?",
    answer:
      "Sí, en cualquier vista (semana, mes o día) puedes pulsar \"Imprimir\" o usar Ctrl+P (Cmd+P en Mac) y se abrirá una versión optimizada para papel. El diseño se simplifica eliminando sidebar y colores fuertes, manteniendo únicamente la información clave: paciente, hora, duración y motivo. Es útil si prefieres tener una copia física del día o la semana, o para archivo en consulta. Las citas canceladas no aparecen en la versión imprimible por defecto.",
    related: ["ag-49", "ag-7"],
    keywords: ["imprimir", "papel", "print", "exportar"],
  },
  {
    id: "ag-51",
    section: "agenda",
    question: "¿Cómo se ve la Agenda en móvil?",
    answer:
      "En pantallas móviles, la vista semana se adapta a un formato stacked que muestra los días uno debajo de otro en lugar de en columnas paralelas, para aprovechar mejor el espacio vertical. La vista mes mantiene el calendario compacto con badges numéricos, y la vista día es la más cómoda para móvil porque es una lista lineal. Los detalles de cita se abren como modal a pantalla completa en lugar de sidebar. Todas las acciones (crear, editar, cancelar) están disponibles igual que en escritorio.",
    related: ["ag-4", "ag-5"],
    keywords: ["móvil", "responsive", "stacked", "pantalla"],
  },
  {
    id: "ag-52",
    section: "agenda",
    question: "¿Puedo ordenar las citas por paciente?",
    answer:
      "En la vista día, además del orden cronológico por defecto, puedes elegir ordenar por paciente alfabéticamente o por estado. Es útil cuando tienes muchas citas y quieres revisar por grupos (por ejemplo, todas las pendientes juntas). En las vistas semana y mes el orden es siempre temporal porque el calendario se basa en huecos de tiempo. Los filtros de estado y paciente funcionan a la vez que la ordenación.",
    related: ["ag-7", "ag-36", "ag-37"],
    keywords: ["ordenar", "paciente", "alfabético", "orden"],
  },
  {
    id: "ag-53",
    section: "agenda",
    question: "¿Existe una agenda compartida entre varios nutricionistas?",
    answer:
      "Actualmente AppNutrición no soporta agendas compartidas entre varios profesionales dentro de la misma cuenta. Cada nutricionista tiene su propia agenda independiente y no es posible ver o gestionar las citas de otro compañero desde tu vista. Si trabajas en una clínica con varios nutricionistas, cada uno debe gestionar su agenda por separado. Es una funcionalidad prevista pero no disponible a día de hoy.",
    related: ["ag-1", "ag-47"],
    keywords: ["compartida", "equipo", "multi", "no soportado"],
  },
  {
    id: "ag-54",
    section: "agenda",
    question: "¿Cómo se genera una sala de Meet para una cita online?",
    answer:
      "Al crear una cita con el interruptor \"Cita online\" activado, AppNutrición llama a la API de Google Calendar para generar un evento con una conferencia de Meet asociada. El enlace resultante se guarda en la cita y se incluye tanto en el evento del calendario como en los recordatorios al paciente. Todo este proceso requiere que tengas Google Calendar conectado en Ajustes → Integraciones. Si no lo tienes conectado, la cita se marca como online pero sin enlace automático.",
    related: ["ag-13", "ag-14", "ag-55", "ag-56"],
    keywords: ["meet", "sala", "generar", "automático"],
  },
  {
    id: "ag-55",
    section: "agenda",
    question: "¿Cómo se sincroniza la Agenda con Google Calendar?",
    answer:
      "Si tienes la integración con Google Calendar activa en Ajustes, cada cita que creas, editas, cancelas o confirmas se sincroniza automáticamente con tu calendario de Google. Los eventos aparecen en el calendario \"AppNutrición\" que se crea al conectar la cuenta y llevan un identificador único para no duplicarse. La sincronización es unidireccional por ahora: los cambios en Google Calendar no se reflejan en AppNutrición. Si desconectas la integración, las citas futuras dejan de sincronizarse pero las pasadas se conservan en Google.",
    related: ["ag-13", "ag-54", "ag-56"],
    keywords: ["sincronizar", "google", "calendar", "integración"],
  },
  {
    id: "ag-56",
    section: "agenda",
    question: "¿Dónde configuro la integración con Google?",
    answer:
      "La integración con Google (Calendar y Meet) se configura en Ajustes → Integraciones → Google. Allí puedes conectar tu cuenta mediante OAuth, ver el estado de la conexión y desconectar si lo deseas. Una vez conectada, las citas online generan automáticamente salas de Meet y todas las citas se sincronizan con tu calendario. Es una sección separada de la Agenda porque afecta también a otras partes del producto como los entregables o los recordatorios.",
    related: ["ag-55", "ag-54"],
    keywords: ["integración", "google", "ajustes", "configurar"],
  },
  {
    id: "ag-57",
    section: "agenda",
    question: "¿La Agenda se actualiza en tiempo real?",
    answer:
      "La Agenda utiliza polling para refrescarse cada pocos segundos y detectar cambios como una nueva solicitud de cita del paciente o una actualización de estado. Esto significa que, sin recargar la página, verás aparecer nuevas citas o cambios de estado casi al instante. No es estrictamente tiempo real mediante websockets, pero a efectos prácticos el retraso es mínimo. Si quieres forzar una actualización inmediata puedes recargar con F5.",
    related: ["ag-58", "ag-29"],
    keywords: ["tiempo real", "polling", "actualizar", "refrescar"],
  },
  {
    id: "ag-58",
    section: "agenda",
    question: "¿Qué badges de notificación aparecen en las citas?",
    answer:
      "Las citas con eventos pendientes (por ejemplo, una solicitud nueva sin responder, una contrapropuesta recibida o una cita confirmada que empieza pronto) llevan un pequeño badge rojo o azul sobre el bloque para llamar tu atención. También el icono de la sección Agenda en el sidebar muestra un contador con las notificaciones relacionadas con citas sin leer. Al abrir el detalle de la cita, las notificaciones asociadas se marcan como leídas automáticamente. De esta forma, la Agenda te guía hacia lo que requiere acción.",
    related: ["ag-57", "ag-59", "ag-60"],
    keywords: ["badges", "notificación", "indicador", "rojo"],
  },
  {
    id: "ag-59",
    section: "agenda",
    question: "¿Qué notificaciones están relacionadas con la Agenda?",
    answer:
      "Las notificaciones más habituales que toca la Agenda son: CITA_SOLICITADA (un paciente ha pedido cita), CITA_CONFIRMADA (se ha confirmado una cita), CITA_CANCELADA (se ha cancelado), CITA_CONTRAPROPUESTA (el paciente ha contrapropuesto) y CITA_HOY (recordatorio de cita del día). Todas ellas aparecen en el centro de notificaciones y muchas llegan también como correo. Al abrir el detalle de la cita correspondiente, las notificaciones se marcan como leídas para no ensuciar la bandeja.",
    related: ["ag-58", "ag-60"],
    keywords: ["notificaciones", "tipos", "cita", "eventos"],
  },
  {
    id: "ag-60",
    section: "agenda",
    question: "¿Qué pasa al abrir el detalle de una cita con notificaciones?",
    answer:
      "Al abrir el detalle de una cita en la Agenda, AppNutrición marca automáticamente como leídas todas las notificaciones internas que estén asociadas a esa cita concreta. Esto incluye avisos de solicitud, confirmación, contrapropuesta o recordatorio del día. El objetivo es que una vez has tomado nota o actuado sobre la cita, tu bandeja de notificaciones quede limpia sin que tengas que hacer una acción extra. Los badges de la Agenda y del sidebar se actualizan en consecuencia casi al instante gracias al polling.",
    related: ["ag-58", "ag-59", "ag-57"],
    keywords: ["leídas", "abrir", "marcar", "notificaciones"],
  },
];
