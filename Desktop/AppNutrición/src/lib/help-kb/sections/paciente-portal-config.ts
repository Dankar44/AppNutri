import type { HelpEntry } from "../types";

export const PACIENTE_PORTAL_CONFIG_ENTRIES: HelpEntry[] = [
  {
    id: "ppc-1",
    section: "paciente-portal-config",
    question: "¿Qué es la pestaña Portal del paciente dentro de la ficha?",
    answer:
      "Es la pestaña de la ficha desde la que gestionas el acceso del paciente a su propio portal web. Ahí configuras las credenciales (email y contraseña), activas o desactivas la entrada, regeneras la clave, envías las credenciales por email y eliges qué tags comparten con él. Es el único sitio desde donde administras la presencia digital del paciente en la aplicación.",
    related: ["ppc-2", "ppc-3", "ppc-7"],
    keywords: ["portal", "paciente", "configuración", "ficha", "pestaña"],
  },
  {
    id: "ppc-2",
    section: "paciente-portal-config",
    question: "¿Qué es el portal del paciente?",
    answer:
      "Es el espacio web privado del paciente, al que entra desde /paciente/login con su email y contraseña. Dentro ve un dashboard con su dieta actual y próximas citas, sus citas completas, su horario semanal, su seguimiento diario, su perfil y la opción de exportar su dieta en PDF. Está pensado para que tenga la información siempre a mano sin depender de mensajes puntuales contigo.",
    related: ["ppc-1", "ppc-7", "ppc-13"],
    keywords: ["portal", "paciente", "qué es", "web", "espacio"],
  },
  {
    id: "ppc-3",
    section: "paciente-portal-config",
    question: "¿Cómo configuro el acceso al portal para un paciente?",
    answer:
      "Abre la ficha del paciente, entra en la pestaña Portal del paciente, rellena el email de acceso y define una contraseña (puedes escribirla tú o usar Regenerar). Activa el interruptor de acceso y guarda. A partir de ahí, el paciente puede entrar en /paciente/login con esas credenciales. Si quieres, pulsa Enviar credenciales por email para que las reciba al momento.",
    related: ["ppc-4", "ppc-5", "ppc-6"],
    keywords: ["configurar", "acceso", "email", "contraseña", "alta"],
  },
  {
    id: "ppc-4",
    section: "paciente-portal-config",
    question: "¿Qué email tengo que poner en el campo Email de acceso?",
    answer:
      "El correo con el que el paciente quiere iniciar sesión en el portal. No tiene por qué coincidir con el email de la ficha general, aunque a menudo coinciden. Lo importante es que sea un correo que el paciente recuerde y al que tenga acceso, porque ahí recibirá las credenciales y cualquier aviso. Escríbelo con cuidado: un error aquí le impedirá entrar.",
    related: ["ppc-3", "ppc-11", "ppc-17"],
    keywords: ["email", "acceso", "login", "correo", "identificador"],
  },
  {
    id: "ppc-5",
    section: "paciente-portal-config",
    question: "¿Qué es el PIN o contraseña del portal?",
    answer:
      "Es la clave que el paciente escribe junto al email para entrar en su portal. Puedes definirla tú mismo o generarla automáticamente con el botón Regenerar. Al guardar queda cifrada en el servidor y el paciente podrá cambiarla más adelante desde su perfil. Sin esta contraseña nadie puede ver sus datos, por lo que es la pieza clave de su seguridad.",
    related: ["ppc-3", "ppc-14", "ppc-21"],
    keywords: ["pin", "contraseña", "password", "clave", "seguridad"],
  },
  {
    id: "ppc-6",
    section: "paciente-portal-config",
    question: "¿Cómo envío las credenciales al paciente por email?",
    answer:
      "En la pestaña Portal del paciente tienes un botón Enviar credenciales por email. Al pulsarlo se le manda un correo con la URL de /paciente/login, su email de acceso y la contraseña actual. Es la forma más cómoda de darle el alta sin tener que copiar y pegar nada en WhatsApp. Puedes enviarlo las veces que necesites, por ejemplo cada vez que regeneres la contraseña.",
    related: ["ppc-3", "ppc-8", "ppc-22"],
    keywords: ["enviar", "credenciales", "email", "correo", "botón"],
  },
  {
    id: "ppc-7",
    section: "paciente-portal-config",
    question: "¿Cuál es la URL del portal del paciente?",
    answer:
      "El paciente accede siempre desde /paciente/login, la ruta pública del portal. Cuando le envías las credenciales por email se incluye el enlace directo. Recomiéndale que la guarde como marcador del navegador para entrar rápido en futuras visitas. El paciente no debe entrar por la URL del dashboard del nutricionista: su puerta es exclusivamente /paciente/login.",
    related: ["ppc-2", "ppc-6", "ppc-22"],
    keywords: ["url", "dirección", "login", "paciente", "ruta"],
  },
  {
    id: "ppc-8",
    section: "paciente-portal-config",
    question: "¿Cómo regenero la contraseña del paciente?",
    answer:
      "En la pestaña Portal del paciente pulsa Regenerar credenciales: se crea una contraseña nueva aleatoria y la anterior deja de servir. Después usa Enviar credenciales por email para que el paciente reciba la nueva clave. Es el flujo habitual cuando olvida su contraseña, cuando sospechas que alguien más la conoce o cuando quieres forzar un cambio periódico.",
    related: ["ppc-5", "ppc-15", "ppc-21"],
    keywords: ["regenerar", "resetear", "contraseña", "nueva", "cambiar"],
  },
  {
    id: "ppc-9",
    section: "paciente-portal-config",
    question: "¿Puedo desactivar el acceso del paciente al portal?",
    answer:
      "Sí. En la misma pestaña hay un interruptor que activa o desactiva el acceso. Si lo desactivas, el paciente verá un mensaje de acceso denegado al intentar iniciar sesión, aunque el email y la contraseña sean correctos. Es útil cuando un paciente ya no está activo, cuando se da de baja o cuando quieres restringir temporalmente la entrada sin borrar nada.",
    related: ["ppc-8", "ppc-10", "ppc-29"],
    keywords: ["desactivar", "bloquear", "deshabilitar", "acceso", "interruptor"],
  },
  {
    id: "ppc-10",
    section: "paciente-portal-config",
    question: "¿Qué pasa si desactivo el portal de un paciente que ya entraba?",
    answer:
      "Desde ese momento no podrá iniciar nuevas sesiones. Si tenía una sesión abierta, en su próximo refresco o petición al servidor se cerrará automáticamente. Sus datos siguen intactos en tu sistema: solo se bloquea su entrada. Puedes reactivarlo cuando quieras con el mismo interruptor, sin necesidad de volver a configurar email ni contraseña.",
    related: ["ppc-9", "ppc-19", "ppc-20"],
    keywords: ["desactivar", "sesión", "cerrar", "bloqueo", "reactivar"],
  },
  {
    id: "ppc-11",
    section: "paciente-portal-config",
    question: "¿El email del portal es el mismo que el email general del paciente?",
    answer:
      "No necesariamente. Son campos independientes. El email general es el que usas tú para contactar o enviar entregables, mientras que el email de acceso al portal es el que el paciente usará para iniciar sesión. Pueden coincidir (y es lo más habitual) o ser distintos si el paciente prefiere otro correo personal. Cambiar uno no cambia el otro automáticamente.",
    related: ["ppc-4", "ppc-12", "ppc-26"],
    keywords: ["email", "independiente", "ficha", "general", "diferencia"],
  },
  {
    id: "ppc-12",
    section: "paciente-portal-config",
    question: "¿Puedo cambiar el email del portal una vez configurado?",
    answer:
      "Sí. Edita el campo Email de acceso, guarda los cambios y avisa al paciente del nuevo correo que debe usar al entrar. Si le habías enviado credenciales con el email anterior, vuelve a pulsar Enviar credenciales para que tenga los datos actualizados. El cambio no afecta a sus datos internos: solo cambia el identificador con el que inicia sesión.",
    related: ["ppc-11", "ppc-6", "ppc-26"],
    keywords: ["cambiar", "email", "modificar", "actualizar", "portal"],
  },
  {
    id: "ppc-13",
    section: "paciente-portal-config",
    question: "¿Qué ve el paciente cuando entra en su portal?",
    answer:
      "Al iniciar sesión encuentra un menú con varias secciones: Dashboard con su dieta actual y próximas citas, Mis citas con el historial completo, Mi horario con el plan semanal, Mi seguimiento para registrar peso, agua, estado y notas, Mi perfil con sus datos y la opción de Exportar PDF con su dieta. Todo está filtrado a su persona, solo ve su propia información.",
    related: ["ppc-2", "ppc-24", "ppc-25"],
    keywords: ["ver", "paciente", "portal", "secciones", "menú"],
  },
  {
    id: "ppc-14",
    section: "paciente-portal-config",
    question: "¿Qué requisitos tiene la contraseña del portal?",
    answer:
      "Pedimos una longitud mínima razonable (normalmente 6 u 8 caracteres), evitar claves obvias como 123456 o el propio nombre del paciente, y combinar letras y números si es posible. Cuanto más larga y variada, mejor. Si usas el botón Regenerar, la contraseña creada automáticamente cumple los requisitos de seguridad sin que tengas que pensarlo.",
    related: ["ppc-5", "ppc-8", "ppc-23"],
    keywords: ["requisitos", "contraseña", "longitud", "seguridad", "fortaleza"],
  },
  {
    id: "ppc-15",
    section: "paciente-portal-config",
    question: "¿Qué hago si el paciente olvida su contraseña?",
    answer:
      "Abre su ficha, ve a la pestaña Portal del paciente y pulsa Regenerar credenciales para crear una contraseña nueva. A continuación usa Enviar credenciales por email para que le lleguen el email de acceso y la nueva clave. En unos segundos puede entrar con los datos actualizados. El paciente no tiene un autoservicio de recuperación: siempre pasa por ti, y eso es intencionado.",
    related: ["ppc-8", "ppc-6", "ppc-30"],
    keywords: ["olvidó", "contraseña", "recuperar", "reset", "perdida"],
  },
  {
    id: "ppc-16",
    section: "paciente-portal-config",
    question: "¿Se registran los últimos accesos del paciente al portal?",
    answer:
      "Sí. En la pestaña Portal del paciente hay un apartado de Últimos accesos donde ves las entradas recientes con fecha y hora. Te sirve para saber si el paciente está usando el portal, detectar periodos de desconexión y localizar actividad inusual. Si el apartado está vacío es porque el paciente todavía no ha iniciado sesión por primera vez.",
    related: ["ppc-27", "ppc-28", "ppc-29"],
    keywords: ["últimos", "accesos", "historial", "entradas", "registro"],
  },
  {
    id: "ppc-17",
    section: "paciente-portal-config",
    question: "¿Cómo notifico al paciente que ya tiene acceso al portal?",
    answer:
      "La forma más directa es pulsar Enviar credenciales por email: el paciente recibe un correo con el enlace, su email de acceso y la contraseña, y puede entrar en cuanto lo lea. También puedes avisarle desde Mensajes, por WhatsApp o en la propia consulta, y aprovechar para explicarle qué va a encontrar dentro. Un aviso claro reduce dudas y hace que el paciente entre antes.",
    related: ["ppc-6", "ppc-22", "ppc-35"],
    keywords: ["notificar", "avisar", "paciente", "alta", "comunicar"],
  },
  {
    id: "ppc-18",
    section: "paciente-portal-config",
    question: "¿El paciente puede editar sus datos clínicos desde el portal?",
    answer:
      "No. Desde su perfil solo puede actualizar su foto, su teléfono y su contraseña. Los datos clínicos (nombre, fecha de nacimiento, alergias, patologías, objetivos, mediciones, dieta) son responsabilidad del nutricionista y se editan desde las pestañas Información y General de la ficha. Lo hemos diseñado así para mantener la historia clínica bajo tu control y evitar ediciones accidentales.",
    related: ["ppc-13", "ppc-24", "ppc-33"],
    keywords: ["editar", "datos", "clínicos", "perfil", "restricción"],
  },
  {
    id: "ppc-19",
    section: "paciente-portal-config",
    question: "¿Un paciente puede tener varias sesiones abiertas a la vez?",
    answer:
      "No. Solo permitimos una sesión activa por paciente. Si inicia sesión en un segundo dispositivo, la sesión anterior queda invalidada y tendrá que volver a entrar en el primero si quiere usarlo. Así evitamos confusiones de datos y reducimos el riesgo de que se quede una sesión abierta en un móvil prestado. Si ve que le echan del portal constantemente, suele ser porque está iniciando sesión en otro dispositivo a la vez.",
    related: ["ppc-20", "ppc-29", "ppc-32"],
    keywords: ["sesiones", "múltiples", "dispositivos", "una", "activa"],
  },
  {
    id: "ppc-20",
    section: "paciente-portal-config",
    question: "¿La sesión del paciente se cierra sola por inactividad?",
    answer:
      "Sí. Por seguridad, la sesión del paciente caduca tras un periodo de inactividad. Si pasa ese tiempo sin interactuar, al volver a cargar cualquier página se le pedirá iniciar sesión de nuevo con su email y contraseña. Es una protección extra si deja el portal abierto en un dispositivo compartido. El tiempo exacto de expiración lo define la configuración del servidor de sesiones.",
    related: ["ppc-19", "ppc-32", "ppc-29"],
    keywords: ["sesión", "inactividad", "caducidad", "cierre", "automático"],
  },
  {
    id: "ppc-21",
    section: "paciente-portal-config",
    question: "¿Puedo escribir una contraseña concreta en lugar de regenerarla?",
    answer:
      "Sí. En el campo de contraseña puedes teclear la clave que prefieras, siempre que cumpla los requisitos mínimos de longitud y seguridad. Es útil si el paciente te ha pedido algo sencillo de recordar o si quieres seguir un formato estándar en tu consulta. Cuando quieras cambiarla, basta con escribir un nuevo valor y guardar, o pulsar Regenerar para obtener una aleatoria.",
    related: ["ppc-5", "ppc-14", "ppc-8"],
    keywords: ["escribir", "contraseña", "manual", "personalizar", "definir"],
  },
  {
    id: "ppc-22",
    section: "paciente-portal-config",
    question: "¿Qué contiene el email de credenciales que recibe el paciente?",
    answer:
      "Un mensaje claro con tres piezas clave: la URL del portal (/paciente/login), el email con el que debe iniciar sesión y la contraseña actual. Incluye también una breve presentación del portal y la recomendación de cambiar la contraseña tras el primer acceso. Está pensado para que el paciente pueda entrar sin llamarte y sin necesidad de más ayuda.",
    related: ["ppc-6", "ppc-17", "ppc-7"],
    keywords: ["email", "contenido", "credenciales", "mensaje", "correo"],
  },
  {
    id: "ppc-23",
    section: "paciente-portal-config",
    question: "¿Qué validaciones se aplican al configurar el acceso?",
    answer:
      "Comprobamos que el email tenga un formato válido, que no esté vacío y que la contraseña cumpla la longitud mínima. Si intentas guardar con errores, te mostramos un aviso en rojo junto al campo afectado. También te avisamos si activas el acceso sin haber rellenado email o contraseña: sin esos dos datos el paciente no podría iniciar sesión.",
    related: ["ppc-14", "ppc-4", "ppc-26"],
    keywords: ["validaciones", "errores", "formato", "requisitos", "guardar"],
  },
  {
    id: "ppc-24",
    section: "paciente-portal-config",
    question: "¿Cómo se relaciona el portal con la dieta actual del paciente?",
    answer:
      "La dieta marcada como actual en la ficha es la que ve el paciente dentro del portal, tanto en el dashboard como en Mi horario y en Exportar PDF. Si cambias la dieta activa desde tu lado, al refrescar el portal el paciente verá ya la nueva. Las dietas antiguas, borradores o versiones internas no aparecen para él: solo la que esté publicada como actual.",
    related: ["ppc-13", "ppc-25", "ppc-33"],
    keywords: ["dieta", "actual", "activa", "portal", "relación"],
  },
  {
    id: "ppc-25",
    section: "paciente-portal-config",
    question: "¿Puede el paciente exportar su dieta en PDF desde el portal?",
    answer:
      "Sí. Dentro del portal hay una opción Exportar PDF que genera un documento con su dieta actual en el mismo formato que usas tú para imprimir. El paciente puede descargarlo en el móvil u ordenador y compartirlo con quien quiera. Es el mismo PDF que tú generas desde la pestaña Entregables de su ficha, para que siempre veáis exactamente lo mismo.",
    related: ["ppc-13", "ppc-24", "ppc-33"],
    keywords: ["pdf", "exportar", "descargar", "dieta", "portal"],
  },
  {
    id: "ppc-26",
    section: "paciente-portal-config",
    question: "¿Pueden dos pacientes tener el mismo email de acceso al portal?",
    answer:
      "No. El email de acceso identifica de forma única a un paciente. Si intentas guardar un email que ya está asignado a otro, te mostramos un error y te pedimos elegir otro. Si dos familiares comparten correo, lo más sencillo es usar alias de tipo nombre+1@dominio.com o indicar al paciente que cree un correo alternativo gratuito para el portal.",
    related: ["ppc-4", "ppc-11", "ppc-23"],
    keywords: ["email", "duplicado", "único", "dos", "pacientes"],
  },
  {
    id: "ppc-27",
    section: "paciente-portal-config",
    question: "¿Para qué me sirve saber cuándo fue el último acceso del paciente?",
    answer:
      "Te ayuda a medir el compromiso y detectar señales de desvinculación. Si un paciente lleva semanas sin entrar pese a tener dieta activa, quizá convenga escribirle o programar una cita de seguimiento. Si entra mucho y registra su seguimiento diario, sabes que está implicado y puedes reforzar esa conducta en la consulta. En ambos casos es información clínica útil.",
    related: ["ppc-16", "ppc-28", "ppc-29"],
    keywords: ["último", "acceso", "compromiso", "seguimiento", "uso"],
  },
  {
    id: "ppc-28",
    section: "paciente-portal-config",
    question: "¿Qué información concreta veo sobre los accesos del paciente?",
    answer:
      "Según la configuración de la consulta, podemos mostrar la fecha y hora del último acceso, una lista con las últimas entradas y, en algunos casos, el dispositivo o navegador utilizado. No guardamos contraseñas ni datos sensibles, solo lo imprescindible para auditar la entrada. Si no ves registros, suele ser porque el paciente todavía no ha iniciado sesión por primera vez.",
    related: ["ppc-16", "ppc-27", "ppc-29"],
    keywords: ["información", "accesos", "dispositivo", "registro", "datos"],
  },
  {
    id: "ppc-29",
    section: "paciente-portal-config",
    question: "¿Qué hago si detecto un acceso sospechoso?",
    answer:
      "Lo más rápido es regenerar la contraseña del paciente para invalidar cualquier sesión abierta con la clave anterior y, si hace falta, desactivar temporalmente el acceso con el interruptor. Después avisa al paciente por email o teléfono, envíale la nueva contraseña y explícale lo que ha pasado. Si el problema persiste o ves accesos claramente fraudulentos, contacta con soporte para revisar los registros del servidor.",
    related: ["ppc-8", "ppc-9", "ppc-32"],
    keywords: ["sospechoso", "seguridad", "intruso", "fraude", "acción"],
  },
  {
    id: "ppc-30",
    section: "paciente-portal-config",
    question: "¿Existe un enlace de olvidé mi contraseña para el paciente?",
    answer:
      "No. Hemos decidido que la recuperación pase siempre por el nutricionista: el paciente te avisa y tú regeneras la clave. Así evitamos que alguien con acceso a su correo pueda tomar el control sin que tú te enteres, y mantenemos el canal de autenticación bajo tu supervisión. Si el paciente insiste en gestionarlo solo, guardar la contraseña en un gestor de su navegador suele resolverlo.",
    related: ["ppc-15", "ppc-8", "ppc-35"],
    keywords: ["olvidé", "recuperar", "contraseña", "autoservicio", "reset"],
  },
  {
    id: "ppc-31",
    section: "paciente-portal-config",
    question: "¿El paciente puede entrar al portal con login de Google?",
    answer:
      "Hoy el portal del paciente se autentica con email y contraseña definidos desde esta pestaña, no con Google OAuth. Si configuras una cuenta con el mismo correo que el paciente usa en Google, reconocerá visualmente su email, pero tendrá que introducir la contraseña que le envíes. El login con Google está previsto para futuras versiones del portal cuando tengamos dominio y HTTPS definitivos.",
    related: ["ppc-3", "ppc-7", "ppc-22"],
    keywords: ["google", "oauth", "login", "social", "autenticación"],
  },
  {
    id: "ppc-32",
    section: "paciente-portal-config",
    question: "¿Cómo protegemos la privacidad y los datos del paciente dentro del portal?",
    answer:
      "Cada paciente solo ve sus propios datos: dieta, citas, seguimiento y perfil filtrados por su identidad. El tráfico viaja cifrado por HTTPS, la contraseña se guarda protegida en base de datos y las sesiones expiran por inactividad. Además solo tú, como nutricionista de ese paciente, puedes ver sus datos desde tu dashboard. Es un entorno diseñado para tratar información de salud con responsabilidad.",
    related: ["ppc-19", "ppc-20", "ppc-29"],
    keywords: ["privacidad", "seguridad", "datos", "cifrado", "protección"],
  },
  {
    id: "ppc-33",
    section: "paciente-portal-config",
    question: "¿Puedo escribir al paciente o recibir sus mensajes desde el portal?",
    answer:
      "Sí. Si tienes la mensajería interna activada, el paciente puede escribirte desde su portal y tú ves los mensajes en la pestaña Mensajes de tu dashboard. Las conversaciones quedan ligadas a cada paciente, con historial y notificaciones de no leídos. Si no utilizas mensajería interna, el portal sigue siendo plenamente funcional para dieta, seguimiento y citas, solo que sin canal de chat.",
    related: ["ppc-13", "ppc-17", "ppc-2"],
    keywords: ["mensajes", "chat", "comunicación", "mensajería", "portal"],
  },
  {
    id: "ppc-34",
    section: "paciente-portal-config",
    question: "¿Cómo pruebo lo que ve el paciente en el portal desde mi cuenta?",
    answer:
      "Tienes dos caminos habituales. El primero es abrir el portal demo desde Ajustes > Paciente demo: se te crea un paciente ficticio con acceso a un portal de ejemplo para que puedas navegar todas sus secciones. El segundo es tu propio paciente real: configura sus credenciales, inicia sesión desde una ventana privada del navegador con su email y contraseña, y así ves exactamente lo mismo que él.",
    related: ["ppc-13", "ppc-18", "ppc-25"],
    keywords: ["probar", "ver", "demo", "portal", "ojos"],
  },
  {
    id: "ppc-35",
    section: "paciente-portal-config",
    question: "¿Qué hago si el paciente no quiere tener portal o no puede entrar?",
    answer:
      "Si el paciente prefiere no usar portal, basta con dejar el interruptor de acceso desactivado: no recibirá credenciales y seguirás gestionándolo por los canales tradicionales. Si quiere tenerlo pero no puede entrar, repasa en este orden que el acceso esté activo, que el email coincida con el que escribe, que la contraseña esté vigente y que use /paciente/login. Si todo cuadra, regenera la clave, reenvía credenciales y pídele que pruebe en otro navegador; si sigue fallando, contacta con soporte con su email y la hora del intento fallido.",
    related: ["ppc-9", "ppc-15", "ppc-29"],
    keywords: ["no puede", "entrar", "rechaza", "soporte", "problema"],
  },
];
