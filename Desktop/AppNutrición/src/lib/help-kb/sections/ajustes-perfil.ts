import type { HelpEntry } from "../types";

export const AJUSTES_PERFIL_ENTRIES: HelpEntry[] = [
  {
    id: "ajp-1",
    section: "ajustes-perfil",
    question: "¿Qué es la sección Perfil de Ajustes?",
    answer:
      "La sección Perfil dentro de Ajustes es donde gestionas tus datos profesionales como dietista: nombre, apellidos, teléfono, especialidad, número de colegiado y clínica. También es el lugar para subir o cambiar tu foto de perfil. Todo lo que configuras aquí afecta a cómo te identifica la aplicación y a cómo te ven tus pacientes en mensajes, enlaces compartidos y en el portal. Los cambios se guardan en tu ficha de dietista y se aplican al instante en cuanto pulsas el botón de guardar.",
    related: ["ajp-2", "ajp-8", "ajp-19"],
    keywords: ["perfil", "ajustes", "datos personales", "dietista", "cuenta"],
  },
  {
    id: "ajp-2",
    section: "ajustes-perfil",
    question: "¿Cómo edito mis datos en Perfil?",
    answer:
      "Entra en Ajustes y selecciona la pestaña Perfil. Verás un formulario con los campos rellenados con tus datos actuales. Modifica lo que necesites cambiar y al final de la página pulsa el botón Guardar cambios. Mientras no pulses guardar, ningún cambio se aplica, así que puedes descartar la edición simplemente saliendo de la página. Recuerda que nombre y apellidos no pueden quedar vacíos, el formulario te avisará si lo intentas.",
    related: ["ajp-1", "ajp-3", "ajp-8"],
    keywords: ["editar", "cambiar datos", "guardar", "formulario", "perfil"],
  },
  {
    id: "ajp-3",
    section: "ajustes-perfil",
    question: "¿Qué campos son obligatorios en el formulario?",
    answer:
      "Los campos obligatorios son nombre y apellidos. Si intentas guardar con alguno de los dos en blanco, el formulario te lo marca como error y no se envían los cambios. El resto de campos (teléfono, especialidad, número de colegiado y clínica) son opcionales, pero te recomendamos rellenarlos para que tu ficha quede completa. Ten en cuenta que tu nombre aparece en mensajes y enlaces que reciben los pacientes, así que conviene que esté siempre actualizado.",
    related: ["ajp-2", "ajp-18", "ajp-20"],
    keywords: ["obligatorio", "nombre", "apellidos", "validación", "requerido"],
  },
  {
    id: "ajp-4",
    section: "ajustes-perfil",
    question: "¿Cómo introduzco mi número de teléfono?",
    answer:
      "Introduce tu teléfono en el campo correspondiente del formulario. El sistema acepta formatos con o sin prefijo internacional, por ejemplo +34 600 123 456 o 600123456. No es obligatorio, pero si lo rellenas facilita que el equipo de soporte o tus pacientes puedan contactarte cuando sea necesario. No se muestra públicamente en el portal salvo que tú mismo lo incluyas en tu perfil o en tus plantillas de comunicación.",
    related: ["ajp-3", "ajp-18", "ajp-19"],
    keywords: ["teléfono", "móvil", "contacto", "formato", "prefijo"],
  },
  {
    id: "ajp-5",
    section: "ajustes-perfil",
    question: "¿Qué pongo en el campo Especialidad?",
    answer:
      "En Especialidad describe tu área de trabajo como dietista-nutricionista, por ejemplo nutrición clínica, deportiva, pediátrica, oncológica, vegetariana o trastornos de la conducta alimentaria. Es un campo de texto libre, puedes escribir varias especialidades separadas por comas. Esta información te ayuda a identificarte profesionalmente y puede mostrarse junto a tu nombre en ciertas vistas. Si aún no tienes claro qué poner, puedes dejarlo vacío y completarlo más adelante.",
    related: ["ajp-6", "ajp-7", "ajp-19"],
    keywords: ["especialidad", "área", "nutrición", "clínica", "deportiva"],
  },
  {
    id: "ajp-6",
    section: "ajustes-perfil",
    question: "¿Para qué sirve el número de colegiado?",
    answer:
      "El número de colegiado es tu identificador oficial como dietista-nutricionista en tu colegio profesional. Rellenarlo sirve para aparecer correctamente identificado en documentos, informes y en tu perfil profesional. Aunque no es obligatorio dentro de la aplicación, sí suele ser recomendable incluirlo por transparencia con el paciente y por cumplimiento profesional. Si trabajas en varios colegios o jurisdicciones, puedes poner el que uses habitualmente.",
    related: ["ajp-5", "ajp-7", "ajp-19"],
    keywords: ["colegiado", "número", "colegio", "profesional", "oficial"],
  },
  {
    id: "ajp-7",
    section: "ajustes-perfil",
    question: "¿Qué escribo en el campo Clínica?",
    answer:
      "En Clínica pon el nombre del centro, consulta o clínica donde pasas consulta. Si trabajas por tu cuenta puedes poner tu nombre comercial o dejarlo vacío. Este dato puede mostrarse en documentos y comunicaciones para que el paciente sepa desde qué centro le estás atendiendo. Es un campo opcional y puedes actualizarlo cuando cambies de centro o abras tu propia consulta.",
    related: ["ajp-5", "ajp-6", "ajp-19"],
    keywords: ["clínica", "consulta", "centro", "lugar de trabajo"],
  },
  {
    id: "ajp-8",
    section: "ajustes-perfil",
    question: "¿Cómo guardo los cambios del Perfil?",
    answer:
      "Al final del formulario hay un botón Guardar cambios. Pulsa ese botón cuando hayas terminado de editar para enviar los cambios al servidor. Si todo es correcto, verás una confirmación y los cambios quedan aplicados en tu ficha de dietista. Si algún campo obligatorio está vacío o tiene un valor inválido, el botón puede quedar deshabilitado o mostrarte un error con la razón. Mientras no pulses guardar, nada se aplica de forma definitiva.",
    related: ["ajp-2", "ajp-3", "ajp-18"],
    keywords: ["guardar", "cambios", "botón", "confirmar", "enviar"],
  },
  {
    id: "ajp-9",
    section: "ajustes-perfil",
    question: "¿Por qué el email no es editable desde Perfil?",
    answer:
      "El email no se puede modificar desde el formulario de Perfil porque es la clave con la que inicias sesión y se usa para notificaciones críticas y recuperación de contraseña. Cambiarlo sin controles podría comprometer la seguridad de tu cuenta. Si necesitas cambiar el email asociado a tu cuenta, tienes que contactar con soporte, que verificará tu identidad antes de aplicar el cambio. De este modo evitamos que alguien que obtenga acceso temporal a tu sesión pueda cambiar tu correo y bloquearte.",
    related: ["ajp-16", "ajp-19", "ajp-20"],
    keywords: ["email", "correo", "no editable", "login", "seguridad"],
  },
  {
    id: "ajp-10",
    section: "ajustes-perfil",
    question: "¿Cómo subo una foto de perfil?",
    answer:
      "En la sección Perfil verás el componente de foto de perfil con un círculo y un botón para subir imagen. Al pulsarlo se abre el selector de archivos de tu sistema para que elijas una imagen de tu equipo. En cuanto seleccionas el archivo, se sube y se guarda automáticamente, sin necesidad de pulsar Guardar cambios para ese paso concreto. Tras subirla verás la foto en el círculo, con forma redonda, y empezará a mostrarse donde corresponda en el resto de la aplicación.",
    related: ["ajp-11", "ajp-12", "ajp-15"],
    keywords: ["foto", "subir", "imagen", "perfil", "avatar"],
  },
  {
    id: "ajp-11",
    section: "ajustes-perfil",
    question: "¿Qué formatos de imagen se aceptan para la foto?",
    answer:
      "Los formatos aceptados para la foto de perfil son JPG, PNG y WebP, que son los estándar habituales de fotografía web. No se admiten formatos como HEIC (común en iPhone antiguos) ni BMP ni SVG, ya que pueden dar problemas de compatibilidad en el navegador o en los emails. Si tu foto original está en otro formato, conviértela antes con cualquier editor o con herramientas online. Lo normal es que una foto tomada con el móvil ya esté en JPG o PNG.",
    related: ["ajp-10", "ajp-12", "ajp-18"],
    keywords: ["formato", "jpg", "png", "webp", "imagen"],
  },
  {
    id: "ajp-12",
    section: "ajustes-perfil",
    question: "¿Cuál es el tamaño máximo de la foto de perfil?",
    answer:
      "El tamaño máximo admitido es de 2 MB por archivo. Si intentas subir una imagen más grande, el sistema la rechaza y te muestra un mensaje de error sin llegar a guardarla. En la práctica 2 MB es más que suficiente para una foto de perfil nítida, ya que no hace falta la calidad de una cámara profesional. Si tu foto es demasiado grande, redúcela con cualquier editor o aplicación de móvil antes de subirla; incluso un recorte rápido suele bastar para bajar del límite.",
    related: ["ajp-10", "ajp-11", "ajp-18"],
    keywords: ["tamaño", "máximo", "2MB", "peso", "límite"],
  },
  {
    id: "ajp-13",
    section: "ajustes-perfil",
    question: "¿Puedo recortar la foto de perfil desde la aplicación?",
    answer:
      "No hay una herramienta de recorte integrada dentro del formulario de Perfil: la foto se usa tal cual la subes. Como se muestra siempre en un círculo, el recorte visual se aplica de forma automática dejando visible la parte central. Si quieres controlar qué parte queda dentro del círculo, lo mejor es recortar la imagen con cualquier editor (como Fotos, Vista previa o una app de móvil) antes de subirla, idealmente dejándola cuadrada. Así te aseguras de que la imagen queda centrada y se ve bien en todos los sitios donde aparece.",
    related: ["ajp-10", "ajp-14", "ajp-15"],
    keywords: ["recortar", "editar", "cuadrada", "círculo", "centrar"],
  },
  {
    id: "ajp-14",
    section: "ajustes-perfil",
    question: "¿Cómo elimino la foto de perfil?",
    answer:
      "Para quedarte sin foto de perfil usa la opción de eliminar foto del componente (suele aparecer como un icono de papelera o similar junto a la foto actual). Al confirmarla, tu avatar vuelve al estado por defecto, que normalmente muestra tus iniciales en un fondo neutro. También puedes simplemente subir una foto nueva para sustituir la actual, sin necesidad de eliminarla primero. Si no te aparece la opción, prueba a recargar la página tras iniciar sesión.",
    related: ["ajp-10", "ajp-15", "ajp-19"],
    keywords: ["eliminar", "quitar", "borrar", "foto", "avatar"],
  },
  {
    id: "ajp-15",
    section: "ajustes-perfil",
    question: "¿Dónde se muestra mi foto de perfil dentro de la app?",
    answer:
      "Tu foto de perfil aparece en tres sitios principales: en el resumen de cuenta dentro de la propia pantalla de Ajustes, en el sidebar lateral (cabecera o pie, según el diseño) y en la barra superior (header) junto al menú de usuario. Si no tienes foto subida, en esos mismos sitios se muestra un avatar por defecto con tus iniciales. Cambiar la foto en Perfil actualiza los tres lugares de forma inmediata, sin tener que cerrar sesión. En cambio, la foto no se envía al paciente en sus comunicaciones por defecto.",
    related: ["ajp-10", "ajp-14", "ajp-19"],
    keywords: ["sidebar", "header", "resumen", "avatar", "dónde se muestra"],
  },
  {
    id: "ajp-16",
    section: "ajustes-perfil",
    question: "¿Cómo puedo cambiar mi email?",
    answer:
      "El email de inicio de sesión no se cambia desde Perfil por motivos de seguridad. Si necesitas modificarlo (por ejemplo porque cambiaste de correo profesional), escribe a soporte indicando el email actual y el nuevo que quieres usar. Desde soporte te pedirán confirmar tu identidad para evitar suplantaciones y, una vez validado, harán el cambio manualmente. A partir de ese momento tendrás que iniciar sesión con el nuevo email, así que asegúrate de que el correo indicado es correcto antes de solicitarlo.",
    related: ["ajp-9", "ajp-19", "ajp-20"],
    keywords: ["cambiar email", "soporte", "contactar", "correo", "nuevo"],
  },
  {
    id: "ajp-17",
    section: "ajustes-perfil",
    question: "¿Qué validaciones aplica el formulario de Perfil?",
    answer:
      "El componente PerfilForm valida como mínimo que nombre y apellidos no queden vacíos antes de permitir guardar. Si alguno falta, te aparece un aviso sobre el campo y el guardado queda bloqueado hasta que lo corrijas. El resto de campos (teléfono, especialidad, colegiado, clínica) son opcionales y aceptan texto normal, así que no suele haber errores de validación en ellos. La foto de perfil tiene sus propias reglas: formato compatible y tamaño inferior a 2 MB.",
    related: ["ajp-3", "ajp-12", "ajp-18"],
    keywords: ["validaciones", "vacío", "errores", "formulario", "reglas"],
  },
  {
    id: "ajp-18",
    section: "ajustes-perfil",
    question: "¿Qué errores son los más comunes al guardar Perfil?",
    answer:
      "Los errores más habituales son: nombre o apellidos vacíos (no deja guardar hasta rellenarlos), foto de perfil demasiado grande (más de 2 MB) y foto en un formato no compatible (por ejemplo HEIC). También puede aparecer un error genérico si pierdes conexión a internet en mitad del guardado, en cuyo caso basta con reintentar. Si ves un error que no entiendes, copia el mensaje y contacta con soporte para que te ayuden a resolverlo.",
    related: ["ajp-3", "ajp-11", "ajp-12"],
    keywords: ["errores", "problemas", "guardar", "comunes", "fallos"],
  },
  {
    id: "ajp-19",
    section: "ajustes-perfil",
    question: "¿Qué datos de mi perfil ven los pacientes?",
    answer:
      "De tu perfil, los pacientes ven sobre todo tu nombre y apellidos, que aparecen en los mensajes que les envías, en enlaces compartidos, en notificaciones y en el portal del paciente. La especialidad y la clínica pueden mostrarse en contextos puntuales (por ejemplo, en documentos o en tu presentación dentro del portal). Datos como tu teléfono, tu email de acceso o tu número de colegiado no se muestran automáticamente al paciente, quedan en el ámbito interno o profesional. La foto de perfil, por defecto, es visible en el portal y en comunicaciones internas.",
    related: ["ajp-15", "ajp-20", "ajp-3"],
    keywords: ["paciente", "privacidad", "visible", "público", "ven"],
  },
  {
    id: "ajp-20",
    section: "ajustes-perfil",
    question: "¿Cuándo tengo que rellenar todos los datos de Perfil?",
    answer:
      "Lo ideal es completar tu perfil durante el onboarding inicial, justo después de crear la cuenta, para que todas las comunicaciones y documentos salgan con tu nombre, clínica y especialidad bien definidos desde el principio. Si empezaste con el perfil a medias, puedes volver a Ajustes > Perfil en cualquier momento y completarlo: los cambios se propagan al instante a mensajes futuros, enlaces compartidos y al portal del paciente. Para los pacientes que ya tenías dados de alta no se reenvían mensajes antiguos, solo se actualiza lo que salga a partir de ese momento. Subir una foto clara y usar tu nombre completo suele mejorar la confianza del paciente desde la primera interacción.",
    related: ["ajp-1", "ajp-8", "ajp-19"],
    keywords: ["onboarding", "inicial", "completar", "rellenar", "primera vez"],
  },
];
