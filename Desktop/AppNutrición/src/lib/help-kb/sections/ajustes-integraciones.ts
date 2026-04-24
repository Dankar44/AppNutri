import type { HelpEntry } from "../types";

export const AJUSTES_INTEGRACIONES_ENTRIES: HelpEntry[] = [
  {
    id: "aji-1",
    section: "ajustes-integraciones",
    question: "¿Qué es la sección Integraciones dentro de Ajustes?",
    answer:
      "Es la pestaña de `Ajustes` donde gestionas las conexiones entre Annonia y servicios externos que amplían sus funciones. Hoy por hoy la única integración nativa disponible es con Google Calendar, que arrastra también Google Meet para las citas online. Desde aquí puedes conectarte, desconectarte, ajustar preferencias de sincronización y revisar el estado de la conexión. Es un área pensada para que el profesional controle qué datos salen de la aplicación hacia terceros y en qué condiciones. Si no tienes ninguna integración activa, verás tarjetas informativas con botones de conexión.",
    related: ["aji-2", "aji-3", "aji-20"],
    keywords: ["integraciones", "ajustes", "sección", "qué es"],
  },
  {
    id: "aji-2",
    section: "ajustes-integraciones",
    question: "¿Qué integraciones están disponibles actualmente en Annonia?",
    answer:
      "Por ahora la única integración dentro de la pestaña `Integraciones` es Google Calendar, que de forma implícita habilita también Google Meet para las consultas online. Otras conexiones importantes del producto, como Stripe para cobrar consultas o suscripciones, viven en su propia pestaña (`Ajustes` → `Cobros`) porque tienen flujos y condiciones distintas. En el futuro podrían sumarse integraciones con Outlook, Apple Calendar u otros servicios, pero hoy no están disponibles. Si echas en falta una conexión concreta, puedes escribir a soporte y lo valoramos en la hoja de ruta.",
    related: ["aji-1", "aji-20", "aji-21"],
    keywords: ["disponibles", "google", "stripe", "outlook"],
  },
  {
    id: "aji-3",
    section: "ajustes-integraciones",
    question: "¿Cómo conecto mi cuenta de Google con Annonia?",
    answer:
      "En la tarjeta `Google Calendar` pulsa el botón azul `Conectar con Google`. Se te redirige al flujo estándar OAuth 2.0 de Google, donde inicias sesión con la cuenta que quieras vincular y aceptas los permisos que te pide la app (ver y gestionar tus eventos de calendario). Al terminar, Google te devuelve a `Ajustes` → `Integraciones` con un mensaje flash verde de éxito y el email conectado aparece en la tarjeta. Nunca compartes tu contraseña con Annonia: solo autorizas un token de acceso revocable desde tu cuenta de Google.",
    related: ["aji-4", "aji-5", "aji-7"],
    keywords: ["conectar", "google", "oauth", "vincular"],
  },
  {
    id: "aji-4",
    section: "ajustes-integraciones",
    question: "¿Qué pasa al volver del flujo OAuth si la conexión ha ido bien?",
    answer:
      "Al regresar de Google, Annonia muestra un mensaje flash verde tipo `Conexión con Google establecida correctamente` en la parte superior de la pantalla. Ese aviso desaparece a los pocos segundos o cuando recargas, y la tarjeta `Google Calendar` pasa a mostrar el email conectado, los toggles de configuración y el botón `Desconectar`. Es la señal de que los tokens se han guardado bien y la sincronización ya está operativa. Si no ves el mensaje pero la tarjeta refleja el email, la conexión también es válida: simplemente el flash se ha cerrado antes.",
    related: ["aji-3", "aji-5", "aji-6"],
    keywords: ["flash", "éxito", "mensaje", "vuelta"],
  },
  {
    id: "aji-5",
    section: "ajustes-integraciones",
    question: "¿Qué significa el error \"no_configurado\" al intentar conectar Google?",
    answer:
      "El error `no_configurado` aparece cuando el servidor de Annonia no tiene definidas las variables `GOOGLE_CLIENT_ID` o `GOOGLE_CLIENT_SECRET` en su archivo `.env`. Sin esas credenciales, la aplicación no puede iniciar el flujo OAuth con Google y la pantalla muestra un mensaje explicando que la integración no está disponible. Suele ocurrir en instancias autoalojadas recién desplegadas o si alguien ha borrado las variables. La solución es añadir las credenciales correctas desde la Google Cloud Console y reiniciar el servidor; si es la instancia oficial, contacta con soporte.",
    related: ["aji-6", "aji-17", "aji-23"],
    keywords: ["no_configurado", "error", "env", "variables"],
  },
  {
    id: "aji-6",
    section: "ajustes-integraciones",
    question: "¿Qué otros errores de OAuth puedo ver al conectar Google?",
    answer:
      "Además de `no_configurado`, pueden aparecer mensajes como `error_oauth` (fallo genérico durante el intercambio de tokens), `access_denied` (cerraste la ventana o denegaste los permisos), `invalid_grant` (el código ha caducado antes de procesarse) o errores de red si Google no responde. Todos ellos se muestran como un flash rojo al volver a `Ajustes` → `Integraciones` con una descripción breve. En la mayoría de casos, basta con volver a pulsar `Conectar con Google` y completar el flujo con más calma. Si se repite, anota el mensaje exacto y escribe a soporte.",
    related: ["aji-5", "aji-17", "aji-18"],
    keywords: ["errores", "oauth", "access_denied", "invalid_grant"],
  },
  {
    id: "aji-7",
    section: "ajustes-integraciones",
    question: "¿Dónde veo el email de Google que está conectado?",
    answer:
      "Una vez conectada, la tarjeta `Google Calendar` muestra una línea tipo `Conectado como tucorreo@gmail.com` justo debajo del título. Ese email es el que Google devolvió durante el OAuth y es útil para verificar que has enlazado la cuenta correcta, sobre todo si usas varias. Si no es la que querías, desconecta y vuelve a conectar iniciando sesión con el email adecuado. El email se guarda solo para mostrártelo aquí y no se comparte con terceros.",
    related: ["aji-3", "aji-14", "aji-25"],
    keywords: ["email", "cuenta", "conectada", "visualizar"],
  },
  {
    id: "aji-8",
    section: "ajustes-integraciones",
    question: "¿Qué datos comparte Annonia con Google al integrarse?",
    answer:
      "Solo los datos logísticos imprescindibles para crear eventos: título del tipo `Consulta nutricional - [nombre del paciente]`, fecha y hora, duración, motivo breve, email del paciente como invitado si aplica y el enlace Meet si la cita es online. No se comparten mediciones, planes de alimentación, historias clínicas, notas ni ningún dato médico sensible. Google solo ve la capa logística, no el contenido clínico. Todo queda sujeto a la política de privacidad de Annonia y a los términos de Google Workspace.",
    related: ["aji-1", "aji-19", "aji-24"],
    keywords: ["datos", "compartir", "privacidad", "qué envía"],
  },
  {
    id: "aji-9",
    section: "ajustes-integraciones",
    question: "¿Para qué sirve el toggle \"Sincronizar citas automáticamente\"?",
    answer:
      "Ese interruptor (`sincronizar`) controla si Annonia envía o no los cambios de agenda a Google en tiempo real. Cuando está activo, cada vez que creas, modificas o cancelas una cita, el evento correspondiente se crea, actualiza o borra en tu Google Calendar sin intervención manual. Si lo apagas, la conexión se mantiene pero deja de propagar cambios: los eventos viejos permanecen y los nuevos no aparecen en Google. Es la palanca principal para dosificar el nivel de automatización sin necesidad de desconectar del todo.",
    related: ["aji-10", "aji-11", "aji-12"],
    keywords: ["sincronizar", "toggle", "automático", "citas"],
  },
  {
    id: "aji-10",
    section: "ajustes-integraciones",
    question: "¿Cómo desactivo la sincronización sin desconectar la cuenta?",
    answer:
      "Basta con poner a `off` el toggle `Sincronizar citas automáticamente` en la tarjeta de Google Calendar. Annonia guarda el nuevo estado y a partir de ese momento ya no envía cambios a Google, pero conserva los tokens OAuth tal cual, listos para reanudar cuando quieras. Es la opción recomendada para pausas temporales, por ejemplo durante las vacaciones, mientras migras datos o si estás haciendo pruebas de agenda que no quieres que aparezcan en tu calendar. Para reanudar solo tienes que volver a activar el toggle.",
    related: ["aji-9", "aji-11", "aji-14"],
    keywords: ["desactivar", "pausar", "temporal", "sin desconectar"],
  },
  {
    id: "aji-11",
    section: "ajustes-integraciones",
    question: "¿Qué ocurre con los eventos antiguos cuando apago el toggle de sincronización?",
    answer:
      "Los eventos que ya se habían creado previamente en tu Google Calendar se quedan exactamente como estaban: no se borran, ni se marcan, ni se actualizan. Lo único que cambia es que, desde el momento de apagar el toggle, los nuevos cambios de agenda en Annonia dejan de propagarse. Tampoco se hace una re-sincronización retroactiva al volver a encenderlo: lo que pasó mientras estaba apagado no se transfiere automáticamente. Si quieres limpiar el calendar, hazlo manualmente o usa el flujo de desconexión con opción `Borrar los eventos de Google`.",
    related: ["aji-9", "aji-10", "aji-15"],
    keywords: ["eventos antiguos", "apagar", "retroactivo", "limpiar"],
  },
  {
    id: "aji-12",
    section: "ajustes-integraciones",
    question: "¿Qué hace el toggle \"Crear Meet automático para citas online\"?",
    answer:
      "El toggle `crearMeet` indica si, al crear una cita marcada como online, Annonia debe pedirle a Google que genere automáticamente una sala Meet y adjunte su enlace al evento del calendar. Si está activo, la cita tendrá un enlace `meet.google.com/...` listo para copiar y enviar al paciente; si está inactivo, el evento se crea sin sala de vídeo y tendrás que gestionar la videollamada por otros medios. Solo aplica a citas online: para las presenciales no se generan salas aunque el toggle esté activo.",
    related: ["aji-9", "aji-13", "aji-20"],
    keywords: ["meet", "toggle", "automático", "online"],
  },
  {
    id: "aji-13",
    section: "ajustes-integraciones",
    question: "¿Cuándo conviene activar el Meet automático y cuándo no?",
    answer:
      "Actívalo si la mayoría de tus consultas online las haces por Google Meet: te ahorra generar manualmente un enlace para cada cita y garantiza que paciente y profesional reciben la sala en el evento del calendar. Desactívalo si trabajas con otra herramienta (Zoom, Jitsi, WhatsApp videollamada, etc.) y prefieres gestionar el enlace aparte para evitar confusión con dos salas distintas. También puedes apagarlo puntualmente si estás haciendo pruebas y no quieres crear habitaciones Meet de verdad. El cambio es reversible y se aplica solo a las citas nuevas.",
    related: ["aji-12", "aji-20", "aji-21"],
    keywords: ["activar", "meet", "cuándo", "decisión"],
  },
  {
    id: "aji-14",
    section: "ajustes-integraciones",
    question: "¿Puedo cambiar el calendario de Google al que se envían los eventos?",
    answer:
      "Por defecto Annonia usa tu calendario primario (`primary`), que suele ser el principal asociado al email con el que te conectaste. Dentro de la tarjeta de Google aparecen preferencias avanzadas donde puedes elegir otro calendario si tienes varios (por ejemplo, uno dedicado a la consulta). Si cambias de calendario, los eventos futuros se crean en el nuevo; los existentes permanecen donde ya estaban y tendrías que moverlos manualmente desde Google Calendar. Es una buena práctica separar profesional y personal si llevas muchas citas.",
    related: ["aji-7", "aji-10", "aji-20"],
    keywords: ["calendario", "primary", "cambiar", "destino"],
  },
  {
    id: "aji-15",
    section: "ajustes-integraciones",
    question: "¿Cómo desconecto mi cuenta de Google desde Ajustes?",
    answer:
      "En la tarjeta `Google Calendar`, dentro de `Ajustes` → `Integraciones`, pulsa el botón rojo `Desconectar`. Se abrirá un modal de confirmación que te obliga a decidir qué hacer con los eventos ya creados en tu Google (dejarlos o borrarlos). Al confirmar, Annonia elimina los tokens OAuth guardados y la cuenta queda desvinculada: los toggles desaparecen y vuelve a aparecer el botón `Conectar con Google`. Desde ese momento ningún cambio en la agenda se propaga a Google hasta que vuelvas a conectar.",
    related: ["aji-16", "aji-17", "aji-18"],
    keywords: ["desconectar", "botón", "revocar", "quitar"],
  },
  {
    id: "aji-16",
    section: "ajustes-integraciones",
    question: "¿Qué significan las opciones \"Dejar los eventos en Google\" y \"Borrar los eventos de Google\" del modal?",
    answer:
      "`Dejar los eventos en Google` conserva intactos todos los eventos que Annonia había creado hasta ahora en tu calendar; simplemente deja de gestionarlos, pero siguen visibles y editables manualmente. `Borrar los eventos de Google` lanza una limpieza que elimina esos eventos de tu calendar, útil si quieres dejar Google tal como estaba antes de la integración. La opción de borrado puede tardar unos segundos si hay muchos eventos y es irreversible. Si tienes dudas, elige dejar los eventos: siempre puedes borrarlos después manualmente.",
    related: ["aji-15", "aji-17", "aji-19"],
    keywords: ["dejar", "borrar", "modal", "opciones"],
  },
  {
    id: "aji-17",
    section: "ajustes-integraciones",
    question: "¿Qué consecuencias tiene desconectar Google en la agenda y en Meet?",
    answer:
      "Al desconectar, la agenda de Annonia sigue funcionando con normalidad, pero deja de espejarse en Google Calendar: no se crean, actualizan ni borran eventos nuevos allí. Además, se pierde la capacidad de generar salas Meet automáticas, porque Meet se crea a través de la API de Calendar; las citas online futuras se guardarán sin enlace de videollamada gestionado. Los eventos ya existentes quedan tal y como se decidió en el modal de desconexión. Cualquier nueva sincronización requerirá volver a autorizar la cuenta.",
    related: ["aji-15", "aji-16", "aji-18"],
    keywords: ["consecuencias", "desconectar", "meet", "agenda"],
  },
  {
    id: "aji-18",
    section: "ajustes-integraciones",
    question: "¿Cómo vuelvo a conectar Google después de haber desconectado?",
    answer:
      "El proceso es idéntico al inicial: en la tarjeta `Google Calendar` pulsa `Conectar con Google` y completa el flujo OAuth con la cuenta que quieras (puede ser la misma u otra distinta). Al volver, el sistema hace un backfill automático de las últimas citas para poblar el calendar, y verás un flash de éxito confirmando la reconexión. Si no borraste los eventos previos en la desconexión, es posible que aparezcan duplicados; revísalos en Google y elimina los antiguos si molestan. Los toggles vuelven a su estado por defecto y puedes ajustarlos de nuevo.",
    related: ["aji-3", "aji-15", "aji-16"],
    keywords: ["reconectar", "volver", "nueva conexión", "duplicados"],
  },
  {
    id: "aji-19",
    section: "ajustes-integraciones",
    question: "¿Qué errores comunes pueden ocurrir con la integración una vez conectada?",
    answer:
      "Los más habituales son: token de refresh revocado (si el usuario quitó el permiso desde `myaccount.google.com`), permisos insuficientes (al cambiar de calendario sin acceso de escritura), cuotas de la API excedidas (muy raro) y errores de red puntuales. En esos casos la tarjeta `Google Calendar` muestra un aviso pidiéndote reconectar y las citas dejan de replicarse hasta que lo hagas. Desconectar y volver a conectar resuelve la inmensa mayoría de los incidentes. Si el problema persiste, contacta con soporte indicando el email conectado y el momento del fallo.",
    related: ["aji-6", "aji-17", "aji-24"],
    keywords: ["errores", "token", "revocado", "comunes"],
  },
  {
    id: "aji-20",
    section: "ajustes-integraciones",
    question: "¿La integración con Stripe también se gestiona desde aquí?",
    answer:
      "No. Aunque Stripe es una integración importante de Annonia para cobros online y suscripciones, vive en su propia pestaña `Ajustes` → `Cobros` para mantenerla separada de las integraciones de productividad (calendario, Meet). Allí encontrarás el estado de tu cuenta Stripe, el botón para conectarte vía Stripe Connect y las opciones de enlaces de pago. La pestaña `Integraciones` se centra exclusivamente en servicios de agenda y comunicación. Así cada usuario entra directo a lo que necesita sin mezclar conceptos.",
    related: ["aji-2", "aji-21"],
    keywords: ["stripe", "cobros", "pestaña", "separado"],
  },
  {
    id: "aji-21",
    section: "ajustes-integraciones",
    question: "¿Habrá más integraciones en el futuro (Outlook, Apple Calendar, etc.)?",
    answer:
      "Está en estudio ampliar la lista de integraciones nativas con Microsoft Outlook, Apple Calendar (iCloud) y quizá sistemas como Zoom o Microsoft Teams, pero a día de hoy ninguna está implementada. El foco inicial se ha puesto en Google Calendar por cobertura y porque es lo que más nos pedían los profesionales. Si tu flujo depende de otro sistema, una solución intermedia es conectar Google Calendar con Annonia y después sincronizar tu Google Calendar con Outlook o Apple mediante las opciones nativas de esos clientes. Se avisará por correo cuando haya novedades.",
    related: ["aji-2", "aji-20"],
    keywords: ["outlook", "apple", "futuras", "roadmap"],
  },
  {
    id: "aji-22",
    section: "ajustes-integraciones",
    question: "¿Puedo usar Google también para hacer login en Annonia?",
    answer:
      "Sí. La autenticación se apoya en Supabase, que soporta proveedores OAuth externos; si está habilitado, verás un botón `Iniciar sesión con Google` en la pantalla de login. Es una integración distinta a la de `Ajustes` → `Integraciones`: una cosa es entrar en la app con tu cuenta Google (login social) y otra es conectar Google Calendar para sincronizar citas. Ambas pueden convivir sin problema y, de hecho, suelen usarse juntas para tener una experiencia más fluida. Si el botón de login con Google no aparece, ese proveedor no está activado en tu instancia.",
    related: ["aji-23", "aji-25"],
    keywords: ["login", "google", "supabase", "autenticación"],
  },
  {
    id: "aji-23",
    section: "ajustes-integraciones",
    question: "¿Me conviene usar el mismo email de Google para login y para el calendario?",
    answer:
      "Sí, es la configuración más recomendable. Usar el mismo email para iniciar sesión en Annonia y para conectar Google Calendar simplifica la gestión: un solo permiso que revisar, una sola cuenta de Google en tu ordenador y coherencia entre quién eres y qué calendar se sincroniza. No es obligatorio: puedes loguearte con un email y conectar otro email distinto en la integración, pero genera más puntos de confusión a largo plazo. Si usas cuentas distintas, apunta bien cuál es cuál para evitar desconectar la que no querías.",
    related: ["aji-7", "aji-22", "aji-25"],
    keywords: ["mismo email", "login", "calendario", "recomendación"],
  },
  {
    id: "aji-24",
    section: "ajustes-integraciones",
    question: "¿Qué puedo hacer si la integración falla y soporte no está disponible?",
    answer:
      "Primero revisa el mensaje de error exacto que muestra el flash (por ejemplo `no_configurado`, `error_oauth`, `access_denied`) porque la causa suele estar ahí. Después intenta desconectar desde `Ajustes` → `Integraciones` eligiendo `Dejar los eventos en Google` y volver a conectar; resuelve la mayoría de problemas de tokens. Si persiste, comprueba en `myaccount.google.com` → `Seguridad` → `Aplicaciones de terceros` que Annonia sigue con permisos concedidos. En último caso, escribe a soporte indicando el email conectado, el error y la hora aproximada para que podamos revisar logs del servidor.",
    related: ["aji-6", "aji-17", "aji-19"],
    keywords: ["soporte", "fallo", "ayuda", "diagnóstico"],
  },
  {
    id: "aji-25",
    section: "ajustes-integraciones",
    question: "¿Cómo se comporta la integración si uso Annonia en varios dispositivos?",
    answer:
      "La conexión con Google vive en el servidor de Annonia asociada a tu cuenta de profesional, no a un dispositivo concreto. Eso significa que una vez conectada desde cualquier navegador (portátil, móvil, tablet), la integración queda activa para toda tu sesión independientemente de dónde accedas luego. Los eventos creados en Google Calendar aparecen en todos tus dispositivos con esa cuenta Google sincronizada (Android, iPhone, reloj, cliente de escritorio). No hace falta reconectar en cada dispositivo nuevo que uses para entrar a Annonia.",
    related: ["aji-7", "aji-22", "aji-23"],
    keywords: ["dispositivos", "multi", "sincronización", "sesión"],
  },
];
