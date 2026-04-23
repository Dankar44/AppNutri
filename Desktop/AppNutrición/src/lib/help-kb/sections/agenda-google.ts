import type { HelpEntry } from "../types";

export const AGENDA_GOOGLE_ENTRIES: HelpEntry[] = [
  {
    id: "ago-1",
    section: "agenda-google",
    question: "¿Qué es la integración con Google Calendar en AppNutrición?",
    answer:
      "Es una conexión opcional que permite sincronizar las citas creadas en AppNutrición con tu cuenta de Google, de forma que cada consulta aparezca también como un evento en Google Calendar. La integración se activa mediante OAuth, autorizando a AppNutrición a leer y escribir en tu calendario. Una vez conectada, los cambios que hagas en la agenda de la aplicación (crear, cancelar, modificar citas) se reflejan automáticamente en Google. Además, si una cita es online, se genera una sala de Google Meet asociada. Es la forma recomendada de tener tu agenda profesional en todos tus dispositivos sin duplicar el trabajo.",
    related: ["ago-2", "ago-3", "ago-12"],
    keywords: ["google", "calendar", "integración", "sincronización"],
  },
  {
    id: "ago-2",
    section: "agenda-google",
    question: "¿Para qué sirve conectar Google Calendar con AppNutrición?",
    answer:
      "Sirve para centralizar toda tu agenda en un único lugar sin tener que copiar eventos manualmente. Puedes consultar tus consultas desde el teléfono, el reloj inteligente, el Mac o cualquier dispositivo que tenga tu cuenta de Google. También facilita compartir la disponibilidad con familiares o ayudantes sin darles acceso a AppNutrición. Y si trabajas con pacientes online, la creación automática de salas Meet ahorra mucho tiempo cada semana.",
    related: ["ago-1", "ago-10", "ago-11"],
    keywords: ["utilidad", "beneficios", "sincronizar", "agenda"],
  },
  {
    id: "ago-3",
    section: "agenda-google",
    question: "¿Cómo conecto mi cuenta de Google con AppNutrición?",
    answer:
      "Ve a `Ajustes` → `Integraciones` y pulsa el botón `Conectar con Google`. Se abrirá una ventana emergente de Google pidiéndote iniciar sesión con tu cuenta y aceptar los permisos solicitados (ver y gestionar eventos de tu calendario). Al confirmar, se te devuelve a AppNutrición con un mensaje de conexión exitosa y tu email aparece como cuenta vinculada. Todo el proceso usa el flujo estándar OAuth 2.0 de Google, así que nunca compartes tu contraseña con AppNutrición.",
    related: ["ago-1", "ago-4", "ago-24"],
    keywords: ["conectar", "oauth", "autorizar", "login"],
  },
  {
    id: "ago-4",
    section: "agenda-google",
    question: "¿Dónde encuentro la opción para conectar Google en la app?",
    answer:
      "En el menú lateral accede a `Ajustes` y dentro busca la pestaña `Integraciones`. Allí verás una tarjeta específica de Google Calendar con el estado actual (conectado o desconectado) y los botones correspondientes. Si nunca has vinculado la cuenta aparece un botón azul `Conectar con Google`; si ya está activa, aparece el email vinculado y las opciones avanzadas. No hay forma de conectar Google desde otra sección para evitar confusiones.",
    related: ["ago-3", "ago-17", "ago-21"],
    keywords: ["ubicación", "ajustes", "integraciones", "dónde"],
  },
  {
    id: "ago-5",
    section: "agenda-google",
    question: "¿Qué ocurre la primera vez que conecto mi cuenta de Google?",
    answer:
      "Justo después de autorizar, AppNutrición hace un `backfill` de tus citas existentes creando eventos en Google Calendar para las últimas 100 consultas (pasadas y futuras). Este proceso es automático, tarda unos segundos y se muestra una barra de progreso. A partir de ese momento, cada cita nueva o modificada se sincroniza en tiempo real. El backfill solo se hace una vez; si lo quieres repetir tienes que desconectar y volver a conectar la cuenta.",
    related: ["ago-3", "ago-6", "ago-7"],
    keywords: ["backfill", "primera vez", "sincronización inicial", "histórico"],
  },
  {
    id: "ago-6",
    section: "agenda-google",
    question: "¿Cuántas citas históricas se sincronizan al conectar por primera vez?",
    answer:
      "El backfill inicial incluye las últimas 100 citas, contando tanto las pasadas como las futuras. Este límite existe para no saturar tu calendario de Google con años de histórico y para que la sincronización inicial sea rápida. Si tienes un volumen mayor y necesitas que todo aparezca, contacta con soporte y podemos lanzar una importación completa manual. Las citas nuevas que crees a partir de la conexión siempre se sincronizan sin límite.",
    related: ["ago-5", "ago-8", "ago-38"],
    keywords: ["100", "histórico", "límite", "importar"],
  },
  {
    id: "ago-7",
    section: "agenda-google",
    question: "¿La sincronización es automática o tengo que forzarla?",
    answer:
      "Es totalmente automática mientras el toggle `Sincronizar citas automáticamente` esté activado en `Ajustes` → `Integraciones`. Cualquier cambio que realices en la agenda de AppNutrición (crear, actualizar, cancelar) se envía al instante a Google Calendar. No tienes que pulsar ningún botón `Sincronizar` ni esperar a horas concretas. En caso de fallos puntuales, el sistema reintenta en segundo plano y registra los errores en los logs.",
    related: ["ago-17", "ago-18", "ago-26"],
    keywords: ["automática", "sincronización", "toggle", "tiempo real"],
  },
  {
    id: "ago-8",
    section: "agenda-google",
    question: "¿Qué sucede en Google cuando creo una nueva cita en AppNutrición?",
    answer:
      "Al guardar una cita en la agenda, AppNutrición crea inmediatamente un evento equivalente en tu calendario primario de Google. El evento incluye el nombre del paciente, la fecha y hora, la duración, el motivo de la consulta y, si procede, el enlace a la sala Meet. También se añaden como invitados los correos de los participantes si la cita se marca como online. Verás el evento aparecer en Google Calendar en cuestión de segundos.",
    related: ["ago-1", "ago-9", "ago-11"],
    keywords: ["crear", "evento", "nueva cita", "google"],
  },
  {
    id: "ago-9",
    section: "agenda-google",
    question: "¿Qué ocurre en Google si cancelo una cita en AppNutrición?",
    answer:
      "Cuando cancelas o eliminas una cita, AppNutrición borra el evento correspondiente en Google Calendar para que no queden huecos fantasma en tu agenda. La eliminación es definitiva: no se envía a la papelera de Google. Si la cita tenía invitados añadidos (por ejemplo el paciente), Google les avisará automáticamente de la cancelación. Esto evita confusiones en ambas partes y mantiene coherencia entre los dos sistemas.",
    related: ["ago-8", "ago-10", "ago-17"],
    keywords: ["cancelar", "borrar", "evento", "eliminar"],
  },
  {
    id: "ago-10",
    section: "agenda-google",
    question: "¿Qué pasa si cambio la hora o la duración de una cita ya sincronizada?",
    answer:
      "Al modificar una cita (nueva hora, duración distinta, cambio de motivo, etc.) AppNutrición actualiza el mismo evento en Google Calendar conservando su identificador. No se crea un evento nuevo ni se duplica el antiguo, simplemente se sobreescriben los campos afectados. Los invitados ya existentes reciben una notificación de Google informándoles del cambio. El histórico de revisiones lo mantiene Google dentro del propio evento.",
    related: ["ago-8", "ago-9", "ago-17"],
    keywords: ["actualizar", "modificar", "evento", "cambio"],
  },
  {
    id: "ago-11",
    section: "agenda-google",
    question: "¿Cuándo se genera una sala de Google Meet para la cita?",
    answer:
      "La sala Meet se genera automáticamente cuando marcas la casilla `Cita online` (`isOnline: true`) al crear o editar una consulta. AppNutrición pide a Google Calendar que añada una `hangoutLink` al evento y copia ese enlace en la ficha de la cita dentro de la aplicación. Si desmarcas la casilla más tarde, el enlace Meet se elimina al actualizar el evento. Para citas presenciales no se crea ninguna sala, ya que no aportaría nada.",
    related: ["ago-12", "ago-13", "ago-34"],
    keywords: ["meet", "online", "videollamada", "sala"],
  },
  {
    id: "ago-12",
    section: "agenda-google",
    question: "¿Dónde veo el enlace de Google Meet de una cita online?",
    answer:
      "El enlace aparece en el detalle de la cita dentro de `Agenda`, en una sección destacada con el icono de Meet y un botón `Unirse a la reunión`. También lo recibe el paciente en su portal y, si tiene Google conectado, directamente en su evento de Google Calendar. Puedes copiarlo con un clic para enviarlo por mensaje o email. El enlace permanece válido hasta que la cita se cancela.",
    related: ["ago-11", "ago-35", "ago-36"],
    keywords: ["enlace", "meet", "detalle", "unirse"],
  },
  {
    id: "ago-13",
    section: "agenda-google",
    question: "¿Puedo usar Google Meet sin tener Google Calendar activado?",
    answer:
      "No. La sala Meet se crea como parte del evento de Google Calendar mediante la extensión `conferenceData`, así que necesitas tener la integración con Calendar conectada sí o sí. Si desactivas el calendar, dejas de tener Meet automático y las citas online quedan sin enlace de videollamada gestionado por AppNutrición. Tendrías que usar otra herramienta externa (Zoom, Jitsi, etc.) manualmente, lo cual no está soportado por la aplicación.",
    related: ["ago-11", "ago-37", "ago-38"],
    keywords: ["meet", "calendar", "requisito", "dependencia"],
  },
  {
    id: "ago-14",
    section: "agenda-google",
    question: "¿En qué calendario de Google se guardan los eventos?",
    answer:
      "Por defecto, AppNutrición usa tu calendario primario (`primary`), que es el que tiene el mismo nombre que tu email de Google. Es el calendario habitual donde guardas tu agenda personal y profesional, por eso resulta el más intuitivo para empezar. Puedes comprobarlo abriendo Google Calendar: los eventos aparecen con el color de tu calendario principal. Si quieres cambiar a otro calendario, consulta la pregunta correspondiente.",
    related: ["ago-15", "ago-16"],
    keywords: ["calendario", "primary", "principal", "calendar id"],
  },
  {
    id: "ago-15",
    section: "agenda-google",
    question: "¿Puedo elegir un calendario distinto al primario?",
    answer:
      "Sí. En `Ajustes` → `Integraciones`, dentro de la tarjeta de Google, hay un selector `Calendario de destino` donde aparecen todos los calendarios a los que tu cuenta tiene acceso de escritura. Puedes elegir, por ejemplo, un calendario dedicado a la consulta para separarlo de tu vida personal. Si cambias de calendario, los eventos futuros se crearán en el nuevo, pero los ya existentes permanecen donde se crearon inicialmente. Para moverlos, tienes que hacerlo manualmente desde Google.",
    related: ["ago-14", "ago-16", "ago-40"],
    keywords: ["cambiar calendario", "seleccionar", "calendar id", "separar"],
  },
  {
    id: "ago-16",
    section: "agenda-google",
    question: "¿Por qué es útil tener un calendario separado para AppNutrición?",
    answer:
      "Tener un calendario dedicado te permite distinguir de un vistazo qué eventos son consultas profesionales y cuáles son citas personales gracias a los colores diferenciados de Google. Además, puedes compartir solo ese calendario con un ayudante o con tu familia sin exponer el resto de tu agenda. También facilita exportar o archivar la actividad profesional de forma independiente. Es una buena práctica sobre todo si llevas muchas consultas a la semana.",
    related: ["ago-14", "ago-15", "ago-29"],
    keywords: ["buena práctica", "separar", "profesional", "calendario"],
  },
  {
    id: "ago-17",
    section: "agenda-google",
    question: "¿Para qué sirve el toggle \"Sincronizar citas automáticamente\"?",
    answer:
      "El toggle controla si AppNutrición debe enviar automáticamente los cambios de agenda a Google. Si lo desactivas, la conexión se mantiene (no hay que volver a hacer OAuth) pero los eventos nuevos dejan de replicarse en Google. Es útil cuando estás haciendo pruebas, migrando datos o simplemente no quieres ver cambios temporales en tu calendario. Al volver a activarlo, solo se sincronizan los nuevos cambios; los ocurridos mientras estaba apagado no se importan retroactivamente.",
    related: ["ago-7", "ago-18", "ago-19"],
    keywords: ["toggle", "automático", "pausar", "sincronización"],
  },
  {
    id: "ago-18",
    section: "agenda-google",
    question: "¿Cómo pauso la sincronización sin desconectar la cuenta?",
    answer:
      "Ve a `Ajustes` → `Integraciones` y desactiva el interruptor `Sincronizar citas automáticamente`. Con esto AppNutrición deja de enviar cambios a Google pero mantiene los tokens de acceso guardados, listos para retomar la actividad cuando vuelvas a activar el toggle. Es la opción recomendada si te vas de vacaciones, haces limpieza de calendarios o necesitas una pausa breve. Los eventos antiguos ya creados en Google siguen existiendo y no se ven afectados.",
    related: ["ago-17", "ago-19", "ago-21"],
    keywords: ["pausar", "desactivar", "temporal", "vacaciones"],
  },
  {
    id: "ago-19",
    section: "agenda-google",
    question: "¿Qué diferencia hay entre pausar y desconectar Google?",
    answer:
      "Pausar (toggle off) mantiene los tokens almacenados y solo detiene el envío de nuevos cambios; reanudar es instantáneo. Desconectar borra los tokens de AppNutrición, lo cual obliga a repetir el flujo OAuth y los 100 primeros eventos de backfill si quieres volver a conectar. Pausar es la opción rápida y reversible; desconectar es una acción más drástica pensada para cambiar de cuenta o dejar de usar la integración. Desconectar también te da la opción de limpiar los eventos antiguos.",
    related: ["ago-17", "ago-18", "ago-21"],
    keywords: ["pausar vs desconectar", "diferencia", "tokens", "comparación"],
  },
  {
    id: "ago-20",
    section: "agenda-google",
    question: "¿Cómo desconecto mi cuenta de Google de AppNutrición?",
    answer:
      "En `Ajustes` → `Integraciones` pulsa el botón rojo `Desconectar` que aparece en la tarjeta de Google. Se te mostrará un diálogo de confirmación con dos opciones importantes sobre los eventos ya creados (dejarlos o borrarlos) antes de finalizar. Una vez confirmado, AppNutrición elimina los tokens OAuth guardados y la cuenta deja de estar vinculada. Desde ese momento, ninguna acción en la agenda se propaga a Google.",
    related: ["ago-19", "ago-21", "ago-22"],
    keywords: ["desconectar", "revocar", "quitar", "eliminar conexión"],
  },
  {
    id: "ago-21",
    section: "agenda-google",
    question: "Al desconectar, ¿qué significan las opciones \"Dejar los eventos en Google\" y \"Borrar los eventos de Google\"?",
    answer:
      "`Dejar los eventos en Google` mantiene todos los eventos previamente sincronizados tal cual están en tu calendario: perderán la conexión con AppNutrición pero seguirán visibles. `Borrar los eventos de Google` lanza una limpieza que elimina todos los eventos creados por AppNutrición en tu calendar, útil si quieres dejar Google tal cual estaba antes de la integración. La segunda opción puede tardar un minuto si hay muchos eventos y es irreversible. Si tienes dudas, elige dejar los eventos y bórralos manualmente después si hace falta.",
    related: ["ago-20", "ago-22"],
    keywords: ["dejar", "borrar", "eventos", "opciones"],
  },
  {
    id: "ago-22",
    section: "agenda-google",
    question: "¿Puedo reconectar Google después de haber desconectado?",
    answer:
      "Sí, siempre. Basta con volver a `Ajustes` → `Integraciones` y pulsar `Conectar con Google` de nuevo; puedes usar la misma cuenta o una distinta. Al reconectar, AppNutrición vuelve a hacer un backfill inicial de las últimas 100 citas, por lo que verás eventos duplicados si no borraste los anteriores al desconectar. Los tokens se generan desde cero y cualquier ajuste previo (calendario elegido, toggle) se restablece a valores por defecto.",
    related: ["ago-5", "ago-20", "ago-21"],
    keywords: ["reconectar", "volver a conectar", "duplicados", "nueva conexión"],
  },
  {
    id: "ago-23",
    section: "agenda-google",
    question: "¿Qué zona horaria se usa para los eventos creados en Google?",
    answer:
      "Todos los eventos se crean con la zona horaria configurada en tu perfil de AppNutrición, que por defecto es `Europe/Madrid`. Google Calendar respeta esa zona y traduce automáticamente la hora al reloj local de quien consulte el evento, así que un paciente en Canarias ve la hora canaria correcta. Si viajas, tu calendar muestra la hora local pero AppNutrición sigue trabajando con la zona de origen. Asegúrate de que la zona en tu perfil coincide con tu consulta real.",
    related: ["ago-29", "ago-32"],
    keywords: ["zona horaria", "timezone", "madrid", "hora"],
  },
  {
    id: "ago-24",
    section: "agenda-google",
    question: "¿Cómo funcionan los tokens de acceso y refresh con Google?",
    answer:
      "Al conectar, Google envía un `access_token` de corta duración (una hora) y un `refresh_token` de larga duración que AppNutrición guarda cifrado en la base de datos. Cuando el access token caduca, el sistema usa automáticamente el refresh token para pedir uno nuevo sin molestarte. Este proceso es transparente y ocurre en segundo plano cada vez que hace falta. Tú solo te das cuenta si algo falla, porque entonces la integración muestra un aviso pidiendo reconectar.",
    related: ["ago-25", "ago-26", "ago-27"],
    keywords: ["tokens", "refresh", "access token", "oauth"],
  },
  {
    id: "ago-25",
    section: "agenda-google",
    question: "¿Qué pasa si el token caduca o se revoca desde Google?",
    answer:
      "Si por algún motivo el refresh token deja de ser válido (por ejemplo revocaste permisos desde `myaccount.google.com` o Google los invalidó por inactividad), AppNutrición detecta el fallo al intentar sincronizar y marca la integración como `Requiere reconexión`. Los intentos de crear eventos fallan silenciosamente (se registran en logs internos) hasta que reconectas desde `Ajustes` → `Integraciones`. La agenda de la aplicación sigue funcionando con normalidad, simplemente deja de propagarse a Google.",
    related: ["ago-24", "ago-26", "ago-27"],
    keywords: ["caducar", "revocar", "permisos", "fallo"],
  },
  {
    id: "ago-26",
    section: "agenda-google",
    question: "¿Qué errores comunes pueden ocurrir con la integración Google?",
    answer:
      "Los más habituales son: token revocado (requiere reconectar), calendario borrado o sin permisos de escritura (hay que elegir otro), cuota diaria de la API excedida (rara, afecta a usuarios muy intensivos) y problemas de red puntuales. Todos ellos se registran en los logs del servidor y, cuando es algo que te puede interesar, aparece un banner en `Ajustes` → `Integraciones`. En casi todos los casos, desconectar y volver a conectar resuelve el problema.",
    related: ["ago-25", "ago-27"],
    keywords: ["errores", "fallos", "problemas", "común"],
  },
  {
    id: "ago-27",
    section: "agenda-google",
    question: "Si Google falla silenciosamente, ¿cómo me entero del problema?",
    answer:
      "AppNutrición muestra un aviso visible en la tarjeta de `Integraciones` en cuanto detecta que varios intentos consecutivos han fallado. Además, en el detalle de la cita afectada aparece un icono gris con texto `No sincronizada con Google` y la razón resumida. También puedes revisar el log de sincronización si estás en un plan avanzado. Los fallos silenciosos no interrumpen tu trabajo en la agenda, solo la propagación a Google.",
    related: ["ago-25", "ago-26"],
    keywords: ["fallos silenciosos", "aviso", "log", "detección"],
  },
  {
    id: "ago-28",
    section: "agenda-google",
    question: "La primera vez aparece la pantalla \"App no verificada\", ¿qué hago?",
    answer:
      "Mientras AppNutrición no termine el proceso oficial de verificación de Google, el flujo OAuth muestra una pantalla intermedia avisando de que `Esta app no está verificada`. No es ningún virus: es el comportamiento estándar de Google con aplicaciones en `testing`. Pulsa `Configuración avanzada` (o `Advanced`) y luego `Ir a NutriApp (no seguro)` para continuar y aceptar los permisos. Una vez dentro, todo funciona con normalidad y Google recuerda tu aceptación en futuras conexiones.",
    related: ["ago-29", "ago-30"],
    keywords: ["app no verificada", "avanzado", "warning", "testing"],
  },
  {
    id: "ago-29",
    section: "agenda-google",
    question: "¿Qué son los \"test users\" de la pantalla de consentimiento OAuth?",
    answer:
      "Mientras la app esté en modo `testing`, solo los correos añadidos explícitamente como `test users` en la Google Cloud Console pueden conectar sus cuentas. Si tu email no está en esa lista, Google te bloqueará con un mensaje de `Access blocked`. Escríbenos a soporte con tu dirección para que la añadamos a la lista de testers. Cuando AppNutrición pase a `production` este requisito desaparece y cualquier cuenta Google puede conectarse.",
    related: ["ago-28", "ago-30"],
    keywords: ["test users", "testing", "consent screen", "access blocked"],
  },
  {
    id: "ago-30",
    section: "agenda-google",
    question: "¿Cuándo dejará de aparecer la pantalla de app no verificada?",
    answer:
      "En cuanto completemos el proceso oficial de verificación con Google, que incluye revisión de política de privacidad, términos de uso, homologación de `scopes` y vídeo demostrativo. Mientras tanto, solo los test users pueden conectarse aceptando la pantalla de aviso. Una vez verificada, la app pasa a estado `In production` y los nuevos usuarios ven el flujo OAuth limpio, sin advertencias. Te avisaremos por correo cuando ese paso esté hecho.",
    related: ["ago-28", "ago-29"],
    keywords: ["verificación", "producción", "google cloud", "publicar"],
  },
  {
    id: "ago-31",
    section: "agenda-google",
    question: "¿El paciente puede conectar su propia cuenta de Google?",
    answer:
      "Sí, de forma independiente al nutricionista. Desde el portal del paciente, en `Mi perfil` → `Integraciones`, cada paciente tiene su propio botón `Conectar con Google` que vincula SU calendario, no el tuyo. De esta manera, cuando creas una cita, puede aparecer tanto en tu Google Calendar como en el del paciente, cada uno viéndola en su cuenta. Ninguno de los dos ve el calendario del otro ni información adicional, solo los eventos de las citas compartidas.",
    related: ["ago-32", "ago-33"],
    keywords: ["paciente", "conectar", "portal", "independiente"],
  },
  {
    id: "ago-32",
    section: "agenda-google",
    question: "¿Cómo se sincroniza una cita entre el calendar del nutri y el del paciente?",
    answer:
      "Si ambos tienen Google conectado, AppNutrición crea un evento en el calendario del nutricionista e invita al email del paciente, de modo que Google lo duplica automáticamente en el calendar del paciente. Si el paciente acepta o rechaza desde Google, esa respuesta se refleja también en AppNutrición. Si solo uno de los dos tiene Google conectado, el evento solo aparece en esa cuenta. Cada parte ve la cita con sus propios colores y zona horaria.",
    related: ["ago-31", "ago-33", "ago-39"],
    keywords: ["sincronizar", "ambos", "invitado", "paciente"],
  },
  {
    id: "ago-33",
    section: "agenda-google",
    question: "¿Se notifica al paciente cuando se crea el evento en Google?",
    answer:
      "Sí. Al añadirlo como invitado al evento, Google envía automáticamente un email de invitación con los datos de la cita y el enlace Meet si procede, siempre que no hayan desactivado esas notificaciones en su cuenta. Además, el evento aparece directamente en su calendar con opciones de aceptar, rechazar o proponer otro horario. AppNutrición, de forma paralela, también envía su propia notificación interna en el portal del paciente. El paciente recibe, por tanto, un doble aviso.",
    related: ["ago-32", "ago-35"],
    keywords: ["notificar", "paciente", "email", "invitación"],
  },
  {
    id: "ago-34",
    section: "agenda-google",
    question: "Si cambio datos en Google Calendar, ¿se reflejan en AppNutrición?",
    answer:
      "No. La sincronización es unidireccional de AppNutrición hacia Google: los cambios que hagas directamente en el evento de Google (mover la hora, cambiar título, invitar a otras personas) no regresan a la aplicación. La fuente de verdad es siempre AppNutrición. Por eso, si necesitas mover una cita, hazlo desde la agenda de la app para mantener coherencia; si lo haces en Google, quedará desincronizado y la siguiente modificación desde AppNutrición podría sobreescribir tus cambios.",
    related: ["ago-10", "ago-32"],
    keywords: ["unidireccional", "reflejar", "modificar", "fuente"],
  },
  {
    id: "ago-35",
    section: "agenda-google",
    question: "¿Qué datos comparte AppNutrición con Google al crear el evento?",
    answer:
      "Los estrictamente necesarios para que el evento sea útil: título (normalmente `Consulta nutricional - [nombre del paciente]`), fecha y hora, duración, motivo corto, email del paciente como invitado y, si la cita es online, el enlace Meet generado. No se envían mediciones, datos de salud, planes de alimentación ni información sensible. Google nunca ve el contenido clínico del paciente, solo la logística de la cita para representarla como evento. Todo queda sujeto a la política de privacidad de AppNutrición y a la de Google.",
    related: ["ago-1", "ago-8", "ago-36"],
    keywords: ["privacidad", "datos", "compartir", "información"],
  },
  {
    id: "ago-36",
    section: "agenda-google",
    question: "Si elimino mi cuenta de AppNutrición, ¿se borran los eventos en Google?",
    answer:
      "No automáticamente. Al eliminar tu cuenta AppNutrición, los eventos que ya se habían creado en tu Google Calendar se quedan ahí tal cual, bajo tu control. Si quieres borrarlos, antes de eliminar la cuenta entra en `Ajustes` → `Integraciones` y usa la opción `Desconectar` → `Borrar los eventos de Google`. Una vez borrada la cuenta, AppNutrición ya no puede escribir ni eliminar nada en tu calendar; la relación queda cortada de raíz.",
    related: ["ago-20", "ago-21"],
    keywords: ["eliminar cuenta", "borrar", "google", "eventos"],
  },
  {
    id: "ago-37",
    section: "agenda-google",
    question: "¿AppNutrición se integra con Zoom, Apple Calendar u Outlook?",
    answer:
      "No directamente. La única integración nativa es con Google Calendar / Google Meet. No existe soporte oficial para Zoom, Microsoft Teams, Apple Calendar o Outlook. Si tu flujo depende de esas herramientas, la vía habitual es conectar Google Calendar con AppNutrición y luego sincronizar Google con tu sistema externo mediante las opciones que ofrece cada proveedor (iCloud suele poder leer calendarios Google, por ejemplo). Estamos evaluando integraciones adicionales en la hoja de ruta.",
    related: ["ago-38"],
    keywords: ["zoom", "outlook", "apple", "otros calendarios"],
  },
  {
    id: "ago-38",
    section: "agenda-google",
    question: "¿Puedo exportar mi agenda a un archivo iCal o similar?",
    answer:
      "Actualmente no existe una exportación directa a `.ics` (iCal) dentro de AppNutrición. Si necesitas ese formato, la recomendación es conectar Google Calendar y después usar la función `Exportar` que Google ofrece, que genera un archivo iCal válido para Apple, Outlook u otros clientes. De esta forma aprovechas la integración ya existente como puente. Estamos valorando añadir una descarga iCal nativa en futuras versiones si hay demanda suficiente.",
    related: ["ago-37"],
    keywords: ["ical", "exportar", "ics", "archivo"],
  },
  {
    id: "ago-39",
    section: "agenda-google",
    question: "¿Qué pasa si el paciente tiene varios dispositivos sincronizados con Google?",
    answer:
      "Al crearse el evento en su Google Calendar, Google lo replica automáticamente en todos los dispositivos donde tenga activa esa cuenta (móvil Android, iPhone con calendar de iOS, reloj, navegador, etc.). AppNutrición no hace nada especial, simplemente se apoya en la infraestructura de Google. El paciente recibe notificaciones nativas de Google en cada dispositivo según sus propios ajustes. Esta es una de las ventajas claras de la integración frente a sistemas cerrados.",
    related: ["ago-32", "ago-33"],
    keywords: ["dispositivos", "móvil", "sincronización", "paciente"],
  },
  {
    id: "ago-40",
    section: "agenda-google",
    question: "¿Puedo cambiar la cuenta de Google vinculada sin perder datos?",
    answer:
      "Sí. Para cambiar de email Google, primero desconecta la cuenta actual desde `Ajustes` → `Integraciones` eligiendo `Dejar los eventos en Google` si quieres conservar el histórico en el calendar antiguo. Luego pulsa `Conectar con Google` e inicia sesión con la nueva cuenta; se hará un nuevo backfill de las últimas 100 citas en ese calendar. Los datos clínicos y las citas dentro de AppNutrición no se ven afectados en ningún momento. Recuerda actualizar también el calendario de destino si eliges uno distinto al primario.",
    related: ["ago-15", "ago-20", "ago-22"],
    keywords: ["cambiar cuenta", "email", "vincular", "migrar"],
  },
];
