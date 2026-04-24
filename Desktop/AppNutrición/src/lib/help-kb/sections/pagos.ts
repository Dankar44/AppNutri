import type { HelpEntry } from "../types";

export const PAGOS_ENTRIES: HelpEntry[] = [
  {
    id: "pag-1",
    section: "pagos",
    question: "¿Qué es la sección Pagos de Annonia?",
    answer:
      "La sección Pagos es el módulo donde gestionas todos los cobros que haces a tus pacientes por tus servicios como nutricionista, accesible desde la ruta `/pagos` del panel. Te permite registrar pagos manuales, generar enlaces de pago online a través de Stripe Checkout y llevar un control claro de qué está cobrado y qué queda pendiente. Es el centro financiero de tu actividad dentro de la app, separado del resto de secciones clínicas. Funciona tanto si cobras en efectivo, por transferencia o con tarjeta a través de Stripe Connect.",
    related: ["pag-2", "pag-3", "pag-15"],
    keywords: ["pagos", "cobros", "qué es", "sección"],
  },
  {
    id: "pag-2",
    section: "pagos",
    question: "¿Para qué sirve la sección Pagos?",
    answer:
      "Sirve para registrar y controlar todos los importes que cobras a tus pacientes: consultas puntuales, planes mensuales, paquetes de seguimientos o cualquier otro servicio. Te permite ver rápidamente tu balance entre lo cobrado y lo pendiente, emitir enlaces de pago que el paciente puede completar online y marcar como pagados los cobros en mano. También facilita el seguimiento de impagos al mantener un listado único con estados. En la práctica, es la forma de saber en todo momento cuánto has facturado y cuánto te deben.",
    related: ["pag-1", "pag-4", "pag-10"],
    keywords: ["uso", "para qué", "objetivo", "gestión"],
  },
  {
    id: "pag-3",
    section: "pagos",
    question: "¿Cómo accedo a la sección Pagos?",
    answer:
      "Desde el sidebar izquierdo del panel del nutricionista encontrarás la entrada \"Pagos\" con el icono correspondiente. Al hacer clic te lleva a `/pagos` y verás arriba las tarjetas de estadísticas y, debajo, el listado de todos los pagos registrados. Si es la primera vez que entras, el listado estará vacío salvo algún pago del paciente demo si tienes activada esa opción en Ajustes. En móvil, abre primero el menú lateral con el botón de hamburguesa.",
    related: ["pag-1", "pag-4", "pag-33"],
    keywords: ["acceso", "ruta", "sidebar", "navegación"],
  },
  {
    id: "pag-4",
    section: "pagos",
    question: "¿Qué estadísticas se muestran en la parte superior?",
    answer:
      "Arriba de la página de Pagos hay cuatro tarjetas con métricas clave: total de pagos registrados, importe ya cobrado, importe pendiente y balance final. El total cuenta cuántos registros tienes, independientemente del estado. Cobrado suma todos los pagos en estado PAGADO y pendiente suma los que aún están PENDIENTE. El balance es simplemente cobrado menos pendiente, y sirve para ver de un vistazo tu situación neta actual.",
    related: ["pag-5", "pag-6", "pag-7", "pag-42"],
    keywords: ["estadísticas", "stats", "métricas", "tarjetas"],
  },
  {
    id: "pag-5",
    section: "pagos",
    question: "¿Qué significa la estadística \"Total pagos\"?",
    answer:
      "Total pagos indica el número total de registros de pago que tienes creados en tu cuenta, sin importar su estado. Incluye pagados, pendientes y fallidos, así como los pagos de ejemplo del paciente demo si lo tienes activo. Es un contador de actividad, útil para saber cuánto volumen de cobros mueves en la plataforma. No muestra importes, sólo el número de registros.",
    related: ["pag-4", "pag-6", "pag-7"],
    keywords: ["total", "contador", "registros", "actividad"],
  },
  {
    id: "pag-6",
    section: "pagos",
    question: "¿Qué significa la estadística \"Cobrado\"?",
    answer:
      "Cobrado es la suma en euros de todos los pagos que están en estado PAGADO. Refleja el dinero que efectivamente has recibido, ya sea en mano, por transferencia o a través de Stripe. No incluye pagos pendientes ni fallidos. Es el valor que mejor representa tus ingresos reales a través de la app en el periodo actual de visualización.",
    related: ["pag-4", "pag-7", "pag-20"],
    keywords: ["cobrado", "ingresos", "pagado", "recibido"],
  },
  {
    id: "pag-7",
    section: "pagos",
    question: "¿Qué significa la estadística \"Pendiente\"?",
    answer:
      "Pendiente es la suma en euros de todos los pagos que están en estado PENDIENTE, es decir, registrados pero aún no cobrados. Incluye enlaces de Stripe que todavía no se han completado y pagos manuales que aún no has marcado como pagados. Es un indicador de cuánto dinero esperas recibir próximamente. Si el importe crece demasiado, puede ser buen momento de enviar recordatorios a tus pacientes.",
    related: ["pag-4", "pag-6", "pag-8", "pag-47"],
    keywords: ["pendiente", "por cobrar", "deuda", "esperado"],
  },
  {
    id: "pag-8",
    section: "pagos",
    question: "¿Qué significa la estadística \"Balance\"?",
    answer:
      "Balance es la diferencia entre lo cobrado y lo pendiente: `balance = cobrado - pendiente`. Si tienes más cobrado que pendiente, el balance será positivo; si tienes mucho por cobrar todavía, puede ser negativo o bajo. Sirve para ver rápidamente tu posición neta, no para calcular beneficios ni restar gastos. Es una métrica orientativa de tesorería dentro de la propia app.",
    related: ["pag-4", "pag-6", "pag-7"],
    keywords: ["balance", "neto", "diferencia", "resultado"],
  },
  {
    id: "pag-9",
    section: "pagos",
    question: "¿Cómo es el listado de pagos?",
    answer:
      "Debajo de las estadísticas hay una tabla con una fila por cada pago registrado. Cada fila muestra paciente asociado, concepto, importe, estado (PAGADO, PENDIENTE o FALLIDO), método de pago y fecha del cobro. Al hacer clic en una fila se abre el detalle con opciones adicionales como regenerar enlace de Stripe, marcar como pagado o eliminar. El listado se actualiza al crear o modificar cualquier pago.",
    related: ["pag-1", "pag-10", "pag-11", "pag-20"],
    keywords: ["listado", "tabla", "filas", "pagos"],
  },
  {
    id: "pag-10",
    section: "pagos",
    question: "¿Qué información muestra cada fila del listado?",
    answer:
      "Cada fila incluye seis columnas principales: paciente (o en blanco si es un pago general), concepto textual, importe en euros, estado con colores (verde PAGADO, amarillo PENDIENTE, rojo FALLIDO), método de pago y fecha en que se cobró o se creó. Si el pago tiene un enlace Stripe asociado, también verás un botón para copiarlo. El diseño prioriza la lectura rápida para que identifiques en un vistazo lo más relevante.",
    related: ["pag-9", "pag-20", "pag-22", "pag-25"],
    keywords: ["columnas", "fila", "información", "datos"],
  },
  {
    id: "pag-11",
    section: "pagos",
    question: "¿Hay filtros para el listado de pagos?",
    answer:
      "Sí, encima del listado tienes filtros rápidos para acotar lo que se muestra. Puedes filtrar por estado (PAGADO, PENDIENTE, FALLIDO) y por paciente concreto seleccionándolo de un desplegable. Los filtros son combinables, de forma que puedes ver por ejemplo todos los pagos pendientes de un único paciente. Al limpiar los filtros vuelves a la lista completa.",
    related: ["pag-12", "pag-13", "pag-14"],
    keywords: ["filtros", "filtrar", "estado", "paciente"],
  },
  {
    id: "pag-12",
    section: "pagos",
    question: "¿Hay buscador en Pagos?",
    answer:
      "Sí, el buscador te permite localizar pagos escribiendo texto libre que se compara contra el campo concepto y el nombre del paciente. Es útil cuando recuerdas parte de la descripción de un cobro pero no la fecha o el importe. La búsqueda es instantánea y se combina con los filtros activos si los hay. Si no encuentra resultados, el listado queda vacío con un mensaje indicativo.",
    related: ["pag-11", "pag-13", "pag-43"],
    keywords: ["buscador", "búsqueda", "buscar", "concepto"],
  },
  {
    id: "pag-13",
    section: "pagos",
    question: "¿Puedo filtrar por estado?",
    answer:
      "Sí, el filtro de estado te permite elegir entre PAGADO, PENDIENTE, FALLIDO o ver todos. Es el filtro más utilizado porque te ayuda a concentrarte en lo que toca hacer: por ejemplo, revisar los pendientes para enviar recordatorios, o los fallidos para decidir si anularlos o volver a intentar el cobro. El filtro es un simple desplegable en la barra superior. Al cambiarlo, el listado se actualiza al instante.",
    related: ["pag-11", "pag-20", "pag-47"],
    keywords: ["filtro", "estado", "pagado", "pendiente"],
  },
  {
    id: "pag-14",
    section: "pagos",
    question: "¿Puedo filtrar por paciente?",
    answer:
      "Sí, puedes seleccionar un paciente concreto desde el desplegable y el listado sólo mostrará los pagos asociados a esa persona. Es útil cuando quieres auditar lo que te ha pagado un paciente a lo largo del tiempo o ver qué tiene pendiente. Los pagos generales (sin paciente asignado) no aparecen cuando filtras por paciente. Puedes combinarlo con el filtro de estado para un análisis más fino.",
    related: ["pag-11", "pag-13", "pag-18"],
    keywords: ["filtro", "paciente", "cliente", "historial"],
  },
  {
    id: "pag-15",
    section: "pagos",
    question: "¿Cómo creo un nuevo pago?",
    answer:
      "Pulsa el botón \"Nuevo pago\" en la parte superior derecha del listado, lo que abre un formulario modal. Ahí rellenas los campos obligatorios y opcionales, y al confirmar el pago queda registrado en estado PENDIENTE por defecto. Si tienes Stripe Connect activado, se te ofrece generar un enlace de pago para enviárselo al paciente. Si no, puedes marcarlo como PAGADO manualmente cuando recibas el dinero.",
    related: ["pag-16", "pag-17", "pag-25", "pag-27"],
    keywords: ["crear", "nuevo", "formulario", "añadir"],
  },
  {
    id: "pag-16",
    section: "pagos",
    question: "¿Qué campos tiene el formulario de nuevo pago?",
    answer:
      "El formulario incluye cuatro campos: paciente (opcional, un selector de pacientes activos), concepto (texto libre que describe el cobro, obligatorio), importe en euros (obligatorio, admite hasta dos decimales) y notas (opcional, texto libre para referencias internas). No se pide método de pago al crear, se define después al marcar como pagado o al usar Stripe. El botón de guardar queda deshabilitado hasta que los campos obligatorios estén completos.",
    related: ["pag-15", "pag-17", "pag-18", "pag-19"],
    keywords: ["campos", "formulario", "datos", "paciente"],
  },
  {
    id: "pag-17",
    section: "pagos",
    question: "¿Es obligatorio asignar un paciente al crear un pago?",
    answer:
      "No, el campo paciente es opcional. Puedes crear pagos generales sin paciente asignado para cobros que no estén ligados a una persona concreta, como servicios genéricos, talleres grupales o ingresos puntuales. En el listado esos pagos aparecerán con el campo paciente vacío. Si más adelante quieres asociarlo a alguien, tendrás que eliminarlo y volver a crearlo o editar el registro.",
    related: ["pag-16", "pag-18", "pag-44"],
    keywords: ["paciente", "opcional", "general", "sin paciente"],
  },
  {
    id: "pag-18",
    section: "pagos",
    question: "¿Qué es el campo \"concepto\" del pago?",
    answer:
      "El concepto es un texto corto y obligatorio que describe a qué corresponde el cobro: \"Primera consulta\", \"Plan mensual mayo\", \"Pack de 4 sesiones\", etc. Aparece en el listado, en el enlace de Stripe que ve el paciente al pagar y en las notificaciones. Conviene que sea claro y específico para que tanto tú como tu paciente reconozcan fácilmente el cobro. No tiene límite estricto de caracteres pero se recomienda brevedad.",
    related: ["pag-16", "pag-19", "pag-43"],
    keywords: ["concepto", "descripción", "texto", "cobro"],
  },
  {
    id: "pag-19",
    section: "pagos",
    question: "¿Para qué sirven las notas del pago?",
    answer:
      "Las notas son un campo de texto libre opcional donde puedes añadir información interna sobre el cobro: condiciones acordadas, descuentos aplicados, referencias contables o cualquier recordatorio. No se muestran al paciente cuando recibe el enlace de Stripe, son sólo para tu uso personal dentro de la app. Aparecen en el detalle del pago pero no en el listado principal. Sirven para mantener trazabilidad sin saturar la vista.",
    related: ["pag-16", "pag-18"],
    keywords: ["notas", "observaciones", "privado", "interno"],
  },
  {
    id: "pag-20",
    section: "pagos",
    question: "¿Qué estados puede tener un pago?",
    answer:
      "Un pago puede estar en tres estados: PAGADO (cobrado, aparece en verde), PENDIENTE (registrado pero aún no cobrado, en amarillo) y FALLIDO (intento de cobro que no se completó, en rojo). Los pagos nuevos empiezan en PENDIENTE por defecto. El estado cambia automáticamente a PAGADO cuando el paciente completa un pago por Stripe, o manualmente cuando lo marcas tú. FALLIDO normalmente lo marca el webhook de Stripe cuando el intento no se procesa correctamente.",
    related: ["pag-21", "pag-22", "pag-23", "pag-30"],
    keywords: ["estados", "pagado", "pendiente", "fallido"],
  },
  {
    id: "pag-21",
    section: "pagos",
    question: "¿Qué significa el estado PAGADO?",
    answer:
      "PAGADO indica que el cobro está completado y el dinero ya ha llegado a tu cuenta, bien de forma manual (efectivo, transferencia, tarjeta) o a través de Stripe Checkout. En el listado se muestra con una etiqueta verde para que lo identifiques rápidamente. Los pagos PAGADO cuentan en la estadística de \"Cobrado\" y aumentan tu balance. Una vez en este estado, no se vuelven a cambiar automáticamente.",
    related: ["pag-20", "pag-22", "pag-31"],
    keywords: ["pagado", "completado", "cobrado", "verde"],
  },
  {
    id: "pag-22",
    section: "pagos",
    question: "¿Qué significa el estado PENDIENTE?",
    answer:
      "PENDIENTE es el estado inicial de todo pago recién creado, indicando que está registrado pero aún no cobrado. Se muestra con color amarillo en el listado. Incluye tanto pagos manuales que estás esperando recibir como enlaces de Stripe que el paciente todavía no ha completado. Desde este estado puedes pasar a PAGADO (manual o automático por Stripe) o eliminarlo si decides anularlo.",
    related: ["pag-20", "pag-21", "pag-23", "pag-47"],
    keywords: ["pendiente", "por cobrar", "amarillo", "espera"],
  },
  {
    id: "pag-23",
    section: "pagos",
    question: "¿Qué significa el estado FALLIDO?",
    answer:
      "FALLIDO indica que un intento de pago por Stripe no se completó correctamente, ya sea porque la tarjeta fue rechazada, el paciente canceló o hubo un error técnico. Aparece con color rojo en el listado. Cuando esto ocurre se dispara una notificación PAGO_FALLIDO para que lo revises. Puedes anular el pago fallido eliminándolo o generar un nuevo enlace para que el paciente vuelva a intentarlo.",
    related: ["pag-20", "pag-34", "pag-48", "pag-50"],
    keywords: ["fallido", "error", "rechazado", "rojo"],
  },
  {
    id: "pag-24",
    section: "pagos",
    question: "¿Qué métodos de pago se pueden registrar?",
    answer:
      "El campo método de pago admite varios valores: efectivo, tarjeta, transferencia, Bizum o Stripe, entre otros. Cuando el cobro se completa por Stripe Checkout, se establece automáticamente como \"Stripe\". En los pagos manuales lo indicas tú al marcarlo como PAGADO, eligiendo el método que corresponda. Sirve sólo como información descriptiva para tu registro; la app no calcula comisiones ni diferencia funcionalmente entre métodos manuales.",
    related: ["pag-20", "pag-31", "pag-26"],
    keywords: ["método", "efectivo", "tarjeta", "transferencia"],
  },
  {
    id: "pag-25",
    section: "pagos",
    question: "¿Qué diferencia hay entre pago manual y pago con Stripe?",
    answer:
      "Un pago manual es un cobro que recibes fuera de la app (efectivo, transferencia, Bizum) y registras en Annonia para llevar el control, marcándolo tú mismo como PAGADO. Un pago con Stripe utiliza la integración Stripe Connect para generar un enlace de Stripe Checkout que el paciente completa online con tarjeta, y el estado se actualiza automáticamente al recibir el webhook. La ventaja de Stripe es la automatización y seguridad; la del manual es que no lleva comisiones de la pasarela.",
    related: ["pag-26", "pag-27", "pag-31", "pag-40"],
    keywords: ["manual", "stripe", "diferencia", "comparativa"],
  },
  {
    id: "pag-26",
    section: "pagos",
    question: "¿Qué es Stripe Connect?",
    answer:
      "Stripe Connect es la modalidad de la pasarela de pagos Stripe que permite a plataformas como Annonia conectar las cuentas individuales de sus usuarios (en este caso, cada nutricionista) para que puedan cobrar directamente en su propia cuenta Stripe. El dinero de los pagos no pasa por Annonia, va directo a tu cuenta Stripe. Requiere completar un proceso de verificación de identidad en Stripe antes de empezar a cobrar. Es el estándar habitual para marketplaces y SaaS multi-tenant.",
    related: ["pag-25", "pag-27", "pag-40"],
    keywords: ["stripe connect", "stripe", "qué es", "pasarela"],
  },
  {
    id: "pag-27",
    section: "pagos",
    question: "¿Cómo conecto mi cuenta de Stripe?",
    answer:
      "Para conectar Stripe ve a `/ajustes` y dentro de la pestaña \"Cobros\" encontrarás el botón para iniciar el onboarding de Stripe Connect. Te redirigirá a la página oficial de Stripe, donde completas tus datos fiscales, bancarios y de identidad. Al terminar, vuelves a Annonia con la conexión activa y ya puedes generar enlaces de pago. Si no completas todos los pasos, quedas en estado pendiente y no se podrán emitir cobros por Stripe.",
    related: ["pag-26", "pag-28", "pag-40"],
    keywords: ["conectar", "stripe", "ajustes", "onboarding"],
  },
  {
    id: "pag-28",
    section: "pagos",
    question: "¿Qué ocurre si no tengo Stripe Connect activado?",
    answer:
      "Si no has conectado tu cuenta de Stripe, puedes seguir usando la sección Pagos con normalidad para registrar y llevar el control de cobros manuales. Lo que no podrás hacer es generar enlaces de pago online, de forma que al crear un pago sólo tendrás la opción de marcarlo manualmente como PAGADO. Si intentas generar un enlace sin Stripe conectado, la app te llevará automáticamente a `/ajustes` para completar la conexión primero.",
    related: ["pag-27", "pag-40", "pag-46"],
    keywords: ["sin stripe", "no conectado", "manual", "limitación"],
  },
  {
    id: "pag-29",
    section: "pagos",
    question: "¿Cómo genero un enlace de pago de Stripe?",
    answer:
      "Al crear un pago nuevo con Stripe Connect activado, verás una opción para generar directamente un enlace Stripe Checkout. También puedes generarlo desde un pago ya existente en estado PENDIENTE pulsando el botón \"Generar enlace\" en su detalle. El enlace se crea al vuelo contra la API de Stripe y se guarda en el campo `stripePaymentUrl` del pago, asociado a un `stripeSessionId`. Una vez generado, puedes copiarlo y enviárselo al paciente.",
    related: ["pag-25", "pag-30", "pag-32", "pag-35"],
    keywords: ["generar", "enlace", "link", "stripe"],
  },
  {
    id: "pag-30",
    section: "pagos",
    question: "¿Cómo envío el enlace de pago al paciente?",
    answer:
      "Una vez generado el enlace, puedes copiarlo al portapapeles con el botón de copia en el detalle del pago y enviarlo al paciente por el canal que prefieras: WhatsApp, email, Telegram o cualquier otro. No hay envío automático integrado desde la app, el envío lo haces tú manualmente. El paciente recibe una URL de Stripe Checkout que abre un formulario de pago seguro. Es el método más utilizado y flexible para cobros online.",
    related: ["pag-29", "pag-31", "pag-32"],
    keywords: ["enviar", "enlace", "whatsapp", "email"],
  },
  {
    id: "pag-31",
    section: "pagos",
    question: "¿Qué ve el paciente cuando abre el enlace de Stripe?",
    answer:
      "Al abrir el enlace, el paciente llega a Stripe Checkout, una página de pago oficial de Stripe con el concepto, el importe en euros y un formulario para introducir los datos de tarjeta. La interfaz está en español y cumple con los estándares de seguridad PCI, de forma que los datos de tarjeta no pasan ni por Annonia ni por Stripe Connect del nutricionista. Al completar el pago, el paciente ve una confirmación y, en paralelo, Stripe envía un webhook a Annonia para actualizar el estado.",
    related: ["pag-25", "pag-30", "pag-32", "pag-33"],
    keywords: ["paciente", "stripe checkout", "página", "pago"],
  },
  {
    id: "pag-32",
    section: "pagos",
    question: "¿Qué pasa después de que el paciente pague?",
    answer:
      "Cuando el paciente completa el pago por Stripe, la propia plataforma envía un webhook a Annonia con la confirmación. Automáticamente, el estado del pago cambia de PENDIENTE a PAGADO, se rellenan los campos `fechaPago` y `metodoPago` (\"Stripe\") y se dispara la notificación PAGO_RECIBIDO. No tienes que hacer nada manualmente: al refrescar la sección Pagos verás la actualización. El dinero llega a tu cuenta de Stripe Connect según los plazos que tenga tu país.",
    related: ["pag-31", "pag-33", "pag-34", "pag-42"],
    keywords: ["paciente paga", "webhook", "automático", "confirmación"],
  },
  {
    id: "pag-33",
    section: "pagos",
    question: "¿Qué es el webhook de Stripe?",
    answer:
      "Un webhook es una llamada automática que Stripe hace a Annonia cada vez que ocurre un evento relevante en un cobro: pago completado, pago fallido, enlace expirado, reembolso, etc. Annonia escucha esos webhooks en un endpoint dedicado y, según el tipo de evento, actualiza el estado del pago correspondiente en la base de datos. Es lo que permite que todo ocurra en tiempo real sin que tú tengas que refrescar nada. Si por algún motivo el webhook fallara, Stripe reintenta el envío varias veces.",
    related: ["pag-32", "pag-34", "pag-23"],
    keywords: ["webhook", "stripe", "automático", "evento"],
  },
  {
    id: "pag-34",
    section: "pagos",
    question: "¿Qué pasa si el pago falla en Stripe?",
    answer:
      "Si el paciente intenta pagar y la transacción no se completa (tarjeta rechazada, fondos insuficientes, error técnico), el webhook de Stripe notifica el fallo y el pago pasa a estado FALLIDO. Se dispara la notificación PAGO_FALLIDO para que lo revises. Puedes entonces generar un nuevo enlace de pago para que el paciente vuelva a intentarlo, eliminarlo si decides anular el cobro o cambiar el método a manual. El enlace original ya no es reutilizable.",
    related: ["pag-23", "pag-33", "pag-35", "pag-50"],
    keywords: ["falla", "fallido", "error", "rechazado"],
  },
  {
    id: "pag-35",
    section: "pagos",
    question: "¿Puedo regenerar un enlace de Stripe si caducó?",
    answer:
      "Sí, los enlaces de Stripe Checkout tienen una caducidad limitada (por defecto 24 horas) y si expiran ya no se pueden usar. Desde el detalle de un pago en estado PENDIENTE o FALLIDO puedes pulsar \"Generar nuevo enlace\" para crear uno nuevo con el mismo concepto e importe. La `stripeSessionId` anterior queda sustituida por la nueva. Puedes enviar el nuevo enlace al paciente sin crear un pago duplicado.",
    related: ["pag-29", "pag-34", "pag-36"],
    keywords: ["regenerar", "caducado", "expirado", "nuevo"],
  },
  {
    id: "pag-36",
    section: "pagos",
    question: "¿Puedo editar un pago ya creado?",
    answer:
      "La edición de pagos es limitada para mantener la trazabilidad financiera. Puedes cambiar las notas y, en pagos pendientes, regenerar el enlace de Stripe o marcarlo como PAGADO. No se recomienda modificar el importe o el concepto de un pago ya enviado al paciente, porque el enlace de Stripe refleja los valores originales. Si necesitas cambiar datos sustanciales, lo más limpio es eliminar el pago y crear uno nuevo desde cero.",
    related: ["pag-35", "pag-37", "pag-46"],
    keywords: ["editar", "modificar", "cambiar", "actualizar"],
  },
  {
    id: "pag-37",
    section: "pagos",
    question: "¿Puedo eliminar un pago?",
    answer:
      "Sí, desde el detalle de cualquier pago encontrarás una opción para eliminarlo. La app te pedirá confirmación antes de proceder porque la acción es irreversible. Si el pago está asociado a un enlace Stripe pendiente, al eliminarlo el enlace sigue existiendo en Stripe pero ya no está vinculado a ningún registro en Annonia, de forma que si se completa igualmente, el webhook no encontrará a qué actualizar. Por eso conviene eliminar solo pagos que aún no se han enviado al paciente.",
    related: ["pag-36", "pag-44", "pag-50"],
    keywords: ["eliminar", "borrar", "quitar", "cancelar"],
  },
  {
    id: "pag-38",
    section: "pagos",
    question: "¿Se gestiona IVA o impuestos en los pagos?",
    answer:
      "No, Annonia no gestiona IVA ni otros impuestos en la sección de Pagos. Los importes que registras son tal cual los cobras, y eres tú como profesional el responsable de aplicar la fiscalidad que corresponda a tu actividad (IRPF, IVA si procede, facturación, etc.). Si necesitas desglosar impuestos, tendrás que hacerlo en el sistema contable o de facturación que uses en paralelo. En el futuro podría añadirse una gestión básica, pero ahora mismo no está soportado.",
    related: ["pag-39", "pag-41", "pag-45"],
    keywords: ["iva", "impuestos", "tax", "fiscalidad"],
  },
  {
    id: "pag-39",
    section: "pagos",
    question: "¿En qué moneda se cobran los pagos?",
    answer:
      "Annonia trabaja exclusivamente en euros (EUR) para todos los pagos, tanto manuales como a través de Stripe. No hay soporte actual para otras monedas como dólares o libras. Si tu actividad requiere cobros en otras divisas, tendrás que gestionarlo fuera de la app. Esta decisión se debe a la orientación inicial del producto al mercado español e iberoamericano con euro, pero podría ampliarse en el futuro.",
    related: ["pag-38", "pag-49"],
    keywords: ["moneda", "euros", "eur", "divisa"],
  },
  {
    id: "pag-40",
    section: "pagos",
    question: "¿Qué comisiones cobra Stripe por cada pago?",
    answer:
      "Stripe aplica sus comisiones estándar de pasarela por cada pago completado con tarjeta: aproximadamente un 1,4% más 0,25€ por transacción para tarjetas europeas, y un 2,9% más 0,25€ para tarjetas no europeas. Estas comisiones las descuenta Stripe directamente del importe antes de transferir el dinero a tu cuenta bancaria. Annonia no añade ninguna comisión adicional por usar la integración. Puedes consultar las tarifas actualizadas en la web oficial de Stripe.",
    related: ["pag-26", "pag-27", "pag-39"],
    keywords: ["comisiones", "fees", "stripe", "coste"],
  },
  {
    id: "pag-41",
    section: "pagos",
    question: "¿Puedo emitir facturas a mis pacientes desde aquí?",
    answer:
      "No, Annonia no emite facturas formales ni tickets fiscales para tus pacientes. La sección Pagos es un registro interno de cobros, no un sistema de facturación. Si necesitas emitir facturas con CIF, numeración correlativa, desglose de IVA, etc., deberás usar un programa de facturación externo (Holded, Contasimple, Quaderno, etc.). Es una funcionalidad que podría incorporarse en el futuro, pero hoy no está soportada.",
    related: ["pag-38", "pag-45"],
    keywords: ["facturas", "facturación", "invoice", "factura"],
  },
  {
    id: "pag-42",
    section: "pagos",
    question: "¿Recibo notificaciones cuando un paciente paga?",
    answer:
      "Sí, cuando el webhook de Stripe confirma que un paciente ha completado el pago, se dispara automáticamente una notificación PAGO_RECIBIDO en tu centro de notificaciones. Aparece con el paciente, el concepto y el importe cobrado. Es la forma rápida de enterarte de cobros sin tener que revisar el listado constantemente. También se dispara PAGO_PENDIENTE al crear el pago con enlace y PAGO_FALLIDO si el cobro no se completa.",
    related: ["pag-32", "pag-34", "pag-47"],
    keywords: ["notificaciones", "aviso", "pago recibido", "alerta"],
  },
  {
    id: "pag-43",
    section: "pagos",
    question: "¿Puedo ordenar el listado por fecha o importe?",
    answer:
      "Sí, el listado se puede ordenar haciendo clic en las cabeceras de las columnas fecha e importe. Por defecto aparece ordenado por fecha descendente (los más recientes primero). Al pulsar una cabecera cambia el orden, y al pulsarla de nuevo invierte la dirección (ascendente/descendente). El ordenamiento se combina con los filtros activos. Es útil para identificar rápidamente los pagos de mayor valor o los cobros más antiguos pendientes.",
    related: ["pag-9", "pag-10", "pag-11"],
    keywords: ["ordenar", "fecha", "importe", "sort"],
  },
  {
    id: "pag-44",
    section: "pagos",
    question: "¿Qué pasa con los pagos si elimino un paciente?",
    answer:
      "Si eliminas un paciente desde su ficha, los pagos asociados a él no se borran: se conservan en el sistema pero quedan sin paciente asignado, apareciendo con el campo paciente vacío en el listado. Esto es así para preservar la trazabilidad financiera: los cobros que recibiste siguen siendo parte de tu histórico aunque la persona ya no esté en tu cartera. Si quieres eliminar también los pagos, tendrás que borrarlos uno a uno manualmente.",
    related: ["pag-17", "pag-37"],
    keywords: ["eliminar paciente", "conservar", "histórico", "huérfano"],
  },
  {
    id: "pag-45",
    section: "pagos",
    question: "¿Puedo exportar los pagos a CSV o Excel?",
    answer:
      "Actualmente no existe una opción nativa para exportar los pagos a CSV, Excel u otros formatos desde la app. Es una funcionalidad planteada en la hoja de ruta pero aún no implementada. Si necesitas llevar los datos a un sistema externo (contabilidad, asesor fiscal), puedes copiarlos manualmente del listado o, en casos concretos, pedir al equipo de soporte una exportación puntual. Estamos trabajando para incorporarla próximamente.",
    related: ["pag-41", "pag-46"],
    keywords: ["exportar", "csv", "excel", "descargar"],
  },
  {
    id: "pag-46",
    section: "pagos",
    question: "¿Se integra Pagos con algún software de contabilidad?",
    answer:
      "No, Annonia no tiene integraciones directas con software de contabilidad como Holded, Quaderno, Contasimple o similares. La sección Pagos es un sistema autónomo para tu control interno. Si quieres sincronizarlo con tu contabilidad, tendrás que introducir los datos manualmente en el sistema externo. Es una posible mejora de cara al futuro, especialmente si Stripe ya ofrece exportaciones a estos sistemas.",
    related: ["pag-41", "pag-45"],
    keywords: ["contabilidad", "integración", "holded", "quaderno"],
  },
  {
    id: "pag-47",
    section: "pagos",
    question: "¿Puedo enviar recordatorios de pagos pendientes?",
    answer:
      "Actualmente no hay un sistema automático de recordatorios: los pagos en estado PENDIENTE se mantienen así hasta que se completen o los elimines, sin envío automático de emails al paciente. Lo que sí puedes hacer es filtrar por estado PENDIENTE y enviar tú el mensaje o el enlace de pago manualmente por WhatsApp o email. En el roadmap se plantea añadir recordatorios automáticos a X días de antigüedad. Por ahora, el seguimiento es responsabilidad del nutricionista.",
    related: ["pag-22", "pag-30", "pag-42"],
    keywords: ["recordatorio", "pendientes", "seguimiento", "aviso"],
  },
  {
    id: "pag-48",
    section: "pagos",
    question: "¿Se soportan suscripciones o cobros recurrentes?",
    answer:
      "No, actualmente Annonia no soporta suscripciones recurrentes ni cobros automáticos mensuales a pacientes. Cada pago es un evento único que creas manualmente. Si cobras un plan mensual, tendrás que generar un pago nuevo cada mes con su propio enlace de Stripe. Es una funcionalidad pedida por varios nutricionistas que se está evaluando para futuras versiones, probablemente apoyándose en Stripe Billing. Por ahora todo es puntual.",
    related: ["pag-15", "pag-41"],
    keywords: ["suscripción", "recurrente", "mensual", "periódico"],
  },
  {
    id: "pag-49",
    section: "pagos",
    question: "¿Hay límites mínimos y máximos de importe?",
    answer:
      "El importe mínimo práctico viene marcado por Stripe, que rechaza transacciones por debajo de ciertos céntimos (habitualmente 0,50€ para euros). En pagos manuales puedes registrar cualquier importe, incluso simbólicos. No hay un máximo explícito en Annonia, aunque Stripe tiene límites por transacción según el país y el tipo de cuenta. Los importes admiten hasta dos decimales (céntimos de euro). Si tienes dudas con un importe muy alto, consulta previamente con Stripe.",
    related: ["pag-16", "pag-38", "pag-40"],
    keywords: ["mínimo", "máximo", "importe", "límite"],
  },
  {
    id: "pag-50",
    section: "pagos",
    question: "¿Cómo anulo un pago fallido?",
    answer:
      "Para anular un pago fallido tienes dos caminos: eliminarlo directamente desde su detalle con el botón \"Eliminar\" (desaparece del listado y deja de contar), o regenerar un nuevo enlace de Stripe si quieres darle otra oportunidad al paciente. No existe un estado \"anulado\" específico, así que la anulación pasa por el borrado. Antes de eliminar asegúrate de que el paciente no vaya a pagar el enlace original, porque podría quedar un cobro en Stripe sin reflejo en Annonia. Si hay dudas, contacta con soporte.",
    related: ["pag-23", "pag-34", "pag-37"],
    keywords: ["anular", "fallido", "cancelar", "eliminar"],
  },
];
