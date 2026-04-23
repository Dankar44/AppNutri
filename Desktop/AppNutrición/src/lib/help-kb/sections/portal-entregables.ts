import type { HelpEntry } from "../types";

export const PORTAL_ENTREGABLES_ENTRIES: HelpEntry[] = [
  {
    id: "pe-1",
    section: "portal-entregables",
    question: "¿Qué es la sección Exportar PDF de mi portal?",
    answer:
      "Exportar PDF es una herramienta dentro de tu portal que te permite generar un documento en PDF con un resumen de tu información nutricional. Incluye tus datos personales, tu plan actual, las recomendaciones de tu nutricionista y tu seguimiento. Se descarga directamente a tu dispositivo. Es útil para tener una copia offline o compartirla con otros profesionales sanitarios.",
    related: ["pe-2", "pe-3"],
    keywords: ["exportar", "pdf", "descargar", "portal"],
  },
  {
    id: "pe-2",
    section: "portal-entregables",
    question: "¿Para qué sirve exportar mi información en PDF?",
    answer:
      "Sirve para tener tu información siempre a mano sin depender del portal. Puedes llevarla a otros profesionales (médico, endocrino, farmacéutico), mostrarla durante un viaje si necesitas orientación, o simplemente conservar una copia en tu ordenador. También es útil en situaciones de emergencia médica donde necesites comunicar tus alergias o patologías rápidamente.",
    related: ["pe-1", "pe-33"],
    keywords: ["utilidad", "profesionales", "viaje", "farmacia"],
  },
  {
    id: "pe-3",
    section: "portal-entregables",
    question: "¿Cómo genero mi PDF desde el portal?",
    answer:
      "Entra en tu portal y ve a la sección Exportar PDF desde el menú lateral. Verás una lista de secciones que puedes incluir con casillas de selección. Marca las que te interesen, revisa la vista previa y pulsa el botón Descargar PDF. El archivo se generará en unos segundos y se guardará en tu dispositivo. Es un proceso muy sencillo que puedes repetir siempre que quieras.",
    related: ["pe-4", "pe-6"],
    keywords: ["generar", "cómo", "crear", "pasos"],
  },
  {
    id: "pe-4",
    section: "portal-entregables",
    question: "¿Qué secciones puedo incluir con las casillas de selección?",
    answer:
      "Puedes elegir entre: Mis datos personales, Mi plan actual (la dieta vigente), Mis recomendaciones, Lista de la compra (si tu plan la genera) y Mi seguimiento con las últimas semanas de registros. Cada casilla se activa o desactiva de forma independiente. Así puedes crear un PDF a medida según para qué lo necesites. Por defecto vienen todas marcadas.",
    related: ["pe-3", "pe-17"],
    keywords: ["secciones", "checkboxes", "casillas", "incluir"],
  },
  {
    id: "pe-5",
    section: "portal-entregables",
    question: "¿Qué muestra la vista previa antes de descargar?",
    answer:
      "La vista previa te enseña cómo quedará tu PDF antes de generarlo definitivamente. Se muestra en formato A4 para que veas los saltos de página y el diseño final. Al marcar o desmarcar casillas, la vista previa se actualiza en tiempo real. Revísala con calma para asegurarte de que incluye lo que necesitas antes de pulsar Descargar.",
    related: ["pe-6", "pe-7"],
    keywords: ["preview", "vista previa", "ver", "revisar"],
  },
  {
    id: "pe-6",
    section: "portal-entregables",
    question: "¿Cómo descargo el PDF una vez esté listo?",
    answer:
      "Cuando hayas configurado las secciones y revisado la vista previa, pulsa el botón Descargar PDF. Tu navegador iniciará la descarga automáticamente. El archivo aparecerá en tu carpeta de Descargas o en la que tengas configurada por defecto. Algunos navegadores te preguntan dónde guardarlo, elige la ubicación que prefieras.",
    related: ["pe-5", "pe-32"],
    keywords: ["descargar", "botón", "guardar"],
  },
  {
    id: "pe-7",
    section: "portal-entregables",
    question: "¿El PDF se genera en formato A4?",
    answer:
      "Sí, el PDF se genera en tamaño A4 estándar, que es el formato de papel más común en Europa. Esto significa que si lo imprimes encajará perfectamente en cualquier impresora doméstica o de oficina. También se ve bien en pantallas grandes o al compartirlo por email. Es el formato habitual para documentos profesionales.",
    related: ["pe-11", "pe-5"],
    keywords: ["a4", "tamaño", "formato", "papel"],
  },
  {
    id: "pe-8",
    section: "portal-entregables",
    question: "¿Aparece el logo de mi nutricionista en la cabecera?",
    answer:
      "Sí, la cabecera del PDF muestra el logo de tu nutricionista (si lo ha configurado) junto con su nombre y datos de contacto profesional. Esto le da un aspecto formal al documento y permite que cualquier profesional que lo reciba identifique quién elaboró tu plan. Tu propio logo no aparece porque el documento refleja el trabajo de tu nutri contigo.",
    related: ["pe-13", "pe-12"],
    keywords: ["logo", "cabecera", "nutricionista", "marca"],
  },
  {
    id: "pe-9",
    section: "portal-entregables",
    question: "¿Se incluye la fecha de generación en el PDF?",
    answer:
      "Sí, cada PDF incluye la fecha en la que lo generaste. Suele aparecer en la cabecera o el pie de cada página. Esto es importante porque tu plan puede cambiar con el tiempo, y la fecha deja claro a qué momento corresponde la información. Si llevas el PDF a otro profesional, sabrá si es reciente o conviene actualizarlo.",
    related: ["pe-34", "pe-22"],
    keywords: ["fecha", "generación", "cuándo"],
  },
  {
    id: "pe-10",
    section: "portal-entregables",
    question: "¿Qué tamaño tiene aproximadamente el archivo?",
    answer:
      "El tamaño depende de las secciones que incluyas y si hay imágenes. Un PDF típico con todas las secciones marcadas suele pesar entre 200 KB y 1 MB. Es un archivo muy ligero que cabe sin problema en cualquier email. Si incluyes muchas semanas de seguimiento o gráficas, puede crecer un poco, pero siempre dentro de lo razonable.",
    related: ["pe-20", "pe-19"],
    keywords: ["tamaño", "peso", "archivo", "kb"],
  },
  {
    id: "pe-11",
    section: "portal-entregables",
    question: "¿Puedo imprimir el PDF directamente desde el navegador?",
    answer:
      "Sí. Una vez abierto el PDF en el navegador, pulsa Ctrl+P (Windows) o Cmd+P (Mac) para abrir el diálogo de impresión. Elige tu impresora y ajusta las opciones si quieres. También puedes descargarlo primero y abrirlo con tu lector de PDFs habitual para imprimir desde ahí. Al estar en A4, no necesitas ajustes especiales.",
    related: ["pe-26", "pe-7"],
    keywords: ["imprimir", "impresora", "navegador"],
  },
  {
    id: "pe-12",
    section: "portal-entregables",
    question: "¿El formato del PDF tiene aspecto profesional?",
    answer:
      "Sí, está diseñado para tener un aspecto cuidado y profesional. Incluye una cabecera con el logo y datos del nutricionista, secciones bien separadas, tipografía legible y un pie de página con la fecha. Puedes presentarlo sin problema a médicos, farmacéuticos u otros profesionales. Transmite seriedad y facilita la lectura.",
    related: ["pe-8", "pe-2"],
    keywords: ["profesional", "formato", "diseño"],
  },
  {
    id: "pe-13",
    section: "portal-entregables",
    question: "¿El PDF incluye datos privados del nutricionista?",
    answer:
      "No. El PDF solo muestra los datos profesionales de contacto de tu nutri (nombre, número de colegiado si lo tiene, email profesional) pero nunca datos privados como su dirección personal, teléfono particular o información interna. Lo que aparece es lo mismo que verías en su web o tarjeta de visita. Tu información como paciente es la protagonista del documento.",
    related: ["pe-8", "pe-21"],
    keywords: ["privacidad", "datos", "nutricionista", "personal"],
  },
  {
    id: "pe-14",
    section: "portal-entregables",
    question: "¿Qué datos clínicos míos aparecen resumidos en el PDF?",
    answer:
      "En la sección de datos personales se incluye un resumen clínico con tus alergias, intolerancias, patologías relevantes y medicaciones si las has registrado. También datos básicos como edad, peso actual y objetivo. Esta información es especialmente útil para llevarla al médico o a la farmacia, donde pueden necesitar conocerla rápidamente.",
    related: ["pe-2", "pe-33"],
    keywords: ["alergias", "patologías", "clínicos", "datos"],
  },
  {
    id: "pe-15",
    section: "portal-entregables",
    question: "¿El plan actual aparece completo en el PDF?",
    answer:
      "Sí. Si marcas la casilla Mi plan actual, se incluye tu dieta completa con todas las comidas, alimentos, cantidades y horarios recomendados por tu nutricionista. Aparece estructurado por días o por comidas según como lo haya diseñado tu nutri. Es el mismo contenido que ves en la sección Mi plan del portal, pero en formato imprimible.",
    related: ["pe-4", "pe-16"],
    keywords: ["plan", "dieta", "completo", "alimentos"],
  },
  {
    id: "pe-16",
    section: "portal-entregables",
    question: "¿Se incluyen las recomendaciones de mi nutricionista?",
    answer:
      "Sí, si marcas la casilla correspondiente. Aparecen todas las recomendaciones, consejos y pautas que tu nutri ha añadido a tu plan: hidratación, ejercicio, pautas de comportamiento alimentario, descansos, etc. Es útil tenerlas por escrito para consultarlas cuando lo necesites o para recordárselas a quien te apoye en casa.",
    related: ["pe-4", "pe-15"],
    keywords: ["recomendaciones", "consejos", "pautas"],
  },
  {
    id: "pe-17",
    section: "portal-entregables",
    question: "¿Puedo exportar la lista de la compra en el PDF?",
    answer:
      "Sí, si tu plan incluye una lista de la compra generada, puedes marcar esa casilla y aparecerá en el PDF. Es muy práctico para imprimirla y llevarla al supermercado en papel, sobre todo si prefieres no usar el móvil mientras haces la compra. Si tu plan actual no tiene lista de la compra, la casilla no estará disponible.",
    related: ["pe-4", "pe-15"],
    keywords: ["lista", "compra", "supermercado"],
  },
  {
    id: "pe-18",
    section: "portal-entregables",
    question: "¿Aparece mi seguimiento de las últimas semanas?",
    answer:
      "Sí, si marcas la casilla Mi seguimiento se incluyen los registros de las últimas semanas: peso, medidas, adherencia al plan, sensaciones que hayas anotado, etc. Es ideal para mostrarle a tu médico cómo va evolucionando tu proceso. Se presenta en formato tabla o resumen para que sea fácil de leer de un vistazo.",
    related: ["pe-4", "pe-14"],
    keywords: ["seguimiento", "semanas", "evolución", "registros"],
  },
  {
    id: "pe-19",
    section: "portal-entregables",
    question: "¿Puedo abrir el PDF en el móvil sin problemas?",
    answer:
      "Sí. Si generas el PDF desde el portal en tu móvil, se descarga a tu dispositivo y puedes abrirlo con cualquier lector de PDFs que tengas instalado (Adobe Acrobat, Google Drive, Apple Books, etc.). También puedes verlo directamente en el navegador. En iPhone suele abrirse en Archivos, en Android en la app de Descargas.",
    related: ["pe-20", "pe-6"],
    keywords: ["móvil", "abrir", "smartphone"],
  },
  {
    id: "pe-20",
    section: "portal-entregables",
    question: "¿Puedo compartir el PDF por WhatsApp o email?",
    answer:
      "Por supuesto. Una vez descargado, el PDF es un archivo normal que puedes adjuntar a un email, enviar por WhatsApp, subir a Google Drive o compartirlo como cualquier otro documento. En el móvil, al abrirlo, suele aparecer el botón Compartir con las opciones habituales. Es la forma más cómoda de pasarlo a un profesional.",
    related: ["pe-19", "pe-2"],
    keywords: ["compartir", "whatsapp", "email", "enviar"],
  },
  {
    id: "pe-21",
    section: "portal-entregables",
    question: "¿Quién puede generar mi PDF personal?",
    answer:
      "Solo tú. El PDF con tu información se genera desde tu portal con tu usuario y contraseña, así que nadie más puede hacerlo en tu nombre. Tu nutricionista puede generar sus propios entregables desde el panel del nutri, pero tu versión como paciente está bajo tu control exclusivo. Es una cuestión de privacidad y protección de tus datos.",
    related: ["pe-31", "pe-13"],
    keywords: ["privacidad", "quién", "generar"],
  },
  {
    id: "pe-22",
    section: "portal-entregables",
    question: "¿Cada cuánto puedo exportar mi PDF?",
    answer:
      "Las veces que quieras, sin límite. No hay restricciones de frecuencia ni número de descargas. Puedes generarlo cada vez que tu plan cambie, antes de una cita con otro profesional, o simplemente cuando te apetezca tener una copia actualizada. El portal está pensado para que lo uses con total libertad.",
    related: ["pe-35", "pe-9"],
    keywords: ["cada", "cuánto", "frecuencia", "límite"],
  },
  {
    id: "pe-23",
    section: "portal-entregables",
    question: "¿Las tildes y caracteres especiales se ven bien en el PDF?",
    answer:
      "Sí, las tildes, la letra ñ y los caracteres propios del castellano se muestran correctamente. Si ves algún símbolo raro, probablemente se trate de un problema del lector de PDFs. Abrirlo con Adobe Acrobat, Chrome o cualquier lector actualizado lo soluciona. No es un problema común, pero conviene tenerlo en cuenta.",
    related: ["pe-24", "pe-29"],
    keywords: ["tildes", "acentos", "caracteres"],
  },
  {
    id: "pe-24",
    section: "portal-entregables",
    question: "¿En qué idioma se genera el PDF?",
    answer:
      "El PDF se genera en castellano, que es el idioma del portal. Los títulos de las secciones, cabeceras y textos fijos están en castellano, y los contenidos de tu plan aparecen tal y como los ha escrito tu nutricionista. Si tu nutri ha redactado las recomendaciones en otro idioma, así aparecerán en el PDF.",
    related: ["pe-25", "pe-23"],
    keywords: ["idioma", "castellano", "lengua"],
  },
  {
    id: "pe-25",
    section: "portal-entregables",
    question: "¿Puedo traducir el PDF a otro idioma?",
    answer:
      "No, la traducción automática no está soportada dentro del portal. El PDF sale siempre en castellano. Si necesitas una versión en otro idioma, puedes usar herramientas externas como Google Translate o DeepL, o pedir a tu nutricionista que te prepare una versión específica. Para uso con profesionales en España no deberías necesitar traducirlo.",
    related: ["pe-24"],
    keywords: ["traducir", "idioma", "otro"],
  },
  {
    id: "pe-26",
    section: "portal-entregables",
    question: "¿Puedo imprimir el PDF en blanco y negro?",
    answer:
      "Sí, el diseño del PDF está pensado para que se lea bien tanto a color como en blanco y negro. En el diálogo de impresión de tu navegador o lector de PDFs, elige la opción Escala de grises o Blanco y negro. Así ahorras tinta de color y el documento sigue siendo totalmente legible. Las tablas y cabeceras se leen igual de bien.",
    related: ["pe-11", "pe-7"],
    keywords: ["imprimir", "blanco", "negro", "gris"],
  },
  {
    id: "pe-27",
    section: "portal-entregables",
    question: "¿Puedo exportar solo un día concreto de mi plan?",
    answer:
      "No, el PDF está pensado como un resumen completo de tu plan actual, no como una exportación por días. Si marcas la casilla del plan, se incluye todo. Si solo necesitas un día, puedes tomar una captura de pantalla de esa vista en el portal. Para una versión más detallada o personalizada tendrías que pedírsela a tu nutricionista.",
    related: ["pe-28", "pe-15"],
    keywords: ["un día", "parcial", "solo"],
  },
  {
    id: "pe-28",
    section: "portal-entregables",
    question: "¿Puedo personalizar más el PDF (colores, logos míos, etc.)?",
    answer:
      "La personalización es limitada. Puedes elegir qué secciones incluir, pero no puedes cambiar colores, tipografías ni añadir tu propio logo. El diseño está fijado para mantener un formato profesional y coherente. Si necesitas un documento más personalizado, puedes abrir el PDF con un editor tipo Acrobat y añadir lo que necesites.",
    related: ["pe-4", "pe-12"],
    keywords: ["personalizar", "colores", "editar"],
  },
  {
    id: "pe-29",
    section: "portal-entregables",
    question: "¿Qué hago si el PDF no se genera bien?",
    answer:
      "Lo primero, prueba a actualizar tu navegador a la última versión. Chrome, Firefox o Edge recientes funcionan mejor para generar PDFs. Si sigue sin salir bien, cierra otras pestañas, recarga la página (F5) y vuelve a intentarlo. Si el problema persiste, contacta con tu nutricionista para que te lo comunique a soporte. En general Chrome es el navegador más recomendado.",
    related: ["pe-30", "pe-32"],
    keywords: ["problema", "error", "no sale", "navegador"],
  },
  {
    id: "pe-30",
    section: "portal-entregables",
    question: "¿Los bloqueadores de pop-ups pueden impedir la descarga?",
    answer:
      "Sí, a veces. Algunos navegadores bloquean descargas automáticas si tienes un bloqueador de pop-ups o ventanas emergentes muy estricto. Si al pulsar Descargar PDF no pasa nada, revisa el icono de la barra de direcciones donde tu navegador suele avisar de contenido bloqueado. Permite la descarga para este sitio y vuelve a intentarlo.",
    related: ["pe-29", "pe-32"],
    keywords: ["bloqueador", "popup", "permiso"],
  },
  {
    id: "pe-31",
    section: "portal-entregables",
    question: "¿En qué se diferencia mi PDF del que genera mi nutricionista?",
    answer:
      "Tu nutricionista tiene un panel de entregables con más opciones avanzadas y puede preparar PDFs muy detallados con gráficas, tablas comparativas y secciones internas. Tu versión como paciente es una variante simplificada, más ligera y directa, pensada para tu uso personal. La información esencial es la misma, pero la versión del nutri puede tener más detalle técnico.",
    related: ["pe-21", "pe-1"],
    keywords: ["diferencia", "nutri", "paciente"],
  },
  {
    id: "pe-32",
    section: "portal-entregables",
    question: "¿Qué hago si no puedo descargar el PDF?",
    answer:
      "Reintenta tras unos segundos, a veces es un problema puntual de conexión. Comprueba también que tienes suficiente espacio libre en tu dispositivo, ya que aunque el archivo es pequeño un almacenamiento saturado puede impedir la descarga. Si usas el móvil, prueba desde un ordenador. Si nada funciona, avisa a tu nutricionista para que revise si hay un error.",
    related: ["pe-29", "pe-30"],
    keywords: ["no descarga", "error", "problema"],
  },
  {
    id: "pe-33",
    section: "portal-entregables",
    question: "¿Es útil llevar el PDF en caso de emergencia médica?",
    answer:
      "Sí, mucho. Si alguna vez necesitas atención médica urgente, tener un PDF con tus alergias, patologías, medicación y plan nutricional puede ser muy valioso. Puedes guardarlo en tu móvil o imprimirlo y llevarlo en la cartera. En situaciones donde no puedas comunicarte, los profesionales podrán consultar rápidamente información clave sobre ti.",
    related: ["pe-14", "pe-2"],
    keywords: ["emergencia", "médica", "urgencia"],
  },
  {
    id: "pe-34",
    section: "portal-entregables",
    question: "¿Qué nombre tiene el fichero cuando se descarga?",
    answer:
      "El fichero se nombra automáticamente con tu nombre y la fecha de generación, algo parecido a resumen-nutricional-tunombre-21-04-2026.pdf. Así es fácil identificar distintas versiones si descargas varias a lo largo del tiempo. Puedes renombrarlo después si prefieres otro nombre. La fecha en el nombre te ayuda a saber cuál es la versión más reciente.",
    related: ["pe-9", "pe-22"],
    keywords: ["nombre", "fichero", "archivo"],
  },
  {
    id: "pe-35",
    section: "portal-entregables",
    question: "¿Recibo el PDF por email automáticamente y caduca con el tiempo?",
    answer:
      "No se envía por email automáticamente, siempre lo generas tú cuando lo necesitas desde tu portal. Y tampoco caduca: una vez descargado el PDF es un archivo estático que seguirá siendo válido mientras lo guardes, aunque su contenido refleja un momento concreto. Si tu plan cambia, genera uno nuevo para tener la versión actualizada; el anterior seguirá abriéndose sin problema.",
    related: ["pe-22", "pe-9"],
    keywords: ["email", "caducidad", "automático"],
  },
];
