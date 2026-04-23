import type { HelpEntry } from "../types";

export const DIETA_EDITOR_ENTRIES: HelpEntry[] = [
  {
    id: "de-1",
    section: "dieta-editor",
    question: "¿Qué es el editor de planes de alimentación?",
    answer:
      "El editor de planes es la pantalla donde construyes y modificas el contenido de una dieta completa de un paciente. Vive en la ruta `/dietas/[id]/editar` y está acompañado por una vista de solo lectura en `/dietas/[id]` para revisar el plan sin poder tocarlo. Desde el editor puedes añadir alimentos y recetas, ajustar gramajes, mover comidas entre días mediante arrastrar y soltar, y comparar los totales con los objetivos calóricos y de macronutrientes que hayas fijado. Es la herramienta central del flujo nutricional y todo lo que guardes aquí se sincroniza automáticamente con el portal del paciente.",
    related: ["de-2", "de-3", "de-30"],
    keywords: ["editor", "plan", "dieta", "introducción"],
  },
  {
    id: "de-2",
    section: "dieta-editor",
    question: "¿Cómo está estructurado un plan de alimentación?",
    answer:
      "Cada plan se organiza en siete días (de Lunes a Domingo) y cada día se divide en seis comidas fijas: Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena. Dentro de cada comida puedes añadir tantos alimentos o recetas como necesites, con su cantidad correspondiente en gramos, mililitros o unidades. Esta estructura está pensada para cubrir la mayoría de pautas que se prescriben en consulta, pero ningún día o comida es obligatorio, así que puedes dejar vacíos los espacios que no uses. Los totales se recalculan en tiempo real según lo que vayas añadiendo.",
    related: ["de-1", "de-6", "de-22"],
    keywords: ["estructura", "días", "comidas", "7", "6"],
  },
  {
    id: "de-3",
    section: "dieta-editor",
    question: "¿Dónde veo el nombre del plan y cómo lo cambio?",
    answer:
      "El nombre del plan aparece en la cabecera del editor, en la parte superior izquierda, junto al botón de volver. Sirve como título tanto para ti como para el paciente y es lo primero que verá él cuando abra el plan en su portal. Para cambiarlo pulsa el botón `Editar` de la cabecera, que abre un diálogo con los metadatos del plan (nombre, objetivo calórico, macros objetivo y descripción opcional). Al guardar los cambios, el nuevo nombre se refleja inmediatamente en el listado de dietas del paciente y en la vista pública.",
    related: ["de-4", "de-5", "de-57"],
    keywords: ["nombre", "título", "cabecera", "metadatos"],
  },
  {
    id: "de-4",
    section: "dieta-editor",
    question: "¿Qué son el objetivo calórico y los macros objetivo?",
    answer:
      "El objetivo calórico es el total de calorías diarias que pretendes que alcance la dieta, y los macros objetivo son los gramos deseados de proteínas, grasas e hidratos de carbono. Se configuran desde el diálogo `Editar` de la cabecera y se usan como referencia para comparar los totales reales del plan con lo que te habías propuesto. El editor muestra barras de progreso que se ponen verdes cuando te acercas al objetivo y amarillas o rojas si te desvías demasiado. No son restrictivas: puedes guardar un plan que no alcance el objetivo, simplemente sabrás en qué difiere.",
    related: ["de-3", "de-27", "de-29"],
    keywords: ["objetivo", "kcal", "macros", "proteína", "grasa", "carbohidratos"],
  },
  {
    id: "de-5",
    section: "dieta-editor",
    question: "¿Para qué sirve el botón `Volver` de la cabecera?",
    answer:
      "El botón `Volver` es el primer icono de la cabecera (una flecha hacia la izquierda) y te devuelve a la vista anterior desde la que llegaste al editor. Normalmente eso significa volver a la ficha del paciente o al listado de dietas, según el camino que hayas tomado. Como el guardado es automático, no necesitas confirmar ni pulsar ningún botón antes de salir: los cambios ya están en la base de datos. Si estás en medio de una operación de guardado, el botón espera a que termine para evitar perder datos.",
    related: ["de-3", "de-30", "de-31"],
    keywords: ["volver", "atrás", "navegar"],
  },
  {
    id: "de-6",
    section: "dieta-editor",
    question: "¿Qué hace el botón `IA` de la cabecera?",
    answer:
      "El botón `IA` abre el asistente de generación automática de planes, que es una herramienta paralela al editor manual. A partir de los datos antropométricos del paciente, su objetivo y unas preferencias alimentarias puede proponerte un plan completo listo para revisar. Lo que devuelve se carga en el editor como punto de partida y a partir de ahí lo retocas como cualquier otro plan. Para usar la IA necesitas tener configurada la clave en `Ajustes` y los detalles del asistente están en la sección de ayuda `dieta-ia`.",
    related: ["de-7", "de-8", "de-46"],
    keywords: ["ia", "inteligencia artificial", "generar", "asistente"],
  },
  {
    id: "de-7",
    section: "dieta-editor",
    question: "¿Qué es el botón `Plantilla` de la cabecera?",
    answer:
      "El botón `Plantilla` permite guardar el plan actual como una plantilla reutilizable, para poder aplicarla a otros pacientes en el futuro sin volver a empezar de cero. Al pulsarlo se abre un diálogo que pide un nombre y una descripción; al confirmar, el estado actual del plan se copia al almacén de plantillas del profesional. Las plantillas se consultan y se gestionan desde la sección `Dietas` y no mantienen vínculo con el plan original, así que modificar el plan no altera la plantilla. Guardar una plantilla es seguro y no afecta al plan del paciente.",
    related: ["de-6", "de-46", "de-47"],
    keywords: ["plantilla", "guardar como", "reutilizar"],
  },
  {
    id: "de-8",
    section: "dieta-editor",
    question: "¿Qué hace el botón `Compartir`?",
    answer:
      "El botón `Compartir` genera un enlace público o un documento descargable que puedes enviar al paciente aunque no tenga cuenta en el portal. Al pulsarlo se abre un diálogo con las opciones de compartir disponibles: enlace, PDF y envío por correo si lo tienes integrado. El paciente recibe una vista de solo lectura idéntica a la de `/dietas/[id]` con el contenido del plan tal y como está guardado en ese momento. Los detalles exactos del flujo están en la sección de ayuda `dieta-compartir`.",
    related: ["de-47", "de-48", "de-49"],
    keywords: ["compartir", "enlace", "pdf", "enviar"],
  },
  {
    id: "de-9",
    section: "dieta-editor",
    question: "¿Qué encuentro en el botón `Editar` de metadatos?",
    answer:
      "El botón `Editar` (a veces etiquetado como `Editar metadatos`) abre un diálogo con los datos generales del plan: nombre, descripción, fecha de inicio y fin, objetivo calórico y objetivos de macronutrientes. Desde ahí también puedes marcar el plan como activo o archivado para el paciente. Los cambios se aplican al pulsar `Guardar` y se reflejan inmediatamente en la cabecera y en el portal. No afecta al contenido de los días ni a los alimentos, solo a la información descriptiva del plan.",
    related: ["de-3", "de-4", "de-57"],
    keywords: ["editar", "metadatos", "diálogo", "información"],
  },
  {
    id: "de-10",
    section: "dieta-editor",
    question: "¿Qué ocurre si pulso `Eliminar` en la cabecera?",
    answer:
      "El botón `Eliminar` borra el plan completo tras pedirte una confirmación explícita en un diálogo. Como es una acción destructiva, se te muestra el nombre del plan y el nombre del paciente para que te asegures de estar eliminando lo correcto. Una vez confirmado, el plan desaparece del listado del paciente, deja de verse en el portal y no se puede recuperar; si lo necesitas como base para el futuro, guárdalo antes como plantilla. Si solo quieres ocultarlo al paciente sin perderlo, márcalo como archivado desde el diálogo de metadatos.",
    related: ["de-9", "de-7", "de-57"],
    keywords: ["eliminar", "borrar", "destructivo"],
  },
  {
    id: "de-11",
    section: "dieta-editor",
    question: "¿Cómo navego entre los siete días del plan?",
    answer:
      "Los siete días aparecen como pestañas horizontales en la parte superior del área de edición, con las abreviaturas `Lun`, `Mar`, `Mié`, `Jue`, `Vie`, `Sáb` y `Dom`. Al pulsar una pestaña, la zona inferior cambia para mostrar las seis comidas de ese día y su contenido. El día activo se resalta con un color distinto y un subrayado para que siempre sepas dónde estás. Si tu pantalla es estrecha, las pestañas se vuelven deslizables horizontalmente y puedes hacer scroll entre ellas con el dedo o la rueda del ratón.",
    related: ["de-12", "de-51", "de-53"],
    keywords: ["navegar", "días", "tabs", "pestañas"],
  },
  {
    id: "de-12",
    section: "dieta-editor",
    question: "¿Puedo activar o desactivar un día concreto?",
    answer:
      "Sí, cada pestaña de día tiene un interruptor que permite activarlo o desactivarlo sin borrar su contenido. Un día desactivado se oculta al paciente en el portal y no cuenta en los totales semanales, pero conserva los alimentos y recetas que le hayas añadido para que puedas reactivarlo más tarde. Es útil cuando el paciente se va de viaje, hace ayuno intermitente un día concreto o cuando preparas un plan flexible con días opcionales. El estado del día se refleja visualmente atenuando su pestaña.",
    related: ["de-11", "de-61", "de-62"],
    keywords: ["activar", "desactivar", "día", "ocultar"],
  },
  {
    id: "de-13",
    section: "dieta-editor",
    question: "¿Cómo añado un alimento a una comida?",
    answer:
      "Cada comida tiene un botón `+` (o `Añadir alimento`) en su esquina, normalmente al final de la lista de alimentos actuales. Al pulsarlo se abre un buscador que muestra los alimentos disponibles en la base de datos y te permite filtrar por nombre. Una vez seleccionado el alimento, introduces la cantidad y la unidad y se añade a la comida. Los macros se recalculan al instante tanto a nivel de comida como de día y semana.",
    related: ["de-14", "de-15", "de-16"],
    keywords: ["añadir", "alimento", "botón", "+"],
  },
  {
    id: "de-14",
    section: "dieta-editor",
    question: "¿Cómo funciona el buscador de alimentos?",
    answer:
      "El buscador de alimentos es insensible a acentos y mayúsculas, así que escribir `platano`, `Plátano` o `PLATANO` devolverá los mismos resultados. También acepta coincidencias parciales y busca dentro del nombre completo, de modo que `arroz basmati` encuentra resultados aunque el alimento esté guardado como `Arroz basmati cocido`. Los resultados se ordenan priorizando los alimentos que tú has creado o marcado como favoritos. Debajo de cada resultado se muestra una línea con las kilocalorías por cada 100 gramos para que puedas elegir rápido sin abrirlo.",
    related: ["de-13", "de-15", "de-20"],
    keywords: ["buscador", "buscar", "acentos", "tildes"],
  },
  {
    id: "de-15",
    section: "dieta-editor",
    question: "¿Qué pasa al seleccionar un alimento en el buscador?",
    answer:
      "Al seleccionar un alimento del buscador, el buscador se cierra y aparece el diálogo de cantidad para que indiques cuántos gramos, mililitros o unidades quieres añadir. Por defecto se propone una cantidad razonable basada en la porción estándar que tenga configurada el alimento, pero puedes cambiarla antes de confirmar. Tras confirmar, el alimento se incorpora al final de la lista de la comida correspondiente y las barras de macros se actualizan. Si te has equivocado, puedes deshacer la acción con `Ctrl+Z`.",
    related: ["de-13", "de-16", "de-33"],
    keywords: ["seleccionar", "alimento", "cantidad"],
  },
  {
    id: "de-16",
    section: "dieta-editor",
    question: "¿Qué unidades puedo usar para la cantidad?",
    answer:
      "Cada alimento admite las unidades que tenga configuradas en su ficha, que habitualmente son gramos, mililitros o unidades. Los alimentos sólidos suelen permitir gramos y unidades (por ejemplo, una manzana grande equivale a unos 200 gramos); los líquidos permiten mililitros y alguna ración personalizada (como `vaso` o `taza`); y las recetas se miden en raciones o porciones. La equivalencia entre unidades está definida en la base de datos para que los macros se calculen siempre sobre gramos equivalentes.",
    related: ["de-15", "de-17", "de-75"],
    keywords: ["unidades", "gramos", "ml", "porciones"],
  },
  {
    id: "de-17",
    section: "dieta-editor",
    question: "¿Cómo cambio la unidad de un alimento ya añadido?",
    answer:
      "Al pulsar sobre la cantidad de un alimento ya añadido se abre un campo editable que muestra tanto el número como el selector de unidad. Si cambias de `gramos` a `unidades`, el editor convierte automáticamente la cantidad usando la equivalencia de la ficha del alimento para no alterar el valor nutricional real. Si el alimento no tiene esa unidad configurada, el selector no la ofrecerá. Los totales se recalculan al vuelo cuando confirmas el cambio.",
    related: ["de-16", "de-34", "de-76"],
    keywords: ["cambiar", "unidad", "convertir"],
  },
  {
    id: "de-18",
    section: "dieta-editor",
    question: "¿Cómo añado una receta propia o global al plan?",
    answer:
      "El buscador del botón `+` tiene dos pestañas: `Alimentos` y `Recetas`. En la pestaña `Recetas` aparecen tanto las recetas globales (compartidas entre todos los profesionales) como las que tú has creado, con un icono que las distingue. Al seleccionar una receta, el editor te pide el número de raciones que quieres añadir y calcula los macros multiplicando los valores de la receta por ese número. La receta aparece en la comida como una única línea con un icono especial y, si lo deseas, puede desplegarse para ver sus ingredientes.",
    related: ["de-13", "de-19", "de-63"],
    keywords: ["receta", "propia", "global", "añadir"],
  },
  {
    id: "de-19",
    section: "dieta-editor",
    question: "¿Cómo veo los macros de un alimento por 100 g vs. por porción?",
    answer:
      "Al pasar el ratón por encima del alimento añadido aparece un tooltip con los macros desglosados, mostrando tanto los valores por 100 gramos como los valores reales de la porción que hayas puesto. Si despliegas la fila (con la flecha a la izquierda) se abre un panel inferior que muestra kcal, proteínas, grasas, carbohidratos y fibra para ambos escalados. Esto es útil para comprobar si el alimento es el correcto sin tener que abrir su ficha. El cálculo se hace sobre los datos guardados en `Alimentos` y respeta las equivalencias entre unidades.",
    related: ["de-18", "de-25", "de-27"],
    keywords: ["macros", "100g", "porción", "alimento"],
  },
  {
    id: "de-20",
    section: "dieta-editor",
    question: "¿Cómo muevo un alimento de una comida a otra?",
    answer:
      "Para mover un alimento entre comidas puedes arrastrarlo y soltarlo en la comida destino. Pulsa prolongadamente sobre la fila del alimento hasta que aparezca el indicador de arrastre y, sin soltar, llévalo a la comida deseada; cuando la zona de destino se ilumine, suelta. El alimento conserva su cantidad y unidad, solo cambia de contenedor. Esta operación funciona entre cualquier par de comidas del mismo día y también entre días distintos si arrastras hasta la pestaña del día objetivo.",
    related: ["de-21", "de-22", "de-23"],
    keywords: ["mover", "drag", "drop", "arrastrar"],
  },
  {
    id: "de-21",
    section: "dieta-editor",
    question: "¿Puedo reordenar los alimentos dentro de una misma comida?",
    answer:
      "Sí, dentro de una comida puedes arrastrar cada alimento hacia arriba o hacia abajo para reordenarlo. El orden se respeta al guardar y es el que verá el paciente en el portal, lo cual es útil cuando quieres que un alimento principal aparezca primero y los acompañamientos después. Durante el arrastre, el resto de filas se separan ligeramente para dejar clara la posición final. Si sueltas fuera de la comida, el alimento se mueve a la nueva comida en lugar de reordenarse.",
    related: ["de-20", "de-22", "de-38"],
    keywords: ["reordenar", "orden", "alimentos"],
  },
  {
    id: "de-22",
    section: "dieta-editor",
    question: "¿Cómo duplico una comida dentro del mismo día?",
    answer:
      "Cada comida tiene un menú contextual (tres puntos en su esquina) con la opción `Duplicar comida`. Al pulsarla, el contenido de esa comida se copia en la siguiente comida libre del mismo día, respetando los alimentos, las cantidades y las notas. Si todas las comidas del día ya tienen contenido, la duplicación sobreescribe requiere confirmación para no perder datos. Es práctico cuando en el desayuno y la merienda comes casi lo mismo, por ejemplo.",
    related: ["de-23", "de-24", "de-38"],
    keywords: ["duplicar", "comida", "copiar"],
  },
  {
    id: "de-23",
    section: "dieta-editor",
    question: "¿Cómo copio un día completo a otro día de la semana?",
    answer:
      "En el menú contextual de la pestaña del día activo tienes la opción `Copiar día`, que guarda una copia del contenido de los seis platos del día actual en memoria. Después, al situarte en otro día y pulsar `Pegar día`, el contenido guardado se vuelca en ese día. Es la forma más rápida de replicar una pauta entre días similares, como `Lunes` y `Miércoles`. La copia incluye alimentos, cantidades, notas, horas de comida y el estado activo/inactivo.",
    related: ["de-22", "de-24", "de-38"],
    keywords: ["copiar", "día", "replicar"],
  },
  {
    id: "de-24",
    section: "dieta-editor",
    question: "¿Qué pasa al pegar un día si el destino ya tenía contenido?",
    answer:
      "Al ejecutar `Pegar día` sobre un día que ya tiene comidas, el editor te muestra una advertencia indicando que el contenido existente se va a sobrescribir. Si confirmas, se reemplaza todo el contenido del día destino por el del portapapeles del plan; si cancelas, no ocurre nada. Esta protección evita pérdidas accidentales cuando pegas sin querer en el día equivocado. Si necesitas mantener ambos contenidos, copia primero los alimentos concretos que te interesen en vez de pegar un día entero.",
    related: ["de-23", "de-33", "de-34"],
    keywords: ["pegar", "día", "sobrescribir"],
  },
  {
    id: "de-25",
    section: "dieta-editor",
    question: "¿Cómo añado notas a una comida?",
    answer:
      "Dentro de cada comida, debajo de la lista de alimentos, hay un campo de `Notas` que puedes usar para dejar instrucciones o recordatorios para el paciente. Por ejemplo `Cocinar al vapor`, `Beber agua antes de comer` o `Si no tienes avena, sustituye por copos de trigo`. Las notas son de texto libre, soportan saltos de línea y se muestran también en el portal del paciente en la misma posición. Están pensadas para ser breves: si necesitas explicaciones largas, usa una recomendación aparte desde la ficha del paciente.",
    related: ["de-26", "de-27", "de-42"],
    keywords: ["notas", "comida", "instrucciones"],
  },
  {
    id: "de-26",
    section: "dieta-editor",
    question: "¿Puedo establecer una hora para cada comida?",
    answer:
      "Sí, al lado del nombre de cada comida hay un selector de hora que permite asignarle un momento concreto del día (por ejemplo, `08:00` para el desayuno). La hora es orientativa y se muestra en el portal del paciente junto al nombre de la comida, lo que ayuda a ritmos circadianos y a pacientes con horarios muy marcados. Puedes dejarla vacía si no la necesitas; en ese caso solo aparece el nombre de la comida. Las horas son independientes por día, por si los horarios del paciente cambian entre semana y fin de semana.",
    related: ["de-25", "de-53", "de-54"],
    keywords: ["hora", "comida", "horario"],
  },
  {
    id: "de-27",
    section: "dieta-editor",
    question: "¿Para qué sirve la descripción del plato?",
    answer:
      "Cada alimento o grupo de alimentos dentro de una comida puede tener una descripción breve, pensada para detallar la forma de prepararlo, por ejemplo `Pollo al horno con verduras` cuando la comida se compone de pollo, pimientos y calabacín. La descripción aparece en negrita sobre la lista de ingredientes y sustituye al nombre genérico de la comida en la vista del paciente. Es opcional y puedes dejar solo ingredientes sueltos si prefieres un estilo más simple. También se usa al exportar el plan a PDF para dar un aspecto más de receta que de lista.",
    related: ["de-25", "de-42", "de-48"],
    keywords: ["descripción", "plato", "título"],
  },
  {
    id: "de-28",
    section: "dieta-editor",
    question: "¿Dónde veo los totales por comida, día y semana?",
    answer:
      "Al pie de cada comida aparece un resumen en una línea con las kilocalorías totales y los gramos de proteína, grasa e hidratos de carbono que aporta esa comida. Al final de cada día hay un bloque más grande con los totales diarios y, en la cabecera de la pestaña de día o en una franja lateral, se muestran los totales semanales acumulados. Todos los totales se recalculan automáticamente cada vez que modificas un alimento, por lo que siempre reflejan el estado actual del plan.",
    related: ["de-29", "de-30", "de-31"],
    keywords: ["totales", "comida", "día", "semana"],
  },
  {
    id: "de-29",
    section: "dieta-editor",
    question: "¿Qué son las barras de progreso frente al objetivo?",
    answer:
      "Las barras de progreso comparan los totales diarios con los objetivos que has fijado en los metadatos del plan. Cada barra corresponde a un indicador (kcal, proteína, grasa y carbohidratos) y se rellena hasta el porcentaje alcanzado. El color cambia según la desviación: verde cuando estás entre el 90% y el 110% del objetivo, amarillo entre el 75% y el 125%, y rojo fuera de ese rango. Son visuales y no bloquean nada, solo te avisan para que ajustes gramajes si lo consideras necesario.",
    related: ["de-4", "de-28", "de-30"],
    keywords: ["progreso", "barras", "objetivo", "comparar"],
  },
  {
    id: "de-30",
    section: "dieta-editor",
    question: "¿Cómo se calcula el porcentaje de cada macronutriente?",
    answer:
      "El porcentaje de cada macronutriente se calcula dividiendo las calorías aportadas por ese macro entre las calorías totales del día. Proteínas y carbohidratos aportan 4 kcal por gramo y las grasas 9 kcal por gramo, siguiendo la convención estándar. El editor muestra estos porcentajes en forma de etiqueta (`P 25% G 30% C 45%`) debajo de los totales diarios y también en la vista `Análisis`. Son una forma rápida de ver si el reparto de macros encaja con el objetivo o si falta proteína, por ejemplo.",
    related: ["de-28", "de-29", "de-31"],
    keywords: ["porcentaje", "macro", "reparto"],
  },
  {
    id: "de-31",
    section: "dieta-editor",
    question: "¿Qué es la vista `Análisis` o el gráfico circular?",
    answer:
      "La vista `Análisis` es una pestaña lateral del editor que muestra gráficos agregados del plan, incluyendo un gráfico circular (pie) con el reparto de macronutrientes en porcentaje. También incluye una tabla con los 24 micronutrientes calculados por día y por semana, y un resumen visual del cumplimiento del objetivo. Sirve para hacer una revisión global sin tener que recorrer día a día. Los datos se actualizan junto con los del editor, así que nunca están desfasados.",
    related: ["de-30", "de-32", "de-33"],
    keywords: ["análisis", "pie", "gráfico", "macros"],
  },
  {
    id: "de-32",
    section: "dieta-editor",
    question: "¿Qué micronutrientes calcula el editor?",
    answer:
      "El editor calcula hasta 24 micronutrientes a partir de los datos de la base de alimentos: vitaminas A, C, D, E, K, B1, B2, B3, B5, B6, B7, B9 y B12, y minerales como calcio, hierro, magnesio, fósforo, potasio, sodio, zinc, cobre, manganeso, selenio, yodo y cromo. Cada micronutriente se muestra como un total diario o semanal y, junto a él, el porcentaje que representa frente a la Dosis Diaria Recomendada (DDR). Los valores dependen de que los alimentos usados tengan la información completa; si falta, ese micronutriente no se contabilizará para ese alimento.",
    related: ["de-31", "de-33", "de-78"],
    keywords: ["micronutrientes", "vitaminas", "minerales", "24"],
  },
  {
    id: "de-33",
    section: "dieta-editor",
    question: "¿Qué es la DDR y cómo se compara con el plan?",
    answer:
      "La DDR (Dosis Diaria Recomendada) es la cantidad estándar de referencia para cada micronutriente establecida por los organismos de salud. El editor compara el total diario del plan con la DDR para adultos y muestra el porcentaje alcanzado al lado de cada valor; un valor cercano al 100% es saludable, y valores muy por debajo del 50% se destacan en rojo para que los revises. Si el paciente tiene una condición especial (embarazo, adolescencia) que modifique la DDR, puedes fijar valores personalizados desde los metadatos del plan. La DDR es orientativa y no sustituye el juicio clínico.",
    related: ["de-32", "de-31", "de-46"],
    keywords: ["ddr", "dosis", "recomendada", "micronutrientes"],
  },
  {
    id: "de-34",
    section: "dieta-editor",
    question: "¿Cómo funciona el guardado automático del plan?",
    answer:
      "El editor guarda automáticamente cada cambio que realizas sin que tengas que pulsar un botón de `Guardar`. Después de cada acción (añadir alimento, mover, cambiar cantidad, editar notas), los cambios se envían al servidor con un pequeño retraso para agrupar varios cambios juntos. El indicador de estado en la cabecera muestra `Guardando...` mientras la operación está en curso y cambia a `Guardado` con una marca verde cuando termina. Si cierras la pestaña o pierdes conexión antes de que termine el guardado, el editor reintentará al volver.",
    related: ["de-35", "de-36", "de-58"],
    keywords: ["guardado", "automático", "debounce"],
  },
  {
    id: "de-35",
    section: "dieta-editor",
    question: "¿Qué es el debounce del guardado?",
    answer:
      "El `debounce` es el pequeño retraso (típicamente 500 a 1000 milisegundos) entre el momento en que haces un cambio y el momento en que se envía al servidor. Durante ese tiempo, si sigues tecleando o arrastrando, el temporizador se reinicia y solo se envía una petición al parar. Esto evita saturar la red con decenas de guardados por segundo cuando editas varias veces seguidas y mejora notablemente el rendimiento. En la práctica es imperceptible: el usuario solo ve que los cambios se guardan poco después de terminar.",
    related: ["de-34", "de-58", "de-36"],
    keywords: ["debounce", "retraso", "guardado"],
  },
  {
    id: "de-36",
    section: "dieta-editor",
    question: "¿Puedo deshacer y rehacer cambios en el editor?",
    answer:
      "Sí, el editor mantiene un historial de cambios que puedes recorrer con `Ctrl+Z` para deshacer y `Ctrl+Shift+Z` (o `Ctrl+Y`) para rehacer. El historial se mantiene mientras la pestaña del navegador esté abierta y se resetea al cerrarla. Las acciones que se deshacen son las de edición de contenido: añadir o eliminar alimentos, cambiar gramajes, mover comidas, editar notas, etc. Las acciones de cabecera (renombrar, cambiar objetivos, eliminar el plan) no entran en el historial y se revierten desde el mismo diálogo en el que las ejecutaste.",
    related: ["de-34", "de-37", "de-38"],
    keywords: ["deshacer", "rehacer", "undo", "redo"],
  },
  {
    id: "de-37",
    section: "dieta-editor",
    question: "¿Qué diferencia hay entre la vista compacta y la detallada?",
    answer:
      "El editor ofrece dos modos de visualización que se alternan con un botón en la cabecera: la vista `Compacta` muestra una línea por alimento con el nombre, la cantidad y las calorías, mientras que la vista `Detallada` añade los gramos de cada macronutriente y las notas en cada fila. La vista compacta es útil cuando el plan es largo y quieres una visión global rápida; la detallada, cuando estás ajustando macros al detalle. La elección se recuerda en tu navegador para sesiones futuras.",
    related: ["de-38", "de-39", "de-51"],
    keywords: ["compacta", "detallada", "vista"],
  },
  {
    id: "de-38",
    section: "dieta-editor",
    question: "¿Hay atajos de teclado en el editor?",
    answer:
      "Sí, el editor soporta varios atajos para acelerar la edición: `Ctrl+Z` y `Ctrl+Shift+Z` para deshacer y rehacer, `Ctrl+D` para duplicar la comida seleccionada, `Ctrl+C` y `Ctrl+V` para copiar y pegar días cuando el foco está en la pestaña del día, y `Ctrl+F` para abrir la búsqueda dentro del plan (aprovecha el buscador del navegador). Las flechas izquierda y derecha permiten cambiar de día cuando el foco está en las pestañas. Puedes ver la lista completa pulsando `?` en cualquier momento.",
    related: ["de-36", "de-39", "de-73"],
    keywords: ["atajos", "teclado", "shortcuts"],
  },
  {
    id: "de-39",
    section: "dieta-editor",
    question: "¿El editor es accesible con lectores de pantalla?",
    answer:
      "Sí, el editor sigue las pautas WCAG con etiquetas ARIA en los botones, rol `tablist` en las pestañas de día y anuncios de estado cuando se guarda o se añade un alimento. El tabulador recorre en orden lógico la cabecera, las pestañas, las comidas y los alimentos, y el contraste de colores se respeta tanto en tema claro como oscuro. Las acciones de arrastrar y soltar tienen equivalentes por teclado mediante el menú contextual (`Mover a...`). Si detectas algún problema de accesibilidad, repórtalo desde `Ajustes > Guías y soporte`.",
    related: ["de-38", "de-51", "de-73"],
    keywords: ["accesibilidad", "aria", "lectores"],
  },
  {
    id: "de-40",
    section: "dieta-editor",
    question: "¿Cómo elimino un alimento de una comida?",
    answer:
      "Cada alimento añadido tiene un botón con un icono de papelera al final de su fila. Al pulsarlo, el alimento desaparece de la comida y los totales se recalculan al instante; no se pide confirmación porque la acción se puede revertir fácilmente con `Ctrl+Z`. Si quieres eliminar varios alimentos a la vez, mantén pulsada la tecla `Shift` mientras seleccionas y usa la opción `Eliminar` del menú contextual. Eliminar un alimento de un plan no afecta a su ficha en la base de datos.",
    related: ["de-36", "de-41", "de-55"],
    keywords: ["eliminar", "alimento", "borrar"],
  },
  {
    id: "de-41",
    section: "dieta-editor",
    question: "¿Puedo modificar un alimento directamente en la línea?",
    answer:
      "Sí, la cantidad y la unidad de cada alimento son editables haciendo clic sobre ellas, sin necesidad de abrir un diálogo. Se convierten en un campo numérico y un selector que puedes ajustar con el teclado o la rueda del ratón; al salir del campo o pulsar `Enter`, los totales se recalculan. El nombre del alimento no se edita en línea: si quieres cambiarlo, debes eliminar la línea y volver a añadirlo desde el buscador. Esto protege los datos del alimento original en la base de datos.",
    related: ["de-17", "de-40", "de-55"],
    keywords: ["modificar", "inline", "editar", "línea"],
  },
  {
    id: "de-42",
    section: "dieta-editor",
    question: "¿Puedo crear un alimento nuevo desde el editor?",
    answer:
      "Sí, el buscador de alimentos tiene un botón `Crear alimento` al final de los resultados, que abre un diálogo con un formulario simplificado para dar de alta un nuevo alimento sobre la marcha. Solo necesitas el nombre y los macros por 100 gramos; los micronutrientes y otras propiedades se pueden completar más tarde desde la sección `Alimentos`. Al guardar, el alimento queda disponible en tu base personal y se añade automáticamente al plan en el que estabas trabajando. Es útil para productos específicos que no encuentras en la base global.",
    related: ["de-14", "de-43", "de-55"],
    keywords: ["crear", "alimento", "nuevo"],
  },
  {
    id: "de-43",
    section: "dieta-editor",
    question: "¿Puedo importar alimentos desde Open Food Facts en el editor?",
    answer:
      "Sí, el diálogo `Crear alimento` incluye un campo para introducir un código de barras (EAN) o una URL de Open Food Facts. Al pulsar `Buscar`, el sistema llama al servicio de Open Food Facts, recupera el nombre, los macros y la imagen del producto, y precompleta el formulario. Solo tienes que revisar los datos, ajustar lo que haga falta y pulsar `Guardar` para tenerlo en tu base. Este flujo acelera la captura de productos envasados que el paciente te comparte con una foto del etiquetado.",
    related: ["de-42", "de-14", "de-55"],
    keywords: ["open food facts", "importar", "código barras"],
  },
  {
    id: "de-44",
    section: "dieta-editor",
    question: "¿Cómo guardo un plan como plantilla desde el editor?",
    answer:
      "El botón `Plantilla` de la cabecera abre un diálogo donde puedes nombrar la plantilla, añadirle una descripción y confirmar la creación. La plantilla se guarda como una copia independiente del plan, con su misma estructura de días y comidas, y queda disponible en el listado de plantillas de la sección `Dietas`. Guardar el plan como plantilla no implica ningún cambio sobre el plan actual del paciente: ambos viven por separado. Para cambios futuros sobre una plantilla, edita la plantilla directamente desde su sección.",
    related: ["de-7", "de-45", "de-46"],
    keywords: ["plantilla", "guardar como"],
  },
  {
    id: "de-45",
    section: "dieta-editor",
    question: "¿Cómo cargo una plantilla al crear un plan?",
    answer:
      "Al crear un nuevo plan desde la ficha del paciente o desde `Dietas`, el primer paso ofrece tres puntos de partida: plan en blanco, generación por IA o cargar una plantilla existente. Al elegir `Plantilla` aparece un listado con todas tus plantillas y, al seleccionar una, el nuevo plan se crea con su mismo contenido ya copiado en los siete días. A partir de ahí, el plan es independiente y personalizable como cualquier otro. Esto no es una acción del editor sino del flujo de creación, pero enlaza directamente con el editor al terminar.",
    related: ["de-44", "de-7", "de-46"],
    keywords: ["cargar", "plantilla", "crear"],
  },
  {
    id: "de-46",
    section: "dieta-editor",
    question: "¿Cómo se comparte un plan con el paciente?",
    answer:
      "El botón `Compartir` de la cabecera del editor abre un diálogo con las opciones de compartir, entre ellas generar un enlace público, copiar al portapapeles la URL del plan en el portal y enviarlo por correo electrónico si tienes integrado un proveedor. También puedes descargar el plan en PDF y enviarlo manualmente por WhatsApp o email. El contenido compartido es el mismo que ve el paciente al entrar a su portal y se actualiza automáticamente si modificas el plan después. Hay más detalle en la sección `dieta-compartir`.",
    related: ["de-8", "de-47", "de-48"],
    keywords: ["compartir", "enlace", "enviar"],
  },
  {
    id: "de-47",
    section: "dieta-editor",
    question: "¿Cómo imprimo el plan o lo exporto a PDF?",
    answer:
      "En el diálogo `Compartir` hay un botón `Descargar PDF` que genera un documento con el plan completo, maquetado por días y comidas. El PDF incluye la cabecera con el nombre del plan, los objetivos, los totales diarios y, opcionalmente, el gráfico de macros y las notas. Puedes configurar si incluir o no los micronutrientes y el logotipo del profesional. El archivo es imprimible directamente desde cualquier lector de PDF y mantiene un aspecto limpio en blanco y negro para ahorrar tinta.",
    related: ["de-46", "de-48", "de-59"],
    keywords: ["imprimir", "pdf", "exportar"],
  },
  {
    id: "de-48",
    section: "dieta-editor",
    question: "¿Los cambios se sincronizan con el portal del paciente?",
    answer:
      "Sí, todo lo que guardas en el editor se refleja automáticamente en el portal del paciente gracias al guardado automático. El paciente ve siempre la última versión del plan cuando abre su portal, sin que tengas que `publicar` manualmente. Si el paciente está viendo el portal en ese momento, los cambios aparecen al refrescar la página o al cabo de unos segundos gracias al sondeo periódico. No hay modo borrador: cualquier cambio guardado es visible.",
    related: ["de-34", "de-49", "de-59"],
    keywords: ["sincronizar", "portal", "paciente"],
  },
  {
    id: "de-49",
    section: "dieta-editor",
    question: "¿El paciente ve mis cambios en tiempo real?",
    answer:
      "El paciente ve los cambios con una latencia mínima, dependiente del intervalo de refresco de su portal; normalmente es cuestión de segundos. No es un sistema de tiempo real estricto (no hay WebSocket), pero el portal recomprueba el plan al cambiar de sección o al pulsar `Actualizar`. Si el paciente mantiene el portal abierto mientras tú editas, verá los cambios la próxima vez que interactúe con la interfaz. Esto implica que no conviene editar en directo durante una consulta si quieres controlar lo que ve el paciente exactamente.",
    related: ["de-48", "de-59", "de-60"],
    keywords: ["tiempo real", "paciente", "ver"],
  },
  {
    id: "de-50",
    section: "dieta-editor",
    question: "¿Qué ocurre si dos dispositivos editan el mismo plan a la vez?",
    answer:
      "El editor no bloquea la edición simultánea, pero el último guardado gana: si tú editas en el móvil y a la vez en el ordenador, los cambios del dispositivo que guarde más tarde sobrescribirán los del otro. Para evitar conflictos, trabaja en un único dispositivo o asegúrate de que los cambios de uno se hayan guardado antes de empezar en el otro. En la cabecera aparece un aviso si detecta que la versión en el servidor es más reciente que la cargada, invitándote a recargar antes de seguir.",
    related: ["de-34", "de-51", "de-59"],
    keywords: ["conflicto", "multi-dispositivo", "simultáneo"],
  },
  {
    id: "de-51",
    section: "dieta-editor",
    question: "¿Qué es la UI optimista del editor?",
    answer:
      "La UI optimista es la técnica que usa el editor para sentirse rápido: al hacer un cambio, la interfaz asume que se va a guardar bien y lo muestra ya aplicado, sin esperar la respuesta del servidor. Si la operación falla (por pérdida de conexión, por ejemplo), se revierte y aparece un mensaje de error. En la práctica esto significa que el arrastrar y soltar, añadir alimentos y ajustar cantidades se ven instantáneos, aunque el guardado real ocurra un momento después. Solo notarás la diferencia en redes muy lentas.",
    related: ["de-34", "de-50", "de-58"],
    keywords: ["optimista", "ui", "rápido"],
  },
  {
    id: "de-52",
    section: "dieta-editor",
    question: "¿Cómo se comporta el editor en el móvil?",
    answer:
      "En pantallas de móvil el editor reordena la interfaz para apilar verticalmente: las pestañas de día siguen en la parte superior pero en forma deslizable, las comidas se muestran una debajo de otra ocupando todo el ancho y los totales se replegan en un panel que se abre a demanda. El arrastrar y soltar sigue funcionando con pulsación prolongada, pero es más cómodo usar el menú contextual de cada alimento (`Mover a...`) para evitar gestos imprecisos. Tema claro y oscuro se aplican como en escritorio.",
    related: ["de-53", "de-54", "de-39"],
    keywords: ["móvil", "responsive", "pantalla"],
  },
  {
    id: "de-53",
    section: "dieta-editor",
    question: "¿Qué ocurre en pantallas muy pequeñas?",
    answer:
      "En pantallas muy pequeñas (menos de 400 píxeles de ancho) los totales y las barras de macros se apilan en dos filas en vez de una, y las descripciones de los alimentos se truncan con puntos suspensivos para ahorrar espacio. Los diálogos (buscador de alimentos, cantidades, metadatos) ocupan toda la pantalla para facilitar la lectura y la interacción con el pulgar. Los gráficos del panel `Análisis` se reducen proporcionalmente y pierden las etiquetas menos críticas.",
    related: ["de-52", "de-54", "de-72"],
    keywords: ["pantalla pequeña", "stacked", "móvil"],
  },
  {
    id: "de-54",
    section: "dieta-editor",
    question: "¿Cómo se desplazan las pestañas de día en pantallas estrechas?",
    answer:
      "Cuando no caben las siete pestañas en el ancho disponible, el editor las convierte en una barra deslizable horizontal que puedes recorrer con el dedo, con la rueda del ratón o con las flechas izquierda y derecha del teclado. Aparecen dos pequeños indicadores en los extremos (flechas) que aparecen solo si hay más contenido en esa dirección. El día activo siempre se centra automáticamente en la vista cuando cambias de pestaña para que esté siempre visible.",
    related: ["de-11", "de-52", "de-53"],
    keywords: ["tabs", "scroll", "deslizar"],
  },
  {
    id: "de-55",
    section: "dieta-editor",
    question: "¿Cómo se resalta el día activo?",
    answer:
      "La pestaña del día activo se distingue con un color de fondo más saturado, un borde inferior o superior subrayado según el tema, y el número de macros o el estado (vacío/activo) mejor destacados. Los otros días aparecen atenuados para guiar la mirada. Esta señalización se mantiene en la franja lateral de totales semanales y en la cabecera de los días cuando se desplazan por encima del contenido. El objetivo es que nunca tengas duda de en qué día estás editando, sobre todo al copiar o pegar.",
    related: ["de-11", "de-54", "de-12"],
    keywords: ["resaltado", "activo", "día"],
  },
  {
    id: "de-56",
    section: "dieta-editor",
    question: "¿En qué se diferencia la comida `Recena` de las demás?",
    answer:
      "La `Recena` es la sexta comida del día, pensada como un pequeño aperitivo antes de acostarse, y funciona exactamente igual que las otras cinco: admite alimentos, recetas, notas y hora. No tiene ninguna restricción especial y puedes dejarla vacía si el plan no la requiere. Algunos profesionales la usan para repartir mejor la ingesta proteica a lo largo del día o en pacientes con horarios de entrenamiento tardío. En el portal del paciente aparece al final del día con el mismo formato que las demás.",
    related: ["de-2", "de-57", "de-61"],
    keywords: ["recena", "comida", "última"],
  },
  {
    id: "de-57",
    section: "dieta-editor",
    question: "¿Puedo reordenar los tipos de comida (Desayuno, Cena...)?",
    answer:
      "No, los seis tipos de comida (Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena) están fijados en ese orden y no se pueden reordenar ni cambiar de nombre desde el editor. El orden refleja la sucesión natural del día y mantiene coherencia entre todos los planes de todos los profesionales. Si necesitas que un paciente `no desayune`, deja la comida vacía o usa las notas para explicarlo; el orden visual se mantendrá pero sin contenido visible para el paciente.",
    related: ["de-58", "de-61", "de-56"],
    keywords: ["reordenar", "tipos", "comida"],
  },
  {
    id: "de-58",
    section: "dieta-editor",
    question: "¿Puedo crear tipos de comida personalizados?",
    answer:
      "No, los seis tipos de comida son fijos y no es posible crear tipos personalizados (por ejemplo `Post-entreno` o `Ayuno`). Esta decisión mantiene el modelo de datos estable y permite que las comparativas entre planes y pacientes sean consistentes. Si tu caso requiere una comida distinta, puedes reutilizar un slot vacío (como `Recena` para un post-entreno tardío) y usar las notas o la descripción para renombrarla visualmente. Es una limitación conocida que hemos valorado y mantenido de momento.",
    related: ["de-57", "de-25", "de-27"],
    keywords: ["personalizar", "tipos", "comida"],
  },
  {
    id: "de-59",
    section: "dieta-editor",
    question: "¿Cómo vinculo una receta a una comida concreta?",
    answer:
      "La vinculación se hace desde el buscador del botón `+` de la comida: en la pestaña `Recetas` seleccionas la receta y al confirmar queda añadida a esa comida como una fila especial. La fila muestra el nombre de la receta, el número de raciones y los macros resultantes, con un icono que la distingue de un alimento suelto. Si despliegas la fila, verás los ingredientes de la receta como referencia, aunque no se pueden editar desde el editor del plan; para modificarla ve a la sección `Recetas`.",
    related: ["de-18", "de-60", "de-79"],
    keywords: ["vincular", "receta", "comida"],
  },
  {
    id: "de-60",
    section: "dieta-editor",
    question: "¿Puedo sustituir un alimento por una receta equivalente?",
    answer:
      "Sí, aunque no hay una acción directa `Sustituir por receta`: la forma práctica es eliminar el alimento y añadir la receta equivalente desde el buscador. Los macros se recalculan automáticamente y puedes comparar los totales anteriores y posteriores en las barras de progreso. Si usas mucho esta operación en distintos planes, considera dejar una nota en la ficha del paciente para que todos los planes futuros empiecen con la receta en vez de con el alimento. La reversión se hace con `Ctrl+Z` si cambias de opinión.",
    related: ["de-40", "de-59", "de-63"],
    keywords: ["sustituir", "receta", "equivalente"],
  },
  {
    id: "de-61",
    section: "dieta-editor",
    question: "¿El editor soporta seguimiento de hidratación por comida?",
    answer:
      "No, el editor no tiene un campo específico para hidratación por comida. Los líquidos se registran como cualquier otro alimento añadiendo agua, infusiones o bebidas desde el buscador, con la cantidad en mililitros. Si quieres recomendar una pauta de hidratación diaria, usa la descripción del plan o una recomendación en la ficha del paciente. Para un seguimiento exhaustivo de la hidratación, existe el módulo `seguimiento` del portal del paciente, donde el paciente registra su consumo.",
    related: ["de-25", "de-78", "de-79"],
    keywords: ["hidratación", "agua", "líquidos"],
  },
  {
    id: "de-62",
    section: "dieta-editor",
    question: "¿Se puede editar el plan de forma colaborativa con otro profesional?",
    answer:
      "No, el editor está pensado para un único profesional como autor del plan, y no permite la edición colaborativa en tiempo real con otra cuenta. Si otro profesional necesita proponer cambios, lo habitual es exportar el plan a PDF o a plantilla y que él la replique en su propio sistema o en su propia cuenta. El plan queda vinculado al profesional que lo ha creado y solo él puede modificarlo, aunque varios profesionales puedan estar asociados al paciente desde `Ajustes`. La colaboración multi-autor es una mejora en el horizonte.",
    related: ["de-50", "de-7", "de-79"],
    keywords: ["colaborativa", "multiusuario", "co-edición"],
  },
  {
    id: "de-63",
    section: "dieta-editor",
    question: "¿Se conservan los alimentos entre pacientes distintos?",
    answer:
      "Sí, los alimentos que tú creas en tu base personal están disponibles en el buscador de cualquier plan de cualquier paciente tuyo. Es decir, si diste de alta `Pan de masa madre de panadería X` en el plan de un paciente, lo encontrarás también al editar el plan de otro. Lo mismo ocurre con los alimentos globales y con las recetas. Esta persistencia ahorra mucho trabajo porque permite reutilizar los productos específicos que ya has verificado nutricionalmente en una ocasión.",
    related: ["de-42", "de-14", "de-55"],
    keywords: ["conservar", "alimentos", "pacientes"],
  },
  {
    id: "de-64",
    section: "dieta-editor",
    question: "¿Qué pasa si se borra un alimento de la base usado en un plan?",
    answer:
      "Si un alimento usado en planes se elimina de la base, el editor muestra la fila con un indicador de `alimento no disponible` y mantiene los valores de macros guardados en ese momento para no romper los totales. El paciente verá el alimento con su nombre original pero sin posibilidad de que tú lo modifiques (solo eliminarlo o sustituirlo). Para evitar este estado, antes de eliminar un alimento comprueba dónde se está utilizando desde su ficha en la sección `Alimentos`. La aplicación te avisa antes de borrar si hay planes afectados.",
    related: ["de-42", "de-40", "de-74"],
    keywords: ["borrar", "alimento", "usado"],
  },
  {
    id: "de-65",
    section: "dieta-editor",
    question: "¿Cómo renombro un plan existente?",
    answer:
      "Pulsa el botón `Editar` de la cabecera del editor para abrir el diálogo de metadatos, donde el primer campo es el nombre del plan. Cámbialo, pulsa `Guardar` y el nuevo nombre se aplicará en la cabecera, en el listado de dietas del paciente y en el portal. No hay restricciones de longitud más allá de los límites razonables (unos 100 caracteres) ni de caracteres especiales. Renombrar un plan no afecta a su contenido ni a las plantillas derivadas.",
    related: ["de-3", "de-9", "de-66"],
    keywords: ["renombrar", "nombre", "plan"],
  },
  {
    id: "de-66",
    section: "dieta-editor",
    question: "¿Puedo cambiar el paciente propietario de un plan?",
    answer:
      "No, un plan queda vinculado al paciente para el que se creó y no se puede reasignar a otro paciente desde el editor. Si necesitas aplicar el mismo plan a otro paciente, la forma correcta es guardarlo como plantilla (botón `Plantilla`) y crear un nuevo plan para el paciente destino cargando esa plantilla. Así respetas la historia clínica de cada paciente y los totales antropométricos se mantienen correctos. No hay una opción directa de `mover plan` entre pacientes por diseño.",
    related: ["de-44", "de-65", "de-7"],
    keywords: ["cambiar paciente", "reasignar", "propietario"],
  },
  {
    id: "de-67",
    section: "dieta-editor",
    question: "¿Puedo exportar el plan a JSON?",
    answer:
      "Sí, desde el menú contextual de la cabecera (tres puntos) hay una opción `Exportar JSON` que descarga el plan completo como un archivo `.json` con toda su estructura: días, comidas, alimentos, cantidades, notas y metadatos. Es útil para hacer copias de seguridad manuales, compartirlo con otro profesional en un formato editable o migrarlo a un sistema externo. El formato está documentado internamente y puede cambiar entre versiones, así que no es garantía de compatibilidad a largo plazo.",
    related: ["de-68", "de-47", "de-7"],
    keywords: ["exportar", "json", "backup"],
  },
  {
    id: "de-68",
    section: "dieta-editor",
    question: "¿Puedo importar un plan desde un JSON?",
    answer:
      "Sí, el mismo menú contextual incluye `Importar JSON`, que abre un selector de archivo. Al cargar un JSON válido, el editor sustituye el contenido actual del plan por el del archivo, tras pedirte confirmación porque es una acción destructiva. El JSON debe seguir el formato exportado por la aplicación; si está corrupto o incompleto, se muestra un mensaje de error sin aplicar ningún cambio. Esta operación es útil para restaurar copias de seguridad o para replicar rápidamente un plan ajeno que te han compartido en JSON.",
    related: ["de-67", "de-24", "de-36"],
    keywords: ["importar", "json", "cargar"],
  },
  {
    id: "de-69",
    section: "dieta-editor",
    question: "¿Qué ocurre si hay errores al calcular los macros?",
    answer:
      "Si el editor detecta una inconsistencia al calcular los macros (por ejemplo, un alimento con unidades mal configuradas o con datos nulos), muestra un aviso visual junto a la fila problemática y descarta ese alimento del total para no dar cifras incorrectas. El aviso te sugiere abrir la ficha del alimento y corregir los datos faltantes. Si sigues con la edición, los macros afectados aparecerán con un asterisco hasta que soluciones el problema. Los fallos de cálculo no bloquean el guardado del plan.",
    related: ["de-29", "de-70", "de-74"],
    keywords: ["error", "cálculo", "macros"],
  },
  {
    id: "de-70",
    section: "dieta-editor",
    question: "¿El editor valida que un día tenga comidas?",
    answer:
      "El editor comprueba que cada día activo tenga al menos una comida con contenido y muestra un icono de advertencia en la pestaña del día si está vacío. No es un error bloqueante: puedes guardar el plan con días vacíos, por ejemplo para un día de descanso deliberado. Si el paciente abre el portal en un día vacío, verá un mensaje del estilo `Sin comidas previstas para hoy` en vez de una lista. La validación es informativa y su objetivo es evitar despistes al cerrar el editor.",
    related: ["de-12", "de-71", "de-58"],
    keywords: ["validar", "día", "vacío"],
  },
  {
    id: "de-71",
    section: "dieta-editor",
    question: "¿Qué son los días incompletos y el aviso asociado?",
    answer:
      "Un día incompleto es aquel que tiene alguna comida con alimentos pero otras comidas vacías; el editor lo señala con un icono amarillo y el mensaje `Día incompleto` al pasar el ratón. No siempre es un error: puede ser deliberado (por ejemplo, un desayuno saltado en ayuno intermitente). El aviso te invita a revisar y, si la intención es dejarlo así, puedes ignorarlo sin consecuencias. Los días completamente llenos o completamente vacíos no disparan este aviso.",
    related: ["de-70", "de-12", "de-72"],
    keywords: ["incompleto", "aviso", "warning"],
  },
  {
    id: "de-72",
    section: "dieta-editor",
    question: "¿Hay alguna estimación de duración del plan?",
    answer:
      "El diálogo de metadatos permite indicar una fecha de inicio y una fecha de fin del plan, y con ello el editor calcula automáticamente la duración estimada en días o semanas, que se muestra en la cabecera. La duración es informativa: no bloquea al paciente cuando se cumple la fecha ni archiva el plan automáticamente. Cuando la fecha de fin se acerca, aparece un recordatorio discreto para que valores si prolongar el plan, renovarlo con cambios o cerrarlo. Si dejas la fecha de fin en blanco, el plan se considera abierto.",
    related: ["de-9", "de-4", "de-70"],
    keywords: ["duración", "estimada", "fecha"],
  },
  {
    id: "de-73",
    section: "dieta-editor",
    question: "¿Cómo se navega dentro del editor cuando hay mucho contenido?",
    answer:
      "Cuando un día tiene muchas comidas y muchos alimentos, el área central del editor muestra una barra de desplazamiento vertical propia, que te deja recorrer el contenido sin perder la cabecera ni las pestañas de día. En escritorio, puedes usar `Página arriba` y `Página abajo` para avanzar por comidas, y `Inicio`/`Fin` para ir al primer o último elemento del día. En móvil, el gesto de deslizar vertical funciona con naturalidad. Los totales diarios permanecen visibles en una franja inferior fija para no perderlos de vista.",
    related: ["de-38", "de-39", "de-74"],
    keywords: ["scroll", "desplazar", "navegar"],
  },
  {
    id: "de-74",
    section: "dieta-editor",
    question: "¿Puedo buscar dentro del plan un alimento concreto?",
    answer:
      "El editor no tiene un buscador propio para encontrar dentro del plan un alimento ya añadido, pero puedes usar la búsqueda del navegador con `Ctrl+F` (`Cmd+F` en Mac) y funciona sobre los nombres de los alimentos visibles. Como el editor desmonta los días no visibles, la búsqueda solo encontrará lo que haya en el día activo; para revisar todos los días, cambia de pestaña manualmente. La función `Análisis` también lista todos los alimentos del plan agrupados, y es útil para localizar rápido un producto sin ir día por día.",
    related: ["de-31", "de-38", "de-73"],
    keywords: ["buscar", "plan", "ctrl+f"],
  },
  {
    id: "de-75",
    section: "dieta-editor",
    question: "¿Puedo cambiar el objetivo calórico sin rehacer el plan?",
    answer:
      "Sí, cambiar el objetivo calórico desde los metadatos solo modifica la referencia frente a la que se comparan los totales, no altera los alimentos ni las cantidades ya añadidos. Al cambiarlo, las barras de progreso se recalculan con el nuevo objetivo y puede que pasen de verdes a amarillas o viceversa, pero el contenido del plan permanece idéntico. Es una forma rápida de ajustar la aspiración calórica del plan, por ejemplo si cambian las condiciones del paciente. Si además quieres que el contenido cambie en consecuencia, tendrás que revisarlo manualmente.",
    related: ["de-4", "de-9", "de-29"],
    keywords: ["objetivo", "kcal", "cambiar"],
  },
  {
    id: "de-76",
    section: "dieta-editor",
    question: "¿Cómo se redondean los gramajes al mostrarlos?",
    answer:
      "El editor guarda internamente los gramajes con la precisión que introduces, pero los muestra redondeados al entero más cercano para facilitar la lectura (por ejemplo, `124,7 g` aparece como `125 g`). Las operaciones internas de suma y conversión entre unidades usan el valor exacto, así que el redondeo es solo estético y no introduce errores acumulativos. Los totales diarios y semanales se redondean de la misma manera. Si necesitas ver decimales, la vista detallada los muestra en el tooltip del alimento.",
    related: ["de-16", "de-17", "de-37"],
    keywords: ["redondeo", "gramos", "mostrar"],
  },
  {
    id: "de-77",
    section: "dieta-editor",
    question: "¿Cómo se comporta el editor con alimentos de nombres muy largos?",
    answer:
      "Los nombres muy largos (más de 60 caracteres) se truncan en la vista compacta con puntos suspensivos y se muestran completos al pasar el ratón por encima o al desplegar la fila. En la vista detallada y en el PDF aparece el nombre completo sin cortes. Esto mantiene la maquetación limpia sin impedir que identifiques el alimento. Si usas códigos comerciales largos como parte del nombre, plantéate separarlos con un guion para que el corte respete el nombre genérico.",
    related: ["de-37", "de-47", "de-53"],
    keywords: ["nombre", "largo", "truncar"],
  },
  {
    id: "de-78",
    section: "dieta-editor",
    question: "¿Cómo trato las recetas con varias porciones en el plan?",
    answer:
      "Al añadir una receta con múltiples porciones (por ejemplo, una fuente de ensaladilla rusa para 4 personas), el editor te pide cuántas porciones quieres asignar a la comida del paciente y calcula los macros multiplicando los valores unitarios de la receta por ese número. La receta aparece como una sola línea con la cantidad en `porciones` y puedes cambiar ese número en línea en cualquier momento. Si tu paciente se va a comer `media porción`, pon `0,5`; si tiene que repetir, sube el número.",
    related: ["de-18", "de-16", "de-59"],
    keywords: ["receta", "porciones", "múltiples"],
  },
  {
    id: "de-79",
    section: "dieta-editor",
    question: "¿Dónde reviso el plan sin editarlo?",
    answer:
      "La vista detalle en `/dietas/[id]` es la contraparte de solo lectura del editor: muestra el mismo contenido maquetado pero sin controles de edición, botones de `+` ni arrastre. Es útil para revisar el plan como lo verá el paciente, presentárselo en consulta o compartir la pantalla sin miedo a tocar algo por accidente. Desde esa vista puedes saltar al editor con un botón `Editar`, imprimirlo, exportarlo a PDF o compartirlo. Toda acción destructiva queda fuera del alcance en esta vista.",
    related: ["de-1", "de-46", "de-47"],
    keywords: ["revisar", "solo lectura", "detalle"],
  },
  {
    id: "de-80",
    section: "dieta-editor",
    question: "¿Dónde veo más ayuda sobre el editor y sus funciones relacionadas?",
    answer:
      "Este mismo manual tiene secciones dedicadas a temas complementarios: `dieta-ia` explica la generación automática, `dieta-plantillas` detalla la gestión de plantillas, `dieta-compartir` cubre el flujo de compartir y PDF, `alimentos` y `recetas` documentan la base de datos que alimenta al editor, y `paciente-plan-alimentacion` trata la vista del plan desde la ficha del paciente. Si tras consultar todas esas páginas sigues teniendo dudas, usa el widget de ayuda contextual en la esquina inferior derecha o escribe al soporte desde `Ajustes`. El objetivo es que no te bloquees en ningún punto del flujo nutricional.",
    related: ["de-1", "de-6", "de-46"],
    keywords: ["ayuda", "secciones", "manual"],
  },
];
