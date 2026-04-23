import type { HelpEntry } from "../types";

export const AGENDA_HORARIO_ENTRIES: HelpEntry[] = [
  {
    id: "ah-1",
    section: "agenda-horario",
    question: "¿Qué es el horario laboral en AppNutrición?",
    answer:
      "El horario laboral es la configuración de los días y franjas horarias en los que atiendes a pacientes, accesible desde la ruta `/agenda/horario`. Define cuándo estás disponible para recibir solicitudes de cita y sirve como base para que el portal del paciente sepa qué huecos ofrecer. Se guarda en el campo `horarioLaboral` (JSONB) de tu ficha de dietista y se aplica automáticamente a todos tus pacientes. Sin un horario configurado, los pacientes no pueden solicitar cita a través del portal.",
    related: ["ah-2", "ah-3", "ah-9"],
    keywords: ["horario", "laboral", "configuración", "disponibilidad"],
  },
  {
    id: "ah-2",
    section: "agenda-horario",
    question: "¿Cómo accedo a la configuración del horario?",
    answer:
      "Desde el sidebar izquierdo entra en `Agenda` y selecciona la pestaña `Horario`, o navega directamente a la ruta `/agenda/horario`. También puedes llegar desde los ajustes generales si tienes un acceso rápido configurado. La pantalla muestra los siete días de la semana (LUNES a DOMINGO) con un interruptor de activación y la lista de intervalos horarios. Los cambios se guardan manualmente con el botón correspondiente.",
    related: ["ah-1", "ah-13", "ah-14"],
    keywords: ["acceso", "ruta", "navegación", "pestaña"],
  },
  {
    id: "ah-3",
    section: "agenda-horario",
    question: "¿Por qué es importante configurar bien el horario?",
    answer:
      "El horario define la experiencia de reserva de tus pacientes: si está mal configurado, verán huecos que no puedes atender o no podrán reservar en momentos en los que sí trabajas. Una buena configuración reduce cancelaciones, solapamientos y correos innecesarios. Además, el horario se combina con tus citas ya creadas para calcular la disponibilidad real en tiempo real. Dedícale unos minutos la primera vez y ajústalo cuando cambien tus condiciones de trabajo.",
    related: ["ah-1", "ah-9", "ah-31"],
    keywords: ["importancia", "motivo", "experiencia", "reserva"],
  },
  {
    id: "ah-4",
    section: "agenda-horario",
    question: "¿Cómo activo o desactivo un día de la semana?",
    answer:
      "Cada día tiene un interruptor (toggle) a la derecha de su nombre que lo activa o desactiva. Al desactivar un día, sus intervalos dejan de contar como disponibles aunque estén definidos, y el paciente ve ese día entero como fuera de horario. Al activarlo, se vuelven a aplicar los intervalos guardados previamente. Es una forma rápida de pausar un día sin perder la configuración.",
    related: ["ah-5", "ah-6", "ah-39"],
    keywords: ["activar", "desactivar", "día", "toggle"],
  },
  {
    id: "ah-5",
    section: "agenda-horario",
    question: "¿Cómo añado un intervalo horario a un día?",
    answer:
      "Dentro del día activo pulsa el botón `Añadir intervalo` y se abrirá una fila con dos campos de hora: inicio y fin. Introduce ambos en formato 24h (por ejemplo, 09:00 y 14:00) y quedará registrado al guardar. Puedes añadir varios intervalos al mismo día para separar mañana y tarde. La hora de fin debe ser posterior a la de inicio dentro del mismo día.",
    related: ["ah-4", "ah-6", "ah-7"],
    keywords: ["añadir", "intervalo", "franja", "horario"],
  },
  {
    id: "ah-6",
    section: "agenda-horario",
    question: "¿Cómo elimino un intervalo horario?",
    answer:
      "Cada intervalo tiene un icono de papelera o cruz junto a los campos de hora que lo elimina de la lista. Al pulsar, desaparece de la interfaz y se quita al guardar los cambios. Si eliminas todos los intervalos de un día pero lo dejas activado, el paciente no verá ningún hueco disponible para ese día. Puedes volver a añadir intervalos en cualquier momento.",
    related: ["ah-5", "ah-4", "ah-13"],
    keywords: ["eliminar", "borrar", "intervalo", "quitar"],
  },
  {
    id: "ah-7",
    section: "agenda-horario",
    question: "¿Puedo tener varios intervalos en el mismo día (mañana y tarde)?",
    answer:
      "Sí, es el caso más habitual: por ejemplo, 09:00-14:00 y 16:00-20:00 para un día con pausa para comer. Cada día admite múltiples intervalos independientes y todos se combinan al calcular los huecos libres para el paciente. Los intervalos no pueden solaparse entre sí dentro del mismo día. Es la forma recomendada de reflejar una jornada partida típica en consulta.",
    related: ["ah-5", "ah-11", "ah-16"],
    keywords: ["múltiples", "intervalos", "mañana", "tarde", "partido"],
  },
  {
    id: "ah-8",
    section: "agenda-horario",
    question: "¿Cómo configuro la duración por defecto de las citas?",
    answer:
      "En la misma pantalla encontrarás un campo llamado `Duración por defecto de cita` (almacenado como `duracionCitaDefault`), normalmente expresado en minutos. El valor habitual es 30 o 45 minutos según el tipo de consulta que hagas. Este valor se usa para calcular cuántos huecos caben dentro de cada intervalo y es la duración inicial que se aplica cuando el paciente reserva una cita. Puedes cambiarlo en cualquier momento sin afectar a las citas ya agendadas.",
    related: ["ah-9", "ah-22", "ah-26"],
    keywords: ["duración", "defecto", "minutos", "cita"],
  },
  {
    id: "ah-9",
    section: "agenda-horario",
    question: "¿Cómo usa el paciente el horario al solicitar cita?",
    answer:
      "Cuando el paciente entra en su portal y pide cita, ve un calendario semanal construido a partir de tu horario laboral. Se le muestran los intervalos activos divididos en huecos del tamaño de la duración por defecto y sólo puede elegir huecos libres. Los días o franjas fuera de horario aparecen como no seleccionables y los huecos ya ocupados por otras citas también se bloquean. Así el paciente solo ve lo que realmente puede reservar.",
    related: ["ah-1", "ah-10", "ah-22"],
    keywords: ["paciente", "solicitar", "cita", "portal"],
  },
  {
    id: "ah-10",
    section: "agenda-horario",
    question: "¿Cómo ven los pacientes mi disponibilidad?",
    answer:
      "En el calendario semanal del portal, los huecos libres se muestran en verde y son seleccionables, las franjas fuera de tu horario aparecen en gris rayado y los huecos ocupados por otras citas se ven en rojo. El paciente solo puede hacer clic sobre los huecos verdes para reservar. Esta vista es pública para tus pacientes pero no para personas ajenas: cada paciente solo ve tu agenda porque está vinculado a ti. Esto preserva la privacidad de tus otros pacientes (no ven quién ocupa el hueco rojo).",
    related: ["ah-9", "ah-22", "ah-34"],
    keywords: ["disponibilidad", "verde", "gris", "rojo", "calendario"],
  },
  {
    id: "ah-11",
    section: "agenda-horario",
    question: "¿Se permiten franjas solapadas dentro del mismo día?",
    answer:
      "No, dos intervalos del mismo día no pueden solaparse entre sí: por ejemplo, 09:00-14:00 y 13:00-16:00 daría error porque la hora 13:00-14:00 está en ambos. La aplicación valida al guardar y te avisa si detecta un solapamiento. Si necesitas ampliar un tramo, edita el intervalo existente en lugar de crear otro encima. Los días distintos son independientes y no se pueden solapar entre sí.",
    related: ["ah-7", "ah-13", "ah-32"],
    keywords: ["solapadas", "solape", "conflicto", "validación"],
  },
  {
    id: "ah-12",
    section: "agenda-horario",
    question: "¿Qué formato de hora se usa?",
    answer:
      "El formato es de 24 horas (por ejemplo 09:00, 14:30 o 20:00), sin AM ni PM. Esto evita ambigüedades y coincide con el estándar habitual en España. Los minutos se introducen con dos cifras separados por dos puntos. El editor suele admitir paso de 5 o 15 minutos según el control, pero puedes teclear cualquier valor válido.",
    related: ["ah-5", "ah-8", "ah-24"],
    keywords: ["formato", "24h", "hora", "notación"],
  },
  {
    id: "ah-13",
    section: "agenda-horario",
    question: "¿Cómo guardo los cambios del horario?",
    answer:
      "Al pie de la pantalla verás un botón `Guardar cambios` que persiste toda la configuración en el campo `horarioLaboral` de tu ficha de dietista. Los cambios no se aplican hasta que pulsas guardar, por lo que puedes editar con tranquilidad sin afectar a tus pacientes. Una vez guardados, surten efecto de inmediato en el portal de reserva. Si navegas fuera sin guardar, perderás los cambios pendientes y la aplicación suele avisarte antes de abandonar.",
    related: ["ah-14", "ah-26", "ah-32"],
    keywords: ["guardar", "cambios", "persistir", "botón"],
  },
  {
    id: "ah-14",
    section: "agenda-horario",
    question: "¿Puedo tener un horario distinto según el día?",
    answer:
      "Sí, cada día de la semana se configura de forma independiente: puedes tener lunes de 09:00 a 20:00, martes de 16:00 a 21:00 y miércoles libre, por ejemplo. Esto es especialmente útil si combinas consulta con otras actividades. No hace falta que todos los días tengan la misma estructura. Si prefieres un horario uniforme puedes copiar manualmente los mismos intervalos en varios días.",
    related: ["ah-15", "ah-16", "ah-27"],
    keywords: ["variable", "diferente", "día", "independiente"],
  },
  {
    id: "ah-15",
    section: "agenda-horario",
    question: "¿Hay una opción para aplicar el mismo horario a todos los días?",
    answer:
      "Actualmente no existe un botón de `copiar a todos los días` integrado, así que debes replicar manualmente los intervalos en cada jornada. Si tu horario es uniforme de lunes a viernes, configura un día y repite la operación en los otros cuatro. Es una mejora prevista para futuras versiones. Mientras tanto, puedes ayudarte de los valores por defecto que aparezcan al activar un día.",
    related: ["ah-14", "ah-16", "ah-27"],
    keywords: ["uniforme", "copiar", "replicar", "igual"],
  },
  {
    id: "ah-16",
    section: "agenda-horario",
    question: "¿Puedo trabajar los fines de semana?",
    answer:
      "Sí, sábado y domingo se configuran exactamente igual que el resto de días, con su interruptor y sus intervalos. Por defecto suelen venir desactivados porque la mayoría de consultas no abren, pero puedes activarlos sin restricciones. Si trabajas solo los sábados por la mañana, basta con activar el sábado y añadir el intervalo correspondiente. Los pacientes verán esos días como cualquier otro.",
    related: ["ah-14", "ah-27", "ah-29"],
    keywords: ["sábado", "domingo", "fin de semana", "weekend"],
  },
  {
    id: "ah-17",
    section: "agenda-horario",
    question: "¿Admite horarios nocturnos o muy tempranos?",
    answer:
      "Sí, puedes configurar franjas desde muy temprano (por ejemplo 06:00) o hasta tarde por la noche (por ejemplo 22:00) sin problema, siempre que terminen dentro del mismo día. El grid del calendario se ajusta automáticamente para mostrar las franjas que salen del rango estándar 07:00-21:00. Ten en cuenta que una cita no puede cruzar la medianoche (no se soporta pasar del día actual al siguiente en un mismo intervalo).",
    related: ["ah-25", "ah-27", "ah-30"],
    keywords: ["nocturno", "temprano", "madrugada", "noche"],
  },
  {
    id: "ah-18",
    section: "agenda-horario",
    question: "¿Puedo bloquear vacaciones o días puntuales desde aquí?",
    answer:
      "La pantalla de horario está pensada para la configuración recurrente semanal, no para bloqueos puntuales de fechas concretas. Para unas vacaciones de una semana o días sueltos, la forma más práctica hoy es desactivar temporalmente los días afectados o crear citas de bloqueo en la agenda. Un sistema de vacaciones dedicado está previsto como mejora futura. Mientras tanto, también puedes desactivar toda la agenda si vas a estar fuera un periodo largo.",
    related: ["ah-39", "ah-19", "ah-29"],
    keywords: ["vacaciones", "bloqueo", "ausencia", "puntual"],
  },
  {
    id: "ah-19",
    section: "agenda-horario",
    question: "¿Qué horario por defecto se crea al registrarme?",
    answer:
      "Al crear una cuenta nueva se aplica un horario inicial estándar, habitualmente de lunes a viernes de 09:00 a 14:00 y de 16:00 a 20:00, con sábado y domingo desactivados y una duración por defecto de 30 minutos. Es una plantilla razonable para empezar, pero te recomendamos revisarla y ajustarla a tu realidad antes de compartir el portal con pacientes. Todos los valores se pueden modificar sin restricciones desde esta pantalla.",
    related: ["ah-1", "ah-14", "ah-31"],
    keywords: ["defecto", "inicial", "registro", "plantilla"],
  },
  {
    id: "ah-20",
    section: "agenda-horario",
    question: "¿Si cambio mi horario, se mueven las citas ya creadas?",
    answer:
      "No, las citas existentes quedan intactas aunque cambies tu horario laboral. El horario solo afecta a las nuevas solicitudes y a la visualización futura de huecos en el portal. Si por ejemplo tenías una cita el sábado y desactivas el sábado, la cita no se cancela automáticamente. Si quieres quitar esa cita, debes hacerlo desde la agenda manualmente.",
    related: ["ah-13", "ah-18", "ah-33"],
    keywords: ["citas", "existentes", "afecta", "mover"],
  },
  {
    id: "ah-21",
    section: "agenda-horario",
    question: "¿Cómo se integra el horario con Google Calendar?",
    answer:
      "Si tienes Google Calendar conectado, las citas se sincronizan en ambas direcciones, pero el horario laboral se configura exclusivamente dentro de AppNutrición, no se lee desde Google. Los eventos de Google que ocupen franjas no se marcan automáticamente como bloqueadas en el portal del paciente. Para bloquear un hueco, crea una cita o desactiva el día desde esta pantalla. La sincronización con Google está pensada para reflejar las citas, no para gestionar la disponibilidad.",
    related: ["ah-22", "ah-33", "ah-34"],
    keywords: ["google", "calendar", "sincronización", "integración"],
  },
  {
    id: "ah-22",
    section: "agenda-horario",
    question: "¿El sistema reconoce feriados nacionales o locales?",
    answer:
      "No, AppNutrición no incluye un calendario de festivos nacionales ni autonómicos: si un lunes es festivo y no quieres atender, tienes que desactivarlo manualmente o crear un bloqueo. La aplicación no puede saber qué días son festivos en tu comunidad. Es una funcionalidad en el horizonte de mejoras, pero hoy la gestión es manual. Recuerda revisarlo antes de puentes y fechas clave del año.",
    related: ["ah-18", "ah-27", "ah-39"],
    keywords: ["feriados", "festivos", "puentes", "calendario"],
  },
  {
    id: "ah-23",
    section: "agenda-horario",
    question: "¿Qué zona horaria utiliza el horario laboral?",
    answer:
      "Todo el horario se interpreta en zona horaria Europa/Madrid, independientemente de dónde esté tu navegador o el del paciente. Esto asegura que 09:00 significa siempre las nueve de la mañana peninsulares, sin líos de conversión. Si un paciente accede desde otro país, verá tu agenda convertida a su hora local en la vista previa, pero el registro en el sistema se guarda en hora de Madrid. Es la misma zona que rige el resto de fechas de la aplicación.",
    related: ["ah-12", "ah-34", "ah-24"],
    keywords: ["zona", "horaria", "madrid", "timezone"],
  },
  {
    id: "ah-24",
    section: "agenda-horario",
    question: "¿Cómo se ajusta la escala del calendario del paciente?",
    answer:
      "Por defecto, el grid semanal del paciente muestra desde las 07:00 hasta las 21:00 para mantenerlo compacto y legible. Si configuras intervalos fuera de ese rango (por ejemplo 06:00 o 22:00), la escala se amplía automáticamente para incluirlos. De esta forma el paciente siempre puede ver todos los huecos disponibles sin tener que hacer scroll extra. La escala mínima no baja del rango 07:00-21:00 aunque no trabajes todas esas horas.",
    related: ["ah-17", "ah-9", "ah-10"],
    keywords: ["escala", "grid", "rango", "visible"],
  },
  {
    id: "ah-25",
    section: "agenda-horario",
    question: "¿La disponibilidad se calcula en tiempo real?",
    answer:
      "Sí, cada vez que un paciente abre el selector de cita, el servidor calcula en el momento qué huecos están libres combinando tu horario laboral, la duración por defecto y las citas ya agendadas. Eso implica que si acabas de crear una cita desde tu agenda, desaparece de la disponibilidad del portal casi de inmediato. No hay caché agresiva que muestre información obsoleta. Lo mismo pasa al desactivar un día: el cambio se propaga al portal en cuanto guardas.",
    related: ["ah-9", "ah-13", "ah-34"],
    keywords: ["tiempo", "real", "disponibilidad", "live"],
  },
  {
    id: "ah-26",
    section: "agenda-horario",
    question: "¿Qué pasa si un paciente intenta reservar fuera de horario?",
    answer:
      "No puede: el portal solo le ofrece huecos dentro de tu horario configurado, así que las franjas fuera de horario aparecen marcadas como gris rayado y no se pueden pulsar. Aunque manipulase la URL o el calendario, el servidor revalida antes de crear la cita y rechazaría la reserva con un error. Esto protege tu agenda de reservas accidentales en horarios en los que no trabajas. Es uno de los motivos por los que mantener el horario actualizado es fundamental.",
    related: ["ah-9", "ah-25", "ah-32"],
    keywords: ["fuera", "horario", "rechaza", "validación"],
  },
  {
    id: "ah-27",
    section: "agenda-horario",
    question: "¿Se pueden crear citas que crucen la medianoche?",
    answer:
      "No, AppNutrición no soporta intervalos ni citas que crucen de un día al siguiente: cada franja debe empezar y terminar dentro del mismo día del calendario. Si necesitas atender a las 23:30 durante una hora, la cita no puede extenderse hasta las 00:30. Es un caso de uso muy poco habitual en consulta nutricional y por eso no está contemplado. Si te encuentras con esta limitación, contáctanos y lo valoramos.",
    related: ["ah-17", "ah-30", "ah-37"],
    keywords: ["medianoche", "cruzar", "día", "edge"],
  },
  {
    id: "ah-28",
    section: "agenda-horario",
    question: "¿Qué configuración recomiendas para empezar?",
    answer:
      "Una configuración estándar razonable es lunes a viernes con 09:00-14:00 y 16:00-20:00, sábado y domingo desactivados, y 30 minutos de duración por defecto. Ajústala después a tu realidad: si tienes consulta solo por la tarde, desactiva las mañanas; si trabajas media jornada, reduce las franjas. Piensa en cuántas citas realistas atiendes por día y que la duración no sea tan corta que te quedes sin margen entre pacientes. Es mejor empezar conservador y ampliar que al revés.",
    related: ["ah-19", "ah-29", "ah-31"],
    keywords: ["recomendación", "empezar", "configuración", "inicial"],
  },
  {
    id: "ah-29",
    section: "agenda-horario",
    question: "¿Cuáles son las buenas prácticas al configurar el horario?",
    answer:
      "Deja siempre un pequeño margen entre citas si tu duración por defecto lo permite, evita franjas muy largas sin descanso y sé realista con la cantidad de huecos que ofreces. Revisa el horario cada trimestre para ajustarlo a cambios estacionales (verano, Navidad). Antes de activar el portal de reserva, haz una prueba tú mismo desde una cuenta de paciente demo para ver cómo se percibe la agenda. Y no olvides desactivar los días en los que estarás de vacaciones aunque sea con antelación.",
    related: ["ah-28", "ah-31", "ah-35"],
    keywords: ["buenas", "prácticas", "recomendaciones", "tips"],
  },
  {
    id: "ah-30",
    section: "agenda-horario",
    question: "¿Puedo tener horarios distintos según el tipo de cita?",
    answer:
      "No, por ahora solo existe un horario laboral general que aplica a todas las solicitudes de cita, independientemente del motivo. Si quieres dedicar ciertas franjas solo a primeras visitas y otras a seguimiento, tendrás que gestionarlo bloqueando huecos manualmente o con otra estrategia. Es una funcionalidad en estudio para futuras versiones. De momento, la diferenciación por tipo se hace al agendar, no al definir disponibilidad.",
    related: ["ah-8", "ah-14", "ah-37"],
    keywords: ["tipo", "cita", "diferenciado", "motivo"],
  },
  {
    id: "ah-31",
    section: "agenda-horario",
    question: "¿Quién puede ver mi horario laboral?",
    answer:
      "Solo los pacientes asociados a tu cuenta (es decir, los que aparecen en tu lista de pacientes) ven tu horario cuando acceden al portal para pedir cita. No es información pública: una persona ajena que no sea paciente tuyo no puede consultarla. Dentro del portal, el paciente ve huecos libres y ocupados pero nunca la identidad de quien ocupa un hueco rojo. Esto protege la privacidad tanto tuya como del resto de tus pacientes.",
    related: ["ah-10", "ah-34", "ah-36"],
    keywords: ["privacidad", "ver", "paciente", "acceso"],
  },
  {
    id: "ah-32",
    section: "agenda-horario",
    question: "¿Qué errores comunes encuentro al configurar el horario?",
    answer:
      "Los más habituales son: dejar un día activado sin ningún intervalo (el paciente verá 0 huecos), introducir franjas solapadas (la validación lo bloquea), olvidarse de pulsar `Guardar cambios` tras editar o definir una duración por defecto demasiado larga para tus intervalos. También es común no contemplar festivos o vacaciones y que aparezcan huecos esos días. Revisa la vista del paciente tras cada cambio importante.",
    related: ["ah-11", "ah-13", "ah-35"],
    keywords: ["errores", "comunes", "fallos", "problemas"],
  },
  {
    id: "ah-33",
    section: "agenda-horario",
    question: "¿Cómo afecta el horario a las notificaciones de cita?",
    answer:
      "El horario en sí no genera notificaciones, pero las citas que se crean dentro de él sí: cada solicitud de un paciente produce una notificación para ti, y las confirmaciones llegan al paciente. Si desactivas un día o reduces horas, no se cancelan citas antiguas ni se avisa automáticamente. Para comunicar cambios a pacientes afectados, usa el sistema de mensajes o el correo electrónico. El horario es solo la fuente de disponibilidad futura.",
    related: ["ah-20", "ah-21", "ah-39"],
    keywords: ["notificaciones", "aviso", "mensajes", "cambios"],
  },
  {
    id: "ah-34",
    section: "agenda-horario",
    question: "¿Cómo puedo probar mi configuración después de guardarla?",
    answer:
      "La forma más fiable es entrar al portal con una cuenta de paciente demo (o una de prueba) y simular una reserva: comprobarás de primera mano los huecos, días cerrados y ocupaciones tal y como los ven tus pacientes reales. Desde ajustes existe una tarjeta de `Paciente demo` precisamente para esto. También puedes pedir a un paciente de confianza que te avise si ve algo raro. Probar al menos una vez tras cada cambio grande evita sorpresas.",
    related: ["ah-10", "ah-29", "ah-35"],
    keywords: ["probar", "demo", "testing", "validar"],
  },
  {
    id: "ah-35",
    section: "agenda-horario",
    question: "¿Qué pasa si no configuro ningún horario?",
    answer:
      "Si no tienes ningún día activo con intervalos válidos, ningún paciente puede solicitar cita a través del portal: el selector mostrará toda la semana como fuera de horario. Siempre puedes crear citas manualmente tú desde la agenda, pero la autogestión queda deshabilitada. Por eso, nada más registrarte, es recomendable revisar y confirmar el horario aunque mantengas el valor por defecto. Es el equivalente a tener la puerta de la consulta cerrada.",
    related: ["ah-1", "ah-3", "ah-19"],
    keywords: ["sin", "horario", "vacío", "bloqueado"],
  },
  {
    id: "ah-36",
    section: "agenda-horario",
    question: "¿Puedo configurar horarios distintos por paciente?",
    answer:
      "No, el horario laboral es único para toda tu consulta y se aplica igual a cualquier paciente que solicite cita. No es posible ofrecer más horas a un paciente concreto ni esconder franjas a otros. Si un paciente necesita un hueco fuera de horario, la vía es crear tú la cita manualmente desde la agenda. La visibilidad diferenciada por paciente no está contemplada en el modelo actual.",
    related: ["ah-10", "ah-30", "ah-31"],
    keywords: ["paciente", "individual", "personalizado", "ajuste"],
  },
  {
    id: "ah-37",
    section: "agenda-horario",
    question: "¿Cómo gestiono picos o periodos de alta demanda?",
    answer:
      "Si prevés un pico de solicitudes (por ejemplo en enero o septiembre), amplía temporalmente tus franjas o reduce la duración por defecto para caber más citas, siempre con criterio clínico. Después del pico, restablece tu configuración habitual. Evita dejar duraciones demasiado cortas de forma permanente solo para maximizar capacidad porque afecta a la calidad. Revisar el horario cada pocos meses te ayuda a adaptarlo a la demanda real.",
    related: ["ah-8", "ah-28", "ah-29"],
    keywords: ["picos", "demanda", "temporada", "ajuste"],
  },
  {
    id: "ah-38",
    section: "agenda-horario",
    question: "¿Qué hago si veo una inconsistencia entre horario y citas reales?",
    answer:
      "Si detectas que los pacientes reservan en momentos que no esperas o faltan huecos que deberían aparecer, comprueba tres cosas: (1) que el día esté activado y los intervalos guardados, (2) que no haya citas ya agendadas que bloqueen los huecos, y (3) que la duración por defecto sea coherente con los intervalos definidos. Recarga la página de horario y revisa también desde el portal del paciente demo. Si persiste, contacta con soporte con un ejemplo concreto.",
    related: ["ah-32", "ah-34", "ah-35"],
    keywords: ["inconsistencia", "problema", "soporte", "diagnóstico"],
  },
  {
    id: "ah-39",
    section: "agenda-horario",
    question: "¿Cómo desactivo temporalmente toda mi agenda?",
    answer:
      "La forma más rápida es apagar los interruptores de los siete días de la semana y guardar cambios: el portal deja de ofrecer huecos inmediatamente. Cuando vuelvas, los reactivas y la configuración de intervalos se mantiene intacta porque el toggle no borra los datos, solo los desactiva. Es la opción recomendada para vacaciones, bajas o pausas prolongadas. Así no pierdes tu configuración previa y puedes volver en un clic.",
    related: ["ah-4", "ah-18", "ah-22"],
    keywords: ["desactivar", "pausar", "vacaciones", "toda"],
  },
  {
    id: "ah-40",
    section: "agenda-horario",
    question: "¿Dónde se guardan técnicamente los datos del horario laboral?",
    answer:
      "El horario se persiste en el campo `horarioLaboral` de tipo JSONB dentro de la tabla `Dietista` en la base de datos, asociado únicamente a tu cuenta de nutricionista. La duración por defecto se guarda en el campo `duracionCitaDefault` del mismo registro. Al modificarlo desde la interfaz se hace una escritura atómica, así que no hay riesgo de quedar en un estado intermedio. Esta información nunca se comparte con terceros ni aparece fuera de tu entorno autenticado.",
    related: ["ah-1", "ah-8", "ah-31"],
    keywords: ["jsonb", "base", "datos", "técnico"],
  },
];
