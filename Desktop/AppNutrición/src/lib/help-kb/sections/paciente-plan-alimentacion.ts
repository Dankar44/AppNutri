import type { HelpEntry } from "../types";

export const PACIENTE_PLAN_ALIMENTACION_ENTRIES: HelpEntry[] = [
  {
    id: "pa-1",
    section: "paciente-plan-alimentacion",
    question: "¿Qué es la pestaña Plan de alimentación de la ficha del paciente?",
    answer:
      "La pestaña Plan de alimentación muestra el plan dietético activo del paciente dentro de la propia ficha, sin necesidad de salir a /dietas/[id]. Reproduce la misma vista que encontrarías en el detalle de la dieta (resumen semanal, plan por día y análisis) pero integrada en el flujo del paciente para que puedas consultarlo mientras revisas mediciones, seguimiento o consultas.",
    related: ["pa-2", "pa-3", "pa-10"],
    keywords: ["plan de alimentación", "pestaña", "dieta", "ficha paciente", "visualizar"],
  },
  {
    id: "pa-2",
    section: "paciente-plan-alimentacion",
    question: "¿En qué se diferencia Plan de alimentación de Planificación?",
    answer:
      "Planificación es la pestaña donde organizas objetivos, fases y asignaciones de dietas a lo largo del tiempo. Plan de alimentación, en cambio, muestra el contenido concreto del plan dietético del paciente: las comidas, los alimentos y los macros día a día. Planificación contesta a qué plan toca y cuándo, y Plan de alimentación a qué come exactamente cada día.",
    related: ["pa-1", "pa-3"],
    keywords: ["planificación", "diferencia", "plan", "alimentación", "comparar"],
  },
  {
    id: "pa-3",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo llego a la pestaña Plan de alimentación?",
    answer:
      "Abre la ficha del paciente desde el listado de Pacientes y pulsa la pestaña Plan de alimentación en la barra superior. También puedes acceder directamente con la URL /pacientes/[id]?pestana=plan-alimentacion si conoces el identificador del paciente.",
    related: ["pa-1", "pa-2"],
    keywords: ["acceder", "abrir", "navegación", "url", "pestaña"],
  },
  {
    id: "pa-4",
    section: "paciente-plan-alimentacion",
    question: "¿Qué vista se abre por defecto en Plan de alimentación?",
    answer:
      "Al entrar, la pestaña se abre siempre en la vista Plan con el día Lunes seleccionado. Así ves directamente la distribución de comidas del primer día de la semana sin tener que configurar nada. Si cambias al toggle Resumen o Análisis, la vista respetará tu elección mientras permanezcas en la pestaña.",
    related: ["pa-13", "pa-21"],
    keywords: ["defecto", "lunes", "plan", "vista inicial", "abrir"],
  },
  {
    id: "pa-5",
    section: "paciente-plan-alimentacion",
    question: "¿Qué es el selector de dietas que aparece arriba?",
    answer:
      "Es un desplegable situado en la parte superior de la pestaña que lista todas las dietas asociadas al paciente. Desde él eliges cuál quieres visualizar. La dieta activa aparece marcada con un badge Actual y, si seleccionas otra distinta, verás un botón Marcar como dieta actual para promoverla al plan vigente.",
    related: ["pa-6", "pa-7", "pa-8"],
    keywords: ["selector", "dropdown", "dietas", "listado", "elegir"],
  },
  {
    id: "pa-6",
    section: "paciente-plan-alimentacion",
    question: "¿Qué información muestra cada dieta dentro del selector?",
    answer:
      "Cada entrada del desplegable muestra el nombre de la dieta, las kcal objetivo (por ejemplo 1.800 kcal) y, si corresponde, el badge Actual. Esta información permite identificar rápidamente a qué plan corresponde cada línea sin tener que abrir la dieta completa.",
    related: ["pa-5", "pa-7"],
    keywords: ["información", "kcal objetivo", "badge", "nombre", "listado"],
  },
  {
    id: "pa-7",
    section: "paciente-plan-alimentacion",
    question: "¿Qué significa el badge Actual?",
    answer:
      "El badge Actual marca la dieta que el paciente tiene asignada como plan vigente. Solo una dieta puede llevar este distintivo a la vez y es la que verá el paciente en su portal, la que usa el seguimiento diario para contrastar adherencia y la que se cuenta como plan de referencia para recordatorios y notificaciones.",
    related: ["pa-8", "pa-9", "pa-50"],
    keywords: ["badge", "actual", "activa", "vigente", "plan"],
  },
  {
    id: "pa-8",
    section: "paciente-plan-alimentacion",
    question: "¿Para qué sirve el botón Marcar como dieta actual?",
    answer:
      "Al seleccionar una dieta que no es la actual aparece el botón Marcar como dieta actual. Al pulsarlo, esa dieta pasa a ser la vigente del paciente y la que estaba marcada como actual pierde ese estado (sigue existiendo, pero deja de ser la de referencia). Un paciente solo puede tener un plan actual al mismo tiempo.",
    related: ["pa-7", "pa-9", "pa-50"],
    keywords: ["marcar", "dieta actual", "activar", "promover", "botón"],
  },
  {
    id: "pa-9",
    section: "paciente-plan-alimentacion",
    question: "¿Qué ocurre cuando cambio la dieta actual del paciente?",
    answer:
      "Al marcar otra dieta como actual, la plataforma actualiza todos los puntos que dependen del plan vigente: el portal del paciente muestra el nuevo plan, el seguimiento diario se reescribe sobre la nueva estructura de comidas y las notificaciones tipo PLAN_ANTIGUO se recalculan. El plan anterior se mantiene en el listado pero pierde el badge Actual.",
    related: ["pa-8", "pa-50", "pa-68"],
    keywords: ["cambiar", "dieta actual", "portal", "efectos", "sincronizar"],
  },
  {
    id: "pa-10",
    section: "paciente-plan-alimentacion",
    question: "¿Qué significa el contador \"5 dietas\" junto al selector?",
    answer:
      "El contador muestra cuántas dietas tiene asociadas el paciente en total. Si aparece \"5 dietas\" quiere decir que tiene cinco planes creados (actuales o históricos) y que todos están disponibles en el desplegable para consultarlos, compararlos o promover uno como dieta actual.",
    related: ["pa-5", "pa-52"],
    keywords: ["contador", "dietas", "número", "total", "asociadas"],
  },
  {
    id: "pa-11",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo selecciono una dieta distinta del listado?",
    answer:
      "Abre el desplegable de dietas en la parte superior, busca la dieta que quieras ver y pulsa sobre ella. La pestaña se recarga mostrando el resumen, plan o análisis de la dieta elegida, pero sin modificar la que está marcada como actual. Solo cambiarás la dieta vigente si además pulsas Marcar como dieta actual.",
    related: ["pa-5", "pa-8"],
    keywords: ["seleccionar", "elegir", "dieta", "dropdown", "cambiar"],
  },
  {
    id: "pa-12",
    section: "paciente-plan-alimentacion",
    question: "¿Qué son las tabs de días?",
    answer:
      "Debajo del selector de dietas hay una fila de pestañas con ocho opciones: Todas, Lunes, Martes, Miércoles, Jueves, Viernes, Sábado y Domingo. La pestaña Todas muestra el resumen de la semana completa y cada día individual abre la vista detallada de las comidas de esa jornada.",
    related: ["pa-13", "pa-14", "pa-55"],
    keywords: ["tabs", "días", "semana", "lunes", "domingo"],
  },
  {
    id: "pa-13",
    section: "paciente-plan-alimentacion",
    question: "¿Qué hace la pestaña Todas?",
    answer:
      "La pestaña Todas activa automáticamente la vista Resumen, que presenta los siete días de la semana como tarjetas comparables y calcula la media diaria de energía y macronutrientes. Es la vista adecuada para ver de un vistazo si la semana queda equilibrada o si algún día se desvía mucho del objetivo.",
    related: ["pa-12", "pa-21", "pa-22"],
    keywords: ["todas", "resumen", "semana", "vista general", "comparar"],
  },
  {
    id: "pa-14",
    section: "paciente-plan-alimentacion",
    question: "¿Qué ocurre al pulsar sobre un día concreto?",
    answer:
      "Al elegir un día (Lunes, Martes, etc.) la pestaña cambia a la vista Plan con el detalle de las comidas de esa jornada: Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena. Puedes alternar entre Plan y Análisis mientras permanezcas en ese día, pero al volver a Todas se recuperará la vista Resumen.",
    related: ["pa-13", "pa-25", "pa-26"],
    keywords: ["día", "seleccionar", "plan", "detalle", "comidas"],
  },
  {
    id: "pa-15",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo navego rápido entre días?",
    answer:
      "Puedes pulsar directamente sobre cada día en la fila de pestañas. En pantallas estrechas las pestañas hacen scroll horizontal: desliza con el dedo, la rueda del ratón o pulsa las flechas que aparecen a los lados para ver los días que quedan fuera del área visible.",
    related: ["pa-12", "pa-56"],
    keywords: ["navegar", "flechas", "días", "cambiar", "rápido"],
  },
  {
    id: "pa-16",
    section: "paciente-plan-alimentacion",
    question: "¿Qué es el toggle Resumen / Plan / Análisis?",
    answer:
      "Es un conmutador con tres botones que cambia el modo de visualización sin cambiar la dieta ni el día seleccionados. Resumen muestra tarjetas semanales con macros agregados, Plan muestra las comidas y alimentos del día seleccionado, y Análisis despliega gráficos de macros, micronutrientes y hábitos.",
    related: ["pa-17", "pa-18", "pa-19"],
    keywords: ["toggle", "resumen", "plan", "análisis", "vista"],
  },
  {
    id: "pa-17",
    section: "paciente-plan-alimentacion",
    question: "¿Qué muestra exactamente la vista Resumen?",
    answer:
      "La vista Resumen muestra siete tarjetas, una por día de la semana, cada una con las kcal totales, los gramos de grasa, hidratos, proteína y fibra, y la diferencia respecto al objetivo. Encima de las tarjetas aparece la media diaria: el promedio de los siete días para cada macro. Es la forma rápida de comprobar si el plan cumple el objetivo de la semana.",
    related: ["pa-13", "pa-22", "pa-60"],
    keywords: ["resumen", "tarjetas", "media diaria", "macros", "semana"],
  },
  {
    id: "pa-18",
    section: "paciente-plan-alimentacion",
    question: "¿Qué muestra la vista Plan?",
    answer:
      "La vista Plan despliega el día seleccionado con sus seis comidas (Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena). Para cada comida lista los alimentos con cantidad en gramos, una descripción opcional y los macros totales. En la parte superior del día verás los totales agregados de la jornada.",
    related: ["pa-25", "pa-27", "pa-28"],
    keywords: ["vista plan", "comidas", "alimentos", "día", "detalle"],
  },
  {
    id: "pa-19",
    section: "paciente-plan-alimentacion",
    question: "¿Qué muestra la vista Análisis?",
    answer:
      "La vista Análisis presenta gráficos derivados del plan: un pie de reparto de macronutrientes, un bloque de micronutrientes comparados con las DDR, y tarjetas de agua y ejercicio cuando el plan los incorpora. Es la vista adecuada para valorar la calidad nutricional más allá de las kcal totales.",
    related: ["pa-35", "pa-36", "pa-37"],
    keywords: ["análisis", "gráficos", "macros", "micronutrientes", "calidad"],
  },
  {
    id: "pa-20",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo cambiar entre Resumen, Plan y Análisis en cualquier día?",
    answer:
      "Sí. El toggle funciona sobre el día seleccionado. En la pestaña Todas el toggle arranca en Resumen, pero puedes pasar a Análisis para ver los gráficos de la semana entera. En un día concreto arranca en Plan y puedes pasar a Análisis para revisar los macros y micros de ese día.",
    related: ["pa-16", "pa-17", "pa-19"],
    keywords: ["toggle", "cambiar", "vistas", "día", "análisis"],
  },
  {
    id: "pa-21",
    section: "paciente-plan-alimentacion",
    question: "¿Por qué el toggle arranca en Plan cuando entro?",
    answer:
      "Porque la pestaña Plan de alimentación está diseñada para que veas directamente qué come el paciente al abrirla. Arrancar con Plan y el día Lunes es el flujo más habitual: repasar el primer día de la semana. Si prefieres empezar por la foto global, pulsa Todas o cambia el toggle a Resumen.",
    related: ["pa-4", "pa-16"],
    keywords: ["plan", "defecto", "lunes", "vista inicial", "toggle"],
  },
  {
    id: "pa-22",
    section: "paciente-plan-alimentacion",
    question: "¿Qué información incluye la media diaria del Resumen?",
    answer:
      "La media diaria suma los macronutrientes de los siete días y los divide entre siete. Incluye kcal medias, grasas, hidratos, proteína y fibra. Ese promedio es el indicador que debe aproximarse al objetivo calórico del paciente aunque haya días ligeramente por encima y por debajo.",
    related: ["pa-17", "pa-60"],
    keywords: ["media diaria", "promedio", "macros", "kcal", "semana"],
  },
  {
    id: "pa-23",
    section: "paciente-plan-alimentacion",
    question: "¿Qué muestran las 7 tarjetas del Resumen?",
    answer:
      "Cada tarjeta representa un día de la semana y resume sus kcal totales, el reparto en gramos de grasa, hidratos, proteína y fibra, y la diferencia respecto al objetivo diario si está definido. Las tarjetas están dispuestas en una cuadrícula de 7 (una por día) y permiten comparar la distribución entre jornadas de un solo vistazo.",
    related: ["pa-17", "pa-22"],
    keywords: ["cards", "7 tarjetas", "resumen", "día", "comparar"],
  },
  {
    id: "pa-24",
    section: "paciente-plan-alimentacion",
    question: "¿Qué son los macros agregados del día?",
    answer:
      "Los macros agregados son la suma de la energía y los macronutrientes de todas las comidas del día. Aparecen en la cabecera del día en la vista Plan e incluyen Energía (kcal), Grasa (g), H. Carbono (g), Proteína (g) y Fibra (g). Son el total que el paciente ingeriría siguiendo ese día al pie de la letra.",
    related: ["pa-18", "pa-30"],
    keywords: ["macros", "totales", "día", "agregados", "energía"],
  },
  {
    id: "pa-25",
    section: "paciente-plan-alimentacion",
    question: "¿Cuántas comidas tiene cada día en la vista Plan?",
    answer:
      "La vista Plan muestra hasta seis comidas por día: Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena. Si una comida no tiene alimentos asignados aparece igualmente en la estructura, pero con el totalizador a cero. Así puedes distinguir entre una comida deliberadamente vacía y un hueco no contemplado.",
    related: ["pa-18", "pa-26"],
    keywords: ["comidas", "seis", "desayuno", "cena", "recena"],
  },
  {
    id: "pa-26",
    section: "paciente-plan-alimentacion",
    question: "¿Qué es Recena?",
    answer:
      "Recena es la última comida del día, posterior a la cena. Suele usarse en pacientes con entrenamientos nocturnos, horarios rotatorios o necesidad de incrementar ingesta sin cargar la cena principal. Si el plan no la contempla simplemente aparece vacía y no suma macros.",
    related: ["pa-25", "pa-27"],
    keywords: ["recena", "última comida", "nocturna", "extra", "post-cena"],
  },
  {
    id: "pa-27",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo se listan los alimentos dentro de una comida?",
    answer:
      "Cada comida muestra sus alimentos uno debajo del otro con el nombre, la cantidad en gramos y una descripción opcional (forma de preparación, cocción o nota). Al final de la lista se muestran los totales de la comida: energía, grasa, hidratos, proteína y fibra.",
    related: ["pa-25", "pa-28", "pa-29"],
    keywords: ["alimentos", "listado", "gramos", "descripción", "comida"],
  },
  {
    id: "pa-28",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo arrastrar los alimentos para reordenarlos en esta pestaña?",
    answer:
      "No. En la pestaña Plan de alimentación los alimentos se muestran solo para visualización. El drag & drop para reordenar o mover alimentos entre comidas está disponible en el editor principal, en /dietas/[id]/editar. Si necesitas cambiar la estructura del plan, pulsa en Editar para abrir ese editor.",
    related: ["pa-42", "pa-44"],
    keywords: ["drag drop", "arrastrar", "reordenar", "editor", "visualización"],
  },
  {
    id: "pa-29",
    section: "paciente-plan-alimentacion",
    question: "¿Qué indica la descripción del alimento?",
    answer:
      "La descripción es un texto libre que acompaña al alimento para dar instrucciones al paciente: por ejemplo \"a la plancha sin aceite\", \"cortado en dados\" o \"mezclado con yogur\". No afecta a los macros pero se muestra en el portal del paciente y ayuda a que entienda cómo preparar cada receta.",
    related: ["pa-27", "pa-66"],
    keywords: ["descripción", "alimento", "preparación", "nota", "instrucciones"],
  },
  {
    id: "pa-30",
    section: "paciente-plan-alimentacion",
    question: "¿Qué macros muestra cada comida?",
    answer:
      "Cada comida muestra en su totalizador cinco valores: Energía (kcal), Grasa (g), H. Carbono (g), Proteína (g) y Fibra (g). Son la suma de los alimentos incluidos en esa comida y permiten ver, por ejemplo, si el desayuno está cargado de hidratos o si la cena queda baja en proteína.",
    related: ["pa-24", "pa-27", "pa-60"],
    keywords: ["macros", "comida", "kcal", "grasa", "proteína"],
  },
  {
    id: "pa-31",
    section: "paciente-plan-alimentacion",
    question: "¿Qué significa H. Carbono?",
    answer:
      "H. Carbono es la abreviatura de Hidratos de carbono, uno de los tres macronutrientes principales. Se expresa en gramos y representa la suma de azúcares simples, almidones y otros polisacáridos de los alimentos de la comida. En el pie de reparto de la vista Análisis aparece también como hidratos.",
    related: ["pa-30", "pa-35"],
    keywords: ["h. carbono", "hidratos", "carbohidratos", "macronutriente", "gramos"],
  },
  {
    id: "pa-32",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo se muestra la fibra en el plan?",
    answer:
      "La fibra aparece como un valor en gramos dentro del totalizador de cada comida y del día. No se cuenta como kcal energética porque el cuerpo no la absorbe como el resto de hidratos, pero es una métrica relevante para adherencia, saciedad y salud intestinal.",
    related: ["pa-30", "pa-35"],
    keywords: ["fibra", "gramos", "saciedad", "hidratos", "total"],
  },
  {
    id: "pa-33",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo se suman los macros del día?",
    answer:
      "Los macros del día son la suma directa de los macros de cada una de sus seis comidas. El sistema recalcula los totales cada vez que abres la pestaña, por lo que cualquier cambio hecho en el editor se refleja aquí de forma inmediata sin necesidad de recargar manualmente.",
    related: ["pa-24", "pa-30", "pa-60"],
    keywords: ["suma", "macros", "día", "cálculo", "totales"],
  },
  {
    id: "pa-34",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo se calculan los macros semanales?",
    answer:
      "Los macros semanales suman los siete días del plan y dividen entre siete para obtener la media diaria. Esa media es la que se compara con el objetivo del paciente, porque un plan con variabilidad entre días puede equilibrarse a lo largo de la semana aunque días sueltos se desvíen.",
    related: ["pa-22", "pa-33"],
    keywords: ["semanal", "media", "cálculo", "siete días", "promedio"],
  },
  {
    id: "pa-35",
    section: "paciente-plan-alimentacion",
    question: "¿Qué gráfico de macros incluye la vista Análisis?",
    answer:
      "La vista Análisis incluye un gráfico circular (pie) con el reparto de macronutrientes en porcentaje de kcal: grasa, hidratos y proteína. Permite ver de un vistazo si el plan es, por ejemplo, alto en proteína, bajo en hidratos o equilibrado. El porcentaje se calcula multiplicando los gramos por sus factores calóricos (4 kcal/g para hidratos y proteína, 9 kcal/g para grasas).",
    related: ["pa-19", "pa-36"],
    keywords: ["gráfico", "macros", "pie", "porcentaje", "análisis"],
  },
  {
    id: "pa-36",
    section: "paciente-plan-alimentacion",
    question: "¿Qué son las DDR que aparecen en Análisis?",
    answer:
      "DDR significa Dosis Diaria Recomendada. En la vista Análisis cada micronutriente se muestra con el valor aportado por el plan y el porcentaje que representa sobre la DDR de referencia. Así puedes detectar carencias (por debajo del 70 %) o excesos (por encima del 200 %) en el conjunto del día.",
    related: ["pa-35", "pa-37", "pa-61"],
    keywords: ["ddr", "dosis", "recomendada", "micronutrientes", "porcentaje"],
  },
  {
    id: "pa-37",
    section: "paciente-plan-alimentacion",
    question: "¿Cuántos micronutrientes se analizan?",
    answer:
      "El análisis cubre 24 micronutrientes entre vitaminas (A, C, D, E, K, grupo B completo) y minerales (calcio, hierro, magnesio, potasio, zinc, yodo, selenio, fósforo, entre otros). Cada uno se compara con su DDR específica para mostrar el porcentaje alcanzado por el plan.",
    related: ["pa-36", "pa-61"],
    keywords: ["micronutrientes", "24", "vitaminas", "minerales", "análisis"],
  },
  {
    id: "pa-38",
    section: "paciente-plan-alimentacion",
    question: "¿Qué tarjetas de agua y ejercicio aparecen en Análisis?",
    answer:
      "Si el plan incluye objetivo de agua y recomendación de ejercicio, la vista Análisis muestra dos tarjetas informativas: una con los litros diarios recomendados y otra con las pautas de actividad física. Son valores de referencia que se trasladan también al portal del paciente para que los consulte cuando siga el plan.",
    related: ["pa-19", "pa-39"],
    keywords: ["agua", "ejercicio", "hidratación", "análisis", "tarjetas"],
  },
  {
    id: "pa-39",
    section: "paciente-plan-alimentacion",
    question: "¿El plan muestra la recomendación de agua en litros?",
    answer:
      "Sí. Si la dieta tiene configurada una recomendación de hidratación, la vista Análisis muestra los litros diarios sugeridos (por ejemplo 2,5 L). Ese valor se sincroniza con el portal del paciente y con el seguimiento diario, donde el paciente puede registrar cuánta agua ha bebido cada día.",
    related: ["pa-38"],
    keywords: ["agua", "litros", "hidratación", "recomendación", "portal"],
  },
  {
    id: "pa-40",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo editar el plan desde esta pestaña?",
    answer:
      "No directamente. La pestaña Plan de alimentación es de solo lectura: está pensada para consultar el plan mientras trabajas en la ficha del paciente. Para añadir alimentos, crear nuevos días o modificar cantidades debes abrir el editor principal desde el enlace Editar o entrar en /dietas/[id]/editar.",
    related: ["pa-28", "pa-42", "pa-44"],
    keywords: ["editar", "solo lectura", "modificar", "editor", "cambios"],
  },
  {
    id: "pa-41",
    section: "paciente-plan-alimentacion",
    question: "¿Hay botones de IA o Eliminar en esta pestaña?",
    answer:
      "No. Los botones de generación con IA y de eliminación de la dieta no aparecen en esta pestaña. Esas acciones son sensibles y se mantienen exclusivamente en /dietas/[id] para evitar cambios accidentales mientras consultas el plan desde la ficha del paciente.",
    related: ["pa-40", "pa-69"],
    keywords: ["ia", "eliminar", "botones", "acciones", "no disponible"],
  },
  {
    id: "pa-42",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo entro al editor avanzado desde aquí?",
    answer:
      "En la cabecera de la pestaña o junto al nombre de la dieta encontrarás el enlace Editar que abre /dietas/[id]/editar, donde está el editor completo con drag & drop, IA, duplicados y el resto de acciones. Al volver a la ficha del paciente verás los cambios reflejados inmediatamente.",
    related: ["pa-40", "pa-44"],
    keywords: ["editar", "editor", "avanzado", "redirección", "dietas"],
  },
  {
    id: "pa-43",
    section: "paciente-plan-alimentacion",
    question: "¿En qué se diferencia esta pestaña de /dietas/[id]/editar?",
    answer:
      "La pestaña Plan de alimentación es una vista integrada y de solo lectura dentro de la ficha del paciente: muestra el plan para consultarlo. El editor /dietas/[id]/editar, en cambio, es la herramienta de trabajo: permite añadir y reordenar alimentos, usar IA, duplicar comidas y días, eliminar la dieta y guardarla como plantilla.",
    related: ["pa-40", "pa-42"],
    keywords: ["diferencia", "editor", "solo lectura", "editar", "comparar"],
  },
  {
    id: "pa-44",
    section: "paciente-plan-alimentacion",
    question: "¿Duplicar una comida es posible aquí?",
    answer:
      "No desde esta pestaña. Duplicar una comida (por ejemplo copiar el almuerzo del lunes al martes) es una acción del editor principal. En Plan de alimentación solo se consulta el contenido; para duplicar tendrás que abrir /dietas/[id]/editar y usar el menú de acciones de la comida correspondiente.",
    related: ["pa-42", "pa-45"],
    keywords: ["duplicar", "comida", "copiar", "editor", "acciones"],
  },
  {
    id: "pa-45",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo copiar un día a otro?",
    answer:
      "No desde esta pestaña. Copiar un día completo a otro (por ejemplo replicar el lunes en miércoles) está disponible en el editor avanzado. Desde Plan de alimentación solo visualizarás el resultado una vez realices la copia en /dietas/[id]/editar.",
    related: ["pa-44", "pa-46"],
    keywords: ["copiar", "día", "replicar", "editor", "duplicar"],
  },
  {
    id: "pa-46",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo añado un nuevo día al plan?",
    answer:
      "Añadir un día al plan se hace desde el editor avanzado. En esta pestaña solo se muestran los días ya definidos. Si el plan tiene menos de siete días activos, los que falten aparecerán vacíos o no se mostrarán según la configuración. Para crear un día nuevo entra en /dietas/[id]/editar y usa la acción correspondiente.",
    related: ["pa-45", "pa-57"],
    keywords: ["añadir día", "nuevo día", "editor", "crear", "ampliar"],
  },
  {
    id: "pa-47",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo editar un día completo desde aquí?",
    answer:
      "No. La pestaña solo muestra el día tal como está guardado. Editar sus comidas, cambiar cantidades o reordenar alimentos requiere abrir el editor /dietas/[id]/editar. Una vez guardes los cambios allí, la pestaña Plan de alimentación los reflejará sin que tengas que actualizar la página.",
    related: ["pa-40", "pa-42"],
    keywords: ["editar día", "modificar", "editor", "cambios", "visualización"],
  },
  {
    id: "pa-48",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo consultar las notas de cada comida?",
    answer:
      "Sí. Si el editor contempla una nota para la comida (por ejemplo \"preparar la noche anterior\" o \"opción vegetariana\"), la pestaña la muestra debajo del nombre de la comida. Es un texto libre que se traslada al portal del paciente y sirve como instrucción complementaria al listado de alimentos.",
    related: ["pa-29", "pa-49"],
    keywords: ["notas", "comida", "nota", "instrucciones", "visualizar"],
  },
  {
    id: "pa-49",
    section: "paciente-plan-alimentacion",
    question: "¿Se muestran las horas de cada comida?",
    answer:
      "Sí, cuando el plan las define. Si el editor ha fijado una hora orientativa (por ejemplo Desayuno 08:00, Almuerzo 14:00), la pestaña la muestra junto al nombre de la comida. Si el plan no las usa, la comida aparece sin franja horaria y solo con su nombre.",
    related: ["pa-25", "pa-48"],
    keywords: ["horas", "horario", "comida", "hora", "franja"],
  },
  {
    id: "pa-50",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo afecta marcar una dieta como actual al portal del paciente?",
    answer:
      "El portal del paciente solo muestra la dieta marcada como actual. Al promover otra, el paciente verá inmediatamente el nuevo plan al iniciar sesión: nuevas comidas, nuevos alimentos y los nuevos objetivos de agua y ejercicio. Los planes anteriores dejan de mostrarse para evitar confusiones sobre qué debe seguir.",
    related: ["pa-8", "pa-9", "pa-68"],
    keywords: ["dieta actual", "portal", "paciente", "sincronizar", "efectos"],
  },
  {
    id: "pa-51",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo exportar el plan a PDF?",
    answer:
      "Sí. La exportación a PDF se realiza desde la vista completa de la dieta en /dietas/[id], no desde esta pestaña. Desde Plan de alimentación puedes abrir la dieta con el enlace correspondiente y, una vez en su detalle, usar el botón Exportar PDF para obtener un documento listo para imprimir o enviar por email.",
    related: ["pa-42", "pa-52"],
    keywords: ["exportar", "pdf", "imprimir", "documento", "descargar"],
  },
  {
    id: "pa-52",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo comparar dos dietas del mismo paciente?",
    answer:
      "Sí. Cambia la dieta desde el selector para ver el Resumen, Plan o Análisis de cada una. Con el contador \"5 dietas\" sabes cuántos planes tienes disponibles. Abre la dieta A, anota sus kcal y macros, y vuelve al selector para cargar la dieta B y contrastar valores. No hay una vista lado a lado, pero el toggle a Análisis facilita la comparación rápida.",
    related: ["pa-5", "pa-10", "pa-11"],
    keywords: ["comparar", "dietas", "mismo paciente", "dos", "cambiar"],
  },
  {
    id: "pa-53",
    section: "paciente-plan-alimentacion",
    question: "¿Qué pasa si el paciente no tiene ningún plan aún?",
    answer:
      "Si el paciente no tiene dietas asociadas, la pestaña muestra un estado vacío con un mensaje explicativo y un enlace para crear una nueva dieta o asignar una existente. No verás ni el selector ni el toggle hasta que haya al menos un plan, ya sea creado manualmente, desde plantilla o generado con IA.",
    related: ["pa-54", "pa-57"],
    keywords: ["sin plan", "vacío", "primer plan", "crear", "estado"],
  },
  {
    id: "pa-54",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo asigno una primera dieta a un paciente sin plan?",
    answer:
      "Desde el estado vacío de la pestaña Plan de alimentación puedes pulsar Crear dieta (que te lleva a /dietas/nueva con el paciente ya seleccionado) o Asignar dieta existente para elegir un plan previo del listado. Una vez guardada, la pestaña se recarga con el selector, el toggle y la dieta ya marcada como actual.",
    related: ["pa-53"],
    keywords: ["asignar", "crear", "primera dieta", "nueva", "vincular"],
  },
  {
    id: "pa-55",
    section: "paciente-plan-alimentacion",
    question: "¿Se muestran solo los días activos del plan?",
    answer:
      "Sí. Si el plan tiene, por ejemplo, solo cinco días definidos, las pestañas de los dos días sin contenido podrán ocultarse o aparecer marcadas como vacías, según la configuración de la dieta. La pestaña Todas siempre calcula el resumen sobre los días con comidas para no distorsionar la media diaria.",
    related: ["pa-12", "pa-46"],
    keywords: ["días activos", "vacíos", "mostrar", "filtrar", "plan"],
  },
  {
    id: "pa-56",
    section: "paciente-plan-alimentacion",
    question: "¿Cómo se comporta la pestaña en pantallas pequeñas?",
    answer:
      "En móvil la fila de tabs de días hace scroll horizontal: desliza con el dedo para ver Jueves, Viernes, Sábado y Domingo. Las tarjetas del Resumen pasan a columna única y las comidas del día se apilan una encima de otra (layout stacked) para mantener la legibilidad. El selector de dietas se muestra a ancho completo.",
    related: ["pa-15", "pa-58"],
    keywords: ["móvil", "responsive", "scroll", "stacked", "pantalla"],
  },
  {
    id: "pa-57",
    section: "paciente-plan-alimentacion",
    question: "¿Por qué no veo los siete días completos en la fila de pestañas?",
    answer:
      "En pantallas estrechas los siete días no caben en horizontal y la fila se convierte en scroll: solo se muestran los primeros y hay que deslizar para ver el resto. En escritorio deberían verse todos; si falta alguno es porque el plan no lo tiene definido. Añade días desde el editor avanzado si hace falta.",
    related: ["pa-55", "pa-56"],
    keywords: ["días", "no veo", "scroll", "pantalla", "faltan"],
  },
  {
    id: "pa-58",
    section: "paciente-plan-alimentacion",
    question: "¿Qué layout tienen las comidas del día en móvil?",
    answer:
      "En móvil cada comida ocupa todo el ancho y se apila verticalmente: primero Desayuno, después Media mañana, Almuerzo, Merienda, Cena y Recena. Los alimentos dentro de cada comida también aparecen en columna con su cantidad y descripción. El totalizador de la comida queda al final de cada bloque.",
    related: ["pa-25", "pa-56"],
    keywords: ["móvil", "layout", "stacked", "comidas", "vertical"],
  },
  {
    id: "pa-59",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo imprimir el día actual desde esta pestaña?",
    answer:
      "La impresión directa no está disponible desde la pestaña, pero puedes usar la función Imprimir del navegador (Ctrl+P o Cmd+P) para imprimir la vista actual. Para un PDF formateado para el paciente, lo mejor es ir a /dietas/[id] y usar Exportar PDF desde allí.",
    related: ["pa-51"],
    keywords: ["imprimir", "pdf", "navegador", "documento", "día"],
  },
  {
    id: "pa-60",
    section: "paciente-plan-alimentacion",
    question: "¿Qué unidades usan los macros del plan?",
    answer:
      "La energía se muestra en kcal (kilocalorías) y los macronutrientes en gramos: Grasa, H. Carbono, Proteína y Fibra. Todos los totales de comida, día y semana usan las mismas unidades para que puedas comparar cifras sin conversiones. En Análisis el reparto del pie se expresa en porcentaje de kcal.",
    related: ["pa-30", "pa-35"],
    keywords: ["unidades", "kcal", "gramos", "macros", "porcentaje"],
  },
  {
    id: "pa-61",
    section: "paciente-plan-alimentacion",
    question: "¿Qué pasa si un micronutriente está por debajo de la DDR?",
    answer:
      "En la vista Análisis, los micronutrientes por debajo del 70 % de su DDR aparecen resaltados en rojo o ámbar según el umbral. Es una señal de que el plan podría necesitar alimentos con más contenido de esa vitamina o mineral. Un déficit puntual no es grave, pero un patrón repetido merece revisión.",
    related: ["pa-36", "pa-37"],
    keywords: ["déficit", "micro", "ddr", "bajo", "carencia"],
  },
  {
    id: "pa-62",
    section: "paciente-plan-alimentacion",
    question: "¿Qué relación tiene esta pestaña con la IA?",
    answer:
      "Esta pestaña no incluye acciones de IA para evitar modificar el plan por error. La generación y reescritura con IA se hace desde el editor /dietas/[id]/editar. Una vez que la IA propone cambios y tú los aceptas y guardas, los verás reflejados en Plan de alimentación al instante, con macros recalculados.",
    related: ["pa-41", "pa-42"],
    keywords: ["ia", "inteligencia artificial", "generar", "editor", "relación"],
  },
  {
    id: "pa-63",
    section: "paciente-plan-alimentacion",
    question: "¿Qué notificación es PLAN_ANTIGUO?",
    answer:
      "PLAN_ANTIGUO es una notificación que se genera cuando la dieta marcada como actual lleva mucho tiempo sin actualizarse (por ejemplo, más de 60 días). El objetivo es recordarte que revises si ese plan sigue siendo adecuado o conviene renovarlo. Al asignar una nueva dieta como actual o editar la vigente, el contador se reinicia.",
    related: ["pa-9", "pa-64"],
    keywords: ["notificación", "plan antiguo", "aviso", "antigüedad", "revisar"],
  },
  {
    id: "pa-64",
    section: "paciente-plan-alimentacion",
    question: "¿Dónde veo el aviso PLAN_ANTIGUO?",
    answer:
      "Aparece en el panel de notificaciones y también puede reflejarse como badge rojo en la pestaña Plan de alimentación o en el Dashboard. Al entrar en la pestaña y asignar o editar el plan, la notificación se marca como leída automáticamente y el badge desaparece.",
    related: ["pa-63"],
    keywords: ["aviso", "badge", "notificaciones", "plan antiguo", "dashboard"],
  },
  {
    id: "pa-65",
    section: "paciente-plan-alimentacion",
    question: "¿Se actualiza el seguimiento diario si cambio la dieta actual?",
    answer:
      "Sí. El seguimiento diario toma como referencia la dieta marcada como actual. Al cambiarla, las próximas entradas de seguimiento se registrarán sobre la nueva estructura de comidas. Los registros históricos anteriores al cambio mantienen la referencia a la dieta que estaba activa cuando se crearon.",
    related: ["pa-9", "pa-50"],
    keywords: ["seguimiento diario", "cambio", "dieta actual", "referencia", "histórico"],
  },
  {
    id: "pa-66",
    section: "paciente-plan-alimentacion",
    question: "¿La descripción del alimento se muestra al paciente en el portal?",
    answer:
      "Sí. La descripción y las notas son parte del plan que ve el paciente en su portal, porque son instrucciones relevantes (forma de cocción, cantidades orientativas, sustituciones). Si no quieres que algo sea visible al paciente, no lo incluyas como descripción de alimento.",
    related: ["pa-29", "pa-48", "pa-50"],
    keywords: ["descripción", "portal", "paciente", "visible", "instrucciones"],
  },
  {
    id: "pa-67",
    section: "paciente-plan-alimentacion",
    question: "¿Puedo ver qué dietas son antiguas del paciente?",
    answer:
      "Sí. El selector lista todas las dietas, incluidas las que ya no son actuales. La que tiene el badge Actual es la vigente; el resto son históricos o alternativas. Pulsando sobre cualquiera de ellas verás su Resumen, Plan y Análisis sin alterar cuál es la dieta actual del paciente.",
    related: ["pa-5", "pa-10", "pa-52"],
    keywords: ["antiguas", "histórico", "dietas", "anteriores", "listado"],
  },
  {
    id: "pa-68",
    section: "paciente-plan-alimentacion",
    question: "¿Qué ve exactamente el paciente en su portal con la dieta actual?",
    answer:
      "El paciente ve los siete días de la dieta marcada como actual, con sus seis comidas, alimentos, descripciones y horas si están definidas. También ve el objetivo de agua y las recomendaciones de ejercicio. No ve los macros detallados por comida ni los micronutrientes, salvo que así lo indique la configuración del portal del paciente.",
    related: ["pa-50", "pa-66"],
    keywords: ["portal", "paciente", "ve", "visible", "vista"],
  },
  {
    id: "pa-69",
    section: "paciente-plan-alimentacion",
    question: "¿Por qué no aparece el botón Eliminar dieta en esta pestaña?",
    answer:
      "Eliminar una dieta es una acción irreversible que borra el plan completo, sus días y sus comidas. Para prevenir errores accidentales cuando trabajas en la ficha del paciente, la opción solo está disponible en /dietas/[id]. Así tienes que entrar de forma deliberada a la dieta antes de borrarla.",
    related: ["pa-41", "pa-42"],
    keywords: ["eliminar", "borrar", "seguridad", "acciones", "botón"],
  },
  {
    id: "pa-70",
    section: "paciente-plan-alimentacion",
    question: "¿Qué hago si la pestaña no muestra cambios que hice en el editor?",
    answer:
      "Los cambios se reflejan en cuanto guardas en el editor y vuelves a la pestaña. Si no ves la actualización, pulsa otra dieta en el selector y vuelve a la anterior, cambia de toggle (Resumen / Plan / Análisis) o recarga la página. Si persiste el problema comprueba que el editor haya guardado correctamente y que estés mirando la misma dieta en ambos sitios.",
    related: ["pa-40", "pa-42", "pa-47"],
    keywords: ["no actualiza", "cambios", "recargar", "editor", "sincronizar"],
  },
];
