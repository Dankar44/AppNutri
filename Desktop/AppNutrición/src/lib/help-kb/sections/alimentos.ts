import type { HelpEntry } from "../types";

export const ALIMENTOS_ENTRIES: HelpEntry[] = [
  {
    id: "al-1",
    section: "alimentos",
    question: "¿Qué es la sección de alimentos de AppNutrición?",
    answer:
      "La sección `/alimentos` es tu base de datos nutricional personal dentro de AppNutrición. Aquí se almacenan todos los alimentos que usarás después para construir planes de alimentación en `/dietas` y recetas en `/recetas`. Cada alimento guarda su información nutricional completa: macronutrientes, fibra y hasta 24 micronutrientes opcionales. Funciona como un catálogo mixto entre alimentos globales disponibles para todos los dietistas y alimentos propios que tú creas o importas.",
    related: ["al-2", "al-3", "al-7"],
    keywords: ["alimentos", "base de datos", "sección", "nutricional"],
  },
  {
    id: "al-2",
    section: "alimentos",
    question: "¿Cómo accedo al listado de alimentos?",
    answer:
      "Pulsa el icono de `Apple` o `Carrot` en el sidebar izquierdo o navega directamente a la ruta `/alimentos`. Se abre una tabla con todos los alimentos disponibles para tu cuenta: los globales de AppNutrición y los que tú hayas creado o importado. En la parte superior tienes el buscador, los filtros por categoría y el botón para crear uno nuevo. Por defecto se ordenan alfabéticamente, pero puedes cambiar el orden.",
    related: ["al-1", "al-4", "al-5"],
    keywords: ["acceso", "listado", "navegación", "sidebar"],
  },
  {
    id: "al-3",
    section: "alimentos",
    question: "¿Qué diferencia hay entre un alimento global y uno propio?",
    answer:
      "Los alimentos globales forman parte de la base de datos común de AppNutrición y están disponibles para todos los dietistas de la plataforma. Los alimentos propios los has creado o importado tú y solo tú los ves en tu cuenta. Los globales se identifican con una etiqueta o icono distintivo en el listado. No puedes editar ni eliminar los globales, pero sí puedes duplicarlos para crear una versión propia con ajustes personalizados.",
    related: ["al-1", "al-22", "al-24"],
    keywords: ["global", "propio", "diferencia", "privado"],
  },
  {
    id: "al-4",
    section: "alimentos",
    question: "¿Cómo busco un alimento en el listado?",
    answer:
      "Usa el campo de búsqueda situado en la parte superior de la pantalla. Escribe parte del nombre, por ejemplo \"pollo\" o \"manzana\", y el listado se filtra en tiempo real mostrando solo los que coinciden. La búsqueda es insensible a mayúsculas y acentos, así que \"platano\" y \"plátano\" devuelven lo mismo. También puedes buscar por marca comercial si la incluiste en el nombre.",
    related: ["al-2", "al-5", "al-39"],
    keywords: ["buscar", "buscador", "filtrar", "nombre"],
  },
  {
    id: "al-5",
    section: "alimentos",
    question: "¿Qué categorías puedo filtrar?",
    answer:
      "El filtro de categoría agrupa los alimentos en familias como frutas, verduras, carnes, pescados, lácteos, cereales, legumbres, frutos secos, aceites y grasas, bebidas, huevos, procesados, dulces y preparados. Al seleccionar una categoría, el listado se reduce solo a esa familia. Puedes combinar el filtro con el buscador para afinar todavía más. Si tu alimento no encaja en ninguna, puedes dejarlo sin categoría o asignar la más cercana.",
    related: ["al-4", "al-41", "al-47"],
    keywords: ["categorías", "filtros", "familias", "agrupar"],
  },
  {
    id: "al-6",
    section: "alimentos",
    question: "¿Puedo ordenar el listado por calorías o proteínas?",
    answer:
      "Sí. Las cabeceras de la tabla son ordenables. Haciendo clic sobre \"Calorías\", \"Proteínas\", \"Carbohidratos\" o \"Grasas\" ordenas ascendente o descendente por ese valor. Es útil para localizar rápidamente alimentos altos en proteína o bajos en calorías cuando estás preparando un plan específico. También puedes ordenar por nombre o por fecha de creación para ver los últimos que añadiste.",
    related: ["al-2", "al-4", "al-5"],
    keywords: ["ordenar", "sort", "calorías", "proteínas"],
  },
  {
    id: "al-7",
    section: "alimentos",
    question: "¿Cómo creo un nuevo alimento?",
    answer:
      "Pulsa el botón \"Nuevo alimento\" en la parte superior derecha del listado. Se abre un formulario con los campos básicos: nombre, categoría, unidad base y los macros principales (calorías, proteínas, hidratos, grasas). Rellena al menos los obligatorios y pulsa \"Guardar\". El alimento queda registrado como propio de tu cuenta y ya está disponible para usarlo en dietas y recetas. Si quieres, después puedes editarlo para añadir micronutrientes.",
    related: ["al-8", "al-9", "al-12"],
    keywords: ["crear", "nuevo", "alta", "alimento"],
  },
  {
    id: "al-8",
    section: "alimentos",
    question: "¿Qué campos son obligatorios al crear un alimento?",
    answer:
      "Los campos obligatorios son el nombre del alimento y los cuatro macros principales: calorías (kcal), proteínas (g), carbohidratos (g) y grasas (g), todos referidos a la unidad base (normalmente 100 g). Sin estos datos no puedes guardar porque el plan no podría calcular totales. El resto (fibra, micros, categoría, marca) son opcionales. Si intentas guardar con algún obligatorio vacío, el formulario te marcará los errores en rojo.",
    related: ["al-7", "al-9", "al-58"],
    keywords: ["obligatorio", "requerido", "campos", "validación"],
  },
  {
    id: "al-9",
    section: "alimentos",
    question: "¿Qué campos son opcionales?",
    answer:
      "Son opcionales la fibra, la categoría, la marca comercial y los 24 micronutrientes (vitaminas y minerales). También son opcionales las notas internas y las porciones estándar si las usas. Puedes crear un alimento solo con macros y añadir los micros más adelante cuando tengas los datos. Dejar un campo vacío no lo guarda como 0, sino como `null`, lo que es importante para distinguir \"no medido\" de \"sin contenido\".",
    related: ["al-8", "al-11", "al-60"],
    keywords: ["opcional", "micros", "fibra", "no obligatorio"],
  },
  {
    id: "al-10",
    section: "alimentos",
    question: "¿Cuál es la unidad base de un alimento?",
    answer:
      "La unidad base es la referencia sobre la que se expresan los valores nutricionales, y por convención en AppNutrición son 100 g para alimentos sólidos y 100 ml para líquidos. Así, las calorías, proteínas, etc., se guardan por cada 100 g de producto. Luego, al incluirlo en un plan o una receta, el sistema escala los valores según la cantidad que indiques. Esta convención facilita comparar alimentos entre sí.",
    related: ["al-35", "al-36", "al-37"],
    keywords: ["unidad", "base", "100g", "referencia"],
  },
  {
    id: "al-11",
    section: "alimentos",
    question: "¿Cómo añado los micronutrientes a un alimento?",
    answer:
      "En el formulario de alta o edición de un alimento, despliega la sección \"Micronutrientes\" o \"Vitaminas y minerales\". Se muestran los 24 campos en dos grupos: vitaminas y minerales. Rellena solo los que conozcas y deja el resto vacíos. Las unidades estándar son mg, µg o UI según el micro, y se indican junto al campo. Guarda los cambios y tu alimento queda con el perfil nutricional completo.",
    related: ["al-9", "al-12", "al-60"],
    keywords: ["micros", "vitaminas", "minerales", "añadir"],
  },
  {
    id: "al-12",
    section: "alimentos",
    question: "¿Cuáles son los 24 micronutrientes que registra AppNutrición?",
    answer:
      "Las 11 vitaminas: vitamina A, B6, B12, C, D, E, K, tiamina (B1), riboflavina (B2), niacina (B3), folato (B9), ácido pantoténico (B5) y colina. Los minerales: calcio, hierro, magnesio, fósforo, potasio, sodio, cinc, cobre, manganeso, selenio y flúor. En total 24 micros que cubren las recomendaciones más habituales. No todos los alimentos los tienen cargados: solo los más completos o los importados desde fuentes con datos detallados.",
    related: ["al-11", "al-60", "al-61"],
    keywords: ["micros", "24", "vitaminas", "minerales"],
  },
  {
    id: "al-13",
    section: "alimentos",
    question: "¿Puedo copiar los nutrientes desde un alimento similar?",
    answer:
      "Sí. En el formulario de creación hay una opción \"Copiar desde otro alimento\" que te permite elegir uno existente (global o propio) y precargar todos sus valores. Así, si quieres crear una variante con pequeñas modificaciones, no tienes que volver a teclearlo todo. Por ejemplo, puedes partir del \"Arroz blanco cocido\" para crear \"Arroz integral cocido\" y cambiar solo los campos distintos. Luego guarda como nuevo alimento propio.",
    related: ["al-7", "al-14", "al-54"],
    keywords: ["copiar", "duplicar", "similar", "plantilla"],
  },
  {
    id: "al-14",
    section: "alimentos",
    question: "¿Cómo importo un alimento desde Open Food Facts?",
    answer:
      "En el botón \"Nuevo alimento\" despliega la opción \"Importar de Open Food Facts\". Puedes escanear o introducir un código de barras (EAN), o bien buscar el producto por nombre. AppNutrición consulta la API pública de Open Food Facts y precarga los datos disponibles (nombre, macros, marca y a veces micros). Revisa y ajusta antes de guardar, porque la calidad de los datos puede variar según el producto.",
    related: ["al-15", "al-16", "al-38"],
    keywords: ["open food facts", "importar", "código de barras", "ean"],
  },
  {
    id: "al-15",
    section: "alimentos",
    question: "¿Cómo escaneo un código de barras?",
    answer:
      "En el formulario de importación de Open Food Facts encontrarás un campo para el código EAN. Puedes escribirlo manualmente si lo tienes, pegarlo desde otra aplicación o, si usas AppNutrición desde el móvil, activar la cámara para escanearlo directamente. Una vez reconocido, el sistema consulta la base de datos y rellena los campos del alimento. Si el producto no existe en Open Food Facts, recibirás un aviso.",
    related: ["al-14", "al-16", "al-38"],
    keywords: ["código de barras", "ean", "escanear", "cámara"],
  },
  {
    id: "al-16",
    section: "alimentos",
    question: "¿Puedo buscar en Open Food Facts por nombre en vez de código?",
    answer:
      "Sí. Si no tienes el código de barras, puedes escribir el nombre del producto en el buscador de importación y AppNutrición hace una consulta textual a Open Food Facts. Se muestran resultados con miniaturas y marcas. Elige el que mejor coincida y pulsa \"Importar\". Recuerda que los resultados por nombre son menos precisos que por código de barras, así que comprueba siempre los datos antes de guardar.",
    related: ["al-14", "al-15", "al-62"],
    keywords: ["buscar", "nombre", "open food facts", "texto"],
  },
  {
    id: "al-17",
    section: "alimentos",
    question: "¿AppNutrición se integra con BEDCA?",
    answer:
      "La base de datos española BEDCA (Base Española de Datos de Composición de Alimentos) está parcialmente integrada en AppNutrición. Muchos alimentos globales provienen de BEDCA y los reconocerás por su denominación oficial. No obstante, el importador directo desde BEDCA está limitado a lo que ya existe en la base global. Para alimentos muy específicos de la cocina española, BEDCA es la referencia más fiable de las disponibles.",
    related: ["al-14", "al-62", "al-63"],
    keywords: ["bedca", "españa", "fuente", "datos"],
  },
  {
    id: "al-18",
    section: "alimentos",
    question: "¿Cómo edito un alimento existente?",
    answer:
      "Pulsa sobre la fila del alimento en el listado o abre su menú de acciones y elige \"Editar\". Solo puedes editar alimentos propios; los globales están bloqueados para preservar la integridad de la base de datos. Se abre el mismo formulario que al crear, con todos los campos prerellenados. Haz los cambios y pulsa \"Guardar\". Los cambios se propagan a todas las dietas y recetas que usen ese alimento.",
    related: ["al-19", "al-20", "al-23"],
    keywords: ["editar", "modificar", "actualizar", "cambiar"],
  },
  {
    id: "al-19",
    section: "alimentos",
    question: "¿Qué pasa con las dietas si edito un alimento ya usado?",
    answer:
      "Si editas un alimento que ya forma parte de dietas o recetas, los cambios se reflejan de inmediato en todas ellas. Las calorías y macros totales de esos planes se recalculan automáticamente al abrirlos. Es útil si corriges un dato erróneo, pero ten cuidado con cambios drásticos porque pueden alterar planes ya entregados a pacientes. Si quieres conservar los valores originales en planes antiguos, crea un alimento nuevo en vez de editar.",
    related: ["al-18", "al-20", "al-23"],
    keywords: ["editar", "impacto", "dietas", "planes"],
  },
  {
    id: "al-20",
    section: "alimentos",
    question: "¿Puedo eliminar un alimento?",
    answer:
      "Solo puedes eliminar los alimentos propios de tu cuenta. Los globales no se pueden borrar porque se comparten con toda la comunidad de dietistas. En el listado, abre el menú de acciones de un alimento propio y elige \"Eliminar\". Se pedirá confirmación. Si el alimento está siendo usado en alguna dieta o receta, recibirás un aviso antes de borrar y podrás decidir cómo proceder.",
    related: ["al-18", "al-21", "al-23"],
    keywords: ["eliminar", "borrar", "quitar", "propio"],
  },
  {
    id: "al-21",
    section: "alimentos",
    question: "¿Qué pasa si borro un alimento que está en una dieta?",
    answer:
      "Si el alimento está siendo usado en dietas o recetas, AppNutrición te avisa antes de borrar y te muestra cuántos planes lo contienen. Si confirmas el borrado, el alimento desaparece del listado y queda como referencia \"huérfana\" en esas dietas, normalmente marcada como \"Alimento no disponible\". Para evitar problemas, lo recomendable es no eliminar alimentos activos y, si es necesario, reemplazarlos primero en las dietas afectadas.",
    related: ["al-20", "al-19", "al-23"],
    keywords: ["borrar", "dieta", "huérfano", "referencia"],
  },
  {
    id: "al-22",
    section: "alimentos",
    question: "¿Puedo borrar un alimento global?",
    answer:
      "No. Los alimentos globales de AppNutrición no se pueden borrar ni editar desde tu cuenta. Están protegidos para garantizar que otros dietistas sigan teniendo acceso a los mismos datos. Si encuentras un error en un global, lo ideal es crear una copia propia corregida. Si crees que el error es grave y afecta a muchos, puedes reportarlo por el canal de soporte para que el equipo de AppNutrición revise el dato.",
    related: ["al-3", "al-20", "al-52"],
    keywords: ["global", "borrar", "bloqueado", "protegido"],
  },
  {
    id: "al-23",
    section: "alimentos",
    question: "¿Cómo sé en qué dietas se usa un alimento?",
    answer:
      "Abre la ficha del alimento y busca la sección \"Uso\" o \"Referencias\". Allí se listan las dietas y recetas donde aparece. Es especialmente útil antes de editar o eliminar, para valorar el impacto del cambio. Si la sección no está disponible en tu vista, pulsa \"Ver dónde se usa\" en el menú de acciones. Esta información te ayuda a tomar decisiones informadas sobre el mantenimiento de tu base de datos.",
    related: ["al-19", "al-21", "al-18"],
    keywords: ["uso", "referencias", "dónde", "impacto"],
  },
  {
    id: "al-24",
    section: "alimentos",
    question: "¿Cómo distingo visualmente un alimento global de uno propio?",
    answer:
      "En el listado, los alimentos globales suelen mostrar un icono o etiqueta distintiva, habitualmente un planeta o un pequeño \"G\" azul, mientras que los propios no llevan marca o llevan una \"P\" o tu avatar. Además, al pasar el ratón sobre el nombre aparece un tooltip indicando el origen. Es una pista rápida para saber si puedes editar el alimento o no sin abrir su ficha.",
    related: ["al-3", "al-18", "al-22"],
    keywords: ["distinguir", "icono", "etiqueta", "visual"],
  },
  {
    id: "al-25",
    section: "alimentos",
    question: "¿Qué unidades se pueden usar para medir un alimento?",
    answer:
      "Las unidades admitidas son gramos (g) para sólidos, mililitros (ml) para líquidos y unidades (ud) para piezas. En el formulario eliges la unidad base al crear el alimento. Luego, al incluirlo en una dieta, puedes cambiar la cantidad en la unidad que tenga sentido (por ejemplo, 60 g de pan o 1 huevo). Si defines una porción estándar, AppNutrición puede convertir automáticamente entre gramos y unidades.",
    related: ["al-26", "al-27", "al-10"],
    keywords: ["unidades", "gramos", "mililitros", "piezas"],
  },
  {
    id: "al-26",
    section: "alimentos",
    question: "¿Qué es la porción estándar de un alimento?",
    answer:
      "La porción estándar es una cantidad de referencia que representa una ración típica del alimento, por ejemplo 1 huevo = 60 g o 1 rebanada de pan = 30 g. Cuando la defines, al añadir el alimento a una dieta puedes escribir \"1 ud\" y el sistema calcula los macros equivalentes. Es muy útil para alimentos que naturalmente se consumen en piezas y simplifica la redacción de planes para los pacientes.",
    related: ["al-25", "al-27", "al-36"],
    keywords: ["porción", "ración", "estándar", "piezas"],
  },
  {
    id: "al-27",
    section: "alimentos",
    question: "¿Puedes poner un ejemplo de porción estándar?",
    answer:
      "Claro: 1 huevo mediano equivale a 60 g, 1 rebanada de pan a 30 g, 1 vaso de leche a 200 ml, 1 manzana mediana a 150 g y 1 plátano a 120 g. Estos valores son orientativos y puedes personalizarlos según la región o el paciente. Al definir la porción estándar en la ficha del alimento, el sistema aplicará esa conversión automáticamente cuando escribas la cantidad en unidades en un plan.",
    related: ["al-26", "al-25", "al-36"],
    keywords: ["ejemplo", "huevo", "60g", "porción"],
  },
  {
    id: "al-28",
    section: "alimentos",
    question: "¿De dónde vienen los datos de Open Food Facts?",
    answer:
      "Open Food Facts es una base de datos colaborativa y abierta, como una \"Wikipedia de los productos alimentarios\". Los datos son aportados por usuarios de todo el mundo y se publican bajo licencia Open Database License (ODbL). AppNutrición usa su API pública para traer la información nutricional de productos con código de barras. Siempre revisa los valores importados porque, al ser colaborativa, la calidad puede variar según el producto.",
    related: ["al-14", "al-38", "al-62"],
    keywords: ["open food facts", "licencia", "odbl", "colaborativa"],
  },
  {
    id: "al-29",
    section: "alimentos",
    question: "¿La búsqueda ignora los acentos?",
    answer:
      "Sí. El buscador de alimentos normaliza mayúsculas, minúsculas y acentos. Así, \"platano\" encuentra \"Plátano\", \"lacteo\" encuentra \"Lácteo\" y \"cafe\" encuentra \"Café\". Funciona igual tanto en el filtro general como en los selectores cuando añades alimentos a una dieta o receta. Esto agiliza la búsqueda sin tener que preocuparte por la tipografía exacta ni por el teclado que uses.",
    related: ["al-4", "al-56", "al-16"],
    keywords: ["acentos", "búsqueda", "mayúsculas", "insensible"],
  },
  {
    id: "al-30",
    section: "alimentos",
    question: "¿Qué hago si encuentro alimentos duplicados?",
    answer:
      "Puede ocurrir que un alimento global y uno propio tuyo sean prácticamente el mismo. Lo recomendable es usar el global si los datos son correctos y eliminar tu duplicado propio para mantener la base ordenada. Si la duplicación es entre dos alimentos propios, elimina el que no uses y deja solo el que tenga datos más completos. Evita tener copias porque pueden generar confusión al elegir ingredientes en las dietas.",
    related: ["al-20", "al-3", "al-22"],
    keywords: ["duplicados", "repetidos", "limpiar", "copias"],
  },
  {
    id: "al-31",
    section: "alimentos",
    question: "¿Aparecen sugerencias al escribir el nombre?",
    answer:
      "Sí. Mientras tecleas el nombre en el buscador o al añadir un alimento a una dieta, se muestra un desplegable con sugerencias en tiempo real. Las sugerencias priorizan coincidencias al inicio del nombre y luego en cualquier parte. Se incluyen tanto alimentos globales como propios. Puedes navegar por las sugerencias con las flechas del teclado y aceptar con Enter, lo que acelera mucho la introducción de datos.",
    related: ["al-4", "al-29", "al-56"],
    keywords: ["sugerencias", "autocompletar", "tiempo real", "teclado"],
  },
  {
    id: "al-32",
    section: "alimentos",
    question: "¿Qué validaciones hace el formulario de alimento?",
    answer:
      "El formulario valida que el nombre no esté vacío y que los macros principales sean números no negativos. Las calorías deberían coincidir aproximadamente con la suma de proteínas×4 + hidratos×4 + grasas×9, y si no cuadran aparece un aviso (no bloqueante). También se comprueba que no uses símbolos raros en el nombre y que la unidad base sea válida. Los micros admiten cero o vacío, pero no negativos.",
    related: ["al-8", "al-33", "al-58"],
    keywords: ["validación", "formulario", "errores", "comprobar"],
  },
  {
    id: "al-33",
    section: "alimentos",
    question: "¿Qué diferencia hay entre un micro con valor 0 y uno vacío?",
    answer:
      "Un micro con valor 0 significa que el alimento no contiene ese nutriente, mientras que un micro vacío (null) significa que no se ha medido o no se dispone del dato. Esta distinción es importante porque en los informes y sumatorios del plan solo se tienen en cuenta los valores conocidos. Si dejas un campo vacío, no suma 0 falsamente. Por eso, si no conoces el valor, es mejor dejarlo vacío que poner 0.",
    related: ["al-11", "al-32", "al-60"],
    keywords: ["cero", "null", "vacío", "diferencia"],
  },
  {
    id: "al-34",
    section: "alimentos",
    question: "¿Con cuántos decimales se guardan los nutrientes?",
    answer:
      "AppNutrición guarda internamente los nutrientes con dos decimales y los muestra con uno o dos según el caso: las calorías se suelen redondear al entero más cercano, los macros en gramos con un decimal y los micros en mg o µg con uno o dos decimales. El redondeo se aplica al mostrar, pero los cálculos usan los valores precisos para evitar errores acumulados. Si introduces más decimales, se truncarán al guardar.",
    related: ["al-10", "al-33", "al-11"],
    keywords: ["decimales", "redondeo", "precisión", "números"],
  },
  {
    id: "al-35",
    section: "alimentos",
    question: "¿Puedo exportar mis alimentos a CSV o Excel?",
    answer:
      "De momento AppNutrición no soporta exportar la base de alimentos a CSV o Excel desde la sección `/alimentos`. Si necesitas un listado, puedes imprimir la pantalla o hacer una captura. Esta funcionalidad está en el roadmap para futuras versiones, sobre todo para dietistas que quieran hacer copias de seguridad o análisis fuera de la app. Si te urge, contáctanos por soporte y valoramos la prioridad.",
    related: ["al-36", "al-37", "al-64"],
    keywords: ["exportar", "csv", "excel", "descarga"],
  },
  {
    id: "al-36",
    section: "alimentos",
    question: "¿Se puede importar masivamente alimentos desde CSV?",
    answer:
      "No, la importación masiva desde CSV no está soportada actualmente. Solo puedes dar de alta alimentos uno a uno desde el formulario o importarlos desde Open Food Facts por código de barras o nombre. Esta limitación evita errores de formato y duplicados en la base. Si tienes un listado grande que importar, puedes plantearlo con soporte para buscar una solución alternativa o esperar a futuras versiones.",
    related: ["al-35", "al-7", "al-14"],
    keywords: ["importar", "masiva", "csv", "bulk"],
  },
  {
    id: "al-37",
    section: "alimentos",
    question: "¿Debo crear una receta o un alimento nuevo?",
    answer:
      "Un alimento es un ingrediente simple (manzana, pechuga de pollo, arroz), mientras que una receta es una combinación de ingredientes con cantidades y preparación (ensalada César, tortilla de patatas). Si vas a usar la combinación muchas veces, conviene crear una receta. Si es un producto puntual o un ingrediente básico, créalo como alimento. Las recetas viven en `/recetas` y los alimentos en `/alimentos`, aunque se relacionan entre sí.",
    related: ["al-1", "al-38", "al-42"],
    keywords: ["receta", "alimento", "diferencia", "cuándo"],
  },
  {
    id: "al-38",
    section: "alimentos",
    question: "¿Cuándo conviene crear un alimento nuevo en vez de usar uno existente?",
    answer:
      "Crea uno nuevo si el producto tiene una composición nutricional significativamente distinta (una marca concreta, una variedad específica, una preparación particular). Si un global se aproxima razonablemente, úsalo y ajusta la cantidad. Para productos envasados con marca, lo ideal es importar desde Open Food Facts por código de barras. Mantener pocos alimentos bien calibrados es mejor que tener muchos redundantes y difíciles de elegir después.",
    related: ["al-7", "al-14", "al-30"],
    keywords: ["cuándo", "crear", "existente", "decisión"],
  },
  {
    id: "al-39",
    section: "alimentos",
    question: "¿Puedo incluir la marca comercial en el nombre?",
    answer:
      "Sí, es opcional pero muy recomendable si el producto es de una marca concreta. Por ejemplo: \"Yogur natural Danone 0%\" o \"Galletas María Fontaneda\". Incluirla ayuda a distinguirlo de productos similares y a encontrarlo después en el buscador. Si importas desde Open Food Facts, la marca suele venir ya en el nombre. Evita marcas regionales muy minoritarias salvo que sean habituales con tus pacientes.",
    related: ["al-7", "al-14", "al-38"],
    keywords: ["marca", "comercial", "nombre", "producto"],
  },
  {
    id: "al-40",
    section: "alimentos",
    question: "¿Puedo crear categorías personalizadas?",
    answer:
      "Actualmente las categorías son un conjunto cerrado definido por AppNutrición (frutas, verduras, carnes, pescados, lácteos, cereales, legumbres, frutos secos, aceites, bebidas, huevos, procesados, dulces, preparados...). No puedes crear categorías nuevas propias. Si tu alimento no encaja claramente, elige la más cercana o déjalo sin categoría. Esta limitación mantiene la coherencia del filtro y permite que las estadísticas agregadas sean comparables entre cuentas.",
    related: ["al-5", "al-7", "al-41"],
    keywords: ["categoría", "personalizada", "crear", "propia"],
  },
  {
    id: "al-41",
    section: "alimentos",
    question: "¿Qué pasa si un alimento no encaja en ninguna categoría?",
    answer:
      "Puedes dejarlo sin categoría o elegir la más cercana (por ejemplo, \"preparados\" para platos compuestos o \"procesados\" para productos industriales). Los alimentos sin categoría siguen siendo buscables por nombre y funcionan con normalidad en dietas y recetas. Solo pierdes un filtro visual en el listado. Si hay un tipo de alimento que usas mucho y no encuentras encaje, cuéntanoslo por soporte para valorar ampliar el catálogo.",
    related: ["al-5", "al-40", "al-7"],
    keywords: ["sin categoría", "encaje", "otros", "miscelánea"],
  },
  {
    id: "al-42",
    section: "alimentos",
    question: "¿Qué error me sale si faltan campos obligatorios?",
    answer:
      "El formulario marca los campos en rojo y muestra un mensaje junto a cada uno indicando qué falta, por ejemplo \"El nombre es obligatorio\" o \"Las calorías deben ser un número\". Además, el botón \"Guardar\" queda desactivado o, al pulsarlo, aparece un toast de error general. Corrige los campos señalados y vuelve a intentarlo. Esta validación te evita guardar alimentos incompletos que luego romperían los cálculos en las dietas.",
    related: ["al-8", "al-32", "al-58"],
    keywords: ["error", "obligatorio", "campos", "rojo"],
  },
  {
    id: "al-43",
    section: "alimentos",
    question: "¿Hay un máximo de caracteres para el nombre?",
    answer:
      "Sí. El nombre de un alimento está limitado a 120 caracteres aproximadamente, suficiente para incluir marca, variedad y preparación si es necesario. Si te acercas al límite, verás un contador debajo del campo. Nombres demasiado largos se truncan en el listado visualmente, pero se guardan completos. Te recomendamos nombres concisos y descriptivos, tipo \"Pollo pechuga cruda\" o \"Leche entera UHT\", mejor que frases completas.",
    related: ["al-7", "al-39", "al-42"],
    keywords: ["máximo", "caracteres", "nombre", "longitud"],
  },
  {
    id: "al-44",
    section: "alimentos",
    question: "¿Puedo generar alimentos con inteligencia artificial?",
    answer:
      "AppNutrición no genera alimentos completos desde cero con IA, pero sí te sugiere valores aproximados si creas un alimento con un nombre reconocible y pulsas \"Estimar con IA\" (si está disponible en tu versión). La IA rellena macros probables basándose en la denominación. Revisa siempre los valores, porque son estimaciones y no sustituyen una fuente fiable como BEDCA o Open Food Facts. Úsalo como punto de partida, no como dato definitivo.",
    related: ["al-13", "al-14", "al-7"],
    keywords: ["ia", "inteligencia artificial", "generar", "estimar"],
  },
  {
    id: "al-45",
    section: "alimentos",
    question: "¿Puedo compartir mis alimentos propios con otros dietistas?",
    answer:
      "No, actualmente los alimentos propios son privados de tu cuenta y no hay función de compartir directo entre dietistas. Solo los alimentos globales de la base de AppNutrición son comunes a todos. Si trabajas en un equipo y queréis compartir, cada miembro puede crear los mismos alimentos en su cuenta o, si tenéis una cuenta multiusuario, se comparten dentro de esa organización. Esta funcionalidad está en estudio para versiones futuras.",
    related: ["al-3", "al-46", "al-66"],
    keywords: ["compartir", "equipo", "colaborar", "dietistas"],
  },
  {
    id: "al-46",
    section: "alimentos",
    question: "¿Puedo aportar mis alimentos a la base global?",
    answer:
      "De momento no hay un flujo directo para que los dietistas aporten sus alimentos propios a la base global de AppNutrición. Si creas un alimento que crees que sería útil para toda la comunidad, contáctanos por soporte y el equipo lo valorará para incluirlo. Esta vía manual asegura que los datos globales pasen una revisión de calidad antes de publicarse, manteniendo el estándar de la base compartida.",
    related: ["al-3", "al-45", "al-52"],
    keywords: ["aportar", "contribuir", "global", "comunidad"],
  },
  {
    id: "al-47",
    section: "alimentos",
    question: "¿Puedo añadir sinónimos a un alimento?",
    answer:
      "No existe un campo específico de sinónimos, pero puedes incluir variantes en el nombre o en un campo de notas si está disponible. Por ejemplo, un alimento llamado \"Plátano (banana)\" será encontrado al buscar \"plátano\" o \"banana\". El buscador es insensible a acentos y busca en cualquier parte del nombre, así que una denominación enriquecida funciona como sinónimo de facto. Ten en cuenta el límite de caracteres del nombre.",
    related: ["al-39", "al-43", "al-29"],
    keywords: ["sinónimos", "alias", "variantes", "nombres"],
  },
  {
    id: "al-48",
    section: "alimentos",
    question: "¿Qué hago si un alimento global está mal clasificado?",
    answer:
      "Si encuentras un alimento global con categoría errónea o datos incorrectos, no puedes editarlo directamente. Las opciones son: crear una copia propia con los valores corregidos y usar esa en tus planes, o reportar el error a soporte para que el equipo de AppNutrición lo revise y corrija en la base global. Incluye el nombre exacto del alimento y el cambio propuesto para facilitar la verificación.",
    related: ["al-22", "al-46", "al-52"],
    keywords: ["mal clasificado", "reportar", "corregir", "error"],
  },
  {
    id: "al-49",
    section: "alimentos",
    question: "¿Qué pasa con los alimentos incompletos sin micros?",
    answer:
      "Un alimento sin micronutrientes sigue siendo perfectamente usable en dietas y recetas: los macros básicos permiten calcular calorías y composición principal. Lo que perderás es el cálculo de micros en los informes nutricionales del plan, que mostrarán \"no disponible\" o excluirán ese alimento del sumatorio. Si quieres informes completos, prioriza usar alimentos con micros cargados, especialmente los provenientes de BEDCA o fuentes fiables.",
    related: ["al-11", "al-33", "al-50"],
    keywords: ["incompleto", "sin micros", "informe", "disponible"],
  },
  {
    id: "al-50",
    section: "alimentos",
    question: "¿Cómo valoro la calidad de los datos de un alimento?",
    answer:
      "Mira la fuente: alimentos de BEDCA o de la base global curada tienen la máxima fiabilidad. Los importados de Open Food Facts son variables porque dependen de lo que haya aportado la comunidad (productos populares están bien, productos de nicho pueden tener huecos). Los creados por ti u otros dietistas dependen del cuidado en la introducción. Fíjate en si tiene micros completos: suele correlacionar con una fuente más rigurosa.",
    related: ["al-49", "al-51", "al-17"],
    keywords: ["calidad", "datos", "fiabilidad", "fuente"],
  },
  {
    id: "al-51",
    section: "alimentos",
    question: "¿Qué diferencia hay entre las fuentes BEDCA y Open Food Facts?",
    answer:
      "BEDCA es la base oficial española, mantenida por investigadores, con alimentos frescos o tradicionales analizados en laboratorio y muy completos en micros. Open Food Facts es colaborativa, global y se centra en productos envasados con código de barras; los datos vienen sobre todo de las etiquetas nutricionales del fabricante, que suelen tener solo macros. Para alimentos frescos prefiere BEDCA; para productos procesados o de marca, Open Food Facts.",
    related: ["al-17", "al-28", "al-50"],
    keywords: ["bedca", "open food facts", "diferencia", "fuentes"],
  },
  {
    id: "al-52",
    section: "alimentos",
    question: "¿Cómo reporto un error en un alimento global?",
    answer:
      "Usa el canal de soporte de AppNutrición (chat, email o formulario de contacto en `/ajustes`). Indica el nombre exacto del alimento, qué consideras incorrecto (categoría, calorías, micros...) y, si puedes, una fuente fiable con el valor correcto. El equipo revisa los reportes y, si procede, corrige el dato en la base global para que todos los dietistas se beneficien de la corrección.",
    related: ["al-48", "al-46", "al-22"],
    keywords: ["reportar", "error", "global", "soporte"],
  },
  {
    id: "al-53",
    section: "alimentos",
    question: "¿Hay diferencia entre un alimento crudo y cocinado?",
    answer:
      "Sí, y es importante. Un alimento crudo y su versión cocinada tienen pesos y composiciones distintas porque cocinar cambia el contenido de agua, grasa y a veces nutrientes. Por ejemplo, 100 g de arroz crudo no son 100 g de arroz cocido. AppNutrición incluye versiones separadas de los alimentos más habituales (\"Arroz blanco crudo\" y \"Arroz blanco cocido\"). Usa siempre la versión que corresponda al estado en que el paciente lo va a consumir.",
    related: ["al-54", "al-38", "al-25"],
    keywords: ["crudo", "cocinado", "peso", "preparación"],
  },
  {
    id: "al-54",
    section: "alimentos",
    question: "¿Puedo crear una versión cocinada a partir de una cruda?",
    answer:
      "Sí. La forma rápida es usar la opción \"Copiar desde otro alimento\" para partir del crudo y después ajustar los macros al estado cocinado. Como referencia: al cocer, los cereales suelen aumentar de peso por absorción de agua (multiplicador 2-3x) y las carnes suelen perder agua (pérdida del 25-30%). Consulta tablas de conversión o BEDCA para valores exactos. Guarda con un nombre claro tipo \"Arroz integral cocido (propio)\".",
    related: ["al-53", "al-13", "al-7"],
    keywords: ["cocinado", "crear", "copiar", "conversión"],
  },
  {
    id: "al-55",
    section: "alimentos",
    question: "¿Son privados mis alimentos propios?",
    answer:
      "Sí, totalmente. Tus alimentos propios solo los ves tú dentro de tu cuenta de AppNutrición. No son visibles para otros dietistas ni para tus pacientes, aunque sí aparecerán en los planes que compartas con ellos como nombres e ingredientes. Los datos se almacenan cifrados en la base de datos y cumplen con la normativa de protección de datos. Solo el personal de AppNutrición con permisos técnicos puede acceder por soporte si lo autorizas.",
    related: ["al-3", "al-45", "al-66"],
    keywords: ["privacidad", "propios", "privado", "solo yo"],
  },
  {
    id: "al-56",
    section: "alimentos",
    question: "¿Cómo se usa la cantidad recomendada en los planes?",
    answer:
      "Cuando añades un alimento a un plan en `/dietas`, introduces la cantidad que el paciente debe consumir (en gramos, mililitros o unidades) y AppNutrición calcula automáticamente las calorías y macros proporcionales. La cantidad recomendada no está fijada en el alimento en sí, sino que se define en cada plan. Puedes guardar cantidades típicas como parte de plantillas de comidas para ahorrarte teclear cada vez.",
    related: ["al-25", "al-26", "al-36"],
    keywords: ["cantidad", "recomendada", "plan", "ración"],
  },
  {
    id: "al-57",
    section: "alimentos",
    question: "¿Cómo veo el listado en modo compacto?",
    answer:
      "En la parte superior del listado puedes alternar entre vista \"Tabla\" y vista \"Tarjetas\" mediante un botón o selector. La vista tabla muestra muchas columnas (macros, categoría, origen) en filas compactas; la vista tarjetas es más visual y cómoda en móvil. También hay opciones de densidad (normal/compacta) para apretar o airear las filas. Tu preferencia se guarda entre sesiones para no tener que ajustarla cada vez.",
    related: ["al-2", "al-6", "al-24"],
    keywords: ["vista", "compacto", "tabla", "tarjetas"],
  },
  {
    id: "al-58",
    section: "alimentos",
    question: "¿Puedo guardar un alimento sin todos los macros rellenos?",
    answer:
      "No. Los cuatro macros principales (calorías, proteínas, hidratos y grasas) son obligatorios para guardar un alimento. Si falta alguno, el formulario no permite el guardado y marca el campo en rojo. Esta restricción existe porque sin macros no se pueden calcular totales en dietas ni recetas. Si no conoces un valor, una opción razonable es estimarlo a partir de alimentos similares o buscar la ficha en BEDCA u Open Food Facts antes de guardar.",
    related: ["al-8", "al-32", "al-42"],
    keywords: ["guardar", "sin macros", "obligatorio", "vacío"],
  },
  {
    id: "al-59",
    section: "alimentos",
    question: "¿Puedo añadir una foto al alimento?",
    answer:
      "Los alimentos importados desde Open Food Facts suelen traer una foto del producto si existe en su base de datos. Para alimentos creados manualmente, la función de subir foto propia puede estar disponible como opcional en el formulario, dependiendo de la versión de AppNutrición. Las fotos ayudan a los pacientes a identificar visualmente el ingrediente en los planes. Si no hay foto, se usa un icono genérico de la categoría.",
    related: ["al-14", "al-7", "al-39"],
    keywords: ["foto", "imagen", "producto", "visual"],
  },
  {
    id: "al-60",
    section: "alimentos",
    question: "¿Qué unidades se usan para los micronutrientes?",
    answer:
      "Las vitaminas liposolubles (A, D, E, K) se suelen expresar en microgramos (µg) o UI; las hidrosolubles (B, C, folato) en miligramos (mg) o microgramos (µg) según el micro. Los minerales abundantes (calcio, magnesio, fósforo, potasio, sodio) van en miligramos, y los minerales traza (selenio, cobre, manganeso, yodo, cinc) en microgramos o miligramos. Junto a cada campo del formulario verás la unidad correcta para evitar errores de magnitud.",
    related: ["al-11", "al-12", "al-34"],
    keywords: ["unidades", "micros", "mg", "microgramos"],
  },
  {
    id: "al-61",
    section: "alimentos",
    question: "¿Puedo ver los micros en el listado general?",
    answer:
      "El listado principal de `/alimentos` muestra por defecto nombre, categoría y macros (kcal, proteínas, hidratos, grasas), no los 24 micros para mantenerlo legible. Si quieres ver los micros de un alimento, haz clic en la fila para abrir su ficha detallada, donde se despliegan todos. También puedes usar la exportación individual (copiar/imprimir ficha) si tu versión lo permite. En futuras versiones está prevista una vista con columnas configurables.",
    related: ["al-2", "al-11", "al-57"],
    keywords: ["micros", "listado", "ver", "columnas"],
  },
  {
    id: "al-62",
    section: "alimentos",
    question: "¿Qué hago si Open Food Facts no encuentra el código de barras?",
    answer:
      "Si el EAN no devuelve resultados, significa que ningún usuario de Open Food Facts ha registrado ese producto. Las alternativas son: buscar el producto por nombre en vez de por código, introducir los datos manualmente a partir de la etiqueta nutricional del envase, o contribuir tú mismo a Open Food Facts desde su app móvil para que quede disponible después. En el formulario manual puedes también apuntar el EAN como parte del nombre o las notas.",
    related: ["al-14", "al-15", "al-16"],
    keywords: ["no encuentra", "sin resultados", "ean", "manual"],
  },
  {
    id: "al-63",
    section: "alimentos",
    question: "¿BEDCA cubre productos de marca?",
    answer:
      "No. BEDCA se centra en alimentos frescos, tradicionales y genéricos españoles (patata, lentejas, merluza, aceite de oliva...), no en productos envasados con marca comercial. Para productos de marca (yogures comerciales, galletas, cereales de desayuno...) debes recurrir a Open Food Facts o introducir los datos manualmente desde la etiqueta. Usar la combinación BEDCA para ingredientes base y Open Food Facts para productos envasados es la estrategia más completa.",
    related: ["al-17", "al-51", "al-39"],
    keywords: ["bedca", "marca", "productos", "envasados"],
  },
  {
    id: "al-64",
    section: "alimentos",
    question: "¿Puedo imprimir un alimento?",
    answer:
      "Puedes abrir la ficha de un alimento y usar la función imprimir del navegador (Ctrl+P o Cmd+P) para obtener una copia en papel o PDF. El diseño de la ficha está optimizado para que imprima limpiamente, con los macros y micros bien ordenados. Es útil si un paciente te pide la información nutricional de un alimento concreto o si quieres archivar una ficha en tu historial profesional.",
    related: ["al-35", "al-61", "al-18"],
    keywords: ["imprimir", "papel", "pdf", "ficha"],
  },
  {
    id: "al-65",
    section: "alimentos",
    question: "¿Cuántos alimentos puedo tener en mi cuenta?",
    answer:
      "No hay un límite técnico estricto de alimentos propios en una cuenta, pero por experiencia, tener más de unos cientos sin organizar se vuelve ingobernable. Te recomendamos mantener solo los alimentos que realmente usas y aprovechar la base global para el resto. Si notas lentitud en el listado, revisa cuántos tienes (aparece un contador en la parte superior) y valora limpiar los que no uses desde hace mucho.",
    related: ["al-30", "al-20", "al-2"],
    keywords: ["cuántos", "límite", "máximo", "cantidad"],
  },
  {
    id: "al-66",
    section: "alimentos",
    question: "¿Los pacientes ven mi base de alimentos?",
    answer:
      "No directamente. Los pacientes no acceden a tu sección `/alimentos` desde el portal. Solo ven los alimentos como parte de los planes de alimentación que les envías, con el nombre y las cantidades de cada comida. Tu base de alimentos, tanto global como propia, es una herramienta interna del nutricionista. El paciente tampoco ve los valores nutricionales individuales de cada alimento a menos que tu plan los exponga explícitamente.",
    related: ["al-55", "al-56", "al-1"],
    keywords: ["paciente", "ve", "portal", "visibilidad"],
  },
  {
    id: "al-67",
    section: "alimentos",
    question: "¿Qué ocurre si intento crear un alimento con nombre duplicado?",
    answer:
      "AppNutrición no impide nombres duplicados estrictos, pero al escribir un nombre que ya existe (global o propio), aparece una sugerencia indicando que hay un alimento similar y ofreciendo usarlo en vez de crear uno nuevo. Así se evitan duplicados innecesarios. Si realmente necesitas una versión distinta (por ejemplo, misma denominación pero marca diferente), añade la marca o una coletilla al nombre para diferenciarlo claramente.",
    related: ["al-30", "al-31", "al-39"],
    keywords: ["duplicado", "nombre", "repetido", "existe"],
  },
  {
    id: "al-68",
    section: "alimentos",
    question: "¿Cómo veo el último alimento que he editado?",
    answer:
      "Ordena el listado por \"Fecha de modificación\" descendente y verás arriba del todo el alimento que editaste más recientemente. También puedes filtrar solo tus alimentos propios para reducir el listado. Esta ordenación es útil después de una sesión de importación masiva o de correcciones, para verificar qué cambió. La fecha de última modificación se guarda automáticamente cada vez que pulsas \"Guardar\" en la ficha.",
    related: ["al-6", "al-18", "al-2"],
    keywords: ["último", "reciente", "modificado", "historial"],
  },
  {
    id: "al-69",
    section: "alimentos",
    question: "¿Puedo deshacer un cambio o una eliminación?",
    answer:
      "La edición de un alimento sobrescribe los valores anteriores y no hay un \"deshacer\" automático después de guardar. La eliminación es definitiva salvo que contactes con soporte rápidamente para recuperar desde copia de seguridad. Por eso, antes de editar cambios grandes o de eliminar, confirma que estás trabajando sobre el alimento correcto. Si no estás seguro, crea una copia propia en lugar de editar el original.",
    related: ["al-18", "al-20", "al-21"],
    keywords: ["deshacer", "recuperar", "undo", "copia"],
  },
  {
    id: "al-70",
    section: "alimentos",
    question: "¿Cómo funciona la búsqueda por ingrediente al crear una receta?",
    answer:
      "Al añadir un ingrediente a una receta en `/recetas`, AppNutrición abre un selector que consulta tu base `/alimentos` con el mismo buscador y filtros: insensible a acentos, con sugerencias en tiempo real y filtros por categoría. Seleccionas el alimento, indicas la cantidad y se integra en la receta con sus macros proporcionales. Si no encuentras un ingrediente, puedes crearlo en ese momento desde el propio selector sin salir de la receta.",
    related: ["al-37", "al-4", "al-56"],
    keywords: ["receta", "ingrediente", "selector", "buscar"],
  },
];
