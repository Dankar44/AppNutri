import type { HelpEntry } from "../types";

export const DIETA_COMPARTIR_ENTRIES: HelpEntry[] = [
  {
    id: "dc-1",
    section: "dieta-compartir",
    question: "¿Qué significa compartir un plan de dieta?",
    answer:
      "Compartir un plan consiste en generar un enlace público único (con forma /compartido/[token]) que el paciente puede abrir desde cualquier navegador sin tener cuenta en Annonia. Al entrar, ve el plan completo en modo lectura: comidas, horarios, ingredientes, cantidades, recetas asociadas y notas. Es una alternativa rápida al portal del paciente cuando no quieres gestionar credenciales ni registros.",
    related: ["dc-2", "dc-13", "dc-14"],
    keywords: ["compartir", "enlace", "plan", "paciente", "público"],
  },
  {
    id: "dc-2",
    section: "dieta-compartir",
    question: "¿Cómo genero el enlace para compartir un plan?",
    answer:
      "Abre el plan desde /dietas, entra en la ficha del plan y pulsa la pestaña Compartir (/dietas/[id]/compartir). Haz clic en el botón Generar enlace. El sistema creará un token aleatorio y mostrará la URL completa lista para copiar o enviar. La generación es instantánea y no requiere pasos adicionales.",
    related: ["dc-1", "dc-3", "dc-16"],
    keywords: ["generar", "crear", "enlace", "botón", "token"],
  },
  {
    id: "dc-3",
    section: "dieta-compartir",
    question: "¿Cómo copio el enlace al portapapeles?",
    answer:
      "Junto al enlace generado verás un botón con el icono de copiar. Al pulsarlo, la URL completa se copia al portapapeles del sistema y aparece una notificación de confirmación. Luego puedes pegarlo (Ctrl+V o Cmd+V) en cualquier aplicación: mensajería, correo, notas, etc.",
    related: ["dc-2", "dc-4", "dc-5"],
    keywords: ["copiar", "portapapeles", "pegar", "URL"],
  },
  {
    id: "dc-4",
    section: "dieta-compartir",
    question: "¿Cómo envío el enlace por WhatsApp?",
    answer:
      "En la pantalla de compartir hay un botón directo Enviar por WhatsApp. Al pulsarlo se abre WhatsApp Web o la app instalada con un mensaje prerellenado que incluye un saludo y el enlace al plan. Solo tienes que seleccionar el contacto del paciente y pulsar enviar. Si no tienes WhatsApp abierto, te pedirá iniciar sesión.",
    related: ["dc-3", "dc-5", "dc-14"],
    keywords: ["whatsapp", "enviar", "mensaje", "contacto"],
  },
  {
    id: "dc-5",
    section: "dieta-compartir",
    question: "¿Cómo envío el enlace por email?",
    answer:
      "El botón Enviar por email abre el cliente de correo predeterminado (Mail, Outlook, Gmail web si está configurado como handler) con un borrador ya preparado: asunto indicativo y cuerpo con el enlace. Solo tienes que añadir la dirección del paciente y pulsar enviar. Annonia no envía el correo por ti, delega en tu cliente para preservar tu firma y dirección de remitente.",
    related: ["dc-3", "dc-4", "dc-11"],
    keywords: ["email", "correo", "enviar", "mailto"],
  },
  {
    id: "dc-6",
    section: "dieta-compartir",
    question: "¿Qué ve el paciente cuando abre el enlace?",
    answer:
      "El paciente accede a una vista limpia y optimizada para lectura: cabecera con tu nombre o clínica, título del plan, rango de fechas, lista de comidas organizadas por día con ingredientes y cantidades, notas que hayas añadido y, si están habilitadas, las recetas y lista de la compra. No ve datos de otros pacientes ni opciones de edición.",
    related: ["dc-7", "dc-8", "dc-22"],
    keywords: ["vista", "paciente", "ver", "lectura"],
  },
  {
    id: "dc-7",
    section: "dieta-compartir",
    question: "¿El paciente necesita tener cuenta para abrir el enlace?",
    answer:
      "No. El enlace público está diseñado precisamente para evitar el registro. Cualquiera con el token válido puede ver el plan desde el navegador. Esto simplifica la experiencia para pacientes que no quieren instalar nada ni gestionar contraseñas. Si prefieres un acceso con cuenta y funciones adicionales, usa el portal del paciente.",
    related: ["dc-6", "dc-13", "dc-14"],
    keywords: ["cuenta", "registro", "sin cuenta", "acceso"],
  },
  {
    id: "dc-8",
    section: "dieta-compartir",
    question: "¿El paciente puede editar el plan desde el enlace?",
    answer:
      "No. La vista compartida es estrictamente de solo lectura. El paciente no puede modificar comidas, cantidades, horarios ni notas. Tampoco puede marcar comidas como hechas, registrar peso ni enviarte mensajes. Para interacciones bidireccionales (seguimiento, mensajes, check-in diario) el paciente debe usar el portal con cuenta.",
    related: ["dc-6", "dc-13", "dc-27"],
    keywords: ["editar", "solo lectura", "modificar", "permisos"],
  },
  {
    id: "dc-9",
    section: "dieta-compartir",
    question: "¿Puedo desactivar el enlace una vez generado?",
    answer:
      "Sí. En la misma pantalla de compartir hay un interruptor Activo/Inactivo. Al ponerlo en inactivo, el enlace deja de ser válido de inmediato: quien intente abrirlo verá una página indicando que el plan ya no está disponible. Puedes volver a activarlo cuando quieras sin regenerar el token, manteniendo la misma URL.",
    related: ["dc-10", "dc-17", "dc-20"],
    keywords: ["desactivar", "apagar", "deshabilitar", "interruptor"],
  },
  {
    id: "dc-10",
    section: "dieta-compartir",
    question: "¿Qué hace el botón Regenerar enlace?",
    answer:
      "Regenerar crea un token nuevo y desecha el anterior. Es la opción indicada si sospechas que la URL se ha filtrado o quieres invalidarla de forma definitiva. Tras regenerar, el enlace antiguo deja de funcionar para siempre y tendrás que compartir la nueva URL con el paciente. La acción pide confirmación para evitar accidentes.",
    related: ["dc-9", "dc-15", "dc-17"],
    keywords: ["regenerar", "nuevo token", "invalidar", "rotar"],
  },
  {
    id: "dc-11",
    section: "dieta-compartir",
    question: "¿Cómo se protege la privacidad del plan compartido?",
    answer:
      "El token del enlace es aleatorio, largo e impredecible, así que no se puede adivinar. No aparece indexado en buscadores gracias a la cabecera noindex. Solo se muestra la información del plan, sin datos personales sensibles del paciente salvo los que tú hayas escrito en el propio plan. Además puedes desactivarlo o regenerarlo en cualquier momento.",
    related: ["dc-16", "dc-17", "dc-9"],
    keywords: ["privacidad", "seguridad", "protección", "datos"],
  },
  {
    id: "dc-12",
    section: "dieta-compartir",
    question: "¿Veo estadísticas de cuántas veces se ha abierto el enlace?",
    answer:
      "Sí. En la pantalla de compartir aparece un contador con el número total de aperturas y la fecha y hora de la última visita. Esto te permite saber si el paciente ha abierto realmente el plan. Las estadísticas son anónimas: no guardamos IP ni datos personales, solo el recuento de accesos exitosos al token.",
    related: ["dc-19", "dc-20", "dc-6"],
    keywords: ["estadísticas", "aperturas", "visitas", "contador"],
  },
  {
    id: "dc-13",
    section: "dieta-compartir",
    question: "¿En qué se diferencia compartir del portal del paciente?",
    answer:
      "Compartir genera un enlace público sin registro, de solo lectura, y sirve para que el paciente consulte el plan. El portal del paciente, en cambio, requiere cuenta y ofrece seguimiento diario, mensajería con el nutricionista, histórico de planes, gráficas de progreso y recordatorios. Compartir es más rápido de poner en marcha; el portal es más completo.",
    related: ["dc-7", "dc-14", "dc-27"],
    keywords: ["portal", "diferencia", "comparación", "funciones"],
  },
  {
    id: "dc-14",
    section: "dieta-compartir",
    question: "¿Cuándo conviene usar compartir en lugar del portal?",
    answer:
      "Usa compartir cuando el paciente solo necesita consultar el plan, cuando es una colaboración puntual, cuando el paciente es mayor o poco técnico y no quiere instalar apps, o cuando quieres enviar un plan de prueba rápido antes de decidir si se incorpora al portal. Si el paciente va a tener seguimiento continuo con registro diario, activa el portal.",
    related: ["dc-13", "dc-7", "dc-27"],
    keywords: ["cuándo", "usar", "elegir", "casos"],
  },
  {
    id: "dc-15",
    section: "dieta-compartir",
    question: "¿El enlace caduca con el tiempo?",
    answer:
      "No hay caducidad automática por fecha: el enlace permanece activo mientras tú lo mantengas activado. Sin embargo, caduca de forma inmediata en dos casos: si lo desactivas con el interruptor o si pulsas Regenerar (que invalida el token anterior). No hay expiración programada por días; el control es manual y siempre tuyo.",
    related: ["dc-9", "dc-10", "dc-17"],
    keywords: ["caducidad", "expiración", "validez", "duración"],
  },
  {
    id: "dc-16",
    section: "dieta-compartir",
    question: "¿Cómo son los tokens de seguridad del enlace?",
    answer:
      "Cada enlace usa un token aleatorio criptográficamente seguro, generado en el servidor con una longitud suficiente para que sea prácticamente imposible adivinarlo por fuerza bruta. El token es único por plan y por generación: si regeneras, el anterior queda invalidado en la base de datos y ya no se puede reutilizar. No existen tokens predecibles ni secuenciales.",
    related: ["dc-11", "dc-10", "dc-17"],
    keywords: ["token", "seguridad", "aleatorio", "criptográfico"],
  },
  {
    id: "dc-17",
    section: "dieta-compartir",
    question: "¿Qué hago si el enlace se filtra a personas no deseadas?",
    answer:
      "Lo primero es pulsar Regenerar enlace: el token antiguo queda inutilizado de inmediato y cualquiera que lo tuviera dejará de poder abrir el plan. Después, comparte la nueva URL solo con el paciente y por un canal privado (WhatsApp directo o email personal). Si prefieres cerrarlo sin volver a emitirlo, simplemente desactiva el enlace.",
    related: ["dc-10", "dc-9", "dc-11"],
    keywords: ["filtración", "filtrado", "fuga", "revocar"],
  },
  {
    id: "dc-18",
    section: "dieta-compartir",
    question: "Si actualizo el plan tras compartir, ¿el paciente ve los cambios?",
    answer:
      "Sí. El enlace apunta siempre al contenido actual del plan en la base de datos. Cualquier modificación que hagas (añadir una comida, cambiar una cantidad, corregir una nota) se reflejará automáticamente cuando el paciente recargue la página. No hay versión congelada: lo que ves tú en edición es lo que verá el paciente tras refrescar.",
    related: ["dc-19", "dc-28", "dc-6"],
    keywords: ["actualizar", "cambios", "editar", "sincronizar"],
  },
  {
    id: "dc-19",
    section: "dieta-compartir",
    question: "¿Los cambios se ven en tiempo real o hay que refrescar?",
    answer:
      "Actualmente el paciente necesita refrescar la página para ver los cambios. No hay conexión en vivo tipo websocket en la vista pública para mantenerla ligera y rápida. Si realizas una modificación importante después de compartir, avísale por el mismo canal (WhatsApp o email) para que recargue. En el portal con cuenta sí hay refresco automático en algunas pantallas.",
    related: ["dc-18", "dc-13", "dc-28"],
    keywords: ["tiempo real", "refrescar", "recargar", "sincronización"],
  },
  {
    id: "dc-20",
    section: "dieta-compartir",
    question: "¿Puedo ver qué planes tienen un enlace activo?",
    answer:
      "Sí. En el listado de dietas (/dietas) los planes con enlace activo muestran un icono o etiqueta Compartido junto al título. Puedes filtrar por ese estado para localizar rápidamente qué planes están expuestos. Entrando en cada uno puedes abrir la pestaña Compartir y gestionar individualmente la activación, regeneración y estadísticas.",
    related: ["dc-9", "dc-12", "dc-2"],
    keywords: ["listado", "ver", "activos", "filtro"],
  },
  {
    id: "dc-21",
    section: "dieta-compartir",
    question: "¿El paciente puede reimprimir el plan desde el enlace?",
    answer:
      "Sí. La vista compartida incluye un botón Imprimir que abre el diálogo nativo del navegador con un diseño limpio pensado para papel: sin menús ni controles, solo el contenido del plan. El paciente puede elegir imprimir en papel o guardar como PDF desde el propio cuadro de diálogo del sistema. No necesita permisos especiales.",
    related: ["dc-28", "dc-6", "dc-24"],
    keywords: ["imprimir", "reimprimir", "papel", "PDF"],
  },
  {
    id: "dc-22",
    section: "dieta-compartir",
    question: "¿La lista de la compra aparece en la vista compartida?",
    answer:
      "Sí, si el plan tiene lista de la compra generada. Aparece como una sección al final de la vista, con los ingredientes agrupados por categoría y cantidades totales para el periodo del plan. El paciente puede marcarla visualmente o imprimirla junto con el resto. Si no quieres que aparezca, elimínala del plan antes de compartir.",
    related: ["dc-6", "dc-21", "dc-28"],
    keywords: ["lista compra", "compra", "ingredientes", "supermercado"],
  },
  {
    id: "dc-23",
    section: "dieta-compartir",
    question: "¿Aparece mi logo o el de mi clínica en la cabecera del enlace?",
    answer:
      "Sí. Si has subido un logotipo en la configuración del perfil o de la clínica, aparece en la cabecera de la vista pública junto a tu nombre. Esto refuerza la identidad profesional y da sensación de pertenencia al paciente. Si no has subido logo, se muestra solo tu nombre o el de la clínica en formato texto.",
    related: ["dc-6", "dc-24", "dc-25"],
    keywords: ["logo", "cabecera", "branding", "clínica"],
  },
  {
    id: "dc-24",
    section: "dieta-compartir",
    question: "¿La vista compartida funciona bien en móvil?",
    answer:
      "Sí. La vista está diseñada con un enfoque mobile first: tipografía grande, comidas agrupadas por días que se pueden plegar, botones de imprimir y scroll suave. En pantallas pequeñas la lista de la compra y las recetas se reorganizan para ocupar todo el ancho. Funciona igual en iOS Safari, Chrome Android y navegadores de escritorio.",
    related: ["dc-6", "dc-21", "dc-22"],
    keywords: ["móvil", "responsive", "teléfono", "mobile"],
  },
  {
    id: "dc-25",
    section: "dieta-compartir",
    question: "¿Puedo traducir la vista compartida a otros idiomas?",
    answer:
      "De momento no. La vista pública está disponible únicamente en castellano. El texto que tú hayas escrito en el plan (nombres de comidas, notas, ingredientes) aparece tal cual lo hayas introducido, pero la interfaz (etiquetas, botones, cabeceras) solo tiene versión en castellano. Si necesitas otros idiomas, comunícanoslo para priorizarlo en el roadmap.",
    related: ["dc-6", "dc-23", "dc-24"],
    keywords: ["traducir", "idiomas", "castellano", "localización"],
  },
  {
    id: "dc-26",
    section: "dieta-compartir",
    question: "¿Puedo compartir el plan de varios pacientes en un solo enlace?",
    answer:
      "No, esa función no está soportada. Cada enlace corresponde a un único plan de un único paciente. Si quieres que varias personas vean el mismo contenido (por ejemplo, una familia con una dieta común), genera el enlace del plan y envíalo a cada una por separado. No existe el concepto de plan multipersona compartido en una sola URL.",
    related: ["dc-2", "dc-4", "dc-5"],
    keywords: ["varios", "múltiples", "familiar", "compartido"],
  },
  {
    id: "dc-27",
    section: "dieta-compartir",
    question: "¿El paciente puede dejar comentarios desde el enlace compartido?",
    answer:
      "No. La vista pública no admite ningún tipo de interacción: ni comentarios, ni reacciones, ni mensajes. Si el paciente quiere escribirte (dudas, comentarios sobre el plan, fotos de comidas), debe hacerlo por el portal del paciente con cuenta, que sí incluye mensajería bidireccional integrada con tu panel.",
    related: ["dc-8", "dc-13", "dc-14"],
    keywords: ["comentarios", "mensajes", "feedback", "interactuar"],
  },
  {
    id: "dc-28",
    section: "dieta-compartir",
    question: "¿Qué diferencias hay entre compartir y exportar a PDF?",
    answer:
      "El PDF es un archivo estático: captura el plan en un instante concreto y no cambia aunque edites después. Se envía como adjunto y se guarda en el dispositivo del paciente. El enlace compartido es dinámico: siempre muestra la versión actual del plan y puedes desactivarlo en remoto. Usa PDF para entregas formales o archivo; usa enlace para planes que van a evolucionar.",
    related: ["dc-18", "dc-21", "dc-19"],
    keywords: ["PDF", "exportar", "estático", "dinámico"],
  },
  {
    id: "dc-29",
    section: "dieta-compartir",
    question: "¿El enlace incluye las recetas asociadas al plan?",
    answer:
      "Sí. Si has vinculado recetas a comidas del plan, aparecen en la vista pública como secciones expandibles con ingredientes, pasos de preparación y tiempos. El paciente puede consultarlas directamente sin salir del enlace. Si una receta es privada de tu catálogo, también se muestra: el enlace tiene acceso de lectura a todo el contenido del plan.",
    related: ["dc-6", "dc-22", "dc-8"],
    keywords: ["recetas", "preparación", "pasos", "cocina"],
  },
  {
    id: "dc-30",
    section: "dieta-compartir",
    question: "¿Qué ocurre si el paciente pierde el enlace?",
    answer:
      "No hay problema: vuelve a la pestaña Compartir del plan, copia la URL y reenvíasela por el canal que prefiera. Mientras el enlace siga activo y no lo hayas regenerado, la misma URL sigue siendo válida y llevará al mismo plan. Si prefieres rotar el token por precaución, pulsa Regenerar y envía la nueva dirección.",
    related: ["dc-3", "dc-10", "dc-17"],
    keywords: ["perder", "perdido", "reenviar", "recuperar"],
  },
  {
    id: "dc-31",
    section: "dieta-compartir",
    question: "¿Puedo ver la hora exacta de la última apertura?",
    answer:
      "Sí. Además del contador total, en la sección de estadísticas aparece la fecha y hora de la última vez que se abrió el enlace, en tu zona horaria. Esto sirve para confirmar que el paciente ha recibido y consultado el plan, o para detectar accesos sospechosos fuera de horas habituales si sospechas que el enlace se ha filtrado.",
    related: ["dc-12", "dc-17", "dc-20"],
    keywords: ["hora", "última", "apertura", "fecha"],
  },
  {
    id: "dc-32",
    section: "dieta-compartir",
    question: "¿Se envía alguna notificación al generar o regenerar el enlace?",
    answer:
      "No se envía ninguna notificación automática al paciente: la generación y la regeneración son acciones internas tuyas. Serás tú quien comparta manualmente la URL por WhatsApp, email u otro canal. Esto evita mensajes no solicitados y te da control total sobre cuándo y cómo informar al paciente del cambio.",
    related: ["dc-2", "dc-10", "dc-5"],
    keywords: ["notificación", "aviso", "alerta", "envío"],
  },
  {
    id: "dc-33",
    section: "dieta-compartir",
    question: "¿Puedo personalizar el mensaje predefinido de WhatsApp o email?",
    answer:
      "En la configuración del perfil puedes ajustar una plantilla corta que se inserta como saludo al enviar por WhatsApp o email desde el botón de compartir. Si no la configuras, se usa un texto genérico en castellano con tu nombre y el enlace. Siempre puedes editar el mensaje antes de enviarlo desde la propia app de WhatsApp o desde tu cliente de correo.",
    related: ["dc-4", "dc-5", "dc-23"],
    keywords: ["personalizar", "plantilla", "mensaje", "texto"],
  },
  {
    id: "dc-34",
    section: "dieta-compartir",
    question: "¿Qué pasa si elimino el plan que estaba compartido?",
    answer:
      "Al eliminar el plan se elimina también el enlace asociado: el token deja de ser válido y quien intente abrirlo verá una página indicando que el plan ya no está disponible. No se puede restaurar el mismo enlace al recrear un plan nuevo; se generaría un token distinto. Por eso conviene desactivar en lugar de eliminar si prevés volver a usarlo.",
    related: ["dc-9", "dc-10", "dc-20"],
    keywords: ["eliminar", "borrar", "plan", "consecuencia"],
  },
  {
    id: "dc-35",
    section: "dieta-compartir",
    question: "¿Hay un límite de enlaces activos o de aperturas por enlace?",
    answer:
      "No hay límite en el número de enlaces activos: puedes tener tantos planes compartidos como pacientes tengas. Tampoco hay límite de aperturas por enlace: el paciente puede abrirlo las veces que quiera sin coste adicional ni bloqueo. Si tu plan de suscripción incluye restricciones de pacientes, se aplican a los pacientes, no a los enlaces compartidos por separado.",
    related: ["dc-12", "dc-20", "dc-15"],
    keywords: ["límite", "cuota", "máximo", "aperturas"],
  },
];
