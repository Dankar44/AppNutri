import type { HelpEntry } from "../types";

export const PACIENTE_MEDICIONES_ENTRIES: HelpEntry[] = [
  {
    id: "med-1",
    section: "paciente-mediciones",
    question: "¿Qué es la pestaña Mediciones de la ficha del paciente?",
    answer:
      "La pestaña Mediciones centraliza todas las medidas antropométricas del paciente: peso, altura, IMC, porcentaje de grasa, masa muscular, agua corporal, grasa visceral y perímetros. Desde aquí registras nuevas mediciones, consultas el histórico y visualizas la evolución en gráficas.",
    related: ["med-2", "med-3", "med-52"],
    keywords: ["mediciones", "pestaña", "antropometría", "ficha paciente", "medidas"],
  },
  {
    id: "med-2",
    section: "paciente-mediciones",
    question: "¿Cómo accedo a la pestaña Mediciones?",
    answer:
      "Entra en la ficha del paciente desde el listado de Pacientes y selecciona la pestaña Mediciones. También puedes abrirla directamente con la URL /pacientes/[id]?pestana=mediciones si conoces el identificador del paciente.",
    related: ["med-1", "med-3"],
    keywords: ["acceder", "abrir", "pestaña", "url", "navegación"],
  },
  {
    id: "med-3",
    section: "paciente-mediciones",
    question: "¿Cómo registro una nueva medida?",
    answer:
      "En la parte lateral encontrarás el formulario de Nueva medida. Introduce los valores que quieras guardar (al menos uno), confirma la fecha (por defecto hoy) y pulsa Guardar. La medida aparecerá inmediatamente en el histórico y en las gráficas si ya hay al menos dos registros.",
    related: ["med-4", "med-5", "med-14"],
    keywords: ["nueva medida", "registrar", "formulario", "guardar", "crear"],
  },
  {
    id: "med-4",
    section: "paciente-mediciones",
    question: "¿Es obligatorio rellenar todos los campos al registrar una medida?",
    answer:
      "No. Solo necesitas rellenar los campos de los que dispongas de datos. Si el paciente solo se ha pesado puedes guardar únicamente el peso; si la báscula de bioimpedancia te da varios valores, rellena todos los que tengas. Los campos vacíos no se incluirán en las gráficas para esa fecha.",
    related: ["med-3", "med-39", "med-40"],
    keywords: ["campos obligatorios", "vacío", "opcional", "parcial", "rellenar"],
  },
  {
    id: "med-5",
    section: "paciente-mediciones",
    question: "¿Qué campo introduzco en Peso?",
    answer:
      "En Peso introduce el peso corporal del paciente en kilogramos. Admite decimales (por ejemplo 68,4 kg). Es el campo más usado y el que alimenta la gráfica de evolución de peso y el cálculo automático del IMC.",
    related: ["med-6", "med-11", "med-12"],
    keywords: ["peso", "kg", "kilogramos", "corporal", "báscula"],
  },
  {
    id: "med-6",
    section: "paciente-mediciones",
    question: "¿Qué introduzco en Altura?",
    answer:
      "En Altura introduce la talla del paciente en centímetros (por ejemplo 172 cm). Solo es necesario medirla una vez en adultos, pero puedes actualizarla si el paciente crece o si quieres ajustar el dato. La altura se usa para calcular automáticamente el IMC.",
    related: ["med-5", "med-11", "med-13"],
    keywords: ["altura", "talla", "cm", "centímetros", "imc"],
  },
  {
    id: "med-7",
    section: "paciente-mediciones",
    question: "¿Qué es el porcentaje de grasa corporal?",
    answer:
      "El porcentaje de grasa corporal (%grasa) indica qué proporción del peso total corresponde a tejido adiposo. Se obtiene normalmente con una báscula de bioimpedancia, plicómetro o análisis de composición corporal. Introduce el valor sin el símbolo %, por ejemplo 22,5.",
    related: ["med-8", "med-39", "med-56"],
    keywords: ["grasa corporal", "% grasa", "porcentaje", "bioimpedancia", "composición"],
  },
  {
    id: "med-8",
    section: "paciente-mediciones",
    question: "¿Qué es la masa muscular?",
    answer:
      "La masa muscular representa los kilogramos de tejido muscular del paciente. Se introduce en kg y suele obtenerse de una báscula de bioimpedancia. Es una métrica clave en objetivos de ganancia muscular o de conservación de masa en procesos de pérdida de peso.",
    related: ["med-7", "med-39", "med-57"],
    keywords: ["masa muscular", "músculo", "kg", "bioimpedancia", "ganancia"],
  },
  {
    id: "med-9",
    section: "paciente-mediciones",
    question: "¿Qué introduzco en Agua corporal?",
    answer:
      "Agua corporal es el porcentaje de agua total del organismo. Un valor típico en adultos sanos oscila entre 50 % y 65 %. Introduce el valor sin el símbolo % (por ejemplo 58,2). El dato suele proceder de una báscula de bioimpedancia.",
    related: ["med-7", "med-8", "med-39"],
    keywords: ["agua corporal", "hidratación", "porcentaje", "bioimpedancia", "%"],
  },
  {
    id: "med-10",
    section: "paciente-mediciones",
    question: "¿Qué es la grasa visceral y cómo se registra?",
    answer:
      "La grasa visceral es la que rodea los órganos internos. Las básculas la suelen expresar en un índice numérico (por ejemplo de 1 a 30). Valores altos se asocian a mayor riesgo metabólico. Introduce el número tal como lo indica la báscula, sin unidades.",
    related: ["med-7", "med-39", "med-56"],
    keywords: ["grasa visceral", "índice", "riesgo", "abdominal", "bioimpedancia"],
  },
  {
    id: "med-11",
    section: "paciente-mediciones",
    question: "¿Cómo se calcula el IMC?",
    answer:
      "El IMC (Índice de Masa Corporal) se calcula automáticamente al guardar peso y altura con la fórmula IMC = peso (kg) / altura (m)². No tienes que introducirlo manualmente: la aplicación lo recalcula cada vez que actualizas peso o altura.",
    related: ["med-12", "med-13", "med-27"],
    keywords: ["imc", "cálculo", "automático", "fórmula", "índice masa corporal"],
  },
  {
    id: "med-12",
    section: "paciente-mediciones",
    question: "¿Qué es el IMC y para qué sirve?",
    answer:
      "El IMC es un indicador estándar que relaciona peso y altura para estimar si la persona está en normopeso, bajo peso o sobrepeso. Es orientativo: no distingue entre masa grasa y muscular, por lo que conviene interpretarlo junto al %grasa y los perímetros.",
    related: ["med-11", "med-13", "med-55"],
    keywords: ["imc", "definición", "utilidad", "orientativo", "indicador"],
  },
  {
    id: "med-13",
    section: "paciente-mediciones",
    question: "¿Cómo se interpreta el IMC?",
    answer:
      "La OMS clasifica el IMC así: bajo peso si es menor de 18,5; normopeso entre 18,5 y 24,9; sobrepeso entre 25 y 29,9; obesidad a partir de 30. Recuerda que es una referencia general y no sustituye a una valoración completa de composición corporal.",
    related: ["med-11", "med-12", "med-55"],
    keywords: ["imc", "interpretación", "bajo peso", "normopeso", "sobrepeso", "obesidad"],
  },
  {
    id: "med-14",
    section: "paciente-mediciones",
    question: "¿Por defecto qué fecha tiene la medida?",
    answer:
      "El selector de fecha se rellena automáticamente con la fecha de hoy. Si quieres registrar una medida antigua del histórico, cambia la fecha en el campo antes de guardar. La fecha aparecerá en el listado y en el eje X de las gráficas.",
    related: ["med-15", "med-16", "med-50"],
    keywords: ["fecha", "por defecto", "hoy", "cambiar fecha", "histórico"],
  },
  {
    id: "med-15",
    section: "paciente-mediciones",
    question: "¿Puedo registrar una medida con fecha pasada?",
    answer:
      "Sí. Abre el selector de fecha en el formulario y elige el día que necesites. Es útil para cargar el histórico inicial del paciente o para registrar una medida que olvidaste introducir el día que se tomó.",
    related: ["med-14", "med-16", "med-66"],
    keywords: ["fecha pasada", "retroactivo", "histórico", "ayer", "anterior"],
  },
  {
    id: "med-16",
    section: "paciente-mediciones",
    question: "¿Puedo registrar una medida con fecha futura?",
    answer:
      "No. El sistema no permite registrar mediciones con fecha posterior a hoy porque no tiene sentido clínico y distorsionaría el eje temporal de las gráficas. Solo se aceptan fechas iguales o anteriores al día actual.",
    related: ["med-14", "med-15"],
    keywords: ["fecha futura", "no permitido", "mañana", "restricción", "validación"],
  },
  {
    id: "med-17",
    section: "paciente-mediciones",
    question: "¿Qué perímetros puedo registrar?",
    answer:
      "En el formulario de mediciones dispones de los siguientes perímetros en centímetros: cintura, cadera, brazo derecho, brazo izquierdo, muslo, pecho, pantorrilla y circunferencia de cuello. Rellena solo los que tomes en cada consulta.",
    related: ["med-18", "med-19", "med-54"],
    keywords: ["perímetros", "cm", "circunferencias", "cintura", "cadera", "brazo"],
  },
  {
    id: "med-18",
    section: "paciente-mediciones",
    question: "¿Cómo registro el perímetro de cintura?",
    answer:
      "Mide con cinta métrica a la altura del ombligo, con el paciente relajado y sin contraer abdomen, e introduce el valor en centímetros en el campo Cintura. Es un indicador clave de grasa abdominal y riesgo cardiometabólico.",
    related: ["med-17", "med-19", "med-54"],
    keywords: ["cintura", "perímetro", "abdomen", "ombligo", "riesgo"],
  },
  {
    id: "med-19",
    section: "paciente-mediciones",
    question: "¿Cómo registro el perímetro de cadera?",
    answer:
      "Mide la cadera a la altura de la zona más prominente de los glúteos con el paciente de pie y los pies juntos. Introduce el valor en centímetros en el campo Cadera. Junto con la cintura permite calcular el índice cintura-cadera.",
    related: ["med-18", "med-17", "med-54"],
    keywords: ["cadera", "perímetro", "glúteos", "cintura-cadera", "cm"],
  },
  {
    id: "med-20",
    section: "paciente-mediciones",
    question: "¿Para qué registrar brazo derecho y brazo izquierdo por separado?",
    answer:
      "Registrar ambos brazos permite detectar asimetrías musculares y valorar el progreso en objetivos de hipertrofia. Mide con el brazo relajado en contracción isométrica o flexionado, según el protocolo que uses, y sé coherente en las siguientes medidas.",
    related: ["med-17", "med-21", "med-54"],
    keywords: ["brazo derecho", "brazo izquierdo", "asimetría", "hipertrofia", "perímetro"],
  },
  {
    id: "med-21",
    section: "paciente-mediciones",
    question: "¿Cómo se mide el perímetro del muslo?",
    answer:
      "Mide en la parte central del muslo, a medio camino entre el pliegue inguinal y la rodilla, con el paciente de pie y la pierna relajada. Introduce el valor en centímetros en el campo Muslo. Si solo mides una pierna, mantén siempre la misma para poder comparar.",
    related: ["med-17", "med-20", "med-54"],
    keywords: ["muslo", "pierna", "perímetro", "cm", "centímetros"],
  },
  {
    id: "med-22",
    section: "paciente-mediciones",
    question: "¿Cómo registro el perímetro del pecho?",
    answer:
      "Mide el contorno del pecho pasando la cinta por debajo de las axilas y por la zona más prominente del pectoral, con el paciente relajado y los brazos en posición natural. Introduce el valor en cm en el campo Pecho.",
    related: ["med-17", "med-20", "med-54"],
    keywords: ["pecho", "tórax", "perímetro", "pectoral", "cm"],
  },
  {
    id: "med-23",
    section: "paciente-mediciones",
    question: "¿Qué utilidad tiene el perímetro de la pantorrilla?",
    answer:
      "La pantorrilla se registra sobre todo para seguimiento de hipertrofia de tren inferior y en valoraciones de sarcopenia en personas mayores. Mide en la zona más ancha de la pantorrilla con el paciente de pie y relajado.",
    related: ["med-17", "med-21", "med-54"],
    keywords: ["pantorrilla", "gemelo", "tren inferior", "sarcopenia", "perímetro"],
  },
  {
    id: "med-24",
    section: "paciente-mediciones",
    question: "¿Qué es la circunferencia de cuello y para qué se usa?",
    answer:
      "La circunferencia de cuello se mide justo por debajo de la nuez, con el paciente mirando al frente. Es una medida auxiliar para valorar riesgo de apnea del sueño y estimar grasa de depósito superior. Se registra en centímetros.",
    related: ["med-17", "med-18", "med-54"],
    keywords: ["cuello", "circunferencia", "apnea", "cm", "perímetro"],
  },
  {
    id: "med-25",
    section: "paciente-mediciones",
    question: "¿Qué anoto en Notas de la medición?",
    answer:
      "Usa el campo Notas para detalles contextuales: báscula utilizada, hora de la toma, si el paciente había desayunado, si realizó deporte previo o cualquier observación que pueda influir en la medida. Es texto libre y aparece asociado a la medida en el histórico.",
    related: ["med-3", "med-26", "med-44"],
    keywords: ["notas", "observaciones", "contexto", "comentarios", "texto libre"],
  },
  {
    id: "med-26",
    section: "paciente-mediciones",
    question: "¿Las notas son visibles para el paciente?",
    answer:
      "Las notas de mediciones forman parte del expediente interno del profesional. No se muestran en el portal del paciente, así que puedes usarlas con total confianza para observaciones clínicas.",
    related: ["med-25", "med-44"],
    keywords: ["notas", "privado", "paciente", "visibilidad", "portal"],
  },
  {
    id: "med-27",
    section: "paciente-mediciones",
    question: "¿Se actualiza el IMC al cambiar solo el peso?",
    answer:
      "Sí. Cada vez que guardas un peso nuevo, el sistema usa la última altura conocida del paciente para recalcular automáticamente el IMC de esa medición. No necesitas volver a introducir la altura si no ha cambiado.",
    related: ["med-11", "med-6", "med-28"],
    keywords: ["imc", "actualizar", "peso", "altura", "recalcular"],
  },
  {
    id: "med-28",
    section: "paciente-mediciones",
    question: "¿Qué pasa si no he registrado la altura?",
    answer:
      "Si no hay altura guardada en ninguna medición, el IMC no puede calcularse y aparecerá vacío. Registra una sola vez la altura del paciente y ya podrás calcular el IMC automáticamente en todas las mediciones posteriores.",
    related: ["med-11", "med-6", "med-27"],
    keywords: ["sin altura", "imc vacío", "falta talla", "altura", "requisito"],
  },
  {
    id: "med-29",
    section: "paciente-mediciones",
    question: "¿Qué gráficas de evolución se muestran?",
    answer:
      "La pestaña incluye varias gráficas de evolución: peso en kg, IMC, porcentaje de grasa corporal, masa muscular en kg y perímetros en cm. Cada gráfica representa los puntos con sus fechas y dibuja la tendencia a lo largo del tiempo.",
    related: ["med-30", "med-31", "med-32"],
    keywords: ["gráficas", "evolución", "recharts", "peso", "imc", "tendencia"],
  },
  {
    id: "med-30",
    section: "paciente-mediciones",
    question: "¿Cuántas medidas necesito para ver las gráficas?",
    answer:
      "Necesitas al menos dos mediciones con valor en el campo correspondiente para que aparezca la gráfica de evolución. Con una sola medida solo se muestra el dato en la lista, pero no tiene sentido trazar una línea de tendencia.",
    related: ["med-29", "med-31"],
    keywords: ["mínimo", "dos medidas", "gráfica", "aparece", "requisito"],
  },
  {
    id: "med-31",
    section: "paciente-mediciones",
    question: "¿Qué representa el eje X de las gráficas?",
    answer:
      "El eje X representa la fecha de cada medición, ordenada de más antigua a más reciente. Si has registrado varias medidas en fechas separadas verás cómo se distribuyen los puntos en el tiempo.",
    related: ["med-29", "med-32", "med-33"],
    keywords: ["eje x", "fecha", "tiempo", "gráficas", "orden"],
  },
  {
    id: "med-32",
    section: "paciente-mediciones",
    question: "¿Qué representa el eje Y de las gráficas?",
    answer:
      "El eje Y muestra el valor de la métrica concreta: kilogramos en la gráfica de peso y masa muscular, número entero en IMC, porcentaje en grasa y agua, y centímetros en los perímetros. La escala se ajusta automáticamente a los datos.",
    related: ["med-29", "med-31", "med-33"],
    keywords: ["eje y", "valor", "escala", "unidades", "gráfica"],
  },
  {
    id: "med-33",
    section: "paciente-mediciones",
    question: "¿Puedo ver el valor exacto al pasar el ratón por la gráfica?",
    answer:
      "Sí. Al pasar el cursor por cualquier punto de la gráfica se muestra un tooltip con la fecha exacta y el valor registrado. Es útil para confirmar cifras concretas sin tener que bajar al listado de mediciones.",
    related: ["med-31", "med-32", "med-69"],
    keywords: ["tooltip", "hover", "valor exacto", "ratón", "gráfica"],
  },
  {
    id: "med-34",
    section: "paciente-mediciones",
    question: "¿Cómo interpreto una tendencia en la gráfica?",
    answer:
      "Una pendiente ascendente indica aumento de la métrica entre dos medidas consecutivas y una descendente indica disminución. Fíjate en el patrón global de la línea, no solo en saltos puntuales, para evaluar si el paciente evoluciona como esperas.",
    related: ["med-29", "med-33", "med-55"],
    keywords: ["tendencia", "interpretar", "subida", "bajada", "pendiente"],
  },
  {
    id: "med-35",
    section: "paciente-mediciones",
    question: "¿Dónde aparece el listado de mediciones?",
    answer:
      "Debajo del formulario y las gráficas hay un listado con todas las mediciones registradas, ordenadas por fecha descendente (la más reciente primero). Cada fila muestra la fecha, los valores registrados y las acciones disponibles.",
    related: ["med-36", "med-37", "med-38"],
    keywords: ["listado", "histórico", "lista", "orden", "fechas"],
  },
  {
    id: "med-36",
    section: "paciente-mediciones",
    question: "¿En qué orden aparecen las mediciones en el listado?",
    answer:
      "Las mediciones se ordenan por fecha descendente: la más reciente arriba y las más antiguas abajo. Este orden es fijo y facilita ver de un vistazo los últimos registros.",
    related: ["med-35", "med-37"],
    keywords: ["orden", "descendente", "reciente", "antiguo", "listado"],
  },
  {
    id: "med-37",
    section: "paciente-mediciones",
    question: "¿Cómo elimino una medición?",
    answer:
      "Pulsa el icono de la papelera en la fila de la medición que quieras borrar. Aparecerá un diálogo de confirmación y, una vez lo aceptes, la medición se elimina definitivamente y desaparece del histórico y de las gráficas.",
    related: ["med-38", "med-41", "med-42"],
    keywords: ["borrar", "eliminar", "papelera", "trash", "confirmar"],
  },
  {
    id: "med-38",
    section: "paciente-mediciones",
    question: "¿Se puede recuperar una medición borrada?",
    answer:
      "No. Al confirmar el borrado, la medición se elimina de forma definitiva y no hay papelera de reciclaje. Por eso el botón siempre pide confirmación. Si dudas, cancela el diálogo antes de confirmar.",
    related: ["med-37", "med-41"],
    keywords: ["recuperar", "borrada", "definitivo", "irreversible", "confirmación"],
  },
  {
    id: "med-39",
    section: "paciente-mediciones",
    question: "¿Qué datos aporta una báscula de bioimpedancia?",
    answer:
      "Las básculas de bioimpedancia estiman peso, porcentaje de grasa corporal, masa muscular, agua corporal y grasa visceral enviando una corriente eléctrica de bajo voltaje por el cuerpo. Todos estos valores se pueden volcar en una misma medición de la ficha.",
    related: ["med-7", "med-8", "med-40"],
    keywords: ["bioimpedancia", "báscula", "corriente", "composición", "valores"],
  },
  {
    id: "med-40",
    section: "paciente-mediciones",
    question: "¿Qué hago si el paciente solo tiene una báscula simple de peso?",
    answer:
      "Registra únicamente el peso y deja vacíos los campos de %grasa, masa muscular, agua y grasa visceral. La medición es perfectamente válida y seguirá alimentando la gráfica de peso y el cálculo del IMC.",
    related: ["med-4", "med-5", "med-39"],
    keywords: ["báscula simple", "solo peso", "sin bioimpedancia", "campos vacíos", "válido"],
  },
  {
    id: "med-41",
    section: "paciente-mediciones",
    question: "¿Puedo editar una medición ya guardada?",
    answer:
      "Sí, siempre que la medición esté dentro de los límites de edición del plan. Abre la medición en el listado, modifica los valores necesarios y guarda los cambios. Si un campo estaba mal anotado, corrígelo en lugar de borrar y recrear la medición.",
    related: ["med-37", "med-42", "med-43"],
    keywords: ["editar", "modificar", "corregir", "actualizar", "medición"],
  },
  {
    id: "med-42",
    section: "paciente-mediciones",
    question: "¿Puedo duplicar una medición para el mismo día?",
    answer:
      "Sí. Si necesitas registrar varias medidas para una misma fecha (por ejemplo antes y después del entrenamiento) puedes crear una nueva medición con la misma fecha. Cada registro es independiente y aparecerá por separado en el listado.",
    related: ["med-37", "med-41", "med-43"],
    keywords: ["duplicar", "mismo día", "varias medidas", "repetir", "misma fecha"],
  },
  {
    id: "med-43",
    section: "paciente-mediciones",
    question: "¿Cómo vinculo una medición a una consulta?",
    answer:
      "Al crear o editar una medición verás un selector opcional para asociarla a una consulta concreta del paciente. Eso te permite recuperar el contexto clínico y ver desde la ficha de la consulta qué medidas se tomaron ese día.",
    related: ["med-44", "med-45", "med-46"],
    keywords: ["vincular", "asociar", "consulta", "sesión", "relacionar"],
  },
  {
    id: "med-44",
    section: "paciente-mediciones",
    question: "¿Es obligatorio vincular la medición a una consulta?",
    answer:
      "No. El vínculo con una consulta es completamente opcional. Puedes registrar mediciones de seguimiento entre consultas sin asociarlas a ninguna sesión. Si el paciente sube datos desde su portal, tampoco hace falta vincularlos.",
    related: ["med-43", "med-45"],
    keywords: ["vincular", "opcional", "consulta", "obligatorio", "libre"],
  },
  {
    id: "med-45",
    section: "paciente-mediciones",
    question: "¿Qué ventajas tiene vincular una medición a una consulta?",
    answer:
      "Cuando la medición está vinculada, aparece directamente en la ficha de la consulta asociada, permitiéndote revisar de un vistazo los valores que se tomaron ese día. También ayuda a preparar informes y entregables centrados en una sesión concreta.",
    related: ["med-43", "med-44"],
    keywords: ["ventaja", "vincular", "contexto", "consulta", "informe"],
  },
  {
    id: "med-46",
    section: "paciente-mediciones",
    question: "¿Se puede cambiar la consulta vinculada después?",
    answer:
      "Sí. Entra en la medición en modo edición y cambia el valor del selector de consulta al que corresponda, o déjalo en blanco si prefieres desvincularla. El cambio se guarda al confirmar.",
    related: ["med-43", "med-41"],
    keywords: ["cambiar vínculo", "desvincular", "editar consulta", "asociar", "modificar"],
  },
  {
    id: "med-47",
    section: "paciente-mediciones",
    question: "¿Qué diferencia hay entre Mediciones y Seguimiento diario?",
    answer:
      "Mediciones guarda datos antropométricos puntuales (peso, perímetros, composición corporal) que se registran con baja frecuencia. Seguimiento diario se centra en hábitos del día a día: qué come el paciente, cuánta agua bebe y qué ejercicio realiza.",
    related: ["med-48", "med-52"],
    keywords: ["mediciones vs seguimiento", "diferencia", "hábitos", "antropometría", "seguimiento"],
  },
  {
    id: "med-48",
    section: "paciente-mediciones",
    question: "¿Puedo combinar datos de Mediciones y Seguimiento diario?",
    answer:
      "Sí. Son pestañas complementarias: las mediciones te dan la fotografía de composición corporal y el seguimiento diario te dice qué hábitos están llevando a esos resultados. Revisar ambas a la vez te ayuda a entender el progreso completo del paciente.",
    related: ["med-47", "med-52"],
    keywords: ["combinar", "complementario", "hábitos", "progreso", "visión global"],
  },
  {
    id: "med-49",
    section: "paciente-mediciones",
    question: "¿Cómo exporto las mediciones a PDF?",
    answer:
      "Desde la pestaña Entregables del paciente puedes generar un informe en PDF que incluye las mediciones registradas, con sus valores y gráficas de evolución. El PDF resultante se guarda como entregable y puedes enviarlo al paciente.",
    related: ["med-50", "med-51", "med-70"],
    keywords: ["exportar", "pdf", "entregable", "informe", "imprimir"],
  },
  {
    id: "med-50",
    section: "paciente-mediciones",
    question: "¿Qué unidades utiliza la aplicación?",
    answer:
      "Las unidades están fijadas para toda la aplicación: kilogramos para peso y masa muscular, centímetros para altura y perímetros, y porcentaje para grasa corporal y agua. La grasa visceral se expresa como índice numérico. No puedes cambiarlas para evitar errores.",
    related: ["med-5", "med-6", "med-17"],
    keywords: ["unidades", "kg", "cm", "%", "métrico"],
  },
  {
    id: "med-51",
    section: "paciente-mediciones",
    question: "¿Qué perímetros debo priorizar si el objetivo es perder peso?",
    answer:
      "En objetivos de pérdida de peso los perímetros más informativos son cintura y cadera, porque reflejan reducción de grasa abdominal. Complementarlos con el peso y el porcentaje de grasa ofrece una visión clara del progreso.",
    related: ["med-17", "med-18", "med-52"],
    keywords: ["perder peso", "objetivo", "cintura", "cadera", "pérdida grasa"],
  },
  {
    id: "med-52",
    section: "paciente-mediciones",
    question: "¿Qué perímetros debo priorizar si el objetivo es ganar masa muscular?",
    answer:
      "Para ganancia de masa muscular interesan sobre todo los perímetros de brazo derecho, brazo izquierdo, muslo y pecho, acompañados del dato de masa muscular en kg. Así puedes comprobar hipertrofia localizada además del aumento de peso.",
    related: ["med-17", "med-20", "med-21", "med-22"],
    keywords: ["ganar masa", "hipertrofia", "brazo", "muslo", "pecho"],
  },
  {
    id: "med-53",
    section: "paciente-mediciones",
    question: "¿Cada cuánto conviene tomar mediciones?",
    answer:
      "Depende del objetivo y del paciente, pero como orientación cada 2 a 4 semanas suele ser suficiente para ver cambios sin inducir frustración por variaciones diarias. En procesos deportivos exigentes se puede subir a semanal; en mantenimiento, mensual o trimestral.",
    related: ["med-60", "med-63"],
    keywords: ["frecuencia", "cada cuánto", "periodicidad", "recomendación", "consulta"],
  },
  {
    id: "med-54",
    section: "paciente-mediciones",
    question: "¿Cómo consigo medidas fiables entre tomas?",
    answer:
      "Para que las medidas sean comparables, utiliza siempre la misma báscula, la misma cinta métrica y los mismos puntos anatómicos, idealmente a la misma hora del día y en ayunas. Anota en Notas cualquier desviación.",
    related: ["med-17", "med-18", "med-25"],
    keywords: ["fiables", "comparables", "metodología", "consistencia", "protocolo"],
  },
  {
    id: "med-55",
    section: "paciente-mediciones",
    question: "¿Qué significa ver el IMC en zona de sobrepeso pero buen %grasa?",
    answer:
      "Puede indicar que el paciente tiene elevada masa muscular, como en deportistas. El IMC solo mira peso y altura, no la composición. En esos casos, prioriza el porcentaje de grasa, los perímetros y la masa muscular sobre el IMC para valorar el estado real.",
    related: ["med-11", "med-12", "med-13"],
    keywords: ["imc sobrepeso", "deportistas", "composición", "interpretación", "contexto"],
  },
  {
    id: "med-56",
    section: "paciente-mediciones",
    question: "¿Qué valor de grasa visceral se considera elevado?",
    answer:
      "Depende del fabricante de la báscula, pero en la mayoría de equipos valores por encima de 12 se consideran altos y por encima de 15 muy altos. Consulta siempre el manual del dispositivo y úsalo como referencia orientativa, no como diagnóstico.",
    related: ["med-10", "med-39"],
    keywords: ["grasa visceral", "valor alto", "referencia", "riesgo", "interpretación"],
  },
  {
    id: "med-57",
    section: "paciente-mediciones",
    question: "¿Cómo detecto pérdida de masa muscular en la gráfica?",
    answer:
      "Si la gráfica de masa muscular muestra una tendencia descendente sostenida mientras el peso cae o se mantiene, probablemente el paciente esté perdiendo músculo. Revisa la ingesta proteica y el entrenamiento de fuerza en el seguimiento diario.",
    related: ["med-8", "med-29", "med-34"],
    keywords: ["pérdida muscular", "gráfica", "descenso", "catabolismo", "tendencia"],
  },
  {
    id: "med-58",
    section: "paciente-mediciones",
    question: "¿Qué es la notificación SIN_MEDIDAS?",
    answer:
      "SIN_MEDIDAS es una notificación automática que el sistema genera cuando un paciente lleva más de 30 días sin registrar ninguna medición. Aparece en el centro de notificaciones del nutricionista y te ayuda a detectar pacientes desatendidos.",
    related: ["med-59", "med-60"],
    keywords: ["sin_medidas", "notificación", "30 días", "alerta", "inactividad"],
  },
  {
    id: "med-59",
    section: "paciente-mediciones",
    question: "¿Qué ocurre cuando registro una medida tras la notificación SIN_MEDIDAS?",
    answer:
      "Al guardar cualquier nueva medición del paciente, la notificación SIN_MEDIDAS correspondiente se marca automáticamente como leída y desaparece del centro de notificaciones. No hace falta cerrarla a mano.",
    related: ["med-58", "med-60"],
    keywords: ["marcar leída", "sin_medidas", "automático", "resolver", "notificación"],
  },
  {
    id: "med-60",
    section: "paciente-mediciones",
    question: "¿Puedo silenciar las notificaciones SIN_MEDIDAS?",
    answer:
      "En los ajustes de notificaciones puedes configurar qué tipos quieres recibir. Si trabajas con pacientes que se miden esporádicamente, puedes desactivar SIN_MEDIDAS, aunque lo habitual es mantenerla activa como recordatorio clínico.",
    related: ["med-58", "med-59"],
    keywords: ["silenciar", "desactivar", "configurar", "notificaciones", "ajustes"],
  },
  {
    id: "med-61",
    section: "paciente-mediciones",
    question: "¿Puedo comparar dos mediciones concretas?",
    answer:
      "Sí. En el listado puedes ver una junto a otra cualquier par de mediciones y calcular mentalmente las diferencias, o apoyarte en la gráfica para identificar el cambio entre dos fechas. Las diferencias más relevantes también se muestran en los informes de Entregables.",
    related: ["med-29", "med-49", "med-62"],
    keywords: ["comparar", "dos medidas", "diferencia", "progreso", "fechas"],
  },
  {
    id: "med-62",
    section: "paciente-mediciones",
    question: "¿Cómo mido el progreso entre la primera y la última medición?",
    answer:
      "Ve al listado, localiza la primera medición y la más reciente, y calcula las diferencias en peso, IMC, %grasa y perímetros. Muchas gráficas también reflejan el cambio total como diferencia entre el primer y último punto del trazado.",
    related: ["med-61", "med-34"],
    keywords: ["progreso", "inicial", "final", "balance", "diferencia total"],
  },
  {
    id: "med-63",
    section: "paciente-mediciones",
    question: "¿Cómo cargo de golpe el histórico de un paciente nuevo?",
    answer:
      "Crea una medición por cada fecha del histórico que tengas, cambiando el selector de fecha en cada registro. Puedes hacerlo en una sola sesión: el listado se reordenará automáticamente por fecha al guardarlas.",
    related: ["med-15", "med-66"],
    keywords: ["cargar histórico", "paciente nuevo", "pasado", "importar", "lote"],
  },
  {
    id: "med-64",
    section: "paciente-mediciones",
    question: "¿Puedo registrar mediciones desde el portal del paciente?",
    answer:
      "Sí. El paciente puede registrar sus propias mediciones desde la sección de seguimiento de su portal. Cuando lo hace, aparecerán en la pestaña Mediciones del nutricionista y contribuirán a las gráficas y al listado.",
    related: ["med-47", "med-65"],
    keywords: ["portal paciente", "autorregistro", "paciente", "desde app", "entrada"],
  },
  {
    id: "med-65",
    section: "paciente-mediciones",
    question: "¿Puedo distinguir qué medición registró el paciente y cuál yo?",
    answer:
      "En el detalle de la medición verás quién la creó. Eso te permite confiar más o menos en valores no supervisados (por ejemplo, si el paciente anota el peso desde casa sin protocolo). Anótalo en Notas si es relevante.",
    related: ["med-64", "med-25"],
    keywords: ["autor", "origen", "paciente", "nutricionista", "registro"],
  },
  {
    id: "med-66",
    section: "paciente-mediciones",
    question: "¿Qué hago si me equivoco al introducir una fecha?",
    answer:
      "Edita la medición afectada, abre el selector de fecha y elige la correcta. Al guardar, la medición se reordenará en el listado y las gráficas se actualizarán automáticamente.",
    related: ["med-41", "med-14", "med-15"],
    keywords: ["error fecha", "corregir", "editar", "cambiar día", "reordenar"],
  },
  {
    id: "med-67",
    section: "paciente-mediciones",
    question: "¿Las gráficas consideran mediciones parcialmente rellenas?",
    answer:
      "Sí, pero cada gráfica solo muestra los puntos que tienen valor en ese campo concreto. Si en una medición no anotaste %grasa, ese punto no aparecerá en la gráfica de %grasa, aunque sí lo hará en la de peso si registraste el peso.",
    related: ["med-4", "med-29", "med-30"],
    keywords: ["parcial", "campos vacíos", "gráfica", "puntos", "rellenas"],
  },
  {
    id: "med-68",
    section: "paciente-mediciones",
    question: "¿Cómo detectar valores atípicos en el histórico?",
    answer:
      "Los valores atípicos se ven fácilmente como picos o caídas bruscas en la gráfica. Si detectas uno, abre la medición desde el listado, comprueba que no haya un error de transcripción y corrígelo o bórralo para no distorsionar la tendencia.",
    related: ["med-29", "med-34", "med-41"],
    keywords: ["valores atípicos", "pico", "outlier", "error", "limpiar"],
  },
  {
    id: "med-69",
    section: "paciente-mediciones",
    question: "¿Puedo imprimir una gráfica de mediciones?",
    answer:
      "La forma recomendada es generar un entregable en PDF desde la pestaña Entregables, que incluye las gráficas de mediciones. También puedes usar la opción Imprimir del navegador sobre la pestaña, aunque el resultado visual es más limpio con el entregable.",
    related: ["med-49", "med-70"],
    keywords: ["imprimir", "gráfica", "pdf", "papel", "entregable"],
  },
  {
    id: "med-70",
    section: "paciente-mediciones",
    question: "¿Dónde reviso los informes de mediciones que he generado?",
    answer:
      "Todos los informes generados aparecen en la pestaña Entregables del paciente. Desde ahí puedes descargar, reenviar o eliminar los PDFs creados con el histórico de mediciones, y verificar qué versión recibió el paciente.",
    related: ["med-49", "med-69"],
    keywords: ["informes", "entregables", "pdf", "reenviar", "descargar"],
  },
];
