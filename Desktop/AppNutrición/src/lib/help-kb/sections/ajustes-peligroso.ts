import type { HelpEntry } from "../types";

export const AJUSTES_PELIGROSO_ENTRIES: HelpEntry[] = [
  {
    id: "ajz-1",
    section: "ajustes-peligroso",
    question: "¿Qué es la sección Zona peligrosa de Ajustes?",
    answer:
      "La Zona peligrosa es el área de Ajustes que agrupa las acciones irreversibles y definitivas sobre tu cuenta de Annonia. Está pensada para operaciones que no se pueden deshacer y que afectan a todos tus datos a la vez. Se separa del resto de ajustes para evitar pulsaciones accidentales y para dejar claro que lo que hagas aquí tiene consecuencias permanentes. Actualmente contiene únicamente la acción Eliminar cuenta, representada por el componente `<EliminarCuentaButton>`.",
    related: ["ajz-2", "ajz-3", "ajz-5"],
    keywords: ["zona peligrosa", "ajustes", "sección", "irreversible"],
  },
  {
    id: "ajz-2",
    section: "ajustes-peligroso",
    question: "¿Por qué se llama Zona peligrosa?",
    answer:
      "Se llama Zona peligrosa porque las acciones que contiene no tienen vuelta atrás y afectan a la totalidad de tu cuenta. El nombre es una convención habitual en aplicaciones profesionales para separar visualmente lo crítico del resto de opciones cotidianas. Suele presentarse con colores de advertencia (rojo o ámbar) y textos claros que describen el impacto real de cada botón. Así se reduce el riesgo de eliminar información por error al confundirla con un ajuste normal.",
    related: ["ajz-1", "ajz-3", "ajz-6"],
    keywords: ["nombre", "peligrosa", "crítico", "advertencia"],
  },
  {
    id: "ajz-3",
    section: "ajustes-peligroso",
    question: "¿Qué hace la acción Eliminar cuenta?",
    answer:
      "La acción Eliminar cuenta borra de forma definitiva tu usuario de Annonia junto con toda la información asociada a él. Se ejecuta desde el botón `<EliminarCuentaButton>` ubicado en la Zona peligrosa de Ajustes. Al pulsarla se abre un modal de confirmación donde debes aceptar explícitamente antes de que se aplique el borrado. Una vez confirmada, la cuenta deja de existir y no podrás volver a acceder con el mismo correo.",
    related: ["ajz-1", "ajz-4", "ajz-6"],
    keywords: ["eliminar", "cuenta", "borrar", "acción"],
  },
  {
    id: "ajz-4",
    section: "ajustes-peligroso",
    question: "¿Qué datos se borran exactamente al eliminar la cuenta?",
    answer:
      "Al eliminar la cuenta se borra absolutamente todo lo que hayas generado en Annonia. Esto incluye tus pacientes, sus consultas, mediciones y seguimientos, así como las dietas, recetas propias y planificaciones asociadas. También se eliminan las citas de la agenda, los mensajes intercambiados con pacientes, los pagos registrados, las integraciones conectadas y la propia suscripción. En la práctica, no queda ningún rastro de contenido que puedas volver a consultar desde la aplicación.",
    related: ["ajz-3", "ajz-5", "ajz-9"],
    keywords: ["datos", "borrar", "pacientes", "contenido"],
  },
  {
    id: "ajz-5",
    section: "ajustes-peligroso",
    question: "¿La eliminación de cuenta es realmente irreversible?",
    answer:
      "Sí, eliminar la cuenta es una operación totalmente irreversible desde la aplicación. No existe una papelera ni un período de gracia que permita recuperar los datos una vez confirmada la acción. El sistema ejecuta el borrado en cascada sobre todas las entidades relacionadas y no guarda copias accesibles para el usuario. Por eso la opción se sitúa en la Zona peligrosa y exige pasar por un modal de confirmación antes de completarse.",
    related: ["ajz-3", "ajz-6", "ajz-10"],
    keywords: ["irreversible", "permanente", "recuperar", "definitivo"],
  },
  {
    id: "ajz-6",
    section: "ajustes-peligroso",
    question: "¿Cómo funciona el modal de confirmación al eliminar la cuenta?",
    answer:
      "Cuando pulsas `<EliminarCuentaButton>` aparece un modal de confirmación que explica qué va a ocurrir si continúas. El modal muestra una advertencia clara sobre el carácter irreversible de la acción y lista el tipo de información que se perderá. Para seguir adelante tienes que pulsar el botón de confirmación; si cierras el modal o pulsas cancelar, la cuenta queda intacta. Este paso adicional está diseñado para evitar eliminaciones por error y darte una última oportunidad de reconsiderarlo.",
    related: ["ajz-3", "ajz-5", "ajz-1"],
    keywords: ["modal", "confirmación", "cancelar", "ventana"],
  },
  {
    id: "ajz-7",
    section: "ajustes-peligroso",
    question: "¿Puedo exportar todos mis datos antes de eliminar la cuenta?",
    answer:
      "De momento Annonia no ofrece una exportación masiva de todos tus datos desde la Zona peligrosa. No hay un botón único que descargue un archivo con pacientes, dietas, consultas y resto de información en conjunto. Como alternativa puedes descargar los PDFs individuales de cada paciente desde su ficha (plan, consulta, mediciones) antes de pulsar Eliminar cuenta. También puedes solicitar una exportación por escrito contactando con soporte si necesitas una copia para tus registros profesionales.",
    related: ["ajz-4", "ajz-8", "ajz-9"],
    keywords: ["exportar", "datos", "descargar", "copia"],
  },
  {
    id: "ajz-8",
    section: "ajustes-peligroso",
    question: "¿Puedo desactivar mi cuenta de forma temporal en lugar de eliminarla?",
    answer:
      "Actualmente Annonia no dispone de una opción para desactivar la cuenta de manera temporal. La única acción destructiva disponible en la Zona peligrosa es Eliminar cuenta, que borra los datos de forma permanente. Si no quieres seguir pagando pero deseas conservar la información, valora cancelar la suscripción desde Ajustes > Suscripción y mantener la cuenta en el plan que quede disponible. Desactivar cuenta temporalmente es una funcionalidad candidata a añadirse en el futuro, pero hoy no está soportada.",
    related: ["ajz-1", "ajz-3", "ajz-7"],
    keywords: ["desactivar", "temporal", "pausar", "suspender"],
  },
  {
    id: "ajz-9",
    section: "ajustes-peligroso",
    question: "¿Cómo se relaciona Eliminar cuenta con el derecho al olvido del RGPD?",
    answer:
      "Eliminar cuenta es la vía directa para ejercer el derecho al olvido previsto por el RGPD desde la propia aplicación. Al confirmar la acción, se borran tus datos personales y los de tus pacientes asociados a tu cuenta sin necesidad de enviar una solicitud adicional. Si prefieres una gestión formal por escrito, también puedes contactar con soporte y solicitar expresamente la supresión de tus datos. Ten en cuenta que, por obligaciones legales, algunos registros anonimizados (por ejemplo, facturas) pueden conservarse el tiempo que exija la normativa fiscal.",
    related: ["ajz-4", "ajz-5", "ajz-7"],
    keywords: ["rgpd", "derecho al olvido", "privacidad", "protección de datos"],
  },
  {
    id: "ajz-10",
    section: "ajustes-peligroso",
    question: "¿Puedo recuperar una cuenta eliminada?",
    answer:
      "No, una cuenta eliminada no se puede recuperar desde Annonia. Una vez confirmado el borrado en el modal, los datos se eliminan de forma permanente y no existe un proceso de restauración disponible para el usuario. Si más adelante quieres volver a usar la aplicación, deberás crear una cuenta nueva desde cero con el registro habitual. Por este motivo, conviene descargar los PDFs de tus pacientes y revisar tu suscripción antes de pulsar Eliminar cuenta.",
    related: ["ajz-3", "ajz-5", "ajz-7"],
    keywords: ["recuperar", "restaurar", "volver", "deshacer"],
  },
];
