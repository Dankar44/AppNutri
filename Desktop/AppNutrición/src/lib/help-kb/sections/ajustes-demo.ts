import type { HelpEntry } from "../types";

export const AJUSTES_DEMO_ENTRIES: HelpEntry[] = [
  {
    id: "ajd-1",
    section: "ajustes-demo",
    question: "¿Qué es el paciente de ejemplo en Annonia?",
    answer:
      "El paciente de ejemplo es un perfil ficticio que se crea automáticamente al registrarte en Annonia y que aparece mezclado con el resto de tus pacientes. Se identifica internamente por el nombre `Paciente` y los apellidos `Prueba`, y llega con datos precargados como consultas, medidas, plan de alimentación y seguimiento diario. Su función es servir de escaparate para que puedas trastear con todas las funciones de la app sin miedo a romper nada importante. Lo gestionas desde la sección \"Paciente de ejemplo\" dentro de Ajustes a través del componente `<PacienteDemoCard>`.",
    related: ["ajd-2", "ajd-3", "ajd-4"],
    keywords: ["paciente", "ejemplo", "demo", "ficticio"],
  },
  {
    id: "ajd-2",
    section: "ajustes-demo",
    question: "¿Para qué sirve tener un paciente de ejemplo?",
    answer:
      "Sirve principalmente para que puedas probar todas las funciones de Annonia sin afectar a los datos reales de tus pacientes. Puedes editar sus medidas, modificar su plan, crear consultas, enviar mensajes o trastear con el portal del paciente sin preocuparte por romper nada. Es especialmente útil durante los primeros días de uso, cuando aún no tienes pacientes reales dados de alta y quieres explorar cómo se comporta la aplicación. También es un buen apoyo para formaciones internas o para enseñar la herramienta a compañeros.",
    related: ["ajd-1", "ajd-4", "ajd-13"],
    keywords: ["sirve", "probar", "practicar", "sandbox"],
  },
  {
    id: "ajd-3",
    section: "ajustes-demo",
    question: "¿Cómo se identifica al paciente de ejemplo internamente?",
    answer:
      "Annonia reconoce al paciente de ejemplo por la combinación exacta de `nombre='Paciente'` y `apellidos='Prueba'` dentro del modelo `Paciente`. Esta convención se utiliza en todas las consultas de base de datos que deben tratar a este perfil de forma especial, como la exclusión del conteo total de pacientes o la muestra del badge amarillo. Si editas el nombre o los apellidos del paciente demo, dejará de ser reconocido como tal y pasará a comportarse como un paciente normal. Por eso recomendamos no renombrarlo salvo que quieras convertirlo en un caso real.",
    related: ["ajd-1", "ajd-6", "ajd-7"],
    keywords: ["identificación", "nombre", "apellidos", "convención"],
  },
  {
    id: "ajd-4",
    section: "ajustes-demo",
    question: "¿Qué datos precargados trae el paciente de ejemplo?",
    answer:
      "El paciente demo viene con un conjunto realista de datos para que puedas explorar cada sección sin tener que rellenar nada. Incluye varias consultas pasadas y alguna próxima, un histórico de medidas antropométricas como peso e IMC, un plan de alimentación completo con comidas reparti­das a lo largo del día, registros de seguimiento diario y pagos de ejemplo con diferentes estados (pagado y pendiente). También tiene notas clínicas y archivos asociados para que compruebes cómo se visualizan los entregables. En conjunto simula un caso típico con el que podrás practicar flujos completos.",
    related: ["ajd-1", "ajd-2", "ajd-5"],
    keywords: ["datos", "precargados", "consultas", "medidas", "plan", "pagos"],
  },
  {
    id: "ajd-5",
    section: "ajustes-demo",
    question: "¿Por qué las fechas del paciente de ejemplo siempre parecen recientes?",
    answer:
      "Porque los datos del paciente demo se auto-alinean al mes actual cada vez que los consultas. Annonia recalcula las fechas de consultas, medidas y seguimiento para que caigan dentro del mes en curso, de modo que siempre tengas registros \"frescos\" sin importar cuándo te registraste. Esto hace que el paciente de ejemplo sea útil tanto el primer día como meses después. También evita que las gráficas aparezcan vacías por tener datos demasiado antiguos y facilita probar filtros temporales.",
    related: ["ajd-4", "ajd-8", "ajd-9"],
    keywords: ["auto-alineación", "fechas", "mes actual", "realista"],
  },
  {
    id: "ajd-6",
    section: "ajustes-demo",
    question: "¿Cómo distingo visualmente al paciente de ejemplo en el listado?",
    answer:
      "En la sección `/pacientes` el paciente de ejemplo aparece con un badge amarillo etiquetado como \"Ejemplo\" junto a su nombre. Este distintivo te recuerda en todo momento que se trata de un perfil ficticio y evita confusiones al mezclarlo con pacientes reales. El badge también se muestra en la cabecera de su ficha clínica cuando la abres. Visualmente utiliza el color ámbar/amarillo para diferenciarse del resto de etiquetas de estado.",
    related: ["ajd-3", "ajd-7", "ajd-8"],
    keywords: ["badge", "amarillo", "ejemplo", "listado"],
  },
  {
    id: "ajd-7",
    section: "ajustes-demo",
    question: "¿El paciente de ejemplo cuenta en la gráfica del dashboard?",
    answer:
      "No, el paciente de ejemplo queda excluido del conteo de pacientes totales que se muestra en la gráfica principal del dashboard. El filtro aplica por `nombre='Paciente'` y `apellidos='Prueba'`, de modo que no infla las métricas de crecimiento de tu negocio. Si tienes dos pacientes reales y el demo, la gráfica reflejará \"2\" y no \"3\". Esto se hace así para que tus estadísticas representen siempre tu base real de clientes.",
    related: ["ajd-3", "ajd-8", "ajd-11"],
    keywords: ["dashboard", "gráfica", "conteo", "exclusión"],
  },
  {
    id: "ajd-8",
    section: "ajustes-demo",
    question: "¿Se incluye al paciente de ejemplo en las métricas generales?",
    answer:
      "En la mayoría de métricas agregadas el paciente demo queda excluido para no distorsionar los números de tu consulta. Esto afecta al conteo de pacientes activos, al total histórico y a algunos KPIs del dashboard. Sin embargo, sí aparece en el listado `/pacientes` y en la agenda si le creas citas, porque esas vistas necesitan mostrarlo para que puedas interactuar con él. La regla general es: donde se miden resultados de negocio, se excluye; donde se trabaja operativamente, se ve.",
    related: ["ajd-6", "ajd-7", "ajd-11"],
    keywords: ["métricas", "exclusión", "kpi", "estadísticas"],
  },
  {
    id: "ajd-9",
    section: "ajustes-demo",
    question: "¿Cómo se ve la tarjeta de paciente de ejemplo cuando está activo?",
    answer:
      "Cuando el paciente demo existe en tu cuenta, la tarjeta en Ajustes muestra un mensaje informativo acompañado de un icono de chispitas (sparkles) que indica que es un perfil especial. Explica brevemente qué es el paciente de ejemplo y para qué sirve. En la esquina de la tarjeta verás un botón \"Ver ficha\" que te lleva directamente a `/pacientes?busqueda=Paciente+Prueba`, con el buscador ya filtrado para encontrarlo al instante. Desde ahí puedes abrir la ficha y empezar a trastear.",
    related: ["ajd-1", "ajd-10", "ajd-12"],
    keywords: ["tarjeta", "activo", "sparkles", "ver ficha"],
  },
  {
    id: "ajd-10",
    section: "ajustes-demo",
    question: "¿Cómo se ve la tarjeta cuando he eliminado al paciente de ejemplo?",
    answer:
      "Si has eliminado al paciente demo, la tarjeta en Ajustes cambia a un estilo de color ámbar con el mensaje \"Eliminaste el paciente de ejemplo\". Debajo aparece un botón \"Restaurar\" que, al pulsarlo, ejecuta la acción `restaurarPacienteDemo` y vuelve a crear el perfil con todos sus datos precargados. El cambio de color avisa de forma clara de que hay una acción pendiente o disponible. Es la única forma desde la interfaz de recuperar al paciente demo una vez borrado.",
    related: ["ajd-9", "ajd-11", "ajd-12"],
    keywords: ["eliminado", "ámbar", "restaurar", "tarjeta"],
  },
  {
    id: "ajd-11",
    section: "ajustes-demo",
    question: "¿Cómo elimino al paciente de ejemplo?",
    answer:
      "Puedes eliminar al paciente demo igual que a cualquier otro paciente: entrando en su ficha desde `/pacientes` y usando la opción de eliminar. También sirve el botón \"Ver ficha\" del componente `<PacienteDemoCard>` para llegar rápido. Al borrarlo se eliminan también todas sus consultas, medidas, plan y datos asociados, igual que con un paciente real. Después la tarjeta en Ajustes se actualizará mostrando el estado ámbar con la opción de restaurarlo si cambias de idea.",
    related: ["ajd-9", "ajd-10", "ajd-12"],
    keywords: ["eliminar", "borrar", "paciente", "demo"],
  },
  {
    id: "ajd-12",
    section: "ajustes-demo",
    question: "¿Cómo restauro al paciente de ejemplo desde Ajustes?",
    answer:
      "Ve a la sección \"Paciente de ejemplo\" dentro de Ajustes y, si la tarjeta está en estado ámbar (eliminado), pulsa el botón \"Restaurar\". La acción `restaurarPacienteDemo` se encarga de volver a crear el perfil con su nombre `Paciente Prueba`, sus consultas, medidas, plan y seguimiento, todo auto-alineado al mes actual. En unos segundos la tarjeta pasará al estado activo y el paciente volverá a aparecer en tu listado con el badge amarillo. Puedes restaurarlo las veces que quieras.",
    related: ["ajd-10", "ajd-11", "ajd-15"],
    keywords: ["restaurar", "recuperar", "botón", "ajustes"],
  },
  {
    id: "ajd-13",
    section: "ajustes-demo",
    question: "¿Antes no estaba este banner en la sección Pacientes?",
    answer:
      "Sí, en versiones anteriores la tarjeta del paciente de ejemplo se mostraba como un banner dentro de `/pacientes`, justo encima del listado. Lo hemos movido a Ajustes dentro de su propia sección \"Paciente de ejemplo\" para no ensuciar la vista principal de gestión de pacientes y reservar ese espacio a tu trabajo real. Ahora el listado es más limpio y las acciones sobre el demo quedan agrupadas junto al resto de configuraciones de cuenta. La funcionalidad es la misma, sólo ha cambiado la ubicación.",
    related: ["ajd-9", "ajd-10", "ajd-14"],
    keywords: ["banner", "antes", "ubicación", "cambio"],
  },
  {
    id: "ajd-14",
    section: "ajustes-demo",
    question: "¿Y si ya no quiero ver al paciente de ejemplo nunca más?",
    answer:
      "Si quieres deshacerte definitivamente del paciente demo, simplemente elimínalo desde su ficha y no pulses el botón \"Restaurar\" de Ajustes. La tarjeta seguirá visible con el estado ámbar como recordatorio de que está disponible, pero puedes ignorarla sin consecuencias. Tu cuenta funcionará con normalidad y las métricas se basarán únicamente en tus pacientes reales. Si también prefieres datos más serios en tus pruebas, crea pacientes reales con nombres ficticios propios en lugar de usar el demo.",
    related: ["ajd-10", "ajd-11", "ajd-15"],
    keywords: ["no quiero", "ocultar", "definitivo", "ignorar"],
  },
  {
    id: "ajd-15",
    section: "ajustes-demo",
    question: "¿Puedo tener más de un paciente de ejemplo por cuenta?",
    answer:
      "No, el sistema está diseñado para que exista como máximo un paciente de ejemplo por cuenta de dietista. La acción `restaurarPacienteDemo` comprueba antes si ya existe un `Paciente Prueba` asociado a tu usuario y, si lo hay, no crea un duplicado. Si necesitas trabajar con más casos ficticios, lo recomendable es crear pacientes reales con nombres inventados y tratarlos como tus propios \"demos\" personalizados. Así podrás tener tantos como quieras sin chocar con el límite del paciente de ejemplo oficial.",
    related: ["ajd-1", "ajd-12", "ajd-14"],
    keywords: ["límite", "uno", "único", "duplicado"],
  },
];
