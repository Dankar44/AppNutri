import type { HelpEntry } from "../types";

export const AJUSTES_SUSCRIPCION_ENTRIES: HelpEntry[] = [
  {
    id: "ajs-1",
    section: "ajustes-suscripcion",
    question: "¿Qué es la sección Suscripción de Ajustes?",
    answer:
      "La sección Suscripción de Ajustes es el área donde puedes consultar el estado de tu plan contratado en AppNutrición. Muestra de un vistazo qué plan tienes (BÁSICO, PROFESIONAL, GRATIS o TRIAL), en qué estado se encuentra (ACTIVA, CANCELADA o VENCIDA) y las fechas que lo delimitan. Toda la información se presenta en un componente llamado `<SuscripcionCard>` que agrupa los datos relevantes de la cuenta. Desde aquí entiendes qué funcionalidades tienes disponibles y hasta cuándo.",
    related: ["ajs-2", "ajs-3", "ajs-8"],
    keywords: ["suscripción", "ajustes", "plan", "sección"],
  },
  {
    id: "ajs-2",
    section: "ajustes-suscripcion",
    question: "¿Cómo veo mi plan actual?",
    answer:
      "Para ver tu plan actual entra en Ajustes y abre la pestaña Suscripción desde la navegación lateral de la sección. Verás una tarjeta `<SuscripcionCard>` con el nombre del plan (BÁSICO, PROFESIONAL, GRATIS o TRIAL) destacado en la parte superior. Debajo encontrarás el estado, la fecha de inicio y la fecha de fin cuando corresponda. Es la forma más rápida de confirmar qué servicio tienes contratado sin esperar a un correo ni una factura.",
    related: ["ajs-1", "ajs-3", "ajs-4"],
    keywords: ["plan", "actual", "ver", "consultar"],
  },
  {
    id: "ajs-3",
    section: "ajustes-suscripcion",
    question: "¿Qué estados puede tener mi suscripción?",
    answer:
      "Una suscripción en AppNutrición puede aparecer en tres estados principales: ACTIVA, CANCELADA o VENCIDA. ACTIVA significa que el plan está en vigor y todas sus funcionalidades funcionan con normalidad hasta la fecha de fin. CANCELADA indica que has solicitado no renovar, pero el servicio sigue disponible hasta agotar el período ya pagado. VENCIDA se muestra cuando la fecha de fin ya ha pasado y no ha habido renovación, por lo que la cuenta queda limitada.",
    related: ["ajs-1", "ajs-4", "ajs-14"],
    keywords: ["estados", "activa", "cancelada", "vencida"],
  },
  {
    id: "ajs-4",
    section: "ajustes-suscripcion",
    question: "¿Qué significan la fecha de inicio y la fecha de fin?",
    answer:
      "La fecha de inicio es el día en que se activó tu plan actual y marca el comienzo del período que tienes contratado. La fecha de fin es el día en que ese período expira y, si la suscripción está ACTIVA, también es el día en que se renovaría automáticamente. Si tu plan es GRATIS o TRIAL, la fecha de fin marca cuándo terminará el acceso gratuito. En planes sin fecha de fin definida (por ejemplo, usuarios antiguos), el campo puede aparecer vacío.",
    related: ["ajs-3", "ajs-5", "ajs-15"],
    keywords: ["fecha", "inicio", "fin", "período"],
  },
  {
    id: "ajs-5",
    section: "ajustes-suscripcion",
    question: "¿En qué consiste el período de prueba de 14 días?",
    answer:
      "El período de prueba es un TRIAL de 14 días gratuito que se activa al registrarte en AppNutrición. Durante esos 14 días tienes acceso completo a todas las funcionalidades de la plataforma, incluyendo la IA para generar dietas, como si tuvieras un plan Profesional. El objetivo es que puedas probar el producto sin compromiso antes de decidir qué plan contratar. Al terminar, la cuenta pasa al estado que corresponda en función de si has contratado un plan de pago o no.",
    related: ["ajs-1", "ajs-6", "ajs-24"],
    keywords: ["trial", "prueba", "14 días", "gratuito"],
  },
  {
    id: "ajs-6",
    section: "ajustes-suscripcion",
    question: "¿Qué incluye el plan Básico?",
    answer:
      "El plan Básico cuesta 9.99€ al mes e incluye hasta 25 pacientes en cartera, dietas y recetas ilimitadas y acceso completo al portal del paciente. También tienes disponible la agenda, las mediciones, el seguimiento diario y todas las funciones de gestión de consulta. Lo que no incluye es la IA para generar dietas automáticamente, que está reservada al plan Profesional. Es el plan recomendado para nutricionistas que empiezan o con una cartera de tamaño moderado.",
    related: ["ajs-7", "ajs-9", "ajs-23"],
    keywords: ["básico", "plan", "9.99", "25 pacientes"],
  },
  {
    id: "ajs-7",
    section: "ajustes-suscripcion",
    question: "¿Qué incluye el plan Profesional?",
    answer:
      "El plan Profesional cuesta 11.99€ al mes e incluye pacientes ilimitados, de modo que no hay tope en tu cartera. Incorpora todo lo del plan Básico y añade la IA para generar dietas automáticamente a partir de los datos del paciente, la exportación de informes en PDF y soporte prioritario en las consultas que envíes al equipo de AppNutrición. Está pensado para nutricionistas con volumen medio o alto que quieren ahorrar tiempo en la creación de planes. La diferencia real con el Básico es el acceso a la IA y la atención preferente.",
    related: ["ajs-6", "ajs-9", "ajs-23"],
    keywords: ["profesional", "plan", "11.99", "ilimitados"],
  },
  {
    id: "ajs-8",
    section: "ajustes-suscripcion",
    question: "¿Qué es el componente `<SuscripcionCard>`?",
    answer:
      "`<SuscripcionCard>` es el componente visual que renderiza la información de tu suscripción dentro de la sección Suscripción de Ajustes. Agrupa en una tarjeta el nombre del plan, el estado, la fecha de inicio y la fecha de fin de manera ordenada y legible. Está pensado para mostrar de un vistazo el resumen de la cuenta sin que tengas que navegar por varios apartados. Puede incluir, además, enlaces de contacto para cambiar de plan o cancelar cuando corresponda.",
    related: ["ajs-1", "ajs-10", "ajs-11"],
    keywords: ["suscripcioncard", "componente", "tarjeta", "visual"],
  },
  {
    id: "ajs-9",
    section: "ajustes-suscripcion",
    question: "¿La IA está disponible en el plan Básico?",
    answer:
      "No, la IA para generar dietas no está disponible en el plan Básico. Esta funcionalidad está reservada al plan Profesional (11.99€/mes) y también se puede probar durante el TRIAL inicial de 14 días. Si tienes el plan Básico e intentas usar la IA, la plataforma te mostrará un aviso invitándote a hacer upgrade a Profesional. Es una de las diferencias principales entre ambos planes y suele ser el motivo más común para subir al superior.",
    related: ["ajs-6", "ajs-7", "ajs-11"],
    keywords: ["ia", "básico", "no disponible", "diferencia"],
  },
  {
    id: "ajs-10",
    section: "ajustes-suscripcion",
    question: "¿Cómo cambio de plan?",
    answer:
      "Por el momento, el cambio de plan se gestiona de forma manual a través de soporte. Para hacerlo, contacta con el equipo de AppNutrición indicando tu usuario y el plan al que quieres moverte (Básico o Profesional). El equipo hará el cambio en tu cuenta y te confirmará la fecha a partir de la cual el nuevo plan está activo. Próximamente se habilitará un flujo de autogestión directamente desde la sección Suscripción.",
    related: ["ajs-11", "ajs-12", "ajs-13"],
    keywords: ["cambiar", "plan", "soporte", "manual"],
  },
  {
    id: "ajs-11",
    section: "ajustes-suscripcion",
    question: "¿Qué pasa si hago downgrade con más pacientes de los permitidos?",
    answer:
      "Si bajas del plan Profesional al Básico y tienes más de 25 pacientes activos, los pacientes existentes no se borran. Sin embargo, no podrás dar de alta pacientes nuevos hasta reducir tu cartera por debajo del límite de 25. Las fichas, dietas y datos de los pacientes que superan el tope siguen accesibles para no romper tu trabajo, pero el sistema bloqueará la creación de nuevos hasta regularizar la situación. Es importante tenerlo en cuenta antes de solicitar el cambio.",
    related: ["ajs-10", "ajs-12", "ajs-6"],
    keywords: ["downgrade", "bajar", "pacientes", "límite"],
  },
  {
    id: "ajs-12",
    section: "ajustes-suscripcion",
    question: "¿El upgrade de plan es inmediato?",
    answer:
      "Sí, cuando haces upgrade del plan Básico al Profesional el cambio es inmediato una vez que el equipo de soporte lo aplica en tu cuenta. A partir de ese momento tienes acceso a pacientes ilimitados, a la IA para generar dietas y al resto de ventajas del Profesional. No necesitas esperar al siguiente ciclo de facturación ni reiniciar sesión. La diferencia de precio se prorratea o ajusta según el período restante, algo que el soporte te confirmará al hacer el cambio.",
    related: ["ajs-10", "ajs-11", "ajs-7"],
    keywords: ["upgrade", "subir", "inmediato", "profesional"],
  },
  {
    id: "ajs-13",
    section: "ajustes-suscripcion",
    question: "¿Cómo cancelo mi suscripción?",
    answer:
      "La cancelación de la suscripción también se gestiona por ahora a través de soporte. Desde la sección Suscripción verás un enlace para contactar con el equipo y solicitar la cancelación. Tendrás que indicar tu usuario y, opcionalmente, el motivo por el que cancelas para ayudarnos a mejorar el producto. Una vez procesada, tu suscripción pasará al estado CANCELADA manteniendo el acceso hasta la fecha de fin del período ya pagado.",
    related: ["ajs-14", "ajs-17", "ajs-22"],
    keywords: ["cancelar", "suscripción", "soporte", "baja"],
  },
  {
    id: "ajs-14",
    section: "ajustes-suscripcion",
    question: "¿Qué pasa cuando cancelo la suscripción?",
    answer:
      "Al cancelar, tu suscripción pasa al estado CANCELADA pero sigues teniendo acceso completo a la plataforma hasta la fecha de fin del período que ya habías pagado. Durante ese tiempo puedes seguir trabajando con total normalidad. Cuando llega la fecha de fin, la cuenta no se renueva y pasa a estado VENCIDA, quedando en modo solo lectura: podrás consultar la información de tus pacientes, dietas e histórico, pero no crear ni modificar nada. Los datos no se borran para que puedas recuperarlos si vuelves a contratar.",
    related: ["ajs-13", "ajs-3", "ajs-22"],
    keywords: ["cancelar", "efecto", "solo lectura", "acceso"],
  },
  {
    id: "ajs-15",
    section: "ajustes-suscripcion",
    question: "¿La renovación es automática?",
    answer:
      "Sí, por defecto todas las suscripciones de pago se renuevan automáticamente en la fecha de fin del período actual. Esto significa que si tienes un plan Básico o Profesional, se renueva cada mes sin que tengas que hacer nada manualmente. El objetivo es que no pierdas acceso al servicio por un olvido. Si quieres desactivar la renovación automática o cancelar directamente la suscripción, tienes que solicitarlo a través de soporte.",
    related: ["ajs-16", "ajs-13", "ajs-14"],
    keywords: ["renovación", "automática", "mensual", "por defecto"],
  },
  {
    id: "ajs-16",
    section: "ajustes-suscripcion",
    question: "¿Cómo desactivo la renovación automática?",
    answer:
      "La desactivación de la renovación automática se hace a través de soporte, del mismo modo que la cancelación. Al contactar, puedes pedir específicamente que se desactive la renovación sin cancelar de inmediato, de forma que sigas usando el servicio hasta la fecha de fin del período actual. Llegada esa fecha, la cuenta no se renovará y pasará al estado VENCIDA. Próximamente se habilitará una opción directa en la sección Suscripción para autogestionar esta preferencia.",
    related: ["ajs-15", "ajs-13", "ajs-14"],
    keywords: ["desactivar", "renovación", "automática", "contacto"],
  },
  {
    id: "ajs-17",
    section: "ajustes-suscripcion",
    question: "¿Cómo cambio la tarjeta con la que pago?",
    answer:
      "Actualmente, el cambio de tarjeta o método de pago no está integrado como autoservicio en la plataforma. Para modificarlo, contacta con soporte indicando que quieres actualizar tus datos de pago. El equipo te guiará con el procedimiento y, si es necesario, te enviará un enlace seguro para introducir la nueva tarjeta. La integración directa con pasarela de pagos y gestión de métodos es una mejora prevista en el roadmap.",
    related: ["ajs-18", "ajs-10", "ajs-13"],
    keywords: ["tarjeta", "pago", "método", "cambiar"],
  },
  {
    id: "ajs-18",
    section: "ajustes-suscripcion",
    question: "¿Dónde veo mis facturas?",
    answer:
      "La visualización y descarga de facturas desde la plataforma no está integrada todavía. Para obtener una factura concreta tienes que solicitarla al equipo de soporte, indicando el período y los datos de facturación que necesitas. Te la enviaremos en PDF con todos los requisitos legales incluyendo IVA. Disponer de un apartado de facturas autogestionable dentro de la sección Suscripción es una de las mejoras previstas a corto plazo.",
    related: ["ajs-17", "ajs-25", "ajs-10"],
    keywords: ["facturas", "factura", "pdf", "soporte"],
  },
  {
    id: "ajs-19",
    section: "ajustes-suscripcion",
    question: "¿Hay descuentos o promociones disponibles?",
    answer:
      "Puntualmente pueden existir descuentos o promociones, especialmente en campañas de lanzamiento o para nutricionistas que vienen de colegios profesionales. Estos códigos se aplican siempre a través del equipo de soporte, que los introduce en tu cuenta tras verificar que cumples las condiciones. No hay un campo público para canjear cupones dentro de la sección Suscripción. Si has recibido un código, contacta con soporte para que lo activen en tu plan.",
    related: ["ajs-20", "ajs-10", "ajs-24"],
    keywords: ["descuentos", "promociones", "código", "cupón"],
  },
  {
    id: "ajs-20",
    section: "ajustes-suscripcion",
    question: "¿Existe un plan familiar, de equipo o para consultas con varios nutricionistas?",
    answer:
      "De momento, AppNutrición no ofrece un plan familiar, de equipo o multiusuario. Cada nutricionista contrata su propia suscripción individual con su cartera de pacientes asociada. Si trabajáis varios profesionales en la misma consulta, cada uno debe tener su cuenta y su plan. Planes compartidos o de equipo con gestión centralizada de pacientes están siendo valorados para futuras versiones de la plataforma.",
    related: ["ajs-21", "ajs-7", "ajs-24"],
    keywords: ["equipo", "familiar", "grupo", "multiusuario"],
  },
  {
    id: "ajs-21",
    section: "ajustes-suscripcion",
    question: "¿Se pueden compartir una cuenta entre varios profesionales del mismo centro?",
    answer:
      "No está permitido compartir una misma cuenta entre varios nutricionistas, aunque trabajéis en el mismo centro. Cada cuenta está vinculada a un único profesional y sus pacientes, y mezclar carteras puede generar problemas de trazabilidad y de cumplimiento con la normativa de protección de datos. Lo correcto es que cada profesional tenga su suscripción individual. Si necesitáis una solución para varios profesionales, contactad con soporte para valorar alternativas.",
    related: ["ajs-20", "ajs-10", "ajs-24"],
    keywords: ["compartir", "cuenta", "profesional", "centro"],
  },
  {
    id: "ajs-22",
    section: "ajustes-suscripcion",
    question: "¿Hacen devoluciones del dinero pagado?",
    answer:
      "Las devoluciones se estudian caso a caso a través de soporte. Si cancelas en mitad de un período mensual ya cobrado, por norma general no se devuelve el importe prorrateado, pero puedes seguir usando el servicio hasta la fecha de fin. En situaciones excepcionales (cobros duplicados, errores técnicos, problemas de acceso graves) el equipo de soporte valora la devolución correspondiente. Para solicitarla, contacta con soporte explicando la situación.",
    related: ["ajs-13", "ajs-14", "ajs-17"],
    keywords: ["devolución", "reembolso", "dinero", "reclamación"],
  },
  {
    id: "ajs-23",
    section: "ajustes-suscripcion",
    question: "¿Cómo reactivo una suscripción cancelada o vencida?",
    answer:
      "Para reactivar una suscripción en estado CANCELADA o VENCIDA tienes que contactar con soporte e indicar el plan que quieres volver a contratar (Básico o Profesional). El equipo reactivará tu cuenta asociándole un nuevo período y la dejará en estado ACTIVA. Tus datos, pacientes, dietas e histórico no se borran cuando la cuenta queda inactiva, por lo que al reactivar recuperas todo tal y como lo dejaste. Es una forma segura de volver después de una pausa.",
    related: ["ajs-14", "ajs-13", "ajs-10"],
    keywords: ["reactivar", "cancelada", "vencida", "volver"],
  },
  {
    id: "ajs-24",
    section: "ajustes-suscripcion",
    question: "¿Puedo disfrutar del período de prueba más de una vez?",
    answer:
      "No, el TRIAL de 14 días está pensado como una prueba única por cuenta. Una vez usado, no se puede reactivar creando una nueva suscripción desde la misma cuenta ni registrando la misma persona con otro correo para eludir el límite. Si necesitas más tiempo para probar una funcionalidad concreta, como la IA del plan Profesional, lo mejor es contactar con soporte y exponer tu caso, ya que en situaciones justificadas se pueden valorar extensiones puntuales.",
    related: ["ajs-5", "ajs-19", "ajs-10"],
    keywords: ["prueba", "trial", "recurrente", "única"],
  },
  {
    id: "ajs-25",
    section: "ajustes-suscripcion",
    question: "¿Los precios incluyen IVA?",
    answer:
      "Los precios mostrados en AppNutrición (9.99€/mes para el Básico y 11.99€/mes para el Profesional) ya incluyen el IVA aplicable según la normativa vigente. No se añaden impuestos adicionales por encima de la cantidad comunicada en la sección Suscripción. Las facturas que emite el equipo de soporte desglosan la base imponible y la cuota de IVA correspondiente para que puedas contabilizarlas correctamente. Si tienes un caso particular (por ejemplo operaciones intracomunitarias), consúltalo con soporte.",
    related: ["ajs-6", "ajs-7", "ajs-18"],
    keywords: ["iva", "impuestos", "precio", "incluido"],
  },
];
