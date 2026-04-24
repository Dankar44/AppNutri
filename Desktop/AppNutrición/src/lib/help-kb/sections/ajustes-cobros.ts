import type { HelpEntry } from "../types";

export const AJUSTES_COBROS_ENTRIES: HelpEntry[] = [
  {
    id: "ajc-1",
    section: "ajustes-cobros",
    question: "¿Qué es la sección Cobros de Ajustes?",
    answer:
      "La sección Cobros de `/ajustes` es el lugar desde donde gestionas la forma en que cobras a tus pacientes por consultas, planes y otros servicios. Aquí encontrarás la tarjeta `<StripeConnectCard>`, que resume el estado de tu integración con Stripe Connect y ofrece los botones para conectar, completar o desconectar tu cuenta. Si aún no tienes Stripe vinculado, verás un mensaje invitándote a conectarlo; si ya lo tienes, podrás consultar el correo, país y moneda de la cuenta. Todo lo relacionado con facturación de tus servicios pasa por esta sección.",
    related: ["ajc-2", "ajc-3", "ajc-6"],
    keywords: ["cobros", "ajustes", "stripe", "pagos"],
  },
  {
    id: "ajc-2",
    section: "ajustes-cobros",
    question: "¿Para qué sirve Stripe Connect en Annonia?",
    answer:
      "Stripe Connect es el sistema que permite a Annonia generar enlaces de pago hacia tu propia cuenta de Stripe, de modo que el dinero cobrado a tus pacientes llegue directamente a ti sin pasar por intermediarios. Técnicamente, Annonia actúa como plataforma que orquesta los pagos, pero el saldo queda siempre en tu cuenta Stripe personal o de empresa. Gracias a esta integración puedes enviar links de Checkout profesionales desde `/pagos` con apenas un clic. Sin Stripe Connect los cobros online no están disponibles.",
    related: ["ajc-1", "ajc-3", "ajc-4"],
    keywords: ["stripe", "connect", "plataforma", "cobros"],
  },
  {
    id: "ajc-3",
    section: "ajustes-cobros",
    question: "¿Qué diferencia hay entre cobrar con Stripe y marcar un pago como manual?",
    answer:
      "Cobrar con Stripe significa generar un enlace de pago que el paciente abre, paga con tarjeta y queda registrado automáticamente como pagado en Annonia. Marcar un pago como manual, en cambio, es una anotación contable que haces tú cuando el paciente te paga fuera de la app, por ejemplo en efectivo, Bizum o transferencia. Ambos métodos conviven perfectamente y puedes combinarlos según prefiera cada paciente. La diferencia clave es que con Stripe no tienes que perseguir cobros y con el manual tú eres el responsable de verificar que el dinero llegó.",
    related: ["ajc-2", "ajc-14", "ajc-15"],
    keywords: ["stripe", "manual", "diferencia", "pago"],
  },
  {
    id: "ajc-4",
    section: "ajustes-cobros",
    question: "¿Cómo conecto mi cuenta de Stripe desde Ajustes?",
    answer:
      "Cuando aún no tienes Stripe vinculado, la tarjeta `<StripeConnectCard>` muestra un botón grande \"Conectar con Stripe\" que inicia el flujo de onboarding oficial de Stripe Connect. Al pulsarlo se abre una nueva ventana en stripe.com donde te preguntan por tu país, tipo de negocio, datos fiscales y cuenta bancaria para recibir las transferencias. Si ya tienes cuenta en Stripe puedes iniciar sesión y enlazarla directamente; si no, Stripe te guiará para crear una nueva. Al terminar, vuelves a Annonia y la tarjeta se actualiza mostrando tu estado.",
    related: ["ajc-1", "ajc-5", "ajc-22"],
    keywords: ["conectar", "stripe", "onboarding", "vincular"],
  },
  {
    id: "ajc-5",
    section: "ajustes-cobros",
    question: "¿Qué significa \"Completar configuración\" en la tarjeta de Stripe?",
    answer:
      "Tras iniciar el onboarding, Stripe puede dejar tu cuenta en estado parcial si no has subido todos los documentos de identidad, el justificante bancario o algún dato fiscal. En ese caso la tarjeta te muestra un aviso y un botón \"Completar configuración\" que reabre el flujo de Stripe justo en el paso pendiente. Hasta que la cuenta no esté completamente verificada, no podrás recibir pagos reales, aunque sí puedes generar enlaces en modo prueba. El campo `stripeOnboarded` del Dietista pasa a `true` cuando Stripe confirma que todo está en orden.",
    related: ["ajc-4", "ajc-6", "ajc-22"],
    keywords: ["completar", "onboarding", "configuración", "documentación"],
  },
  {
    id: "ajc-6",
    section: "ajustes-cobros",
    question: "¿Cómo veo el estado de mi cuenta Stripe?",
    answer:
      "Cuando tu cuenta está conectada y el onboarding finalizado, la tarjeta `<StripeConnectCard>` muestra un resumen con el correo asociado a Stripe, el identificador de cuenta, el país y la moneda principal. Este resumen se actualiza al entrar en `/ajustes` y proviene de una llamada en tiempo real a la API de Stripe. Si hay algún problema (cuenta deshabilitada, verificación caducada, documentación extra), aparecerá un banner con el detalle. Para cambios avanzados, haz clic en \"Ir a Stripe Dashboard\".",
    related: ["ajc-1", "ajc-7", "ajc-8"],
    keywords: ["estado", "cuenta", "stripe", "resumen"],
  },
  {
    id: "ajc-7",
    section: "ajustes-cobros",
    question: "¿Qué email y país aparecen junto a la cuenta Stripe?",
    answer:
      "El email es el que usaste al registrarte en Stripe o al iniciar sesión durante el onboarding, y sirve para que identifiques rápidamente qué cuenta tienes enlazada. El país determina las reglas fiscales, la moneda por defecto y las normativas PSD2 que se aplicarán a tus cobros. Ambos datos se recuperan desde Stripe y se muestran solo en modo lectura desde Annonia. Si necesitas cambiar el email de la cuenta, debes hacerlo dentro de tu Stripe Dashboard.",
    related: ["ajc-6", "ajc-10", "ajc-20"],
    keywords: ["email", "país", "cuenta", "stripe"],
  },
  {
    id: "ajc-8",
    section: "ajustes-cobros",
    question: "¿Qué comisión cobra Annonia por los pagos?",
    answer:
      "Actualmente Annonia no cobra ninguna comisión adicional sobre los pagos que recibes a través de Stripe Connect: el valor configurado es 0 €. Esto significa que solo asumes las comisiones propias de Stripe y el 100 % del resto llega a tu cuenta. En el futuro podríamos introducir una tarifa opcional para planes avanzados, pero siempre sería transparente y se anunciaría con antelación. Puedes revisar esta política desde la propia tarjeta de Cobros o en la página pública de precios.",
    related: ["ajc-9", "ajc-15", "ajc-16"],
    keywords: ["comisión", "annonia", "tarifa", "coste"],
  },
  {
    id: "ajc-9",
    section: "ajustes-cobros",
    question: "¿Qué comisiones aplica Stripe?",
    answer:
      "Stripe aplica sus propias comisiones por transacción, que en Europa suelen rondar el 1,4 % más 0,25 € para tarjetas del Espacio Económico Europeo y el 2,9 % más 0,25 € para tarjetas internacionales. Estas tarifas se descuentan automáticamente del importe cobrado antes de transferirlo a tu cuenta bancaria. Annonia no interviene en estas comisiones: van directamente a Stripe a cambio del procesamiento, la seguridad y la protección antifraude. Consulta la página oficial de precios de Stripe para ver la tarifa exacta de tu país.",
    related: ["ajc-8", "ajc-16", "ajc-17"],
    keywords: ["comisión", "stripe", "tarifa", "porcentaje"],
  },
  {
    id: "ajc-10",
    section: "ajustes-cobros",
    question: "¿En qué monedas puedo cobrar con Stripe Connect?",
    answer:
      "Por defecto Annonia está configurada para cobrar en euros (EUR), que es la moneda habitual para nutricionistas en España y la zona euro. Stripe permite cobrar en muchas otras divisas, pero la interfaz actual de Annonia asume EUR al crear pagos y generar links de Checkout. Si necesitas cobrar en otra moneda, contáctanos para valorarlo; a nivel técnico es viable pero requiere ajustes en la lógica de `/pagos`. La moneda principal de tu cuenta Stripe aparece en el resumen de la tarjeta.",
    related: ["ajc-7", "ajc-9", "ajc-20"],
    keywords: ["moneda", "eur", "euros", "divisa"],
  },
  {
    id: "ajc-11",
    section: "ajustes-cobros",
    question: "¿Cómo desconecto mi cuenta de Stripe?",
    answer:
      "Si tu cuenta está conectada, la tarjeta `<StripeConnectCard>` incluye un botón \"Desconectar\" al final de la vista. Al pulsarlo aparece una confirmación avisando de las consecuencias; al aceptar, Annonia borra los campos `stripeAccountId` y `stripeOnboarded` del Dietista y revoca los permisos OAuth concedidos a Stripe. Tu cuenta en Stripe sigue existiendo: solo se rompe el vínculo con Annonia. Puedes volver a conectarla en cualquier momento repitiendo el flujo de onboarding.",
    related: ["ajc-12", "ajc-13", "ajc-4"],
    keywords: ["desconectar", "stripe", "revocar", "eliminar"],
  },
  {
    id: "ajc-12",
    section: "ajustes-cobros",
    question: "¿Qué pasa con los pagos pendientes si desconecto Stripe?",
    answer:
      "Los pagos que hayas creado y que aún no estén cobrados se quedarán sin link de Checkout válido, porque el link depende de la cuenta Stripe vinculada. En `/pagos` verás que siguen apareciendo como pendientes, pero el paciente ya no podrá abrir el enlace para pagarlos. Puedes optar por anularlos, marcarlos como pagados manualmente si has recibido el dinero por otra vía, o esperar a reconectar Stripe y regenerarlos. No se pierde información: solo queda suspendido el flujo online.",
    related: ["ajc-11", "ajc-13", "ajc-14"],
    keywords: ["pendientes", "desconectar", "pagos", "links"],
  },
  {
    id: "ajc-13",
    section: "ajustes-cobros",
    question: "¿Los pagos ya cobrados se pierden si desconecto Stripe?",
    answer:
      "No. Todos los pagos ya realizados quedan registrados de forma permanente en la base de datos de Annonia y en tu Stripe Dashboard, con su importe, fecha, paciente y justificante. Desconectar Stripe solo afecta a los pagos futuros y a los enlaces pendientes, pero el histórico se conserva íntegro. Podrás seguir consultándolos en `/pagos` con sus correspondientes recibos. Además, Stripe mantiene un registro independiente al que puedes acceder iniciando sesión en dashboard.stripe.com.",
    related: ["ajc-11", "ajc-12", "ajc-17"],
    keywords: ["histórico", "cobrados", "desconectar", "registro"],
  },
  {
    id: "ajc-14",
    section: "ajustes-cobros",
    question: "Si no tengo Stripe, ¿puedo seguir creando pagos?",
    answer:
      "Sí, Annonia permite crear pagos manuales aunque no tengas Stripe Connect vinculado. Desde `/pagos` puedes registrar importes, asignarlos a pacientes y marcarlos como cobrados cuando el dinero te llegue por cualquier otra vía. La única diferencia es que no se generará un link de pago online ni el paciente podrá pagar con tarjeta desde su portal. Es la opción perfecta si trabajas únicamente con Bizum, transferencia bancaria o efectivo.",
    related: ["ajc-3", "ajc-15", "ajc-12"],
    keywords: ["manual", "sin stripe", "pagos", "crear"],
  },
  {
    id: "ajc-15",
    section: "ajustes-cobros",
    question: "¿Cómo uso \"Marcar pagado\" en un pago manual?",
    answer:
      "En la lista de `/pagos`, cada fila pendiente tiene una acción llamada \"Marcar pagado\" que abre un pequeño diálogo donde introduces la fecha real del cobro y un método (efectivo, Bizum, transferencia, otro). Al confirmar, el pago queda registrado como pagado y desaparece de la lista de pendientes, incrementando tus métricas del Dashboard. Esta acción es reversible desde el detalle del pago por si te equivocas. Recuerda que los pagos marcados manualmente no generan movimiento en Stripe ni emiten recibo automático.",
    related: ["ajc-3", "ajc-14", "ajc-18"],
    keywords: ["marcar", "pagado", "manual", "acción"],
  },
  {
    id: "ajc-16",
    section: "ajustes-cobros",
    question: "¿Necesito cuenta bancaria para recibir pagos con Stripe?",
    answer:
      "Sí, Stripe exige una cuenta bancaria válida a tu nombre (o de tu empresa) para transferirte el dinero cobrado. Durante el onboarding te pedirá el IBAN y lo verificará con un depósito o una comprobación directa. Sin esta cuenta vinculada, Stripe no libera los saldos, aunque puedas seguir generando enlaces de pago. Puedes cambiar la cuenta bancaria más adelante desde tu Stripe Dashboard sin necesidad de reconectar Annonia.",
    related: ["ajc-4", "ajc-17", "ajc-20"],
    keywords: ["cuenta", "bancaria", "iban", "stripe"],
  },
  {
    id: "ajc-17",
    section: "ajustes-cobros",
    question: "¿Cuánto tarda Stripe en transferir el dinero a mi banco?",
    answer:
      "En condiciones normales, Stripe realiza las transferencias en un plazo de 2 a 7 días laborables desde que el pago se confirma, dependiendo del país y del tipo de cuenta. Las primeras transferencias suelen tardar un poco más mientras Stripe verifica tu historial; después el ritmo se estabiliza. Puedes consultar el calendario exacto de payouts en tu Stripe Dashboard, donde además puedes configurar la frecuencia (diaria, semanal o manual). Annonia no interviene en los tiempos de transferencia.",
    related: ["ajc-9", "ajc-16", "ajc-13"],
    keywords: ["transferencia", "tiempo", "payout", "banco"],
  },
  {
    id: "ajc-18",
    section: "ajustes-cobros",
    question: "¿Cómo hago un reembolso (refund) de un pago?",
    answer:
      "Los reembolsos de pagos realizados con Stripe se gestionan desde tu Stripe Dashboard en dashboard.stripe.com: busca el cargo concreto y pulsa \"Refund\" indicando el importe total o parcial. Stripe devuelve el dinero al paciente en la misma tarjeta con la que pagó, normalmente en 5-10 días laborables. Annonia refleja el estado del pago en `/pagos` al sincronizar con Stripe. Para pagos manuales, basta con editar la ficha y marcarlos como anulados añadiendo una nota interna.",
    related: ["ajc-19", "ajc-15", "ajc-13"],
    keywords: ["reembolso", "refund", "devolución", "stripe"],
  },
  {
    id: "ajc-19",
    section: "ajustes-cobros",
    question: "¿Qué ocurre si un paciente abre una disputa en su tarjeta?",
    answer:
      "Si un paciente contacta con su banco para disputar un cargo, Stripe recibe la notificación y te avisa por email y desde su Dashboard. Dispones de un plazo para aportar pruebas (facturas, emails, historial de citas) antes de que se resuelva. Durante ese tiempo, el importe queda retenido y Stripe cobra una pequeña comisión de gestión si pierdes el caso. Annonia no interviene en la disputa, pero puede servirte como fuente de evidencias gracias al histórico de consultas y mensajes del paciente.",
    related: ["ajc-18", "ajc-9", "ajc-25"],
    keywords: ["disputa", "chargeback", "reclamación", "banco"],
  },
  {
    id: "ajc-20",
    section: "ajustes-cobros",
    question: "¿Puedo recibir los pagos en nombre de mi clínica o sociedad?",
    answer:
      "Sí, durante el onboarding de Stripe puedes indicar que el titular de la cuenta es una empresa o entidad profesional, no una persona física. Tendrás que aportar el CIF, los datos del representante legal y los documentos de constitución. Una vez verificada, todas las transferencias se harán a nombre de la clínica y las facturas reflejarán la razón social, lo cual es clave para cumplir con tus obligaciones fiscales. Desde Annonia la experiencia es la misma: el vínculo funciona igual en cuentas personales y de empresa.",
    related: ["ajc-21", "ajc-7", "ajc-16"],
    keywords: ["clínica", "empresa", "sociedad", "cif"],
  },
  {
    id: "ajc-21",
    section: "ajustes-cobros",
    question: "¿Qué elijo, cuenta Stripe personal o de empresa?",
    answer:
      "Depende de cómo factures tus servicios. Si ejerces como autónomo a título individual, una cuenta personal (individual) con tu NIF es lo más directo; si tienes una sociedad limitada u otra forma jurídica, debes usar una cuenta de empresa para que la facturación cuadre con tu CIF. También hay diferencias en la documentación que pide Stripe y en las implicaciones fiscales. Si tienes dudas, consúltalo con tu asesor antes de iniciar el onboarding para evitar tener que cambiar el tipo de cuenta más adelante.",
    related: ["ajc-20", "ajc-4", "ajc-24"],
    keywords: ["personal", "empresa", "autónomo", "tipo"],
  },
  {
    id: "ajc-22",
    section: "ajustes-cobros",
    question: "Ya tengo cuenta en Stripe, ¿puedo enlazarla con Annonia?",
    answer:
      "Perfectamente. Cuando pulsas \"Conectar con Stripe\" y se abre la ventana de onboarding, en lugar de crear una cuenta nueva puedes iniciar sesión con tu email y contraseña de Stripe existentes. El sistema te pedirá confirmar los permisos que Annonia solicita y vinculará ambas partes sin que pierdas el histórico ni los ajustes de Stripe que ya tuvieras. Todo el dinero seguirá llegando a la misma cuenta bancaria y verás tus cobros tanto en Annonia como en dashboard.stripe.com.",
    related: ["ajc-4", "ajc-5", "ajc-23"],
    keywords: ["tengo", "cuenta", "existente", "enlazar"],
  },
  {
    id: "ajc-23",
    section: "ajustes-cobros",
    question: "¿Qué datos comparte Annonia con Stripe y viceversa?",
    answer:
      "Annonia envía a Stripe únicamente la información necesaria para procesar cada pago: importe, moneda, descripción del servicio y un identificador anónimo del paciente. No se comparten datos clínicos, mediciones ni contenido de consultas. A cambio, Stripe devuelve a Annonia el estado del pago, el identificador del cargo y datos básicos de tu cuenta (email, país, moneda). Los datos de tarjeta del paciente los gestiona Stripe directamente y nunca pasan por los servidores de Annonia, lo que garantiza el cumplimiento PCI.",
    related: ["ajc-24", "ajc-7", "ajc-19"],
    keywords: ["datos", "privacidad", "comparte", "pci"],
  },
  {
    id: "ajc-24",
    section: "ajustes-cobros",
    question: "¿Es seguro conectar Stripe? ¿Qué pasa con la privacidad?",
    answer:
      "La integración es segura porque se basa en el estándar OAuth de Stripe Connect: Annonia nunca almacena tus credenciales, solo un token autorizado que puedes revocar en cualquier momento. Los datos sensibles de pago (números de tarjeta, CVV) se gestionan íntegramente en la infraestructura PCI-DSS de Stripe, certificada a nivel bancario. Annonia cumple además con el RGPD y solo usa los datos necesarios para mostrar el estado de tu cuenta y vincular pagos a pacientes. Puedes consultar la política de privacidad para más detalle.",
    related: ["ajc-23", "ajc-11", "ajc-1"],
    keywords: ["seguro", "privacidad", "rgpd", "oauth"],
  },
  {
    id: "ajc-25",
    section: "ajustes-cobros",
    question: "¿Cuáles son los errores más comunes al configurar Cobros?",
    answer:
      "Los fallos más habituales son: quedar a medias en el onboarding porque falta algún documento (se resuelve con \"Completar configuración\"), introducir un IBAN erróneo que impide recibir transferencias, o intentar cobrar en una moneda no soportada por tu cuenta. También es frecuente que la sesión de Stripe expire en mitad del onboarding; basta con reabrir el flujo para retomarlo. Si ves que el estado no se actualiza tras conectar, recarga la página `/ajustes` o cierra sesión y vuelve a entrar para refrescar los datos.",
    related: ["ajc-5", "ajc-4", "ajc-16"],
    keywords: ["errores", "problemas", "comunes", "solución"],
  },
];
