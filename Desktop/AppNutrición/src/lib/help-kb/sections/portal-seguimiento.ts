import type { HelpEntry } from "../types";

export const PORTAL_SEGUIMIENTO_ENTRIES: HelpEntry[] = [
  {
    id: "ps-1",
    section: "portal-seguimiento",
    question: "¿Qué es Mi seguimiento?",
    answer:
      "Mi seguimiento es el apartado del portal donde registras tu día a día: lo que bebes, lo que comes, si has hecho ejercicio y cómo te has sentido. Es tu diario personal de hábitos, pensado para que tú y tu nutricionista tengáis una foto clara de lo que ocurre fuera de consulta. Entra desde /paciente/portal/seguimiento y empieza por el día de hoy.",
    related: ["ps-2", "ps-3"],
    keywords: ["seguimiento", "qué es", "diario", "portal"],
  },
  {
    id: "ps-2",
    section: "portal-seguimiento",
    question: "¿Qué diferencia hay entre el plan de alimentación y el seguimiento?",
    answer:
      "El plan de alimentación es lo que tu nutri te recomienda comer: es la pauta, la propuesta. El seguimiento es lo que realmente has hecho tú cada día. Uno es la teoría, el otro la práctica. Al compararlos, tu nutri puede entender qué te funciona, qué te cuesta y ajustar el plan con datos reales.",
    related: ["ps-1", "ps-22"],
    keywords: ["diferencia", "plan", "seguimiento", "real"],
  },
  {
    id: "ps-3",
    section: "portal-seguimiento",
    question: "¿Qué puedo registrar cada día?",
    answer:
      "Puedes registrar el agua que bebes en mililitros, si has hecho ejercicio con minutos y kcal aproximadas, las comidas del día (desayuno, media mañana, almuerzo, merienda, cena y recena) escribiendo qué has tomado, y unas notas libres sobre cómo te has sentido. Al final puedes marcar el día como cumplido.",
    related: ["ps-1", "ps-4"],
    keywords: ["registrar", "qué puedo", "día", "campos"],
  },
  {
    id: "ps-4",
    section: "portal-seguimiento",
    question: "¿Cómo registro el agua que bebo?",
    answer:
      "En la tarjeta de agua tienes un contador en mililitros y varios botones para sumar o restar. Pulsa el botón + cuando bebas un vaso o una botella, y si te pasas al sumar, usa el - para corregir. El total del día se guarda solo según vas pulsando.",
    related: ["ps-5", "ps-6"],
    keywords: ["agua", "registrar", "ml", "botones"],
  },
  {
    id: "ps-5",
    section: "portal-seguimiento",
    question: "¿Qué hacen los botones + y - del agua?",
    answer:
      "Los botones + y - suman o restan cantidades típicas de agua: +100 ml para un sorbo, +250 ml para un vaso y +500 ml para una botella pequeña. Los botones - hacen lo mismo pero restando, por si te has equivocado. Así no tienes que escribir cada cifra a mano.",
    related: ["ps-4", "ps-6"],
    keywords: ["botones", "mas", "menos", "100", "250", "500"],
  },
  {
    id: "ps-6",
    section: "portal-seguimiento",
    question: "¿Tengo un objetivo diario de agua?",
    answer:
      "Sí, en la tarjeta del agua verás un objetivo orientativo (normalmente alrededor de 2.000 ml, aunque depende de lo que te haya indicado tu nutri). Una barra de progreso te muestra cuánto te queda. No es una meta rígida: lo importante es mantener una hidratación razonable a lo largo del día.",
    related: ["ps-4", "ps-5"],
    keywords: ["objetivo", "agua", "meta", "litros"],
  },
  {
    id: "ps-7",
    section: "portal-seguimiento",
    question: "¿Cómo registro si he hecho ejercicio?",
    answer:
      "En la tarjeta de ejercicio marca si hoy has hecho actividad (sí o no). Si marcas que sí, aparecen campos para indicar los minutos que has entrenado y las kcal aproximadas que has gastado. No necesitas ser exacto: un valor estimado es suficiente.",
    related: ["ps-8", "ps-9"],
    keywords: ["ejercicio", "registrar", "sí", "no"],
  },
  {
    id: "ps-8",
    section: "portal-seguimiento",
    question: "¿Qué pongo en minutos de ejercicio?",
    answer:
      "Pon el tiempo real que has estado haciendo la actividad, sin contar descansos largos. Por ejemplo, si has paseado 45 minutos, pon 45. Si has ido al gimnasio una hora pero media te has dedicado a estirar, lo razonable es poner entre 30 y 60 según cómo de intenso haya sido.",
    related: ["ps-7", "ps-9"],
    keywords: ["minutos", "ejercicio", "tiempo"],
  },
  {
    id: "ps-9",
    section: "portal-seguimiento",
    question: "¿Cómo sé las kcal que gasto al entrenar?",
    answer:
      "No hace falta que sean exactas. Si usas un reloj deportivo o una app que te dé el gasto, copia ese número. Si no, puedes estimar: un paseo tranquilo unas 200-300 kcal por hora, algo más intenso 400-600. Tu nutri puede ayudarte a afinar la cifra si te interesa.",
    related: ["ps-7", "ps-8"],
    keywords: ["kcal", "calorías", "ejercicio", "gasto"],
  },
  {
    id: "ps-10",
    section: "portal-seguimiento",
    question: "¿Puedo indicar el tipo de ejercicio?",
    answer:
      "En las notas del día puedes escribir qué deporte o actividad has hecho (correr, pesas, yoga, natación, caminar, etc.). El campo principal solo te pide minutos y kcal, pero el detalle lo puedes dejar en notas para que tu nutri entienda la intensidad real.",
    related: ["ps-7", "ps-18"],
    keywords: ["tipo", "ejercicio", "deporte", "actividad"],
  },
  {
    id: "ps-11",
    section: "portal-seguimiento",
    question: "¿Cómo relleno las comidas del día?",
    answer:
      "Encontrarás un bloque por cada toma del día: Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena. En cada una hay un campo de texto donde puedes escribir qué has comido. No hay fórmula mágica: explícalo como se lo contarías a tu nutri.",
    related: ["ps-12", "ps-13"],
    keywords: ["comidas", "rellenar", "día"],
  },
  {
    id: "ps-12",
    section: "portal-seguimiento",
    question: "¿Qué comidas aparecen en el seguimiento?",
    answer:
      "Aparecen las seis tomas habituales: Desayuno, Media mañana, Almuerzo, Merienda, Cena y Recena. No estás obligado a rellenarlas todas: solo las que realmente hagas ese día. Si no sueles merendar, por ejemplo, déjala en blanco.",
    related: ["ps-11", "ps-13"],
    keywords: ["comidas", "desayuno", "almuerzo", "cena", "recena"],
  },
  {
    id: "ps-13",
    section: "portal-seguimiento",
    question: "¿Qué escribo en cada comida?",
    answer:
      "Escribe con tus palabras lo que has tomado, incluyendo cantidades aproximadas cuando las sepas. Por ejemplo: \"café con leche y tostada con aceite\" o \"pechuga de pollo a la plancha con ensalada y una manzana\". Cuanto más claro lo describas, mejor podrá interpretarlo tu nutri.",
    related: ["ps-11", "ps-14"],
    keywords: ["qué comido", "texto libre", "descripción"],
  },
  {
    id: "ps-14",
    section: "portal-seguimiento",
    question: "¿Qué hago si no recuerdo exactamente qué comí?",
    answer:
      "Pon lo que recuerdes, aunque sea aproximado. Es mejor un registro imperfecto que ninguno. Por ejemplo: \"comida fuera, creo que pasta con carne y postre\". Tu nutri prefiere una descripción honesta aunque genérica a un registro en blanco.",
    related: ["ps-13", "ps-26"],
    keywords: ["no recuerdo", "aproximado", "dudas"],
  },
  {
    id: "ps-15",
    section: "portal-seguimiento",
    question: "¿Puedo comparar lo que he comido con lo que decía el plan?",
    answer:
      "Sí. En la vista de cada día, si tu nutri te ha asignado un plan de alimentación, puedes ver junto a cada comida lo que el plan proponía. Esto te ayuda a detectar si te has desviado mucho o si estás siguiéndolo bastante fielmente.",
    related: ["ps-2", "ps-16"],
    keywords: ["comparar", "plan", "desviación"],
  },
  {
    id: "ps-16",
    section: "portal-seguimiento",
    question: "¿Qué son los macros estimados?",
    answer:
      "Son una aproximación de las calorías, proteínas, hidratos y grasas de lo que has registrado comer. El sistema los calcula automáticamente a partir del texto que escribes, así que no son exactos, pero sirven para tener una idea de cómo ha sido tu día.",
    related: ["ps-17", "ps-25"],
    keywords: ["macros", "estimados", "calorías", "proteínas"],
  },
  {
    id: "ps-17",
    section: "portal-seguimiento",
    question: "¿Cómo se calculan los macros de lo que como?",
    answer:
      "Se estiman a partir de las palabras y cantidades que escribes en cada comida, usando tablas nutricionales medias. Cuanto más específico seas (por ejemplo \"150 g de arroz cocido\" en vez de \"un poco de arroz\"), más fiable será la estimación. Son una orientación, no un análisis de laboratorio.",
    related: ["ps-16", "ps-25"],
    keywords: ["cálculo", "macros", "estimación"],
  },
  {
    id: "ps-18",
    section: "portal-seguimiento",
    question: "¿Para qué sirven las notas del día?",
    answer:
      "Las notas son un espacio libre donde contar cualquier cosa que no encaje en los otros campos: cómo te has sentido, si has tenido hambre, si has pasado mala noche, si has estado en un evento social... Es información muy útil para tu nutri porque explica por qué has comido como has comido.",
    related: ["ps-19", "ps-10"],
    keywords: ["notas", "día", "para qué"],
  },
  {
    id: "ps-19",
    section: "portal-seguimiento",
    question: "¿Puedo contar cómo me he sentido?",
    answer:
      "Claro. En las notas puedes describir tu estado de ánimo, tu nivel de energía, si has tenido ansiedad por comer, si te has sentido ligero o hinchado, etc. Estos detalles ayudan a tu nutri a relacionar tus hábitos con cómo te encuentras.",
    related: ["ps-18"],
    keywords: ["sentido", "ánimo", "energía", "estado"],
  },
  {
    id: "ps-20",
    section: "portal-seguimiento",
    question: "¿Cómo marco un día como cumplido?",
    answer:
      "Al final del día, cuando hayas terminado de registrar, hay un botón para marcarlo como cumplido. Al pulsarlo, ese día aparecerá con un check verde en la vista mensual. Es tu forma de decir \"hoy he seguido bien el plan\".",
    related: ["ps-21", "ps-28"],
    keywords: ["cumplido", "marcar", "día", "check"],
  },
  {
    id: "ps-21",
    section: "portal-seguimiento",
    question: "¿Y si no he cumplido el día?",
    answer:
      "Puedes dejar el día sin marcar como cumplido o marcarlo como no cumplido. Aparecerá con una cruz en la vista mensual. No es un castigo: es información honesta para ti y para tu nutri. Un día flojo no arruina el proceso, pero reconocerlo ayuda a entender patrones.",
    related: ["ps-20", "ps-28"],
    keywords: ["no cumplido", "cruz", "fallo"],
  },
  {
    id: "ps-22",
    section: "portal-seguimiento",
    question: "¿Qué es la vista mensual del seguimiento?",
    answer:
      "La vista mensual es un calendario donde ves todos los días del mes con un vistazo. Cada día aparece con un check verde si lo marcaste como cumplido, una cruz si no, o vacío si no registraste nada. Es la forma rápida de ver tu constancia.",
    related: ["ps-23", "ps-30"],
    keywords: ["vista", "mensual", "calendario", "mes"],
  },
  {
    id: "ps-23",
    section: "portal-seguimiento",
    question: "¿Cómo navego entre días?",
    answer:
      "Por defecto se abre el día de hoy. Con las flechas o pulsando en el calendario puedes ir a días anteriores para revisarlos o editarlos. En la vista mensual, un clic sobre cualquier día te lleva directamente a ese registro.",
    related: ["ps-22", "ps-24"],
    keywords: ["navegar", "días", "anteriores"],
  },
  {
    id: "ps-24",
    section: "portal-seguimiento",
    question: "¿Puedo editar un día que ya pasó?",
    answer:
      "Sí, puedes volver atrás y editar registros antiguos. Esto es útil si ayer se te olvidó apuntar la cena o quieres completar algo que dejaste a medias. Los cambios se guardan igual que si fuese hoy.",
    related: ["ps-23", "ps-27"],
    keywords: ["editar", "día pasado", "ayer"],
  },
  {
    id: "ps-25",
    section: "portal-seguimiento",
    question: "¿Cómo interpreto los macros que me aparecen?",
    answer:
      "Mira sobre todo la tendencia, no la cifra exacta. Si tu plan apunta a unas 1.800 kcal y tu día ha salido en 2.200, es una señal a tener en cuenta. Lo mismo con proteínas: si estás bajo la recomendación varios días, convérsalo con tu nutri. Son pistas, no sentencias.",
    related: ["ps-16", "ps-17"],
    keywords: ["interpretar", "macros", "cifras"],
  },
  {
    id: "ps-26",
    section: "portal-seguimiento",
    question: "¿Qué hago si como fuera del plan?",
    answer:
      "Regístralo tal cual. El seguimiento no es para fingir que has seguido el plan, sino para reflejar lo que ha pasado de verdad. Si has comido una pizza con amigos, ponlo. A tu nutri le sirve mucho más la realidad que una versión maquillada.",
    related: ["ps-14", "ps-44"],
    keywords: ["fuera", "plan", "salidas", "eventos"],
  },
  {
    id: "ps-27",
    section: "portal-seguimiento",
    question: "¿Qué pasa si un día no registro nada?",
    answer:
      "No pasa nada grave. Ese día quedará en blanco en la vista mensual. Si te apetece, puedes volver más tarde y completarlo con lo que recuerdes. Si no, simplemente retómalo al día siguiente. La constancia es importante, pero también la autocompasión.",
    related: ["ps-24", "ps-29"],
    keywords: ["no registrar", "vacío", "olvido"],
  },
  {
    id: "ps-28",
    section: "portal-seguimiento",
    question: "¿Qué es la adherencia al plan?",
    answer:
      "La adherencia es el porcentaje de días cumplidos respecto al total de días del periodo. Si en 30 días has marcado 24 como cumplidos, tu adherencia es del 80%. Es uno de los indicadores que tu nutri mira para saber cómo vas y ajustarte el plan.",
    related: ["ps-20", "ps-29"],
    keywords: ["adherencia", "porcentaje", "cumplimiento"],
  },
  {
    id: "ps-29",
    section: "portal-seguimiento",
    question: "¿Puedo ver mi histórico de seguimientos?",
    answer:
      "Sí. Desde la vista mensual puedes moverte a meses anteriores y ver todos los días que registraste. Así repasas cómo ha ido tu progreso, qué semanas fueron mejores y qué patrones se repiten.",
    related: ["ps-22", "ps-32"],
    keywords: ["histórico", "anteriores", "progreso"],
  },
  {
    id: "ps-30",
    section: "portal-seguimiento",
    question: "¿Qué significan el check y la cruz en el calendario?",
    answer:
      "El check verde indica que ese día lo marcaste como cumplido. La cruz roja indica que lo marcaste como no cumplido o que claramente te saliste del plan. Si no aparece ninguno de los dos, es un día sin registro. Sirve para ver tu constancia de un vistazo.",
    related: ["ps-20", "ps-21", "ps-22"],
    keywords: ["check", "cruz", "calendario", "símbolos"],
  },
  {
    id: "ps-31",
    section: "portal-seguimiento",
    question: "¿Puedo usar el seguimiento desde el móvil?",
    answer:
      "Sí, el portal está pensado para funcionar bien en el móvil, que es donde probablemente lo uses más. Los botones del agua son grandes, los campos de comida se adaptan al teclado y puedes registrar el día desde donde estés, en casa o comiendo fuera.",
    related: ["ps-33"],
    keywords: ["móvil", "smartphone", "responsive"],
  },
  {
    id: "ps-32",
    section: "portal-seguimiento",
    question: "¿Los cambios se guardan solos?",
    answer:
      "Sí, el seguimiento guarda automáticamente lo que vas escribiendo, así que no tienes que buscar un botón \"Guardar\" cada dos por tres. Si cierras la pestaña sin querer, al volver encontrarás lo último que metiste.",
    related: ["ps-27"],
    keywords: ["guardar", "automático", "cambios"],
  },
  {
    id: "ps-33",
    section: "portal-seguimiento",
    question: "¿Se entera mi nutricionista cuando registro el día?",
    answer:
      "Sí. Cada vez que cierras un día con cambios importantes, el sistema genera una notificación de tipo DIARIO_NUEVO a tu nutri. Así sabe que tiene seguimiento nuevo para revisar sin que tengas que avisarle tú por otro canal.",
    related: ["ps-34", "ps-40"],
    keywords: ["nutricionista", "notificación", "avisa"],
  },
  {
    id: "ps-34",
    section: "portal-seguimiento",
    question: "¿Qué es la notificación DIARIO_NUEVO?",
    answer:
      "Es el aviso interno que llega al panel de tu nutri diciendo que has registrado un nuevo día de seguimiento. Aparece en su bandeja de notificaciones y también en tu ficha. No tienes que hacer nada especial: se envía sola cuando guardas tu día.",
    related: ["ps-33"],
    keywords: ["DIARIO_NUEVO", "notificación", "aviso"],
  },
  {
    id: "ps-35",
    section: "portal-seguimiento",
    question: "¿Quién puede ver lo que registro?",
    answer:
      "Solo tú y tu nutricionista. El seguimiento no es público, no se comparte con otros pacientes y no aparece en ningún ranking. Es información estrictamente tuya, guardada de forma privada dentro de la app.",
    related: ["ps-36"],
    keywords: ["ver", "privacidad", "quién", "acceso"],
  },
  {
    id: "ps-36",
    section: "portal-seguimiento",
    question: "¿Es privado mi seguimiento?",
    answer:
      "Totalmente. Solo tú, desde tu cuenta, y tu nutricionista, desde la suya, podéis ver lo que registras. No se publica en ningún sitio ni se comparte con familiares ni con otros profesionales sin tu permiso explícito.",
    related: ["ps-35", "ps-47"],
    keywords: ["privado", "privacidad", "seguridad"],
  },
  {
    id: "ps-37",
    section: "portal-seguimiento",
    question: "¿Cuáles son los datos por defecto de un día nuevo?",
    answer:
      "Un día nuevo empieza con agua a 0 ml, ejercicio marcado como \"no\", todas las comidas vacías y sin notas. Nada está relleno de antemano: lo que aparezca ahí dentro lo has puesto tú. Así evitamos falsos registros heredados de días anteriores.",
    related: ["ps-38"],
    keywords: ["por defecto", "valores", "inicial"],
  },
  {
    id: "ps-38",
    section: "portal-seguimiento",
    question: "¿Qué veo si todavía no hay datos de hoy?",
    answer:
      "Verás una pantalla con las tarjetas vacías: el contador de agua a 0, el ejercicio en \"no\", las comidas en blanco. Puede haber un pequeño mensaje invitándote a empezar a registrar. Es tu punto de partida diario.",
    related: ["ps-37"],
    keywords: ["vacío", "sin datos", "hoy"],
  },
  {
    id: "ps-39",
    section: "portal-seguimiento",
    question: "¿Recibo notificaciones push si no registro un día?",
    answer:
      "No por defecto. Ahora mismo la app no te manda notificaciones push al móvil para recordarte el seguimiento. Si necesitas un recordatorio, lo más práctico es ponerte una alarma fija en tu propio móvil a una hora concreta del día.",
    related: ["ps-40"],
    keywords: ["push", "notificaciones", "móvil"],
  },
  {
    id: "ps-40",
    section: "portal-seguimiento",
    question: "¿Hay un recordatorio diario automático?",
    answer:
      "No, de momento no hay un recordatorio diario activado por defecto. La idea es que tú decidas tu propia rutina (por ejemplo, rellenar el seguimiento justo después de cenar). Si en el futuro se añaden recordatorios, serán opcionales.",
    related: ["ps-39"],
    keywords: ["recordatorio", "diario", "aviso"],
  },
  {
    id: "ps-41",
    section: "portal-seguimiento",
    question: "¿Hay rachas o insignias por registrar varios días seguidos?",
    answer:
      "No, el seguimiento no usa sistema de rachas, logros ni recompensas tipo juego. La motivación viene del propio progreso que ves en tu vista mensual y del diálogo con tu nutri, no de puntos virtuales.",
    related: ["ps-42", "ps-43"],
    keywords: ["rachas", "insignias", "gamificación"],
  },
  {
    id: "ps-42",
    section: "portal-seguimiento",
    question: "¿Recibo recompensas por cumplir el plan?",
    answer:
      "No, Annonia no da recompensas, medallas ni premios por cumplir. El enfoque es clínico, no de juego. La \"recompensa\" es ver que tus datos mejoran con el tiempo y que tu nutri puede ajustarte el plan con información real.",
    related: ["ps-41"],
    keywords: ["recompensas", "premios", "medallas"],
  },
  {
    id: "ps-43",
    section: "portal-seguimiento",
    question: "¿Cómo me mantengo motivado con el seguimiento?",
    answer:
      "Más que pensar en rachas, céntrate en la foto mensual: ver muchos días marcados da mucha más satisfacción que un contador. Habla con tu nutri sobre lo que ves, pon notas honestas y recuerda que esto no es un examen, sino una herramienta para entenderte mejor.",
    related: ["ps-41", "ps-44"],
    keywords: ["motivación", "ánimo", "constancia"],
  },
  {
    id: "ps-44",
    section: "portal-seguimiento",
    question: "¿Y si me da vergüenza poner lo que realmente he comido?",
    answer:
      "Es un sentimiento muy normal, pero el seguimiento funciona mejor cuanto más honesto es. Tu nutri no está para juzgarte: está para ayudarte. Un registro real, aunque incluya un día libre o un exceso, vale mil veces más que uno adornado que no refleja la realidad.",
    related: ["ps-26", "ps-60"],
    keywords: ["vergüenza", "honestidad", "real"],
  },
  {
    id: "ps-45",
    section: "portal-seguimiento",
    question: "¿Puedo comparar una semana con otra?",
    answer:
      "No hay aún una vista de comparación directa entre semanas, pero puedes navegar por el calendario y revisar visualmente cómo fue cada semana. Si te interesa un análisis más profundo, coméntalo en consulta: tu nutri sí ve gráficos semanales en su panel.",
    related: ["ps-29", "ps-46"],
    keywords: ["comparar", "semanas", "semana"],
  },
  {
    id: "ps-46",
    section: "portal-seguimiento",
    question: "¿Puedo exportar mi seguimiento a PDF?",
    answer:
      "Sí, desde el portal puedes usar la opción Exportar PDF para descargarte un resumen con tus seguimientos. Es útil si quieres llevar el registro impreso a una consulta presencial o guardarlo como respaldo.",
    related: ["ps-29"],
    keywords: ["exportar", "PDF", "descargar"],
  },
  {
    id: "ps-47",
    section: "portal-seguimiento",
    question: "¿Puedo compartir mi seguimiento con mi familia?",
    answer:
      "No hay una opción dentro de la app para compartir tu seguimiento con otra persona que no sea tu nutri. Si quieres mostrárselo a tu familia, lo más sencillo es enseñarles la pantalla o exportar un PDF y pasárselo tú.",
    related: ["ps-35", "ps-46"],
    keywords: ["compartir", "familia", "compañero"],
  },
  {
    id: "ps-48",
    section: "portal-seguimiento",
    question: "¿Funciona el seguimiento con tema claro y oscuro?",
    answer:
      "Sí, todo el seguimiento respeta el tema claro u oscuro que tengas elegido en el portal. Los colores de check y cruz, las barras de agua y los gráficos se adaptan para que se lean bien en ambos modos.",
    related: ["ps-31"],
    keywords: ["tema", "claro", "oscuro", "modo"],
  },
  {
    id: "ps-49",
    section: "portal-seguimiento",
    question: "¿Qué hago si la cifra de agua se descuadra?",
    answer:
      "Si al sumar te has pasado, pulsa el botón - con la cantidad correspondiente hasta dejar el valor real. Si necesitas reiniciar, bájalo a 0 y empieza de nuevo. El número que ves en pantalla es el que se guarda, así que ajusta hasta que cuadre con lo que de verdad has bebido.",
    related: ["ps-4", "ps-5"],
    keywords: ["corregir", "agua", "descuadra"],
  },
  {
    id: "ps-50",
    section: "portal-seguimiento",
    question: "¿Y si un día no hago ninguna comida registrada (ayuno, enfermedad)?",
    answer:
      "Déjalas en blanco y explícalo en las notas: por ejemplo \"día de ayuno\" o \"virus estomacal, solo agua e infusión\". Así tu nutri entiende que no te has saltado el registro, sino que realmente ha sido un día distinto. No marques el día como cumplido si no corresponde.",
    related: ["ps-18", "ps-26"],
    keywords: ["ayuno", "enfermedad", "sin comer"],
  },
  {
    id: "ps-51",
    section: "portal-seguimiento",
    question: "¿Puedo registrar tentempiés fuera de las comidas fijas?",
    answer:
      "Sí, para eso están Media mañana, Merienda y Recena. Si te has tomado algo entre horas que no encaja en ninguna, añádelo al bloque más cercano (por ejemplo, un café de media tarde en Merienda). Lo importante es que quede registrado.",
    related: ["ps-11", "ps-12"],
    keywords: ["tentempié", "snack", "entre horas"],
  },
  {
    id: "ps-52",
    section: "portal-seguimiento",
    question: "¿Cuántos días atrás puedo editar?",
    answer:
      "En general puedes editar días pasados sin un límite rígido dentro del mismo historial. Dicho esto, es buena práctica actualizar cuanto antes, porque cuanto más fresco tengas el recuerdo, más fiel será el registro.",
    related: ["ps-24", "ps-29"],
    keywords: ["editar", "atrás", "límite"],
  },
  {
    id: "ps-53",
    section: "portal-seguimiento",
    question: "¿Qué hace mi nutri con los datos que registro?",
    answer:
      "Los revisa para ver tu adherencia, detectar patrones (comidas que sueles saltarte, días de la semana más flojos, poco líquido, etc.) y ajustar el plan en consecuencia. También los usa para entender tu contexto antes de una cita, así tú no tienes que contarlo todo desde cero.",
    related: ["ps-33", "ps-60"],
    keywords: ["nutri", "usa datos", "para qué"],
  },
  {
    id: "ps-54",
    section: "portal-seguimiento",
    question: "¿Tengo que rellenar todo perfecto cada día?",
    answer:
      "No. Es mejor un registro breve pero diario que uno perfecto un día y nada los demás. Aunque solo apuntes el agua y marques si has hecho ejercicio, ya es información útil. Pon lo que puedas sin agobiarte.",
    related: ["ps-43", "ps-55"],
    keywords: ["perfecto", "completo", "obligatorio"],
  },
  {
    id: "ps-55",
    section: "portal-seguimiento",
    question: "¿Cuánto tiempo se tarda en rellenar un día?",
    answer:
      "Con práctica, entre dos y cinco minutos: unos toques en los botones del agua, una frase por comida, un minuto para las notas. Si lo haces al acabar el día, se convierte en una rutina muy corta.",
    related: ["ps-31", "ps-54"],
    keywords: ["tiempo", "rápido", "minutos"],
  },
  {
    id: "ps-56",
    section: "portal-seguimiento",
    question: "¿Puedo borrar un día completo?",
    answer:
      "Puedes vaciar los campos y desmarcar el cumplimiento, dejándolo como si no hubieses registrado nada. No hay un botón único que \"elimine\" todo el día, pero ajustando cada campo manualmente consigues el mismo efecto.",
    related: ["ps-27", "ps-49"],
    keywords: ["borrar", "eliminar", "día"],
  },
  {
    id: "ps-57",
    section: "portal-seguimiento",
    question: "¿El seguimiento cuenta mis pasos o actividad del móvil?",
    answer:
      "No. Por ahora no se conecta con podómetros, relojes ni apps externas tipo Google Fit o Apple Health. Todo lo que ves en ejercicio lo has introducido manualmente tú. Si usas un reloj, tendrás que copiar los datos a mano.",
    related: ["ps-7", "ps-9"],
    keywords: ["pasos", "wearables", "reloj"],
  },
  {
    id: "ps-58",
    section: "portal-seguimiento",
    question: "¿Puedo registrar el peso desde aquí?",
    answer:
      "El peso se gestiona en otra pantalla del portal pensada para pesos y medidas corporales. En el seguimiento diario te centras en hábitos (agua, ejercicio, comidas, notas), no en la báscula. Así evitas obsesionarte con la cifra del peso cada día.",
    related: ["ps-3"],
    keywords: ["peso", "báscula", "registrar"],
  },
  {
    id: "ps-59",
    section: "portal-seguimiento",
    question: "¿Y si no entiendo algún campo del seguimiento?",
    answer:
      "Puedes abrir el widget de ayuda desde el portal y buscar la duda concreta (agua, macros, calendario, etc.). Si aun así no te queda claro, pregunta a tu nutri en la próxima consulta o por mensaje interno: cualquier duda sobre cómo registrar es legítima.",
    related: ["ps-1", "ps-3"],
    keywords: ["ayuda", "dudas", "no entiendo"],
  },
  {
    id: "ps-60",
    section: "portal-seguimiento",
    question: "¿Algún consejo final para sacarle partido al seguimiento?",
    answer:
      "Sé honesto, sé constante y no busques la perfección. Rellena a la misma hora cada día (por ejemplo, justo después de cenar), pon en notas lo que no encaje en los campos y trata el seguimiento como un diario útil, no como un control. Así se convierte en una herramienta potente, no en una obligación.",
    related: ["ps-43", "ps-44", "ps-53"],
    keywords: ["consejos", "final", "partido"],
  },
];
