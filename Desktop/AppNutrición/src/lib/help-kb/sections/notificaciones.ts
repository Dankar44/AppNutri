import type { HelpEntry } from "../types";

export const NOTIFICACIONES_ENTRIES: HelpEntry[] = [
  {
    id: "not-1",
    section: "notificaciones",
    question: "¿Qué es la sección de notificaciones en Annonia?",
    answer:
      "La sección `/notificaciones` es el centro de alertas del sistema para el nutricionista. Agrupa en un único sitio todos los avisos automáticos generados por eventos relevantes: citas solicitadas, confirmadas o rechazadas, pacientes que llevan tiempo sin consulta, planes antiguos, pagos recibidos y más. Está pensada para que no se te escape nada importante sin tener que revisar cada apartado manualmente. Puedes entenderla como el buzón operativo de la consulta, distinto del buzón de mensajes con pacientes.",
    related: ["not-2", "not-3", "not-41"],
    keywords: ["notificaciones", "alertas", "avisos", "sistema"],
  },
  {
    id: "not-2",
    section: "notificaciones",
    question: "¿Dónde puedo ver mis notificaciones?",
    answer:
      "Tienes dos puntos de acceso: la campanita del header superior, que muestra un contador con las no leídas y un desplegable con las últimas, y la página completa en `/notificaciones`, donde se listan todas agrupadas por fecha. Desde el desplegable puedes entrar a la página con el enlace \"Ver todas\". Ambos sitios se mantienen sincronizados: si marcas una como leída en un lado, desaparece del contador del otro. El icono de la campanita es visible desde cualquier pantalla del panel.",
    related: ["not-1", "not-3", "not-8"],
    keywords: ["campana", "bell", "header", "acceso"],
  },
  {
    id: "not-3",
    section: "notificaciones",
    question: "¿Qué significa el número rojo sobre la campanita?",
    answer:
      "Ese círculo rojo es el contador de notificaciones no leídas. Muestra el total pendiente y, si hay más de 9, aparece como \"9+\" para no ocupar demasiado espacio. Se actualiza automáticamente cuando llegan notificaciones nuevas o cuando marcas alguna como leída. Si ves un número alto tras varios días sin entrar, lo más cómodo es pulsar \"Marcar todas como leídas\" desde la página de notificaciones. El contador se refresca cada 45 segundos mediante un polling ligero.",
    related: ["not-2", "not-9", "not-48"],
    keywords: ["contador", "no leídas", "badge", "rojo"],
  },
  {
    id: "not-4",
    section: "notificaciones",
    question: "¿Qué pasa cuando hago clic en una notificación?",
    answer:
      "Al pulsar sobre una notificación ocurren dos cosas a la vez: se marca automáticamente como leída y te lleva al sitio relacionado. Por ejemplo, si la notificación es \"Juan solicitó cita\", al clicar aterrizas en la agenda con esa cita abierta; si es \"Plan antiguo de Ana\", vas a la ficha de Ana en la pestaña de planificación. Es la forma más rápida de atender la alerta sin pasos intermedios. Si no quieres navegar, usa el botón ✓ del hover.",
    related: ["not-5", "not-6", "not-15"],
    keywords: ["click", "clic", "navegar", "marcar leída"],
  },
  {
    id: "not-5",
    section: "notificaciones",
    question: "¿Puedo marcar una notificación como leída sin navegar?",
    answer:
      "Sí. Al pasar el ratón por encima de una notificación aparece un pequeño botón ✓ a la derecha. Pulsándolo la marcas como leída sin salir del listado y sin abrir el enlace asociado. Es útil cuando solo quieres \"limpiar\" el aviso porque ya lo conoces o lo resolviste desde otro sitio. En móvil el botón aparece siempre visible al lado del título para que sea accesible sin hover.",
    related: ["not-4", "not-6", "not-9"],
    keywords: ["marcar leída", "tick", "hover", "sin navegar"],
  },
  {
    id: "not-6",
    section: "notificaciones",
    question: "¿Cómo elimino una notificación?",
    answer:
      "Cada notificación tiene un botón 🗑 al pasar el ratón por encima que la borra definitivamente del listado. Usarlo no afecta al evento original: si era una cita, la cita sigue existiendo en la agenda; solo desaparece el aviso. Es la opción adecuada cuando no te interesa el aviso y no quieres que ensucie el historial. A diferencia de \"marcar como leída\", el borrado es irreversible, así que úsalo solo si estás seguro.",
    related: ["not-5", "not-9", "not-45"],
    keywords: ["borrar", "eliminar", "trash", "papelera"],
  },
  {
    id: "not-7",
    section: "notificaciones",
    question: "¿Qué hace el botón \"Marcar todas como leídas\"?",
    answer:
      "Ese botón, en la parte superior de la página `/notificaciones`, pasa a estado leído todas tus notificaciones pendientes de golpe. El contador de la campanita baja a cero y los avisos se muestran en un tono más suave para indicar que ya no son nuevos, aunque siguen en el historial. Es útil tras varios días sin entrar o después de haber atendido los avisos por otros medios. Ojo: no las borra, simplemente las marca como vistas.",
    related: ["not-3", "not-9", "not-45"],
    keywords: ["marcar todas", "limpiar", "todas leídas", "masivo"],
  },
  {
    id: "not-8",
    section: "notificaciones",
    question: "¿Cómo están organizadas las notificaciones en la página?",
    answer:
      "En `/notificaciones` el listado se agrupa por fecha en bloques: \"Hoy\", \"Ayer\", \"Esta semana\" y \"Anteriores\". Dentro de cada bloque las notificaciones se ordenan de más reciente a más antigua. Esta agrupación facilita distinguir lo nuevo de lo que lleva tiempo sin atenderse y evita una lista plana interminable. Los títulos de grupo aparecen solo si hay al menos una notificación en ese tramo, de modo que no ves secciones vacías.",
    related: ["not-1", "not-2", "not-44"],
    keywords: ["agrupar", "fecha", "hoy", "ayer"],
  },
  {
    id: "not-9",
    section: "notificaciones",
    question: "¿Cómo diferencio una notificación leída de una no leída?",
    answer:
      "Las no leídas se muestran con un punto azul a la izquierda, el texto en color más intenso y, en algunos casos, fondo ligeramente resaltado. Las leídas pierden el punto y se ven atenuadas, como un aviso ya consultado. Esta diferencia visual te permite escanear la lista rápidamente y saber qué queda por atender. Al marcar una como leída, el cambio de estilo es inmediato sin necesidad de recargar la página.",
    related: ["not-3", "not-5", "not-7"],
    keywords: ["leída", "no leída", "visual", "estilo"],
  },
  {
    id: "not-10",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_HOY?",
    answer:
      "Es un aviso automático que se genera al cargar el dashboard cuando tienes una o varias citas agendadas para el día en curso. Incluye el nombre del paciente y la hora aproximada y enlaza directamente a la agenda. Su propósito es recordarte a primera hora quién te visita hoy para que prepares la consulta. Si tienes varias citas, se genera una notificación por cada una para poder gestionarlas individualmente.",
    related: ["not-11", "not-12", "not-28"],
    keywords: ["cita hoy", "agenda", "recordatorio", "CITA_HOY"],
  },
  {
    id: "not-11",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_SOLICITADA?",
    answer:
      "Se genera cuando un paciente solicita una cita desde su portal. Te informa del nombre, la fecha y la hora propuestas, y al clicar te lleva a la agenda para que puedas aceptarla, contraproponer otro hueco o rechazarla. Es una de las notificaciones más importantes porque requiere acción por tu parte: el paciente está esperando tu respuesta. Mientras no confirmes, la cita aparece en estado \"Solicitada\".",
    related: ["not-10", "not-12", "not-13"],
    keywords: ["solicitada", "paciente pide cita", "portal", "CITA_SOLICITADA"],
  },
  {
    id: "not-12",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_CONFIRMADA?",
    answer:
      "Es el aviso que recibes cuando un paciente acepta una cita que tú le propusiste o confirma una contrapropuesta tuya. Se crea al registrarse el cambio de estado a \"Confirmada\" y te evita tener que entrar a la agenda para comprobarlo. Al abrirla te lleva a la ficha de la cita con todos los detalles. Es útil para saber con antelación qué huecos están cerrados y puedes dar por seguros.",
    related: ["not-11", "not-13", "not-14"],
    keywords: ["confirmada", "aceptada", "paciente acepta", "CITA_CONFIRMADA"],
  },
  {
    id: "not-13",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_CONTRAPROPUESTA?",
    answer:
      "Aparece cuando un paciente, ante una cita que tú le ofreciste, propone un horario alternativo. La notificación te indica tanto la hora original como la nueva sugerida, y al clicar puedes aceptar el cambio, mantener tu propuesta o sugerir una tercera opción. Es el mecanismo de negociación de horarios sin salir de la app. Se genera cada vez que el paciente responde con un hueco diferente.",
    related: ["not-11", "not-12", "not-14"],
    keywords: ["contrapropuesta", "cambio hora", "negociación", "CITA_CONTRAPROPUESTA"],
  },
  {
    id: "not-14",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_RECHAZADA?",
    answer:
      "Se crea cuando un paciente rechaza una cita que tú le habías propuesto, normalmente porque no le encaja ningún horario cercano. Incluye el motivo si el paciente lo indicó y enlaza a la agenda para que puedas proponerle otro día u ofrecerle un hueco distinto. También sirve para liberar mentalmente el slot ocupado y usarlo con otro paciente. La cita queda registrada en estado \"Rechazada\" para el historial.",
    related: ["not-13", "not-15", "not-28"],
    keywords: ["rechazada", "paciente rechaza", "no acepta", "CITA_RECHAZADA"],
  },
  {
    id: "not-15",
    section: "notificaciones",
    question: "¿Qué es la notificación CITA_CANCELADA_POR_PACIENTE?",
    answer:
      "Aparece cuando un paciente cancela una cita ya confirmada desde su portal, por ejemplo por un imprevisto. La notificación te informa del nombre, el hueco que se libera y el motivo si lo indicó. Al abrirla te lleva a la agenda para que puedas reasignar el hueco o contactar al paciente para reagendar. Es especialmente útil cuando la cancelación ocurre con poca antelación, para que no esperes en vano.",
    related: ["not-11", "not-14", "not-28"],
    keywords: ["cancelada", "paciente cancela", "anulada", "CITA_CANCELADA_POR_PACIENTE"],
  },
  {
    id: "not-16",
    section: "notificaciones",
    question: "¿Qué es la notificación PACIENTE_SIN_CONSULTA?",
    answer:
      "Se dispara cuando un paciente activo lleva más de 30 días sin una consulta registrada ni programada. Su finalidad es detectar posibles abandonos silenciosos y recordarte hacer seguimiento comercial o sanitario. Al clicar te lleva a la ficha del paciente en la pestaña de consultas para que puedas agendar una nueva o contactar con él directamente. Este chequeo se realiza automáticamente cada vez que se recalculan las notificaciones del dashboard.",
    related: ["not-17", "not-18", "not-30"],
    keywords: ["sin consulta", "30 días", "abandono", "PACIENTE_SIN_CONSULTA"],
  },
  {
    id: "not-17",
    section: "notificaciones",
    question: "¿Qué es la notificación PACIENTE_SIN_MEDIDAS?",
    answer:
      "Se genera cuando han pasado más de 30 días desde la última medición registrada para un paciente activo. Te recuerda que toca tomar peso, circunferencias u otros parámetros antropométricos para mantener el seguimiento actualizado. Al clicar entras a la pestaña de Mediciones del paciente con el formulario listo. Esta notificación se mantiene activa hasta que registres una medición nueva o desactives el tipo en preferencias.",
    related: ["not-16", "not-18", "not-30"],
    keywords: ["sin medidas", "30 días", "antropometría", "PACIENTE_SIN_MEDIDAS"],
  },
  {
    id: "not-18",
    section: "notificaciones",
    question: "¿Qué es la notificación PLAN_ANTIGUO?",
    answer:
      "Aparece cuando un paciente tiene asignado un plan de alimentación que no se ha actualizado en más de 30 días. La idea es evitar que un paciente esté siguiendo indefinidamente un plan caducado o ya no adecuado. Al clicar aterrizas en la pestaña de plan de alimentación para revisarlo, ajustarlo o crear uno nuevo. Si el paciente ya no lo necesita, puedes archivarlo desde allí y la notificación dejará de regenerarse.",
    related: ["not-16", "not-17", "not-30"],
    keywords: ["plan antiguo", "30 días", "actualizar plan", "PLAN_ANTIGUO"],
  },
  {
    id: "not-19",
    section: "notificaciones",
    question: "¿Qué es la notificación DIARIO_NUEVO?",
    answer:
      "Se crea cuando un paciente registra una nueva entrada en su diario de seguimiento desde el portal. Te avisa de que hay información fresca (peso, humor, hambre, notas libres) para revisar antes de la próxima consulta. Al clicar vas directo a la pestaña de Seguimiento del paciente con el registro destacado. Si un mismo paciente añade varias entradas el mismo día, se agrupan en una sola notificación para no saturar la bandeja.",
    related: ["not-20", "not-30", "not-36"],
    keywords: ["diario", "seguimiento", "registro paciente", "DIARIO_NUEVO"],
  },
  {
    id: "not-20",
    section: "notificaciones",
    question: "¿Qué es la notificación PAGO_RECIBIDO?",
    answer:
      "Aparece cuando un paciente completa un pago correctamente, ya sea de una cita, un plan o una suscripción. Indica el importe y el paciente, y al clicar te lleva a la sección de pagos o a la factura correspondiente. Sirve de confirmación inmediata para que sepas que el cobro ha entrado sin tener que revisar el proveedor externo. Si usas Stripe o similar, la notificación se genera tras recibir el webhook de pago exitoso.",
    related: ["not-21", "not-22", "not-39"],
    keywords: ["pago recibido", "cobro", "ingreso", "PAGO_RECIBIDO"],
  },
  {
    id: "not-21",
    section: "notificaciones",
    question: "¿Qué es la notificación PAGO_PENDIENTE?",
    answer:
      "Se dispara cuando hay un cobro programado que aún no se ha completado: el paciente abrió el checkout pero no finalizó, o la pasarela está esperando confirmación del banco. Te avisa para que puedas hacer seguimiento manual si el importe es relevante. Al clicar vas a la vista de pagos para ver el estado exacto. Normalmente se resuelve sola cuando el paciente completa o cuando la pasarela devuelve un resultado definitivo.",
    related: ["not-20", "not-22", "not-39"],
    keywords: ["pago pendiente", "cobro pendiente", "esperando", "PAGO_PENDIENTE"],
  },
  {
    id: "not-22",
    section: "notificaciones",
    question: "¿Qué es la notificación PAGO_FALLIDO?",
    answer:
      "Indica que un intento de cobro se rechazó: tarjeta caducada, fondos insuficientes, pago cancelado por el banco u otro motivo. Es importante atenderla cuanto antes porque suele implicar contactar al paciente para actualizar el método de pago. Al clicar vas a la ficha del pago con el motivo del fallo devuelto por la pasarela. Si no resuelves el fallo, el servicio asociado (suscripción, plan) puede quedar pendiente.",
    related: ["not-20", "not-21", "not-39"],
    keywords: ["pago fallido", "rechazado", "error pago", "PAGO_FALLIDO"],
  },
  {
    id: "not-23",
    section: "notificaciones",
    question: "¿Cuándo se crean las notificaciones de forma automática?",
    answer:
      "Hay dos mecanismos complementarios. Las de agenda y pago se crean en tiempo real al producirse el evento (un paciente solicita cita, una pasarela confirma un pago, etc.). Las de seguimiento (sin consulta, sin medidas, plan antiguo) se recalculan al cargar el dashboard o la página de notificaciones, revisando tus pacientes y detectando condiciones cumplidas. Por eso, al entrar por la mañana, es habitual ver avisos nuevos que no existían la tarde anterior.",
    related: ["not-24", "not-30", "not-43"],
    keywords: ["automáticas", "generación", "eventos", "dashboard"],
  },
  {
    id: "not-24",
    section: "notificaciones",
    question: "¿Cómo evita el sistema crear notificaciones duplicadas?",
    answer:
      "Cada tipo de notificación incorpora deduplicación basada en claves reales: para citas se usa `citaId`, para pacientes `pacienteId` más el tipo, y para pagos el identificador externo del cargo. Si ya existe una notificación activa con la misma clave, no se genera otra. Antes había duplicados ocasionales; ahora la regla es estricta, así que si ves dos avisos idénticos probablemente es que uno está leído y otro no, no realmente repetidos.",
    related: ["not-23", "not-25", "not-46"],
    keywords: ["duplicadas", "dedupe", "única", "FK"],
  },
  {
    id: "not-25",
    section: "notificaciones",
    question: "¿Qué pasa si se cancela una cita, la notificación se queda?",
    answer:
      "No. El sistema ejecuta una limpieza automática de notificaciones huérfanas: si la entidad asociada (cita, plan, pago) desaparece o cambia a un estado incompatible, las notificaciones que apuntaban a ella se eliminan o se marcan como obsoletas. Así, si cancelas una cita, las alertas \"CITA_HOY\" o \"CITA_SOLICITADA\" vinculadas se van con ella. Evita acumular ruido en el buzón.",
    related: ["not-24", "not-45", "not-46"],
    keywords: ["huérfanas", "limpieza", "cita cancelada", "automática"],
  },
  {
    id: "not-26",
    section: "notificaciones",
    question: "¿Puedo personalizar qué notificaciones recibo?",
    answer:
      "Sí. En `/notificaciones/preferencias` tienes un listado con todos los tipos disponibles y un interruptor por cada uno para activarlo o desactivarlo. Por ejemplo, si no quieres recibir avisos de DIARIO_NUEVO porque prefieres revisar los registros manualmente, lo apagas y dejan de generarse. Los cambios son inmediatos y solo afectan a las notificaciones futuras: las anteriores se mantienen en el historial.",
    related: ["not-27", "not-28", "not-42"],
    keywords: ["preferencias", "personalizar", "activar", "desactivar"],
  },
  {
    id: "not-27",
    section: "notificaciones",
    question: "¿Dónde están las preferencias de notificaciones?",
    answer:
      "Se encuentran en la ruta `/notificaciones/preferencias`, accesible desde un botón en la cabecera de la página principal de notificaciones. También se puede llegar desde el desplegable de la campanita pulsando el icono de engranaje. Las preferencias son por nutricionista, no por paciente, y se guardan en tu cuenta: si cambias de dispositivo, las conservas.",
    related: ["not-26", "not-28", "not-42"],
    keywords: ["preferencias", "ajustes", "configurar", "ubicación"],
  },
  {
    id: "not-28",
    section: "notificaciones",
    question: "¿Puedo desactivar solo algunos tipos y dejar los demás?",
    answer:
      "Sí, cada tipo es independiente. Puedes, por ejemplo, desactivar PACIENTE_SIN_MEDIDAS pero mantener PACIENTE_SIN_CONSULTA y todos los de pago. Se recomienda no apagar las de citas (CITA_SOLICITADA, CITA_CANCELADA_POR_PACIENTE) porque son las que requieren tu intervención directa y rápida. Si un tipo está desactivado, ni la campanita ni la página lo muestran, aunque los eventos sigan ocurriendo.",
    related: ["not-26", "not-27", "not-42"],
    keywords: ["desactivar tipo", "selectivo", "granular", "algunos"],
  },
  {
    id: "not-29",
    section: "notificaciones",
    question: "¿Qué son los puntos rojos sobre los avatares en /pacientes?",
    answer:
      "En el listado de pacientes, cada avatar puede mostrar un badge rojo con un número encima. Ese indicador representa cuántas notificaciones no leídas están relacionadas con ese paciente concreto (diario nuevo, sin medidas, plan antiguo, citas, etc.). Sirve para detectar rápidamente qué pacientes requieren tu atención sin entrar a la página de notificaciones. Al pasar el ratón sobre el badge aparece un tooltip con los títulos de los avisos.",
    related: ["not-30", "not-31", "not-32"],
    keywords: ["puntos rojos", "badge", "avatar", "paciente"],
  },
  {
    id: "not-30",
    section: "notificaciones",
    question: "¿Qué información muestra el tooltip del badge del paciente?",
    answer:
      "Al dejar el ratón sobre el badge rojo de un avatar se abre un tooltip con hasta 3 mensajes de las notificaciones no leídas asociadas a ese paciente. Si hay más de tres, al final aparece \"y N más\" con el número restante. La idea es que veas el contexto (por ejemplo, \"Diario nuevo\", \"Plan antiguo\", \"Sin medidas desde hace 40 días\") sin tener que abrir nada. Si quieres el detalle completo, entra a la ficha del paciente.",
    related: ["not-29", "not-31", "not-32"],
    keywords: ["tooltip", "hover", "mensajes", "3 más"],
  },
  {
    id: "not-31",
    section: "notificaciones",
    question: "¿Por qué hay badges rojos en las pestañas de la ficha del paciente?",
    answer:
      "Cada pestaña de la ficha (Mediciones, Seguimiento, Planificación, Consultas, etc.) puede mostrar un badge rojo con el número de notificaciones no leídas de ese tipo para ese paciente. Por ejemplo, un 2 sobre \"Mediciones\" indica dos avisos PACIENTE_SIN_MEDIDAS; un 1 sobre \"Seguimiento\" indica un DIARIO_NUEVO. Así sabes de un vistazo a qué pestaña ir primero sin mirar la página general de notificaciones.",
    related: ["not-29", "not-32", "not-33"],
    keywords: ["badges pestañas", "tabs", "ficha", "contador"],
  },
  {
    id: "not-32",
    section: "notificaciones",
    question: "¿Se marcan automáticamente como leídas al entrar a la ficha?",
    answer:
      "Sí, pero de forma granular. Al abrir una pestaña específica de la ficha del paciente, se marcan como leídas únicamente las notificaciones de ese tipo: entrar en \"Mediciones\" marca las PACIENTE_SIN_MEDIDAS, \"Seguimiento\" las DIARIO_NUEVO, \"Planificación\" las PLAN_ANTIGUO, etc. No se marcan todas a la vez. Esto hace que el badge del avatar baje solo en lo que realmente has atendido, manteniendo visibles los demás pendientes.",
    related: ["not-31", "not-33", "not-34"],
    keywords: ["auto-marcar", "entrar ficha", "pestaña", "granular"],
  },
  {
    id: "not-33",
    section: "notificaciones",
    question: "¿Por qué sigue saliendo el punto rojo después de ver al paciente?",
    answer:
      "Porque el marcado automático es por pestaña, no por paciente entero. Si entras a \"Consultas\" pero el aviso era de tipo DIARIO_NUEVO (pestaña Seguimiento), el badge del avatar sigue activo porque esa pestaña concreta no se ha visitado. Para limpiar todo, entra a cada pestaña con badge o marca las notificaciones manualmente desde la página `/notificaciones`. Es un diseño intencional para que no se te escape información nueva.",
    related: ["not-31", "not-32", "not-34"],
    keywords: ["punto sigue", "no baja", "pestaña específica", "por qué"],
  },
  {
    id: "not-34",
    section: "notificaciones",
    question: "¿Cómo sé qué pestaña concreta tiene avisos pendientes?",
    answer:
      "Entra a la ficha del paciente y observa las pestañas del menú superior: cada una con notificaciones no leídas muestra un pequeño badge rojo con un número al lado del nombre. Sumando los badges de las pestañas obtienes el mismo número que aparece en el avatar del listado. Es la forma más directa de saber dónde está el pendiente sin recurrir a la página general de notificaciones.",
    related: ["not-31", "not-32", "not-33"],
    keywords: ["pestaña", "saber", "dónde", "pendiente"],
  },
  {
    id: "not-35",
    section: "notificaciones",
    question: "¿Qué diferencia hay entre una notificación y un mensaje?",
    answer:
      "Una notificación es una alerta automática generada por el sistema a partir de un evento (cita, pago, paciente sin medidas). No hay conversación, no contesta nadie al otro lado. Un mensaje, en cambio, es una comunicación humano a humano entre tú y un paciente en el buzón de mensajería. Las notificaciones viven en `/notificaciones` y en la campanita; los mensajes viven en `/mensajes` y en el icono del sobre. Son sistemas independientes.",
    related: ["not-1", "not-2", "not-40"],
    keywords: ["diferencia", "mensaje", "alerta", "comparación"],
  },
  {
    id: "not-36",
    section: "notificaciones",
    question: "¿Qué información contiene cada notificación?",
    answer:
      "Cada notificación tiene un título corto, un mensaje descriptivo con datos concretos (nombre del paciente, fecha, importe, etc.), un tipo interno (CITA_SOLICITADA, DIARIO_NUEVO…), un estado leído/no leído, una fecha de creación y un enlace al sitio relevante de la app. Muchas incluyen además un `pacienteId` y/o `citaId` para enlazar con la entidad real y poder deduplicar. Todo ello se renderiza como una tarjeta con estilos distintos según estado.",
    related: ["not-1", "not-4", "not-44"],
    keywords: ["estructura", "campos", "datos", "información"],
  },
  {
    id: "not-37",
    section: "notificaciones",
    question: "¿Reciben notificaciones los pacientes también?",
    answer:
      "Sí, pero con un sistema paralelo en su portal. Cuando un nutricionista propone o confirma una cita, el paciente ve en su panel un aviso equivalente. No comparte la misma tabla visualmente, pero la mecánica es similar: campanita, listado, marcar como leído. Lo que tú ves en `/notificaciones` es exclusivo del nutricionista; tus pacientes tienen su propio buzón en su portal, diseñado con menos tipos y más orientado a recordatorios.",
    related: ["not-1", "not-35", "not-40"],
    keywords: ["paciente notificaciones", "portal", "equivalente", "otro lado"],
  },
  {
    id: "not-38",
    section: "notificaciones",
    question: "¿Me llegan notificaciones por email?",
    answer:
      "Actualmente no. Todas las notificaciones son internas a la app: aparecen en la campanita y en `/notificaciones`, pero no se envían copias por correo electrónico. Para no perderte nada importante, revisa la aplicación al menos una vez al día, sobre todo por la mañana para ver las citas de hoy y las solicitudes pendientes. En el futuro se valorará añadir resúmenes por email, pero no es una función activa.",
    related: ["not-39", "not-48", "not-50"],
    keywords: ["email", "correo", "no", "soporte"],
  },
  {
    id: "not-39",
    section: "notificaciones",
    question: "¿Hay notificaciones push en móvil?",
    answer:
      "No, actualmente Annonia no envía notificaciones push al navegador ni a dispositivos móviles. Los avisos se consultan abriendo la aplicación y la campanita se actualiza cada 45 segundos mientras la tienes abierta. Si trabajas mucho desde el móvil, puedes añadir la app como acceso directo en la pantalla de inicio para entrar rápido, pero no recibirás alertas fuera de ella. Es una función contemplada para iteraciones futuras.",
    related: ["not-38", "not-48", "not-50"],
    keywords: ["push", "móvil", "no", "navegador"],
  },
  {
    id: "not-40",
    section: "notificaciones",
    question: "¿Si un paciente me escribe un mensaje, recibo notificación?",
    answer:
      "El mensaje aparece en el buzón de mensajería y se cuenta en el icono del sobre del header, pero no genera una entrada en `/notificaciones`. Ambos sistemas son deliberadamente separados para no mezclar alertas del sistema con conversaciones. Si quieres un contador unificado de cosas pendientes, suma mentalmente la campanita (alertas) y el sobre (mensajes). Cada uno tiene su propio flujo y su propia configuración.",
    related: ["not-1", "not-35", "not-37"],
    keywords: ["mensaje llega", "sobre", "diferente", "separado"],
  },
  {
    id: "not-41",
    section: "notificaciones",
    question: "¿Hay un límite de notificaciones que puedo guardar?",
    answer:
      "Sí, se conservan hasta 100 notificaciones por nutricionista. Cuando se supera ese número, las más antiguas se van borrando automáticamente para dejar sitio a las nuevas. El criterio es primero las leídas más viejas y, si hiciera falta, también no leídas muy antiguas. En la práctica, si revisas la campanita con regularidad nunca verás ese tope; solo se nota tras periodos largos sin entrar.",
    related: ["not-45", "not-46", "not-47"],
    keywords: ["límite", "100", "máximo", "capacidad"],
  },
  {
    id: "not-42",
    section: "notificaciones",
    question: "¿Puedo desactivar todas las notificaciones a la vez?",
    answer:
      "Puedes ir a `/notificaciones/preferencias` y desactivar los interruptores uno por uno, pero no hay un botón global para silenciarlas todas. Es intencional: tener al menos las de citas activas es casi imprescindible para no perder consultas. Si te saturan, revisa primero qué tipo te sobra (por ejemplo DIARIO_NUEVO si tienes muchos pacientes con diario diario) y desactívalo. El resto sigue llegando normalmente.",
    related: ["not-26", "not-27", "not-28"],
    keywords: ["desactivar todas", "silenciar", "global", "apagar"],
  },
  {
    id: "not-43",
    section: "notificaciones",
    question: "¿Con qué frecuencia se actualizan las notificaciones?",
    answer:
      "En el cliente hay un polling ligero cada 45 segundos que consulta si hay nuevas notificaciones y actualiza el contador de la campanita y la página si la tienes abierta. Además, al entrar al dashboard se ejecuta un recálculo que detecta condiciones como \"sin medidas desde hace 30 días\" y crea los avisos pertinentes. Con estas dos vías, en la práctica nunca pasan más de unos pocos minutos sin que la lista esté al día.",
    related: ["not-23", "not-24", "not-48"],
    keywords: ["polling", "actualizar", "45 segundos", "refresco"],
  },
  {
    id: "not-44",
    section: "notificaciones",
    question: "¿Se puede filtrar o buscar dentro de las notificaciones?",
    answer:
      "La vista principal agrupa por fecha (Hoy, Ayer, Esta semana, Anteriores) pero no incluye un buscador ni filtros por tipo dentro de la propia página. Si necesitas encontrar un aviso concreto, lo más práctico es usar el agrupado por fecha y las etiquetas de tipo visibles en cada tarjeta. Para contextos muy específicos, navegar al paciente o a la agenda suele ser más rápido que buscar la notificación original.",
    related: ["not-8", "not-9", "not-36"],
    keywords: ["filtrar", "buscar", "filtros", "tipo"],
  },
  {
    id: "not-45",
    section: "notificaciones",
    question: "¿Cuánto tiempo se guardan las notificaciones?",
    answer:
      "Las notificaciones leídas se conservan durante 30 días y después se eliminan automáticamente para que el listado no crezca indefinidamente. Las no leídas no tienen fecha de expiración directa pero se ven afectadas por el tope de 100 por nutricionista. Si necesitas que un aviso sobreviva, atiéndelo cuanto antes; si quieres que desaparezca ya, bórralo con el botón 🗑 o espera a la limpieza automática.",
    related: ["not-41", "not-47", "not-49"],
    keywords: ["retención", "30 días", "cuánto tiempo", "expiración"],
  },
  {
    id: "not-46",
    section: "notificaciones",
    question: "¿Qué son las notificaciones huérfanas y cómo se limpian?",
    answer:
      "Son notificaciones cuya entidad relacionada ya no existe: por ejemplo, un aviso de cita que apuntaba a una cita luego eliminada. El sistema detecta estas incoherencias y las borra automáticamente para que no te aparezcan enlaces rotos al hacer clic. También se disparan limpiezas cuando cambias el estado de entidades clave (paciente archivado, plan borrado). Así, el historial solo contiene avisos útiles y vivos.",
    related: ["not-24", "not-25", "not-45"],
    keywords: ["huérfanas", "limpieza", "rotas", "obsoletas"],
  },
  {
    id: "not-47",
    section: "notificaciones",
    question: "¿Cómo afecta el rendimiento de la app tener muchas notificaciones?",
    answer:
      "Muy poco. El listado está paginado internamente, el polling consulta solo la cuenta y el delta reciente, y las limpiezas automáticas evitan que la tabla crezca sin control. Incluso con el tope de 100 activas y varios meses de uso, la página sigue cargando en décimas de segundo. Si notases lentitud (tu internet es lento, por ejemplo), el botón \"Marcar todas como leídas\" reduce la carga visual al mínimo.",
    related: ["not-41", "not-43", "not-45"],
    keywords: ["rendimiento", "performance", "lento", "rápido"],
  },
  {
    id: "not-48",
    section: "notificaciones",
    question: "¿Cada cuánto debo abrir la campanita?",
    answer:
      "Se recomienda echar un ojo a primera hora de la mañana para revisar citas del día y solicitudes pendientes, y a última hora de la tarde para cerrar lo del día. Como el contador se actualiza cada 45 segundos mientras tienes la app abierta, si trabajas con ella siempre de fondo verás los nuevos avisos aparecer sin hacer nada. No es necesario entrar varias veces al día si ya estás activo en la plataforma.",
    related: ["not-3", "not-43", "not-49"],
    keywords: ["cuándo abrir", "frecuencia", "rutina", "hábito"],
  },
  {
    id: "not-49",
    section: "notificaciones",
    question: "¿Se guarda un historial permanente de notificaciones?",
    answer:
      "No exactamente. Se guarda un historial operativo útil, pero con las reglas descritas: 30 días de retención para leídas y un máximo de 100 por nutricionista. No es un registro legal ni de auditoría; para eso están los eventos reales (citas, mediciones, pagos), que sí tienen su propio historial permanente. La página `/notificaciones` es una herramienta de trabajo, no un archivo eterno.",
    related: ["not-41", "not-45", "not-50"],
    keywords: ["historial", "permanente", "archivo", "registro"],
  },
  {
    id: "not-50",
    section: "notificaciones",
    question: "¿Cómo borro notificaciones antiguas que ya no necesito?",
    answer:
      "Tienes tres vías. La más rápida es usar el botón 🗑 de cada notificación al hacer hover, que la elimina al instante. La segunda es \"Marcar todas como leídas\" y dejar que el sistema las purgue a los 30 días. La tercera es simplemente no hacer nada: cuando superes las 100 activas, las más antiguas empezarán a eliminarse solas. En la práctica, con el uso diario el buzón se mantiene limpio sin esfuerzo manual.",
    related: ["not-6", "not-7", "not-45"],
    keywords: ["borrar antiguas", "limpiar", "eliminar", "viejas"],
  },
];
