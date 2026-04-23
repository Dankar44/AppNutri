import type { HelpEntry } from "../types";

export const PACIENTE_SEGUIMIENTO_ENTRIES: HelpEntry[] = [
  {
    id: "seg-1",
    section: "paciente-seguimiento",
    question: "¿Qué es la pestaña Seguimiento de la ficha del paciente?",
    answer:
      "La pestaña Seguimiento muestra los registros diarios que el paciente va introduciendo desde su portal: qué ha comido en cada comida, cuánta agua ha bebido, si ha hecho ejercicio y cuánto, notas personales y si ha cumplido el plan ese día. Como nutricionista solo lees esta información; es una ventana directa al día a día del paciente.",
    related: ["seg-2", "seg-3", "seg-20"],
    keywords: ["seguimiento", "pestaña", "registros diarios", "día a día", "qué es"],
  },
  {
    id: "seg-2",
    section: "paciente-seguimiento",
    question: "¿Cómo accedo a la pestaña Seguimiento?",
    answer:
      "Entra en la ficha del paciente desde el listado de Pacientes y selecciona la pestaña Seguimiento. También puedes abrirla directamente con la URL /pacientes/[id]?pestana=seguimiento si conoces el identificador del paciente.",
    related: ["seg-1", "seg-4"],
    keywords: ["acceder", "abrir", "pestaña", "url", "navegación"],
  },
  {
    id: "seg-3",
    section: "paciente-seguimiento",
    question: "¿En qué se diferencia Seguimiento de Mediciones?",
    answer:
      "Son pestañas complementarias pero distintas. Mediciones recoge datos antropométricos puntuales (peso, grasa, perímetros), normalmente tomados en consulta. Seguimiento recoge lo que el paciente hace cada día: qué come, cuánta agua bebe, si entrena. Mediciones responde a cómo evoluciona el cuerpo; Seguimiento responde a qué hace el paciente para que evolucione.",
    related: ["seg-1", "seg-50"],
    keywords: ["diferencia", "mediciones", "antropometría", "comparación", "comidas"],
  },
  {
    id: "seg-4",
    section: "paciente-seguimiento",
    question: "¿Cómo se organiza la vista de Seguimiento?",
    answer:
      "La vista principal es un calendario mensual con un icono por cada día que indica si el paciente cumplió el plan. Al pulsar un día concreto se abre el detalle con las comidas, agua, ejercicio y notas de ese día. En la parte superior hay filtros por rango de fechas y gráficos de evolución.",
    related: ["seg-5", "seg-6", "seg-10"],
    keywords: ["organización", "vista", "calendario", "detalle", "gráficos"],
  },
  {
    id: "seg-5",
    section: "paciente-seguimiento",
    question: "¿Qué es la vista mensual tipo calendario?",
    answer:
      "La vista mensual es una cuadrícula con los días del mes seleccionado. Cada casilla muestra el día y un icono resumen del cumplimiento: verde con check si el paciente marcó el plan como cumplido, rojo con cruz si lo marcó como no cumplido y gris si no registró nada ese día. Es útil para detectar patrones de adherencia de un vistazo.",
    related: ["seg-4", "seg-6", "seg-7"],
    keywords: ["vista mensual", "calendario", "mes", "cuadrícula", "días"],
  },
  {
    id: "seg-6",
    section: "paciente-seguimiento",
    question: "¿Qué significa el icono de cumplido o no cumplido en cada día?",
    answer:
      "El icono refleja lo que el paciente marcó en su portal al registrar el día. Un check verde indica que el paciente dice haber cumplido el plan; una cruz roja indica que reconoce no haberlo cumplido; un día sin icono significa que no registró nada. Es un dato auto-declarado, no una validación automática.",
    related: ["seg-5", "seg-19", "seg-43"],
    keywords: ["icono", "cumplido", "no cumplido", "check", "cruz"],
  },
  {
    id: "seg-7",
    section: "paciente-seguimiento",
    question: "¿Qué pasa al pulsar un día concreto del calendario?",
    answer:
      "Al pulsar un día se abre la vista de detalle de ese día en un panel lateral o en el espacio principal. Verás las comidas registradas, el agua consumida en ml, si hubo ejercicio y sus datos, las notas del paciente y el estado de cumplimiento. Desde ahí puedes navegar al día anterior o siguiente con flechas.",
    related: ["seg-5", "seg-8", "seg-9"],
    keywords: ["click día", "detalle", "abrir", "panel", "navegar"],
  },
  {
    id: "seg-8",
    section: "paciente-seguimiento",
    question: "¿Qué veo en la vista de detalle de un día?",
    answer:
      "La vista de detalle de un día muestra cuatro bloques principales: comidas del paciente con lo que anotó en cada una (desayuno, media mañana, comida, merienda, cena, resopón), agua total en ml, ejercicio con minutos y kilocalorías y las notas libres del paciente. En la cabecera verás la fecha y el estado de cumplimiento.",
    related: ["seg-7", "seg-9", "seg-11"],
    keywords: ["detalle día", "comidas", "agua", "ejercicio", "notas"],
  },
  {
    id: "seg-9",
    section: "paciente-seguimiento",
    question: "¿Qué son las comidas del paciente en el detalle del día?",
    answer:
      "Son las entradas que el paciente introduce desde su portal por cada franja del día. Para cada comida ves lo que ha comido, tal y como lo describió, junto con las kilocalorías y macros si se calcularon automáticamente. Si el paciente dejó una comida vacía, aparecerá como no registrada.",
    related: ["seg-8", "seg-12", "seg-14"],
    keywords: ["comidas paciente", "desayuno", "cena", "registro", "entradas"],
  },
  {
    id: "seg-10",
    section: "paciente-seguimiento",
    question: "¿Cómo funcionan los filtros por rango de fechas?",
    answer:
      "Encima del calendario hay un selector de rango donde puedes elegir una fecha de inicio y una de fin. Las gráficas y los indicadores se recalculan con los días incluidos en ese rango. Es útil para analizar una semana concreta, el mes que llevas con el paciente o desde la última consulta.",
    related: ["seg-4", "seg-28", "seg-29"],
    keywords: ["filtros fecha", "rango", "desde hasta", "semana", "mes"],
  },
  {
    id: "seg-11",
    section: "paciente-seguimiento",
    question: "¿Qué es el campo comidasData?",
    answer:
      "comidasData es el JSON interno donde el sistema guarda lo que el paciente ha registrado en cada comida del día. Incluye el nombre de la comida, los alimentos o descripciones que introdujo el paciente y las cantidades. No lo ves como tal, pero es lo que alimenta la vista de detalle y los cálculos automáticos de macros.",
    related: ["seg-9", "seg-14", "seg-15"],
    keywords: ["comidasData", "json", "estructura", "interno", "datos"],
  },
  {
    id: "seg-12",
    section: "paciente-seguimiento",
    question: "¿Qué comidas puede registrar el paciente al día?",
    answer:
      "El paciente puede registrar hasta seis comidas por día: desayuno, media mañana, comida, merienda, cena y resopón. Si su plan solo tiene cinco o cuatro, dejará las demás vacías. Verás en el detalle únicamente las que completó, de modo que el registro refleje su rutina real.",
    related: ["seg-9", "seg-11", "seg-13"],
    keywords: ["comidas día", "desayuno", "media mañana", "merienda", "resopón"],
  },
  {
    id: "seg-13",
    section: "paciente-seguimiento",
    question: "¿Qué registra el paciente en el campo agua?",
    answer:
      "El paciente registra el agua bebida durante el día en mililitros. En su portal tiene botones de más y menos que van sumando en pasos (por ejemplo 250 ml por pulsación). En la vista del nutri ves el total del día, por ejemplo 2.250 ml, junto con el objetivo si lo tienes definido.",
    related: ["seg-8", "seg-32", "seg-38"],
    keywords: ["agua", "ml", "mililitros", "botones", "hidratación"],
  },
  {
    id: "seg-14",
    section: "paciente-seguimiento",
    question: "¿Cómo se calculan los macros de lo que ha comido el paciente?",
    answer:
      "Cuando el paciente registra una comida, el sistema intenta asociar los alimentos introducidos a la base de datos de Alimentos para sumar automáticamente calorías, proteínas, hidratos y grasas. Si el alimento se reconoce, los macros se calculan; si el paciente describió libremente sin vincular alimento, la entrada queda como texto y no suma macros.",
    related: ["seg-9", "seg-15", "seg-16"],
    keywords: ["macros", "cálculo", "automático", "calorías", "proteínas"],
  },
  {
    id: "seg-15",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si el paciente describe una comida en texto libre?",
    answer:
      "Si el paciente escribe algo como 'ensalada variada' sin seleccionar alimentos concretos, el sistema no puede calcular macros y la comida queda como registro cualitativo. Verás el texto en el detalle del día, pero no aportará kilocalorías al total. Para tener macros fiables, anima al paciente a seleccionar alimentos del buscador.",
    related: ["seg-14", "seg-16", "seg-17"],
    keywords: ["texto libre", "descripción", "sin macros", "cualitativo", "alimento"],
  },
  {
    id: "seg-16",
    section: "paciente-seguimiento",
    question: "¿Cómo se suman los totales de macros del día?",
    answer:
      "El sistema suma las calorías, proteínas, hidratos y grasas de todas las comidas reconocidas del día y muestra el total en la cabecera del detalle. Si el paciente también ha registrado ejercicio, verás el gasto estimado. Los totales sirven para comparar con los objetivos del plan del paciente.",
    related: ["seg-14", "seg-17", "seg-18"],
    keywords: ["totales", "suma", "día", "calorías totales", "macros día"],
  },
  {
    id: "seg-17",
    section: "paciente-seguimiento",
    question: "¿Puedo comparar lo que ha comido con lo que dice el plan?",
    answer:
      "Sí. En el detalle del día, si el paciente tiene un plan de alimentación activo, se muestra una comparación entre los macros del plan y los macros reales de lo registrado. Verás diferencias de calorías, proteínas, hidratos y grasas. Es la mejor forma de detectar desviaciones sin hacer cuentas a mano.",
    related: ["seg-16", "seg-18", "seg-33"],
    keywords: ["comparar plan", "plan vs real", "desviación", "objetivo", "diferencia"],
  },
  {
    id: "seg-18",
    section: "paciente-seguimiento",
    question: "¿Qué es la comparación plan vs real?",
    answer:
      "Es una tabla o gráfico que enfrenta los valores prescritos en el plan del paciente (calorías, proteínas, hidratos, grasas) frente a los valores reales registrados. Se calcula día a día y permite ver si el paciente se queda corto, se pasa o sigue el plan. También hay una visión promediada del rango.",
    related: ["seg-17", "seg-33", "seg-34"],
    keywords: ["plan vs real", "comparación", "prescrito", "real", "tabla"],
  },
  {
    id: "seg-19",
    section: "paciente-seguimiento",
    question: "¿Qué indica el ejercicio registrado?",
    answer:
      "Cuando el paciente ha hecho ejercicio ese día, marca en su portal la casilla de ejercicio e indica los minutos y, opcionalmente, las kilocalorías quemadas. En la vista de detalle ves los minutos, el gasto estimado y una descripción si la introdujo. Si no marcó ejercicio, figura como día sin actividad.",
    related: ["seg-6", "seg-20", "seg-21"],
    keywords: ["ejercicio", "minutos", "kcal", "actividad", "entrenamiento"],
  },
  {
    id: "seg-20",
    section: "paciente-seguimiento",
    question: "¿Qué datos hay en el bloque de ejercicio del día?",
    answer:
      "El bloque de ejercicio muestra tres datos: si hubo o no ejercicio (sí/no), los minutos totales que entrenó y las kilocalorías estimadas del entrenamiento. Si el paciente añadió descripción, también aparece. Es un registro simple: no pretende sustituir una app deportiva, solo reflejar la actividad general.",
    related: ["seg-19", "seg-21", "seg-22"],
    keywords: ["ejercicio bloque", "minutos", "kcal ejercicio", "descripción", "actividad"],
  },
  {
    id: "seg-21",
    section: "paciente-seguimiento",
    question: "¿Las kilocalorías del ejercicio se restan a las consumidas?",
    answer:
      "Por defecto no. Las kilocalorías del ejercicio se muestran como dato aparte y no se restan automáticamente de las consumidas. Puedes interpretarlas tú para valorar si el balance energético del día cuadra con el objetivo. En los gráficos de tendencia sí se muestran como capa adicional.",
    related: ["seg-19", "seg-20", "seg-34"],
    keywords: ["kcal ejercicio", "balance energético", "resta", "déficit", "gasto"],
  },
  {
    id: "seg-22",
    section: "paciente-seguimiento",
    question: "¿Qué son las notas del paciente en el seguimiento?",
    answer:
      "Cada día el paciente puede añadir una nota libre en su portal explicando cómo se ha sentido, si ha tenido un compromiso social, si ha hecho trampa o si ha notado algún síntoma. Esas notas aparecen en el detalle del día y son muy valiosas para entender el contexto detrás de los números.",
    related: ["seg-8", "seg-23", "seg-41"],
    keywords: ["notas paciente", "comentarios", "nota libre", "contexto", "observaciones"],
  },
  {
    id: "seg-23",
    section: "paciente-seguimiento",
    question: "¿Puedo responder a las notas del paciente desde Seguimiento?",
    answer:
      "Desde la pestaña Seguimiento no hay un botón de respuesta directo a una nota concreta. Si quieres comentar algo que has leído, ábrele un mensaje desde la pestaña Mensajes o guárdalo como punto a tratar en la próxima consulta. El seguimiento es de solo lectura para el nutri.",
    related: ["seg-22", "seg-46", "seg-57"],
    keywords: ["responder notas", "mensaje", "consulta", "solo lectura", "comentar"],
  },
  {
    id: "seg-24",
    section: "paciente-seguimiento",
    question: "¿Cómo registra el paciente su seguimiento diario?",
    answer:
      "Desde su portal, el paciente entra en la sección Seguimiento de su panel. Cada día abre el registro, añade lo que ha comido en cada comida, suma vasos o botones de agua, marca si hizo ejercicio y durante cuántos minutos, escribe notas si quiere y marca si ha cumplido el plan. Al guardar, los datos se envían al nutri.",
    related: ["seg-1", "seg-25", "seg-26"],
    keywords: ["registro paciente", "portal paciente", "cómo registra", "diario", "guardar"],
  },
  {
    id: "seg-25",
    section: "paciente-seguimiento",
    question: "¿Puede el paciente registrar el seguimiento de días pasados?",
    answer:
      "Sí, el paciente puede recuperar días anteriores en su portal y añadir o completar el registro. Esto es útil cuando un día se olvidó de apuntar y quiere reconstruirlo. La fecha del registro respetará el día al que se refiere, no el día en que se introdujo.",
    related: ["seg-24", "seg-26", "seg-52"],
    keywords: ["días pasados", "retroactivo", "añadir", "completar", "olvido"],
  },
  {
    id: "seg-26",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si el paciente no registra ningún día?",
    answer:
      "La vista mensual aparecerá vacía y las gráficas y los porcentajes de adherencia no podrán calcularse. Verás un estado vacío con un mensaje como 'Este paciente aún no ha registrado ningún seguimiento'. Es una buena señal para recordarle el hábito o revisar si tiene dudas con el portal.",
    related: ["seg-25", "seg-35", "seg-56"],
    keywords: ["sin registros", "vacío", "ningún día", "estado vacío", "sin seguimiento"],
  },
  {
    id: "seg-27",
    section: "paciente-seguimiento",
    question: "¿Qué gráficos puedo ver del seguimiento del paciente?",
    answer:
      "El seguimiento incluye gráficos de evolución del rango seleccionado: agua diaria en ml, minutos de ejercicio, kilocalorías consumidas y porcentaje de adherencia al plan. Todos se pintan por día para ver regularidad, picos y caídas. Los gráficos solo se muestran cuando hay suficientes registros.",
    related: ["seg-28", "seg-29", "seg-30"],
    keywords: ["gráficos", "evolución", "agua diaria", "ejercicio", "adherencia"],
  },
  {
    id: "seg-28",
    section: "paciente-seguimiento",
    question: "¿Cómo se calcula la adherencia al plan?",
    answer:
      "La adherencia al plan se calcula como el porcentaje de días del rango en los que el paciente marcó cumplido sobre el total de días con algún registro. Si en 20 días registrados ha marcado cumplido en 16, la adherencia es del 80%. Los días sin registro no cuentan como cumplidos ni como incumplidos.",
    related: ["seg-27", "seg-29", "seg-35"],
    keywords: ["adherencia", "porcentaje", "cumplimiento", "cálculo", "plan"],
  },
  {
    id: "seg-29",
    section: "paciente-seguimiento",
    question: "¿Qué tendencias semanales o mensuales puedo ver?",
    answer:
      "En los gráficos puedes alternar la granularidad entre día, semana y mes. La vista semanal promedia los valores de cada semana del rango; la mensual hace lo propio por mes. Así detectas tendencias estables más allá del ruido del día a día, por ejemplo semanas flojas o meses de muy buena adherencia.",
    related: ["seg-27", "seg-28", "seg-30"],
    keywords: ["tendencia", "semanal", "mensual", "promedio", "granularidad"],
  },
  {
    id: "seg-30",
    section: "paciente-seguimiento",
    question: "¿Cómo interpreto los gráficos del seguimiento?",
    answer:
      "Fíjate primero en la regularidad: días en blanco, caídas los fines de semana, picos puntuales. Después mira los niveles absolutos frente a los objetivos del plan. Por último, busca patrones: si el ejercicio baja y la adherencia también, probablemente ambos estén ligados. No saques conclusiones de un solo día suelto.",
    related: ["seg-29", "seg-45", "seg-51"],
    keywords: ["interpretar", "gráficos", "patrones", "análisis", "conclusiones"],
  },
  {
    id: "seg-31",
    section: "paciente-seguimiento",
    question: "¿Hay alertas si el paciente se desvía mucho del plan?",
    answer:
      "Sí. Cuando las calorías reales del día quedan muy por debajo o muy por encima del objetivo del plan, la vista de detalle marca ese día con un aviso visual (un triángulo de desvío o texto en color). Es una ayuda visual para detectar rápido problemas de infraingesta o excesos.",
    related: ["seg-17", "seg-32", "seg-34"],
    keywords: ["alerta desvío", "aviso", "infraingesta", "exceso", "calorías"],
  },
  {
    id: "seg-32",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si el paciente bebe menos de 2 litros de agua al día?",
    answer:
      "El seguimiento no impone un umbral fijo, pero si fijas un objetivo de hidratación (por ejemplo 2.000 ml), los días en los que el paciente quede por debajo se marcarán como insuficientes. Si no tienes objetivo configurado, simplemente verás el total del día sin coloreado específico.",
    related: ["seg-13", "seg-31", "seg-38"],
    keywords: ["menos 2 litros", "hidratación", "agua", "objetivo", "insuficiente"],
  },
  {
    id: "seg-33",
    section: "paciente-seguimiento",
    question: "¿Cómo compruebo si el paciente se queda corto de calorías?",
    answer:
      "Abre el detalle del día y fíjate en la sección plan vs real. Si las calorías reales son significativamente menores que las del plan durante varios días seguidos, probablemente haya infraingesta. También puedes revisar el gráfico de calorías del rango para ver tendencias.",
    related: ["seg-17", "seg-18", "seg-31"],
    keywords: ["infraingesta", "calorías bajas", "déficit", "plan vs real", "desvío"],
  },
  {
    id: "seg-34",
    section: "paciente-seguimiento",
    question: "¿Cómo detecto si el paciente se pasa de calorías?",
    answer:
      "Igual que con la infraingesta, pero al revés: revisa el detalle del día o el gráfico de calorías del rango. Si el paciente supera regularmente el objetivo del plan, verás picos por encima de la línea objetivo. Cruzando con las notas del paciente suele aparecer el motivo (compromisos sociales, ansiedad, viajes).",
    related: ["seg-17", "seg-31", "seg-33"],
    keywords: ["exceso", "pasa calorías", "por encima", "detectar", "picos"],
  },
  {
    id: "seg-35",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si el paciente no hace ejercicio varios días seguidos?",
    answer:
      "En el gráfico de ejercicio verás una secuencia de ceros consecutivos y en el calendario varios días sin actividad. Si el plan incluye ejercicio, esta racha es una señal para abordar en consulta o con un mensaje. El sistema no envía alertas automáticas por esto, pero el patrón es visible de un vistazo.",
    related: ["seg-27", "seg-30", "seg-45"],
    keywords: ["sin ejercicio", "racha", "días seguidos", "sedentarismo", "inactividad"],
  },
  {
    id: "seg-36",
    section: "paciente-seguimiento",
    question: "¿Se notifica algo cuando el paciente registra un día?",
    answer:
      "Sí. Cada vez que el paciente guarda un registro nuevo, el sistema genera una notificación interna del tipo DIARIO_NUEVO dirigida al nutricionista responsable. La verás en la campana de notificaciones de la cabecera, junto con el nombre del paciente y la fecha a la que corresponde el registro.",
    related: ["seg-37", "seg-39", "seg-40"],
    keywords: ["notificación", "DIARIO_NUEVO", "aviso", "registra", "campana"],
  },
  {
    id: "seg-37",
    section: "paciente-seguimiento",
    question: "¿Qué es la notificación DIARIO_NUEVO?",
    answer:
      "DIARIO_NUEVO es el tipo de notificación que dispara el sistema cuando un paciente registra un seguimiento diario. Aparece en la lista de notificaciones con un icono específico y un enlace directo a la pestaña Seguimiento del paciente. Así puedes abrirlo rápido sin buscar en el listado de pacientes.",
    related: ["seg-36", "seg-38", "seg-39"],
    keywords: ["DIARIO_NUEVO", "tipo", "notificación", "enlace", "icono"],
  },
  {
    id: "seg-38",
    section: "paciente-seguimiento",
    question: "¿Cuándo se marca como leída la notificación DIARIO_NUEVO?",
    answer:
      "La notificación se marca automáticamente como leída cuando entras en la pestaña Seguimiento del paciente correspondiente. No hace falta que pulses nada extra: al visualizar la información, el sistema entiende que ya la has consultado y retira el indicador rojo del campanario.",
    related: ["seg-36", "seg-37", "seg-39"],
    keywords: ["marcar leída", "leída automática", "entrar", "campana", "consultar"],
  },
  {
    id: "seg-39",
    section: "paciente-seguimiento",
    question: "¿Puedo desactivar las notificaciones DIARIO_NUEVO?",
    answer:
      "Sí. Desde la sección Notificaciones o Ajustes de perfil puedes activar o desactivar los distintos tipos de notificación, incluido DIARIO_NUEVO. Si trabajas con muchos pacientes puede ser útil silenciarlas y revisar el seguimiento en bloque una vez al día, en vez de recibir un aviso por cada registro.",
    related: ["seg-36", "seg-37", "seg-38"],
    keywords: ["desactivar", "silenciar", "ajustes", "preferencias", "bloque"],
  },
  {
    id: "seg-40",
    section: "paciente-seguimiento",
    question: "¿Con qué frecuencia se recomienda que el paciente registre?",
    answer:
      "La recomendación estándar es registro diario, idealmente al final del día o en dos o tres momentos (después de comer y cenar). La regularidad importa más que el detalle: un registro breve cada día es mejor que uno perfecto una vez a la semana. Comunícaselo al paciente cuando le des el alta en el portal.",
    related: ["seg-24", "seg-26", "seg-46"],
    keywords: ["frecuencia", "diario", "recomendación", "hábito", "regularidad"],
  },
  {
    id: "seg-41",
    section: "paciente-seguimiento",
    question: "¿Puedo editar el seguimiento del paciente?",
    answer:
      "No. La pestaña Seguimiento es de solo lectura para el nutri. Lo que registra el paciente es su realidad auto-reportada y no puedes modificarla desde el panel del profesional. Si hay un error evidente, coméntaselo al paciente para que lo corrija desde su portal.",
    related: ["seg-42", "seg-43", "seg-44"],
    keywords: ["editar", "solo lectura", "modificar", "permisos", "no edita"],
  },
  {
    id: "seg-42",
    section: "paciente-seguimiento",
    question: "¿Puedo borrar un registro de seguimiento del paciente?",
    answer:
      "No, desde la vista del nutri no es posible borrar registros de seguimiento. Solo el paciente puede eliminar sus propios registros desde su portal. Esto protege la integridad de los datos que reporta el paciente y evita malentendidos sobre quién modificó qué.",
    related: ["seg-41", "seg-43", "seg-44"],
    keywords: ["borrar", "eliminar", "registro", "no puedo", "integridad"],
  },
  {
    id: "seg-43",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si el paciente borra un registro desde su portal?",
    answer:
      "Si el paciente elimina un registro diario desde su portal, desaparece también de tu vista de Seguimiento: el día pasa a figurar como no registrado, las gráficas se recalculan y los totales del rango se actualizan. No queda un histórico de auditoría visible del registro borrado.",
    related: ["seg-41", "seg-42", "seg-56"],
    keywords: ["paciente borra", "desaparece", "eliminar portal", "recalcular", "auditoría"],
  },
  {
    id: "seg-44",
    section: "paciente-seguimiento",
    question: "¿Puedo modificar las notas del paciente?",
    answer:
      "No. Las notas que el paciente escribe en su seguimiento son suyas y no pueden ser editadas por el nutri. Si quieres comentar algo sobre una nota, utilízala como punto de partida para un mensaje o para la siguiente consulta, pero el texto original permanece inalterado.",
    related: ["seg-22", "seg-23", "seg-41"],
    keywords: ["modificar notas", "editar notas", "no edita", "paciente escribe", "intacto"],
  },
  {
    id: "seg-45",
    section: "paciente-seguimiento",
    question: "¿Cómo doy feedback al paciente sobre su seguimiento?",
    answer:
      "Tras revisar el seguimiento, envía un mensaje desde la pestaña Mensajes con comentarios concretos: qué ha hecho bien, qué puede mejorar, qué cambiar para la próxima semana. Evita juicios y céntrate en dos o tres puntos prácticos. También puedes anotarlos para abordarlos en la siguiente consulta.",
    related: ["seg-23", "seg-46", "seg-47"],
    keywords: ["feedback", "comentarios", "mensaje", "devolver", "retorno"],
  },
  {
    id: "seg-46",
    section: "paciente-seguimiento",
    question: "¿Puedo enviar recordatorios al paciente desde aquí?",
    answer:
      "Desde la pestaña Seguimiento no hay un botón de recordatorio directo, pero puedes abrir un mensaje al paciente desde la pestaña Mensajes o desde el acceso rápido de su ficha. Un mensaje breve recordando que registre el día es muy efectivo cuando lleva varios días sin hacerlo.",
    related: ["seg-23", "seg-45", "seg-47"],
    keywords: ["recordatorio", "mensaje", "recordar", "enviar", "aviso"],
  },
  {
    id: "seg-47",
    section: "paciente-seguimiento",
    question: "¿Cómo conecto el seguimiento con la próxima consulta?",
    answer:
      "Revisa el seguimiento unos minutos antes de la consulta y anota en la pestaña de la cita los tres o cuatro puntos más relevantes: rachas buenas, días desviados, notas llamativas del paciente. Usa esas anotaciones durante la consulta para dar feedback concreto en vez de preguntas genéricas.",
    related: ["seg-45", "seg-48", "seg-59"],
    keywords: ["consulta", "próxima cita", "preparar", "anotar", "puntos"],
  },
  {
    id: "seg-48",
    section: "paciente-seguimiento",
    question: "¿Puedo exportar el seguimiento a PDF?",
    answer:
      "Sí. En la cabecera de la pestaña Seguimiento hay una opción para exportar el rango seleccionado a PDF. El documento incluye el calendario del rango, los gráficos de evolución, un resumen por día y los totales de macros y adherencia. Es útil para entregar al paciente o adjuntarlo a un informe.",
    related: ["seg-49", "seg-59", "seg-60"],
    keywords: ["exportar pdf", "pdf", "descargar", "informe", "entrega"],
  },
  {
    id: "seg-49",
    section: "paciente-seguimiento",
    question: "¿Qué incluye el PDF exportado del seguimiento?",
    answer:
      "El PDF contiene la portada con datos básicos del paciente y el rango de fechas, el calendario mensual con los iconos de cumplimiento, los gráficos de agua, ejercicio, calorías y adherencia, el detalle resumido por día y una sección final con los totales y promedios del rango. Respeta el diseño visual de la app.",
    related: ["seg-48", "seg-60", "seg-61"],
    keywords: ["contenido pdf", "incluye", "portada", "calendario", "resumen"],
  },
  {
    id: "seg-50",
    section: "paciente-seguimiento",
    question: "¿Qué relación tiene Seguimiento con Mediciones?",
    answer:
      "Son dos caras de la misma moneda: Seguimiento cuenta qué hace el paciente cada día, Mediciones cuenta cómo se traduce eso en su cuerpo. Para una visión completa, cruza ambas pestañas. Si la adherencia es alta pero no hay progreso en peso, quizá el plan necesite ajustes; si la adherencia es baja, el problema está antes.",
    related: ["seg-3", "seg-51", "seg-58"],
    keywords: ["relación mediciones", "complementario", "cuerpo", "adherencia", "progreso"],
  },
  {
    id: "seg-51",
    section: "paciente-seguimiento",
    question: "¿Cómo cruzo seguimiento con evolución de peso?",
    answer:
      "Abre la pestaña Mediciones en otra pestaña del navegador y compara los gráficos: si el peso baja pero el paciente reporta adherencia baja, quizá sobreestima su ingesta; si el peso sube con buena adherencia, puede que el plan tenga demasiadas calorías. El contraste entre ambas fuentes da lecturas muy ricas.",
    related: ["seg-50", "seg-52", "seg-58"],
    keywords: ["cruzar peso", "evolución", "comparar", "mediciones", "interpretar"],
  },
  {
    id: "seg-52",
    section: "paciente-seguimiento",
    question: "¿Puedo ver seguimiento muy antiguo?",
    answer:
      "Sí. El seguimiento no se archiva ni se purga automáticamente. Puedes ampliar el rango de fechas hacia atrás todo lo que quieras y ver registros del año pasado o del inicio del tratamiento. Es útil para recordar de dónde venía el paciente y valorar cuánto ha cambiado su rutina.",
    related: ["seg-25", "seg-53", "seg-54"],
    keywords: ["antiguo", "histórico", "año pasado", "ampliar rango", "inicio"],
  },
  {
    id: "seg-53",
    section: "paciente-seguimiento",
    question: "¿Cuánto tiempo se conserva el historial de seguimiento?",
    answer:
      "El historial de seguimiento es permanente mientras el paciente esté activo en la plataforma. No hay un límite de retención ni un borrado automático por antigüedad. Los registros se conservan para que puedas consultar evoluciones largas, comparar etapas y construir el contexto completo del paciente.",
    related: ["seg-52", "seg-54", "seg-62"],
    keywords: ["permanente", "historial", "retención", "conservación", "no borra"],
  },
  {
    id: "seg-54",
    section: "paciente-seguimiento",
    question: "¿Qué pasa con el seguimiento si doy de baja al paciente?",
    answer:
      "Si das de baja al paciente, su ficha y sus registros de seguimiento se conservan según la política configurada en la plataforma. Normalmente pasan a un estado archivado y dejan de generar notificaciones, pero siguen siendo consultables. Si borras al paciente por completo, los datos se eliminan definitivamente.",
    related: ["seg-52", "seg-53", "seg-63"],
    keywords: ["baja paciente", "archivado", "conservar", "eliminar", "retención"],
  },
  {
    id: "seg-55",
    section: "paciente-seguimiento",
    question: "¿Quién puede ver el seguimiento del paciente?",
    answer:
      "El seguimiento es privado: solo lo ven el propio paciente y el nutricionista responsable de su ficha. No es accesible para otros pacientes, para usuarios externos ni para profesionales del equipo que no tengan acceso explícito a esa ficha. La privacidad de los datos de salud está protegida por diseño.",
    related: ["seg-56", "seg-57", "seg-64"],
    keywords: ["privacidad", "quién ve", "acceso", "confidencial", "nutricionista"],
  },
  {
    id: "seg-56",
    section: "paciente-seguimiento",
    question: "¿Qué veo si el paciente no ha registrado nunca?",
    answer:
      "Verás un estado vacío con una ilustración y un mensaje indicando que el paciente todavía no ha registrado ningún día. No habrá calendario coloreado, ni gráficos, ni totales. Suele acompañarse de un consejo para recordar al paciente que active el hábito y aprovechar mejor el portal.",
    related: ["seg-26", "seg-46", "seg-57"],
    keywords: ["estado vacío", "nunca", "sin registros", "mensaje", "ilustración"],
  },
  {
    id: "seg-57",
    section: "paciente-seguimiento",
    question: "¿Cómo motivo al paciente a registrar a diario?",
    answer:
      "Explícale en la primera consulta por qué el seguimiento es útil (ajustes del plan más finos, detectar bloqueos, celebrar avances), envíale un mensaje al inicio agradeciendo los primeros registros y menciona datos concretos del seguimiento en las consultas. Cuando el paciente nota que lo lees, registra más.",
    related: ["seg-45", "seg-46", "seg-56"],
    keywords: ["motivar", "animar", "adherencia portal", "hábito", "valor"],
  },
  {
    id: "seg-58",
    section: "paciente-seguimiento",
    question: "¿Sirve el seguimiento para ajustar el plan de alimentación?",
    answer:
      "Sí, es una de las mejores fuentes para ajustar el plan. Si ves que el paciente nunca llega a la cena prescrita, si tira siempre por encima en hidratos o si deja la media mañana vacía, puedes rediseñar el plan para que se parezca más a lo que realmente come. Un plan más realista mejora la adherencia.",
    related: ["seg-17", "seg-47", "seg-59"],
    keywords: ["ajustar plan", "alimentación", "realista", "rediseñar", "mejora"],
  },
  {
    id: "seg-59",
    section: "paciente-seguimiento",
    question: "¿Puedo usar el seguimiento en los informes?",
    answer:
      "Sí. Al exportar un informe desde la ficha del paciente puedes incluir un bloque de seguimiento del rango que elijas. Aparecerán los gráficos principales, el porcentaje de adherencia y un resumen de notas destacadas. Es muy útil para informes mensuales o para entregables que muestren el trabajo realizado.",
    related: ["seg-48", "seg-49", "seg-60"],
    keywords: ["informes", "reportes", "incluir", "mensual", "entregable"],
  },
  {
    id: "seg-60",
    section: "paciente-seguimiento",
    question: "¿El PDF exportado se guarda como entregable del paciente?",
    answer:
      "Si lo envías al paciente desde la función correspondiente, queda registrado en la pestaña Entregables de su ficha, con fecha y contenido. Si solo lo descargas en tu ordenador, no queda rastro en la plataforma. Usa el envío como entregable cuando quieras conservar el PDF asociado al paciente.",
    related: ["seg-48", "seg-49", "seg-59"],
    keywords: ["entregable", "guardar pdf", "enviar", "pestaña entregables", "rastro"],
  },
  {
    id: "seg-61",
    section: "paciente-seguimiento",
    question: "¿Puedo descargar solo las notas del paciente?",
    answer:
      "No hay una exportación específica de notas, pero el PDF completo del seguimiento incluye las notas del rango. Si solo te interesa ese contenido, puedes copiar las notas desde el detalle de cada día o usar el rango corto para que el PDF las concentre. También puedes citarlas en el informe mensual.",
    related: ["seg-22", "seg-48", "seg-49"],
    keywords: ["exportar notas", "solo notas", "descargar", "copiar", "pdf"],
  },
  {
    id: "seg-62",
    section: "paciente-seguimiento",
    question: "¿El seguimiento antiguo ralentiza la pestaña?",
    answer:
      "No de forma perceptible. La pestaña carga solo el rango seleccionado y pagina internamente cuando hace falta, así que aunque un paciente tenga años de registros, la consulta sigue siendo ágil. Si detectas lentitud, reduce el rango de fechas para limitar el cálculo de gráficos.",
    related: ["seg-52", "seg-53", "seg-65"],
    keywords: ["rendimiento", "lento", "antiguo", "paginación", "rango"],
  },
  {
    id: "seg-63",
    section: "paciente-seguimiento",
    question: "¿Qué pasa si cambio al paciente de profesional?",
    answer:
      "Si reasignas al paciente a otro profesional del equipo, el seguimiento completo se transfiere automáticamente. El nuevo profesional verá el histórico entero desde el primer día del paciente en la plataforma, sin pérdida de datos. La continuidad del seguimiento queda garantizada.",
    related: ["seg-54", "seg-55", "seg-64"],
    keywords: ["cambio profesional", "reasignar", "traspaso", "equipo", "continuidad"],
  },
  {
    id: "seg-64",
    section: "paciente-seguimiento",
    question: "¿Puede un paciente demo generar seguimiento?",
    answer:
      "Sí, los pacientes marcados como demo pueden registrar seguimiento exactamente igual que un paciente real, y tú ves los datos en la pestaña con las mismas funciones. Es la mejor forma de probar cómo queda el seguimiento antes de activar pacientes reales, sin mezclar datos de producción.",
    related: ["seg-1", "seg-55", "seg-65"],
    keywords: ["demo", "paciente demo", "probar", "pruebas", "simular"],
  },
  {
    id: "seg-65",
    section: "paciente-seguimiento",
    question: "¿Qué hago si veo algo raro en el seguimiento?",
    answer:
      "Si un valor parece erróneo (por ejemplo 10 litros de agua o 900 minutos de ejercicio en un día), no corrijas nada desde tu vista porque no es editable. Escribe un mensaje al paciente para confirmar si fue un error de registro y pídele que lo ajuste desde su portal. Si crees que hay un problema técnico, contacta con soporte.",
    related: ["seg-41", "seg-42", "seg-46"],
    keywords: ["error", "raro", "anomalía", "contactar paciente", "soporte"],
  },
];
