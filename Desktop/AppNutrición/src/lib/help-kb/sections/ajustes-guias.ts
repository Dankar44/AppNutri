import type { HelpEntry } from "../types";

export const AJUSTES_GUIAS_ENTRIES: HelpEntry[] = [
  {
    id: "ajg-1",
    section: "ajustes-guias",
    question: "¿Qué son las guías interactivas de Annonia?",
    answer:
      "Las guías interactivas son tours paso a paso que te enseñan a usar cada sección de la aplicación directamente sobre la interfaz real. Cada tour ilumina elementos concretos de la pantalla (un botón, una tabla, un gráfico) y muestra una pequeña burbuja con una explicación sobre lo que hace y cómo usarlo. Están pensadas para que aprendas haciendo, sin necesidad de leer manuales largos ni ver vídeos externos. Se gestionan desde Ajustes mediante el componente `<TourSettings>`, en la sección \"Guías interactivas\". Los datos de cada tour viven en `src/lib/tour-data.ts` y definen el id, nombre, descripción y pasos con su selector CSS y contenido.",
    related: ["ajg-2", "ajg-8", "ajg-15"],
    keywords: ["guías", "tours", "interactivas", "aprender", "onboarding"],
  },
  {
    id: "ajg-2",
    section: "ajustes-guias",
    question: "¿Cómo inicio un tour por primera vez?",
    answer:
      "Entra en Ajustes y abre la sección \"Guías interactivas\". Verás un listado con los tours disponibles y, junto a cada uno, un botón \"Iniciar\" si aún no lo has completado. Al pulsarlo, la app te llevará automáticamente a la página correspondiente (dashboard, pacientes, dietas, etc.) y aparecerá una burbuja superpuesta con el primer paso del tour. Desde ahí puedes avanzar con \"Siguiente\" o \"Anterior\" hasta terminar todos los pasos. No hace falta ninguna configuración previa, basta con pulsar el botón.",
    related: ["ajg-1", "ajg-3", "ajg-9"],
    keywords: ["iniciar", "empezar", "tour", "primera vez"],
  },
  {
    id: "ajg-3",
    section: "ajustes-guias",
    question: "¿Cómo repito un tour que ya había completado?",
    answer:
      "Los tours ya completados aparecen en el listado con la etiqueta \"Completado\" y el botón cambia de \"Iniciar\" a \"Repetir\". Pulsa \"Repetir\" y el tour se lanzará de nuevo desde el primer paso, llevándote a la pantalla correspondiente. Puedes repetirlo tantas veces como quieras, el estado de completado no se pierde al repetirlo. Es útil si has olvidado cómo funciona una sección concreta o si quieres refrescar el flujo tras una actualización de la app.",
    related: ["ajg-2", "ajg-4", "ajg-5"],
    keywords: ["repetir", "reiniciar tour", "volver a ver", "completado"],
  },
  {
    id: "ajg-4",
    section: "ajustes-guias",
    question: "¿Qué significa el contador \"N de M completados\"?",
    answer:
      "En la cabecera de la sección \"Guías interactivas\" verás un contador con el formato \"N de M completados\", donde N es el número de tours que has terminado y M es el total disponible para tu rol. Por ejemplo, \"3 de 8 completados\" significa que aún te quedan 5 tours por hacer. El contador se actualiza automáticamente en cuanto completas un nuevo tour. Sirve como referencia rápida para saber cuánto te queda por explorar y como pequeño empujón para seguir aprendiendo.",
    related: ["ajg-3", "ajg-5", "ajg-6"],
    keywords: ["contador", "completados", "progreso", "n de m"],
  },
  {
    id: "ajg-5",
    section: "ajustes-guias",
    question: "¿Para qué sirve el botón \"Reiniciar\"?",
    answer:
      "El botón \"Reiniciar\" (o \"Reiniciar todos\") borra la lista completa de tours marcados como completados en tu cuenta. Tras pulsarlo, todos los tours volverán al estado inicial y el contador quedará en \"0 de M completados\". Es útil si quieres redescubrir la aplicación desde cero, por ejemplo cuando enseñas la herramienta a un compañero o cuando has habido cambios grandes en la interfaz. No borra los datos ni afecta a nada más, sólo al registro de qué tours has visto.",
    related: ["ajg-4", "ajg-6", "ajg-7"],
    keywords: ["reiniciar", "resetear", "borrar completados", "botón"],
  },
  {
    id: "ajg-6",
    section: "ajustes-guias",
    question: "¿Dónde se guarda el estado de los tours completados?",
    answer:
      "El estado de los tours completados se persiste en el `localStorage` del navegador, no en la base de datos de Annonia. Esto significa que se guarda localmente en el dispositivo y navegador desde el que uses la aplicación. La ventaja es que es rápido y no necesita consultar al servidor, pero tiene la contrapartida de que el estado es por navegador y por dispositivo. Si cambias de ordenador o de navegador, los tours volverán a aparecer como no completados.",
    related: ["ajg-5", "ajg-7", "ajg-13"],
    keywords: ["localstorage", "persistencia", "navegador", "guardado"],
  },
  {
    id: "ajg-7",
    section: "ajustes-guias",
    question: "¿Pierdo el progreso de los tours si borro la caché del navegador?",
    answer:
      "Sí, al borrar la caché y los datos del sitio en tu navegador también se borra el `localStorage` donde se guarda qué tours has completado. Tras limpiar la caché verás que el contador vuelve a \"0 de M completados\" y todos los tours aparecerán con el botón \"Iniciar\" de nuevo. No es un problema grave porque los tours son siempre los mismos y puedes volver a hacerlos cuando quieras. Si te molesta, evita borrar los datos del sitio o usa un perfil de navegador separado para Annonia.",
    related: ["ajg-5", "ajg-6", "ajg-13"],
    keywords: ["caché", "borrar", "pérdida", "datos navegador"],
  },
  {
    id: "ajg-8",
    section: "ajustes-guias",
    question: "¿Qué tours hay disponibles para el nutricionista?",
    answer:
      "El listado de tours para el nutricionista cubre las secciones principales del panel: dashboard (métricas e indicadores clave), pacientes (listado, alta, ficha clínica), dietas (editor, plantillas, IA), agenda (citas, horario, Google Calendar), mensajes, ajustes y algunos flujos transversales como compartir planes o usar la IA. Cada uno tiene un nombre descriptivo y una breve descripción para que sepas qué vas a aprender antes de iniciarlo. La lista puede crecer a medida que añadimos nuevas funcionalidades a la app.",
    related: ["ajg-1", "ajg-10", "ajg-15"],
    keywords: ["tours", "disponibles", "dashboard", "pacientes", "dietas", "agenda"],
  },
  {
    id: "ajg-9",
    section: "ajustes-guias",
    question: "¿Puedo saltarme un paso dentro de un tour?",
    answer:
      "Dentro de un tour activo puedes avanzar directamente al siguiente paso con el botón \"Siguiente\" sin tener que interactuar con el elemento que está destacado. Los pasos son puramente informativos y no te obligan a hacer clic ni rellenar nada para progresar. Si un paso no te interesa, pulsa \"Siguiente\" y continuará con el siguiente. También puedes retroceder con \"Anterior\" si quieres volver a leer algo. Así mantienes el control total sobre el ritmo del tour.",
    related: ["ajg-2", "ajg-10", "ajg-11"],
    keywords: ["saltar", "paso", "siguiente", "anterior"],
  },
  {
    id: "ajg-10",
    section: "ajustes-guias",
    question: "¿Qué pasa si cancelo un tour a mitad?",
    answer:
      "Puedes cerrar un tour en cualquier momento pulsando la X de la burbuja o la tecla Escape. Al cancelarlo, el tour no quedará marcado como completado y el contador no se incrementa; seguirá apareciendo con el botón \"Iniciar\" en el listado. No pasa nada por abandonar a mitad, no se guarda un estado intermedio ni hay penalización. La próxima vez que lo lances comenzará de nuevo desde el primer paso. Cancelar es totalmente reversible y sin consecuencias.",
    related: ["ajg-2", "ajg-9", "ajg-11"],
    keywords: ["cancelar", "cerrar", "abandonar", "mitad"],
  },
  {
    id: "ajg-11",
    section: "ajustes-guias",
    question: "¿Hay tours para el portal del paciente?",
    answer:
      "Sí, el portal del paciente tiene sus propios tours pensados para que la persona que accede desde su cuenta aprenda a moverse por su zona: ver su plan de alimentación, registrar seguimiento diario, consultar mensajes con el nutricionista y demás. Estos tours están marcados con una audiencia distinta (paciente) y se muestran dentro del portal, no en el panel del nutricionista. Como dietista no los verás en tu listado de Ajustes, pero puedes contarle al paciente que tiene guías interactivas disponibles cuando entre a su portal.",
    related: ["ajg-1", "ajg-8", "ajg-15"],
    keywords: ["portal", "paciente", "audience", "tours paciente"],
  },
  {
    id: "ajg-12",
    section: "ajustes-guias",
    question: "¿Funcionan los tours en el móvil?",
    answer:
      "Sí, las guías interactivas funcionan también en dispositivos móviles y tablets, aunque con algunas adaptaciones lógicas. Las burbujas de cada paso cambian su posición para acomodarse al tamaño de pantalla y al elemento que están destacando, evitando que se salgan del viewport. Los botones de navegación (Siguiente, Anterior, Cerrar) son pulsables con el dedo y tienen un tamaño accesible. Si giras el dispositivo, la burbuja se reposiciona automáticamente. La experiencia es equivalente a la de escritorio, sólo con una disposición optimizada.",
    related: ["ajg-2", "ajg-9", "ajg-13"],
    keywords: ["móvil", "responsive", "tablet", "posición adaptada"],
  },
  {
    id: "ajg-13",
    section: "ajustes-guias",
    question: "¿Por qué no me apareció ningún tour en mi primera visita?",
    answer:
      "Annonia no lanza tours automáticamente al entrar por primera vez para no interrumpir tu exploración libre de la aplicación. Preferimos que eches un vistazo a tu ritmo y, cuando quieras aprender algo concreto, acudas a Ajustes y lances el tour correspondiente. Si en algún momento te apetece hacer el recorrido guiado de bienvenida, entra en \"Guías interactivas\" y pulsa \"Iniciar\" en el tour del dashboard o del que te interese. El hecho de que no aparezca solo no significa que no exista, siempre está disponible a demanda.",
    related: ["ajg-2", "ajg-5", "ajg-15"],
    keywords: ["primera visita", "onboarding", "no aparece", "bienvenida"],
  },
  {
    id: "ajg-14",
    section: "ajustes-guias",
    question: "¿Qué ocurre al pasar el ratón por encima de los chips del listado?",
    answer:
      "Cada tour aparece representado con una tarjeta o chip que muestra su nombre, una descripción corta y el estado (\"Completado\" o no). Al pasar el ratón por encima, un tooltip amplía la información mostrando el número total de pasos del tour y detalles adicionales como a qué audiencia está dirigido. Esto te ayuda a decidir si quieres iniciarlo sin tener que ejecutarlo antes. En el móvil el tooltip se activa al tocar el chip. Es una forma rápida de previsualizar el contenido antes de lanzar la guía.",
    related: ["ajg-1", "ajg-8", "ajg-15"],
    keywords: ["hover", "chip", "tooltip", "previsualizar"],
  },
  {
    id: "ajg-15",
    section: "ajustes-guias",
    question: "¿Por dónde me recomiendan empezar si acabo de registrarme?",
    answer:
      "Si eres nuevo en Annonia, te recomendamos empezar por el tour del dashboard, que presenta la vista general con métricas, próximas citas y accesos rápidos a las secciones principales. Desde ahí continúa con el tour de pacientes para aprender a dar de alta a tus clientes y manejar su ficha, y después con el de dietas para crear planes de alimentación. La agenda y los ajustes puedes dejarlos para después, cuando ya te manejes con lo básico. Si quieres expandir el listado inicial, pulsa \"Ver todos los tours (N más)\" para desplegar el resto y elegir a tu antojo.",
    related: ["ajg-1", "ajg-2", "ajg-8"],
    keywords: ["recomendación", "empezar", "nuevos usuarios", "dashboard", "ver todos"],
  },
];
