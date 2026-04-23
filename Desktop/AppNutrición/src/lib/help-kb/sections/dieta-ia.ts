import type { HelpEntry } from "../types";

export const DIETA_IA_ENTRIES: HelpEntry[] = [
  {
    id: "dia-1",
    section: "dieta-ia",
    question: "¿Qué es la generación de planes con IA?",
    answer:
      "La generación con IA es una funcionalidad de AppNutrición que permite crear un plan semanal completo de manera automática a partir de la ficha del paciente y de tus indicaciones. En lugar de montar la dieta comida a comida desde cero, describes los objetivos calóricos, los macros y cualquier preferencia adicional, y un modelo de lenguaje se encarga de proponer un plan coherente usando los alimentos de tu base de datos. El resultado se guarda como borrador para que tú lo revises y decidas si lo aplicas al plan del paciente. Es una herramienta de apoyo, no un sustituto del criterio del dietista.",
    related: ["dia-2", "dia-6", "dia-12"],
    keywords: ["ia", "inteligencia artificial", "generación", "plan", "automático"],
  },
  {
    id: "dia-2",
    section: "dieta-ia",
    question: "¿Dónde encuentro el botón para generar con IA?",
    answer:
      "Dentro de cualquier plan de alimentación abierto en modo edición, en la parte superior derecha de la pantalla aparece un botón llamado \"Generar con IA\" acompañado de un icono de chispa. Al pulsarlo se navega a la ruta `/dietas/[id]/generar-ia`, donde verás el formulario de parámetros y el botón Generar. Si el botón no aparece es porque tu suscripción actual no incluye la funcionalidad de IA o porque estás en un plan Básico. En móvil puede estar oculto en el menú de acciones del plan.",
    related: ["dia-1", "dia-29", "dia-30"],
    keywords: ["botón", "acceso", "ruta", "generar ia"],
  },
  {
    id: "dia-3",
    section: "dieta-ia",
    question: "¿Qué parámetros pide el formulario de generación?",
    answer:
      "El formulario pide tres bloques de información: el objetivo calórico diario en kilocalorías, la distribución de macronutrientes objetivo (proteínas, carbohidratos y grasas, normalmente expresados en gramos) y un campo de texto libre para instrucciones adicionales. El objetivo calórico y los macros marcan las cifras que la IA intentará respetar en cada día del plan. Las instrucciones libres te permiten afinar con matices difíciles de cuantificar, como evitar un alimento concreto o pedir comidas frías. Todos los campos son obligatorios salvo las instrucciones, que son opcionales.",
    related: ["dia-4", "dia-5", "dia-8"],
    keywords: ["formulario", "parámetros", "kcal", "macros", "instrucciones"],
  },
  {
    id: "dia-4",
    section: "dieta-ia",
    question: "¿Cómo calculo las kcal objetivo para un paciente?",
    answer:
      "Las kcal objetivo deberían salir de tu cálculo energético habitual, basado en el gasto metabólico basal del paciente, el factor de actividad y el objetivo de pérdida, mantenimiento o ganancia de peso. AppNutrición no impone una fórmula: tú decides el número y la IA lo respeta. Si no tienes claro el valor, puedes mirar mediciones recientes, el peso actual y el objetivo registrado en la ficha. Una vez generado el plan, comprueba que las kcal reales por día quedan dentro del margen aceptable.",
    related: ["dia-3", "dia-37", "dia-22"],
    keywords: ["kcal", "calcular", "objetivo", "calorías"],
  },
  {
    id: "dia-5",
    section: "dieta-ia",
    question: "¿Cómo reparto proteínas, carbohidratos y grasas?",
    answer:
      "La distribución de macros la decides tú según el perfil del paciente y la patología si la hay. En el formulario introduces los gramos objetivo para cada macro y la IA intentará ajustar las comidas de cada día a esos valores. Si el paciente necesita dieta hiperproteica, sube las proteínas; si es dieta baja en carbohidratos, reduce esa cifra. Ten en cuenta que la suma de kcal derivada de los macros debería aproximarse al objetivo calórico declarado para evitar inconsistencias.",
    related: ["dia-3", "dia-4", "dia-37"],
    keywords: ["macros", "proteínas", "carbohidratos", "grasas", "reparto"],
  },
  {
    id: "dia-6",
    section: "dieta-ia",
    question: "¿Qué pongo en el campo de instrucciones libres?",
    answer:
      "En instrucciones libres puedes escribir cualquier indicación que no encaje en los campos numéricos, tal como se lo dirías a un colaborador humano. Ejemplos útiles: \"sin lácteos por la noche\", \"incluir frutos secos en el desayuno\", \"la cena tiene que ser ligera y fría\", \"el paciente trabaja en turno de noche\" o \"evitar legumbres por intolerancia leve\". Sé concreto y breve: frases cortas funcionan mejor que párrafos largos. Todo lo que escribas se añade al contexto que recibe el modelo junto a la ficha del paciente.",
    related: ["dia-3", "dia-7", "dia-13"],
    keywords: ["instrucciones", "libres", "texto", "contexto"],
  },
  {
    id: "dia-7",
    section: "dieta-ia",
    question: "¿Puedes darme ejemplos concretos de instrucciones que funcionan bien?",
    answer:
      "Algunos ejemplos reales que suelen dar buen resultado: \"desayunos con fruta y proteína, sin bollería\", \"cenas sin carne roja\", \"incluir pescado azul al menos tres veces por semana\", \"comidas de lunes a viernes tipo táper para llevar al trabajo\", \"añadir un tentempié antes del entrenamiento de las 19h\" o \"evitar crudos en la cena por digestión pesada\". También funcionan instrucciones culturales como \"cocina mediterránea\" o \"sin cerdo por motivos religiosos\". Cuanto más específico, mejor adapta el modelo las propuestas.",
    related: ["dia-6", "dia-13", "dia-17"],
    keywords: ["ejemplos", "instrucciones", "prompts"],
  },
  {
    id: "dia-8",
    section: "dieta-ia",
    question: "¿Qué datos del paciente usa la IA automáticamente?",
    answer:
      "La IA recibe un resumen estructurado de la ficha del paciente que incluye alergias declaradas, intolerancias, patologías, objetivo del tratamiento y preferencias alimentarias registradas. También ve datos básicos como edad, sexo, peso y altura si están informados. No necesitas repetir esa información en las instrucciones libres salvo que quieras reforzarla. El sistema evita automáticamente proponer alimentos contra los que el paciente esté marcado como alérgico o intolerante.",
    related: ["dia-9", "dia-10", "dia-16"],
    keywords: ["ficha", "paciente", "datos", "automático"],
  },
  {
    id: "dia-9",
    section: "dieta-ia",
    question: "¿La IA respeta las alergias e intolerancias del paciente?",
    answer:
      "Sí, las alergias e intolerancias registradas en la ficha se envían al modelo como restricciones estrictas y además se aplica un filtrado posterior sobre los alimentos propuestos. Aun así, conviene revisar el plan antes de aceptarlo porque ningún sistema de IA es infalible y puede haber alimentos derivados que pasen desapercibidos. Si detectas un fallo, anótalo y vuelve a generar ajustando las instrucciones para reforzar la restricción. Como buena práctica, mantén las alergias actualizadas en la ficha antes de lanzar la generación.",
    related: ["dia-8", "dia-10", "dia-23"],
    keywords: ["alergias", "intolerancias", "restricciones", "seguridad"],
  },
  {
    id: "dia-10",
    section: "dieta-ia",
    question: "¿Tiene en cuenta las patologías del paciente?",
    answer:
      "Las patologías registradas en la ficha se incluyen en el contexto que ve la IA, por lo que puede ajustar las propuestas a condiciones como diabetes, hipertensión, hipercolesterolemia o enfermedad celíaca. El modelo intentará moderar azúcares simples en diabetes, reducir sodio en hipertensión o evitar gluten en celiaquía, según corresponda. No obstante, el diagnóstico y la prescripción clínica son tu responsabilidad: revisa siempre que las sugerencias encajen con la pauta médica del paciente. Para casos complejos, refuerza la instrucción libre con detalles clínicos específicos.",
    related: ["dia-8", "dia-9", "dia-50"],
    keywords: ["patologías", "enfermedades", "clínico", "diabetes"],
  },
  {
    id: "dia-11",
    section: "dieta-ia",
    question: "¿Qué modelo de IA utiliza AppNutrición?",
    answer:
      "Por defecto la aplicación usa Groq con el modelo llama-3.3-70b-versatile, una versión de Llama 3.3 de 70 mil millones de parámetros servida con baja latencia. Ese modelo combina buena capacidad de seguimiento de instrucciones con tiempos de respuesta razonables, lo cual es clave porque la generación se hace en varios lotes. Está alojado en infraestructura de Groq, que ofrece endpoints compatibles con estándares de chat completion. El modelo no se entrena con los datos que le envías desde la aplicación.",
    related: ["dia-12", "dia-13", "dia-27"],
    keywords: ["modelo", "groq", "llama", "70b"],
  },
  {
    id: "dia-12",
    section: "dieta-ia",
    question: "¿Qué pasa si Groq falla o no responde?",
    answer:
      "AppNutrición tiene configurado un fallback automático a OpenAI. Si la llamada a Groq falla por error de red, cuota agotada, timeout o respuesta inválida, el sistema reintenta la generación con un modelo de OpenAI equivalente sin que tengas que hacer nada. El resultado final tiene la misma estructura y se guarda igualmente como borrador. En raras ocasiones pueden fallar los dos proveedores; en ese caso verás un mensaje de error y podrás reintentar pasados unos minutos.",
    related: ["dia-11", "dia-24", "dia-27"],
    keywords: ["fallback", "openai", "error", "backup"],
  },
  {
    id: "dia-13",
    section: "dieta-ia",
    question: "¿Cuánto tarda en generarse un plan completo?",
    answer:
      "Entre treinta y noventa segundos, dependiendo de la carga del proveedor, la longitud de las instrucciones y la complejidad del plan. Durante ese tiempo la pantalla muestra un indicador de progreso con los lotes que se van completando. No cierres la pestaña ni navegues fuera de la página hasta que termine, porque la generación se cancelaría. Si ves que supera los dos minutos, lo más probable es que haya un problema con el proveedor y el sistema te mostrará el error.",
    related: ["dia-14", "dia-24", "dia-27"],
    keywords: ["tiempo", "duración", "30", "90", "segundos"],
  },
  {
    id: "dia-14",
    section: "dieta-ia",
    question: "¿Por qué el plan se genera en tres lotes?",
    answer:
      "La semana se divide en tres lotes (lunes-martes-miércoles, jueves-viernes y sábado-domingo) por dos motivos. El primero es evitar que la respuesta del modelo se trunque: generar siete días completos con seis comidas cada uno excede el contexto útil en una sola llamada. El segundo es aumentar la variedad entre días, porque al regenerar en bloques más pequeños el modelo rota mejor los alimentos. Los tres lotes se encadenan automáticamente y el resultado se muestra como un único plan semanal.",
    related: ["dia-13", "dia-15", "dia-33"],
    keywords: ["lotes", "3", "batches", "truncamiento"],
  },
  {
    id: "dia-15",
    section: "dieta-ia",
    question: "¿Habrá variedad suficiente entre los días del plan?",
    answer:
      "El sistema está diseñado para maximizar la variedad: cada lote se genera con instrucciones que evitan repetir los alimentos principales del lote anterior y rota especialmente la fuente de proteína principal. Aun así, en planes con restricciones fuertes (por ejemplo, muchas alergias combinadas con objetivo hipocalórico) puede repetirse alguna comida. Revisa el plan tras generarlo y, si ves repeticiones incómodas, edítalas manualmente en el editor o vuelve a generar reforzando la instrucción de variedad.",
    related: ["dia-14", "dia-19", "dia-34"],
    keywords: ["variedad", "repetición", "diversidad"],
  },
  {
    id: "dia-16",
    section: "dieta-ia",
    question: "¿Cómo influye el objetivo registrado del paciente?",
    answer:
      "El objetivo del paciente (perder grasa, mantener, ganar músculo, mejorar hábitos, etc.) forma parte del contexto que recibe la IA. Ese dato ayuda a que el modelo proponga un reparto coherente entre comidas, ajuste el tamaño de las raciones y sugiera combinaciones adecuadas al propósito. Si el objetivo cambia, actualízalo en la ficha antes de generar para que se refleje en el plan. Los valores numéricos del formulario (kcal, macros) mandan sobre cualquier deducción del objetivo: son la referencia cuantitativa.",
    related: ["dia-8", "dia-17", "dia-37"],
    keywords: ["objetivo", "paciente", "pérdida", "ganancia"],
  },
  {
    id: "dia-17",
    section: "dieta-ia",
    question: "¿Cómo se tratan las preferencias alimentarias?",
    answer:
      "Las preferencias registradas en la ficha (vegetariano, vegano, sin cerdo, sin pescado, etc.) se mandan al modelo como restricciones suaves. La IA intentará respetarlas, pero a diferencia de las alergias no se filtran de manera estricta en post-proceso, porque las preferencias son más flexibles. Si una preferencia es innegociable para el paciente, conviene reforzarla también en el campo de instrucciones libres. Así tendrás más garantía de que se respete en los tres lotes.",
    related: ["dia-8", "dia-6", "dia-23"],
    keywords: ["preferencias", "vegetariano", "vegano", "gustos"],
  },
  {
    id: "dia-18",
    section: "dieta-ia",
    question: "¿Debo revisar el plan antes de aceptarlo?",
    answer:
      "Sí, siempre. La IA es una ayuda para agilizar la creación del plan, pero el juicio clínico es tuyo. Antes de aceptar, comprueba que las kcal totales por día encajan con tu objetivo, que las comidas tienen sentido práctico para el paciente, que no hay alimentos no recomendados para su patología y que los horarios de comidas son realistas. Fíjate también en las cantidades: revisar dos o tres días al azar suele bastar para detectar problemas sistémicos. Si algo no cuadra, puedes editar a mano o regenerar.",
    related: ["dia-19", "dia-20", "dia-42"],
    keywords: ["revisar", "supervisión", "control"],
  },
  {
    id: "dia-19",
    section: "dieta-ia",
    question: "¿Qué diferencia hay entre aceptar y descartar un borrador?",
    answer:
      "Al terminar la generación, el plan queda en estado BORRADOR. Si pulsas Aceptar, el borrador pasa a APLICADO y sustituye al plan de alimentación actual del paciente en ese periodo. Si pulsas Descartar, el borrador pasa a DESCARTADO y no se aplica nada: el plan activo del paciente sigue intacto. Los borradores descartados quedan en el historial de generaciones por si quieres consultarlos, pero ya no se pueden convertir en aplicados; para eso tendrías que lanzar una nueva generación.",
    related: ["dia-20", "dia-21", "dia-25"],
    keywords: ["aceptar", "descartar", "borrador", "aplicado"],
  },
  {
    id: "dia-20",
    section: "dieta-ia",
    question: "¿Qué significan los estados BORRADOR, APLICADO y DESCARTADO?",
    answer:
      "Son los tres estados posibles de una generación de IA. BORRADOR es la propuesta recién creada, pendiente de tu decisión, que aún no ha sobrescrito el plan del paciente. APLICADO indica que has aceptado el borrador y se ha sustituido el plan de alimentación en el periodo correspondiente. DESCARTADO es un borrador que decidiste no aplicar: queda archivado pero no afecta al plan activo. Solo puede haber un plan APLICADO para cada semana del paciente en un momento dado.",
    related: ["dia-19", "dia-25", "dia-41"],
    keywords: ["estados", "borrador", "aplicado", "descartado"],
  },
  {
    id: "dia-21",
    section: "dieta-ia",
    question: "¿Al aceptar un borrador se sobrescribe el plan actual?",
    answer:
      "Sí. Cuando aceptas un borrador, el plan de alimentación activo para esa semana se sustituye por el generado por la IA. Las comidas anteriores dejan de formar parte del plan aplicado, aunque quedan trazadas en el historial del paciente. Por eso es importante revisar bien antes de aceptar y, si dudas, descartar y volver a generar. Si necesitas volver al plan anterior, tendrás que recuperarlo manualmente o aplicar una plantilla previa.",
    related: ["dia-19", "dia-43", "dia-44"],
    keywords: ["sobrescribir", "reemplazar", "aplicar"],
  },
  {
    id: "dia-22",
    section: "dieta-ia",
    question: "¿Puedo ver el historial de generaciones anteriores?",
    answer:
      "Sí, en la vista del plan del paciente hay una sección de historial donde aparecen todas las generaciones de IA realizadas con su estado (aplicada o descartada), la fecha y los parámetros usados. Desde ahí puedes consultar qué kcal y macros pediste, qué instrucciones libres escribiste y el contenido del borrador. Es útil para comparar iteraciones o para recuperar ideas de generaciones anteriores, aunque no se pueden reactivar los borradores descartados directamente.",
    related: ["dia-19", "dia-20", "dia-43"],
    keywords: ["historial", "auditoría", "registro", "anteriores"],
  },
  {
    id: "dia-23",
    section: "dieta-ia",
    question: "¿Puedo reintentar si el plan generado no me convence?",
    answer:
      "Por supuesto. Si el borrador no te convence, pulsa Descartar y vuelve a lanzar otra generación, ajustando los parámetros o reforzando las instrucciones. No hay límite razonable de reintentos dentro del mismo plan, más allá de los límites de rate y cuota del proveedor. Cada intento tarda entre treinta y noventa segundos, así que hazlo con calma. Suele ser más productivo afinar el texto de instrucciones entre intento e intento que repetir con los mismos parámetros.",
    related: ["dia-19", "dia-15", "dia-26"],
    keywords: ["reintentar", "regenerar", "repetir"],
  },
  {
    id: "dia-24",
    section: "dieta-ia",
    question: "¿Cómo se configuran las claves API del proveedor?",
    answer:
      "Las claves de API de Groq y OpenAI se configuran a nivel de despliegue en variables de entorno del servidor, normalmente en el fichero `.env` junto a otras credenciales. Las variables habituales son `GROQ_API_KEY` y `OPENAI_API_KEY`. Si estás desplegando la aplicación tú mismo, debes obtener las claves en las plataformas correspondientes y añadirlas antes de arrancar. Como usuario final de AppNutrición en una instalación gestionada, no tocas estas claves: ya están configuradas.",
    related: ["dia-11", "dia-12", "dia-27"],
    keywords: ["api", "claves", "env", "configuración"],
  },
  {
    id: "dia-25",
    section: "dieta-ia",
    question: "¿Qué privacidad tienen los datos que envío al modelo?",
    answer:
      "Cuando pulsas Generar, los datos relevantes del paciente (alergias, intolerancias, patologías, objetivo, preferencias, medidas básicas) y tus instrucciones libres viajan al proveedor de IA elegido (Groq o, en fallback, OpenAI) para producir la respuesta. Ambos proveedores declaran no usar ese contenido para entrenar sus modelos en sus endpoints de API. Aun así, evita introducir en las instrucciones libres datos identificativos innecesarios como nombre completo, DNI o teléfono. El sistema solo envía lo imprescindible para generar el plan.",
    related: ["dia-11", "dia-12", "dia-24"],
    keywords: ["privacidad", "datos", "proveedor", "rgpd"],
  },
  {
    id: "dia-26",
    section: "dieta-ia",
    question: "¿La calidad de las sugerencias es siempre la misma?",
    answer:
      "No exactamente. Los modelos de lenguaje introducen cierta variabilidad entre generaciones incluso con los mismos parámetros, por eso dos ejecuciones seguidas no producen planes idénticos. La calidad también depende de la claridad de tus instrucciones, de la completitud de la ficha del paciente y del estado del servicio en ese momento. Si una generación sale mediocre, suele bastar con reintentar o reescribir las instrucciones con más contexto. Con el tiempo desarrollarás un estilo de prompt que funciona bien para tu práctica.",
    related: ["dia-15", "dia-23", "dia-48"],
    keywords: ["calidad", "variabilidad", "resultados"],
  },
  {
    id: "dia-27",
    section: "dieta-ia",
    question: "¿Qué errores comunes pueden aparecer al generar?",
    answer:
      "Los errores más habituales son: timeout por lentitud del proveedor, respuesta mal formateada que no se puede parsear, rate limit alcanzado al lanzar muchas generaciones seguidas, clave API inválida o cuota mensual agotada. El sistema intenta recuperarse con el fallback a OpenAI, pero si también falla verás un mensaje en pantalla. En ese caso espera unos minutos y reintenta, o revisa con el administrador de la instalación que las claves y cuotas estén al día.",
    related: ["dia-12", "dia-24", "dia-31"],
    keywords: ["errores", "timeout", "rate limit", "fallos"],
  },
  {
    id: "dia-28",
    section: "dieta-ia",
    question: "¿La IA crea alimentos nuevos o solo usa los existentes?",
    answer:
      "La IA solo usa alimentos que ya existen en tu base de datos dentro de AppNutrición. El sistema le proporciona un catálogo filtrado y el modelo selecciona de ahí; no inventa entradas nuevas. Por eso es importante que tu base de alimentos esté completa y bien categorizada antes de usar la generación, especialmente si trabajas con colectivos específicos (veganos, deportistas, etc.). Si echas en falta un alimento recurrente, añádelo manualmente en la sección Alimentos y aparecerá en las siguientes generaciones.",
    related: ["dia-29", "dia-34", "dia-35"],
    keywords: ["alimentos", "base de datos", "catálogo"],
  },
  {
    id: "dia-29",
    section: "dieta-ia",
    question: "¿Se puede usar la IA en el Plan Básico?",
    answer:
      "No. La generación con IA es una funcionalidad exclusiva del Plan Profesional de AppNutrición. En el Plan Básico el botón de \"Generar con IA\" no aparece o aparece bloqueado, y solo puedes crear planes manualmente o a partir de plantillas. Si te interesa probar la IA, puedes actualizar tu suscripción desde la sección de Ajustes, apartado Suscripción. El cambio se aplica de inmediato y podrás generar desde el primer plan que edites.",
    related: ["dia-30", "dia-2", "dia-32"],
    keywords: ["plan básico", "suscripción", "profesional"],
  },
  {
    id: "dia-30",
    section: "dieta-ia",
    question: "¿Qué incluye el Plan Profesional respecto a la IA?",
    answer:
      "El Plan Profesional incluye acceso completo a la generación de planes con IA, con todas las funciones descritas: formulario de kcal y macros, instrucciones libres, uso de la ficha del paciente, tres lotes, fallback a OpenAI, historial de borradores y estados BORRADOR/APLICADO/DESCARTADO. También incluye el resto de funcionalidades avanzadas (mensajes, portal paciente, etc.). El coste se factura por suscripción mensual o anual según el plan elegido y cubre un uso razonable dentro de las cuotas del proveedor.",
    related: ["dia-29", "dia-31", "dia-32"],
    keywords: ["profesional", "coste", "suscripción"],
  },
  {
    id: "dia-31",
    section: "dieta-ia",
    question: "¿Hay límites de uso por rate limits?",
    answer:
      "Sí. Tanto Groq como OpenAI aplican límites de peticiones por minuto, por hora o por día según el tipo de cuenta. En uso normal es muy difícil toparse con ellos, pero si lanzas muchas generaciones seguidas para el mismo paciente o trabajas en equipo con varios profesionales al mismo tiempo, puede aparecer un error de rate limit. La solución es esperar un par de minutos y reintentar. Si ocurre con frecuencia, revisa con el administrador si conviene subir el tier del proveedor.",
    related: ["dia-27", "dia-30", "dia-23"],
    keywords: ["rate limit", "cuota", "uso"],
  },
  {
    id: "dia-32",
    section: "dieta-ia",
    question: "¿Puedo generar planes en otros idiomas?",
    answer:
      "Actualmente la generación está optimizada para castellano y es el único idioma en el que se garantiza calidad. Los prompts del sistema, los nombres de los alimentos y la lógica de parseo están en español, por lo que pedir un plan en inglés u otro idioma produciría resultados inconsistentes. Si atiendes a pacientes no hispanohablantes, genera en castellano y traduce manualmente los nombres al compartir el plan. Ampliar idiomas es una mejora prevista pero no disponible hoy.",
    related: ["dia-6", "dia-26", "dia-28"],
    keywords: ["idioma", "castellano", "traducir"],
  },
  {
    id: "dia-33",
    section: "dieta-ia",
    question: "¿La IA solo genera planes de una semana?",
    answer:
      "Sí, la generación actual produce un plan semanal de siete días y no planes de mayor duración. Si necesitas cubrir más tiempo, genera semana a semana o usa el plan generado como base y repítelo alternando con variantes. La mayoría de seguimientos nutricionales se organizan por semanas, por lo que esta granularidad encaja con la práctica habitual. Si el paciente requiere ciclos específicos (menstrual, entrenamiento por microciclos, etc.) te conviene más editar a mano sobre el plan generado.",
    related: ["dia-14", "dia-36", "dia-42"],
    keywords: ["semanal", "duración", "7 días"],
  },
  {
    id: "dia-34",
    section: "dieta-ia",
    question: "¿Las cantidades propuestas son realistas?",
    answer:
      "El modelo intenta proponer cantidades en gramos coherentes con las raciones habituales del alimento y con las kcal objetivo. En la mayoría de casos las cifras son razonables, pero pueden aparecer gramajes atípicos (muy altos o muy bajos) en alimentos con densidad calórica extrema o con baja presencia en el catálogo. Siempre conviene revisar un par de días y ajustar a mano si ves cantidades poco prácticas. Si un alimento concreto sale siempre mal dimensionado, reportarlo al soporte ayuda a mejorar futuras versiones.",
    related: ["dia-28", "dia-37", "dia-42"],
    keywords: ["cantidades", "gramos", "raciones"],
  },
  {
    id: "dia-35",
    section: "dieta-ia",
    question: "¿Se usan las recetas propias del dietista?",
    answer:
      "No de manera automática. La generación actual trabaja con alimentos individuales del catálogo, no con recetas compuestas guardadas en tu biblioteca. Si quieres incluir una receta concreta, tendrás que añadirla manualmente al plan tras generar, sustituyendo una comida sugerida por tu receta. Integrar recetas propias en la generación con IA es una mejora en estudio, pero hoy el modelo no las conoce. Puedes mencionar ingredientes clave de tus recetas en las instrucciones para orientar al modelo.",
    related: ["dia-28", "dia-38", "dia-42"],
    keywords: ["recetas", "propias", "biblioteca"],
  },
  {
    id: "dia-36",
    section: "dieta-ia",
    question: "¿Puedo pedir comidas frías o calientes según el caso?",
    answer:
      "Sí, y además suele ser muy útil hacerlo. En las instrucciones libres puedes escribir \"las comidas del mediodía tienen que ser en táper frío\" o \"en invierno preferimos cenas calientes\". El modelo adaptará las propuestas a esas restricciones prácticas. También puedes diferenciar por días, por ejemplo \"sábado y domingo cenas calientes elaboradas, entre semana cenas rápidas\". La flexibilidad del campo de instrucciones es una de las mejores formas de personalizar el plan.",
    related: ["dia-6", "dia-7", "dia-17"],
    keywords: ["frías", "calientes", "táper", "temperatura"],
  },
  {
    id: "dia-37",
    section: "dieta-ia",
    question: "¿Con qué precisión cumple el objetivo calórico?",
    answer:
      "El objetivo es cumplir dentro de un margen aproximado del cinco por ciento por día. En la práctica la mayoría de días salen dentro de ese rango, pero puede haber alguno que se desvíe más, especialmente si hay restricciones fuertes que limitan las combinaciones posibles. Si ves desviaciones mayores al diez por ciento, conviene ajustar a mano las cantidades o regenerar. Los macros suelen tener un margen algo más amplio porque son más difíciles de cuadrar simultáneamente.",
    related: ["dia-4", "dia-5", "dia-34"],
    keywords: ["precisión", "kcal", "margen", "5%"],
  },
  {
    id: "dia-38",
    section: "dieta-ia",
    question: "¿Puedo combinar la IA con plantillas guardadas?",
    answer:
      "Sí, es una combinación muy práctica. Una estrategia común es partir de una plantilla que ya tengas bien definida para un perfil (por ejemplo, \"omnívoro 1800 kcal\") y luego aplicar la IA solo para generar una semana nueva dentro de esa estructura. Otra estrategia es al revés: generar con IA, guardar el resultado como plantilla y reutilizarlo después con ajustes. Mezclar ambos enfoques te da velocidad y consistencia. No existe una integración automática entre plantillas y IA, pero el flujo manual es fluido.",
    related: ["dia-39", "dia-43", "dia-45"],
    keywords: ["plantillas", "combinar", "flujo"],
  },
  {
    id: "dia-39",
    section: "dieta-ia",
    question: "¿Qué es mejor, usar una plantilla o generar con IA?",
    answer:
      "Depende del caso. Las plantillas son rápidas, predecibles y reutilizables para perfiles estándar; son ideales cuando atiendes a muchos pacientes con patrones similares. La IA es mejor cuando el paciente tiene restricciones combinadas poco habituales, cuando quieres variedad o cuando la plantilla existente no encaja bien. Una práctica eficiente es tener plantillas para perfiles habituales y usar la IA en los casos particulares o como punto de partida nuevo. Ambas herramientas se complementan.",
    related: ["dia-38", "dia-30", "dia-45"],
    keywords: ["comparar", "plantilla", "vs", "ia"],
  },
  {
    id: "dia-40",
    section: "dieta-ia",
    question: "¿Puedo editar el plan después de aceptarlo?",
    answer:
      "Sí, una vez aplicado el plan funciona como cualquier otro plan manual: puedes entrar en el editor y cambiar cantidades, sustituir alimentos, añadir o eliminar comidas completas. La IA solo interviene en la creación inicial; a partir de ahí trabajas con las herramientas normales de edición. Esto es útil para afinar detalles tras la primera revisión del paciente o adaptar a cambios puntuales en su semana. Los cambios manuales no afectan al borrador original, que queda guardado tal cual lo generó la IA.",
    related: ["dia-21", "dia-41", "dia-42"],
    keywords: ["editar", "después", "modificar"],
  },
  {
    id: "dia-41",
    section: "dieta-ia",
    question: "¿Puedo comparar el plan generado con el plan anterior?",
    answer:
      "De forma directa y automática, no hay una vista comparativa lado a lado dentro de la herramienta. Pero mientras el borrador está en estado BORRADOR, el plan anterior sigue activo, así que puedes abrir la pestaña del plan aplicado actual y la del borrador en paralelo para compararlos. En el historial también puedes revisar los parámetros de generaciones anteriores. Si necesitas una comparación formal (por ejemplo, para documentar el cambio en la ficha), conviene hacerla manualmente antes de aceptar.",
    related: ["dia-22", "dia-42", "dia-43"],
    keywords: ["comparar", "anterior", "diff"],
  },
  {
    id: "dia-42",
    section: "dieta-ia",
    question: "¿Conviene hacer backup antes de aceptar un borrador?",
    answer:
      "Sí, es una buena práctica cuando el plan anterior era relevante y quieres preservarlo. Antes de aceptar el borrador, puedes guardar el plan actual como plantilla desde el editor del plan o exportarlo en PDF. Así dispondrás de una copia recuperable aunque el aplicado se sobrescriba. Esta precaución es especialmente útil en pacientes con planes muy trabajados manualmente que no quieres perder por un borrador que luego no funcione como esperabas.",
    related: ["dia-21", "dia-41", "dia-43"],
    keywords: ["backup", "copia", "seguridad"],
  },
  {
    id: "dia-43",
    section: "dieta-ia",
    question: "¿Se puede volver atrás tras aceptar un borrador?",
    answer:
      "No hay un botón de deshacer automático: una vez aceptado, el plan aplicado sustituye al anterior. Para volver a un plan previo debes recuperarlo desde una plantilla guardada, desde una exportación PDF, o reconstruirlo a mano. Por eso conviene revisar bien antes de aceptar y, si tienes dudas, descartar y regenerar. Si ya has aceptado por error, puedes lanzar una nueva generación o editar manualmente sobre el aplicado hasta dejarlo como quieres.",
    related: ["dia-21", "dia-42", "dia-40"],
    keywords: ["deshacer", "volver", "revertir"],
  },
  {
    id: "dia-44",
    section: "dieta-ia",
    question: "¿Puedo entrenar la IA con mis preferencias?",
    answer:
      "No, la IA usada por AppNutrición es un modelo preentrenado de propósito general y no se reentrena con tus datos ni con tus planes aceptados. Lo que sí puedes hacer es afinar el resultado a través de las instrucciones libres: cuanto mejor describas tu estilo y tus preferencias profesionales en ese campo, más alineado saldrá el plan. También puedes guardarte un prompt estándar en un documento para reutilizarlo entre pacientes con perfiles parecidos.",
    related: ["dia-26", "dia-6", "dia-45"],
    keywords: ["entrenar", "reentrenar", "personalizar"],
  },
  {
    id: "dia-45",
    section: "dieta-ia",
    question: "¿La IA puede tener sesgos en las recomendaciones?",
    answer:
      "Sí, como cualquier modelo de lenguaje entrenado con datos de internet. Puede tender a recomendar dietas estándar de cultura occidental, infrarrepresentar ingredientes regionales o replicar estereotipos en las raciones por sexo o edad. El diseño de AppNutrición mitiga estos sesgos usando tu catálogo de alimentos y la ficha específica del paciente, pero la revisión profesional sigue siendo imprescindible. Si detectas un sesgo sistemático, ajusta con instrucciones o pasa del modelo en ese caso concreto.",
    related: ["dia-26", "dia-46", "dia-50"],
    keywords: ["sesgos", "bias", "limitaciones"],
  },
  {
    id: "dia-46",
    section: "dieta-ia",
    question: "¿Cuánta confianza debo dar al resultado de la IA?",
    answer:
      "Trátala como una propuesta inicial de un colaborador junior: útil para ahorrar tiempo, pero siempre revisable. La IA hace bien lo mecánico (distribuir alimentos, cuadrar kcal aproximadas, respetar restricciones declaradas) y flojea en lo sutil (encajar con la realidad del paciente, considerar contexto no declarado, ajustar a cambios imprevistos). Tu juicio profesional debe estar siempre presente entre la generación y la aceptación. Con el tiempo desarrollarás intuición de cuándo fiarte más y cuándo intervenir a fondo.",
    related: ["dia-18", "dia-45", "dia-50"],
    keywords: ["confianza", "fiabilidad", "juicio"],
  },
  {
    id: "dia-47",
    section: "dieta-ia",
    question: "¿Quién es responsable del plan final, la IA o el nutricionista?",
    answer:
      "El nutricionista, siempre. La IA solo genera una propuesta que tú revisas y decides aceptar o descartar; a partir del momento en que pulsas Aceptar, el plan queda bajo tu responsabilidad profesional como cualquier otro. Esto es importante a efectos clínicos, éticos y legales: ante el paciente y ante tu colegiación, el responsable eres tú. AppNutrición te da una herramienta, no delega el criterio. Documenta tus revisiones en las notas del plan si trabajas con casos complejos.",
    related: ["dia-18", "dia-46", "dia-50"],
    keywords: ["responsabilidad", "supervisión", "profesional"],
  },
  {
    id: "dia-48",
    section: "dieta-ia",
    question: "¿Cómo sé si la sugerencia es de calidad suficiente?",
    answer:
      "Unas comprobaciones rápidas: las kcal diarias están dentro del objetivo con un margen del cinco al diez por ciento, los macros cuadran aproximadamente, no hay alimentos prohibidos para el paciente, las combinaciones son razonables desde un punto de vista práctico (nadie come bacalao en el desayuno), hay variedad entre días y las cantidades son realistas. Si fallan varias de estas pruebas, mejor descartar y regenerar con instrucciones más claras. Con la experiencia ese chequeo lo harás en un par de minutos.",
    related: ["dia-18", "dia-34", "dia-37"],
    keywords: ["calidad", "chequeo", "revisión"],
  },
  {
    id: "dia-49",
    section: "dieta-ia",
    question: "¿Cuándo NO conviene usar la IA para generar?",
    answer:
      "Hay situaciones en las que la IA aporta poco o puede complicar. Casos con patologías muy complejas que requieren ajustes finos (enfermedad renal avanzada, trastornos metabólicos raros), pacientes con múltiples alergias combinadas que dejan poco margen al modelo, protocolos muy específicos (dieta cetogénica terapéutica, FODMAP estricta por fases, dietas de eliminación diagnóstica) o cuando el paciente ya viene con un plan muy pulido que solo necesita retoques pequeños. En esos casos es más eficiente trabajar manualmente o con plantillas especializadas.",
    related: ["dia-10", "dia-39", "dia-50"],
    keywords: ["cuándo", "no usar", "limitaciones"],
  },
  {
    id: "dia-50",
    section: "dieta-ia",
    question: "¿Qué resumen final debería tener claro antes de usar la IA?",
    answer:
      "Tres ideas clave. Primero, la IA es una ayuda para ahorrar tiempo, no un sustituto del criterio profesional: tú firmas el plan. Segundo, la calidad del resultado depende de la ficha del paciente, de los parámetros del formulario y, sobre todo, de las instrucciones libres: cuanto mejor comuniques, mejor saldrá. Tercero, el flujo es seguro porque nada se aplica hasta que aceptas el borrador y puedes regenerar tantas veces como necesites. Con esa mentalidad, la IA se convierte en un multiplicador real de tu productividad clínica.",
    related: ["dia-1", "dia-18", "dia-47"],
    keywords: ["resumen", "clave", "buenas prácticas"],
  },
];
