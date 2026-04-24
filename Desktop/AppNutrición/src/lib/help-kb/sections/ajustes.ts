import type { HelpEntry } from "../types";

export const AJUSTES_ENTRIES: HelpEntry[] = [
  {
    id: "aj-1",
    section: "ajustes",
    question: "¿Qué es la página de Ajustes?",
    answer:
      "Ajustes es el centro de configuración de tu cuenta profesional en Annonia. Desde aquí controlas tu perfil, datos profesionales, integraciones, suscripción, cobros, paciente de ejemplo, guías y acciones sensibles. Es el sitio al que acudirás al empezar a usar la app y cada vez que necesites cambiar algo estructural. A diferencia del Dashboard, que es un resumen de tu actividad, Ajustes se centra en configurar cómo funciona tu cuenta.",
    related: ["aj-2", "aj-4", "aj-18"],
    keywords: ["ajustes", "configuración", "cuenta", "panel"],
  },
  {
    id: "aj-2",
    section: "ajustes",
    question: "¿Cómo está estructurado el panel de Ajustes?",
    answer:
      "El panel se divide en tres zonas: arriba el resumen de cuenta con tu avatar, nombre, email y chips de especialidad y plan; a la izquierda un sidebar navegable con las 8 secciones de configuración; y a la derecha el contenido principal con cada sección separada mediante una cabecera (icono coloreado, título y descripción) y una card con sus ajustes. Esta organización te permite ver de un vistazo en qué parte de la configuración estás y saltar rápidamente a otra.",
    related: ["aj-1", "aj-3", "aj-5"],
    keywords: ["estructura", "panel", "layout", "secciones"],
  },
  {
    id: "aj-3",
    section: "ajustes",
    question: "¿Qué secciones aparecen en el sidebar de Ajustes?",
    answer:
      "El sidebar contiene 8 secciones enlazadas por anchor: Perfil, Profesional, Integraciones, Paciente de ejemplo, Suscripción, Cobros, Guías y Zona peligrosa. Cada una tiene su icono y agrupa ajustes relacionados. Pulsando sobre cualquiera de ellas haces scroll suave hasta el bloque correspondiente en el contenido principal. Es la forma más rápida de moverte dentro de Ajustes sin perder el contexto.",
    related: ["aj-2", "aj-6", "aj-10"],
    keywords: ["sidebar", "secciones", "anchors", "navegación"],
  },
  {
    id: "aj-4",
    section: "ajustes",
    question: "¿Qué muestra el resumen de cuenta en la parte superior?",
    answer:
      "El resumen de cuenta es una tarjeta que aparece arriba del todo con tu avatar, tu nombre, tu email y dos chips destacados: el de tu especialidad profesional y el de tu plan actual. Sirve como identificación rápida y como recordatorio de qué cuenta tienes activa. Si algo de lo que ves ahí es incorrecto, el lugar para cambiarlo es la sección Perfil o Profesional del propio panel.",
    related: ["aj-1", "aj-14", "aj-15"],
    keywords: ["resumen", "cuenta", "avatar", "chips", "cabecera"],
  },
  {
    id: "aj-5",
    section: "ajustes",
    question: "¿Por qué el sidebar es sticky en escritorio?",
    answer:
      "En pantallas grandes el sidebar está fijado (sticky) para que siempre lo tengas a la vista mientras haces scroll por el contenido de la derecha. Así puedes consultar dónde estás, ver la sección activa resaltada y saltar a otra en cualquier momento sin volver a la parte superior. Es un patrón pensado para configuraciones largas en las que se navega mucho entre secciones.",
    related: ["aj-3", "aj-6", "aj-22"],
    keywords: ["sticky", "sidebar", "escritorio", "scroll"],
  },
  {
    id: "aj-6",
    section: "ajustes",
    question: "¿Cómo sabe el panel qué sección estoy viendo mientras hago scroll?",
    answer:
      "Usamos un IntersectionObserver que detecta cuál de las secciones del contenido principal está visible en el viewport. Cuando una sección entra en pantalla, su entrada correspondiente en el sidebar se marca como activa. Esto ocurre en tiempo real mientras haces scroll, sin que tengas que hacer clic. Así sabes siempre en qué parte de Ajustes estás, aunque hayas llegado hasta ahí arrastrando la rueda del ratón.",
    related: ["aj-5", "aj-7", "aj-3"],
    keywords: ["intersectionobserver", "sección activa", "scroll tracking"],
  },
  {
    id: "aj-7",
    section: "ajustes",
    question: "¿Qué pasa al pulsar un enlace del sidebar?",
    answer:
      "Al pulsar un enlace del sidebar se realiza un smooth scroll (desplazamiento animado) hasta la sección elegida dentro del contenido principal. El URL se actualiza con el hash correspondiente (por ejemplo #perfil) y la entrada queda marcada como activa. Esto permite compartir enlaces directos a una sección concreta y volver después al mismo punto refrescando la página.",
    related: ["aj-3", "aj-6", "aj-10"],
    keywords: ["smooth scroll", "hash", "enlace", "anchor"],
  },
  {
    id: "aj-8",
    section: "ajustes",
    question: "¿Por qué se eligió un sidebar con scroll y no pestañas?",
    answer:
      "El sidebar con scroll permite ver todas las secciones a la vez, repasarlas en orden y entender la configuración completa sin tener que hacer clic en cada pestaña. Las pestañas esconden el contenido y obligan a cambiar de panel, lo que rompe la sensación de continuidad. Para una página con 8 grupos relacionados, el scroll lateral resulta más natural y facilita tareas como la configuración inicial.",
    related: ["aj-2", "aj-3", "aj-17"],
    keywords: ["pestañas", "tabs", "scroll", "diseño"],
  },
  {
    id: "aj-9",
    section: "ajustes",
    question: "¿Cómo funciona el sidebar en móvil?",
    answer:
      "En móvil el sidebar pasa a mostrarse como una barra horizontal con scroll, colocada encima del contenido. Puedes deslizar el dedo para ver todas las secciones y tocar la que necesites. Al pulsar se hace igualmente scroll suave hasta el bloque correspondiente más abajo. La detección de sección activa sigue funcionando igual que en escritorio.",
    related: ["aj-5", "aj-22", "aj-28"],
    keywords: ["móvil", "responsive", "scroll horizontal"],
  },
  {
    id: "aj-10",
    section: "ajustes",
    question: "¿En qué orden debería configurar las secciones al empezar?",
    answer:
      "El orden recomendado es: 1) Perfil, para que tus pacientes te identifiquen bien; 2) Profesional, con número de colegiado y especialidad; 3) Integraciones, especialmente Google Calendar si vas a usarlo; 4) Suscripción, para elegir o revisar el plan; 5) Cobros, si vas a emitir facturas; 6) Paciente de ejemplo, para explorar la app con datos ficticios; 7) Guías, para enviar materiales; y 8) Zona peligrosa, que se toca solo cuando es imprescindible.",
    related: ["aj-11", "aj-1", "aj-3"],
    keywords: ["orden", "inicio", "configuración inicial"],
  },
  {
    id: "aj-11",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Perfil?",
    answer:
      "Usa la sección Perfil cuando quieras actualizar tu nombre, foto, email de contacto o cualquier dato personal visible para pacientes y colaboradores. Es una de las primeras cosas que conviene completar al crear la cuenta, porque influye en cómo te ven desde el portal de paciente. También es el sitio al que volver si cambias de número de teléfono o de dirección profesional.",
    related: ["aj-10", "aj-4", "aj-12"],
    keywords: ["perfil", "datos personales", "nombre", "foto"],
  },
  {
    id: "aj-12",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Profesional?",
    answer:
      "La sección Profesional es para tus datos de ejercicio: número de colegiado, especialidad, titulación y organización a la que perteneces. Úsala cuando te colegies, cuando cambies de especialidad o cuando añadas un título nuevo. Estos datos aparecen en documentos generados (planes, facturas) y en el chip de especialidad del resumen de cuenta.",
    related: ["aj-11", "aj-10", "aj-4"],
    keywords: ["profesional", "colegiado", "especialidad", "titulación"],
  },
  {
    id: "aj-13",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Integraciones?",
    answer:
      "Entra en Integraciones cuando quieras conectar servicios externos como Google Calendar para sincronizar citas, o cuando necesites revocar un acceso ya concedido. También es el sitio al que volver si una integración deja de funcionar y quieres reautenticarla. Cada integración explica qué permisos pide y qué datos comparte.",
    related: ["aj-10", "aj-19", "aj-3"],
    keywords: ["integraciones", "google calendar", "conectar"],
  },
  {
    id: "aj-14",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Suscripción?",
    answer:
      "La sección Suscripción es donde ves y cambias tu plan, consultas la fecha de renovación y gestionas cancelaciones o upgrades. Úsala al contratar el plan de pago, cuando quieras pasar de mensual a anual, o cuando decidas dar de baja la suscripción. Si tu cuenta no tiene suscripción activa en curso, puede que esta sección aparezca simplificada o con un botón para contratar.",
    related: ["aj-15", "aj-19", "aj-4"],
    keywords: ["suscripción", "plan", "renovación", "upgrade"],
  },
  {
    id: "aj-15",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Cobros?",
    answer:
      "Usa Cobros cuando configures cómo emites facturas a tus pacientes: datos fiscales, IVA aplicable, numeración, método de cobro y cuenta bancaria. También es el sitio al que acudir para ajustar la política de cancelación y los precios por defecto. Es distinta de Suscripción, que trata del pago que tú haces a la plataforma.",
    related: ["aj-14", "aj-10", "aj-24"],
    keywords: ["cobros", "facturación", "precios", "datos fiscales"],
  },
  {
    id: "aj-16",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Paciente de ejemplo?",
    answer:
      "El paciente de ejemplo es una cuenta ficticia con datos prerrellenados que te permite probar funciones sin arriesgar información real. Úsala cuando quieras ensayar la creación de un plan, aprender a programar citas o enseñarle la app a un colega sin exponer historias de pacientes reales. Se puede restablecer o borrar sin consecuencias.",
    related: ["aj-10", "aj-20", "aj-27"],
    keywords: ["paciente de ejemplo", "demo", "ficticio", "pruebas"],
  },
  {
    id: "aj-17",
    section: "ajustes",
    question: "¿Cuándo debería usar la sección Guías?",
    answer:
      "Entra en Guías cuando quieras gestionar los materiales descargables (PDFs educativos, recetas, pautas generales) que envías a tus pacientes. Puedes subir nuevas guías, eliminar las obsoletas o reordenarlas. Desde la ficha de cada paciente podrás después adjuntar las guías que tengas aquí dadas de alta.",
    related: ["aj-10", "aj-3", "aj-19"],
    keywords: ["guías", "materiales", "pdfs", "biblioteca"],
  },
  {
    id: "aj-18",
    section: "ajustes",
    question: "¿En qué se diferencia Ajustes del Dashboard?",
    answer:
      "El Dashboard es una vista de resumen de tu actividad diaria: próximas citas, pacientes recientes, métricas y avisos. Ajustes, en cambio, es puramente de configuración: decides cómo se comporta la cuenta y cómo se presentan los datos. Uno mira hacia fuera (lo que pasa hoy) y el otro hacia dentro (cómo está montada tu cuenta). Normalmente entrarás al Dashboard varias veces al día y a Ajustes solo puntualmente.",
    related: ["aj-1", "aj-21", "aj-2"],
    keywords: ["dashboard", "diferencia", "resumen", "configuración"],
  },
  {
    id: "aj-19",
    section: "ajustes",
    question: "¿Puedo importar o exportar mi configuración?",
    answer:
      "De momento no existe una opción para exportar o importar toda la configuración de Ajustes como un único archivo. Cada sección se configura manualmente desde la interfaz. Si migras de otra cuenta, tendrás que repasar Perfil, Profesional, Integraciones, Cobros y Guías una a una. Es una funcionalidad que valoraremos incorporar si hay demanda.",
    related: ["aj-27", "aj-10", "aj-25"],
    keywords: ["importar", "exportar", "migrar", "backup"],
  },
  {
    id: "aj-20",
    section: "ajustes",
    question: "¿Por qué a veces no aparecen todas las secciones?",
    answer:
      "Algunas secciones pueden ocultarse o mostrarse de forma reducida en función de tu plan y estado. Por ejemplo, Suscripción aparece con opciones distintas si ya tienes plan de pago o si estás en la versión gratuita. Lo mismo puede pasar con Cobros si todavía no has configurado datos fiscales. El sidebar siempre refleja las secciones realmente disponibles en tu cuenta.",
    related: ["aj-14", "aj-3", "aj-1"],
    keywords: ["secciones ocultas", "disponibilidad", "plan"],
  },
  {
    id: "aj-21",
    section: "ajustes",
    question: "¿Dónde está la opción de tema claro u oscuro?",
    answer:
      "El conmutador de tema claro/oscuro no está dentro de Ajustes, sino en el sidebar general de la aplicación, normalmente abajo junto al acceso rápido al perfil. Se hizo así porque el tema afecta a toda la interfaz, no solo a esta pantalla, y porque queríamos que estuviera a un clic desde cualquier lugar. En Ajustes encontrarás la configuración funcional, no la preferencia visual.",
    related: ["aj-22", "aj-18", "aj-28"],
    keywords: ["tema", "oscuro", "claro", "dark mode"],
  },
  {
    id: "aj-22",
    section: "ajustes",
    question: "¿En qué idioma está la página de Ajustes?",
    answer:
      "La interfaz de Ajustes está en castellano peninsular con tildes y terminología propia de España. Las etiquetas, descripciones y mensajes de confirmación se han redactado buscando claridad y cercanía con dietistas y nutricionistas españoles. Por ahora no hay selector de idioma; si se añaden más en el futuro, el selector aparecería en una nueva sección dentro del propio panel.",
    related: ["aj-23", "aj-1", "aj-21"],
    keywords: ["idioma", "castellano", "español", "traducción"],
  },
  {
    id: "aj-23",
    section: "ajustes",
    question: "¿Cómo se cuida la accesibilidad en Ajustes?",
    answer:
      "Cada sección tiene un título con jerarquía correcta (headings), los iconos llevan texto alternativo, los botones son etiquetables por lectores de pantalla y los controles de formulario tienen labels vinculadas. El foco del teclado salta de forma ordenada por el sidebar y por las cards de contenido. Puedes navegar por completo la página usando solo el teclado.",
    related: ["aj-22", "aj-9", "aj-6"],
    keywords: ["accesibilidad", "a11y", "teclado", "screen reader"],
  },
  {
    id: "aj-24",
    section: "ajustes",
    question: "¿Se pide confirmación antes de cambios críticos?",
    answer:
      "Sí. Las acciones que pueden tener efectos importantes (cambiar correo, darse de baja de la suscripción, revocar una integración, borrar el paciente de ejemplo o usar algo de la Zona peligrosa) muestran siempre una ventana de confirmación antes de ejecutarse. Esa ventana resume en qué consiste el cambio y te pide confirmación explícita. Los cambios menores (foto, descripción, orden de guías) se guardan directamente.",
    related: ["aj-26", "aj-15", "aj-3"],
    keywords: ["confirmación", "diálogo", "seguridad", "cambios"],
  },
  {
    id: "aj-25",
    section: "ajustes",
    question: "¿Existe un registro de cambios realizados en Ajustes?",
    answer:
      "Actualmente no existe un log visible que muestre quién cambió qué y cuándo dentro de Ajustes. Los cambios se aplican y quedan reflejados en los campos correspondientes, pero no hay un historial navegable desde la interfaz. Si necesitas dejar constancia de una modificación importante, te recomendamos anotarla por tu parte hasta que se implemente el registro.",
    related: ["aj-24", "aj-19", "aj-26"],
    keywords: ["logs", "historial", "auditoría", "cambios"],
  },
  {
    id: "aj-26",
    section: "ajustes",
    question: "¿Qué efectos tiene cambiar algo importante en Ajustes?",
    answer:
      "Algunos cambios son puramente visuales (foto, descripción) y otros tienen efecto inmediato en otros sitios de la app: cambiar el nombre actualiza lo que ven los pacientes en el portal, desconectar Google Calendar detiene la sincronización de citas, cambiar los datos de Cobros afecta a las próximas facturas, y bajar de plan en Suscripción puede limitar funciones disponibles. Los diálogos de confirmación suelen avisarte de las consecuencias concretas.",
    related: ["aj-24", "aj-14", "aj-13"],
    keywords: ["efectos", "consecuencias", "impacto"],
  },
  {
    id: "aj-27",
    section: "ajustes",
    question: "¿Qué cuidados tiene Annonia con la privacidad de Ajustes?",
    answer:
      "Los datos que guardas en Ajustes (especialmente Perfil, Profesional y Cobros) se almacenan cifrados y no se comparten con terceros salvo las integraciones que tú mismo autorices. Las credenciales OAuth (por ejemplo Google) no se guardan como contraseña: se guardan tokens revocables. Puedes desconectar cualquier integración desde su tarjeta en Integraciones y puedes iniciar un borrado de cuenta desde la Zona peligrosa.",
    related: ["aj-13", "aj-25", "aj-24"],
    keywords: ["privacidad", "seguridad", "datos", "gdpr"],
  },
  {
    id: "aj-28",
    section: "ajustes",
    question: "¿Cómo se ve Ajustes desde el móvil?",
    answer:
      "En móvil el resumen de cuenta se apila arriba, el sidebar se convierte en una barra horizontal con scroll justo debajo, y las cards de contenido ocupan todo el ancho. Las cabeceras de sección siguen mostrando icono y título para que te ubiques rápido. Al tocar una sección del sidebar se hace scroll suave como en escritorio. Todos los formularios están optimizados para pantallas estrechas.",
    related: ["aj-9", "aj-22", "aj-2"],
    keywords: ["móvil", "responsive", "diseño"],
  },
  {
    id: "aj-29",
    section: "ajustes",
    question: "¿Cómo vuelvo al Dashboard desde Ajustes?",
    answer:
      "Para volver al Dashboard puedes usar el logo de la aplicación en la esquina superior, el enlace \"Dashboard\" del menú lateral principal, o el atajo de navegador \"atrás\" si has llegado desde allí. Los cambios que hayas guardado en Ajustes quedan aplicados automáticamente; no necesitas pulsar ningún botón de \"guardar todo\". Si has dejado algún cambio sin confirmar en un diálogo, se te avisará antes de salir.",
    related: ["aj-18", "aj-21", "aj-2"],
    keywords: ["volver", "dashboard", "salir"],
  },
  {
    id: "aj-30",
    section: "ajustes",
    question: "¿Qué pasa con el widget Tour si lo abro mientras estoy en Ajustes?",
    answer:
      "El widget Tour está pensado para no interferir con tu trabajo: si lo abres estando en Ajustes, se superpone a un lado sin bloquear el scroll ni los formularios. Puedes seguir editando campos mientras consultas ayuda, y el tracking de sección activa del sidebar sigue funcionando por debajo. Al cerrarlo vuelves exactamente al mismo punto del scroll y a la sección que estabas configurando.",
    related: ["aj-6", "aj-23", "aj-1"],
    keywords: ["tour", "widget", "ayuda", "interrupciones"],
  },
];
