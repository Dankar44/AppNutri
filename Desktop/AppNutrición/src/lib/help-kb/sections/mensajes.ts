import type { HelpEntry } from "../types";

export const MENSAJES_ENTRIES: HelpEntry[] = [
  {
    id: "msg-1",
    section: "mensajes",
    question: "¿Qué es la sección Mensajes?",
    answer:
      "Mensajes es el canal de comunicación directa entre tú y cada uno de tus pacientes. Funciona como una mensajería privada 1 a 1, similar a un chat tradicional. No es una IA ni un bot: al otro lado siempre hay una persona (el paciente). Sirve para resolver dudas entre consultas, enviar indicaciones, hacer seguimiento y mantener el vínculo terapéutico.",
    related: ["msg-2", "msg-3", "msg-29"],
    keywords: ["mensajes", "chat", "mensajería", "qué es", "comunicación"],
  },
  {
    id: "msg-2",
    section: "mensajes",
    question: "¿Cómo envío un mensaje a un paciente?",
    answer:
      "Entra en /mensajes, selecciona al paciente en la lista de la izquierda y escribe en el cuadro inferior del chat. Al pulsar enviar, el mensaje aparece inmediatamente en la conversación y llega al portal del paciente. Si aún no habías hablado con ese paciente, la conversación se crea automáticamente con el primer mensaje. No hace falta un botón de \"nueva conversación\".",
    related: ["msg-6", "msg-12", "msg-13"],
    keywords: ["enviar", "mensaje", "paciente", "escribir"],
  },
  {
    id: "msg-3",
    section: "mensajes",
    question: "¿Dónde veo mis conversaciones?",
    answer:
      "En la columna izquierda de /mensajes tienes la lista de conversaciones, una por paciente con el que has hablado. Cada elemento muestra el nombre del paciente, una vista previa del último mensaje y la hora. Al hacer clic se abre el chat completo a la derecha. Si todavía no tienes conversaciones, la lista aparece vacía.",
    related: ["msg-4", "msg-5", "msg-6"],
    keywords: ["lista", "conversaciones", "panel", "izquierda"],
  },
  {
    id: "msg-4",
    section: "mensajes",
    question: "¿En qué orden aparecen las conversaciones?",
    answer:
      "Las conversaciones se ordenan por el último mensaje enviado o recibido, de más reciente a más antiguo. Es decir, cualquier paciente con actividad reciente sube automáticamente a lo alto de la lista. Este orden es cronológico inverso y no se puede cambiar manualmente. Así tienes siempre a la vista los chats activos.",
    related: ["msg-3", "msg-39"],
    keywords: ["orden", "cronológico", "último mensaje", "lista"],
  },
  {
    id: "msg-5",
    section: "mensajes",
    question: "¿Puedo buscar a un paciente en la lista de conversaciones?",
    answer:
      "Sí. Encima de la lista de conversaciones hay un buscador que filtra por nombre del paciente. Escribe parte del nombre y la lista se reduce a las coincidencias. Es útil cuando tienes muchas conversaciones abiertas. El buscador no filtra por contenido del mensaje, solo por paciente.",
    related: ["msg-3", "msg-4"],
    keywords: ["buscar", "filtrar", "paciente", "buscador"],
  },
  {
    id: "msg-6",
    section: "mensajes",
    question: "¿Cómo creo una conversación nueva con un paciente?",
    answer:
      "No hay un botón explícito de \"crear conversación\": se crea automáticamente al enviar el primer mensaje. Desde la ficha del paciente o desde /mensajes puedes iniciar el chat escribiendo directamente. Si el paciente aún no existía en tu lista, aparecerá al confirmar el primer envío. Cada paciente solo puede tener una conversación activa contigo.",
    related: ["msg-2", "msg-7"],
    keywords: ["crear", "nueva conversación", "iniciar", "primer mensaje"],
  },
  {
    id: "msg-7",
    section: "mensajes",
    question: "¿Hay conversaciones de grupo o chats colectivos?",
    answer:
      "No. Mensajes está diseñado exclusivamente como canal 1 a 1 entre tú y cada paciente. No puedes crear grupos, ni añadir a varios pacientes a la misma conversación, ni reenviar un mensaje a varios a la vez. Si quieres comunicar lo mismo a varios pacientes, tendrás que escribirlo en cada conversación individualmente. Esto protege la privacidad clínica.",
    related: ["msg-6", "msg-22"],
    keywords: ["grupo", "colectivo", "varios pacientes", "chat grupal"],
  },
  {
    id: "msg-8",
    section: "mensajes",
    question: "¿Cómo marco un mensaje como leído?",
    answer:
      "Los mensajes se marcan como leídos automáticamente cuando abres la conversación correspondiente. No hace falta pulsar ningún botón. En ese momento desaparece el indicador de no leído de esa conversación y se actualiza el contador del sidebar. Si solo pasas por /mensajes sin abrir el chat, los mensajes siguen marcados como no leídos.",
    related: ["msg-9", "msg-11"],
    keywords: ["leído", "marcar", "leer", "abrir"],
  },
  {
    id: "msg-9",
    section: "mensajes",
    question: "¿Qué significa el indicador de \"leído\"?",
    answer:
      "Cuando envías un mensaje, aparece un pequeño indicador que cambia de estado cuando el paciente lo abre. Así sabes si tu mensaje ha sido visto, similar al doble check de otras mensajerías. El indicador se actualiza al instante, en cuanto el paciente entra en su portal y ve la conversación. Si el mensaje sigue sin marcarse como leído, significa que aún no lo ha abierto.",
    related: ["msg-8", "msg-17"],
    keywords: ["leído", "indicador", "visto", "check"],
  },
  {
    id: "msg-10",
    section: "mensajes",
    question: "¿Recibo una notificación cuando un paciente me escribe?",
    answer:
      "Sí. Cada vez que un paciente envía un mensaje, se genera una notificación interna en AppNutrición que aparece en el centro de notificaciones y como punto en el sidebar. Al hacer clic te lleva directamente a esa conversación. Si tienes activado el correo para eventos de mensajería, también recibirás un aviso por email. La notificación se marca como leída al abrir el chat.",
    related: ["msg-11", "msg-17"],
    keywords: ["notificación", "aviso", "recibir", "paciente escribe"],
  },
  {
    id: "msg-11",
    section: "mensajes",
    question: "¿Qué es el contador de no leídos del sidebar?",
    answer:
      "En la barra lateral, junto al icono de Mensajes, aparece un pequeño badge con el número de mensajes pendientes de leer. Suma todos los mensajes no leídos de todas tus conversaciones. El contador se actualiza en tiempo real y desaparece cuando no queda nada por leer. Es la forma rápida de saber si tienes pacientes esperando respuesta.",
    related: ["msg-8", "msg-10"],
    keywords: ["badge", "contador", "sidebar", "no leídos"],
  },
  {
    id: "msg-12",
    section: "mensajes",
    question: "¿Cómo respondo a un mensaje?",
    answer:
      "Abre la conversación del paciente y escribe tu respuesta en el cuadro inferior. No hay una función de \"responder a un mensaje concreto\" como en otras apps: los mensajes fluyen en orden cronológico dentro de la conversación. Al enviar, tu mensaje aparece como una burbuja y se añade al hilo. El paciente recibe el aviso al instante en su portal.",
    related: ["msg-2", "msg-13"],
    keywords: ["responder", "contestar", "respuesta"],
  },
  {
    id: "msg-13",
    section: "mensajes",
    question: "¿Cómo envío con Enter y cómo hago un salto de línea?",
    answer:
      "Pulsar Enter envía el mensaje directamente, igual que en la mayoría de mensajerías. Si necesitas escribir en varias líneas o añadir un párrafo, usa Shift + Enter para insertar un salto de línea sin enviar. Así puedes redactar mensajes largos y enviarlos cuando estén listos. El cuadro se expande automáticamente a medida que escribes.",
    related: ["msg-2", "msg-12"],
    keywords: ["enter", "shift", "salto de línea", "enviar"],
  },
  {
    id: "msg-14",
    section: "mensajes",
    question: "¿Puedo enviar archivos adjuntos en el chat?",
    answer:
      "Si tu versión tiene habilitados los adjuntos, verás un icono de clip en el cuadro del mensaje para subir archivos (PDF, imágenes, etc.) directamente al chat. El paciente podrá descargarlos desde su portal. Si no aparece el icono, el envío de archivos no está activado en tu cuenta; en ese caso puedes usar la sección Entregables del paciente. Los archivos se guardan cifrados en el almacenamiento de la app.",
    related: ["msg-27", "msg-35"],
    keywords: ["archivo", "adjunto", "subir", "documento"],
  },
  {
    id: "msg-15",
    section: "mensajes",
    question: "¿Puedo usar emojis en los mensajes?",
    answer:
      "Sí. Puedes escribir emojis nativos del sistema operativo con el selector de emojis del teclado (en Mac, Cmd + Ctrl + Espacio; en Windows, Win + .). Se muestran correctamente tanto a ti como al paciente en su portal. Se guardan como caracteres Unicode y no afectan al rendimiento del chat. Úsalos con moderación en contextos clínicos.",
    related: ["msg-30", "msg-33"],
    keywords: ["emoji", "emojis", "iconos"],
  },
  {
    id: "msg-16",
    section: "mensajes",
    question: "¿Puedo mencionar a alguien con @?",
    answer:
      "No. Como las conversaciones son 1 a 1 entre tú y un solo paciente, no existe el concepto de mención con @. No hay otros participantes a los que llamar la atención dentro del chat. Si escribes @ será tratado como texto normal y no activará ninguna funcionalidad especial. Las menciones son propias de chats de equipo, y AppNutrición no los tiene.",
    related: ["msg-7"],
    keywords: ["mención", "arroba", "@", "mencionar"],
  },
  {
    id: "msg-17",
    section: "mensajes",
    question: "¿Cómo se avisa al paciente de que le he escrito?",
    answer:
      "Cuando envías un mensaje, el paciente recibe una notificación en su portal (campana con un punto rojo) y un contador en su sección de Mensajes. Si tiene el email activado para mensajes, también recibirá un correo. De esta forma no depende de que esté conectado en ese momento. Al abrir la conversación, la notificación se marca como leída.",
    related: ["msg-9", "msg-10"],
    keywords: ["avisar", "notificar", "paciente", "portal"],
  },
  {
    id: "msg-18",
    section: "mensajes",
    question: "¿Puedo editar un mensaje después de enviarlo?",
    answer:
      "No. Por trazabilidad clínica, los mensajes son inmutables una vez enviados. No existe la opción \"editar\" ni \"corregir\" el contenido. Si te has equivocado, lo mejor es enviar un nuevo mensaje aclarando el anterior. Esto garantiza que el historial de la conversación refleje fielmente lo que se dijo en cada momento.",
    related: ["msg-19", "msg-20"],
    keywords: ["editar", "modificar", "corregir", "cambiar"],
  },
  {
    id: "msg-19",
    section: "mensajes",
    question: "¿Puedo borrar un mensaje concreto?",
    answer:
      "No. Los mensajes individuales no se pueden eliminar una vez enviados, ni por tu parte ni por la del paciente. Esto es una decisión deliberada para mantener la integridad del historial clínico. Si lo necesitas por motivos legales (por ejemplo, contenido sensible), contacta con soporte. Para correcciones cotidianas, simplemente envía un mensaje aclaratorio.",
    related: ["msg-18", "msg-38"],
    keywords: ["borrar", "eliminar", "mensaje", "quitar"],
  },
  {
    id: "msg-20",
    section: "mensajes",
    question: "¿Puedo borrar una conversación entera?",
    answer:
      "No. Las conversaciones no pueden eliminarse manualmente desde la interfaz. Solo se borran automáticamente si eliminas al paciente (ver mensaje correspondiente). Esto evita perder por error parte del historial clínico. Si tienes una razón legítima para borrar una conversación concreta, escríbenos a soporte.",
    related: ["msg-19", "msg-44"],
    keywords: ["borrar", "eliminar", "conversación", "entera"],
  },
  {
    id: "msg-21",
    section: "mensajes",
    question: "¿Cuánto tiempo se guardan los mensajes?",
    answer:
      "El histórico de mensajes es ilimitado mientras la cuenta esté activa. No hay un límite de antigüedad ni se borran automáticamente los mensajes antiguos. Puedes desplazarte hacia arriba dentro del chat para cargar mensajes anteriores hasta el principio. Así tienes siempre disponible la conversación completa con cada paciente.",
    related: ["msg-22", "msg-24"],
    keywords: ["guardar", "histórico", "tiempo", "antigüedad"],
  },
  {
    id: "msg-22",
    section: "mensajes",
    question: "¿Puedo exportar el historial de un chat?",
    answer:
      "No, actualmente la exportación de conversaciones no está soportada. No hay un botón para descargar el chat en PDF, CSV o texto plano. Si necesitas una copia por motivos legales, ponte en contacto con soporte para solicitarla manualmente. Estamos valorando añadir la exportación en futuras versiones.",
    related: ["msg-21", "msg-24"],
    keywords: ["exportar", "descargar", "chat", "historial"],
  },
  {
    id: "msg-23",
    section: "mensajes",
    question: "¿Puedo archivar una conversación?",
    answer:
      "No, el archivado de conversaciones no está disponible. Todas las conversaciones permanecen siempre en la lista principal, ordenadas por último mensaje. Si hay un paciente que no consulta a menudo, su chat simplemente baja en la lista. Para casos de pacientes que ya no están en seguimiento, lo recomendado es Desactivar paciente.",
    related: ["msg-25", "msg-43"],
    keywords: ["archivar", "archivo", "ocultar", "conversación"],
  },
  {
    id: "msg-24",
    section: "mensajes",
    question: "¿Cómo puedo hacer una copia de seguridad de los mensajes?",
    answer:
      "AppNutrición ya hace copias de seguridad internas de toda la base de datos, incluidos los mensajes, como parte de la infraestructura. No hay una herramienta de usuario para descargar backups manualmente. Si necesitas una copia específica de las conversaciones, tendrías que pedirla por soporte. En general, confía en que los datos están resguardados en el servidor.",
    related: ["msg-21", "msg-22"],
    keywords: ["copia", "backup", "seguridad", "respaldo"],
  },
  {
    id: "msg-25",
    section: "mensajes",
    question: "¿Puedo silenciar o mutear a un paciente?",
    answer:
      "No, no existe la opción de silenciar notificaciones de un paciente concreto. Si te resulta muy ruidoso recibir avisos en tiempo real, puedes ajustar las preferencias generales de notificaciones en Ajustes. Las alertas dentro de la app son sutiles (un punto y un contador) y no hacen ruido por defecto. Si quieres menos notificaciones, desactívalas globalmente.",
    related: ["msg-23", "msg-26"],
    keywords: ["silenciar", "mutear", "notificación", "mute"],
  },
  {
    id: "msg-26",
    section: "mensajes",
    question: "¿Puedo bloquear a un paciente para que no pueda escribirme?",
    answer:
      "No existe una función de bloqueo específica en el chat. Si no quieres recibir más mensajes de un paciente, lo recomendable es usar Desactivar paciente desde su ficha, lo que impide que pueda escribir nuevos mensajes. El historial se conserva por trazabilidad. Si el caso es grave (abuso o acoso), contacta con soporte para tomar medidas adicionales.",
    related: ["msg-42", "msg-44"],
    keywords: ["bloquear", "bloqueo", "impedir", "paciente"],
  },
  {
    id: "msg-27",
    section: "mensajes",
    question: "¿Puedo enviar imágenes por el chat?",
    answer:
      "Sí, si tu versión tiene adjuntos habilitados, puedes subir imágenes directamente (por ejemplo, fotos de comida, etiquetas, analíticas). Se muestran como vista previa en el chat del paciente y pueden descargarse. Si no ves el icono de clip, significa que tu cuenta no tiene imágenes habilitadas. En ese caso usa la sección Entregables o Mediciones.",
    related: ["msg-14", "msg-35"],
    keywords: ["imagen", "foto", "subir", "imágenes"],
  },
  {
    id: "msg-28",
    section: "mensajes",
    question: "¿Hay respuestas automáticas o plantillas?",
    answer:
      "No. AppNutrición no ofrece actualmente respuestas automáticas predefinidas ni plantillas guardadas para el chat. Cada mensaje se escribe manualmente en el momento. Si usas las mismas frases con frecuencia, puedes crearte atajos en tu sistema operativo o copiarlos de un documento personal. Estamos evaluando añadir plantillas en el futuro.",
    related: ["msg-29", "msg-31"],
    keywords: ["plantilla", "respuesta automática", "auto", "predefinida"],
  },
  {
    id: "msg-29",
    section: "mensajes",
    question: "¿Hay un chatbot o IA que responde por mí?",
    answer:
      "No. Mensajes es un canal humano-humano: los mensajes los escribes tú y los responde el paciente (o viceversa). No hay ninguna IA que conteste en tu nombre, ni sugerencias automáticas de respuesta. La IA de AppNutrición solo se usa en otras secciones como generación de planes o sugerencias de recetas, nunca en la mensajería.",
    related: ["msg-1", "msg-28"],
    keywords: ["IA", "chatbot", "bot", "automático"],
  },
  {
    id: "msg-30",
    section: "mensajes",
    question: "¿Qué diferencia hay entre un mensaje y una nota de consulta?",
    answer:
      "Las notas que escribes dentro de una consulta son privadas: solo tú las ves, son tu historial clínico personal. Un mensaje, en cambio, se envía al paciente y lo ve en su portal. Si quieres que el paciente lea algo, usa Mensajes; si es información interna para ti (diagnóstico, observaciones, reflexiones), usa notas de la consulta. No mezcles ambos canales.",
    related: ["msg-31", "msg-32"],
    keywords: ["diferencia", "nota", "consulta", "privada"],
  },
  {
    id: "msg-31",
    section: "mensajes",
    question: "¿Qué buenas prácticas hay al escribir a pacientes?",
    answer:
      "Mantén un tono profesional, claro y respetuoso, incluso en conversaciones informales. Evita diagnosticar por chat si no tienes información suficiente y recuerda que un mensaje escrito puede malinterpretarse. Responde en plazos razonables y, si vas a estar ausente, avisa. Para temas complejos, propón una consulta en lugar de extender el chat.",
    related: ["msg-32", "msg-33"],
    keywords: ["buenas prácticas", "profesional", "tono", "consejos"],
  },
  {
    id: "msg-32",
    section: "mensajes",
    question: "¿Puedo mostrar mi horario de atención en el chat?",
    answer:
      "Si has configurado un horario de atención en tu perfil, aparecerá como texto informativo en la cabecera de la conversación (por ejemplo, \"Atiendo mensajes de lunes a viernes, 9:00 a 18:00\"). Así el paciente tiene expectativas realistas. Si no has configurado nada, no se muestra ningún horario. Ajústalo desde Ajustes > Perfil.",
    related: ["msg-31", "msg-33"],
    keywords: ["horario", "atención", "disponibilidad", "cabecera"],
  },
  {
    id: "msg-33",
    section: "mensajes",
    question: "¿Puedo marcar que estoy fuera de oficina?",
    answer:
      "Actualmente no hay un modo \"ausente\" o \"fuera de oficina\" que responda automáticamente. Si vas a estar desconectado durante un tiempo (vacaciones, viaje, baja), lo mejor es avisarlo manualmente a tus pacientes con un mensaje previo. También puedes indicarlo en tu horario de atención. Estamos valorando añadir esta funcionalidad en el futuro.",
    related: ["msg-28", "msg-32"],
    keywords: ["ausente", "fuera de oficina", "vacaciones", "auto-respuesta"],
  },
  {
    id: "msg-34",
    section: "mensajes",
    question: "¿Los enlaces (URLs) son clicables en el chat?",
    answer:
      "Sí. Cuando escribes una URL en un mensaje, la app la detecta automáticamente y la convierte en un enlace clicable tanto para ti como para el paciente. Al pulsarlo se abre en una nueva pestaña del navegador. Puedes enviar enlaces a artículos, vídeos, recetas externas o formularios sin problema. No se generan vistas previas del contenido del enlace.",
    related: ["msg-35", "msg-36"],
    keywords: ["enlace", "URL", "link", "clicable"],
  },
  {
    id: "msg-35",
    section: "mensajes",
    question: "¿Puedo usar markdown o formato enriquecido?",
    answer:
      "No. El editor de mensajes es texto plano (con emojis y saltos de línea). No se interpreta markdown: escribir **negrita** o _cursiva_ se mostrará literal, no formateado. Si necesitas enviar algo con formato (tablas, encabezados), sube un PDF como adjunto o comparte un enlace a un documento. Esto simplifica el chat y evita errores de render.",
    related: ["msg-14", "msg-34"],
    keywords: ["markdown", "formato", "negrita", "cursiva"],
  },
  {
    id: "msg-36",
    section: "mensajes",
    question: "¿Puedo iniciar una videollamada desde el chat?",
    answer:
      "No directamente desde el chat. Las videollamadas en AppNutrición se gestionan desde Agenda, creando una cita con enlace de Google Meet. Una vez creada, el enlace aparece en la cita y puede compartirse con el paciente. Si el paciente te pide una videollamada por chat, crea una cita en Agenda y contéstale con el enlace. No hay un botón de \"videollamada ahora\" en el chat.",
    related: ["msg-34", "msg-37"],
    keywords: ["videollamada", "vídeo", "meet", "llamada"],
  },
  {
    id: "msg-37",
    section: "mensajes",
    question: "¿Puedo hacer llamadas de voz desde el chat?",
    answer:
      "No. AppNutrición no integra llamadas de voz ni videollamadas dentro del chat. Para audio o vídeo, lo habitual es programar una cita con enlace de Google Meet desde Agenda. Si necesitas una llamada urgente por teléfono, hazlo fuera de la app con los datos de contacto del paciente. El chat está pensado para mensajes escritos.",
    related: ["msg-36"],
    keywords: ["llamada", "voz", "audio", "teléfono"],
  },
  {
    id: "msg-38",
    section: "mensajes",
    question: "¿Los mensajes están cifrados de extremo a extremo?",
    answer:
      "No. Los mensajes se almacenan en la base de datos de AppNutrición para que puedan mostrarse tanto a ti como al paciente desde cualquier dispositivo. No usamos cifrado end-to-end como Signal o WhatsApp. Sí se cifran en tránsito (HTTPS) y están protegidos por la infraestructura de la plataforma. Ten esto en cuenta al tratar información muy sensible y usa el canal adecuado.",
    related: ["msg-39", "msg-40"],
    keywords: ["cifrado", "end to end", "privacidad", "encriptación"],
  },
  {
    id: "msg-39",
    section: "mensajes",
    question: "¿Quién puede ver los mensajes que envío?",
    answer:
      "Solo tú (el nutricionista) y el paciente destinatario pueden ver el contenido de la conversación a través de sus respectivas vistas en la app. Ningún otro paciente tiene acceso a los mensajes de otro. El personal técnico de AppNutrición no lee rutinariamente conversaciones, aunque técnicamente podría acceder a la base de datos en caso de incidencia. Es tu responsabilidad tratar la información clínica con cuidado.",
    related: ["msg-38", "msg-40"],
    keywords: ["privacidad", "quién ve", "acceso", "confidencial"],
  },
  {
    id: "msg-40",
    section: "mensajes",
    question: "¿Es seguro enviar datos clínicos por el chat?",
    answer:
      "Es seguro en términos de transporte (HTTPS) y acceso controlado, pero no hay cifrado extremo-a-extremo. Para información muy sensible (diagnósticos, historial completo, analíticas detalladas), puede ser preferible usar la sección Entregables o la propia ficha del paciente, que tienen un marco clínico más explícito. Para indicaciones y seguimiento diario, el chat es adecuado. Valora el nivel de sensibilidad en cada caso.",
    related: ["msg-38", "msg-39"],
    keywords: ["seguridad", "datos clínicos", "sensible", "confidencial"],
  },
  {
    id: "msg-41",
    section: "mensajes",
    question: "¿Puedo priorizar o fijar una conversación arriba?",
    answer:
      "No, actualmente no existe la opción de fijar (pinear) una conversación arriba de todas. La lista se ordena automáticamente por el último mensaje, sin excepciones. Si quieres tener cerca a un paciente, escríbele y su conversación subirá al principio. Estamos valorando añadir la opción de fijar en futuras versiones.",
    related: ["msg-4", "msg-23"],
    keywords: ["fijar", "priorizar", "pin", "arriba"],
  },
  {
    id: "msg-42",
    section: "mensajes",
    question: "¿Qué pasa con el chat si desactivo a un paciente?",
    answer:
      "Si desactivas a un paciente desde su ficha, la conversación permanece intacta: no se borra y sigues viéndola en /mensajes en modo consulta. El paciente, sin embargo, pierde acceso a su portal y ya no puede responder ni enviarte nada nuevo. Es la forma recomendada de \"pausar\" la relación sin perder el historial. Puedes reactivarlo más adelante si es necesario.",
    related: ["msg-26", "msg-43"],
    keywords: ["desactivar", "paciente", "pausar", "inactivo"],
  },
  {
    id: "msg-43",
    section: "mensajes",
    question: "Si reactivo a un paciente, ¿recupera el chat?",
    answer:
      "Sí. Al reactivar un paciente que habías desactivado, su conversación sigue disponible tal cual estaba, con todo el historial. El paciente recupera acceso a su portal y puede volver a escribirte. La reactivación no crea un chat nuevo ni duplica la conversación. Es como si hubieras pausado temporalmente el canal.",
    related: ["msg-42"],
    keywords: ["reactivar", "paciente", "recuperar", "restaurar"],
  },
  {
    id: "msg-44",
    section: "mensajes",
    question: "¿Qué pasa con el chat si elimino a un paciente definitivamente?",
    answer:
      "Si eliminas a un paciente (no solo desactivarlo, sino borrado definitivo), su conversación y todos los mensajes asociados se borran también. Esta acción es irreversible: no se puede recuperar el historial del chat una vez eliminado el paciente. Por eso el borrado definitivo está en Ajustes > Zona peligrosa y pide confirmación. Si quieres conservar el chat, usa Desactivar en lugar de Eliminar.",
    related: ["msg-20", "msg-42"],
    keywords: ["eliminar", "borrar", "paciente", "definitivo"],
  },
  {
    id: "msg-45",
    section: "mensajes",
    question: "No me aparece la sección Mensajes o está vacía, ¿qué hago?",
    answer:
      "Si no ves /mensajes en el sidebar, asegúrate de estar en el rol de nutricionista (no en el portal del paciente) y de tener la sesión iniciada correctamente. Si la lista aparece vacía, es porque aún no has iniciado ninguna conversación: escribe a un paciente desde su ficha o desde /mensajes y la conversación se creará sola. Si el problema persiste, prueba a recargar la página y, si sigue fallando, contacta con soporte.",
    related: ["msg-1", "msg-6"],
    keywords: ["no aparece", "vacío", "problema", "error"],
  },
];
