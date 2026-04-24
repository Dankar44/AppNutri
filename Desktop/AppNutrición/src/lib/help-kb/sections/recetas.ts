import type { HelpEntry } from "../types";

export const RECETAS_ENTRIES: HelpEntry[] = [
  {
    id: "rc-1",
    section: "recetas",
    question: "¿Qué es la sección Recetas de Annonia?",
    answer:
      "La sección Recetas, accesible en `/recetas`, es el catálogo gastronómico de la aplicación, pensado para que tengas a mano un repertorio organizado de preparaciones culinarias listas para incluir en los planes de tus pacientes. Cada receta agrupa ingredientes, instrucciones, tiempos, dificultad y macros calculados automáticamente. Conviven recetas globales, compartidas con todos los dietistas de la plataforma, y recetas propias que tú mismo creas. Es una pieza clave para ahorrar tiempo y dar variedad a tus planes sin partir de cero cada vez.",
    related: ["rc-2", "rc-3", "rc-4"],
    keywords: ["recetas", "catálogo", "qué es", "introducción"],
  },
  {
    id: "rc-2",
    section: "recetas",
    question: "¿Cómo accedo al listado de recetas?",
    answer:
      "Desde el sidebar de la izquierda, haz clic en el icono de recetas (un cuaderno o utensilios de cocina) y llegarás a `/recetas`. Por defecto verás un listado en forma de tarjetas (cards) con foto, nombre, tiempo total y macros por porción. El listado combina tus recetas propias y las globales de la plataforma, identificadas con un distintivo visual. Desde esa misma pantalla puedes filtrar, buscar, crear nuevas o entrar a cualquier receta con un clic.",
    related: ["rc-1", "rc-5", "rc-6"],
    keywords: ["listado", "acceso", "cards", "pantalla"],
  },
  {
    id: "rc-3",
    section: "recetas",
    question: "¿Cuál es la diferencia entre recetas globales y propias?",
    answer:
      "Las recetas globales son las que ofrece la plataforma a todos los dietistas por igual, previamente revisadas y con foto y datos completos. No puedes editarlas ni eliminarlas, solo usarlas o duplicarlas. Las recetas propias son las que tú creas desde cero o duplicando una global: aparecen solo en tu cuenta, puedes modificarlas libremente y se muestran marcadas como tuyas. En el listado se distinguen con una etiqueta o un color diferente para que sepas de un vistazo cuáles puedes tocar.",
    related: ["rc-1", "rc-8", "rc-17"],
    keywords: ["global", "propia", "diferencia", "origen"],
  },
  {
    id: "rc-4",
    section: "recetas",
    question: "¿Qué información contiene una receta?",
    answer:
      "Una receta en Annonia contiene nombre, descripción, número de porciones, lista de ingredientes con cantidad, instrucciones paso a paso, tiempo de preparación, tiempo de cocción, dificultad, categoría, tags y foto. A partir de los ingredientes, el sistema calcula automáticamente las calorías y los macros totales, dividiéndolos después entre las porciones para mostrarte siempre el valor por porción. También puede tener notas privadas que solo tú ves. Es la unidad mínima reutilizable de tu biblioteca culinaria.",
    related: ["rc-5", "rc-10", "rc-22"],
    keywords: ["campos", "información", "estructura", "contenido"],
  },
  {
    id: "rc-5",
    section: "recetas",
    question: "¿Cómo creo una receta nueva?",
    answer:
      "Pulsa el botón `Nueva receta` en la esquina superior derecha de `/recetas`. Se abre un formulario dividido en secciones: datos generales, ingredientes, instrucciones y metadatos (categoría, tags, foto). Rellena al menos los campos obligatorios (nombre, ingredientes y porciones), añade los pasos y guarda. La receta queda inmediatamente disponible en tu listado como propia y lista para usar en planes.",
    related: ["rc-6", "rc-9", "rc-10"],
    keywords: ["crear", "nueva", "botón", "formulario"],
  },
  {
    id: "rc-6",
    section: "recetas",
    question: "¿Cuáles son los campos obligatorios al crear una receta?",
    answer:
      "Los campos obligatorios son el nombre, al menos un ingrediente con su cantidad y el número de porciones. Sin estos tres datos no se puede guardar la receta porque son imprescindibles para calcular los macros por porción. El resto (descripción, instrucciones, tiempos, dificultad, categoría, tags, foto) son recomendables pero opcionales. Aun así, te animamos a completarlos para que la receta sea útil y clara, sobre todo si vas a compartirla con pacientes en sus planes.",
    related: ["rc-5", "rc-7", "rc-15"],
    keywords: ["obligatorios", "mínimos", "requeridos", "validación"],
  },
  {
    id: "rc-7",
    section: "recetas",
    question: "¿Cómo añado ingredientes a una receta?",
    answer:
      "Dentro del formulario de receta, en la sección de ingredientes, pulsa `Añadir ingrediente` y se abrirá un buscador sobre tu base de datos de alimentos. Escribe el nombre del alimento, selecciónalo y a continuación indica la cantidad en gramos o la unidad correspondiente. Repite el proceso para cada ingrediente. Cada alimento añadido aporta sus macros al cómputo total, que se recalcula al momento en la previsualización de la receta.",
    related: ["rc-6", "rc-22", "rc-34"],
    keywords: ["ingredientes", "añadir", "alimento", "cantidad"],
  },
  {
    id: "rc-8",
    section: "recetas",
    question: "¿Puedo editar una receta global?",
    answer:
      "No directamente. Las recetas globales son de solo lectura para preservar su calidad y consistencia en toda la plataforma. Si quieres modificar una, usa la opción `Duplicar`: se crea una copia propia que ya sí puedes editar libremente sin afectar a la original. Es el flujo habitual para partir de una receta oficial y adaptarla a tu estilo, a ingredientes locales o a restricciones particulares de tus pacientes.",
    related: ["rc-3", "rc-17", "rc-19"],
    keywords: ["editar", "global", "restricción", "duplicar"],
  },
  {
    id: "rc-9",
    section: "recetas",
    question: "¿Cómo escribo las instrucciones paso a paso?",
    answer:
      "En la sección de instrucciones del formulario verás un editor donde puedes añadir pasos numerados uno a uno. La numeración se genera automáticamente, así que solo tienes que escribir el texto de cada paso y pulsar Enter o el botón para añadir el siguiente. Puedes reordenar los pasos arrastrando o usando las flechas, y eliminarlos con el icono de papelera. Un buen paso es corto, claro y describe una acción (por ejemplo: \"Cortar la cebolla en juliana fina\").",
    related: ["rc-10", "rc-66", "rc-68"],
    keywords: ["instrucciones", "pasos", "editor", "redacción"],
  },
  {
    id: "rc-10",
    section: "recetas",
    question: "¿Qué diferencia hay entre tiempo de preparación y tiempo de cocción?",
    answer:
      "El tiempo de preparación es el que dedicas a trabajos previos sin fuego: lavar, pelar, cortar, mezclar o emplatar. El tiempo de cocción es el que pasa en el fuego, horno o similar: hervir, saltear, asar, etc. Ambos se muestran por separado porque ayudan al paciente a organizarse, y se suman para calcular el tiempo total que aparece en la card. Indicar los dos valores mejora mucho la percepción de cuánto esfuerzo real supone hacer la receta.",
    related: ["rc-11", "rc-27", "rc-28"],
    keywords: ["tiempo", "preparación", "cocción", "duración"],
  },
  {
    id: "rc-11",
    section: "recetas",
    question: "¿Cómo se decide la dificultad de una receta?",
    answer:
      "La dificultad se marca manualmente al crear la receta eligiendo entre fácil, media o difícil. Como orientación, fácil implica técnicas básicas y menos de quince minutos de atención activa; media supone varios pasos encadenados o técnicas intermedias; difícil exige técnicas avanzadas, tiempos largos o precisión. Elige pensando en un paciente promedio, no en un cocinero experimentado. Cuando dudes, es preferible asignar una dificultad algo más alta que dejar una receta compleja como fácil.",
    related: ["rc-10", "rc-25", "rc-70"],
    keywords: ["dificultad", "fácil", "media", "difícil"],
  },
  {
    id: "rc-12",
    section: "recetas",
    question: "¿Qué son las categorías de receta?",
    answer:
      "La categoría describe el momento del día o la función de la receta: desayuno, almuerzo, cena, snack o postre. Se elige una sola categoría por receta desde un desplegable. Sirve para filtrar rápidamente el catálogo y para que en el editor de dietas el sistema te proponga recetas acordes al momento que estás rellenando. Si una receta encaja en varios momentos, elige la más habitual y apóyate en los tags para matizar.",
    related: ["rc-13", "rc-25", "rc-26"],
    keywords: ["categoría", "desayuno", "comida", "clasificación"],
  },
  {
    id: "rc-13",
    section: "recetas",
    question: "¿Para qué sirven los tags en una receta?",
    answer:
      "Los tags son etiquetas libres que matizan la receta más allá de la categoría: por ejemplo `vegano`, `sin gluten`, `alto en proteína`, `batch cooking`, `infantil` o `navidad`. Puedes asignar varios a una misma receta. Sirven para filtrar el catálogo con criterios finos y para que al buscar recetas compatibles con un paciente con restricciones puedas localizar opciones rápidamente. Procura usar un conjunto de tags estable y coherente para sacarles el máximo provecho.",
    related: ["rc-12", "rc-26", "rc-52"],
    keywords: ["tags", "etiquetas", "categoría", "clasificación"],
  },
  {
    id: "rc-14",
    section: "recetas",
    question: "¿Cómo subo una foto a la receta?",
    answer:
      "En el formulario de receta hay una zona para subir una imagen, normalmente marcada con `Subir foto` o un icono de cámara. Puedes arrastrar el archivo, pulsar y seleccionarlo desde tu equipo, o, si estás en el móvil, hacer una foto directamente con la cámara. Una vez cargada, se muestra la previsualización y puedes sustituirla o eliminarla. Las fotos ayudan muchísimo a la adherencia: una receta con imagen se percibe como más apetecible.",
    related: ["rc-15", "rc-55", "rc-56"],
    keywords: ["foto", "imagen", "subir", "cámara"],
  },
  {
    id: "rc-15",
    section: "recetas",
    question: "¿Cómo se calculan las calorías y macros de una receta?",
    answer:
      "El cálculo es automático: el sistema suma calorías, proteínas, grasas e hidratos de todos los ingredientes según sus cantidades y luego divide el total entre el número de porciones. Por eso es imprescindible que las cantidades estén bien indicadas y que las porciones reflejen la realidad. Si cambias un ingrediente o la cantidad, los macros por porción se recalculan al instante. No tienes que introducir los valores nutricionales a mano en ningún caso.",
    related: ["rc-16", "rc-22", "rc-31"],
    keywords: ["calorías", "macros", "cálculo", "automático"],
  },
  {
    id: "rc-16",
    section: "recetas",
    question: "¿Los macros se muestran por porción o totales?",
    answer:
      "En la card y en la ficha de la receta los macros y las calorías se muestran siempre por porción, porque es la unidad que después se asigna al paciente en sus planes. Si necesitas ver los totales, puedes multiplicar mentalmente por el número de porciones, o abrir la vista detallada donde se desglosan los aportes de cada ingrediente. Esta decisión de diseño evita confusiones cuando una receta rinde para varias personas.",
    related: ["rc-15", "rc-22", "rc-31"],
    keywords: ["porción", "total", "unidad", "nutrientes"],
  },
  {
    id: "rc-17",
    section: "recetas",
    question: "¿Cómo edito una receta?",
    answer:
      "Haz clic en la card de la receta en el listado para abrir su ficha. Si es propia, verás un botón `Editar` que te lleva al mismo formulario de creación con todos los campos rellenos. Haz los cambios que necesites y pulsa `Guardar`. Si es global, el botón Editar no aparece; en su lugar puedes duplicarla y editar la copia. Los cambios en una receta propia se aplican de forma inmediata en el catálogo.",
    related: ["rc-18", "rc-19", "rc-3"],
    keywords: ["editar", "modificar", "actualizar", "propia"],
  },
  {
    id: "rc-18",
    section: "recetas",
    question: "¿Cómo elimino una receta?",
    answer:
      "Solo puedes eliminar recetas propias. Abre la receta desde el listado y pulsa el botón `Eliminar`; el sistema te pedirá confirmación porque la acción no se puede deshacer. Si la receta está usada en planes de pacientes, se te advertirá antes de borrarla para que decidas con conocimiento. Las recetas globales nunca se pueden eliminar; como mucho, podrías ocultarlas de tu vista mediante filtros, pero no se borran.",
    related: ["rc-17", "rc-19", "rc-3"],
    keywords: ["eliminar", "borrar", "propias", "confirmación"],
  },
  {
    id: "rc-19",
    section: "recetas",
    question: "¿Cómo duplico una receta?",
    answer:
      "En la ficha de la receta hay un botón `Duplicar` que crea una copia idéntica en tu catálogo propio, con el mismo nombre seguido de `(copia)`. A partir de ahí puedes editarla como cualquier receta propia. Es especialmente útil con las recetas globales: te permite partir de una base sólida y personalizarla sin afectar al original. También puedes duplicar tus propias recetas para hacer variantes sin reescribirlas desde cero.",
    related: ["rc-8", "rc-17", "rc-46"],
    keywords: ["duplicar", "copiar", "variante", "clonar"],
  },
  {
    id: "rc-20",
    section: "recetas",
    question: "¿Cómo marco una receta como favorita?",
    answer:
      "Cada card y cada ficha de receta tiene un icono de corazón o estrella para marcarla como favorita. Un clic la añade a favoritos; otro clic la desmarca. Puedes marcar tanto recetas propias como globales. Esta acción es personal: tus favoritos no se comparten con otros dietistas de la plataforma. Es una forma rápida de curar tu selección de recetas usadas más a menudo sin tener que duplicarlas.",
    related: ["rc-21", "rc-25", "rc-26"],
    keywords: ["favorita", "corazón", "estrella", "marcar"],
  },
  {
    id: "rc-21",
    section: "recetas",
    question: "¿Dónde veo mis recetas favoritas?",
    answer:
      "En la barra de filtros del listado `/recetas` hay una opción para mostrar solo favoritas, normalmente representada por el icono de corazón o un botón `Favoritas`. Al activarla, el catálogo se reduce a las recetas marcadas por ti. Es ideal cuando estás en pleno diseño de un plan y quieres moverte rápido entre tus opciones habituales. Desactiva el filtro para volver a ver todo el catálogo.",
    related: ["rc-20", "rc-25", "rc-26"],
    keywords: ["favoritas", "dónde", "filtro", "lista"],
  },
  {
    id: "rc-22",
    section: "recetas",
    question: "¿Qué aparece en cada card de receta del listado?",
    answer:
      "Cada card muestra la foto, el nombre, el tiempo total (preparación más cocción), la dificultad con un icono, la categoría y los macros por porción principales (calorías y los tres macros). También verás una marca si es favorita y un distintivo si es global o propia. La card está diseñada para que decidas si la receta te encaja sin abrirla. Un clic sobre ella lleva a la ficha completa.",
    related: ["rc-2", "rc-15", "rc-16"],
    keywords: ["card", "tarjeta", "resumen", "vista previa"],
  },
  {
    id: "rc-23",
    section: "recetas",
    question: "¿Cómo filtro recetas por tiempo?",
    answer:
      "En la barra de filtros puedes seleccionar un rango de tiempo total: menos de 15 minutos, entre 15 y 30 minutos o más de 30 minutos. El listado se actualiza inmediatamente y solo muestra las recetas que encajan en ese rango. Es un filtro especialmente útil para pacientes con poco tiempo en la semana o para preparar comidas rápidas del día a día. Puedes combinarlo con otros filtros activos.",
    related: ["rc-24", "rc-25", "rc-26"],
    keywords: ["filtro", "tiempo", "rápido", "duración"],
  },
  {
    id: "rc-24",
    section: "recetas",
    question: "¿Cómo filtro recetas por dificultad?",
    answer:
      "Los botones de dificultad (fácil, media, difícil) aparecen en la barra de filtros. Pulsa sobre los niveles que te interesen para que el catálogo se limite a esas recetas. Puedes seleccionar varios niveles a la vez si, por ejemplo, quieres ver las fáciles y las medias juntas. Para quitar el filtro, vuelve a pulsar sobre el mismo nivel o usa el botón `Limpiar filtros`.",
    related: ["rc-23", "rc-25", "rc-11"],
    keywords: ["filtro", "dificultad", "nivel", "fácil"],
  },
  {
    id: "rc-25",
    section: "recetas",
    question: "¿Cómo filtro recetas por categoría?",
    answer:
      "En la barra de filtros hay botones o un desplegable con las categorías (desayuno, almuerzo, cena, snack, postre). Selecciónalas para ver únicamente recetas de esos momentos del día. Es un filtro muy útil cuando estás rellenando una comida concreta de un plan, o cuando buscas, por ejemplo, ideas de desayunos nuevos. Puedes combinar categoría con tiempo, dificultad y tags para afinar al máximo.",
    related: ["rc-12", "rc-23", "rc-26"],
    keywords: ["filtro", "categoría", "desayuno", "cena"],
  },
  {
    id: "rc-26",
    section: "recetas",
    question: "¿Cómo filtro recetas por tags?",
    answer:
      "En la barra de filtros puedes desplegar la lista de tags y activar los que te interesen, por ejemplo `vegano` o `sin gluten`. El listado muestra solo recetas que contengan al menos los tags seleccionados. Como los tags son libres, conviene mantener un vocabulario consistente para que los filtros sean predecibles. Combina este filtro con categoría y tiempo para localizar opciones muy concretas en segundos.",
    related: ["rc-13", "rc-25", "rc-52"],
    keywords: ["filtro", "tags", "etiquetas", "vegano"],
  },
  {
    id: "rc-27",
    section: "recetas",
    question: "¿Cómo busco una receta por texto?",
    answer:
      "En la parte superior del listado hay un buscador; escribe cualquier palabra del nombre o descripción y el catálogo se filtra en vivo. La búsqueda no distingue mayúsculas, minúsculas ni tildes, así que escribir `ensalada` o `ENSALADA` da los mismos resultados. Puedes combinar el buscador con los filtros laterales para reducir aún más. Borra el texto del buscador para restaurar el listado completo.",
    related: ["rc-28", "rc-25", "rc-26"],
    keywords: ["buscar", "buscador", "texto", "nombre"],
  },
  {
    id: "rc-28",
    section: "recetas",
    question: "¿Cómo ordeno el listado de recetas?",
    answer:
      "En la parte superior derecha del listado encontrarás un selector de orden con opciones como nombre A-Z, nombre Z-A, más recientes, más usadas o calorías ascendentes/descendentes. Elige la que mejor encaje con lo que estás buscando: para planificación rápida suele ser útil `más usadas`, mientras que para explorar novedades funciona mejor `más recientes`. El orden se mantiene mientras aplicas filtros.",
    related: ["rc-27", "rc-22", "rc-26"],
    keywords: ["ordenar", "orden", "nombre", "reciente"],
  },
  {
    id: "rc-29",
    section: "recetas",
    question: "¿Cómo uso una receta dentro de un plan de alimentación?",
    answer:
      "Desde el editor de dietas, en cualquier comida del día, pulsa `Añadir receta` y se abrirá un buscador con tu catálogo de recetas. Selecciona la que quieras y se insertará en la comida con sus macros por porción y el número de porciones indicado. Puedes modificar las porciones en el editor sin cambiar la receta original. Si prefieres añadir alimentos sueltos en lugar de una receta, también puedes desde el mismo editor.",
    related: ["rc-30", "rc-32", "rc-41"],
    keywords: ["plan", "dieta", "usar", "editor"],
  },
  {
    id: "rc-30",
    section: "recetas",
    question: "¿Qué diferencia hay entre una receta como alimento único y una receta desplegada?",
    answer:
      "Al insertar una receta en un plan puedes elegir mostrarla como un bloque único con su nombre y macros totales (más limpio visualmente) o desplegarla en la lista de ingredientes individuales que la componen. La primera opción es cómoda cuando el paciente ya conoce la preparación; la segunda es útil si quieres que vea exactamente qué ingredientes y cantidades debe usar. Ambas visualizaciones son equivalentes nutricionalmente.",
    related: ["rc-29", "rc-32", "rc-41"],
    keywords: ["desplegar", "bloque", "ingredientes", "visualización"],
  },
  {
    id: "rc-31",
    section: "recetas",
    question: "¿Qué son las porciones y cómo influyen?",
    answer:
      "Las porciones indican cuántas raciones salen de preparar la receta. Por ejemplo, una lasaña para cuatro tiene cuatro porciones. Los macros totales (suma de todos los ingredientes) se dividen entre ese número para dar los valores por porción que se muestran en la card. Por eso es clave que las porciones reflejen con realismo cuántas personas comen con la preparación. Si las cambias, los macros por porción se recalculan automáticamente.",
    related: ["rc-15", "rc-16", "rc-32"],
    keywords: ["porciones", "raciones", "cantidad", "rinde"],
  },
  {
    id: "rc-32",
    section: "recetas",
    question: "¿Puedo escalar las porciones de una receta?",
    answer:
      "Sí. En el editor de dietas, al insertar la receta en una comida, puedes ajustar cuántas porciones consume el paciente sin modificar la receta original. También al editar la receta puedes cambiar el número total de porciones que produce, y los macros por porción se recalcularán. El escalado es proporcional, así que todas las cantidades se reparten uniformemente. No hay escalado individual por ingrediente; se trabaja siempre sobre el total.",
    related: ["rc-29", "rc-31", "rc-33"],
    keywords: ["escalar", "porciones", "ajustar", "proporción"],
  },
  {
    id: "rc-33",
    section: "recetas",
    question: "¿Las recetas aparecen en la lista de la compra?",
    answer:
      "Sí. Cuando un plan incluye una receta, sus ingredientes se suman automáticamente a la lista de la compra del paciente. Si la misma receta se repite varios días, las cantidades se acumulan para no duplicar entradas. Así el paciente recibe una lista única, coherente y realista, sin tener que anotar manualmente los ingredientes de cada receta. Esta función simplifica mucho la adherencia y reduce el olvido de productos.",
    related: ["rc-29", "rc-32", "rc-41"],
    keywords: ["lista", "compra", "ingredientes", "acumular"],
  },
  {
    id: "rc-34",
    section: "recetas",
    question: "¿Qué hago si falta un ingrediente en la base de datos?",
    answer:
      "Si al buscar no encuentras un alimento, ve a la sección `/alimentos` y créalo tú mismo con sus datos nutricionales (por 100 g o por unidad). Una vez disponible, vuelve a la receta y añádelo desde el buscador. Así el ingrediente queda guardado para usarlo en otras recetas y planes. Si crees que es un alimento común que debería estar en la base global, puedes proponerlo al equipo de Annonia desde soporte.",
    related: ["rc-7", "rc-35", "rc-53"],
    keywords: ["falta", "alimento", "base de datos", "crear"],
  },
  {
    id: "rc-35",
    section: "recetas",
    question: "¿Puedo contribuir con recetas al catálogo global?",
    answer:
      "El catálogo global lo cura el equipo de Annonia para garantizar calidad y consistencia. No hay un botón directo para publicar una receta propia como global, pero puedes proponerla desde el widget de ayuda o por correo de soporte. Si cumple criterios de claridad, nutrición adecuada y buena foto, el equipo la incorpora al catálogo oficial. Mientras tanto, tu receta sigue siendo tuya y totalmente funcional.",
    related: ["rc-3", "rc-34", "rc-46"],
    keywords: ["contribuir", "global", "propuesta", "publicar"],
  },
  {
    id: "rc-36",
    section: "recetas",
    question: "¿Las recetas tienen notas privadas?",
    answer:
      "Sí, el formulario de receta incluye un campo de notas privadas visible solo para ti. Sirve para apuntar ajustes que haces al prepararla, advertencias sobre ciertos pacientes, recordatorios de sustituciones habituales o cualquier dato que no quieras compartir. Las notas privadas no aparecen en el plan del paciente ni en las exportaciones. Es un espacio personal para tu criterio profesional.",
    related: ["rc-4", "rc-37", "rc-54"],
    keywords: ["notas", "privadas", "internas", "apuntes"],
  },
  {
    id: "rc-37",
    section: "recetas",
    question: "¿Puedo reutilizar la misma receta en varios pacientes?",
    answer:
      "Sí, sin ningún límite. Una receta creada una sola vez puede usarse en los planes de todos los pacientes que quieras, ahora y en el futuro. Los cambios que hagas después a la receta no afectan retroactivamente a los planes ya entregados, solo a los nuevos usos. Esta reutilización es el principal motivo por el que merece la pena cuidar el catálogo: cada receta bien hecha te ahorra horas de trabajo a medio plazo.",
    related: ["rc-29", "rc-38", "rc-54"],
    keywords: ["reutilizar", "múltiples", "pacientes", "biblioteca"],
  },
  {
    id: "rc-38",
    section: "recetas",
    question: "¿Cómo se gestionan las alergias y las recetas?",
    answer:
      "Annonia no detecta automáticamente alergias cruzadas entre una receta y las alergias declaradas del paciente. La responsabilidad sigue siendo tuya: revisa los ingredientes de la receta antes de asignarla, apoyándote en los tags (`sin gluten`, `sin frutos secos`, etc.) y en las restricciones anotadas en la ficha del paciente. Puedes crear tags propios de alergias comunes para filtrar el catálogo fácilmente en esos casos.",
    related: ["rc-13", "rc-39", "rc-52"],
    keywords: ["alergias", "restricciones", "detección", "seguridad"],
  },
  {
    id: "rc-39",
    section: "recetas",
    question: "¿Hay tags específicos para dietas vegana o vegetariana?",
    answer:
      "Sí, puedes usar tags como `vegano`, `vegetariano`, `pescetariano` u otros que encajen con tu práctica. Asignarlos a cada receta adecuada permite filtrar el catálogo en segundos cuando trabajas con pacientes que siguen esas pautas. Como los tags son libres, procura usar siempre la misma grafía (sin acentos divergentes, singular/plural consistente) para que el filtrado sea limpio.",
    related: ["rc-13", "rc-26", "rc-38"],
    keywords: ["vegano", "vegetariano", "tag", "dieta"],
  },
  {
    id: "rc-40",
    section: "recetas",
    question: "¿Las recetas están en castellano?",
    answer:
      "Sí, toda la interfaz y las recetas del catálogo global están en castellano con tildes y vocabulario gastronómico de España. Tus recetas propias puedes escribirlas en el idioma que prefieras, pero te recomendamos mantener castellano para que la experiencia del paciente sea coherente. Por ahora no hay traducción automática a otros idiomas. Si trabajas con pacientes bilingües, puedes duplicar recetas y traducirlas manualmente.",
    related: ["rc-1", "rc-41", "rc-46"],
    keywords: ["idioma", "castellano", "español", "traducción"],
  },
  {
    id: "rc-41",
    section: "recetas",
    question: "¿Puedo sugerir una receta según un objetivo?",
    answer:
      "Desde el editor de dietas, al añadir una receta a una comida, el buscador puede priorizar opciones compatibles con los objetivos del paciente (por ejemplo recetas altas en proteína si ese es el objetivo). No hay un asistente de sugerencia automática en la sección `/recetas`, pero sí puedes filtrar por categoría, tiempo y tags para estrechar la búsqueda. Combinado con el criterio profesional, el filtrado cubre la mayoría de los casos.",
    related: ["rc-29", "rc-42", "rc-54"],
    keywords: ["sugerir", "objetivo", "recomendación", "proteína"],
  },
  {
    id: "rc-42",
    section: "recetas",
    question: "¿La IA puede generar recetas?",
    answer:
      "En esta versión, la IA puede ayudarte a generar planes completos y proponer combinaciones, pero la creación automática de recetas nuevas con foto es limitada. Si usas el módulo de dieta IA, puede sugerir nombres y estructuras de comidas basándose en recetas existentes de tu catálogo. Para recetas totalmente nuevas sigue siendo más fiable redactarlas tú y confirmar los macros mediante los ingredientes. Próximamente habrá más integración.",
    related: ["rc-41", "rc-43", "rc-46"],
    keywords: ["IA", "inteligencia artificial", "generar", "automática"],
  },
  {
    id: "rc-43",
    section: "recetas",
    question: "¿Puedo añadir una foto desde el móvil?",
    answer:
      "Sí. Si abres Annonia en el navegador del móvil y creas o editas una receta, al pulsar el botón de subida de foto te ofrece la opción de usar la cámara del dispositivo o elegir una imagen de la galería. Esto es muy práctico cuando tienes la preparación delante. La foto se sube al instante, con una leve compresión para optimizar el tamaño, y se muestra en la card de la receta.",
    related: ["rc-14", "rc-44", "rc-45"],
    keywords: ["foto", "móvil", "cámara", "galería"],
  },
  {
    id: "rc-44",
    section: "recetas",
    question: "¿Annonia comprime las fotos de receta?",
    answer:
      "Sí. Al subir una imagen, el sistema aplica una compresión automática para reducir su tamaño sin que se aprecie pérdida visible de calidad. El objetivo es que el catálogo cargue rápido aunque tengas cientos de recetas. No necesitas preparar las fotos previamente: sube el archivo original y la app se encarga de optimizarlo. En cualquier caso, si la imagen inicial ya es pesada, puede tardar unos segundos más en procesarse.",
    related: ["rc-14", "rc-43", "rc-45"],
    keywords: ["compresión", "optimización", "imagen", "peso"],
  },
  {
    id: "rc-45",
    section: "recetas",
    question: "¿Hay un tamaño máximo para las fotos?",
    answer:
      "Sí. Las fotos de receta aceptan un máximo aproximado de 5 MB por archivo, valor más que suficiente para fotos hechas con cualquier móvil moderno. Si intentas subir una imagen mayor, el sistema te avisa y no completa la subida. Si te pasa, reduce la resolución o recorta la foto antes de subirla, o hazla directamente desde el navegador móvil para que la compresión sea automática.",
    related: ["rc-44", "rc-43", "rc-47"],
    keywords: ["tamaño", "máximo", "peso", "límite"],
  },
  {
    id: "rc-46",
    section: "recetas",
    question: "¿Puedo exportar una receta?",
    answer:
      "Sí, desde la ficha de la receta puedes exportarla a PDF con su foto, datos, ingredientes y pasos. Es útil para entregar al paciente una preparación concreta o para archivar tus recetas fuera de la plataforma. El PDF mantiene un diseño limpio y se descarga al instante. Si quieres una versión impresa, exporta a PDF y usa la función de impresión del sistema. La exportación a otros formatos no está disponible por el momento.",
    related: ["rc-47", "rc-48", "rc-19"],
    keywords: ["exportar", "pdf", "descargar", "archivar"],
  },
  {
    id: "rc-47",
    section: "recetas",
    question: "¿Puedo imprimir una receta?",
    answer:
      "Sí. La forma recomendada es exportar la receta a PDF y lanzar la impresión desde tu lector habitual. Así controlas el tamaño del papel, la orientación y los márgenes. Alternativamente, algunos navegadores permiten imprimir directamente la ficha de la receta con `Ctrl+P` (o `Cmd+P` en Mac), aunque el resultado visual puede variar según el navegador. Para entregas en consulta, el PDF suele dar mejor acabado.",
    related: ["rc-46", "rc-48", "rc-14"],
    keywords: ["imprimir", "papel", "pdf", "impresión"],
  },
  {
    id: "rc-48",
    section: "recetas",
    question: "¿Puedo compartir una receta directamente con un paciente?",
    answer:
      "No hay un botón directo de `Compartir receta` independiente. La vía oficial para entregar una receta a un paciente es incluirla en su plan de alimentación, desde donde la verá en su portal. Si quieres enviarla suelta, puedes exportarla a PDF y mandársela por el chat interno de mensajes o por un correo externo. Esta decisión protege tu catálogo y evita enlaces públicos sin control.",
    related: ["rc-46", "rc-49", "rc-29"],
    keywords: ["compartir", "enviar", "paciente", "chat"],
  },
  {
    id: "rc-49",
    section: "recetas",
    question: "¿Cuál es la licencia de las recetas globales?",
    answer:
      "Las recetas globales son propiedad de Annonia y se ofrecen bajo una licencia interna que permite su uso dentro de la plataforma para tus pacientes. No están pensadas para publicarlas en un libro, un blog abierto o redes sociales con tu marca, porque en ese caso habría que revisar términos específicos. Tus recetas propias son íntegramente tuyas y puedes usarlas donde quieras, incluso fuera de la app.",
    related: ["rc-50", "rc-35", "rc-3"],
    keywords: ["licencia", "propiedad", "derechos", "uso"],
  },
  {
    id: "rc-50",
    section: "recetas",
    question: "¿Se citan las fuentes de las recetas globales?",
    answer:
      "El catálogo global combina recetas desarrolladas internamente por el equipo de Annonia y adaptaciones de preparaciones clásicas de cocina mediterránea, sin fuente atribuible concreta. Cuando una receta se inspira claramente en una obra protegida, el equipo la reescribe lo suficiente como para considerarla original. Si tienes dudas sobre la procedencia de una receta concreta, puedes preguntar a soporte y se te informará de su origen.",
    related: ["rc-49", "rc-3", "rc-35"],
    keywords: ["fuentes", "atribución", "origen", "referencias"],
  },
  {
    id: "rc-51",
    section: "recetas",
    question: "¿Puedo crear una receta partiendo solo de ingredientes sueltos?",
    answer:
      "Sí, es el flujo habitual. En el formulario de nueva receta empiezas añadiendo ingredientes del buscador y ajustando cantidades, y a continuación escribes las instrucciones. No hace falta tener los pasos antes de definir los ingredientes; puedes ir completando el formulario en el orden que prefieras y guardar al final. Mientras al menos tengas nombre, un ingrediente y porciones, la receta es válida.",
    related: ["rc-5", "rc-7", "rc-9"],
    keywords: ["ingredientes", "sueltos", "crear", "desde cero"],
  },
  {
    id: "rc-52",
    section: "recetas",
    question: "¿Puedo incluir una receta dentro de otra receta?",
    answer:
      "No. En la versión actual una receta solo puede contener alimentos individuales, no otras recetas anidadas. Si necesitas reutilizar, por ejemplo, una salsa que aparece en varios platos, crea esa salsa como receta independiente y en la receta final añade los ingredientes de la salsa por separado. Es una limitación conocida; si se incorpora soporte de recetas anidadas en el futuro, se anunciará.",
    related: ["rc-4", "rc-34", "rc-51"],
    keywords: ["anidar", "receta dentro", "composición", "limitación"],
  },
  {
    id: "rc-53",
    section: "recetas",
    question: "¿Qué ocurre si elimino un alimento que se usa en una receta?",
    answer:
      "El sistema no borra en cascada las recetas; la receta se mantiene, pero aparece una advertencia indicando que uno de sus ingredientes ya no existe en la base de datos. Tendrás que editarla para sustituir o eliminar ese ingrediente y recuperar el cálculo correcto de macros. Por eso, antes de borrar un alimento, conviene revisar en qué recetas está usado. Algunos alimentos muy usados no permiten ser eliminados por seguridad.",
    related: ["rc-34", "rc-7", "rc-18"],
    keywords: ["eliminar", "cascada", "ingrediente", "advertencia"],
  },
  {
    id: "rc-54",
    section: "recetas",
    question: "¿Puedo marcar ingredientes como opcionales?",
    answer:
      "No. En la versión actual todos los ingredientes de una receta se consideran obligatorios y se incluyen en el cálculo de macros. Si quieres una variante sin un ingrediente concreto, lo más limpio es duplicar la receta y eliminarlo en la copia. Así tienes dos recetas diferenciadas, cada una con sus macros coherentes. Marcar opciones dentro de la misma receta distorsionaría el cálculo nutricional.",
    related: ["rc-19", "rc-7", "rc-15"],
    keywords: ["opcionales", "ingredientes", "variante", "alternativa"],
  },
  {
    id: "rc-55",
    section: "recetas",
    question: "¿Puedo subir GIF animados como foto de receta?",
    answer:
      "Oficialmente se recomienda usar imágenes estáticas (JPG o PNG) como foto de receta. Los GIF pueden subirse en algunos casos, pero no está garantizado que se muestren animados en todas las pantallas y suelen ser pesados. Para transmitir proceso, es preferible dividir los pasos en las instrucciones y acompañar con una sola foto final apetecible. Si el soporte de GIF se amplía en el futuro, se indicará en las notas de versión.",
    related: ["rc-14", "rc-44", "rc-45"],
    keywords: ["gif", "animado", "formato", "imagen"],
  },
  {
    id: "rc-56",
    section: "recetas",
    question: "¿Qué formatos de imagen acepta la foto de receta?",
    answer:
      "Los formatos admitidos son JPG, JPEG, PNG y WEBP. Son los habituales de cámaras de móvil y descargas de internet, así que en la práctica no deberías encontrar problemas. Si tu imagen está en HEIC (iPhone) o en un formato menos común, conviértela primero a JPG o PNG antes de subirla. Si subes un formato no soportado, el sistema lo rechaza con un mensaje de error claro.",
    related: ["rc-14", "rc-44", "rc-45"],
    keywords: ["formato", "jpg", "png", "webp"],
  },
  {
    id: "rc-57",
    section: "recetas",
    question: "¿Puedo escribir instrucciones largas?",
    answer:
      "Sí, cada paso y el conjunto total de instrucciones admiten texto extenso. Aun así, es más útil para el paciente que cada paso sea corto y concreto (una o dos frases) y que la receta tenga varios pasos, en lugar de un único párrafo muy largo. Si necesitas matizar algo, usa un paso adicional para la advertencia o truco. El editor no tiene un límite práctico que vayas a alcanzar en una receta normal.",
    related: ["rc-9", "rc-58", "rc-68"],
    keywords: ["instrucciones", "largas", "texto", "redacción"],
  },
  {
    id: "rc-58",
    section: "recetas",
    question: "¿Qué formato admiten las instrucciones?",
    answer:
      "Las instrucciones se escriben como texto plano por paso, sin negritas, cursivas ni listas anidadas. El estilo visual (numeración, separación entre pasos) se aplica automáticamente al renderizar. Esta decisión mantiene la receta legible en todos los formatos (app, PDF, impresión) y evita estilos rotos. Si necesitas destacar algo, hazlo con lenguaje claro (\"Importante: precalentar el horno...\") en lugar de con formato.",
    related: ["rc-9", "rc-57", "rc-59"],
    keywords: ["formato", "instrucciones", "texto", "plano"],
  },
  {
    id: "rc-59",
    section: "recetas",
    question: "¿La numeración de pasos es automática?",
    answer:
      "Sí. Cada paso que añades recibe automáticamente el número siguiente al anterior. Si reordenas los pasos o eliminas alguno, la numeración se recalcula sin que tengas que hacer nada. Así evitas errores tipo \"paso 3\" dos veces o un paso 5 sin paso 4. Esta renumeración se aplica tanto en el editor como en el renderizado final de la receta.",
    related: ["rc-9", "rc-57", "rc-58"],
    keywords: ["numeración", "automática", "pasos", "orden"],
  },
  {
    id: "rc-60",
    section: "recetas",
    question: "¿Puedo reordenar los pasos de una receta?",
    answer:
      "Sí. En el editor, cada paso tiene controles para subir o bajar su posición, o puedes arrastrarlos si la interfaz soporta drag-and-drop en tu dispositivo. La numeración se actualiza automáticamente tras cada cambio. Reordenar pasos es útil cuando caes en cuenta de que un paso tiene que ir antes que otro, o cuando redactas primero todos los pasos y luego afinas el orden.",
    related: ["rc-9", "rc-59", "rc-58"],
    keywords: ["reordenar", "pasos", "arrastrar", "orden"],
  },
  {
    id: "rc-61",
    section: "recetas",
    question: "¿Cómo elimino un paso dentro del editor?",
    answer:
      "Cada paso muestra un icono de papelera a su derecha. Al pulsarlo, el paso se elimina y la numeración del resto se recalcula automáticamente. La acción es inmediata: no hay ventana de confirmación específica para pasos, porque el cambio solo se guarda cuando pulsas `Guardar` en toda la receta. Si te arrepientes antes de guardar, basta con volver a escribir el paso o cancelar el formulario.",
    related: ["rc-9", "rc-60", "rc-17"],
    keywords: ["eliminar", "paso", "papelera", "borrar"],
  },
  {
    id: "rc-62",
    section: "recetas",
    question: "¿Cómo cambio la cantidad de un ingrediente?",
    answer:
      "En el editor, cada ingrediente muestra un campo numérico con su cantidad. Haz clic sobre él, escribe el nuevo valor y los macros totales y por porción de la receta se recalculan al instante en la previsualización. Recuerda pulsar `Guardar` al final para que el cambio quede registrado. Si quieres sustituir el alimento por otro, elimina el ingrediente y añade uno nuevo en su lugar.",
    related: ["rc-7", "rc-15", "rc-17"],
    keywords: ["cantidad", "modificar", "gramos", "ingrediente"],
  },
  {
    id: "rc-63",
    section: "recetas",
    question: "¿Puedo ver los macros detallados de cada ingrediente?",
    answer:
      "Sí. En la ficha de receta, al desplegar el apartado de ingredientes, cada línea muestra las calorías y macros que aporta ese alimento con la cantidad indicada. Esta vista detallada es útil para entender qué ingrediente dispara un macro concreto y, si procede, reajustar cantidades o sustituirlo. La suma total y el valor por porción aparecen siempre destacados arriba.",
    related: ["rc-15", "rc-16", "rc-22"],
    keywords: ["macros", "detalle", "ingrediente", "desglose"],
  },
  {
    id: "rc-64",
    section: "recetas",
    question: "¿Cómo gestiono las recetas más usadas?",
    answer:
      "El sistema lleva un contador interno del número de veces que una receta aparece en planes de pacientes. En el selector de orden del listado hay una opción `más usadas` que prioriza las que más frecuentemente incluyes. También puedes marcar tus habituales como favoritas para acceder aún más rápido. Entre ambas herramientas, tu día a día de planificación se acelera notablemente.",
    related: ["rc-20", "rc-21", "rc-28"],
    keywords: ["usadas", "popularidad", "frecuencia", "orden"],
  },
  {
    id: "rc-65",
    section: "recetas",
    question: "¿Cuántas recetas puedo crear?",
    answer:
      "No hay un límite práctico de recetas propias por cuenta. Puedes crear cientos de recetas sin afectar al rendimiento, aunque a partir de volúmenes muy grandes te será más cómodo trabajar con filtros y tags bien organizados. Si alguna vez se introdujera un límite por plan de suscripción, se notificaría con antelación. En el día a día, el foco no debe estar en la cantidad sino en la calidad y la reutilización.",
    related: ["rc-37", "rc-13", "rc-28"],
    keywords: ["cuántas", "límite", "cantidad", "máximo"],
  },
  {
    id: "rc-66",
    section: "recetas",
    question: "¿Qué buenas prácticas hay para redactar instrucciones?",
    answer:
      "Usa verbos en imperativo (`cortar`, `mezclar`, `hornear`) al inicio de cada paso. Limita cada paso a una acción principal y sé específico con tiempos y temperaturas. Evita lenguaje técnico sin explicar (`blanquear` vs `escaldar un minuto en agua hirviendo`). Y ordénalos cronológicamente sin saltos. Siguiendo estas pautas, tus recetas serán claras, reproducibles y dignas de aparecer en cualquier plan del paciente.",
    related: ["rc-9", "rc-57", "rc-58"],
    keywords: ["buenas prácticas", "redacción", "claridad", "estilo"],
  },
  {
    id: "rc-67",
    section: "recetas",
    question: "¿Qué ocurre si cambio los ingredientes de una receta ya usada en planes?",
    answer:
      "Los planes ya entregados se mantienen con la versión de la receta que tenían en el momento de asignarla; no se actualizan retroactivamente. Los planes nuevos que incluyan esa receta usarán la versión actualizada. Esta separación evita sorpresas para pacientes que ya estaban siguiendo un plan. Si quieres que un paciente concreto estrene la nueva versión, basta con volver a incluir la receta en un nuevo plan suyo.",
    related: ["rc-17", "rc-37", "rc-29"],
    keywords: ["modificar", "planes", "retroactivo", "histórico"],
  },
  {
    id: "rc-68",
    section: "recetas",
    question: "¿Puedo guardar una receta a medio hacer como borrador?",
    answer:
      "Si guardas una receta con los campos mínimos (nombre, al menos un ingrediente y porciones) queda publicada en tu catálogo, aunque le falten instrucciones o foto. Puedes volver a editarla en cualquier momento para completarla. No existe un estado de `borrador` formal aparte del hecho de que tú mismo sepas que está incompleta. Una buena práctica es marcarla con un tag propio como `borrador` mientras la terminas.",
    related: ["rc-5", "rc-17", "rc-13"],
    keywords: ["borrador", "incompleta", "guardar", "medio"],
  },
  {
    id: "rc-69",
    section: "recetas",
    question: "¿La descripción de la receta es obligatoria?",
    answer:
      "No, la descripción es opcional. Aun así, una descripción breve (una o dos frases) ayuda mucho a decidir si la receta encaja sin tener que abrir la ficha completa, y se muestra en la vista previa cuando exportas o insertas la receta en un plan. Úsala para resumir el tipo de plato, ingredientes estrella o a qué perfil de paciente encaja especialmente bien. Unas pocas palabras marcan una gran diferencia.",
    related: ["rc-4", "rc-6", "rc-22"],
    keywords: ["descripción", "opcional", "resumen", "previa"],
  },
  {
    id: "rc-70",
    section: "recetas",
    question: "¿Qué criterios uso para decidir si una receta es fácil, media o difícil?",
    answer:
      "Considera el nivel técnico, el tiempo activo y la atención requerida. Fácil: técnicas básicas (hervir, saltear, mezclar), tiempo activo inferior a quince minutos, sin puntos críticos. Media: varias técnicas encadenadas, tiempos entre 15 y 45 minutos de trabajo activo, algún paso que requiere atención (no quemar una salsa, controlar punto del arroz). Difícil: técnicas avanzadas (reducciones largas, masas, cocciones de precisión), tiempos activos extensos o pasos que no admiten error. Ante la duda, sube un nivel: es preferible que al paciente le sorprenda lo fácil que fue antes de que se agobie con un plato que esperaba sencillo.",
    related: ["rc-11", "rc-24", "rc-66"],
    keywords: ["criterios", "dificultad", "decidir", "nivel"],
  },
];
