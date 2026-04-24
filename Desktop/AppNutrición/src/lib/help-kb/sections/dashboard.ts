import type { HelpEntry } from "../types";

export const DASHBOARD_ENTRIES: HelpEntry[] = [
  {
    id: "dash-1",
    section: "dashboard",
    question: "¿Qué es el dashboard de Annonia?",
    answer:
      "El dashboard es la página principal del nutricionista, accesible en la ruta `/dashboard`. Funciona como un centro de mando donde ves de un vistazo tu próxima consulta, la última notificación, un gráfico con la evolución de tu actividad y accesos rápidos para crear pacientes, planes, citas o recetas. Está pensado para que en menos de diez segundos sepas qué tienes que hacer hoy y puedas empezar a trabajar. Es también la primera pantalla que se carga al iniciar sesión.",
    related: ["dash-2", "dash-3", "dash-7"],
    keywords: ["dashboard", "inicio", "panel", "principal"],
  },
  {
    id: "dash-2",
    section: "dashboard",
    question: "¿Para qué sirve el dashboard en mi día a día?",
    answer:
      "Sirve para tener una visión rápida de tu jornada y de la evolución de tu consulta sin tener que navegar a distintos apartados. Desde el dashboard puedes abrir directamente la próxima cita, leer la última notificación o lanzar las acciones más habituales con un solo clic. También te permite comparar tu actividad de los últimos seis meses gracias al gráfico. Es la pantalla recomendada para empezar y terminar el día de trabajo.",
    related: ["dash-1", "dash-11", "dash-19"],
    keywords: ["uso", "día", "flujo", "productividad"],
  },
  {
    id: "dash-3",
    section: "dashboard",
    question: "¿Cómo accedo al dashboard?",
    answer:
      "Al iniciar sesión como nutricionista se te redirige automáticamente a `/dashboard`. También puedes volver en cualquier momento haciendo clic en el icono `LayoutDashboard` del sidebar izquierdo o en el logo de Annonia en la parte superior. Si estás en una pantalla interna (un paciente, una dieta, etc.) ese icono te devuelve al dashboard sin perder tu sesión. En móvil, el menú lateral se abre con el botón de hamburguesa.",
    related: ["dash-1", "dash-44", "dash-48"],
    keywords: ["acceso", "ruta", "navegación", "sidebar"],
  },
  {
    id: "dash-4",
    section: "dashboard",
    question: "¿Qué significa el saludo personalizado de la parte superior?",
    answer:
      "En la cabecera del dashboard ves un saludo que cambia según la hora de Madrid: \"Buenos días\" entre las 6 y las 13, \"Buenas tardes\" entre las 13 y las 21 y \"Buenas noches\" el resto del día. El saludo va acompañado de tu nombre para que la bienvenida sea personal. El objetivo es dar un toque cercano y que notes que la aplicación está sincronizada con tu horario real. Si viajas a otra zona horaria, el saludo seguirá basándose en la hora peninsular española.",
    related: ["dash-5", "dash-6"],
    keywords: ["saludo", "bienvenida", "nombre", "personalizado"],
  },
  {
    id: "dash-5",
    section: "dashboard",
    question: "¿Por qué el saludo dice \"Buenos días\" si ya es tarde?",
    answer:
      "El saludo depende exclusivamente de la hora local de Madrid, no del idioma del sistema ni de la hora del dispositivo. Si tu ordenador está mal configurado o estás en otra zona horaria, el saludo seguirá mostrando el de Madrid, que es la referencia de Annonia. Los cortes son 6:00, 13:00 y 21:00. Si ves un saludo que te parece incorrecto, revisa primero si tu reloj local coincide con el peninsular.",
    related: ["dash-4", "dash-6"],
    keywords: ["hora", "madrid", "zona horaria", "saludo"],
  },
  {
    id: "dash-6",
    section: "dashboard",
    question: "¿Qué fecha y hora se muestran bajo el saludo?",
    answer:
      "Bajo el saludo aparece la fecha completa (día de la semana, día, mes y año) y la hora actual de Madrid en formato 24 horas. La hora se actualiza automáticamente cada minuto sin que tengas que recargar la página. Sirve para tener siempre presente el momento del día cuando estás atendiendo pacientes. La fecha se formatea en castellano con tildes y en minúsculas excepto el día, siguiendo el estilo habitual en España.",
    related: ["dash-4", "dash-5", "dash-34"],
    keywords: ["fecha", "hora", "reloj", "madrid"],
  },
  {
    id: "dash-7",
    section: "dashboard",
    question: "¿Qué muestra la tarjeta \"Próxima consulta\"?",
    answer:
      "La tarjeta grande de \"Próxima consulta\" muestra el avatar y el nombre del paciente, la hora exacta de inicio, la duración estimada y el motivo principal de la cita. Es la primera cita confirmada que tienes por delante desde el momento actual, independientemente del día. Está pensada para que sepas a quién vas a ver sin tener que entrar en la agenda. Si haces clic en la tarjeta, se abre la ficha del paciente o el detalle de la cita.",
    related: ["dash-8", "dash-9", "dash-10"],
    keywords: ["próxima", "consulta", "cita", "tarjeta"],
  },
  {
    id: "dash-8",
    section: "dashboard",
    question: "¿Cómo abro la próxima consulta desde el dashboard?",
    answer:
      "Basta con hacer clic o tocar sobre la tarjeta de \"Próxima consulta\" para navegar al detalle de la cita o directamente a la ficha del paciente. Desde ahí puedes ver sus mediciones, su plan, sus consultas pasadas o crear nuevos entregables. También dispones de un acceso rápido a la agenda en caso de que quieras ver el contexto completo del día. Si el paciente tiene alertas importantes aparecerán resaltadas al abrir su ficha.",
    related: ["dash-7", "dash-9", "dash-10"],
    keywords: ["abrir", "consulta", "clic", "navegación"],
  },
  {
    id: "dash-9",
    section: "dashboard",
    question: "¿Qué ocurre si no tengo ninguna cita programada?",
    answer:
      "Si no hay ninguna cita futura, la tarjeta de \"Próxima consulta\" muestra un estado vacío con un mensaje del estilo \"No tienes ninguna consulta próxima\" y un botón que te lleva a crear una nueva cita. Es la forma que tiene el dashboard de animarte a seguir moviendo tu agenda. El resto del dashboard sigue funcionando con normalidad: gráfica, notificaciones y accesos rápidos. No verás avatares ni horas ficticias.",
    related: ["dash-7", "dash-10", "dash-23"],
    keywords: ["vacío", "sin citas", "estado", "ninguna"],
  },
  {
    id: "dash-10",
    section: "dashboard",
    question: "¿La próxima consulta se actualiza sola?",
    answer:
      "Sí. Cada vez que cargas el dashboard o vuelves a él, Annonia consulta de nuevo la primera cita futura y repinta la tarjeta. Si acabas una consulta y vuelves al dashboard, la siguiente cita pasará automáticamente a ocupar el hueco. También se actualiza si cancelas o cambias la hora de una cita. No necesitas pulsar ningún botón de refrescar para ver el estado correcto.",
    related: ["dash-7", "dash-34", "dash-35"],
    keywords: ["actualización", "refresco", "automático", "tiempo real"],
  },
  {
    id: "dash-11",
    section: "dashboard",
    question: "¿Qué muestra la tarjeta \"Última notificación\"?",
    answer:
      "La tarjeta pequeña de \"Última notificación\" muestra la notificación más reciente que has recibido, ya sea un mensaje de un paciente, una incidencia de agenda o cualquier otro aviso del sistema. Incluye un icono, un título corto y la fecha u hora relativa. Está pensada para que no se te pase nada sin tener que abrir el panel de notificaciones completo. Al hacer clic te lleva al detalle o al bell en el sidebar.",
    related: ["dash-12", "dash-40", "dash-41"],
    keywords: ["notificación", "aviso", "última", "tarjeta"],
  },
  {
    id: "dash-12",
    section: "dashboard",
    question: "¿Y si no tengo ninguna notificación reciente?",
    answer:
      "Cuando no hay notificaciones, la tarjeta muestra un estado vacío con un mensaje tipo \"Estás al día\" o \"Sin notificaciones\" para que sepas que no se ha quedado nada por leer. No aparece ningún icono rojo ni contador. Puede ser habitual al empezar a usar la aplicación o tras revisar todas tus notificaciones. En cuanto llegue un nuevo aviso, la tarjeta se rellenará automáticamente.",
    related: ["dash-11", "dash-40", "dash-41"],
    keywords: ["sin notificaciones", "vacío", "al día", "estado"],
  },
  {
    id: "dash-13",
    section: "dashboard",
    question: "¿Qué representa la gráfica \"Tu actividad\"?",
    answer:
      "El gráfico \"Tu actividad\" es una comparativa de tu evolución en los últimos seis meses, con dos líneas: una azul para las consultas y otra verde para los pacientes totales. Cada punto del eje X representa un mes y el eje Y el número correspondiente. La idea es que veas de un vistazo si tu consulta crece, se estanca o baja. Es una herramienta de negocio más que clínica.",
    related: ["dash-14", "dash-15", "dash-16"],
    keywords: ["gráfica", "actividad", "evolución", "métricas"],
  },
  {
    id: "dash-14",
    section: "dashboard",
    question: "¿Qué significa la línea azul del gráfico?",
    answer:
      "La línea azul representa el número de consultas realizadas cada mes durante los últimos seis meses. Se cuentan las citas completadas en ese periodo, no las programadas a futuro ni las canceladas. Sirve para medir tu volumen real de trabajo mes a mes. Si un mes ves un bajón claro, puede deberse a vacaciones, festivos o simplemente menos demanda.",
    related: ["dash-13", "dash-15", "dash-17"],
    keywords: ["azul", "consultas", "línea", "mensual"],
  },
  {
    id: "dash-15",
    section: "dashboard",
    question: "¿Qué significa la línea verde del gráfico?",
    answer:
      "La línea verde representa el total acumulado de pacientes hasta cada mes, no los nuevos pacientes de ese mes. Es decir, siempre es creciente o plana, nunca debería bajar. Te permite ver cómo ha crecido tu cartera a lo largo del tiempo. Si en un mes la línea se aplana, quiere decir que no has dado de alta a nadie nuevo en ese periodo.",
    related: ["dash-13", "dash-14", "dash-16"],
    keywords: ["verde", "pacientes", "acumulado", "total"],
  },
  {
    id: "dash-16",
    section: "dashboard",
    question: "¿La línea verde son pacientes nuevos o pacientes totales?",
    answer:
      "Son pacientes totales acumulados, no altas nuevas. Cada punto muestra cuántos pacientes tenías en tu cartera al cerrar ese mes, sumando los de meses anteriores. Por eso la línea nunca baja salvo que elimines pacientes manualmente. Si quieres ver altas nuevas por periodo, tienes que ir a la sección de pacientes y filtrar por fecha de creación. En el dashboard la métrica elegida es la de cartera total porque suele ser la más representativa.",
    related: ["dash-15", "dash-17", "dash-18"],
    keywords: ["acumulado", "totales", "nuevos", "altas"],
  },
  {
    id: "dash-17",
    section: "dashboard",
    question: "¿Qué rango temporal cubre el gráfico?",
    answer:
      "El gráfico cubre los últimos seis meses naturales, incluido el mes actual. Cada punto corresponde al cierre de un mes y el último punto refleja el estado del mes en curso hasta el momento de la consulta. No puedes cambiar este rango desde el propio dashboard: está pensado para ser una foto corta y útil. Si necesitas análisis más largos, la sección de reportes ofrece rangos personalizados.",
    related: ["dash-13", "dash-18", "dash-45"],
    keywords: ["rango", "6 meses", "periodo", "histórico"],
  },
  {
    id: "dash-18",
    section: "dashboard",
    question: "¿Cómo interactúo con el gráfico \"Tu actividad\"?",
    answer:
      "Al pasar el ratón por encima de cualquier punto aparece un tooltip que muestra el mes y los valores exactos de ambas líneas, consultas y pacientes totales. También puedes ver la leyenda en la parte superior para distinguir colores. En móvil, puedes tocar los puntos para que salga el mismo tooltip. El gráfico es responsivo y se adapta al ancho disponible del dashboard.",
    related: ["dash-13", "dash-20", "dash-46"],
    keywords: ["tooltip", "interactuar", "hover", "ratón"],
  },
  {
    id: "dash-19",
    section: "dashboard",
    question: "¿El paciente de demostración cuenta en el gráfico?",
    answer:
      "No. El paciente de demostración \"Prueba\" se excluye expresamente de los cálculos del gráfico \"Tu actividad\" para que no distorsione tus métricas reales. Tampoco se cuentan las consultas asociadas a ese paciente ficticio. Esto asegura que tanto la línea azul como la verde reflejen sólo tu actividad real con pacientes de verdad. Si eliminas al paciente de demostración, el gráfico se mantendrá exactamente igual.",
    related: ["dash-13", "dash-15", "dash-20"],
    keywords: ["prueba", "demo", "demostración", "excluido"],
  },
  {
    id: "dash-20",
    section: "dashboard",
    question: "¿Por qué mi gráfico aparece vacío o plano?",
    answer:
      "Si acabas de empezar y todavía no tienes pacientes ni consultas registradas, el gráfico puede verse plano en cero o con muy pocos datos. En cuanto des de alta pacientes reales y registres citas, las líneas empezarán a moverse. También puede ocurrir que tus únicos datos sean del paciente de demostración, que se excluye del cálculo. Revisa que tengas al menos un paciente real creado para empezar a ver actividad.",
    related: ["dash-19", "dash-21", "dash-50"],
    keywords: ["vacío", "plano", "sin datos", "cero"],
  },
  {
    id: "dash-21",
    section: "dashboard",
    question: "¿Qué son los accesos rápidos del dashboard?",
    answer:
      "Los accesos rápidos son cuatro tiles coloridos situados en la parte inferior del dashboard que abren los formularios de creación más habituales: Nuevo paciente, Nuevo plan, Nueva cita y Nueva receta. Cada tile lleva un icono y un título breve, y un solo clic basta para lanzar la acción. Están agrupados bajo un encabezado con el icono `Zap` que los identifica como atajos. Son la forma más rápida de empezar a trabajar sin pasar por menús.",
    related: ["dash-22", "dash-23", "dash-24"],
    keywords: ["accesos rápidos", "tiles", "atajos", "acciones"],
  },
  {
    id: "dash-22",
    section: "dashboard",
    question: "¿Qué hace el tile \"Nuevo paciente\"?",
    answer:
      "El tile \"Nuevo paciente\" te lleva directamente al formulario de alta de paciente, donde puedes rellenar nombre, email, teléfono, fecha de nacimiento y datos clínicos iniciales. Es equivalente a ir a la sección de pacientes y pulsar el botón de crear. Está pensado para cuando quieres registrar un paciente nuevo nada más iniciar sesión. Al guardar, el paciente queda disponible en toda la aplicación.",
    related: ["dash-21", "dash-23", "dash-24"],
    keywords: ["nuevo paciente", "alta", "crear", "registro"],
  },
  {
    id: "dash-23",
    section: "dashboard",
    question: "¿Qué hace el tile \"Nueva cita\"?",
    answer:
      "El tile \"Nueva cita\" abre el formulario de creación de cita desde cualquier lugar del dashboard. Te permite elegir paciente, fecha, hora, duración y motivo, igual que desde la agenda. Es especialmente útil cuando acabas de colgar una llamada con un paciente y quieres registrar el próximo encuentro sin pasos intermedios. Una vez creada, la cita aparece en tu agenda y puede actualizar la tarjeta de \"Próxima consulta\".",
    related: ["dash-7", "dash-21", "dash-25"],
    keywords: ["nueva cita", "agenda", "crear cita", "programar"],
  },
  {
    id: "dash-24",
    section: "dashboard",
    question: "¿Qué hace el tile \"Nuevo plan\"?",
    answer:
      "El tile \"Nuevo plan\" lanza el asistente de creación de un plan de alimentación, bien desde cero o bien a partir de una plantilla. Antes de empezar tendrás que seleccionar el paciente al que asignarás el plan. Es un atajo para cuando quieres construir una dieta sin pasar por el perfil del paciente primero. Todos los cambios quedan guardados en el módulo de dietas una vez finalizas el asistente.",
    related: ["dash-21", "dash-25", "dash-27"],
    keywords: ["nuevo plan", "dieta", "plan alimentación", "crear"],
  },
  {
    id: "dash-25",
    section: "dashboard",
    question: "¿Qué hace el tile \"Nueva receta\"?",
    answer:
      "El tile \"Nueva receta\" abre el editor de recetas para que puedas registrar una receta propia con ingredientes, cantidades y raciones. Las recetas creadas desde aquí se guardan en tu biblioteca privada y puedes reutilizarlas en cualquier plan futuro. Es el camino más corto cuando acabas de inventar o adaptar una receta y quieres dejarla guardada antes de que se te olvide. Después podrás marcarla como favorita o compartirla en un plan.",
    related: ["dash-21", "dash-24", "dash-26"],
    keywords: ["nueva receta", "receta", "biblioteca", "crear"],
  },
  {
    id: "dash-26",
    section: "dashboard",
    question: "¿Puedo cambiar el orden de los accesos rápidos?",
    answer:
      "Actualmente no. Los cuatro accesos rápidos (Nuevo paciente, Nuevo plan, Nueva cita y Nueva receta) están en un orden fijo pensado para cubrir el flujo más habitual en consulta. No hay opción de personalización por usuario en esta versión. Si tienes una propuesta de reordenación o de nuevos atajos, puedes escribirlo al equipo desde la sección de ajustes. La idea a futuro es permitir personalizar este bloque.",
    related: ["dash-21", "dash-22", "dash-25"],
    keywords: ["orden", "personalizar", "cambiar", "configurar"],
  },
  {
    id: "dash-27",
    section: "dashboard",
    question: "¿Puedo quitar o añadir tiles al dashboard?",
    answer:
      "De momento el dashboard tiene un diseño cerrado con sus cuatro tiles, dos tarjetas y gráfico. No es posible quitar elementos ni añadir widgets adicionales. Esto se hizo para que la primera pantalla sea limpia y consistente entre nutricionistas. Si tienes peticiones concretas, puedes enviarlas al equipo; algunas se tienen en cuenta para futuras versiones.",
    related: ["dash-21", "dash-26", "dash-47"],
    keywords: ["personalizar", "widgets", "configurable", "layout"],
  },
  {
    id: "dash-28",
    section: "dashboard",
    question: "¿Qué icono identifica al dashboard en el sidebar?",
    answer:
      "En el sidebar izquierdo, el dashboard se identifica con el icono `LayoutDashboard`, un cuadrado con divisiones internas que representa el panel de control. Está situado en la parte superior de la lista de secciones junto al texto \"Dashboard\". Al pasar el ratón se resalta con el color de acento de Annonia. Hacer clic en él te lleva siempre a `/dashboard` sin importar dónde estuvieras antes.",
    related: ["dash-3", "dash-29", "dash-48"],
    keywords: ["icono", "layoutdashboard", "sidebar", "identificación"],
  },
  {
    id: "dash-29",
    section: "dashboard",
    question: "¿Qué representa el icono `Zap` en el dashboard?",
    answer:
      "El icono `Zap` (un rayo) encabeza la sección de accesos rápidos en la parte inferior del dashboard. Su función es puramente visual: indica que lo que viene a continuación son acciones ágiles que se ejecutan con un solo clic. Refuerza la idea de rapidez junto al título \"Accesos rápidos\". No es interactivo por sí mismo, sólo decora el encabezado.",
    related: ["dash-21", "dash-28", "dash-30"],
    keywords: ["zap", "rayo", "icono", "accesos rápidos"],
  },
  {
    id: "dash-30",
    section: "dashboard",
    question: "¿Qué es el icono `Bell` del dashboard?",
    answer:
      "El icono `Bell` (campana) se utiliza tanto en la tarjeta de \"Última notificación\" como en el bell del sidebar. Indica que estamos ante un aviso o una alerta. Cuando tienes notificaciones sin leer, junto al bell del sidebar aparece un contador con el número pendiente. El que aparece en la tarjeta del dashboard es meramente visual y no lleva contador.",
    related: ["dash-11", "dash-40", "dash-41"],
    keywords: ["bell", "campana", "notificación", "icono"],
  },
  {
    id: "dash-31",
    section: "dashboard",
    question: "¿Qué otros iconos aparecen en el dashboard?",
    answer:
      "Además de `LayoutDashboard`, `Zap` y `Bell`, el dashboard usa iconos como `Users` para el tile de paciente, `Utensils` o `UtensilsCrossed` para recetas y planes, `Calendar` para la nueva cita y `Clock` para la duración de la próxima consulta. Todos siguen el set de Lucide, con un estilo fino y coherente. Su función principal es ayudar a identificar rápidamente cada bloque sin leer los textos. Los colores de fondo de los tiles también siguen un patrón consistente.",
    related: ["dash-28", "dash-29", "dash-30"],
    keywords: ["iconos", "lucide", "users", "calendar"],
  },
  {
    id: "dash-32",
    section: "dashboard",
    question: "¿El dashboard respeta el tema claro y oscuro?",
    answer:
      "Sí. Todo el dashboard, incluidos tarjetas, gráfico, tiles e iconos, respeta el tema claro u oscuro que tengas configurado en ajustes. El gráfico adapta automáticamente el color de las cuadrículas y el texto para mantener un buen contraste. Si cambias el tema desde ajustes, el dashboard se recarga con los nuevos colores sin perder datos. Es una personalización global que se aplica en toda la aplicación.",
    related: ["dash-1", "dash-33", "dash-46"],
    keywords: ["tema", "claro", "oscuro", "dark mode"],
  },
  {
    id: "dash-33",
    section: "dashboard",
    question: "¿Se puede forzar el dashboard siempre en oscuro?",
    answer:
      "No desde el propio dashboard, pero sí desde los ajustes del nutricionista. Allí puedes elegir entre tema claro, oscuro o seguir el tema del sistema operativo. Esa elección se guarda en tu perfil y se aplica a todas las pantallas, incluido el dashboard. No hay opción distinta solo para el dashboard.",
    related: ["dash-32", "dash-44"],
    keywords: ["oscuro", "forzar", "tema", "ajustes"],
  },
  {
    id: "dash-34",
    section: "dashboard",
    question: "¿Cada cuánto se refresca el dashboard?",
    answer:
      "El dashboard se refresca cada vez que lo abres o navegas a él, volviendo a consultar la próxima cita, la última notificación y los datos del gráfico. La hora actual de Madrid se actualiza en vivo cada minuto. No hay un polling constante para evitar consumir ancho de banda, por lo que si dejas la pestaña abierta sin interactuar, puede que necesites hacer un pequeño clic o recargar para ver cambios nuevos. En general no hace falta.",
    related: ["dash-10", "dash-35", "dash-37"],
    keywords: ["refresco", "actualización", "polling", "tiempo"],
  },
  {
    id: "dash-35",
    section: "dashboard",
    question: "¿Tengo que recargar la página para ver los cambios?",
    answer:
      "En la mayoría de casos no. El dashboard consulta la información al entrar o al volver desde otra pantalla de la aplicación, así que crear una cita desde la agenda y volver al dashboard es suficiente para ver la próxima cita actualizada. Si has cambiado datos importantes en otra pestaña o dispositivo, puedes usar F5 para forzar una recarga. El reloj de Madrid se actualiza por sí solo cada minuto sin recargar.",
    related: ["dash-10", "dash-34", "dash-36"],
    keywords: ["recargar", "f5", "cambios", "refresh"],
  },
  {
    id: "dash-36",
    section: "dashboard",
    question: "¿Qué pasa si abro el dashboard en varias pestañas?",
    answer:
      "Cada pestaña abre su propia copia del dashboard y hace su propia consulta al servidor al cargar. No hay sincronización automática entre pestañas, así que si creas una cita en una, necesitarás refrescar la otra para verla reflejada. Es una práctica segura mientras estés trabajando con la misma cuenta. Si cierras sesión en una pestaña, las demás perderán la sesión también al siguiente intento de acción.",
    related: ["dash-34", "dash-35", "dash-37"],
    keywords: ["pestañas", "multitab", "varias", "sincronización"],
  },
  {
    id: "dash-37",
    section: "dashboard",
    question: "¿El dashboard sigue activo si dejo el ordenador bloqueado?",
    answer:
      "Sí, mientras tu sesión no caduque. Si dejas el ordenador bloqueado y vuelves más tarde, la hora mostrada seguirá actualizándose y los datos se refrescarán en cuanto vuelvas a interactuar. Si tu sesión ha caducado por inactividad larga, te redirigirá al login la primera vez que intentes navegar o crear algo. En general no pierdes información por dejar el dashboard abierto.",
    related: ["dash-34", "dash-36", "dash-50"],
    keywords: ["sesión", "bloqueado", "inactividad", "caducidad"],
  },
  {
    id: "dash-38",
    section: "dashboard",
    question: "¿Cómo se ve el dashboard en móvil?",
    answer:
      "En móvil, el dashboard reorganiza sus bloques en una sola columna: primero la cabecera con saludo, fecha y hora, después las tarjetas de próxima consulta y última notificación, luego el gráfico y finalmente los accesos rápidos. Todos los elementos son táctiles y los tiles se hacen más grandes para facilitar el toque con el dedo. El sidebar se esconde tras un botón de menú hamburguesa. La experiencia está optimizada para pantallas pequeñas manteniendo toda la funcionalidad.",
    related: ["dash-39", "dash-46", "dash-48"],
    keywords: ["móvil", "responsive", "smartphone", "pantalla"],
  },
  {
    id: "dash-39",
    section: "dashboard",
    question: "¿Se ve bien el gráfico en pantallas pequeñas?",
    answer:
      "Sí. El gráfico \"Tu actividad\" es responsivo y se adapta al ancho disponible, reduciendo márgenes y etiquetas cuando detecta pantallas estrechas. Los meses del eje X pueden aparecer abreviados (ene, feb, mar...) para caber mejor. El tooltip funciona igual al tocar los puntos. Si tu móvil es muy pequeño puede que necesites girar a horizontal para ver con mayor comodidad los detalles.",
    related: ["dash-18", "dash-38", "dash-46"],
    keywords: ["gráfico", "móvil", "responsive", "pequeña"],
  },
  {
    id: "dash-40",
    section: "dashboard",
    question: "¿Cómo se relaciona el dashboard con el bell del sidebar?",
    answer:
      "El bell del sidebar es el panel completo de notificaciones; la tarjeta del dashboard es un resumen de la última. Cuando llega una nueva notificación, aparece tanto en el bell (incrementando el contador) como en la tarjeta del dashboard. Si marcas todas como leídas desde el bell, la tarjeta del dashboard sigue mostrando la última por referencia, pero el contador del bell desaparece. Ambos elementos comparten la misma fuente de datos.",
    related: ["dash-11", "dash-30", "dash-41"],
    keywords: ["bell", "sidebar", "relación", "notificaciones"],
  },
  {
    id: "dash-41",
    section: "dashboard",
    question: "¿Dónde veo todas mis notificaciones?",
    answer:
      "Para ver el listado completo de notificaciones, pulsa el bell del sidebar. Se desplegará un panel con todas las notificaciones recientes ordenadas por fecha, con iconos según tipo (mensaje, cita, alerta, etc.). Desde ahí puedes marcarlas como leídas o abrir la entrada relacionada. El dashboard solo muestra la última como atajo visual. Si necesitas un historial más largo, existe una sección específica de notificaciones.",
    related: ["dash-11", "dash-30", "dash-40"],
    keywords: ["todas", "listado", "bell", "historial"],
  },
  {
    id: "dash-42",
    section: "dashboard",
    question: "¿Puedo cerrar sesión desde el dashboard?",
    answer:
      "No directamente desde el dashboard, pero sí desde el menú de usuario en la esquina superior derecha o desde la sección de ajustes. Al pulsar \"Cerrar sesión\" se cierra de forma segura y te lleva a la pantalla de login. El dashboard y el resto de secciones quedarán protegidos hasta que vuelvas a autenticarte. Nunca se cierra sesión de forma automática desde el propio dashboard por acción del usuario.",
    related: ["dash-3", "dash-37", "dash-44"],
    keywords: ["logout", "cerrar sesión", "salir", "autenticación"],
  },
  {
    id: "dash-43",
    section: "dashboard",
    question: "¿Qué información del paciente se ve en \"Próxima consulta\"?",
    answer:
      "En la tarjeta se muestra el avatar (foto de perfil o iniciales en color), el nombre y los apellidos del paciente, la hora de inicio de la cita, la duración (por ejemplo, 30 o 45 minutos) y el motivo principal, como \"Revisión\" o \"Primera consulta\". No se muestran datos clínicos sensibles. Para ver toda la ficha, basta con hacer clic en la tarjeta. La información se respeta con el estilo visual de toda la aplicación.",
    related: ["dash-7", "dash-8", "dash-9"],
    keywords: ["paciente", "avatar", "motivo", "duración"],
  },
  {
    id: "dash-44",
    section: "dashboard",
    question: "¿Cómo vuelvo al dashboard desde cualquier pantalla?",
    answer:
      "Desde cualquier pantalla puedes volver al dashboard haciendo clic en el icono `LayoutDashboard` del sidebar izquierdo, en el logo de Annonia de la parte superior o escribiendo manualmente `/dashboard` en la barra de direcciones. En móvil, abre el menú hamburguesa y elige \"Dashboard\". El atajo de teclado estándar del navegador (Alt+flecha izquierda) también te devuelve al paso anterior si venías de ahí.",
    related: ["dash-3", "dash-28", "dash-48"],
    keywords: ["volver", "dashboard", "navegación", "atajo"],
  },
  {
    id: "dash-45",
    section: "dashboard",
    question: "¿Puedo exportar los datos del gráfico?",
    answer:
      "Desde el propio dashboard no hay opción de exportar directamente el gráfico. Para análisis más detallados o exportación en CSV/PDF, puedes ir a la sección de reportes, donde existen vistas ampliadas de pacientes y consultas con filtros de fecha. El gráfico del dashboard está pensado como vista rápida, no como herramienta analítica completa. Las métricas son las mismas en ambos sitios, la diferencia está en el formato y el nivel de detalle.",
    related: ["dash-13", "dash-17", "dash-46"],
    keywords: ["exportar", "csv", "pdf", "reportes"],
  },
  {
    id: "dash-46",
    section: "dashboard",
    question: "¿Puedo ampliar el gráfico \"Tu actividad\"?",
    answer:
      "No hay un modo pantalla completa específico para el gráfico, pero sí se puede ver con más holgura maximizando la ventana del navegador o cerrando el sidebar si está abierto. El gráfico siempre ocupará el ancho disponible del área principal del dashboard. Para ver más meses o comparativas distintas, la sección de reportes ofrece vistas dedicadas. El objetivo del dashboard es mantener la información condensada.",
    related: ["dash-18", "dash-39", "dash-45"],
    keywords: ["ampliar", "maximizar", "pantalla completa", "gráfico"],
  },
  {
    id: "dash-47",
    section: "dashboard",
    question: "¿Veo algo en el dashboard si no he creado ningún paciente?",
    answer:
      "Sí, el dashboard se carga igualmente, aunque con estados vacíos en la tarjeta de próxima consulta, la de última notificación y las líneas del gráfico aplanadas en cero. Los cuatro accesos rápidos están siempre activos, especialmente \"Nuevo paciente\", para animarte a dar de alta al primero. El saludo, la fecha y la hora aparecen con normalidad. En cuanto crees tu primer paciente real, el dashboard empezará a cobrar vida.",
    related: ["dash-9", "dash-12", "dash-20"],
    keywords: ["sin pacientes", "primer uso", "inicio", "vacío"],
  },
  {
    id: "dash-48",
    section: "dashboard",
    question: "¿En móvil puedo acceder al dashboard igual?",
    answer:
      "Sí. Al iniciar sesión en móvil también se te redirige a `/dashboard`. Puedes volver en cualquier momento abriendo el menú hamburguesa y tocando \"Dashboard\", o simplemente el logo de Annonia en la barra superior. La experiencia es totalmente equivalente a escritorio, aunque los bloques se apilen verticalmente. Todos los accesos rápidos son igual de funcionales con un toque.",
    related: ["dash-3", "dash-38", "dash-44"],
    keywords: ["móvil", "acceso", "hamburguesa", "app"],
  },
  {
    id: "dash-49",
    section: "dashboard",
    question: "¿Por qué no se ven mis datos en el dashboard?",
    answer:
      "Si el dashboard no muestra tus datos, comprueba que estás en la cuenta correcta (arriba a la derecha verás tu nombre), que tienes conexión a internet estable y que no hay avisos de error en la parte superior. Otro motivo habitual es tener solo al paciente de demostración, que se excluye del gráfico. Si el problema persiste, prueba a recargar con F5 y, si sigue fallando, cierra sesión y vuelve a entrar. Como último recurso, revisa la consola del navegador para ver mensajes de error.",
    related: ["dash-19", "dash-20", "dash-50"],
    keywords: ["sin datos", "error", "vacío", "problema"],
  },
  {
    id: "dash-50",
    section: "dashboard",
    question: "¿Qué errores comunes pueden impedir que cargue el dashboard?",
    answer:
      "Los motivos más frecuentes son: sesión caducada (te pedirá iniciar de nuevo), fallo de conexión con el servidor, bloqueadores del navegador que impiden peticiones, o problemas de caché si acabas de actualizar la app. Prueba primero a refrescar la página con F5. Si sigue sin cargar, cierra sesión, limpia la caché del navegador y vuelve a entrar. En caso extremo, abre en modo incógnito para descartar extensiones. Si nada funciona, contacta con soporte con una captura del error.",
    related: ["dash-37", "dash-42", "dash-49"],
    keywords: ["error", "no carga", "fallo", "soporte"],
  },
];
