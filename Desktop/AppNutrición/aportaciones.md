# Peticiones de nutricionistas - Mayo 2025

Feedback recopilado de un nutricionista argentino (usuario real) tras probar Annonia en producción.

---

## 1. Tablas de composición de alimentos por país

**Estado actual:** OpenFoodFacts (API global con filtro español) + ~3000 alimentos precargados. Micronutrientes basados en USDA/BEDCA estimados por categoría. El dietista puede crear alimentos personalizados.

**Petición:** Poder seleccionar la tabla de composición según el país del profesional. Ejemplo: Argenfood (Argentina), BEDCA (España), USDA (EE.UU.), etc.

**Input adicional (Betzabe Díaz, Perú — Instagram, 9 jun 2026):** Pregunta si Annonia quiere llegar también a **nutricionistas latinos**. Caso concreto: los tipos de **pan** que ofrece la app (Pan Ácimo, Pan Blanco, Pan Cateto, Pan Candeal…) no coinciden con los de Perú, donde se consume mucho **pan francés, chiabatta**, etc. Ellos trabajan con la **Tabla de Composición de Alimentos Peruanos** (INS/CENAN). → Añadir **Perú** a las tablas regionales a integrar (junto a Argenfood, BEDCA, USDA…). Enlaza con #95 (sinónimos/nombres locales de alimentos). Confirma que LatAm es un mercado real y que la base de alimentos española no encaja del todo allí.

**Tareas:**
- [ ] Investigar APIs o datasets descargables de Argenfood, BEDCA, USDA y **Tabla de Composición de Alimentos Peruanos (INS/CENAN)**
- [ ] Añadir campo `tablaComposicion` al modelo `Dietista` (o a nivel de configuración) para elegir tabla por defecto
- [ ] Crear sistema de importación/seed por tabla regional
- [ ] En el buscador de alimentos, permitir filtrar por fuente/tabla
- [ ] UI en ajustes del dietista para seleccionar tabla preferida
- [ ] Considerar merge inteligente: si un alimento existe en varias tablas, mostrar la del país seleccionado primero

**Prioridad:** Alta
**Complejidad:** Alta (requiere investigación de fuentes de datos + modelado)

---

## 2. Subir análisis de sangre y archivos del paciente

**Estado actual:** No existe sistema de archivos adjuntos por paciente.

**Petición:** Poder subir análisis de sangre (PDFs, imágenes) y que destaque valores importantes. También una sección general de archivos (planes de otros profesionales, estudios, etc.).

**Input adicional (Ainara Martín, mayo 2026):** Ainara ya tiene montado un sistema propio con IA donde sube analíticas y se le extrapolan a un Excel para ver todo el histórico de una vez. Quiere lo mismo integrado en la app: subir analítica → parseo automático → valores extraídos → histórico visual donde se vea la evolución de cada marcador a lo largo del tiempo.

**Input adicional (Jesús, jesusmnutricion — 22 jun 2026):** poder **subir un documento PDF** al paciente (informes, documentos del cliente…). Encaja en la "sección general de archivos" del paciente. Lo piden varios profesionales → demanda repetida.

**Tareas:**
- [ ] Crear modelo `ArchivoPaciente` en Prisma (id, pacienteId, dietistaId, nombre, tipo, url/base64, categoria, notas, createdAt)
- [ ] Categorías de archivo: analisis_sangre, estudio_medico, plan_externo, receta_medica, otro
- [ ] Implementar subida de archivos **a Supabase Storage** (NO base64): ya hay **plan Pro (250 GB)** contratado y el **código de Storage de #110 ya existe** (`src/lib/storage.ts`, buckets + uploads); crear un bucket para documentos/analíticas del paciente. Evitar base64 (infla la BD y el egress — fue la causa del incidente de #110). El límite de 1 GB gratuito que antes frenaba esto ya no aplica con Pro
- [ ] Límite de tamaño por archivo y por paciente
- [ ] UI: nueva pestaña "Archivos" en ficha del paciente
- [ ] Vista previa de PDFs e imágenes
- [ ] Para análisis de sangre: parseo opcional con IA para extraer valores clave (hemoglobina, glucosa, colesterol, etc.) y mostrarlos en un resumen/cuadrito
- [ ] **Histórico de analíticas** — Vista tipo tabla/gráfica donde se vean todos los valores de todas las analíticas del paciente a lo largo del tiempo (ej: glucosa en enero 95, en abril 88, en julio 82). Similar a lo que Ainara hace manualmente con IA + Excel
- [ ] **Más marcadores de analítica con evolutivo** (María Marqués, 3 jun 2026; nutricionista de Ecuador +593, 24 jun 2026; **nutri +34 680 42 09 31, 10 jul 2026**) — Hoy en mediciones solo hay colesterol HDL/LDL/total, triglicéridos y presión (`MedidaAntropometrica`, schema 581-586). Faltan y los piden: **insulina, glucosa, índice HOMA, hierro/ferritina, HbA1c, hormonas tiroideas (TSH, T4 libre, T3) y marcadores de función hepática** (GOT/GPT/GGT...). La nutri del 10 jul lo pone como valor "determinante": recalca que **sean opcionales** ("los completaría y ya es opcional si las requerimos o no") y que son clave en ciertas patologías (su ejemplo: paciente con **hipotiroidismo** → tiroideas). Que se puedan introducir y ver su evolución en el tiempo. **Nota de modelado:** la lista de marcadores no para de crecer → valorar un modelo **flexible clave-valor** (catálogo de marcadores + valor por fecha) en vez de seguir añadiendo columnas fijas a `MedidaAntropometrica`
- [ ] **UX del apartado de datos analíticos** (nutricionista de Ecuador, 24 jun 2026) — hoy los datos analíticos están **al final** de la página de mediciones y hay que hacer mucho scroll para rellenarlos/verlos ("como están al final tengo que subir"). Mejorar el layout para que se vean/editen fácil sin tanto scroll (sección plegable, 2 columnas, o subirlos en el orden). Mejora de usabilidad, sobre todo al ir introduciendo varios valores
- [ ] Permitir al paciente subir archivos desde su portal (opcional, configurable por dietista)
- [ ] **VA DE LA MANO con #51 (acuerdo de tratamiento):** un mismo apartado "Documentos/Archivos" en el **perfil del paciente** alberga tanto las analíticas/archivos (#2) como el **acuerdo de encargado de tratamiento firmado y los consentimientos** (#51). Diseñar la fase de datos (modelo + bucket de Storage) **a la vez** para no hacerla dos veces

**Prioridad:** Media-Alta
**Complejidad:** Media (alta si se incluye parseo IA de analíticas)

---

## 3. Combinar tipos de dieta en planes (tags múltiples)

**Estado actual:** Al generar plan con IA se puede elegir UN tipo de dieta (mediterránea, antiinflamatoria, hipocalórica, etc.). No se pueden combinar.

**Petición:** Poder combinar, por ejemplo: "antiinflamatoria + alto en proteínas" al crear un plan.

**Tareas:**
- [ ] Cambiar el selector de tipo de dieta de single-select a multi-select (tags/chips)
- [ ] Actualizar el prompt de la IA para aceptar múltiples objetivos combinados
- [ ] Permitir tags personalizados además de los predefinidos
- [ ] Guardar los tags en el modelo `PlanAlimenticio` (campo JSON o relación many-to-many)
- [ ] Mostrar los tags en la lista de planes y en el PDF

**Prioridad:** Media
**Complejidad:** Baja-Media

---

## 4. Mejorar formato del PDF entregable

**Estado actual:** PDF vertical (A4). **Nota técnica (verificado 9 jul 2026):** hoy se genera server-side en `src/app/api/pdf/route.ts` con Puppeteer (`page.pdf({ format: "A4" })`), NO con `window.print()`. La orientación está fija a vertical y el HTML/CSS (`generate-plan-pdf.ts`) está maquetado para ese ancho. Se reporta que a veces queda media hoja vacía.

**Petición:** Ajustar formato para que no queden hojas medio vacías. Opción de orientación horizontal.

**Input adicional (Ainara Martín, 2 jun 2026):**
1. **Orden de secciones del PDF** — Ella pondría el "Plan semanal completo" (tabla de los 7 días) **al final, justo antes de la lista de la compra**, en vez de al principio. → Idealmente: poder reordenar las secciones del PDF, o al menos revisar el orden por defecto
2. **Recetas en el entregable, opción más visible** — No encontraba cómo incluir las recetas en el PDF. VERIFICADO en código: los ingredientes e instrucciones de las recetas SÍ salen, pero **dentro** del bloque "Detalle diario de comidas" (sin toggle propio). → Valorar opción explícita "Incluir recetas (ingredientes y preparación)" en el modal, o aclarar en el texto descriptivo del toggle de detalle diario
3. **Referencia: plantillas de informes de su software de escritorio** (ver vídeo abajo) — Su programa permite elegir entre múltiples modelos de informe activables con ✓/✗: Portada, Consejos, Ficha Técnica, Lista de la Compra, **Recetas Alternativas**, Menú Diario, Menú en Columnas, **Menú con Fotos**, Menú Distribuido, Menú del Día, **Menú Colectividades**, Planning Días, Planning Comidas — con cabecera personalizable (clínica, doctor, dirección, email, teléfono), texto alternativo a "Paciente", texto a pie de página, logotipo y posición del logotipo, estilos vinculables

**Reiterado (nutricionista, WhatsApp — 9 jul 2026):** pide poder **descargar los entregables en horizontal (apaisado)** en vez de en vertical. Confirma la demanda de la opción de orientación (útil sobre todo para el plan semanal en tabla, que apaisado respira más).

**Tareas:**
- [ ] Auditar el CSS de impresión en `src/lib/pdf/generate-plan-pdf.ts` para eliminar espacios en blanco innecesarios
- [ ] Mejorar el `page-break` para que las comidas no dejen huecos grandes
- [ ] Implementar layout compacto: agrupar comidas cortas en la misma página
- [ ] Añadir opción de orientación vertical/horizontal. **Técnica real (9 jul 2026):** los PDF se generan en `src/app/api/pdf/route.ts` con Puppeteer `page.pdf({ format: "A4" })`; para apaisado pasar `landscape: true` a `page.pdf()` (propagar un flag desde el body del POST y desde `pdf-download.ts`/`html-to-pdf.ts`). **Ojo — no basta el flag:** el HTML/CSS de `generate-plan-pdf.ts` está pensado para el ancho de A4 vertical; en apaisado hay que adaptar anchos/columnas/tablas o el contenido queda a un lado con medio folio en blanco. Un buen landscape del plan semanal aprovecharía el ancho para la tabla de 7 días.
- [ ] Opción de densidad: "normal" vs "compacto" (reduce paddings, fuentes más pequeñas)
- [ ] Considerar layout de 2 columnas en horizontal para aprovechar espacio
- [ ] Probar con planes reales de diferentes tamaños para verificar
- [ ] **Reordenar secciones** (Ainara) — mover el plan semanal al final antes de la lista de la compra, o hacer el orden configurable
- [ ] **Toggle explícito de recetas** (Ainara) — opción visible "Incluir recetas" en el modal de exportación

**Archivos a modificar:**
- `src/lib/pdf/generate-plan-pdf.ts` (layout principal)
- `src/lib/pdf/pdf-themes.ts` (si se añaden opciones de densidad)
- `src/components/paciente/entregables-tab.tsx` (UI de opciones)

**Prioridad:** Media
**Complejidad:** Media

---

## 5. Planes por opciones de comida (sin separar por día)

> ⭐ **PRIORIDAD ALTA — a montar ya (hoy/mañana, jun 2026).** Antonio (lead caliente) dice que si se incluye esta opción **migra a sus clientes a Annonia mañana mismo**. La IA ya se está trabajando en paralelo en otra terminal.
>
> 🔁 **Antonio RE-pregunta el 15 jun** ("¿incluisteis finalmente la posibilidad de realizar los planes por opciones?") y reitera la señal de conversión: *"si incluyeseis esa opción, mañana mismo estaría migrando a mis clientes a Annonia sin duda; me parece increíble la interfaz y me gusta todo bastante"*. Lead muy listo para convertir → urgencia real.
>
> ⚠️ **OJO — no confundir con #55 (ya desplegado).** Lo que está hecho y en producción es el **intercambio por ÍTEM** (#55): dentro de una comida, un alimento/receta tiene alternativas equivalentes ("leche *o* cereales"). Lo que pide Antonio aquí (#5) es distinto: **OPCIONES DE COMIDA COMPLETA** (p. ej. 3 desayunos enteros distintos, todos mismos macros/kcal, y el paciente elige uno). Esta #5 SIGUE PENDIENTE. El primer intento técnico de "modalidad opciones sin días" se revirtió en su día; el enfoque a reabrir está por decidir.

**Estado actual:** Los planes SIEMPRE se organizan por día de la semana (LUNES a DOMINGO). Modelo: `PlanAlimenticio → DiaDelPlan(dia: DiaSemana) → ComidaDelDia → AlimentoEnComida`.

**Petición:** Modo alternativo donde el profesional da "opciones de desayuno", "opciones de almuerzo", etc., sin asignar a un día concreto. Que el profesional elija el formato según el paciente.

**Input adicional (Antonio, antoniofs.nutricion — Instagram, 4 jun 2026):** Lo plantea como **dos modalidades de creación de planes** que el nutri elige:
1. **Dieta "clásica"** — por días (Lunes desayuno: x, comida: x, cena: x / Martes...). La actual.
2. **Dieta por opciones** — X opciones de desayuno (todas con los mismos macros y kcal), X de media mañana, de comida, de merienda, de cena... y **el paciente elige libremente** entre las opciones de cada comida. Al tener todas los mismos macros/kcal, da libertad: cocina más rápido o más elaborado según el tiempo de cada día.
**Valor clave que destaca Antonio:** además de comodidad, sirve para **educar al paciente** en la correcta elección de alimentos (aunque podría elegir siempre lo mismo, aprende a variar). "Mayor libertad de elección." Es como trabaja él y como sus pacientes están acostumbrados a seguir.
**Requisito de las opciones:** todas las opciones de una misma comida deben tener (aprox.) los mismos macros y kcal → al crear/validar, ayudar a que cuadren.

**Tareas:**
- [ ] Añadir campo `modalidad` al modelo `PlanAlimenticio`: "SEMANAL" (actual) o "OPCIONES"
- [ ] En modalidad OPCIONES: reutilizar `DiaDelPlan` pero renombrando conceptualmente (Opción 1, Opción 2, etc.) o crear nuevo modelo
- [ ] Alternativa: usar `DiaDelPlan.dia` con valores especiales (OPCION_1, OPCION_2...) o un campo `label` libre
- [ ] UI del editor de plan: cuando modalidad = OPCIONES, agrupar por tipo de comida (Desayunos, Almuerzos, Cenas) en vez de por día
- [ ] Actualizar generación con IA para soportar modalidad OPCIONES
- [ ] Actualizar PDF: en modalidad OPCIONES, layout agrupado por comida (no por día)
- [ ] Actualizar vista del paciente en portal para mostrar opciones correctamente
- [ ] Selector al crear plan: "¿Cómo quieres organizar este plan?"
- [ ] **El paciente puede ELEGIR** entre las opciones de cada comida desde su portal (Antonio) — no solo verlas, sino marcar/registrar cuál elige cada día
- [ ] **Validación de macros entre opciones** (Antonio) — al crear opciones de una misma comida, mostrar los macros/kcal de cada una para que el nutri las cuadre (todas ~iguales)

**Archivos principales a modificar:**
- `prisma/schema.prisma` (modelo PlanAlimenticio)
- `src/app/actions/planes.ts`
- `src/app/(dashboard)/dietas/[id]/` (editor de plan)
- `src/lib/pdf/generate-plan-pdf.ts`
- `src/app/paciente/portal/dieta/page.tsx`
- `src/app/(dashboard)/dietas/[id]/generar-ia/ia-generation-form.tsx`

**Prioridad:** Alta
**Complejidad:** Alta (toca modelo de datos, editor, PDF, portal y IA)

---

## 6. Formulario pre-consulta — que el CLIENTE rellene la anamnesis (no el profesional)

> ⭐⭐ **PRIORIDAD MÁXIMA / bloqueante de adopción (Miguel Fernández Morillo — Nutrition Efficiency, 21 jun 2026).** Es de lo que más frena el arranque, sobre todo en consulta ONLINE: el profesional no debería rellenar la anamnesis a mano; debe rellenarla el cliente. Miguel está dando de alta clientas YA y dice que esto le frena todo el trabajo inicial (de hecho da acceso en paralelo a otra herramienta, "Núcleo", por esto). Pérdida de tiempo clara para quien trabaja online.

**Estado actual (VERIFICADO en código, 21 jun 2026):** La anamnesis la rellena el dietista en la pestaña "Información". Existe `enviarCuestionarioPaciente` (`email.ts:171`), pero **NO envía un formulario para que el paciente lo rellene: envía un EMAIL con un RESUMEN de lo que el profesional ya metió** (`buildCuestionarioHtml`: "tu nutricionista ha registrado la siguiente información… si algo no es correcto, responde a este correo"). **No existe ninguna ruta de formulario público/del paciente** para rellenar la anamnesis (confirmado: no hay `/preconsulta` ni equivalente). → El flujo actual no tiene sentido para online: el cliente recibe sus datos ya rellenados, no un cuestionario que completar.

**Petición:** Enviar al paciente un formulario ANTES de la consulta para que complete sus datos (contacto, fecha de nacimiento, alergias, etc.) y no perder tiempo de consulta.

**Input adicional (Alejandra, 2 jun 2026):** Lo pide como "informe de salud pre-entrevista" que el paciente rellene antes de la primera consulta, y recalca que esos datos **se vuelquen automáticamente en los apartados correspondientes** de la ficha (historial médico, alergias, medicamentos, suplementos, actividad física…), no que queden como un documento aparte.

**Input adicional (Miguel Fernández Morillo — Nutrition Efficiency, 21 jun 2026) — flujo completo estilo Nutrium:**
1. **Alta del cliente mínima:** al registrar, solo nombre completo, género (M/F), fecha de nacimiento y correo; teléfono opcional. El profesional NO mete peso/altura/datos clínicos.
2. **Enviar la anamnesis al cliente** (por correo y, si hay teléfono, también por mensaje/WhatsApp): le llega un **formulario para que LO RELLENE él** (no un resumen ya hecho).
3. El cliente rellena su info (peso, altura, objetivo, función intestinal, hábitos…) y **se vuelca automáticamente** en su ficha.
4. El profesional luego **edita** lo que quiera (la ficha sigue editable como ahora — esa parte se mantiene).
5. **Encadenar con el cálculo automático:** al tener ya peso + altura + edad + objetivo (rellenados por el cliente), que la pestaña Planificación **calcule sola** el gasto energético/objetivos sin teclear nada (editable después). Enlaza con #78-A (objetivos absolutos heredados).
6. **Mantener el modo actual** (cuestionario editable por el profesional, sin enviarlo) para quien trabaje presencial. Es decir: AÑADIR el modo "lo rellena el cliente", sin quitar el de ahora.

**Matiz sobre el correo (Guillermo, 21 jun):** no hacer el correo estrictamente obligatorio sin más. Si el cliente no tiene correo, contemplar: enviarlo por otra vía (mensaje/WhatsApp), o avisar/mostrar un error claro, o generar un **link** que el cliente abra para rellenar. A decidir al diseñarlo.

**Tareas:**
- [ ] Crear ruta pública o autenticada para formulario pre-consulta: `/paciente/portal/preconsulta` o `/preconsulta/[token]`
- [ ] Definir qué campos del formulario puede completar el paciente (datos personales, alergias, intolerancias, patologías, medicamentos, hábitos)
- [ ] Reutilizar los tipos de `ficha-informacion-types.ts` para el formulario del paciente
- [ ] El dietista configura qué campos enviar (reutilizar sistema de campos personalizados existente)
- [ ] Enviar link al paciente por email (nuevo template de email)
- [ ] Cuando el paciente completa el formulario, los datos se guardan en la ficha del paciente
- [ ] Notificar al dietista cuando el paciente complete el formulario
- [ ] El dietista puede revisar y ajustar los datos en consulta
- [ ] Marcar visualmente qué datos fueron completados por el paciente vs el dietista
- [ ] **Simplificar el alta del cliente** (Miguel): registrar solo con nombre, género, fecha de nacimiento y correo (teléfono opcional); no exigir peso/altura/datos clínicos al profesional
- [ ] **Enviar también por mensaje/WhatsApp** si hay teléfono, no solo por email
- [ ] **Sin correo:** contemplar alternativa (otra vía, error claro o un link abrible) — no bloquear con un correo obligatorio a secas
- [ ] **Encadenar con Planificación:** que los datos que rellena el cliente (peso/altura/edad/objetivo) disparen el cálculo energético automático (#78-A)
- [ ] **Mantener el modo actual** (el profesional rellena la ficha sin enviarla) como opción para consulta presencial

**Relacionado con:** #18 (anamnesis), #78 (objetivos/planificación → cálculo automático), #51 (consentimiento antes de la anamnesis)
**Prioridad:** ⭐⭐ MÁXIMA — bloqueante de adopción para nutris online (lo piden Miguel, Alejandra y Ainara)
**Complejidad:** Media-Alta

---

## 7. Selector de país en paciente (código de área telefónico)

**Estado actual:** Campo `telefono` es un string libre (maxLength 20), sin código de área ni selector de país. No existe campo `pais` en el modelo `Paciente`.

**Petición:** Poder seleccionar el país del paciente para que se añada automáticamente el prefijo telefónico.

**Tareas:**
- [ ] Añadir campo `pais` (opcional) al modelo `Paciente` en schema.prisma
- [ ] Crear componente de selector de país con bandera + prefijo telefónico
- [ ] Lista de países con prefijos (ISO 3166 + prefijos ITU)
- [ ] Actualizar `paciente-form.tsx`: reemplazar input tel simple por selector de país + teléfono
- [ ] Actualizar `perfil-form.tsx` del portal del paciente
- [ ] Migración de datos: pacientes existentes sin país → dejar vacío o inferir de configuración del dietista
- [ ] El país del paciente podría usarse en el futuro para: tabla de composición, moneda de pago, etc.

**Prioridad:** Baja-Media
**Complejidad:** Baja

---

## 8. Múltiples actividades en registro diario

**Estado actual:** El modelo `SeguimientoDiario` solo permite UNA actividad por día: `ejercicioTipo` (string), `ejercicioMinutos` (int), `ejercicioKcal` (int), `ejercicioDistanciaKm` (float). Constraint unique: `[pacienteId, fecha]`.

**Petición:** Si el paciente entrenó musculación y corrió, o tiene doble turno de entrenamiento, debería poder registrar ambas actividades.

**Tareas:**
- [ ] Crear modelo `ActividadEjercicio` (id, seguimientoId, tipo, minutos, kcal, distanciaKm, notas)
- [ ] Relación: `SeguimientoDiario` → has many `ActividadEjercicio`
- [ ] Migrar datos existentes: mover campos de ejercicio de SeguimientoDiario a registros en ActividadEjercicio
- [ ] Mantener campos legacy en SeguimientoDiario como suma/resumen (o eliminarlos tras migración)
- [ ] Actualizar UI `ejercicio-card.tsx`: permitir añadir múltiples actividades (lista con botón "+")
- [ ] Cada actividad con su propio tipo, duración, distancia y kcal
- [ ] Totales sumados para el día
- [ ] Actualizar server action `guardarSeguimiento` para manejar array de actividades
- [ ] Actualizar vista del dietista que muestra el seguimiento del paciente
- [ ] Actualizar cálculo automático de kcal (MET × peso × minutos/60 por cada actividad)

**Archivos principales a modificar:**
- `prisma/schema.prisma`
- `src/app/actions/seguimiento-paciente.ts`
- `src/components/paciente/seguimiento/ejercicio-card.tsx`
- `src/lib/ejercicios-db.ts` (ya tiene base de datos de ejercicios con MET)

**Prioridad:** Media
**Complejidad:** Media

---

## 11. Link público de reserva de citas

**Estado actual:** Los pacientes solo pueden solicitar citas desde el portal autenticado (`/paciente/portal/citas/nueva`). No existe un link público tipo Calendly.

**Petición:** Un link que el dietista pueda compartir para que pacientes (nuevos o existentes) reserven cita directamente.

**Tareas:**
- [ ] Crear ruta pública `/cita/[dietistaSlug]` o `/reservar/[token]`
- [ ] El dietista genera un link de reserva desde ajustes
- [ ] Mostrar disponibilidad del dietista (reutilizar `getHuecosLibresDelNutri`)
- [ ] Formulario para pacientes NO registrados: nombre, email, teléfono, motivo
- [ ] Para pacientes registrados: auto-rellenar datos si se autentican
- [ ] Configurar: duración de cita, modalidad (presencial/online), buffer entre citas
- [ ] Notificación al dietista cuando se reserve una cita
- [ ] Email de confirmación al paciente
- [ ] Opcionalmente: crear el paciente automáticamente si no existe
- [ ] **Política de cancelación configurable** (Marta, @martadenutri, mayo 2026) — Antelación mínima para cancelar (ej: 24h, 48h), configurable por el nutricionista. Si el paciente cancela fuera de plazo, notificación automática al profesional. Bloquear cancelación si no cumple la antelación mínima (o permitir con aviso)
- [ ] **Compartir el link con CENTROS, no solo con pacientes** (Karina Villavicencio, 14 jul 2026) — poder dar a cada centro donde trabaja un enlace para que agenden directamente en sus huecos. Requiere que el link sea **por ubicación/agenda concreta** (ver #130, múltiples puntos de trabajo)

**Prioridad:** Media
**Complejidad:** Media-Alta

---

## 13. Soporte multi-moneda (pesos argentinos y otros)

**Estado actual:** Pagos solo en EUR. Hardcodeado en `src/app/actions/pagos.ts` (`currency: "eur"`) y en `src/app/actions/stripe.ts` (`country: "ES"`).

**Petición:** Poder cobrar en pesos argentinos (ARS) y otras monedas.

**Tareas:**
- [ ] Añadir campo `moneda` al modelo `Dietista` o `Pago` (default: "EUR")
- [ ] Añadir campo `pais` al modelo `Dietista` para inferir moneda y configurar Stripe correctamente
- [ ] Parametrizar `currency` en `crearPago()` y `crearSesionStripe()`
- [ ] Verificar que Stripe Connect soporte las monedas deseadas (ARS está en beta en Stripe — podría no estar disponible)
- [ ] Si Stripe no soporta ARS: investigar alternativas (MercadoPago para Argentina, etc.)
- [ ] Actualizar `formatEuro()` a una función genérica `formatCurrency(value, currency)`
- [ ] UI en ajustes: selector de moneda
- [ ] Actualizar formularios de pago y facturas para mostrar la moneda correcta

**Prioridad:** Media
**Complejidad:** Media-Alta (depende de soporte de Stripe por país)

---

## 15. Integrar base de datos BEDCA (española)

**Estado actual:** Los micronutrientes se estiman con valores USDA/BEDCA genéricos por categoría. No hay integración directa con la base de datos BEDCA.

**Petición:** Incluir la tabla de composición de alimentos BEDCA como opción. **También lo sugiere Álvaro (alvaromorenonutri, 3 jul 2026):** integrar la base de datos de BEDCA para tener la composición completa y fiable de cada alimento (comenta que la base pública "está bastante bien"). Enlaza con #41 (para que la búsqueda por micronutriente tenga datos fiables detrás).

**Tareas:**
- [ ] Descargar dataset BEDCA (disponible públicamente en bedca.net)
- [ ] Parsear datos: ~900 alimentos con composición nutricional completa
- [ ] Crear script de seed para cargar BEDCA como alimentos globales con fuente = "BEDCA"
- [ ] Añadir campo `fuente` al modelo `Alimento` (BEDCA, USDA, OPENFOODFACTS, ARGENFOOD, PERSONALIZADO)
- [ ] Permitir al dietista filtrar alimentos por fuente
- [ ] En el buscador de alimentos: priorizar fuente según configuración del dietista
- [ ] Micronutrientes de BEDCA son muy completos — usarlos para mejorar la calidad de datos

**Relacionado con:** Tarea #1 (tablas por país)
**Prioridad:** Alta
**Complejidad:** Media

---

## 16. Mostrar origen/fuente de cada alimento con indicador visual

**Estado actual:** Los alimentos tienen un campo `origen` con dos valores: `API` (importado de OpenFoodFacts) y `PERSONALIZADO` (creado por el dietista). En la lista de alimentos se distingue visualmente si es propio o receta, pero no se muestra de qué base de datos viene ni hay leyenda explicativa.

**Petición:** Que al ver un alimento quede claro de dónde se ha sacado (OpenFoodFacts, BEDCA, Argenfood, propio, receta, etc.). Usar colores distintos por fuente y añadir una leyenda para que el profesional sepa qué es cada cosa.

**Reiterado por Guillermo (4 jun 2026):** Mostrar la fuente/tabla de la que sale cada alimento, **preparándolo ya para cuando se añada la tabla europea** (BEDCA/EuroFIR). Importante hacerlo antes/al tiempo de integrar la tabla europea para que el nutri sepa de qué tabla viene cada dato. Enlaza con #1 y #15.

**Tareas:**
- [ ] Ampliar el enum/campo `origen` del modelo `Alimento` para incluir más fuentes: OPENFOODFACTS, BEDCA, ARGENFOOD, USDA, PERSONALIZADO, RECETA (relacionado con tarea #15)
- [ ] Asignar un color distintivo a cada fuente (ej: verde para BEDCA, azul para OpenFoodFacts, morado para Argenfood, naranja para personalizado)
- [ ] Mostrar badge/chip de color con el nombre de la fuente en la lista de alimentos
- [ ] Mostrar la fuente también en la vista de detalle del alimento
- [ ] Añadir leyenda explicativa en la página de alimentos (qué significa cada color/fuente)
- [ ] En el buscador de alimentos (al crear plan/receta), mostrar el badge de fuente junto al nombre
- [ ] Filtrar por fuente en la lista de alimentos (complementa tarea #1)

**Archivos principales a modificar:**
- `prisma/schema.prisma` (ampliar enum OrigenAlimento)
- `src/app/(dashboard)/alimentos/page.tsx` (lista con badges + leyenda)
- `src/app/(dashboard)/alimentos/[id]/` (detalle)
- Componentes de buscador de alimentos en editor de planes y recetas

**Relacionado con:** Tarea #1 (tablas por país) y #15 (BEDCA)
**Prioridad:** Media
**Complejidad:** Baja

---

## 17. Newsletter/correos automáticos de actualizaciones semanales

**Estado actual:** No existe sistema de comunicación masiva a los usuarios. Los mensajes de soporte son individuales vía el chat dentro de la app (admin → dietista).

**Petición:** Enviar correos o mensajes automáticos a todos los dietistas registrados con un resumen de los cambios y novedades semanales de la plataforma.

**Tareas:**
- [ ] Crear modelo `Newsletter` o `Actualizacion` (id, titulo, contenido, fechaEnvio, enviado)
- [ ] Panel en admin para redactar la actualización semanal (editor de texto con formato básico)
- [ ] Opción de enviar por email a todos los dietistas activos (usando el mailer existente)
- [ ] Opción de enviar como mensaje de soporte dentro de la app (reutilizar sistema de mensajes admin existente)
- [ ] Template de email profesional para el changelog/novedades (logo, secciones, links)
- [ ] Permitir al dietista desuscribirse de los correos de actualizaciones (campo `recibirNewsletter` en modelo Dietista)
- [ ] Historial de newsletters enviadas en el panel admin
- [ ] Considerar: sección "Novedades" dentro de la app donde el dietista vea el changelog (además del email)

**Archivos principales a modificar:**
- `prisma/schema.prisma` (nuevo modelo + campo en Dietista)
- `src/app/(admin)/admin/` (nueva sección en panel admin)
- `src/app/actions/email.ts` (nuevo template de email)
- `src/lib/mailer.ts` (envío masivo)

**Prioridad:** Media
**Complejidad:** Media

---

## 18. Personalizar la estructura de la anamnesis por especialidad

**Estado actual:** Existe un sistema básico de campos personalizados (hasta 20 campos de tipo texto/textarea/selector) que se configuran desde Ajustes → Anamnesis. Estos campos se añaden al final de las secciones existentes o en una sección genérica "Campos personalizados". Las 4 secciones principales (Consulta, Personal/Social, Clínica, Alimentaria) y sus ~40 preguntas están fijas y no se pueden modificar, ocultar ni reordenar.

**Petición (Anabel Segura, mayo 2025):** Poder modificar la propia anamnesis según la especialidad. Un nutricionista digestivo quiere añadir un bloque completo de "descarte de celiaquía" con sus preguntas específicas. Uno de deportiva quiere añadir las preguntas que hace en su primera consulta. Cada profesional debería poder configurar su anamnesis para que refleje su práctica clínica, no solo añadir campos sueltos al final.

**Reiterado por Guillermo (apuntes de reuniones, 4 jun 2026):** Anamnesis distinta por perfil (deportistas, etc.), que no sea la misma para todos, y **hacer la edición de la anamnesis más fácil y más visible** (hoy está algo escondida en Ajustes). Demanda recurrente → prioridad.

**Input adicional (Betzabe Díaz, Perú — 9 jun 2026):** Pide considerar **antecedentes familiares** en el historial médico ("ayudan a dar enfoque al plan o a relacionar la aparición de una patología"). VERIFICADO: la anamnesis YA tiene campos `antecedentesPersonales` y `antecedentesFamiliares` (sección clínica de `ficha-informacion-types.ts`). Lo que falta: el **bloque resumen "Historial médico"** de la ficha general (`paciente-ficha-general-tab.tsx`) solo muestra alergias/intolerancias/patologías/medicamentos/suplementos, NO los antecedentes. → Mostrar también los antecedentes (personales y familiares) en ese resumen, para tenerlos a la vista junto al resto del historial.

**Lo que falta (gap respecto a lo implementado):**

- [ ] **Secciones personalizadas con nombre propio** — Poder crear secciones como "Screening digestivo" o "Evaluación deportiva" con título editable, no solo el genérico "Campos personalizados"
- [ ] **Ocultar/mostrar preguntas built-in** — Que el nutri pueda desactivar preguntas fijas que no le son relevantes (ej: un deportivo no necesita "Estado civil")
- [ ] **Reordenar secciones y preguntas** — Drag & drop o flechas para organizar la anamnesis según su flujo de consulta
- [ ] **Tipos de pregunta más ricos** — Checkboxes múltiples, escalas (1-10), condicionales (si responde X, mostrar Y), grupos de preguntas
- [ ] **Editar desde la propia ficha** — Botón para añadir/configurar preguntas directamente mientras rellenas la anamnesis del paciente, sin tener que ir a Ajustes
- [ ] **Plantillas por especialidad** — Presets predefinidos ("Digestivo", "Deportiva", "Pediátrica", "Clínica general") que carguen un set de secciones y preguntas con un clic, personalizables después
- [ ] **Subir el límite de 20 campos** — Para especialidades que necesitan muchas preguntas específicas

**Archivos existentes (base para ampliar):**
- `src/app/(dashboard)/ajustes/campos-anamnesis-form.tsx` — UI actual de gestión
- `src/app/actions/perfil.ts` — `getCamposAnamnesis()`, `guardarCamposAnamnesis()`
- `src/components/paciente/paciente-ficha-informacion-tab.tsx` — renderizado de la ficha
- `src/lib/ficha-informacion-types.ts` — tipos y constantes de la anamnesis
- `src/lib/pdf/generate-anamnesis-pdf.ts` — PDF con campos custom
- `src/app/actions/email.ts` — email del cuestionario con campos custom

---

### 📋 Material de referencia: anamnesis completa de Ainara Martín (Instagram, 2 jun 2026)

Ainara cumplió lo prometido y envió el resumen de TODO lo que pregunta tras **10 años pasando consulta**. Es la base perfecta para las plantillas por especialidad.

**Estructura que propone:** pestañas dentro de "Información", debajo de la principal — **Anamnesis general, Digestivo, Deportivo, Fertilidad y embarazo** — cada tema con su pestaña, "de forma que para revisar algo también es más rápido".

**ANAMNESIS GENERAL:**
- Motivo de consulta (ej: perder peso); complexión cuando era pequeño, adolescente y adulto
- Antecedentes familiares por rama paterna y materna, y hermanos
- Patologías **por sistemas**, cada una con espacio para escribir: generales (anemia, vit. D, colesterol…), ginecológicas, dermatológicas, digestivas, neurológicas, tiroides, hepáticas, estrés, ansiedad, depresión…
- Medicación: cuál, cuánto y cuándo la toma
- Vitaminas, probióticos; tratamientos antibióticos que haya hecho
- Alergias a medicación u otras; alergias alimentarias; sospechas no diagnosticadas ("no le han dicho que es alérgica pero nota que no le sienta bien")
- Hábitos de cocina: quién cocina en casa, si le gusta, si abusan de sal o aceite, cómo se suele cocinar
- Platos favoritos y cuáles no piensa comerse
- Bebidas: refrescos, alcohol, café (cuántos, cómo, si edulcora), tés, colacao, agua (cuánta)
- Tabaco: si fuma, intención de dejarlo, hace cuánto lo dejó, si cogió peso, si no piensa dejarlo
- **Registro de 24 horas**: un día entre semana y un día libre/fin de semana

**DIGESTIVO** ("puede ser infinito"):
- Digestiones, hinchazón (desde qué momento del día, si la nota más con alguna comida)
- Ardor/reflujo/acidez (con qué lo nota); gases o eructos (con qué más)
- Dolor de tripa (cuántos días, cómo es el dolor); dolores de cabeza
- Hábito intestinal: cómo va al baño (si es mujer: cambios de frecuencia con la regla), sensación de evacuación incompleta, **escala de Bristol**, si flotan las heces, cambios de color u olor
- Para indagar causas: estrés, viajes a países tipo África/Asia/Sudamérica, si ha vivido fuera (Erasmus…), covid…

**DEPORTIVO:**
- Entrenos: días y horas, si dobla sesiones
- Tomas pre y post entreno y qué toma; suplementación
- Si va a gym, si le pautan el entreno o va por libre
- Objetivos de competición si los tiene; sensaciones entrenando

**FERTILIDAD Y EMBARAZO** (enfocado a mujer):
- Cómo nació: parto natural/cesárea; lactancia (pecho, fórmula o mixto); peso al nacer
- Primera regla y cómo son las reglas (¿regulares?), dolorosas, abundantes
- Método anticonceptivo (si toma o tiene alguno)
- Menopausia: cuándo empezó con desarreglos, cuánto tiempo hasta estar oficialmente en menopausia, síntomas notados…

**ONCOLOGÍA** (añadido 2 jun 2026): Ainara tiene cada vez más pacientes oncológicos y va a crear en su sistema una pestaña exclusiva de preguntas solo para ellos (como la deportiva o la general). Incluir "Oncología" como plantilla/pestaña de especialidad. Relacionado: en función del tipo de cáncer y los efectos secundarios del tratamiento, se excluyen alimentos/recetas (ver tarea #69).

**Prioridad:** Alta
**Complejidad:** Media-Alta

---

## 21. Medidas caseras y porciones por unidades

> **Ya hecho y desplegado (jun 2026):** (1) 807 alimentos globales con su medida casera por defecto (huevo→ud 60 g, plátano→ud 120 g, leche→ml 250, pan→reb, jamón→loncha, atún→lata…); resto en gramos a propósito (carnes/pescados frescos, verduras, arroz/pasta). (2) Unidades **LATA y LONCHA** nuevas en el enum. (3) En el **selector al añadir**: clic abre panel de cantidad, macros etiquetados "por 100 g", equivalencia "2 ud × 120 g = 240 g", y **conmutador unidad↔gramos** (pasar a gramos guarda en gramos; volver a unidad redondea a 0,5 y recalcula). Script reproducible: `scripts/asignar-unidades-alimentos.ts`.

**Estado actual:** El enum `UnidadMedida` tiene 10 unidades. Cada alimento tiene `porcion` (gramos por unidad) y `convertirAGramos()` calcula bien (2 UNIDAD × 120g = 240g). El paciente ve la unidad ("2 ud"). Lo que falta son las porciones nombradas/múltiples por alimento y cambiar la unidad de un alimento **ya añadido** al plan (el conmutador hoy solo está al añadir, no en la tarjeta del plan).

**Petición (Alba F. / albaf.nutricion, mayo 2025; nutricionista argentina, mayo 2026; Ainara Martín, mayo 2026):** Quiere poner "2 yogures" y que la app entienda que son 250g. O "2 huevos" y que sepa que son 120g. Sin tener que calcular los gramos manualmente. Más visual para el paciente también. La nutricionista argentina pide poder usar medidas caseras (1 taza, 2 tazas…) en los alimentos precargados/globales, no solo en los personalizados. Ainara refuerza: "que en las recetas haya equivalencias a medidas caseras, a la gente no le gusta pesar la comida pero si le dices 2 cazos de alubias sí lo hacen". Aplicar especialmente en recetas, donde los ingredientes deberían mostrarse en medidas caseras (cazos, vasos, cucharadas) además de gramos.

**Input adicional (Lucía Hernández, LinkedIn — 9 jun 2026):** Poder añadir una **anotación libre por alimento** junto a la cantidad, sobre todo para indicar la **medida casera**: ej. "Aceite de oliva (10 g) — anotación: cucharada sopera". Y que esa anotación **aparezca también en el entregable (PDF)**, porque muchos pacientes no pesan la comida y siguen mejor el plan con medidas caseras. VERIFICADO: `AlimentoEnComida` NO tiene campo de nota/anotación → habría que añadir un campo `nota`/`medidaCasera` por alimento y mostrarlo en el plan, portal y PDF. (Encaja con esta tarea de medidas caseras; es una forma rápida y libre de darlas sin necesidad del sistema completo de porciones nombradas.)

**Input adicional (nutricionista +34 693…, WhatsApp — 8 jun 2026):** "Al meter el desayuno no puedo modificar la leche, entra con 250 y no me deja cambiarla, solo ver macros. Y faltan más medidas como cuchara, unidad." → **Resuelto en gran parte:** al añadir ya se puede ajustar cantidad y cambiar unidad↔gramos, y existen LATA/LONCHA + las medidas caseras pobladas. Queda solo cambiar la unidad de un alimento ya añadido en la tarjeta.

**VERIFICADO en código (estado real y preciso de las unidades, jun 2026):**
- **Al CREAR un alimento propio SÍ se elige la unidad**: `alimento-form.tsx` tiene `<select name="unidad">` con todas las opciones (g, ml, unidad, cucharada, cucharadita, taza, rebanada, pieza) + campo `porcion` (gramos por unidad). PERO: **una sola unidad por alimento** (un único campo `unidad`), y solo en los alimentos **que tú creas** (Guillermo, 8 jun: "solo una unidad por alimento y solo los nuevos").
- **Alimentos precargados/globales**: vienen con su unidad de origen (la leche en ml) y el nutri **no puede cambiarla** (no son editables / no hay opción). Por eso la nutri no puede pasar la leche a "vaso/cuchara".
- **En el EDITOR DEL PLAN**: la unidad es solo una **etiqueta de texto** (`alimento-card.tsx` muestra `unidadLabel`; no hay selector de unidad ni en la card ni en `comida-slot.tsx`). Solo se edita la **cantidad numérica**, no la unidad.

→ **Gaps principales a cerrar:** (a) cambiar la unidad de un alimento **ya añadido** en la tarjeta del plan (al añadir ya se puede); (b) **varias medidas por alimento** (no solo una).

**Lo que falta (gap):**
- [ ] **⭐ Cambiar la unidad en la tarjeta del plan** — al **añadir** ya hay conmutador unidad↔gramos; falta poder cambiarla también en un alimento **ya añadido** (hoy en la tarjeta la unidad es etiqueta fija, solo se edita el número)
- [ ] **Porciones nombradas por alimento** — Que yogur tenga "1 yogur = 125g", huevo tenga "1 huevo = 60g", pan tenga "1 rebanada = 30g". No solo la genérica "UNIDAD" sino nombres específicos
- [ ] **Múltiples porciones por alimento** — Un alimento podría tener varias medidas: "1 unidad (125g)", "1 tarrina (250g)", "1 cucharada (15g)"
- [ ] **Tallas de ración S / M / L por alimento** (nutricionista en reunión, 10 jun 2026) — poder definir por alimento unos tamaños con sus gramos (ej. S = 40 g, M = 50 g, L = 60 g) y elegir la talla al pautar. Más vistoso e intuitivo para el paciente que un número en gramos
- [ ] **Editar cantidad/unidad en la lista de la compra** — los huevos y demás ya salen en su unidad casera (ud) ahora que el alimento la tiene bien; falta poder **editar** la cantidad/unidad directamente en la propia lista
- [ ] **Confusión de UX detectada**: al hacer clic en el NOMBRE del alimento en la comida, se navega a la ficha del alimento (solo lectura, "ver macros") — varias nutris creen que ahí se edita la cantidad. La cantidad se edita en el input numérico junto al alimento. Valorar que el nombre no saque de la edición o dejar más claro dónde se cambia cantidad/unidad
- [ ] **Medidas caseras en INGREDIENTES de recetas + fracciones** (nutricionista email, 8 jun 2026) — al añadir ingredientes a una receta, poder elegir entre cucharadita, cucharada, taza, rebanada, piezas, y **fracciones: mitad (1/2), cuarto (1/4)**, etc. (las fracciones son un matiz nuevo a soportar además de las unidades existentes)

**Referencia:** FatSecret, Nutrium (tienen porciones caseras por alimento)

**Prioridad:** Alta
**Complejidad:** Media

---

## 22. Ajustar ingredientes de recetas dentro del plan

**Estado actual:** Cuando se añade una receta a un plan, se puede cambiar el número de porciones (1, 1.5, 2...) que escala todos los ingredientes proporcionalmente. Pero NO se pueden ajustar ingredientes individuales. Si la receta tiene 80g de garbanzos y para otro paciente quieres 200g, tienes que editar la receta original (lo que afecta a todos los planes que la usan) y volver a añadirla.

**Petición (Alba F. / albaf.nutricion, mayo 2025; Guillermo, mayo 2026):** Poder ajustar las cantidades de cada ingrediente de una receta directamente desde el plan, sin tener que editar la receta original. Dice que ninguna plataforma que ha visto lo hace bien. La edición debe ser posible **en el momento de añadir la receta** al plan: el nutri ve la receta base con sus ingredientes y puede decir "quiero más pasta aquí, quitar el arroz, añadir otro ingrediente" antes de confirmar. La receta original queda intacta para futuros usos.

**Input adicional (nutricionista por WhatsApp, sin identificar — 2 jun 2026):** Al consultar una receta ("gazpacho casero") veía macros y micros pero **no los ingredientes ni sus cantidades**, y pide **poder modificarlos ahí directamente**. Nota técnica: la ficha de la receta (`/recetas/[id]`) SÍ muestra ingredientes con cantidades — probablemente lo miraba desde el buscador del plan (que solo lista nombres de ingredientes, sin cantidades) o dio con un *alimento* llamado así (sin ingredientes). → Reforzar: mostrar ingredientes CON cantidades en el selector del plan y al expandir la receta dentro de la comida.

**Tareas:**
- [ ] Al añadir una receta a un plan, mostrar un paso intermedio con los ingredientes de la receta editables (cantidades, eliminar, añadir nuevos) antes de confirmar la adición
- [ ] Crear una "instancia" editable de la receta (no una referencia fija) que almacene los ingredientes modificados
- [ ] UI para expandir la receta dentro de la comida y seguir ajustando cantidades después de añadirla
- [ ] Los cambios solo afectan a esa instancia en ese plan, no a la receta original
- [ ] Recalcular macros totales de la receta en tiempo real cuando se cambia, elimina o añade un ingrediente
- [ ] Opción de "restaurar receta original" si quieres volver a las cantidades por defecto

**Archivos a modificar:**
- `prisma/schema.prisma` — Posible nuevo modelo para instancias de receta en plan, o expandir `AlimentoEnComida`
- `src/components/dieta/comida-slot.tsx` — UI de edición inline de ingredientes
- `src/app/actions/planes.ts` — Lógica de guardar ingredientes modificados

**Prioridad:** Alta (pedido por múltiples nutris, diferenciador vs competencia)
**Complejidad:** Alta

---

## 23. Guardar combinaciones de alimentos como "comida reutilizable"

**Estado actual:** Las plantillas (`Plantilla`) son planes completos de 7 días. Las recetas (`Receta`) son entidades con ingredientes, instrucciones, porciones. No existe un concepto intermedio de "comida guardada" que agrupe alimentos sueltos y que al reutilizarse se expandan como ingredientes individuales.

**Petición (Alba F. / albaf.nutricion, mayo 2025):** Al estilo FatSecret: poder poner en una comida garbanzos + espinacas + cebolla + aceite, guardarlo como "comida", y al reutilizarlo en otro plan que se añadan como ingredientes individuales (no como receta opaca). Así puedes ajustar cada ingrediente por separado para cada paciente.

**Reiterado (Saúl Pablo Martín, cinsanutricion@gmail.com — 17 jul 2026):** 2º solicitante. Su queja: tarda mucho metiendo alimento por alimento en cada ingesta al montar un plan semanal; pide agilizar la introducción manual. Esta "comida reutilizable" es una de las vías. **Nota de descubribilidad (importante):** Saúl NO estaba usando las funciones de rapidez que YA existen — **copiar un día a varios días** (`copiarDiaADias`), **copiar comida a días**, **plantillas** (`crearPlanDesdePlantilla`) y **generar con IA** (`generarPlanIA`). Que un nutri activo no las encuentre sugiere un problema de visibilidad/onboarding de estas herramientas → valorar hacerlas más visibles (ej. sugerir "copiar este día al resto" tras montar el primero, o un onboarding de "cómo montar un plan rápido").

**Tareas:**
- [ ] Nuevo modelo `ComidaGuardada` — Nombre + lista de alimentos con cantidades/unidades
- [ ] UI para guardar la comida actual como "comida reutilizable" (botón en cada slot de comida)
- [ ] En el selector de alimentos, nueva pestaña "Mis comidas" junto a "Mis alimentos" y "Mis recetas"
- [ ] Al seleccionar una comida guardada, expandir como N entradas individuales de `AlimentoEnComida` (no como referencia)
- [ ] Cada ingrediente editable por separado después de añadir
- [ ] Diferencia clave con recetas: se expanden como ingredientes sueltos, no como un bloque

**Referencia:** FatSecret (la nutri lo recomienda como ejemplo de UX)

**Prioridad:** Media-Alta
**Complejidad:** Media

---

## 24. Cambiar terminología de "dietista" a "nutricionista" en la app

**Estado actual:** En toda la app se usa "dietista" como término para el profesional: textos de UI, emails, PDFs, landing, páginas legales, structured data, etc. El modelo de datos en Prisma se llama `Dietista` y las variables usan esa nomenclatura.

**Petición (mayo 2025):** Usar "nutricionista" o "dietista-nutricionista" en vez de solo "dietista". En España, "dietista" se asocia a la FP (Técnico en Dietética), mientras que "dietista-nutricionista" es el título universitario (Grado en Nutrición Humana y Dietética). "Nutricionista" suena más profesional y es el término que prefieren los graduados universitarios.

**Input adicional (José, WhatsApp — 9 jun 2026):** Pide poder **identificarse según su titulación real** (Dietista-Nutricionista, o **Técnico Superior en Dietética**, etc.) y no únicamente como "nutricionista". VERIFICADO: hoy `Dietista` tiene un campo `especialidad` (libre) y `numColegiado`, pero NO un selector de **titulación profesional** que se refleje en perfil, PDF y portal. → Añadir un campo de **titulación/tipo de profesional** (selector: Dietista-Nutricionista / Técnico Superior en Dietética / Nutricionista / otro) que el profesional elija y que aparezca en sus entregables (PDF #35), perfil y donde se le identifique. Importante para que cada profesional se represente con su título correcto (y legalmente preciso).

**Tareas:**
- [ ] Definir el término a usar: "nutricionista" (más corto) o "dietista-nutricionista" (más preciso). Valorar usar "nutricionista" en la UI general y "dietista-nutricionista" solo donde haga falta (legal, registro)
- [ ] Reemplazar textos visibles al usuario en toda la app: landing, registro, login, dashboard, ajustes, admin panel, emails, PDFs, portal del paciente, páginas legales, structured data
- [ ] Actualizar traducciones (es/pt) en archivos de mensajes
- [ ] NO renombrar modelos Prisma ni variables internas (solo textos de UI)
- [ ] Revisar que el cambio sea coherente en todos los contextos

**Prioridad:** Media (percepción de profesionalidad)
**Complejidad:** Baja (buscar y reemplazar en textos de UI, sin cambios de lógica)

---

## 25. Disclaimer legal al generar dieta con IA

**Estado actual:** Al generar un plan con IA no se muestra ningún aviso legal. El plan se genera y se presenta directamente.

**Petición (Guillermo, mayo 2025):** Mostrar un mensaje de aviso antes de generar el plan con IA del tipo "Este plan ha sido generado por inteligencia artificial y no sustituye el criterio de un profesional de la nutrición. Revísalo antes de asignarlo a un paciente." Con checkbox "No volver a mostrar" que guarde la preferencia del nutricionista.

**Tareas:**
- [ ] Mostrar modal/banner de aviso antes de la primera generación IA
- [ ] Checkbox "No volver a mostrar este aviso"
- [ ] Guardar la preferencia en el modelo `Dietista` (campo `ocultarDisclaimerIA` o similar) o en localStorage
- [ ] Texto legal que cubra la responsabilidad: la IA no es nutricionista, el plan debe ser revisado por el profesional

**Archivos a modificar:**
- `src/app/(dashboard)/dietas/[id]/generar-ia/ia-generation-form.tsx` — mostrar el aviso antes de generar
- `prisma/schema.prisma` o localStorage — guardar preferencia

**Prioridad:** Media-Alta (cobertura legal)
**Complejidad:** Baja

---

## Resumen de prioridades

| # | Petición | Prioridad | Complejidad |
|---|----------|-----------|-------------|
| 1 | Tablas composición por país | Alta | Alta |
| 5 | Planes por opciones (no por día) | Alta | Alta |
| 6 | Formulario pre-consulta: que el CLIENTE rellene la anamnesis (no el profesional) — ⭐⭐ bloqueante online | MÁXIMA | Media-Alta |
| 15 | Integrar BEDCA | Alta | Media |
| 2 | Subir análisis/archivos | Media-Alta | Media |
| 3 | Combinar tipos de dieta | Media | Baja-Media |
| 4 | Mejorar formato PDF | Media | Media |
| 8 | Múltiples actividades/día | Media | Media |
| 11 | Link público reserva citas | Media | Media-Alta |
| 13 | Multi-moneda (pesos) | Media | Media-Alta |
| 7 | Selector país paciente | Baja-Media | Baja |
| 16 | Indicador visual fuente alimento | Media | Baja |
| 17 | Newsletter actualizaciones semanales | Media | Media |
| 18 | Personalizar estructura anamnesis | Alta | Media-Alta |
| 21 | Medidas caseras / porciones por unidades | Alta | Media |
| 22 | Ajustar ingredientes de receta en plan | Alta | Alta |
| 23 | Comidas reutilizables (grupo de alimentos) | Media-Alta | Media |
| 24 | Cambiar "dietista" → "nutricionista" | Media | Baja |
| 25 | Disclaimer legal al generar con IA | Media-Alta | Baja |
| 27 | Reordenar alimentos dentro de una comida (drag & drop) | Media-Alta | Media |
| 28 | Informe de composición nutricional de la dieta | Alta | Media |
| 29 | Sección de medidas de bioimpedancia (BIA Tanita) | Media-Alta | Media |
| 30 | Editar horario del paciente desde el panel — ✅ desplegado (6b837de); pendiente campos de texto | Media-Alta | Baja-Media |
| 32 | Pliegues ISAK completos + sumatoria + perímetro muslo | Alta | Media |
| 33 | Perímetro de muslo en mediciones básicas | Media | Baja |
| 34 | Renombrar "Almuerzo" a "Comida" (configurable) | Media | Baja-Media |
| 35 | Nombre y nº colegiado en portada PDF | Media | Baja |
| 36 | Datos de planificación en PDF (agua, ejercicio, evitar) | Media-Alta | Media |
| 37 | Ocultar filas vacías en tabla semanal PDF | Baja-Media | Baja |
| 38 | Foto del plato en recetas | Media-Alta | Baja |
| 39 | Cuenta de Profesor (casos clínicos + estudiantes) | Alta | Alta |
| 40 | Objetivos del paciente visibles en entregables | Alta | Media |
| 41 | Buscar/ordenar alimentos por micro y macronutrientes | Alta | Media |
| 42 | Almacén, stock y ventas de productos en consulta | Media-Alta | Alta |
| 43 | White-label: app con marca del nutricionista | Media-Alta | Media |
| 46 | Changelog público de novedades | Media-Alta | Baja |
| 47 | Directorio público de nutricionistas | Alta | Alta |
| 48 | Ver todas las fórmulas de % grasa a la vez | Media | Media-Alta (no hay base de cálculo) |
| 49 | Generar plan algorítmico sin IA (desde BD de alimentos) | Media-Alta | Alta |
| 50 | Notas de consulta/seguimiento por sesión | Alta | Media |
| 51 | Documentación RGPD personalizada por nutricionista | Media-Alta | Media |
| 52 | Exportar/importar recetas y composición de alimentos | Media | Media |
| 53 | Recetario imprimible para entregar al paciente | Media-Alta | Media |
| 54 | Registro de saciedad/hambre en seguimiento diario | Media | Baja |
| 55 | Sistema de intercambio de alimentos | Media | Media-Alta |
| 56 | Recomendaciones predefinidas por patología | Alta | Media |
| 57 | Agrupar comidas repetidas en PDF (deduplicación) | Media | Baja-Media |
| 58 | Perímetros de pierna (muslo/gemelo) en métricas | Media | Baja |
| 59 | Fotos de progreso (antes/después) en métricas | Media | Media |
| 60 | Modal "Definir objetivo": labels crudos + objetivo principal | Media | Baja |
| 61 | Registrar infecciones diagnosticadas (fechas) | Media | Baja-Media |
| 62 | Medicamentos/suplementos en tabla + catálogo de suplementos | Media | Baja-Media |
| 63 | Videollamada con Zoom y otras plataformas | Media | Baja-Media |
| 64 | Keto ratio en Planificación | Media-Baja | Baja |
| 65 | Pautar suplementos dentro del plan (momento de toma) | Media-Alta | Media |
| 66 | Etiquetas de tipo de dieta en recetas + filtro | Media-Alta | Media |
| 67 | Especificar patología concreta en objetivo "Patología" | Media-Alta | Baja-Media |
| 68 | Duplicar receta de la app como propia editable | Media-Alta | Baja-Media |
| 69 | Exclusiones automáticas por patología/alérgeno/cocinado | Alta | Alta |
| 70 | Plan de objetivos con proyección temporal | Alta | Media |
| 71 | Farmacología: interacciones fármaco-alimento | Media-Alta | Alta |
| 72 | Link a receta de Instagram/TikTok en las recetas | Media | Baja |
| 73 | Enriquecer recetas globales (pasos + más recetas + fotos) | Media-Alta | Media |
| 74 | Notificaciones de cita al paciente (email + botón WhatsApp) | Alta | Baja |
| 75 | Agrupar/vincular días del plan para editar en bloque | Alta | Media |
| 76 | Lista de compra y enlace compartido desde Entregables | Media | Baja |
| 77 | Resumen con IA del seguimiento (día/semana/mes) | Media-Alta | Media |
| 78 | Objetivos de planificación → dieta + planificaciones por tipo de día | Alta | Baja (A) / Alta (B) |
| 79 | Preparación legal para presentar a universidades (checklist) | Alta | Media |
| 80 | Desglose de macros (grasas sat/mono/poli, azúcares/complejos) en análisis | Media-Alta | Media |
| 81 | Crear plantilla desde la sección de Plantillas | Media | Media |
| 82 | Bug responsive: objetivo "/2000" no se ve en Análisis global | Media | Baja |
| 83 | Recetas/contenido compartido a nivel de centro/empresa | Media-Alta | Media |
| 84 | Bug: checklist del paciente no se actualiza al cambiar el plan | Alta | Media |
| 86 | Verificar app en Google (Calendar no salga como "sospechosa") | Alta | Baja (trámite) |
| 87 | Notas/observaciones escritas en Mediciones (QUICK WIN: backend listo) | Alta | Muy baja |
| 89 | BUG: no se pueden añadir instrucciones al crear receta (form sin campo) | Alta | Muy baja |
| 90 | BUG: las recetas no suman sus micronutrientes al total del día | Alta | Media |
| 91 | Renombrar pestaña "Información" del paciente a "Anamnesis" | Baja-Media | Muy baja |
| 93 | Recetas favoritas en "Mis recetas" del buscador del plan (etiqueta Favorito) | Media-Alta | Baja |
| 94 | La sesión del dietista se cae tras horas/reinicio (refresco de tokens) | Media-Alta | Media |
| 95 | Búsqueda de alimentos por palabras (orden) + sinónimos/alias | Alta | Media |
| 96 | BUG: paciente no accede al portal desde el móvil (sí desde el PC) | Alta | Media |
| 97 | Notificaciones del chat de mensajes en la campana (configurable) | Media | Media |
| 98 | Vista Análisis "Todos": título de cada día en recuadro centrado | Baja-Media | Baja |
| 99 | Clasificar recetas por categoría (desayuno, snack, salsa, puré…) | Media-Alta | Media |
| 100 | Vista Resumen: mostrar tiempos de comida por día (no "X sin alimentos") | Media | Baja |
| 101 | Alimentos solicitados para añadir al catálogo (lista acumulativa) | Media | Baja |
| 102 | Recordatorio de 24h en historia alimentaria con cálculo de ingesta | Media-Alta | Media |
| 103 | Botón "Notificar al paciente" dentro del plan (por valorar) | Baja | Baja |
| 104 | Ingestas configurables: renombrar, horas, nº de comidas, pre-entreno | Alta | Media-Alta |
| 105 | Editor: el buscador no se cierra al añadir (encadenar alimentos) | Alta | Baja |
| 106 | Importar comida de otro plan eligiendo en qué comida pegarla | Media-Alta | Baja-Media |
| 107 | PDF: opción de no incluir las notas en la tabla resumen | Media | Baja |
| 108 | Mostrar la ingesta de agua también en vasos (además de litros) | Media-Baja | Baja |
| 109 | Pautar objetivos en g/kg de peso (proteína), incl. IA | Media-Alta | Media |
| 110 | Imágenes (fotos/logos) a Supabase Storage en vez de base64 en la BD — baja el egress | Alta | Media |
| 111 | Histórico de dietas del paciente accesible y exportable en informe | Media | Media |
| 112 | El paciente registra la comida REAL que ha comido (diario), no solo cumplido | Media-Alta | Media |
| 113 | Botón rápido +20% en el ajuste del objetivo (superávit/realimentación) — ✅ desplegado | Baja | Mínima |
| 114 | BUG citas hora desfasada (zona horaria) — ✅ fix desplegado; citas viejas a mano | Alta | Media-Alta |
| 115 | Portal paciente: permitir eventos solapados en el horario (hoy borra) | Media | Media |
| 116 | Horario del nutri: excepciones por fecha (festivos / cambios puntuales) | Media | Alta |
| 117 | Módulo de entrenamiento/rutinas para el cliente (por valorar, fuera del core) | Por valorar | Alta |
| 118 | Actividad física en anamnesis como lista (varias actividades + frecuencia) | Media | Baja-Media |
| 119 | Recordatorios diarios personalizables al paciente (agua, comidas…) | Media | Media-Alta |
| 121 | Composición ampliada: aminoácidos + desglose de grasas (petición universidad) | Media | Media-Alta |
| 122 | Alimentos sostenibles / huella ambiental (filtro eco-friendly) — a futuro | Por valorar | Alta |
| 123 | Valoración de frecuencia de consumo (CFCA/FFQ) — definir con Claudia | Media | Media-Alta |
| 124 | Admin: ver/gestionar cuentas incompletas (sin verificar) + reenviar link | Alta | Media |
| 125 | BUG visual: ingredientes de recetas cortados (truncate CSS) | Media | Baja |
| 126 | BUG: reescalado de equivalencias aplasta cantidades — ✅ arreglado (62555ae) | Alta | Media |
| 127 | Navegación: al ver/editar plan desde paciente, el sidebar salta a "Dietas" | Media | Baja |
| 128 | Guardar preferencia del nutri de qué secciones lleva el PDF (no remarcar cada vez) | Media-Alta | Baja-Media |
| 129 | Badges/notificaciones: 3 contadores incoherentes + avisos no descartables desde donde se ven | Media-Alta | Media |
| 130 | Múltiples puntos de trabajo con horario propio + agenda compartible por centro | Media | Alta |
| 131 | La lista de la compra ignora las equivalencias (solo el alimento principal) | Media | Media |
| 132 | BUG: la portada del PDF muestra "Annonia" aunque el nutri tenga marca propia | Media-Alta | Baja |
| 133 | Copiar una ingesta debe conservar su nombre (alias) y hora, no solo el tipo | Media | Baja |
| 134 | En el PDF, las recetas usadas como equivalencia no despliegan ingredientes/preparación | Media | Media |
| 135 | Infra: aprovechar plan Pro Supabase (Storage de archivos + copias de seguridad de la BD) | Media-Alta | Baja-Media |
| 136 | Citas: descubribilidad de aceptar/rechazar en el portal (modo proponer) — no tocar aún | Baja-Media | Baja |
| 137 | Guía visual de raciones (fotos con equivalencias g/medidas caseras) | Media | Media |
| 138 | Biblioteca de recetas compartidas por la comunidad de nutricionistas | Media | Alta |
| 139 | Módulo deporte de élite/equipo (cortisol, IgA, wellness, RPE… + media/DE) | Por valorar | Alta |
| 140 | UX importar/copiar/juntar entre planes: contextual por comida (estilo Nutrium) | Media | Media |
| 141 | Horario semanal en franjas de media hora (no solo de hora en hora) | Media | Media |
| 142 | Entregable "tabla de frecuencia de consumo" (además de la del plan) | Media | Media |
| 144 | DESCUBRIBILIDAD: hacer visibles funciones que ya existen (6 casos de soporte) | Alta | Baja-Media |
| 145 | BUG: renombrar una comida / cambiar su hora no se guarda (id temporal + fallo silencioso) | Alta | Baja-Media |
| 146 | BUG: el seguimiento no cuenta las recetas (0 calorías, macros y micros) | Media | Baja |
| 147 | BUG de flujo: plan desde plantilla sin planificación ni objetivos (y no se puede asociar después) | Alta | Media |
| 148 | BUG: al eliminar una dieta se ve un 404 antes de volver al listado | Media-Alta | Baja |
| 149 | Feedback completo de una nutricionista: 8 issues nuevos + 4 funciones que ya existían y no encontró | Alta | — |

---

## 27. Reordenar alimentos dentro de una comida (drag & drop)

**Estado actual:** En el editor de dietas, cada comida (Desayuno, Almuerzo, etc.) muestra los alimentos en el orden en que se añadieron. Existen botones para mover un alimento a otra comida o a otro día, pero NO se puede cambiar el orden de los alimentos dentro de la misma comida. El modelo `AlimentoEnComida` no tiene campo de orden.

**Petición (Anabel Segura, mayo 2025):** Poder reordenar los alimentos dentro de una comida para que el orden tenga sentido lógico (ej: primero el plato principal, luego la guarnición, luego el postre). Idealmente con drag & drop, o con flechas arriba/abajo.

**Reiterado (nutricionista, WhatsApp — 11 jun 2026):** Pide poder **cambiar un alimento a otra ingesta** (mover a otra comida — esto YA existe vía botón) y, sobre todo, **reordenar dentro de la misma ingesta** para cambiar el orden de los alimentos (es el núcleo de esta tarea: falta el reordenado dentro de la comida).

**Tareas:**
- [ ] Añadir campo `orden` (Int, default 0) al modelo `AlimentoEnComida` en schema.prisma
- [ ] Migración: asignar orden secuencial a los alimentos existentes según su posición actual (por createdAt o ID)
- [ ] Implementar drag & drop dentro de cada comida (usar librería como `@dnd-kit/core` o reordenar con botones ▲/▼)
- [ ] Server action para actualizar el orden de los alimentos al reordenar (batch update de `orden`)
- [ ] Asegurar que al añadir un nuevo alimento se le asigne `orden = max + 1` de la comida
- [ ] Actualizar las queries que cargan alimentos de una comida para ordenar por `orden`
- [ ] El orden debe reflejarse también en: PDF del plan, vista del paciente en portal, link compartido

**Archivos a modificar:**
- `prisma/schema.prisma` — campo `orden` en `AlimentoEnComida`
- `src/components/dieta/comida-slot.tsx` — UI de drag & drop o flechas de reordenar
- `src/app/actions/planes.ts` — action para reordenar, actualizar queries con `orderBy: { orden: 'asc' }`
- `src/lib/pdf/generate-plan-pdf.ts` — respetar orden en PDF
- `src/app/paciente/portal/dieta/page.tsx` — respetar orden en portal

**Prioridad:** Media-Alta (mejora la presentación y el sentido lógico de las comidas)
**Complejidad:** Media

---

## 28. Informe de composición nutricional de la dieta

**Estado actual:** El PDF del plan alimenticio muestra QUÉ comer (alimentos, cantidades, comidas por día), y opcionalmente los macros por comida. Pero no existe un informe dedicado que analice la composición nutricional global de la dieta: distribución de macronutrientes, comparación con objetivos, micronutrientes, adecuación nutricional, etc. El análisis parcial se ve en el sidebar del editor de dietas (macros por día), pero no es imprimible ni exportable.

**Petición (mayo 2025):** Informe imprimible de composición nutricional de la dieta. Que el profesional pueda entregar al paciente o guardar en su historial un documento que muestre el análisis nutricional completo del plan.

**Contenido del informe:**
- [ ] **Resumen energético** — Kcal totales por día y media semanal
- [ ] **Distribución de macronutrientes** — Gramos y % de kcal de proteínas, carbohidratos y grasas (por día y media semanal)
- [ ] **Gráfico de distribución** — Gráfico circular (pie chart) con % de macros
- [ ] **Comparación con objetivos** — Si el paciente tiene objetivos configurados (kcal, macros), mostrar cumplimiento (% de adecuación)
- [ ] **Desglose por comida** — Macros por comida del día (Desayuno, Almuerzo, Cena, etc.)
- [ ] **Fibra y micronutrientes** — Si los datos están disponibles, incluir fibra, vitaminas y minerales con % de ingesta recomendada
- [ ] **Tabla resumen semanal** — Tabla con los 7 días, macros por día, y media

**Tareas técnicas:**
- [ ] Crear función `generateNutritionReportPdf()` en `src/lib/pdf/`
- [ ] Reutilizar los cálculos de macros que ya existen en el editor de dietas (analisis-sidebar)
- [ ] Generar gráficos como SVG inline (sin dependencias externas) para el pie chart de macros
- [ ] Añadir botón "Informe nutricional" en la vista del plan y en entregables del paciente
- [ ] Aplicar el mismo sistema de temas/colores/logo que el PDF del plan

**Archivos a crear/modificar:**
- `src/lib/pdf/generate-nutrition-report-pdf.ts` (nuevo)
- `src/components/paciente/entregables-tab.tsx` — añadir botón de informe nutricional
- `src/components/dieta/exportar-pdf-button.tsx` — opción adicional de exportar informe nutricional

**Prioridad:** Alta (petición directa de nutricionistas — necesitan documentar el análisis nutricional)
**Complejidad:** Media

---

## 29. Sección de medidas de bioimpedancia (BIA Tanita)

**Origen:** María Moreno Nutricionista — 23 mayo 2026

**Estado actual (CORREGIDO jun 2026 — verificado en código):** El registro manual de valores de bioimpedancia **YA EXISTE y funciona**. El modelo `MedidaAntropometrica` y la UI de Mediciones (`paciente-ficha-mediciones-tab.tsx`) incluyen: `masaMuscular`, `musculoEsqueletico`, `agua`, `masaOsea`, `grasaVisceral`, `grasaSubcutanea`, `grasaCorporal`, con gráficas de evolución. **Lo que falta:** valores segmentados (brazo der/izq, pierna der/izq, tronco), `metabolismoBasalKcal`, `edadMetabolica`, y la **integración con las máquinas** (que los datos pasen solos sin teclearlos).

**Petición:** Muchos nutricionistas hacen seguimiento con BIA Tanita (básculas de bioimpedancia). Quieren poder registrar los valores segmentados: masa muscular, masa grasa, agua corporal y demás parámetros que proporciona la bioimpedancia, no solo el peso y % de grasa global.

**Input adicional (Marta Espada, 2 jun 2026):** Pregunta directamente si habrá **integración con máquinas de bioimpedancia (InBody, Tanita…)** — es decir, no solo registrar los valores a mano, sino que los datos pasen de la máquina a la app automáticamente. Refuerza que hay demanda real de la parte de integración, no solo del registro manual.

**Input adicional (contacto con software de bioimpedancia propio — 9 jun 2026):** Un contacto comenta que **ellos tienen un software de bioimpedancia** y propone **integrarlo con Annonia**, volcando los datos en la parte de mediciones e **integrándolo con el flujo de revisiones** (#50/#94) para ir valorando la evolución. Pide además que las mediciones sean **rellenables tanto por el paciente como por el nutricionista**.
- Posible vía de integración (partner) además de InBody/Tanita — pedirle qué software es y cómo exporta los datos (API, CSV, etc.).
- [ ] **NUEVO — Mediciones rellenables por el paciente:** VERIFICADO que hoy las mediciones (`MedidaAntropometrica`, incluida bioimpedancia) **solo las rellena el nutri**; el paciente solo registra peso/agua/ejercicio en seguimiento y VE la evolución (portal de evolución = solo lectura). Permitir que el paciente registre sus propias mediciones/bioimpedancia desde el portal (ej. si tiene báscula de bioimpedancia en casa), idealmente dentro de una **revisión** (#50): el nutri "lanza la revisión" y el paciente rellena sus medidas. Requiere una action de mediciones con `getCurrentPaciente` + UI en el portal + que el nutri lo vea/valide.
- [ ] **Sistema de confirmación/aprobación (nutricionista en reunión, 10 jun 2026):** que el paciente pueda meter sus datos de ficha (peso, altura, pliegues, mediciones) desde el portal, pero que NO entren directos: queden **pendientes de aprobación** y le lleguen al nutricionista, que los **acepta o rechaza** antes de que se incorporen al historial (por si el paciente se equivoca). Aplica también a los datos de la ficha/anamnesis que rellene el paciente (relacionado con #6 pre-consulta).

Preguntada por qué máquina usa, responde: **"los más usados son InBody"**, es con los que más familiarizada está; conoce Tanita pero prefiere InBody. → **Priorizar la integración con InBody** (API en la nube, LookinBody Web) sobre Tanita.

**Tareas:**
- [ ] Investigar qué valores devuelve una BIA Tanita típica (masa muscular total y segmentada, masa grasa total y segmentada, agua corporal, masa ósea, metabolismo basal, edad metabólica, grasa visceral, etc.)
- [x] ~~Ampliar el modelo con campos de bioimpedancia~~ — HECHO: `masaMuscular`, `musculoEsqueletico`, `agua`, `masaOsea`, `grasaVisceral`, `grasaSubcutanea` en `MedidaAntropometrica`
- [ ] Campos que aún faltan: `edadMetabolica`, `metabolismoBasalKcal` (la BIA los da y no se registran)
- [ ] Campos segmentados opcionales: brazo derecho/izquierdo, pierna derecha/izquierda, tronco (masa muscular y % grasa por segmento)
- [x] ~~UI en la ficha del paciente~~ — HECHO: dentro de la pestaña Mediciones
- [x] ~~Gráficas de evolución~~ — HECHO
- [ ] Considerar importación automática si Tanita tiene API o exportación de datos
- [ ] **Integración con máquinas (Marta Espada)** — investigar vías de integración por fabricante:
  - InBody: tiene API en la nube (InBody LookinBody Web / API para partners) — investigar requisitos y coste
  - Tanita: los modelos pro (MC-780, DC-430...) exportan CSV por USB/SD y algunos tienen software con exportación — primer paso viable: **importar el CSV/PDF de la máquina** y parsearlo a la ficha del paciente
  - Paso intermedio sin API: subir el archivo de resultados (CSV/PDF) y extraer valores automáticamente (relacionado con el parseo IA de analíticas, tarea #2)

**Prioridad:** Media-Alta (muchos nutricionistas usan BIA como herramienta principal de seguimiento)
**Complejidad:** Media

---

## 30. Editar horario semanal del paciente desde el panel del nutricionista

**Origen:** María Moreno Nutricionista — 23 mayo 2026; **Brisa Florencia Formilan (bflorformilan@gmail.com — 17 jul 2026):** "pongo las horas que mi paciente trabaja y no me aparece reflejado en el calendario; se supone que se ven las horas que trabaja o hace ejercicio."

**Estado actual — DIAGNÓSTICO VERIFICADO (17 jul 2026): son DOS sistemas de horario DESCONECTADOS.**
- **(A) Lo que el NUTRI rellena al crear/editar el paciente** = dos campos de **texto libre** `horarioTrabajo` y `horarioEjercicio` (`paciente-form.tsx:555-574`; columnas `String?` en `schema.prisma:216-217`; se guardan en `pacientes.ts:125-126,156-181`). **PROBLEMA: NO se muestran en ningún sitio de la ficha real ni del portal** — su única lectura en toda la app es la página demo del tour (`tour-demo/page.tsx:88-89`). Es decir, el nutri los escribe y **desaparecen de la vista**.
- **(B) El CALENDARIO / horario semanal** (el grid que la nutri mira) = **otro dato**, el JSON `horario` (`schema.prisma:245-246`), entradas estructuradas `{dia, hora, actividad, color, nota}`. Hoy lo **rellena el PACIENTE desde su portal** (`/paciente/portal/seguimiento/horario`, `paciente-auth.ts:197-221`). En la ficha del nutri se muestra **solo lectura** (`paciente-ficha-general-tab.tsx:233`, `HorarioSemanal readOnly`, `onSave` vacío). El propio texto de la UI lo confirma: "Horario compartido con el paciente a través del portal".
- **NO conectan:** lo que el nutri escribe en (A) no alimenta (B). Y aunque existe un componente para que el nutri edite el calendario (`horario-dietista-wrapper.tsx` → `guardarHorarioPaciente`, `pacientes.ts:471-480`), **está huérfano / sin enganchar** (grep de `HorarioDietistaWrapper` solo devuelve su definición).

**Petición:** que el nutricionista pueda **rellenar/editar el horario semanal (el calendario) del paciente desde su panel**, sin depender de que lo rellene el paciente.

**Tareas:**
- [x] **Enganchar el editor** (DESPLEGADO, commit `6b837de`, 17 jul 2026): la ficha del paciente ya no muestra el horario en solo-lectura; usa `HorarioDietistaWrapper` → el nutri edita el JSON `horario`. Además se rehízo `horario-semanal.tsx`: al hacer clic en una franja se abre el panel **"Nueva actividad"** (categoría con iconos, Desde/Hasta con rango, "repetir también en" varios días, y "¿qué sueles comer?" en comidas), el **mismo panel que usa el paciente en su portal**; el rango se expande a celdas por hora; edición/eliminación por celda. Se mantuvo la vista de tabla de antes (no la de bloques del portal).
- [x] Permisos: `guardarHorarioPaciente` valida el dietista propietario.
- [ ] **PENDIENTE — desconexión de los campos de texto:** `horarioTrabajo`/`horarioEjercicio` (texto libre del formulario de alta) siguen sin mostrarse en ningún lado. Decidir: volcarlos al calendario, mostrarlos o retirarlos, para que el nutri no meta datos que desaparecen.
- Nota: en esta vista (celda = 1 hora) no hay "solapado" como en el portal (añadir sobre una celda ocupada la reemplaza), así que #115 no aplica igual aquí.

**Prioridad:** Media-Alta · **Complejidad:** Baja-Media · **Estado:** ✅ DESPLEGADO lo principal (el nutri ya edita el horario con el mismo panel del paciente); queda PENDIENTE volcar/retirar los campos de texto `horarioTrabajo`/`horarioEjercicio`.

---

## 32. Pliegues cutáneos — protocolo ISAK completo y sumatoria

**Origen:** Guille (nutricionista) — 25 mayo 2026; Álvaro (nutricionista, LinkedIn) — 27 mayo 2026

**Estado actual:** La app ya registra 7 pliegues cutáneos basados en el protocolo Jackson & Pollock: abdominal, axilar, pectoral, subescapular, suprailiaco, tricipital y muslo. Se miden en mm con precisión de 0.1 mm. Se guardan en el modelo `MedidaAntropometrica` y se muestran en la pestaña "Mediciones" de la ficha del paciente. No existe cálculo de sumatoria de pliegues ni ecuaciones de composición corporal a partir de los pliegues.

En perímetros, se registran 4: cintura, cadera, brazo y abdomen. No existe perímetro del muslo.

**Input adicional (Helena Rodríguez, 9 jul 2026) — VERIFICADO en código:**
- **Pliegues que faltan para ISAK:** hoy hay 7 (tricipital, subescapular, suprailíaco, abdominal, axilar, pectoral, muslo). Faltan **bíceps, supraespinal y pierna/pantorrilla** (justo los que pide). Confirma esta tarea.
- **Perímetros que faltan:** solo hay 4 (cintura, cadera, brazo, abdomen). Faltan **muslo, pierna/gemelo y brazo contraído/flexionado** (ver #33 muslo y #58 piernas).
- **Fórmula Carter 1982 (% masa grasa): NO existe.** Además **no hay motor de cálculo de % grasa**: el selector actual (Peterson, Durnin-Womersley, Jackson 3, Jackson 7) solo *etiqueta* el método; el % se introduce a mano. → Implementar el cálculo real a partir de los pliegues, incluyendo **Carter 1982**.
- **Somatocarta y composición por compartimentos** (masa grasa / magra / ósea / residual): NO existen. Los campos de composición se guardan pero sin gráfica de desglose ni somatotipo. Sería el "ISAK completo" (somatocarta + % de compartimentos).
- **Editar una medición:** hoy una medición se puede **borrar** (papelera en `/pacientes/[id]/medidas`) pero **NO editar**; si te equivocas en un valor hay que borrarla y recrearla. → Añadir edición de una medición registrada (y llevar el botón de borrar también a la pestaña Mediciones de la ficha).

**🤝 ASESORA EXPERTA DISPONIBLE (10 jul 2026):** Helena Rodríguez es **antropometrista ISAK Nivel 1** y se ha ofrecido expresamente a ayudar: "si necesitáis que os haga lista de los valores que hay — perímetros, **diámetros** y pliegues — o cualquier cosa relacionada". Ojo: menciona **diámetros óseos** (biestiloideo, biepicondíleo de húmero/fémur…), que hoy NO existen en la app y son necesarios para la composición de 4-5 compartimentos (masa ósea) y el somatotipo. → Antes de implementar esta tarea, pedirle a Helena la especificación completa: lista de perímetros/diámetros/pliegues del perfil ISAK (restringido y completo), fórmulas que usa (Carter 1982 para % graso y somatotipo de Heath-Carter, etc.) y qué espera ver en la somatocarta/gráficas. Contacto: la nutri Helena (helenarodrigueez57@gmail.com, WhatsApp +34 682 63 44 22).

**📋 ESPECIFICACIÓN ISAK COMPLETA (Helena Rodríguez, antropometrista ISAK Nivel 1 — 22 jul 2026):** esto es la spec que pedimos, para implementar el módulo tal cual se hace en consulta.

*Medidas a registrar:*
- **Pliegues (mm) — los 8 ISAK:** tríceps, subescapular, bíceps, cresta ilíaca, supraespinal, abdominal, muslo (frontal), pierna (medial/pantorrilla). (Hoy hay 7 y faltan bíceps + supraespinal + pierna; ver arriba.)
- **Perímetros (cm):** brazo relajado, brazo flexionado y contraído, cintura, caderas, muslo medio, pierna (pantorrilla). (Hoy solo 4: cintura, cadera, brazo, abdomen.)
- **Diámetros óseos (cm):** húmero (biepicondíleo), biestiloideo (muñeca), fémur (biepicondíleo). **NO existen hoy** → campos nuevos, necesarios para masa ósea y somatotipo.

*Cálculos y gráficas que Helena considera imprescindibles:*
- **Fraccionamiento tisular** (gráfica) con los % de: **tejido adiposo, tejido residual, tejido muscular, tejido óseo** (modelo pentacompartimental tipo Kerr/Ross).
- **Índice adiposo-muscular** e **índice músculo/óseo**.
- **Sumatoria de 6 y de 8 pliegues** (mm).
- **Índices y razones de proporcionalidad ósea:** índice córmico, índice de Manouvrier, envergadura relativa.
- **Somatotipo** (endomorfia, mesomorfia, ectomorfia) con **somatocarta** (gráfico) → Heath-Carter.
- Gráficas de evolución del peso (kg) y similares → **ya existen** (Helena lo confirma).

*Pendiente:* las **fórmulas/ecuaciones exactas** de cada cálculo (fraccionamiento, somatotipo, índices, % graso). Helena (ISAK N1) puede facilitarlas; pedírselas al implementar, o usar las estándar (ISAK / Heath-Carter / Kerr-Ross) y que ella las valide. Requiere: **estatura sentado** (para el índice córmico) y **envergadura** además de talla/peso — verificar que se capturan.

**Petición:** Implementar los 8 pliegues cutáneos del protocolo ISAK (International Society for the Advancement of Kinanthropometry), que es el estándar profesional con acreditación de pago. El orden de medición es importante porque está estandarizado:

1. **Tríceps** — cara posterior del brazo, punto medio entre acromion y olécranon. Pliegue vertical.
2. **Subescapular** — ángulo inferior de la escápula, 2 cm por debajo. Pliegue oblicuo (45°).
3. **Bíceps** — cara anterior del brazo, punto medio (misma altura que tríceps). Pliegue vertical.
4. **Cresta ilíaca** — inmediatamente superior a la cresta ilíaca, línea axilar media. Pliegue horizontal/ligeramente oblicuo.
5. **Supraespinal** — intersección de la línea del borde axilar anterior con la línea horizontal del borde superior de la cresta ilíaca. Pliegue oblicuo.
6. **Abdominal** — 5 cm lateral al ombligo. Pliegue vertical.
7. **Muslo anterior** — punto medio entre el pliegue inguinal y el borde superior de la rótula. Pliegue vertical.
8. **Pierna medial (pantorrilla)** — cara medial de la pierna, máxima circunferencia. Pliegue vertical.

**Diferencias con lo implementado (Jackson & Pollock vs ISAK):**

| Pliegue | J&P (actual) | ISAK (pedido) | Estado |
|---------|--------------|---------------|--------|
| Tríceps/Tricipital | ✅ `pliegueTricipital` | ✅ Tríceps | Ya existe |
| Subescapular | ✅ `pliegueSubescapular` | ✅ Subescapular | Ya existe |
| Abdominal | ✅ `pliegueAbdominal` | ✅ Abdominal | Ya existe |
| Muslo | ✅ `pliegueMuslo` | ✅ Muslo anterior | Ya existe |
| Bíceps | ❌ | ✅ | **Falta** |
| Cresta ilíaca | ❌ | ✅ | **Falta** (distinto de suprailiaco J&P) |
| Supraespinal | ❌ | ✅ | **Falta** (distinto de suprailiaco J&P) |
| Pierna medial | ❌ | ✅ | **Falta** |
| Axilar | ✅ `pliegueAxilar` | ❌ | Solo J&P |
| Pectoral | ✅ `plieguePectoral` | ❌ | Solo J&P |
| Suprailiaco | ✅ `pliegueSuprailiaco` | ❌ | Solo J&P (≠ cresta ilíaca ISAK) |

**Nota importante:** El pliegue suprailiaco de Jackson & Pollock NO es igual a la cresta ilíaca ni al supraespinal de ISAK. Son puntos anatómicos distintos con direcciones de pliegue diferentes. Se deben mantener los tres como campos separados.

**Tareas:**

*Pliegues nuevos:*
- [ ] Añadir 4 campos al modelo `MedidaAntropometrica` en schema.prisma: `pliegueBiceps`, `pliegueCrestaIliaca`, `pliegueSupraespinal`, `plieguePierna` (todos Float?, en mm)
- [ ] Migración SQL: `ALTER TABLE` para añadir las 4 columnas
- [ ] Actualizar `MedidaFormData` en `src/app/actions/medidas.ts` con los nuevos campos
- [ ] Actualizar UI de la sección de pliegues en `paciente-ficha-mediciones-tab.tsx`: mostrar los 11 pliegues organizados por protocolo (sección ISAK con los 8 en orden estandarizado, sección J&P con axilar/pectoral/suprailiaco)
- [ ] Mostrar los pliegues ISAK en el orden protocolario (1-8) para que el nutri los mida en orden
- [ ] Añadir los nuevos pliegues a las gráficas de evolución

*Sumatoria de pliegues:*
- [ ] Calcular y mostrar Σ8 (sumatoria de los 8 pliegues ISAK) automáticamente cuando los 8 estén rellenos
- [ ] Calcular y mostrar Σ6 (excluyendo bíceps y pierna, los 6 pliegues del perfil restringido ISAK nivel 1)
- [ ] Mostrar la sumatoria en la tarjeta de mediciones y en las gráficas de evolución
- [ ] Considerar cálculo de % grasa a partir de pliegues con ecuaciones estándar: Durnin & Womersley (1974, usa bíceps+tríceps+subescapular+suprailiaco), Faulkner (1968, para deportistas)
- [ ] Implementar ecuación de **Kerr-Stewart** (fraccionamiento de 5 componentes: masa muscular, masa grasa, masa ósea, masa residual, piel). Es el estándar avanzado que usan los nutricionistas con formación ISAK. Álvaro confirma que usa Durnin & Womersley + Kerr con protocolo ISAK según el paciente

**Referencia clave (Guillermo + David Medina, 4 jun 2026): imitar ISAKMetry** (app web `isakmetry.com` que usan en la Universidad Europea). Genera **informes PDF de composición corporal** a partir de las mediciones ISAK. Lo que hace y queremos replicar:
- [ ] Al generar el informe, **elegir la ecuación de masa grasa** entre varias: Durnin-Womersley (1974), Faulkner (1966), Jackson & Pollock (1975), Katch-McArdle (1973), Sloan (1962), Withers (1987), Yuhasz modificado por Carter (1982), Slaughter (1988)
- [ ] El tejido adiposo del modelo tisular se calcula automáticamente con **Kerr (1991)** (por eso no aparece en el selector de masa grasa)
- [ ] Permitir **escoger una referencia/población** de comparación y comparar la medida con hasta N medidas previas
- [ ] **Texto de observaciones** a incluir en el informe
- [ ] **Secciones a imprimir** configurables + generar el **PDF** del informe

**Contenido REAL del informe ISAKMetry (revisado el PDF de ejemplo, 7 páginas — esto es lo que hay que poder generar):**
- **Cabecera**: nombre, edad, género, deporte, nivel de actividad, evaluado por, certificación (ISAK nivel 1/2…), nº de evaluación, fecha, días desde la última evaluación. Cada medida con su **Puntuación Z** y un gráfico de posición (Actual / Previo / Phantom)
- **Pág 1 — Medidas**: básicas (masa corporal, talla, talla sentado, envergadura de brazos); **8 pliegues ISAK** (tríceps, subescapular, bíceps, cresta ilíaca, supraespinal, abdominal, muslo, pierna); **perímetros** (brazo relajado, brazo flexionado y contraído, cintura, caderas, muslo medio, pierna); **diámetros** (húmero, biestiloideo, fémur)
- **Pág 2 — Composición corporal**: fraccionamiento **molecular** (masa grasa kg [Durnin-Womersley 1974], masa libre de grasa) y **tisular** (tejido adiposo [Kerr 1991], muscular [Lee 2000], óseo [Rocha 1974]); gráficos de tarta y barras de ambos
- **Pág 3 — Distribución adiposo-muscular**: perímetros corregidos, **silueta corporal** con % de grasa (superior/central/inferior) y % muscular (brazo/muslo/pierna); **índices**: adiposo-muscular y músculo/óseo con clasificación
- **Pág 4 — Adiposidad + Muscularidad**: **sumatorio de 6 y de 8 pliegues**, gráfico de pliegues individuales; perímetros corregidos (brazo/muslo/pierna) con Z + diferencia brazo flexionado vs relajado
- **Pág 5 — Proporcionalidad ósea + Somatotipo**: índice córmico, índice de Manouvrier, envergadura relativa; **somatotipo** (endomorfia / mesomorfia / ectomorfia) con interpretación
- **Pág 6 — Somatocarta**: gráfico triangular del somatotipo (endo/meso/ecto)
- **Pág 7 — Índices de salud con semáforo** (verde/amarillo/rojo) y rango saludable: índice cintura-cadera, índice de conicidad, índice cintura-talla, IMC, índice de distribución grasa; tarta extremidades vs tronco

**Nota de alcance:** es un informe MUY completo. Para una v1 priorizar: medidas + pliegues ISAK con sumatorios (#32 ya), masa grasa con ecuación elegible (#48) y los índices de salud con semáforo (alto valor, baja complejidad). Lo avanzado (fraccionamiento tisular Kerr/Lee/Rocha, somatotipo, somatocarta, puntuaciones Z con población de referencia) es fase 2. PDF de ejemplo guardado por Guillermo (ISAKMetry, Universidad Europea).

*Perímetro del muslo:*
- [ ] Añadir campo `perimetroMuslo` (Float?, en cm) al modelo `MedidaAntropometrica`
- [ ] Añadir a la UI en la sección de perímetros, junto a cintura/cadera/brazo/abdomen
- [ ] Añadir a las gráficas de evolución

**Archivos a modificar:**
- `prisma/schema.prisma` — 5 nuevos campos (4 pliegues + 1 perímetro)
- `src/app/actions/medidas.ts` — actualizar tipos, validación y guardado
- `src/components/paciente/paciente-ficha-mediciones-tab.tsx` — UI con secciones por protocolo + sumatorias
- `src/app/(dashboard)/reportes/[id]/generar-pdf.tsx` — incluir nuevos pliegues y sumatoria en informes
- Script de migración SQL en `scripts/`

**Prioridad:** Alta (acreditación ISAK es un estándar profesional — implementarlo posiciona la app como herramienta seria para nutricionistas con formación en antropometría)
**Complejidad:** Media

---

## 33. Añadir perímetro de muslo en mediciones básicas

**Origen:** Dayana Martinez Nutricionista — 25 mayo 2026

**Estado actual:** En la sección de perímetros corporales se registran: cintura, cadera, brazo y abdomen. No existe perímetro del muslo como medida independiente (solo el pliegue cutáneo del muslo). Nota: la tarea #32 ya contempla añadir `perimetroMuslo` al modelo como parte de la implementación ISAK, pero esta petición pide que se incluya también en las "mediciones básicas" (no solo en la sección avanzada de antropometría).

**Petición:** Poder registrar el perímetro del muslo como una medición básica más, junto a cintura, cadera, brazo y abdomen.

**Tareas:**
- [ ] Añadir campo `perimetroMuslo` (Float?, en cm) al modelo `MedidaAntropometrica` si no se ha hecho ya en tarea #32
- [ ] Mostrar el perímetro del muslo en la sección de perímetros básicos de la UI de mediciones
- [ ] Incluir en las gráficas de evolución de perímetros
- [ ] Migración SQL: `ALTER TABLE` para añadir la columna

**Relacionado con:** Tarea #32 (pliegues ISAK + perímetro muslo)
**Prioridad:** Media
**Complejidad:** Baja

---

## 34. Renombrar "Almuerzo" a "Comida" (o hacerlo configurable)

**Origen:** Dayana Martinez Nutricionista — 25 mayo 2026

**Estado actual:** El enum `TipoComida` define los tipos de comida del plan: DESAYUNO, MEDIA_MANANA, ALMUERZO, MERIENDA, CENA, SNACK, PRE_ENTRENO, POST_ENTRENO, OTROS. En la UI se muestra "Almuerzo" para la comida del mediodía. En España, "almuerzo" se usa coloquialmente para referirse a la media mañana (equivalente a MEDIA_MANANA), y la comida principal del mediodía se llama "comida". Esto genera confusión.

**Petición:** Cambiar la etiqueta "Almuerzo" por "Comida" en la UI, o hacerlo configurable por país/preferencia del nutricionista.

**Opciones:**
1. **Cambio directo:** Renombrar la etiqueta de ALMUERZO a "Comida" en las traducciones (es.json). Simple pero puede confundir a usuarios de Latinoamérica donde "almuerzo" sí significa la comida del mediodía.
2. **Configurable por país/preferencia:** Añadir opción en ajustes del dietista para elegir la terminología regional (España: "Comida", Latinoamérica: "Almuerzo"). Más trabajo pero correcto.
3. **Traducciones regionales:** Crear variantes es-ES y es-LATAM de las traducciones. Más complejo.

**Tareas:**
- [ ] Decidir enfoque: cambio directo vs configurable
- [ ] Si configurable: añadir campo `regionTerminologia` o `pais` al modelo `Dietista`
- [ ] Actualizar las traducciones en `src/messages/es/patients.json` (y archivos relacionados) donde aparezca "Almuerzo"
- [ ] Verificar que el cambio se refleje en: editor de dietas, PDF, portal del paciente, link compartido
- [ ] NO cambiar el enum `TipoComida` en Prisma (mantener ALMUERZO como valor interno)

**Archivos a modificar:**
- `src/messages/es/patients.json` — etiqueta de ALMUERZO
- `src/messages/es/patient-portal.json` — si hay referencia
- `src/lib/pdf/generate-plan-pdf.ts` — si usa traducciones directas

**Prioridad:** Media
**Complejidad:** Baja (cambio directo) / Media (configurable)

---

## 35. Nombre y número de colegiado en la portada del PDF

**Origen:** Day Martínez Morillo (Aureva Clinics) — 27/05/2026

**Estado actual:** El campo `numColegiado` existe en el modelo `Dietista` y se puede rellenar desde Ajustes y registro. El nombre del dietista y el número de colegiado ya aparecen en el **footer** de cada página del PDF (vía `marcaPdf`). Sin embargo, NO aparecen en la **portada** — solo se muestra "PLAN DIETÉTICO PERSONALIZADO", nombre del paciente y logo.

**Petición:** Mostrar el nombre del profesional y su número de colegiado de forma visible en la portada del PDF.

**Tareas:**
- [ ] Añadir `numColegiado` a `PlanPDFData` (interfaz en `generate-plan-pdf.ts`)
- [ ] Pasar `dietista.numColegiado` desde `getPlanPDFData()` en `planes.ts`
- [ ] Añadir línea en la portada del PDF debajo del logo: "Nutricionista {nombre}. Núm. de colegio: {numColegiado}"
- [ ] Solo mostrar si `numColegiado` tiene valor (es campo opcional)
- [ ] Verificar que también funciona desde el portal del paciente

**Prioridad:** Media
**Complejidad:** Baja

---

## 36. Incluir datos de Planificación en el PDF (agua, ejercicio, alimentos a evitar)

**Origen:** Day Martínez Morillo (Aureva Clinics) — 27/05/2026

**Estado actual:** La pestaña "Planificación" del paciente contiene datos estructurados: ingesta de agua, ejercicio físico (tipo, duración, frecuencia, kcal), alimentos a evitar. Sin embargo, la sección "Recomendaciones" del PDF solo muestra el texto libre que el dietista escribe manualmente. Los datos estructurados de Planificación no se incluyen en el PDF, obligando al profesional a duplicar información.

**Petición:** Que los datos de Planificación (agua, ejercicio, alimentos a evitar) se incluyan automáticamente en el PDF, ya sea como sección separada o integrados en las recomendaciones.

**Tareas:**
- [ ] Investigar qué datos de Planificación están disponibles (modelo `Planificacion` + campos en paciente)
- [ ] Decidir formato: sección nueva en el PDF o integrado en recomendaciones
- [ ] Añadir toggle en opciones del PDF: "Incluir datos de planificación"
- [ ] Fetch de datos de planificación en `getPlanPDFData()` 
- [ ] Generar HTML para: ingesta de agua, ejercicio físico (tipo, minutos, kcal), alimentos a evitar
- [ ] Traducciones ES + PT
- [ ] Verificar en portal del paciente también

**Prioridad:** Media-Alta
**Complejidad:** Media

---

## 37. Ocultar filas de comidas vacías en la tabla semanal del PDF

**Origen:** Day Martínez Morillo (Aureva Clinics) — 27/05/2026

**Estado actual:** La tabla "PLAN DIETÉTICO SEMANAL" del PDF muestra siempre las 6 filas de tipos de comida (Desayuno, Media mañana, Almuerzo, Merienda, Cena, Recena), incluso cuando un tipo está vacío para todos los días de la semana. Ejemplo: si el paciente no tiene Recena ningún día, la fila aparece igualmente con guiones.

**Petición:** Ocultar automáticamente las filas de comidas que no tengan alimentos en ninguno de los 7 días.

**Tareas:**
- [ ] En `generate-plan-pdf.ts`, bloque del resumen semanal: antes de renderizar cada fila de `TIPOS_ORDEN`, verificar si existe al menos 1 alimento en algún día para ese tipo
- [ ] Si no hay alimentos en ningún día → no renderizar la fila
- [ ] Mismo tratamiento en el detalle diario: no mostrar bloque de comida si está vacío
- [ ] Verificar que no rompe el layout cuando se ocultan varias filas

**Prioridad:** Baja-Media
**Complejidad:** Baja

---

## 38. Foto del plato en recetas

**Origen:** Álvaro (nutricionista, LinkedIn) — 27 mayo 2026; Remedios Velasco — 7 jun 2026 (lo pide **sobre todo para las recetas propias del nutricionista**, las que añade él mismo); nutricionista (email) — 8 jun 2026 ("subir una foto del platillo para que el paciente tenga una referencia visual"); Antonia (nutrivibes.life, Instagram) — 17 jun 2026 ("añadir imágenes a las recetas haría la experiencia mucho más visual para profesional y paciente"); Carmen Florensa (review en PDF, 23 jun 2026 — "aportar fotos para las recetas… que absolutamente todas las recetas tuvieran su imagen de referencia"). **Sexto profesional que lo pide** — Marina Orea (oreanutri, Instagram — jul 2026), que además pide las fotos **también en los menús**, no solo en las recetas.

**Estado actual (reverificado 7 jun 2026):** Los alimentos individuales pueden tener imagen (`Alimento.imagenUrl`). Las recetas (`Receta`) **siguen SIN campo de imagen**. Cuando el paciente ve su plan en el portal o en el PDF, no hay foto visual del plato montado.

**Petición:** Poder añadir una foto del plato terminado a cada receta. Esto mejora la adherencia del paciente porque ve exactamente cómo queda la comida. El nutricionista comenta que "si le das cara al menú, hay más adherencia".

**Tareas:**
- [ ] Añadir campo `imagen` (String?, base64 data URL) al modelo `Receta` en schema.prisma
- [ ] Migración SQL: `ALTER TABLE recetas ADD COLUMN IF NOT EXISTS imagen TEXT`
- [ ] UI en el formulario de receta: botón para subir/capturar foto del plato (reutilizar lógica de imagen de alimentos)
- [ ] Mostrar la foto de la receta en la lista de recetas
- [ ] Mostrar la foto en el portal del paciente cuando la comida incluya esa receta
- [ ] Considerar mostrar la foto en el PDF del plan (opcional, toggle en opciones de PDF)
- [ ] Validar con `validateImageDataUrl()` existente

**Prioridad:** Media-Alta (impacto directo en adherencia del paciente)
**Complejidad:** Baja

---

# Cuenta de Profesor — Funcionalidad nueva

Sección dedicada a la cuenta de tipo "Profesor", pensada para docentes de nutrición que usan Annonia como herramienta educativa. El profesor crea un paciente de prueba (caso clínico) y lo asigna a varios estudiantes para que trabajen sobre él. Los estudiantes tienen cuentas normales de nutricionista, pero reciben el paciente compartido y trabajan de forma independiente.

---

## 39. Cuenta de Profesor: crear y asignar pacientes de prueba a estudiantes

**Origen:** Guillermo — mayo 2026

**Validación de mercado (jun 2026):** José Miguel Martínez, profesor de la **Universidad de Alicante**, rechazó la app diciendo que web/funcionalidades/flujo "son prácticamente idénticos a otros softwares que ya usan en la universidad" y que no ve valor diferencial. → CONFIRMA que en docencia ya usan software de gestión nutricional (probablemente Dietowin u otro de escritorio) y que el diferencial NO es la gestión de dietas (eso ya lo tienen), sino **el flujo docente**: asignar casos a alumnos + corregir/calificar su trabajo, que esos programas NO tienen. La cuenta de Profesor es el verdadero gancho para universidades; sin ella, Annonia es "uno más". Refuerza prioridad.

**Estado actual:** No existe rol de profesor ni flujo educativo. Solo hay cuentas de dietista (nutricionista), admin y paciente.

**Concepto:** Un profesor de nutrición crea una cuenta especial desde la que puede:
1. Crear un "paciente de prueba" (caso clínico con datos ficticios: peso, altura, alergias, patologías, objetivo, etc.)
2. Asignar ese paciente a varios de sus estudiantes
3. Cada estudiante recibe una copia independiente del paciente en su cuenta (como si lo hubiera creado él)
4. Los estudiantes trabajan de forma independiente: crean su propio plan, hacen su propia planificación, etc.
5. El profesor puede ver/comparar los planes que ha hecho cada estudiante para el mismo caso

**Flujo propuesto:**

1. **Registro como profesor** — Nueva opción en registro o en admin: "Cuenta de profesor"
2. **Crear caso clínico** — El profesor crea un paciente con todos los datos relevantes (datos personales, medidas, analíticas, anamnesis, objetivos, notas del caso)
3. **Invitar estudiantes** — El profesor introduce los emails de sus estudiantes (o genera un link de invitación)
4. **Los estudiantes se registran** — Cuentas normales de nutricionista, pero vinculadas al profesor
5. **Asignar caso** — El profesor asigna el paciente de prueba a los estudiantes seleccionados. Cada uno recibe una copia independiente
6. **Trabajo independiente** — Cada estudiante crea plan, planificación, etc. sobre su copia del paciente
7. **Revisión** — El profesor accede a una vista comparativa de lo que ha hecho cada estudiante

**Tareas:**

*Modelo de datos:*
- [ ] Nuevo rol `ROL_PROFESOR` o campo `esProfesor` (Boolean) en modelo `Dietista`
- [ ] Nuevo modelo `ClaseProfesor` (id, profesorId, nombre, descripcion, createdAt) — agrupa a los estudiantes
- [ ] Nuevo modelo `EstudianteClase` (id, claseId, dietistaId, createdAt) — relación estudiante ↔ clase
- [ ] Nuevo modelo `CasoClinico` (id, profesorId, claseId?, datos del paciente de prueba, createdAt)
- [ ] Nuevo modelo `AsignacionCaso` (id, casoClinicoId, estudianteId/dietistaId, pacienteId, createdAt) — vincula caso → estudiante → copia del paciente
- [ ] Definir límites: máximo de estudiantes por clase, máximo de casos activos simultáneos

*Flujo del profesor:*
- [ ] Dashboard de profesor: ver clases, estudiantes, casos asignados
- [ ] Crear caso clínico: formulario con datos del paciente ficticio (reutilizar campos de paciente existente)
- [ ] Asignar caso a clase o a estudiantes individuales: al asignar, crear una copia del paciente en la cuenta de cada estudiante
- [ ] Vista de revisión: para un caso dado, ver la lista de estudiantes y acceder al plan/planificación que hizo cada uno
- [ ] Comparativa lado a lado (opcional, v2): ver los planes de 2-3 estudiantes en paralelo

*Flujo del estudiante:*
- [ ] Registro normal de nutricionista (con link de invitación del profesor o código de clase)
- [ ] El paciente asignado aparece en su lista de pacientes como cualquier otro
- [ ] Trabaja con normalidad: crea plan, planificación, medidas, etc.
- [ ] Badge o indicador de que es un "caso de clase" (no un paciente real)

*Invitaciones:*
- [ ] El profesor genera un link de invitación por clase (ej: `/clase/[token]`)
- [ ] El estudiante se registra o vincula su cuenta existente a la clase
- [ ] Email de invitación con instrucciones

*Límites a definir:*
- [ ] Máximo de estudiantes por clase (¿30? ¿50? ¿configurable?)
- [ ] Máximo de casos clínicos activos por clase
- [ ] Máximo de clases por profesor
- [ ] ¿El estudiante puede modificar los datos base del paciente o solo crear planes?
- [ ] ¿El profesor paga una suscripción especial o es gratuito durante beta?
- [ ] ¿Los estudiantes necesitan suscripción propia o van incluidos en la del profesor?

**Archivos a crear:**
- `src/app/(dashboard)/profesor/` — nuevo route group para el dashboard de profesor
- `src/app/actions/profesor.ts` — server actions para crear clases, casos, asignar
- `prisma/schema.prisma` — nuevos modelos
- `src/app/(auth)/registro-profesor/` — registro específico o flag en registro existente

**Prioridad:** Alta (abre un nuevo segmento de mercado: universidades y centros de formación)
**Complejidad:** Alta

---

## 40. Objetivos del paciente visibles en entregables para corrección

**Origen:** Guillermo — mayo 2026. Relacionado con flujo de profesor, pero útil para cualquier nutricionista.

**Estado actual:** Cuando se genera un PDF/entregable del plan, se incluyen los alimentos, cantidades, macros por comida y recomendaciones. Los objetivos del paciente (kcal objetivo, macros objetivo, tipo de dieta, restricciones) y los datos de planificación están en la ficha del paciente y en la pestaña "Planificación", pero NO se incluyen en el entregable. Para corregir o evaluar un plan, hay que ir a la ficha del paciente por separado para ver qué se pedía.

**Petición:** Al generar el entregable (PDF u otra vista), incluir una sección con los objetivos y requisitos del paciente para que sea fácil comparar "qué se pedía" vs "qué se ha hecho". Especialmente útil para:
- **Profesores** que corrigen planes de estudiantes: ven el caso clínico + lo que hizo el estudiante en un solo documento
- **Nutricionistas** que revisan su propio trabajo: verificar que el plan cumple los objetivos de macros, micronutrientes, restricciones, etc.

**Contenido a incluir:**
- [ ] Objetivo del paciente (perder peso, ganar masa, patología, etc.)
- [ ] Kcal objetivo y distribución de macros objetivo (g y %)
- [ ] Restricciones alimentarias (alergias, intolerancias, alimentos a evitar)
- [ ] Patologías relevantes
- [ ] Comparación automática: kcal objetivo vs kcal reales del plan, macros objetivo vs reales (% de adecuación)
- [ ] Micronutrientes: si hay datos, comparar con ingesta recomendada
- [ ] Notas del caso (especialmente relevante para casos clínicos de profesor)

**Tareas:**
- [ ] Añadir sección "Objetivos y adecuación" al PDF del plan (toggle activable)
- [ ] Fetch de datos de planificación (objetivos, macros, restricciones) en `getPlanPDFData()`
- [ ] Tabla comparativa: columna "Objetivo" vs columna "Plan" para kcal, proteínas, carbos, grasas
- [ ] Indicadores visuales: verde si cumple (±10%), amarillo si se desvía (±20%), rojo si no cumple
- [ ] Incluir restricciones y patologías como checklist informativo
- [ ] Para el flujo de profesor: incluir también los datos del caso clínico como contexto

**Relacionado con:** Tarea #28 (informe de composición nutricional) y #36 (datos de planificación en PDF)
**Prioridad:** Alta
**Complejidad:** Media

---

## 41. Buscar y ordenar alimentos por micro y macronutrientes

**Origen:** Guillermo — mayo 2026; Álvaro (alvaromorenonutri, Instagram) — 3 jul 2026: búsqueda por micronutriente pensada para **patologías** (ej. tiroides → subir selenio/zinc/yodo), **combinando varios micros** a la vez y **diferenciando la fuente** (hierro vegetal vs animal). Que aplique también a recetas.

**Estado actual:** El buscador de alimentos filtra por nombre y categoría. Los resultados muestran kcal, proteínas, carbohidratos y grasas, pero no se puede ordenar ni filtrar por valor nutricional. Si un paciente tiene déficit de calcio, el nutricionista tiene que saber de memoria qué alimentos son ricos en calcio o buscarlos fuera de la app.

**Petición:** Poder buscar y ordenar alimentos por contenido de cualquier nutriente (macro o micro). Ejemplo: "le falta calcio al paciente → ordenar alimentos de mayor a menor contenido de calcio" para encontrar rápidamente los mejores alimentos para cubrir ese déficit. Lo mismo para hierro, fibra, proteínas, vitamina D, etc.

**Funcionalidades:**
1. **Ordenar por nutriente** — En la lista de alimentos y en el buscador del editor de dietas, selector de "Ordenar por": kcal, proteínas, carbohidratos, grasas, fibra, calcio, hierro, vitamina D, etc. (ascendente/descendente)
2. **Filtrar por rango** — "Alimentos con más de X mg de calcio", "Alimentos con más de Y g de proteínas"
3. **Columna dinámica** — Al seleccionar un nutriente para ordenar, mostrarlo como columna visible en los resultados (ej: si ordenas por calcio, que se vea "320 mg Ca" junto a cada alimento)

**Tareas:**
- [ ] Añadir selector "Ordenar por" en la lista de alimentos (`getAlimentosPaginados`) con opciones: nombre, kcal, proteínas, carbohidratos, grasas, fibra + micronutrientes disponibles
- [ ] Implementar ordenación en la query de Prisma: `orderBy: { [nutriente]: 'desc' }`
- [ ] Añadir filtros de rango: "Mínimo de X" para el nutriente seleccionado
- [ ] En el buscador del editor de dietas (`buscarAlimentosYRecetas`): misma funcionalidad de ordenar por nutriente
- [ ] Mostrar el valor del nutriente seleccionado de forma destacada en cada resultado
- [ ] Considerar: botón de acceso rápido "Alimentos ricos en..." con presets (calcio, hierro, fibra, proteínas, omega-3)
- [ ] Solo mostrar micronutrientes como opción de orden si hay datos suficientes (muchos alimentos de API no tienen micronutrientes completos)
- [ ] **Combinar varios micros a la vez** (Álvaro): buscar alimentos/recetas ricos en X **e** Y (ej. hierro + selenio), no solo uno — útil en patologías
- [ ] **Diferenciar la fuente del hierro** (Álvaro): distinguir hierro de origen vegetal (no hemo) del animal (hemo) en resultados/filtro — relevante clínicamente por la biodisponibilidad; hoy el modelo solo guarda `hierro` total (habría que inferir por categoría o añadir el desglose)
- [ ] Aplicar la búsqueda por micro también a **recetas** ("recetas ricas en hierro"), no solo a alimentos sueltos

**Archivos a modificar:**
- `src/app/actions/alimentos.ts` — `getAlimentosPaginados()`, `buscarAlimentosParaReceta()`
- `src/app/actions/recetas.ts` — `buscarAlimentosYRecetas()`
- `src/app/(dashboard)/alimentos/page.tsx` — UI de filtros y ordenación
- `src/components/dieta/selector-alimento.tsx` — ordenación en el buscador del editor

**Prioridad:** Alta (herramienta directa para tomar decisiones clínicas — cubrir déficits nutricionales)
**Complejidad:** Media

---

## 42. Almacén, stock y ventas de productos en la consulta

**Origen:** Day Martínez Morillo (Aureva Clinics) — mayo 2026

**Estado actual:** Existe un sistema básico de stock en alimentos: campos `stock`, `precioUnitario` y `stockMinimo` en el modelo `Alimento`, con movimientos de stock (`MovimientoStock`) y notificación de stock bajo (`STOCK_BAJO`). Hay una sección de stock en la página de alimentos. Sin embargo, NO existe un módulo dedicado a la gestión comercial: no hay catálogo de productos de venta, no hay registro de ventas a pacientes, no se pueden emitir tickets, y no hay control de pedidos a proveedores.

**Petición:** Un apartado dedicado tipo "Almacén" / "Stock y ventas" donde el nutricionista gestione exclusivamente los productos que vende en su consulta (suplementos, proteínas, barritas, productos propios, etc.). No es solo control de inventario — necesitan gestión comercial completa:

1. **Catálogo de productos de venta** — Lista de productos que se venden en la consulta, con precio, stock actual, proveedor, foto
2. **Registro de ventas** — Qué paciente ha comprado qué producto, cuándo y a qué precio
3. **Pedidos a proveedores** — Cuando el stock baja, saber qué hay que pedir y a quién
4. **Tickets/facturas simplificadas** — Emitir un ticket o recibo de la venta al paciente
5. **Historial por paciente** — Ver qué productos ha comprado cada paciente (útil para seguimiento y recomendaciones)

**Nota:** Los productos de venta pueden estar también vinculados al apartado de alimentos/comidas (ej: un suplemento de proteínas que se incluye en el plan), pero el interés principal es la gestión comercial.

**Input adicional (nutricion.estigil, Instagram — 2 jun 2026, ⭐ posible centro/clínica):** Trabaja en una clínica presencial que vende suplementación. Vio el aviso de stock bajo y le interesa la **gestión del stock de suplementación** para plantearle a su jefe usar Annonia en la clínica (gestión de pacientes + stock). Lo describe como "un plus, no imprescindible" — pero es la puerta de entrada de un centro completo. Refuerza la prioridad de este módulo como argumento de venta para clínicas.

**Tareas:**

*Modelo de datos:*
- [ ] Nuevo modelo `ProductoVenta` (id, dietistaId, nombre, descripcion, categoria, precio, coste, stock, stockMinimo, proveedor, proveedorContacto, codigoBarras, imagen, alimentoId?, activo, createdAt, updatedAt) — `alimentoId` opcional para vincular con un alimento existente
- [ ] Nuevo modelo `Venta` (id, dietistaId, pacienteId?, fecha, total, notas, createdAt)
- [ ] Nuevo modelo `LineaVenta` (id, ventaId, productoId, cantidad, precioUnitario, subtotal)
- [ ] Nuevo modelo `PedidoProveedor` (id, dietistaId, proveedor, estado, fechaPedido, fechaRecepcion?, notas, createdAt) con estados: PENDIENTE, PEDIDO, RECIBIDO, CANCELADO
- [ ] Nuevo modelo `LineaPedido` (id, pedidoId, productoId, cantidadPedida, cantidadRecibida?)

*Catálogo de productos:*
- [ ] Nueva sección "Almacén" o "Stock y ventas" en el sidebar (separada de Alimentos)
- [ ] CRUD de productos de venta: nombre, precio, coste, stock, foto, proveedor, categoría
- [ ] Vincular opcionalmente un producto con un alimento existente (para que aparezca en planes)
- [ ] Vista de inventario: stock actual, alertas de stock bajo, valor del inventario

*Ventas:*
- [ ] Registrar una venta: seleccionar paciente (opcional), añadir productos, cantidades, calcular total
- [ ] Descontar automáticamente del stock al registrar venta
- [ ] Historial de ventas con filtros por fecha, paciente, producto
- [ ] Vista de ventas por paciente (desde la ficha del paciente)

*Tickets/recibos:*
- [ ] Generar ticket/recibo de venta en PDF o imprimible (datos del centro, productos, cantidades, precios, total, fecha)
- [ ] Enviar ticket por email al paciente (opcional)
- [ ] Numeración secuencial de tickets

*Pedidos a proveedores:*
- [ ] Vista de "qué hay que pedir": productos con stock por debajo del mínimo, agrupados por proveedor
- [ ] Crear pedido: seleccionar productos y cantidades, asociar proveedor
- [ ] Marcar pedido como recibido y actualizar stock automáticamente
- [ ] Historial de pedidos

*Reportes:*
- [ ] Resumen de ventas por periodo (día, semana, mes)
- [ ] Productos más vendidos
- [ ] Margen de beneficio por producto (precio - coste)
- [ ] Pacientes que más compran

**Archivos a crear:**
- `src/app/(dashboard)/almacen/` — nuevo route group (productos, ventas, pedidos)
- `src/app/actions/almacen.ts` — server actions para productos, ventas, pedidos
- `prisma/schema.prisma` — nuevos modelos
- `src/lib/pdf/generate-ticket-pdf.ts` — generación de tickets
- `src/components/sidebar.tsx` — nueva entrada "Almacén" en el sidebar

**Relación con lo existente:** El sistema actual de stock en alimentos (`stock`, `precioUnitario`, `stockMinimo`, `MovimientoStock`) podría migrarse o integrarse con este módulo más completo. Los alimentos con stock serían un subconjunto de los productos de venta.

**Prioridad:** Media-Alta (necesidad real de clínicas que venden productos — monetización directa para el nutricionista)
**Complejidad:** Alta

---

## 43. White-label: personalizar la app con la marca del nutricionista

**Origen:** anna_nutricion (Instagram) — 28 mayo 2026

**Estado actual:** Los PDFs ya se pueden personalizar con logo, colores y nombre de marca (desde Ajustes → Documentos). Sin embargo, la app web (dashboard del dietista y portal del paciente) tiene un diseño fijo con la marca Annonia. No se pueden cambiar colores, logo ni apariencia de la interfaz.

**Petición:** Que cada nutricionista pueda personalizar la app con los colores y logo de su marca, de modo que cuando sus pacientes entren al portal se vea como si fuera la app propia de la empresa del nutricionista. Anna comparte como referencia la app que usa actualmente ("Team Saludable"), que muestra el logo de su marca en el sidebar y colores corporativos.

Anna: "Así cada nutri trabaja con su marca dentro de la app y es superrr experiencia para el cliente"

**Alcance:**
1. **Portal del paciente** (prioridad) — Que el paciente vea el logo, colores y nombre del nutricionista al entrar, no la marca Annonia
2. **Dashboard del dietista** (secundario) — Que el dietista vea su propia marca en el sidebar/header
3. **Emails** — Que los emails al paciente lleven la marca del nutricionista

**Tareas:**

*Modelo de datos (parcialmente existente):*
- [ ] Ya existen campos en Dietista: `marcaPdf`, `pdfLogoUrl`, `pdfColorTheme` — reutilizar o extender
- [ ] Añadir campos: `colorPrimario` (String?, hex), `colorSecundario` (String?, hex) para la UI web
- [ ] Considerar campo `ocultarMarcaAnnonia` (Boolean) para ocultar "Annonia" del portal del paciente

*Portal del paciente:*
- [ ] Aplicar logo del nutricionista en el header/sidebar del portal del paciente (en vez de Annonia)
- [ ] Aplicar color primario del nutricionista como color de acento en el portal
- [ ] Mostrar nombre de marca del nutricionista en vez de "Annonia" donde corresponda
- [ ] Favicon personalizado (opcional, complejo)

*Dashboard del dietista:*
- [ ] Mostrar logo propio en el sidebar (opcional)
- [ ] Aplicar color de acento personalizado (opcional)

*Emails:*
- [ ] Usar logo y nombre de marca del nutricionista en los emails al paciente (parcialmente implementado — los emails de acceso al portal ya usan `marcaPdf`)

*Link compartido:*
- [ ] Aplicar marca del nutricionista en `/compartido/[token]` (parcialmente implementado — ya muestra `brandName` y logo)

**Consideraciones:**
- Mantener "Powered by Annonia" en algún sitio discreto (footer) para no perder marca
- Plan gratuito: marca Annonia siempre visible. Plan Pro: white-label completo. Posible diferenciador de pricing
- CSS custom properties (variables CSS) facilitan el cambio de colores sin reescribir estilos

**Prioridad:** Media-Alta (diferenciador competitivo — la competencia "Team Saludable" ya lo ofrece)
**Complejidad:** Media

---

## 44. Calidad de la generación de dietas con IA (repite alimentos, poco equilibrada, elige alimentos absurdos)

**Origen:** Cris Asnadi (dietauric, WhatsApp) — 29 mayo 2026; Antonio (antoniofs.nutricion) — 4 jun 2026 ("no funciona del todo mal, pero tampoco muy bien"); ejemplo real en reunión con David Medina — 4 jun 2026.

**Problemas reportados:**
1. **Repite muchos alimentos** entre días/comidas
2. **Distribución poco equilibrada**
3. **Faltan alimentos** en la base de datos
4. **⚠️ Elige alimentos absurdos / no respeta instrucciones (ejemplo real, reunión 4 jun):** Para una paciente "ganar masa, 2000 kcal", con instrucciones claras (desayuno con pan/aceite/embutido, priorizar proteína vegetal, cena ligera...), la IA generó cosas como **"Aceite de Almendras Dulces"** (¡que es un producto cosmético, no alimentario!) en casi todas las comidas, "Pan de Pueblo con Aceite de Almendras Dulces y Pargo" de desayuno, etc. → la IA escoge alimentos raros del catálogo y no sigue bien las instrucciones. Macros sí cuadraban (~2000 kcal) pero la selección de alimentos no tiene sentido clínico.
5. **⚠️ No respeta los límites de macros pedidos en las INSTRUCCIONES de texto (nutricionista, 7 jun 2026):** Pidió "máximo 100 g de carbohidratos al día" y salieron **235 g**. También cenas raras (cereales fitness). CAUSA VERIFICADA EN CÓDIGO:
   - El límite escrito en "Instrucciones adicionales" (texto libre) **NO sobrescribe el campo numérico "Carbohidratos (g)"** del formulario. Si ese campo quedó en el preset (mantenimiento = **250 g**, ver `FASE_MACROS` en `ia-generation-form.tsx`), el prompt le dice a la IA "Carbohidratos: 250g" → la IA apunta a ~235, ignorando el "máximo 100" del texto.
   - Además el prompt (`src/lib/ai/prompts.ts`) está **sesgado al alza** en carbos: dice literalmente "Carbohidratos: Xg (mete suficientes: arroz, pasta, pan...)" y la tolerancia es ±15%. No contempla un **límite MÁXIMO** de un macro.
   - El ajuste posterior (`ai.ts` ~línea 239) **solo cuadra calorías** (escala todo proporcional), NO recorta carbohidratos si se pasan.
   - **Solución para el nutri HOY:** poner el límite en el **campo "Carbohidratos (g)" = 100**, no solo en instrucciones de texto. El campo numérico es el objetivo real que sigue la IA.
   - **Tareas:** (a) que las instrucciones de texto tipo "máximo X g de Y" se reflejen en los campos numéricos o se traten como restricción dura; (b) soportar **límites máximos por macro** (no solo objetivo); (c) que el prompt respete "máximo" y no empuje siempre al alza; (d) en el ajuste posterior, si un macro se pasa del límite, recortarlo
6. **⚠️ Elige carnes/alimentos exóticos al pedir priorizar un grupo (nutricionista, 10 jun 2026, 3 semanas usándola):** al pedir que priorice carnes, en algún día mete **faisán** u otras carnes poco habituales. Mismo patrón que el "aceite de almendras dulces": la IA tira de alimentos raros del catálogo. → Refuerza limpiar/priorizar el catálogo que se ofrece a la IA (alimentos comunes primero) y/o el enfoque "IA libre + matching". NOTA POSITIVA del mismo nutri: la IA "viene muy bien para hacer el menú rápido y luego individualizarlo a cada paciente según sus macros".
7. **⚠️ No respeta el tipo/textura de dieta + las PATOLOGÍAS no llegan a la IA (nutriciondelargadistancia, 19 jun 2026):** Pidió una **"dieta blanda mecánica"** y la IA le recomendó alimentos sólidos. VERIFICADO en código: el campo `tipoDieta` del formulario y las instrucciones de texto SÍ se concatenan y se pasan al prompt (`prompts.ts`, marcadas como prioridad máxima), así que la indicación **sí llega**, pero la IA no la respeta bien (mismo patrón de adherencia que los puntos 4 y 5). **BUG colateral verificado:** `buildUserPrompt` (`prompts.ts` ~línea 106) **recibe las `patologias` del paciente pero NO las incluye en el prompt** → si la restricción solo está en la patología/ficha y no se escribe en el texto libre, la IA ni la ve (mismo caso que la medicación, #71). Tareas extra: (a) **pasar las patologías al prompt** (hoy se ignoran); (b) reforzar la adherencia al tipo/textura de dieta (blanda mecánica, triturada, astringente…).

**Propuesta de arquitectura (Guillermo, 4 jun 2026) — a valorar:** En vez de pasarle a la IA el catálogo de alimentos para que elija (lo que provoca elecciones raras como "aceite de almendras dulces"), dejar que **la IA genere el plan libremente** (nombre del alimento + cantidad + datos nutricionales que ella estime), y luego **por dentro hacer matching** con el alimento más parecido de nuestra base de datos, ajustando a la cantidad correspondiente.

**Valoración de la propuesta (análisis):**
- ✅ **A favor:** la IA es muy buena nombrando alimentos naturales ("pan integral", "pollo", "aceite de oliva") y mala eligiendo de un catálogo ruidoso con nombres comerciales raros. Generar libre + matching evita el problema de los "aceites de almendras dulces". Es como funcionan varias apps del sector.
- ⚠️ **Riesgos:** (a) el matching puede fallar (que la IA diga "merluza" y enganche "merluza rebozada congelada"); (b) los macros que invente la IA pueden no cuadrar con los reales del alimento que enganchemos → habría que **recalcular con los datos reales de la BD** tras el matching y reajustar cantidades para volver a cuadrar los objetivos; (c) si no encuentra match bueno, fallback (crear el alimento o marcarlo).
- 💡 **Recomendación:** enfoque híbrido — IA genera libre → matching contra BD (priorizando alimentos "limpios"/favoritos del nutri) → recalcular macros reales → ajustar cantidades para cuadrar objetivos. Y en paralelo, **limpiar el catálogo** que se le ofrece a la IA (excluir productos no alimentarios como cosméticos, priorizar alimentos base) mejora cualquiera de los dos enfoques.

**Tareas:**
- [ ] Revisar/limpiar el catálogo de alimentos que se pasa a la IA (excluir cosméticos y productos raros de OpenFoodFacts, priorizar alimentos base y favoritos del nutri)
- [ ] Reforzar el prompt: variedad entre días (penalizar repetición), equilibrio por comida, respeto estricto de las instrucciones del nutri
- [ ] Prototipar el enfoque "IA libre + matching contra BD + recálculo de macros reales" y comparar resultado con el actual
- [ ] Relacionado con #1 (tablas/calidad de alimentos), #49 (plan algorítmico), #69 (exclusiones)

**Prioridad:** Alta (la IA es feature estrella; si genera planes con alimentos absurdos, los nutris no la usan y resta credibilidad). NOTA: ya se está trabajando en otra terminal (jun 2026).
**Complejidad:** Media-Alta

---

## 46. Changelog público de novedades

**Origen:** Guillermo — 29 mayo 2026

**Estado actual:** No existe ninguna página pública donde los usuarios puedan ver qué cambios y mejoras se han hecho en la plataforma. Las novedades se comunican individualmente o no se comunican. La tarea #17 (newsletter) contempla enviar emails, pero no una página web consultable.

**Petición:** Crear una página pública (ej: `annonia.com/novedades` o `annonia.com/changelog`) donde se publiquen todos los cambios, mejoras y nuevas funcionalidades. Así los nutricionistas pueden consultarla cuando quieran para ver cómo va evolucionando la app.

**Tareas:**
- [ ] Crear ruta pública `/novedades` (accesible sin login)
- [ ] Modelo simple: `Novedad` (id, titulo, contenido, version?, fecha, publicada, createdAt) o directamente un JSON/markdown estático
- [ ] Opción A (simple): fichero markdown o JSON con las entradas, renderizado estático — sin admin, se actualiza con cada deploy
- [ ] Opción B (dinámico): CRUD en el panel admin para crear/editar/publicar entradas de changelog
- [ ] Diseño: lista cronológica con fecha, título, descripción breve y badges (nueva funcionalidad, mejora, corrección)
- [ ] Opcional: notificación dentro de la app cuando hay novedades nuevas (badge en sidebar "Novedades" con punto rojo)
- [ ] Opcional: enlace desde el email de newsletter (#17) a la entrada específica del changelog

**Relacionado con:** Tarea #17 (newsletter de actualizaciones semanales)
**Prioridad:** Media-Alta (transparencia y comunicación con los usuarios — genera confianza)
**Complejidad:** Baja

---

## 47. Directorio público de nutricionistas (captación de clientes)

**Origen:** Guillermo — 29 mayo 2026

**Estado actual:** Los nutricionistas usan Annonia como herramienta interna de gestión. No existe ninguna forma de que personas externas (potenciales pacientes) descubran nutricionistas a través de la plataforma. La única vía de contacto es que el nutricionista comparta su link de portal manualmente.

**Petición:** Crear un directorio público de nutricionistas dentro de annonia.com donde personas que buscan nutricionista puedan encontrar profesionales, ver su perfil y contactarles. Que Annonia sirva también como canal de captación de pacientes para los nutricionistas que usen la plataforma.

**Concepto:** Una persona busca "nutricionista deportivo en Sevilla" → encuentra el perfil de un nutricionista en annonia.com → le envía un mensaje o solicitud de contacto → el nutricionista recibe la solicitud en su cuenta.

**Tareas:**

*Perfil público del nutricionista:*
- [ ] Nueva ruta pública `/nutricionistas/[slug]` — perfil visible sin login
- [ ] Campos visibles: nombre, foto, especialidad, ubicación/ciudad, descripción/bio, número de colegiado (si lo tiene)
- [ ] Opción de mostrar/ocultar el perfil público (opt-in, no por defecto)
- [ ] El nutricionista configura su perfil público desde Ajustes
- [ ] Slug personalizable (ej: `annonia.com/nutricionistas/maria-moreno`)

*Directorio/buscador:*
- [ ] Ruta pública `/nutricionistas` — listado con búsqueda y filtros
- [ ] Filtros: especialidad, ciudad/provincia, modalidad (presencial/online), idioma
- [ ] Búsqueda por nombre o especialidad
- [ ] Ordenar por relevancia, proximidad geográfica o valoración

*Contacto:*
- [ ] Formulario de contacto en el perfil público: nombre, email, mensaje, motivo de consulta
- [ ] El mensaje le llega al nutricionista como notificación en la app + email
- [ ] Rate limiting y captcha para evitar spam
- [ ] Opcional: botón "Solicitar cita" que conecte con el sistema de citas (#11)

*SEO:*
- [ ] Schema.org `Physician` / `MedicalBusiness` para cada perfil
- [ ] Meta tags optimizados para búsquedas tipo "nutricionista en [ciudad]"
- [ ] Sitemap dinámico con los perfiles públicos

*Modelo de datos:*
- [ ] Añadir campos al modelo `Dietista`: `perfilPublico` (Boolean), `bio` (String?), `ciudad` (String?), `modalidad` (enum: presencial/online/ambas), `slug` (String?, unique)
- [ ] Nuevo modelo `SolicitudContacto` (id, dietistaId, nombreRemitente, emailRemitente, mensaje, leida, createdAt)

**Consideraciones:**
- Solo nutricionistas verificados (con colegiado o validación manual) deberían aparecer en el directorio — evita perfiles falsos
- Empezar con opt-in: el nutricionista decide si quiere aparecer. A futuro podría ser feature del plan Pro
- Potencial de SEO muy alto: captar tráfico orgánico de búsquedas "nutricionista en X" y convertirlo en usuarios de la plataforma

**Prioridad:** Alta (doble valor: retención de nutricionistas existentes + adquisición orgánica de nuevos usuarios)
**Complejidad:** Alta

---

## 48. Ver todas las fórmulas de % grasa corporal a la vez

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual (VERIFICADO en código, jun 2026 — corrige lo que se asumía):** El selector de "fórmula de % grasa" en Planificación es **DECORATIVO**: no calcula nada, solo guarda la etiqueta elegida. El % de grasa actual proviene de la medida `grasaCorporal` (o se teclea a mano), **NO se calcula a partir de pliegues**. El comparador de metabolismo basal tampoco muestra todas las fórmulas a la vez (solo la seleccionada). Los pliegues registrados **NO incluyen bíceps** (que Durnin & Womersley necesita). El bug de grupos duplicados ("Brozek"/"Siri" con las mismas fórmulas) **YA se arregló (jun 2026)**.

**Petición:** Tener un apartado similar al de las fórmulas de metabolismo basal pero para % de grasa corporal, donde se puedan ver TODAS las fórmulas a la vez (Durnin & Womersley, Faulkner, Jackson & Pollock, Siri, Brozek, etc.) y no solo una. Ainara dice: "me gustan los datos, tener un apartado como el que aparece con las fórmulas para % de grasa donde se puedan ver todas de una, no marca una en concreto."

**Tareas:**
- [ ] Crear vista comparativa de fórmulas de composición corporal: mostrar el resultado de todas las ecuaciones aplicables simultáneamente
- [ ] Ecuaciones a incluir: Durnin & Womersley (1974), Faulkner (1968), Jackson & Pollock 3/7 pliegues, Siri (1961), Brozek (1963)
- [ ] Mostrar qué pliegues/datos usa cada ecuación y resaltar si faltan datos para alguna
- [ ] Formato similar al comparador de ecuaciones de metabolismo basal existente

**Relacionado con:** Tarea #32 (pliegues ISAK) y #10 (mejora UX ecuaciones)
**Prioridad:** Media
**Complejidad:** Media-Alta (REVISADO jun 2026: NO hay base de cálculo; hay que implementar 5-6 ecuaciones científicas validadas + conversión densidad→%grasa + mapeo de pliegues por sexo. Riesgo clínico si se implementan mal. Falta registrar el pliegue del bíceps para Durnin & Womersley. NO es "baja" como se estimó.)

---

## 49. Generar plan alimenticio algorítmico sin IA (desde base de datos de alimentos)

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** Los planes se pueden crear manualmente (añadiendo alimentos uno a uno) o con IA (Groq genera el plan completo). No existe un punto intermedio que use la base de datos de alimentos y recetas para generar un plan calculado algorítmicamente según los objetivos de macros del paciente.

**Petición:** Ainara dice: "lo planes con IA genial pero si estaría guay como tiene bvas e de datos de composición de alimentos y recetas que he visto que vais añadiendo poco a poco, que te calcule con ello sin meter IA de por medio." Quiere que la app genere un plan basado en la BD de alimentos/recetas, ajustando cantidades para cumplir los objetivos de macros, sin depender de la IA.

**Input adicional (nutricion.estigil, Instagram — 2 jun 2026, ⭐ posible centro/clínica):** Variante concreta del mismo concepto: ella define la estructura de calorías y macros, **elige las recetas que quiere usar**, y la app **ajusta automáticamente las cantidades de esas recetas** para cuadrar con los macros objetivo. "Si yo hago la distribución y después elijo las recetas, ¿esas recetas se ajustan a esos macros?" Para ella sería lo ideal. → Modo "ajustar recetas seleccionadas a objetivos": escalar porciones/cantidades de las recetas elegidas hasta cumplir las kcal/macros del día o de cada comida. (Hoy lo más cercano: la generación IA acepta kcal+macros objetivo y tiene en cuenta las recetas propias, pero no garantiza usar las que tú elijas ni ajusta cantidades de forma determinista.)

**Reiterado (Marina Orea, oreanutri, Instagram — jul 2026):** su idea 9, "asistente inteligente para ajustar el menú": tras definir los requerimientos del paciente y crear el menú, que la app **proponga automáticamente ajustes en las cantidades** de los alimentos para alcanzar los objetivos de kcal y macros. Es exactamente este ajuste determinista (escalar cantidades hasta cuadrar objetivos), sin depender de la IA.

**Concepto:** El nutricionista define: kcal objetivo, distribución de macros (% P/C/G), número de comidas, preferencias/restricciones. La app selecciona alimentos de la BD y calcula cantidades para alcanzar los objetivos, como una calculadora de dietas clásica.

**Detalle del asistente del software de referencia de Ainara (capturas, 2 jun 2026 — ver vídeo en nota MotivoClub/PDF):** "que lo calcule y nosotros marquemos si queremos eso o cambiarlo; puedo hacer los repartos incluso de cada toma manualmente". Pantalla "Características de la dieta a crear":
- **Ingesta diaria como RANGO** de kcal con slider (ej: entre 2.206 y 2.406 kcal), no un valor fijo
- **Reparto de nutrientes** con sliders en % y gramos a la vez (ej: 25% 148g prótidos / 50% 281g glúcidos / 25% 64g lípidos)
- **Reparto de kcal por toma** (desayuno, media mañana, comida, merienda, cena) — editable manualmente
- **Reparto de proteínas por toma** — también manual
- Opción de **cargar más un nutriente concreto** si la pauta lo necesita
- Asistente "cálculo por kg de peso" (g/kg de proteína, etc.)

**Tareas:**
- [ ] Algoritmo de composición de dieta: dado un objetivo calórico y distribución de macros, seleccionar alimentos y calcular cantidades
- [ ] Usar alimentos favoritos del nutricionista y recetas propias como fuente preferente
- [ ] Respetar restricciones: alergias, intolerancias, alimentos a evitar del paciente
- [ ] El nutricionista puede fijar ciertos alimentos y pedir que el algoritmo complete el resto
- [ ] Diferencia con IA: determinista, reproducible, basado solo en datos nutricionales reales de la BD

**Relacionado con:** Tarea #9 (cálculo de macros desde %) y #3 (combinar tipos de dieta)
**Prioridad:** Media-Alta (complementa la IA — algunos nutris prefieren cálculo determinista)
**Complejidad:** Alta

---

### Nota: Ainara ofrece videollamada + lista de preguntas de anamnesis

Ainara Martín lleva 10 años pasando consulta y ofrece:
1. ✅ **RECIBIDO (2 jun 2026)** — Envió por Instagram el resumen completo de su anamnesis. Volcado íntegro en la tarea #18 (sección "Material de referencia: anamnesis completa de Ainara Martín")
2. Hacer una videollamada para explicar su sistema si hace falta (pendiente, si se necesita)

Esto es muy valioso para la tarea #18 (personalizar estructura anamnesis) — tener las preguntas reales de una profesional con experiencia.

---

## 50. Notas de consulta/seguimiento por sesión

**Origen:** Sugerencia de nutricionista (anónimo) — 29 mayo 2026; Miguel (dietista-nutricionista, +100 pacientes, viene de Nutrium) — 29 mayo 2026

**Estado actual:** En la ficha del paciente existe la pestaña "Seguimiento" que muestra los registros diarios del paciente (peso, agua, ejercicio, fotos, notas del paciente). También existe el sistema de citas en la agenda. Sin embargo, NO existe un lugar donde el nutricionista registre lo que se ha hablado durante la consulta de seguimiento. Las notas del caso quedan en la cabeza del profesional o en papel aparte.

**Petición:** Añadir un apartado dentro del seguimiento del paciente donde el nutricionista pueda escribir lo que se ha hablado el día de la consulta, para que quede registrado y poder consultarlo en la próxima asesoría. Que todo quede bien guardado y organizado cronológicamente.

**Concepto:** Cada vez que el nutricionista tiene una consulta con un paciente, puede crear una "nota de sesión" con:
- Fecha de la consulta
- Texto libre con lo hablado (objetivos, cambios propuestos, preocupaciones del paciente, acuerdos, etc.)
- Opcionalmente: vincular a la cita de la agenda (si existe)
- Opcionalmente: checklist de seguimiento para la próxima cita ("verificar adherencia a X", "pedir analítica de Y")

**Tareas:**

*Modelo de datos:*
- [ ] Nuevo modelo `NotaSesion` (id, pacienteId, dietistaId, fecha, contenido, citaId?, createdAt, updatedAt)
- [ ] Relación: `Paciente` → has many `NotaSesion`
- [ ] Relación opcional: `Cita` → has one `NotaSesion` (vincular nota con cita de la agenda)

*UI del nutricionista:*
- [ ] Nueva sección "Notas de consulta" en la ficha del paciente (nueva pestaña o dentro de la pestaña de seguimiento existente)
- [ ] Lista cronológica de notas de sesión (más reciente primero)
- [ ] Botón "Añadir nota de sesión" con editor de texto (textarea o editor rico básico)
- [ ] Cada nota muestra: fecha, contenido, y opcionalmente la cita vinculada
- [ ] Editar y eliminar notas existentes
- [ ] Buscar en notas (para encontrar lo que se habló sobre un tema concreto)

*Integración con agenda:*
- [ ] Desde la vista de una cita completada, botón "Añadir nota de sesión" que crea la nota vinculada a esa cita
- [ ] En la vista de la cita, mostrar si tiene nota de sesión asociada

*Flujo de revisiones programadas (Miguel, mayo 2026; Guillermo jun 2026):*
- [ ] Programar revisiones recurrentes por paciente (ej: martes y viernes) — puede ser tipo de cita especial "Revisión"
- [ ] **Revisiones = cuestionarios que se mandan automáticamente cada X días** (Guillermo) — configurar la periodicidad y que se envíen solos al paciente
- [ ] "Lanzar revisión" al paciente: enviar formulario o cuestionario al paciente antes de la revisión (cómo le ha ido, dudas, adherencia)
- [ ] **Que el cuestionario pueda pedir perímetros/medidas** al paciente (Guillermo) — y que esos datos entren en sus mediciones
- [ ] **Las revisiones como sección/apartado propio** (Guillermo) — tratarlas como una entidad de primer nivel (al estilo de las dietas), con su histórico, no solo como un añadido del seguimiento
- [ ] Tras la revisión: registrar nota de sesión + enviar feedback estructurado al paciente por email o portal (resumen de lo hablado, próximos pasos, ajustes al plan)
- [ ] El paciente recibe el feedback y puede consultarlo desde su portal
- [ ] Resumen con IA de la revisión / del periodo (ver tarea #77)

*Vista previa para próxima consulta:*
- [ ] Al abrir la ficha de un paciente, mostrar un resumen de la última nota de sesión (ej: banner o card en la parte superior) para que el nutricionista recuerde qué se habló la última vez

*Ejercicios de educación alimentaria (María Marqués, 3 jun 2026):*
- [ ] Sección para registrar los **ejercicios de educación alimentaria realizados en consulta** (ej: lectura de etiquetas, plato de Harvard, control de raciones, registro de hambre real vs emocional...). Que quede constancia de qué se ha trabajado con el paciente a nivel educativo, no solo lo dietético

**Archivos a crear/modificar:**
- `prisma/schema.prisma` — nuevo modelo `NotaSesion`
- `src/app/actions/notas-sesion.ts` — CRUD de notas de sesión
- `src/components/paciente/notas-sesion-tab.tsx` — UI de la lista y editor de notas
- `src/components/paciente/paciente-ficha-client.tsx` — añadir pestaña o sección
- Script de migración SQL en `scripts/`

**Prioridad:** Alta (necesidad diaria de cualquier nutricionista — registrar lo hablado es fundamental para la continuidad asistencial)
**Complejidad:** Media

---

## 51. Documentación de protección de datos (RGPD) personalizada por nutricionista

> ⭐ **PRIORIDAD ALTA / inminente (9 jun 2026).** Varios profesionales han pedido ya el **contrato de encargado de tratamiento (DPA)** Annonia↔nutricionista (José y otros). Guillermo: "lo vamos a hacer dentro de nada". Sacar primero el DPA que Annonia facilita a cada profesional, y en paralelo el almacenamiento de documentos del paciente.
>
> 🚧 **BLOQUEANTE DE ADOPCIÓN confirmado (19 jun 2026):** un nutricionista (el de las patologías + protección de datos) dice explícitamente que **sin el acuerdo de tratamiento de los datos de los pacientes NO puede empezar a meter pacientes**. No es solo una petición de funcionalidad: sin el DPA no hay uso real con pacientes → frena la conversión. VERIFICADO: hoy **no existe** ningún documento de encargado de tratamiento que se le pueda facilitar; la política de privacidad pública solo cubre a Annonia como **responsable** de los datos de sus usuarios (los nutris), no como **encargado** respecto a los pacientes. Sube la urgencia: es lo que desbloquea que los leads empiecen a usarla de verdad.

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026; José (WhatsApp) — 9 jun 2026 (pide el DPA de encargado de tratamiento).

**Dos piezas distintas a no confundir:**
- **(A) DPA Annonia ↔ nutricionista:** documento de encargado de tratamiento que **Annonia entrega al profesional** (Annonia trata los datos de los pacientes en su nombre). Es lo que pide José. → PRIORITARIO, sale pronto.
- **(B) Documentos del nutri ↔ paciente:** consentimientos/RGPD que el nutri envía a SUS pacientes para firmar (lo de Ainara, abajo).

**Apartado "Documentos" en la ficha del paciente (Guillermo, 9 jun 2026):** que todos los documentos del paciente (consentimientos firmados, DPA, etc.) se **guarden automáticamente en un apartado de "Documentos" dentro de la ficha de ese paciente**, y queden siempre a mano. Unificar con la sección de archivos del paciente de la tarea #2 (un único apartado "Documentos/Archivos" del paciente que albergue tanto los archivos subidos como los documentos legales firmados).

**Estado actual:** Annonia tiene sus propias páginas legales (política de privacidad, términos de servicio, cookies) accesibles desde el footer. Sin embargo, no existe funcionalidad para que cada nutricionista gestione su propia documentación de protección de datos personalizada ni para enviarla a firmar a sus pacientes.

**Petición:** Ainara pregunta: "al ser todo una plataforma online, ¿cómo tiene regulada la protección de datos?" Y sugiere: "estaría bien que cada usuario tenga como su apartado para subir su documentación de protección de datos personalizada para enviar a firmar a cada paciente."

**Concepto:** Cada nutricionista tiene sus propios documentos legales (consentimiento informado, protección de datos, RGPD) que necesita que sus pacientes firmen. La app debería facilitar este flujo:
1. El nutricionista sube sus documentos legales (PDF o texto)
2. Al dar de alta un paciente, se le envían automáticamente para firmar
3. El paciente firma digitalmente desde el portal
4. Queda registro de la firma (fecha, IP, documento firmado)

**Tareas:**

*Modelo de datos:*
- [ ] Nuevo modelo `DocumentoLegal` (id, dietistaId, titulo, contenido/archivoUrl, tipo, activo, createdAt)
- [ ] Tipos: consentimiento_informado, proteccion_datos, terminos_servicio, otro
- [ ] Nuevo modelo `FirmaDocumento` (id, documentoId, pacienteId, fechaFirma, ip, firmado)

*UI del nutricionista:*
- [ ] Sección en Ajustes: "Documentos legales" — CRUD de documentos
- [ ] Subir PDF o escribir texto del documento directamente
- [ ] Configurar qué documentos se envían automáticamente a pacientes nuevos
- [ ] Ver estado de firmas por paciente (firmado/pendiente)

*Flujo del paciente:*
- [ ] Al acceder al portal por primera vez, mostrar documentos pendientes de firmar
- [ ] Firma digital: checkbox "He leído y acepto" + registro de la acción
- [ ] Enviar documentos por email con link para firmar
- [ ] El paciente puede descargar los documentos firmados

*Input adicional (Guillermo, 4 jun 2026):*
- [ ] **Consentimiento informado antes de la anamnesis** — que el paciente firme un consentimiento informado antes de pasar/rellenar la anamnesis, y que ese documento **aparezca en la documentación del paciente** (su ficha). Ejemplo real aportado: "Contrato con el cliente / Consentimiento informado" de Nutrition Efficiency (datos personales + objetivos del tratamiento + exención de IVA art. 20.3 Ley 37/1992 + procedimientos y riesgos + exoneración de responsabilidad)
- [ ] **Consentimiento específico para uso de IA con los datos del paciente** — sobre todo de cara a **universidades** (casos clínicos de alumnos, tarea #39): que el paciente/representante consienta expresamente el tratamiento de sus datos con IA. Documento aparte del consentimiento general
- [ ] Plantilla de consentimiento informado predefinida que el nutri pueda usar/editar (no solo subir la suya)

**Relacionado con:** #18 (anamnesis), #39 (cuenta profesor/unis), #2 (archivos/documentos del paciente — el apartado "Documentos" se comparte), #79 (checklist legal — el DPA)
**Prioridad:** Alta (el DPA Annonia↔nutricionista es inminente y ya pedido por varios; requisito legal — el RGPD exige consentimiento documentado y encargo de tratamiento)
**Complejidad:** Media (el DPA en sí es un documento + entrega/firma; el almacenamiento de documentos del paciente es un poco más adelante)

---

## 52. Exportar e importar recetas y composición de alimentos

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026; **reinsiste el 17 jun 2026** (es su prioridad: "las bases de datos importables y exportables para unificarlas").

**Estado actual (VERIFICADO en código, 17 jun 2026):** Sigue sin existir import/export de las bases **propias** (recetas y alimentos) en CSV/Excel/JSON. **OJO, no confundir:** SÍ existe `/alimentos/importar`, pero es para **buscar e importar alimentos de una API externa de uno en uno** (`buscarAlimentosAPI`/`importarAlimentoAPI`) — no sirve para exportar tu catálogo ni para importar/unificar una base de datos propia. Las recetas y alimentos personalizados se crean dentro de la app y no hay forma de exportarlos (backup/uso externo) ni de importar datos masivamente (ej: recetas en Excel).

**Petición:** Ainara dice: "estaría muy bien poder descargarse de la app recetas y composición de alimentos y también importarlos."

**Tareas:**

*Exportar:*
- [ ] Exportar recetas propias a CSV/Excel/JSON (nombre, ingredientes con cantidades, instrucciones, macros)
- [ ] Exportar alimentos personalizados a CSV/Excel (nombre, macros, micronutrientes, categoría)
- [ ] Exportar individual (una receta/alimento) o masivo (todas mis recetas)
- [ ] Botón "Exportar" en la lista de recetas y en la lista de alimentos

*Importar:*
- [ ] Importar alimentos desde CSV/Excel (plantilla descargable con columnas: nombre, kcal, proteínas, carbos, grasas, etc.)
- [ ] Importar recetas desde CSV/Excel (formato estructurado con ingredientes)
- [ ] Validación de datos al importar (campos obligatorios, rangos válidos)
- [ ] Vista previa antes de confirmar la importación
- [ ] Detección de duplicados (si ya existe un alimento con el mismo nombre)

**Prioridad:** Media (útil para migración desde otras apps y para backup)
**Complejidad:** Media

---

## 53. Recetario imprimible: seleccionar recetas para entregar al paciente

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026; **Ruth Magem (ruthmagem@gmail.com — 2 ago 2026)**, 2ª solicitante, con un caso de uso más simple y directo: **descargar UNA receta en PDF** para poder **mandarla por correo** al paciente ("a veces, por edades, la gente más mayor, es la forma más fácil"). → Contemplar las dos vías: (a) botón "Descargar PDF" en la ficha de una receta (rápido de hacer, cubre el caso de Ruth), y (b) el recetario de varias recetas (lo de Ainara, abajo).

**Estado actual (reverificado 2 ago 2026):** Las recetas existen como entidad y se añaden a los planes. En el PDF del plan las recetas aparecen dentro de las comidas (con ingredientes e instrucciones). Pero **NO existe ningún PDF de receta**: los únicos generadores son `src/lib/pdf/generate-plan-pdf.ts` y `generate-anamnesis-pdf.ts`; en `/recetas/[id]` no hay botón de descargar/imprimir. Ni receta suelta ni recetario.

**Petición:** Ainara dice: "si yo quiero darle recetas dulces al paciente además de plan de alimentación, poder hacer por IA o con las que ya están, una selección y bajarlas para imprimírselas." Quiere poder seleccionar un conjunto de recetas (ej: "5 postres saludables") y generar un PDF/recetario bonito para entregar al paciente, independiente del plan alimenticio.

**Concepto:** El nutricionista selecciona recetas de su biblioteca → genera un recetario PDF con portada, índice, y cada receta con ingredientes, instrucciones, macros y foto (si tiene). Puede ser temático: "Recetas dulces", "Cenas rápidas", "Batch cooking semanal", etc.

**Tareas:**
- [ ] UI: seleccionar múltiples recetas desde la lista de recetas (checkboxes)
- [ ] Botón "Generar recetario" con opciones: título del recetario, incluir macros sí/no, incluir fotos sí/no
- [ ] Generar PDF con: portada (título + logo del nutricionista), índice, y cada receta en una página
- [ ] Cada receta muestra: nombre, ingredientes con cantidades (en medidas caseras si aplica), instrucciones paso a paso, macros por porción, foto del plato (si existe)
- [ ] Opción de generar recetas con IA para el recetario (ej: "genera 5 postres saludables sin azúcar")
- [ ] Guardar recetarios creados para reutilizar con otros pacientes
- [ ] **Botón "Descargar PDF" en la ficha de UNA receta** (`/recetas/[id]`) — caso de Ruth; es la versión mínima y probablemente el primer paso (reutilizar el generador del recetario con una sola receta)
- [ ] Enviar recetario por email al paciente
- [ ] Aplicar temas/colores del PDF del plan (reutilizar sistema de temas existente)

**Archivos a crear/modificar:**
- `src/lib/pdf/generate-recetario-pdf.ts` — nuevo generador de PDF de recetario
- `src/app/(dashboard)/recetas/page.tsx` — selección múltiple y botón de generar
- `src/components/paciente/entregables-tab.tsx` — opción de adjuntar recetario al entregable

**Prioridad:** Media-Alta (enriquece la propuesta de valor — el nutricionista entrega más que solo el plan)
**Complejidad:** Media

---

## 54. Registro de saciedad/hambre en seguimiento diario

**Origen:** María José Sánchez (@Comiendoavocados) — 29 mayo 2026; Carmen Florensa (review en PDF, 23 jun 2026 — espacio para que el paciente apunte si se quedó con hambre, cansado o hinchado; no sabía si existía → poco visible).

**Estado actual (REVERIFICADO 23 jun 2026):** PARCIAL — YA existe un **selector de "sensación"** en el seguimiento diario del paciente (hambre/cansado/hinchado…), pero codificado **dentro del campo `notas`** (`⟦sensacion:tipo⟧`, ver `portal/seguimiento/page.tsx` `extraerSensacion`), no como campo estructurado. Lo que falta para completarlo: (a) que sea **por comida** (no solo del día), (b) **campo estructurado** propio (no embebido en notas, para poder analizarlo), y (c) que el **nutri lo vea bien** en su panel (Carmen, reviewer, no sabía que existía → está poco visible).

**Petición:** Añadir algún tipo de registro para evaluar cómo de saciado se ha quedado el paciente con cada comida, o si se ha quedado con hambre. Información clave para que el nutricionista ajuste las cantidades y la composición del plan.

**Input adicional (Alejandra, 2 jun 2026):** Ampliar el registro más allá de la saciedad — que el paciente pueda anotar **cómo le sienta cada comida**:
- Saciedad: insatisfecho / normal / muy lleno
- Síntomas posprandiales: somnolencia, reflujo, dolor estomacal, inflamación posprandial
- Estado positivo: "en buen estado" (podría salir a caminar 15-20 min después)

Además, pide un **registro dietético con fotos**: que el paciente pueda subir fotos de los platos que come en cada comida. Muy útil para que el nutricionista vea raciones y composición reales sin depender de la descripción escrita.

**Reiterado (Helena Rodríguez, 9 jul 2026):** propone que (en una futura app) **los pacientes puedan adjuntar fotografías de sus comidas**. VERIFICADO: hoy NO existe un diario de comidas con fotos; el paciente solo puede mandar fotos por el **chat de mensajes**. ⚠️ Además, el texto de ayuda (`help.json`) afirma que el seguimiento muestra "fotos del día a día", pero el modelo `SeguimientoDiario` **no tiene campo de foto** → corregir ese texto (promete algo que no existe) o implementar la función.

**Concepto:** Tras cada comida (o al final del día), el paciente indica su nivel de saciedad. Opciones de implementación:
1. **Escala por comida** — En cada comida del registro diario, escala 1-5 (muy hambriento → muy lleno) o emojis
2. **Escala global del día** — Un único valor de saciedad general para el día
3. **Ambas** — Escala por comida + resumen del día

**Tareas:**
- [ ] Decidir granularidad: por comida (dentro de `comidasData` JSON) o por día (campo nuevo en `SeguimientoDiario`)
- [ ] Si por comida: añadir campo `saciedad` (1-5) dentro de cada entrada de `comidasData`
- [ ] Si por día: añadir campo `saciedad` (Int?, 1-5) al modelo `SeguimientoDiario`
- [ ] UI en el portal del paciente: selector visual de saciedad (emojis o escala) en el registro diario
- [ ] UI para el nutricionista: ver la saciedad reportada en el panel de seguimiento del paciente
- [ ] Gráfica de evolución de saciedad a lo largo del tiempo
- [ ] Considerar: campo de texto opcional "¿Por qué?" (ej: "me quedé con hambre porque cené tarde")
- [ ] **Síntomas posprandiales por comida** (Alejandra) — selector múltiple por comida: somnolencia, reflujo, dolor estomacal, inflamación posprandial, en buen estado. Guardar dentro de `comidasData` JSON
- [ ] **Foto del plato por comida** (Alejandra) — el paciente sube foto de lo que ha comido en cada comida desde el portal (base64 comprimida/redimensionada, reutilizar `validateImageDataUrl()`). Vigilar peso en BD
- [ ] Vista del nutricionista: timeline del registro dietético con fotos + síntomas por comida (clave para detectar intolerancias y patrones digestivos)

**Input adicional (María Marqués, 3 jun 2026) — ampliar el seguimiento más allá de la adherencia al plan:**
- [ ] **Otras bebidas (sin alcohol)** — junto a la ingesta de agua, sección para registrar otras bebidas (café, infusiones, refrescos, lácteos...). Hoy solo se registra agua (`aguaML`)
- [ ] **Parámetros de bienestar/conducta en el seguimiento diario** — sueño, estado emocional, bienestar general, actividad física, conducta alimentaria (esto último ya definido en la sección "comportamientos alimentarios" de la anamnesis — reutilizar). Que el seguimiento no sea solo "¿cumpliste el plan?"
- [ ] **Escala de Bristol con imagen** — en la sección de función intestinal, mostrar la imagen de la escala de Bristol para que el paciente identifique su tipo (1-7). Relacionado con el bloque digestivo de la anamnesis (#18)

**Archivos a modificar:**
- `prisma/schema.prisma` — campo nuevo si es por día
- `src/app/actions/seguimiento-paciente.ts` — guardar dato de saciedad
- `src/components/paciente/seguimiento/` — UI del registro
- `src/components/paciente/paciente-ficha-seguimiento-tab.tsx` — vista del nutricionista

**Prioridad:** Media (dato clínico útil para ajustar planes — complementa el seguimiento existente)
**Complejidad:** Baja

---

## 55. Sistema de intercambio de alimentos

**Origen:** Marta (@martadenutri, Instagram) — 29 mayo 2026

**Estado actual:** En el plan alimenticio, cada comida tiene alimentos fijos con sus cantidades. Existe un botón "equivalente" en cada alimento del editor (`equivalente-panel.tsx`) que **sustituye** el alimento por otro de macros similares. Pero solo sustituye (1 a 1) y el cambio no se ofrece al paciente como alternativa: no hay un sistema estructurado de intercambios visible para el paciente.

**Feedback pendiente (nutricionista, probando el panel de alternativas):**
- [ ] **Nombres truncados en el panel de equivalencias** — en los resultados del panel, los nombres largos se cortan ("Atún En Lata En…", "Atún Claro En C…") y no se distingue qué tipo de atún es. Hacer el panel/columna más ancho, o mostrar el nombre completo / con tooltip al pasar por encima

**Petición:** Marta menciona que compañeras suyas usan un sistema de intercambio de alimentos en sus consultas y lo considera útil. El concepto es: para cada alimento del plan, definir una lista de alternativas equivalentes nutricionalmente (ej: "en vez de 150g de pollo, puedes comer 170g de pavo o 200g de merluza"). Así el paciente tiene flexibilidad sin salirse de los macros.

**Concepto:**
1. **Grupos de intercambio** — Agrupar alimentos por equivalencia nutricional: proteínas animales, proteínas vegetales, cereales, frutas, verduras, grasas, lácteos, etc.
2. **Equivalencias dentro del grupo** — Dentro de cada grupo, qué cantidad de cada alimento equivale a la misma porción nutricional (ej: 1 ración de proteína = 100g pollo = 120g merluza = 2 huevos)
3. **En el plan** — Al lado de cada alimento, mostrar alternativas del mismo grupo con la cantidad ajustada
4. **En el PDF/portal** — El paciente ve "Pollo 150g (o: pavo 170g, merluza 200g, tofu 180g)"

**Tareas:**
- [ ] Definir grupos de intercambio estándar (proteínas, carbohidratos, grasas, frutas, verduras, lácteos)
- [ ] Crear modelo `GrupoIntercambio` (id, dietistaId?, nombre, descripcion) — globales + personalizados por nutricionista
- [ ] Asignar alimentos a grupos con su factor de equivalencia (ej: pollo = 1.0, merluza = 1.2, tofu = 1.8 dentro del grupo "proteínas")
- [ ] UI en el plan: botón "Ver alternativas" en cada alimento que muestre opciones equivalentes con cantidades ajustadas
- [ ] Incluir alternativas en el PDF y en el portal del paciente (configurable)
- [ ] El nutricionista puede personalizar los grupos y las equivalencias
- [ ] Preconfiguraciones estándar basadas en tablas de intercambio clásicas (sistema de equivalentes ADA/AMA)

**Prioridad:** Media (flujo de trabajo habitual en consulta para algunos nutricionistas — mejora la adherencia del paciente)
**Complejidad:** Media-Alta

---

## 56. Recomendaciones predefinidas por patología/condición

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026; Joana (joananutrilim, Instagram) — 12 junio 2026 (añade **estados fisiológicos**, no solo patologías).

**Estado actual:** La sección "Recomendaciones" del PDF es un campo de texto libre que el nutricionista escribe manualmente para cada paciente. No existen plantillas ni bloques predefinidos de recomendaciones por condición.

**Input de Joana (12 jun 2026):** Pide un campo para agregar recomendaciones no solo por patología, sino también por **estado fisiológico**: embarazo, menopausia, SOP, endometriosis… Es decir, las plantillas/bloques de recomendaciones deben cubrir tanto patologías (diabetes, hiperuricemia…) como estados fisiológicos. Ampliar el catálogo de plantillas globales predefinidas con estos casos.

**Petición:** Ainara tiene un sistema propio (Excel con fichas) donde, según la patología del paciente (diabetes, ácido úrico, oncológico, pérdida de peso…), marca una pestaña y las recomendaciones correspondientes se añaden automáticamente al plan. Quiere lo mismo en Annonia: bloques de recomendaciones por condición que se seleccionen con un checkbox y se inserten automáticamente en el PDF.

**Concepto:**
1. El nutricionista crea **plantillas de recomendaciones** por condición: "Diabetes tipo 2", "Hiperuricemia", "Oncología", "Pérdida de peso", "Celiaquía", etc.
2. Cada plantilla contiene un bloque de texto con las recomendaciones específicas
3. En la ficha del paciente o al generar el entregable, selecciona las condiciones que aplican (checkboxes)
4. Las recomendaciones seleccionadas se concatenan automáticamente en la sección de recomendaciones del PDF
5. El nutricionista puede editar el resultado final antes de generar (ajustar, quitar, añadir)

**Tareas:**
- [ ] Nuevo modelo `PlantillaRecomendacion` (id, dietistaId, nombre, contenido, categoria?, orden, activo)
- [ ] UI en Ajustes: CRUD de plantillas de recomendaciones
- [ ] Plantillas globales predefinidas (diabetes, hipertensión, celiaquía, etc.) que el nutricionista puede copiar y personalizar
- [ ] En Entregables / generación de PDF: selector de plantillas (checkboxes) que se insertan en la sección de recomendaciones
- [ ] Las plantillas seleccionadas se concatenan con el texto libre existente
- [ ] Opción de vincular plantillas a patologías del paciente (si en la anamnesis tiene "diabetes", sugerir automáticamente la plantilla correspondiente)

**Prioridad:** Alta (ahorra tiempo diario — los nutricionistas repiten las mismas recomendaciones para cada patología)
**Complejidad:** Media

---

## 57. Agrupar comidas repetidas en el PDF (deduplicación)

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** En el PDF del plan, el detalle diario muestra cada día de la semana con todas sus comidas, incluso si son idénticas entre días. Si el desayuno es igual los 7 días, aparece repetido 7 veces en el detalle diario.

**Petición:** Ainara explica que en su sistema, si los desayunos son iguales toda la semana, aparecen una sola vez arriba del todo, al principio del documento, en vez de repetirse en cada día. Solo las comidas que varían se muestran por día.

**Concepto:**
1. Detectar automáticamente comidas que son idénticas en todos (o la mayoría) de los días
2. Mostrar esas comidas una vez en una sección "Comidas fijas de la semana" al inicio del detalle
3. En el detalle diario, omitir las comidas ya mostradas arriba (o poner "Ver desayuno fijo")
4. Reduce significativamente el número de páginas cuando hay muchas comidas repetidas

**Tareas:**
- [ ] En `generate-plan-pdf.ts`: antes de generar el detalle diario, detectar comidas idénticas entre días (comparar alimentos + cantidades)
- [ ] Si una comida es igual en N de 7 días (umbral configurable, ej: ≥5 días), extraerla a sección "fija"
- [ ] Generar sección "Comidas fijas" antes del detalle diario con las comidas que se repiten
- [ ] En el detalle diario, indicar "Desayuno: ver comidas fijas" o simplemente omitirlo
- [ ] Toggle en opciones del PDF: "Agrupar comidas repetidas" (activado por defecto)

**Prioridad:** Media (mejora la legibilidad del PDF — menos páginas, más claro para el paciente)
**Complejidad:** Baja-Media

---

## 58. Añadir mediciones de las piernas en métricas

**Origen:** Remedios Velasco (remediosvelascosalazar@gmail.com) — 1 junio 2026; Dayana Martínez (nutriconday, WhatsApp) — 4 junio 2026, vuelve a pedir poder poner medidas en cm de **muslo y pierna** (ya era origen de la #33). Demanda repetida → reforzar prioridad.

**Estado actual:** El modelo `MedidaAntropometrica` (`prisma/schema.prisma`) tiene perímetros de **cintura, cadera, brazo y abdomen**, y pliegues cutáneos (abdominal, axilar, pectoral, subescapular, suprailíaco, tricipital y del muslo). Pero **no existe ningún perímetro de pierna/muslo ni de gemelo** — solo el `pliegueMuslo`, que es un pliegue, no una circunferencia.

**Petición:** Poder registrar las mediciones (perímetros) de las piernas en la zona de métricas.

**Concepto:** Añadir circunferencias de la pierna para seguir el progreso del tren inferior (muy usado en recomposición/hipertrofia).

**Tareas:**
- [ ] Añadir campos al modelo `MedidaAntropometrica`: `perimetroMuslo Float?` y opcionalmente `perimetroGemelo Float?` (pantorrilla)
- [ ] Script SQL manual `ALTER TABLE medidas_antropometricas ADD COLUMN IF NOT EXISTS ...` (no hay Prisma Migrate)
- [ ] Añadir los campos al formulario de nueva/editar medición
- [ ] Incluirlos en el listado, gráficas de evolución y, si aplica, en el PDF de evolución

**Prioridad:** Media
**Complejidad:** Baja (un par de campos más, mismo patrón que los perímetros existentes)

---

## 59. Fotos de progreso (antes / después) en métricas

**Origen:** Remedios Velasco (remediosvelascosalazar@gmail.com) — 1 junio 2026; Antonio (antoniofs.nutricion, 4 jun 2026) — lo pide para los que trabajan **online**: apartado para registrar fotos de perfil, de frente y de espalda; Jesús (jesusmnutricion, 22 jun 2026) — "almacenar **fotos de cada revisión**". (Lo piden ya 3+ profesionales.)

**Estado actual:** No existe ninguna funcionalidad de fotos de progreso. No hay campo de foto en `MedidaAntropometrica` ni modelo asociado.

**Petición:** Poder añadir foto del **antes y el después** del paciente para comparar visualmente la evolución. Antonio concreta los tipos de foto útiles en seguimiento online: **frente, perfil y espalda**.

**Concepto:**
1. Subir una o varias fotos asociadas a una fecha (idealmente con tipo: frontal / lateral / posterior)
2. Ver una vista comparativa "antes vs después" (dos fechas lado a lado)
3. Opcionalmente, incluirlas en el PDF de evolución

**Tareas:**
- [ ] Decidir modelo: campo `foto String?` (base64) en `MedidaAntropometrica`, o nuevo modelo `FotoProgreso` (id, pacienteId, fecha, imagen base64, tipo) — preferible el modelo separado para permitir varias fotos por fecha
- [ ] Script SQL manual para crear tabla/columna
- [ ] UI de subida reutilizando `validateImageDataUrl()` de `src/lib/validation.ts` (ya se guardan imágenes en base64 en BD)
- [ ] Vista comparativa antes/después (selector de dos fechas)
- [ ] Opcional: incluir en el PDF de evolución
- [ ] **Vigilar el peso de las imágenes**: comprimir/redimensionar antes de guardar para no inflar la BD (las fotos de cuerpo entero pesan más que un avatar)

**Prioridad:** Media
**Complejidad:** Media (subida + almacenamiento + vista comparativa; las imágenes en base64 ya están soportadas pero hay que cuidar el tamaño)

## 60. Revisar modal "Definir objetivo" y la sección "Objetivo principal"

**Problema (captura):** en el modal "Define un nuevo objetivo" (sidebar de la ficha del paciente) los desplegables muestran los **valores crudos del enum**, sin formatear ni traducir:
- "Tipo de objetivo" → muestra `medicion` (debería ser "Medición" / "Genérico")
- "Tipo de medición" → muestra `grasa_corporal`, `masa_muscular`, `perimetro_cintura`, `perimetro_cadera`, `trigliceridos`, `colesterol`… (deberían ser "Grasa corporal", "Masa muscular", "Perímetro de cintura", "Perímetro de cadera", "Triglicéridos", "Colesterol"…)

Se ven valores "de programador" y queda poco profesional.

**Dónde está:**
- Componente: `src/components/paciente/ficha-sidebar.tsx` — los `<Select>` de `tipoObjetivo` (~línea 467) y `tipoMedicion` (~línea 479) usan `TIPOS_OBJETIVO` / `TIPOS_MEDICION`, construidos con las keys crudas como label.
- Enums: `src/lib/ficha-sidebar-types.ts` (`TIPOS_OBJETIVO_KEYS`, `TIPOS_MEDICION_KEYS`, `UNIDADES_MEDICION`).

**Tareas:**
- [ ] Mostrar etiquetas legibles/traducidas en ambos desplegables (añadir claves i18n en `patients.json` es/pt y mapear key→label, en vez de usar la key cruda).
- [ ] Revisar la sección **"Objetivos" / "Objetivo principal"** de la ficha: cómo se define y se **actualiza** el objetivo principal — parece que no termina de funcionar bien. Verificar el flujo de añadir/editar y qué objetivo queda marcado como "principal".
- [ ] **Editar el objetivo principal desde la FICHA** (nutricionista, 2 jul 2026 — "no encuentro cómo modificar el objetivo principal del paciente"). VERIFICADO: en la ficha el objetivo principal es **solo lectura** (`paciente-ficha-general-tab.tsx`); solo se cambia entrando a `/pacientes/[id]/editar`, y el botón "+" de la ficha añade objetivos parciales, no edita el principal. → Añadir edición del objetivo principal directamente en la ficha (descubribilidad).
- [ ] **Borrar una medición desde la FICHA** (mismo nutri, 2 jul — puso una fecha errónea y no encontró cómo borrarla). VERIFICADO: `eliminarMedida` existe y el botón está en la vista de evolución (`/pacientes/[id]/medidas`, `medida-delete-button.tsx`), pero NO en la pestaña Mediciones de la ficha. → Añadir el botón de borrar también en la ficha. [Nota: `mediciones-tab` está en WIP ahora, quizá se resuelva ahí.]

**Prioridad:** Media (afecta a la imagen de la herramienta + descubribilidad de acciones que existen pero están escondidas)
**Complejidad:** Baja (las etiquetas) + por revisar (la lógica del objetivo principal)

---

## 61. Registrar infecciones diagnosticadas (con fecha de diagnóstico y de remisión)

**Origen:** nutricionista (WhatsApp) — 1 jun 2026

**Estado actual:** La anamnesis tiene patologías (texto), antecedentes personales y familiares (texto) y un campo de notas. NO hay un apartado específico para registrar infecciones que ha tenido el paciente con sus fechas; hoy solo se podría anotar como texto suelto en patologías/antecedentes/notas.

**Petición:** Poder registrar infecciones diagnosticadas (ej. H. pylori) indicando **cuándo se diagnosticó y cuándo remitió**. Es información clínica relevante para el seguimiento.

**Tareas:**
- [ ] Añadir en la anamnesis (sección Clínica) un apartado "Infecciones" como lista: nombre/tipo, fecha de diagnóstico, fecha de remisión (opcional), notas.
- [ ] Permitir añadir varias.
- [ ] Mostrarlas en la ficha y, si procede, en el PDF de anamnesis/historial.

**Archivos:** `src/lib/ficha-informacion-types.ts` (tipos de la sección clínica) + `src/components/paciente/paciente-ficha-informacion-tab.tsx` (UI).

**Prioridad:** Media
**Complejidad:** Baja-Media

---

## 62. Mostrar medicamentos / suplementos (y similares) en forma de tabla

**Origen:** nutricionista (WhatsApp) — 1 jun 2026; Joana (joananutrilim, Instagram) — 12 jun 2026 (pide "una sección de medicación o suplementos" además de la dieta).

**Estado actual:** Medicamentos, suplementos, alergias, intolerancias y patologías son listas de texto (`string[]` en `Paciente`) y se muestran como texto/lista simple (`renderLista`) en la ficha general del paciente. Es decir, medicación y suplementos **YA se registran** en el historial del paciente; lo que se pide es una **sección más estructurada/visible** y poder **pautarlos junto a la dieta** (suplementos: #65; catálogo: este #62; medicación + interacciones: #71).

**Petición:** Que esos datos (medicamentos, suplementos…) se presenten en **formato tabla**, más legible y ordenado.

**Input adicional (Alejandra, 2 jun 2026):** Para los **suplementos** del historial médico, en vez de texto libre, propone:
1. Un **desplegable con opciones** de suplementos comunes (proteína whey, creatina, vitamina D, omega-3, magnesio…)
2. Una **lista/catálogo propio del nutricionista** donde pueda dar de alta sus suplementos con **marca, dosis y posología**, y luego asignarlos al paciente desde el desplegable

Esto refuerza la opción "estructurada" de esta tarea: pasar suplementos (y medicamentos) de `string[]` a objetos con campos.

**Tareas:**
- [ ] Mostrar medicamentos/suplementos (y quizá alergias, patologías, intolerancias) en una tabla en la ficha del paciente.
- [ ] Valorar columnas útiles (nombre, dosis/posología, frecuencia, notas). Si se quiere dosis/frecuencia, implica pasar de `string[]` a objetos con campos; si no, basta una tabla de una columna bien formateada.
- [ ] Mantener compatibilidad con los datos existentes (texto suelto).
- [ ] **Catálogo de suplementos del nutricionista** (Alejandra) — CRUD en Ajustes o sección propia: nombre, marca, dosis, posología, notas. Modelo `Suplemento` (id, dietistaId, nombre, marca?, dosis?, posologia?, notas?)
- [ ] **Desplegable en la ficha del paciente** (Alejandra) — al añadir un suplemento, autocompletar/seleccionar desde el catálogo propio + lista de suplementos comunes predefinidos; opción de texto libre como fallback
- [ ] Relacionado con la tarea #65 (pautar suplementos en el plan): el mismo catálogo alimentaría la pauta de suplementación

**Archivos:** `src/components/paciente/paciente-ficha-general-tab.tsx` (visualización) + modelo si se estructuran campos (dosis/frecuencia).

**Prioridad:** Media-Baja (presentación)
**Complejidad:** Baja (tabla simple) / Media (si se estructura con dosis y frecuencia)

---

## 63. Videollamada también con Zoom y otras plataformas (además de Google Meet)

**Origen:** nutricionista (WhatsApp) — 1 jun 2026

**Estado actual:** Las citas se pueden marcar como "online" (casilla al crear la cita en la Agenda) y, si el nutricionista tiene **Google conectado** (Ajustes → Integraciones), se genera automáticamente un enlace de **Google Meet** (`isOnline` + `googleMeetLink`). Solo Google Meet; no hay Zoom ni otras.

**Petición:** Poder usar también **Zoom** u otras plataformas para las videollamadas, no solo Meet.

**Tareas:**
- [ ] Permitir elegir plataforma (Google Meet / Zoom / Teams / enlace manual).
- [ ] Opción simple de partida: un campo **"enlace de videollamada" manual** en la cita (pegar el de Zoom/Teams) además del Meet automático.
- [ ] Integración real con Zoom (API) como mejora mayor.

**Archivos:** `agenda/nueva/page.tsx`, `cita-detalle-modal.tsx`, modelo de cita (campo enlace/plataforma).
**Prioridad:** Media
**Complejidad:** Baja (enlace manual) / Media-Alta (integración con Zoom API)

---

## 64. Calcular el keto ratio (ratio cetogénico) para dietas keto

**Origen:** nutricionista (WhatsApp) — 1 jun 2026

**Estado actual:** La pestaña Planificación calcula gasto, objetivo calórico y reparto de macros en gramos, pero **no** el ratio cetogénico.

**Petición:** Para pacientes en dieta keto, mostrar el **keto ratio** = gramos de grasa : (gramos de proteína + gramos de carbohidratos). Ej. 4:1, 3:1, 2:1.

**Tareas:**
- [ ] Calcular a partir de los gramos ya disponibles: `ratio = grasa_g / (proteina_g + carbo_g)`.
- [ ] Mostrarlo en la sección de macros de Planificación (siempre, o activable cuando la dieta sea keto).
- [ ] Opcional: fijar un ratio objetivo (4:1, 3:1…) y que ajuste los macros para alcanzarlo.

**Archivo:** `src/components/paciente/planificacion-por-defecto-tab.tsx`
**Prioridad:** Media-Baja (nicho: pacientes keto)
**Complejidad:** Baja (mostrar el ratio) / Media (ajustar macros a un ratio objetivo)

---

## 65. Pautar suplementos dentro del plan (antes/con/después de cada comida)

**Origen:** Alejandra (WhatsApp) — 2 junio 2026

**Estado actual:** El plan alimenticio solo contiene alimentos y recetas (`ComidaDelDia` → `AlimentoEnComida`). Los suplementos solo existen como lista de texto en el historial médico de la anamnesis. No hay forma de **pautar** la toma de suplementos dentro del plan, ni de indicar el momento de la toma.

**Petición:** Poder incorporar al plan los suplementos a tomar, indicando el momento: **antes del desayuno, con el desayuno, después de la cena…** Que el paciente vea la pauta de suplementación integrada en su plan (portal + PDF).

**Concepto:**
1. El nutricionista pauta suplementos en el plan: qué suplemento, dosis, y momento de la toma (antes de / con / después de + tipo de comida, o en ayunas / antes de dormir)
2. El paciente lo ve en su plan en el portal, junto a las comidas correspondientes
3. Aparece también en el PDF del plan (sección de suplementación o integrado en cada comida)
4. Se alimenta del catálogo de suplementos del nutricionista (ver tarea #62: marca, dosis, posología)

**Tareas:**
- [ ] Nuevo modelo `SuplementoEnPlan` (id, planId, suplementoId? o nombre libre, dosis, momento, tipoComida?, notas) — `momento`: ANTES / CON / DESPUES / AYUNAS / ANTES_DORMIR
- [ ] UI en el editor de dietas: sección "Suplementación" del plan, o botón "Añadir suplemento" en cada comida
- [ ] Selector desde el catálogo de suplementos del nutricionista (#62) + texto libre como fallback
- [ ] Mostrar la pauta en el portal del paciente junto a cada comida ("Antes del desayuno: Omega-3, 1 cápsula")
- [ ] Incluir en el PDF del plan: tabla de suplementación (toggle activable) o línea en cada comida
- [ ] Considerar: check de cumplimiento en el seguimiento diario ("¿has tomado tus suplementos?")

**Archivos a modificar:**
- `prisma/schema.prisma` — nuevo modelo
- `src/app/actions/planes.ts` — CRUD de suplementos del plan
- `src/components/dieta/` — UI del editor
- `src/lib/pdf/generate-plan-pdf.ts` — sección de suplementación
- `src/app/paciente/portal/dieta/page.tsx` — vista del paciente

**Input adicional (Guillermo, apuntes reunión — 5 jun 2026) — stock + seguimiento de suplementación del paciente con calendario y avisos:**
- [ ] **Producto de stock con etiquetas** — el producto/suplemento del stock lleva nombre + etiquetas (proteínas, creatina, vitaminas, etc.) para clasificarlo y asignarlo fácil al paciente (enlaza con #42)
- [ ] **Calendario de consumo / predicción de fin** — al asignar un suplemento al paciente (con su dosis y frecuencia), la app **calcula cuándo se prevé que se va a acabar** (según unidades del envase / dosis diaria)
- [ ] **Aviso de reposición automático** — cuando se acerca la fecha de fin, **avisar al paciente Y al nutricionista** ("a X se le acaba la creatina en ~5 días")
- [ ] **Sección de seguimiento de suplementación del paciente** — apartado donde el nutri ve qué suplementos toma cada paciente, desde cuándo, cuánto le queda y el historial
- [ ] Esto une la pauta de suplementos (#65), el catálogo (#62) y el stock/almacén (#42) en un flujo de "suplementación del paciente"

**Relacionado con:** #62 (catálogo de suplementos con marca/dosis/posología), #42 (stock/almacén), #54 (cumplimiento en seguimiento)
**Prioridad:** Media-Alta (flujo habitual en consulta — la suplementación es parte de la pauta y hoy hay que darla por fuera de la app)
**Complejidad:** Media (alta si se incluye el calendario de predicción + avisos)

---

## 66. Etiquetas de tipo de dieta en recetas (paleo, keto, FODMAP, vegana…) + filtro avanzado

**Origen:** Alejandra (WhatsApp) — 2 junio 2026

**Estado actual:** Las recetas tienen filtros avanzados (categoría, tiempo de preparación, macros, favoritas, propias vs globales) pero NO tienen etiquetas de tipo de dieta. No se puede filtrar el recetario por "apta para keto" o "baja en FODMAPs".

**Petición:** En los filtros avanzados de recetas, poder seleccionar recetas que sirven para: **dieta paleo, keto, baja en FODMAPs, vegana, vegetariana, para celíacos (sin gluten)**, etc. Una receta puede encajar en varias dietas a la vez (multi-etiqueta).

**Tareas:**
- [ ] Definir el set de etiquetas: paleo, keto, baja en FODMAPs, vegana, vegetariana, sin gluten (celíacos), sin lactosa, mediterránea, antiinflamatoria… (alineado con los tipos de dieta de la generación IA, tarea #3)
- [ ] Añadir campo `etiquetasDieta` (String[] o JSON) al modelo `Receta` — script SQL manual (recordar: el cliente Prisma local no se regenera para `recetas`, usar raw SQL como en migraciones anteriores)
- [ ] UI en el formulario de receta: selector multi-etiqueta (chips)
- [ ] Etiquetar las ~315 recetas globales existentes (semi-automatizable: analizar ingredientes con un script — sin carne ni pescado → vegetariana; sin gluten → celíacos; etc. — con revisión manual)
- [ ] Filtro multi-etiqueta en los filtros avanzados de la lista de recetas y en el buscador del editor de dietas
- [ ] Mostrar las etiquetas como badges en la tarjeta/detalle de la receta
- [ ] Considerar: usar estas etiquetas en la generación IA (si el plan es keto, priorizar recetas etiquetadas keto)

**Archivos a modificar:**
- `scripts/` — migración SQL + script de etiquetado de recetas globales
- `src/app/actions/recetas.ts` — guardar/filtrar etiquetas
- `src/app/(dashboard)/recetas/` — UI de filtros y formulario
- `src/components/dieta/selector-alimento.tsx` — filtro en el buscador del plan

**Relacionado con:** Tarea #3 (combinar tipos de dieta en planes)
**Prioridad:** Media-Alta (mejora directa de la utilidad del recetario global — más fácil encontrar recetas aptas para cada paciente)
**Complejidad:** Media (el grueso es etiquetar bien las 315 recetas globales)

---

### Nota: MotivoClub (marca de suplementos) — posible colaboración B2B

**Origen:** Juan, MotivoClub (+34 694 22 92 43, WhatsApp) — 2 junio 2026. Marca de suplementos premium certificados. Contactados por Instagram; preguntan "¿ves algún tipo de encaje con la app?".

**Encajes naturales con lo ya planificado:**
- **#62 (catálogo de suplementos)** — sus productos podrían venir precargados en el catálogo (nombre, marca, dosis, posología) para que los nutricionistas los asignen al paciente con un clic
- **#65 (pautar suplementos en el plan)** — el nutricionista pautaría productos MotivoClub directamente en el plan, con el momento de toma
- **#42 (almacén/ventas en clínica)** — clínicas que venden suplementación podrían tener MotivoClub como proveedor en el módulo de pedidos
- Posible modelo: afiliación/comisión por recomendación, catálogo patrocinado, o descuento para usuarios de Annonia.

**Modelo propuesto a Juan (Guillermo, 2 jun 2026):**
1. **Afiliación** (vía rápida — MotivoClub ya trabaja con afiliación): catálogo de MotivoClub dentro de Annonia → el nutricionista asigna el suplemento en un clic en la pauta → el paciente compra con el código de afiliado del nutri (impreso en la pauta) o con su link de afiliado con el descuento ya incluido → **paciente: 10% de descuento; nutricionista: comisión por cada compra**
2. **Venta en consulta**: MotivoClub como proveedor en el futuro módulo de stock/pedidos (#42) — pedido directo desde la app o contacto directo, según cómo trabajen la venta a clínicas

**Reparto CERRADO por Juan (8 jun 2026):** **10% descuento al cliente + 20% comisión al nutri + 5% de plataforma para Annonia** por cada venta. No pueden dar más a Annonia por margen (ya hacen 10%+20%). Ellos gestionan toda la atención al afiliado. Annonia aceptó el 5% por su parte. Activación: cuando esté montada la infraestructura en la app (se les avisará). Pendiente: que MotivoClub diga **qué necesitan exactamente de Annonia y cómo funcionan sus enlaces/códigos de referido** (se les preguntó el 8 jun).

**Implicación técnica para Annonia (esto es lo programable):** el catálogo de suplementos (#62) y la pauta de suplementos en el plan (#65) necesitarán soporte de afiliación: **código de afiliado por nutricionista (por marca), link de afiliado por producto, que el código/link aparezca en la pauta (PDF + portal del paciente)**, y registrar el 5% de plataforma. Es lo que hay que tener listo antes de activar el acuerdo.

**Detalle operativo confirmado por Juan (audio, 3 jun 2026):**
- Reunión: **semana que viene** (esta semana MotivoClub está fuera)
- **Alta de afiliados individual**: cada nutri necesita su código específico → alta uno a uno. Datos a enviar a MotivoClub: **nombre, apellidos, email, teléfono**
- Cada nutri afiliado tiene **portal propio de MotivoClub**: ve ventas, comisiones acumuladas, cobra, y tiene material de promoción
- **Venta en clínica**: catálogo + contacto de MotivoClub dentro de Annonia, con condiciones especiales "por venir de Annonia". El trato con cada clínica (stock, volumen, urgencias de suministro, acuerdos) lo lleva **MotivoClub directamente**

**Cómo enfocarlo en Annonia (decisión Guillermo, 3 jun 2026):**
- **Opt-in, NO a todos**: sección tipo "Colaboradores / marcas partner" donde el nutri que quiera se apunta. No contactar a todos los nutris. (RGPD: pasar datos a un tercero exige consentimiento explícito → el opt-in es obligatorio, no opcional)
- **PENDIENTE CLAVE — ¿qué gana Annonia?** Hoy el modelo solo beneficia a la marca (vende) y al nutri (comisión); Annonia aporta la red gratis. Hay que negociar una **comisión de plataforma (override)**: que MotivoClub pague a Annonia un % de cada venta generada por sus nutris, además del descuento al cliente (10%) y la comisión al nutri. Es el estándar de las redes de afiliación.
- **Referencia de mercado**: modelo **Fullscript / Wellevate** (EE.UU.) — plataformas de dispensación de suplementos integradas en software de nutrición; el profesional recomienda y gana margen, la plataforma se lleva un override. Annonia puede ser "el Fullscript español" integrando varias marcas.
- **No atarse a exclusividad** con MotivoClub: dejar la puerta a sumar más marcas = más valor para los nutris y más ingreso para Annonia.
- A futuro: integración/API para no dar de alta a mano; que el form del nutri se envíe solo.

---

## 67. Especificar la patología concreta al elegir "Patología" como objetivo principal

**Origen:** María (WhatsApp) — 2 junio 2026

**Estado actual:** El objetivo del paciente es un enum fijo `ObjetivoPaciente` (`prisma/schema.prisma:122`): PERDER_PESO, GANAR_MASA, MANTENIMIENTO, PATOLOGIA, DEPORTIVO, OTRO. Existe `objetivoDetalle` (String?) como texto libre, y en la anamnesis (pestaña Información → "Objetivos clínicos") aparece un textarea de detalle al seleccionar una opción. Pero al elegir "Patología" como objetivo, **no hay un selector ni campo evidente para indicar cuál es la patología** (ej: resistencia a la insulina) — el detalle en texto libre no es visible/obvio en todos los puntos donde se elige el objetivo, y no hay lista de patologías comunes.

**Petición:** María dice: "En objetivos principales / patología no hay opción de agregar la patología, por ejemplo resistencia a la insulina. Creo que ayudaría."

**Tareas:**
- [ ] Al seleccionar "Patología" como objetivo (alta/edición de paciente y donde se edite el objetivo): mostrar campo adicional "¿Qué patología?" de forma clara
- [ ] Selector con patologías comunes en consulta de nutrición: resistencia a la insulina, diabetes tipo 2, SOP, hipotiroidismo, hipertensión, dislipemia, hiperuricemia, SIBO, celiaquía, hígado graso… + opción de texto libre
- [ ] Guardar en `objetivoDetalle` (ya existe en el modelo) o en campo estructurado nuevo
- [ ] Mostrar la patología junto al objetivo en la ficha, lista de pacientes y entregables ("Objetivo: Patología — Resistencia a la insulina")
- [ ] Sincronizar/sugerir desde las patologías ya registradas en el historial médico de la anamnesis (si tiene "resistencia a la insulina" en patologías, ofrecerla al elegir objetivo Patología)
- [ ] Revisar el mismo gap en el modal "Definir objetivo" del sidebar (relacionado con tarea #60)

**Relacionado con:** Tarea #60 (modal definir objetivo) y #56 (recomendaciones predefinidas por patología — la patología estructurada permitiría sugerir la plantilla de recomendaciones automáticamente)
**Prioridad:** Media-Alta (dato clínico central — el objetivo "Patología" sin especificar cuál es poco útil)
**Complejidad:** Baja-Media

---

## 68. Duplicar receta de la app como receta propia editable

**Origen:** nutricionista por WhatsApp (sin identificar) — 2 junio 2026; nutricionista (email) — 8 jun 2026 ("permitir editar las recetas que ya vienen por defecto en la app, para adaptarlas, sustituir u omitir ingredientes según cada paciente, sin tener que crear una desde cero"); Carmen Florensa (review en PDF, 23 jun 2026 — "¿el nutricionista puede validar o añadir notas personalizadas dentro de una receta estándar de la app para adaptarla a su paciente?"); **Lara (WhatsApp, 9 jul 2026)** — 4ª solicitante, ejemplo textual: "porridge de avena y manzana: el nombre se puede cambiar, pero no puedo cambiar la manzana por arándanos sin crear la receta desde cero"; **nutri +34 727 77 19 93 (14 jul 2026)** — 5ª solicitante, cita expresa a **Nutrium** ("como se hace en Nutrium"): duplicar "ensalada de judías verdes con patata" y cambiar la patata de 150 g a 350 g para un cliente concreto.

**Estado actual (verificado en código, 9 jul 2026):** Las recetas globales ("de la app", `dietistaId = null`, 316 precargadas) son de **solo lectura** para el nutricionista: solo se pueden marcar como favoritas. Detalle técnico:
- `src/app/(dashboard)/recetas/[id]/page.tsx`: si `receta.esGlobal` se muestra `<FavoritoButton>` (no hay Editar); si `!receta.esGlobal` se muestran el enlace a `/recetas/[id]/editar` (icono Pencil) y `<RecetaActions>` (eliminar).
- `src/app/actions/recetas.ts` → `actualizarReceta` y `eliminarReceta` filtran por `where: { id, dietistaId: dietista.id }` → **imposible tocar una global**. **NO existe** ninguna acción `duplicarReceta`/`clonar`.
- Resultado: para tener "su versión" de una receta del sistema con otros ingredientes (p. ej. arándanos en vez de manzana en un porridge), hoy hay que crearla entera desde cero. Lo que el nutri SÍ puede hacer al usar la receta en un plan es cambiar el nº de raciones/porciones (escala los ingredientes), pero no sustituir un ingrediente.

**Solución a implementar — botón "Duplicar y editar":** en la ficha de la receta (empezando por las globales), un botón que **clona la receta como receta propia del nutricionista** (mismos ingredientes, textos y tiempo) y la abre en el editor, donde ya puede cambiar/quitar/añadir ingredientes. La receta global original queda intacta y disponible para el resto.

**Tareas (accionables, sin necesitar más contexto):**
- [ ] **Server action `duplicarReceta(recetaId: string)`** en `src/app/actions/recetas.ts`:
  1. `getCurrentDietista()`; si `dietista.isDemo` → `return` (patrón del resto del archivo).
  2. Leer la receta origen con sus ingredientes: `prisma.receta.findUnique({ where: { id: recetaId }, include: { ingredientes: true } })`. Vale cualquier receta visible (global, propia o compartida del centro).
  3. Crear la copia **igual que `crearReceta`** (recetas.ts:189): `prisma.receta.create({ data: { dietista: { connect: { id: dietista.id } }, nombre: \`${origen.nombre} (copia)\`, nombreNormalizado: normalizarParaBusqueda(...), descripcion, instrucciones, porciones, ingredientes: { create: origen.ingredientes.map(i => ({ alimentoId: i.alimentoId, cantidad: i.cantidad, unidad: i.unidad })) } } })`.
  4. `await setTiempoPreparacion(nuevo.id, origen.tiempoPreparacion)` y `await recalcularMacrosReceta(nuevo.id)` — recalcula macros y micros desde los ingredientes, así que **NO hay que copiar a mano los ~30 campos de micros**.
  5. `revalidatePath("/recetas")` y `redirect(\`/recetas/${nuevo.id}/editar\`)`.
  6. Nota: **no hace falta raw SQL** — el modelo `Receta` está en el schema/cliente generado; usar `prisma.receta.create` como `crearReceta`.
- [ ] **Botón en la UI**: nuevo componente cliente `src/app/(dashboard)/recetas/[id]/duplicar-button.tsx` (patrón de `favorito-button.tsx`/`receta-actions.tsx`: `"use client"`, estado de carga, `toast`). En `recetas/[id]/page.tsx` colocarlo en el bloque `receta.esGlobal` (junto a `<FavoritoButton>`).
- [ ] **i18n** (namespace `recipes`, en `src/messages/es/*.json` y `pt/*.json`): claves `detail.duplicar` ("Duplicar y editar"), `detail.duplicando`, `detail.errorDuplicar`. Verificar que existen en es **y** pt (bug recurrente de clave cruda si falta una).
- [ ] Mostrar el botón **también en recetas propias** (variantes por paciente): sacarlo fuera del `if esGlobal`. Barato y útil.
- [ ] Opcional (NO hacer si complica): guardar el origen ("basada en <nombre>") — requeriría un campo nuevo en el modelo; no es necesario para la petición.

**Archivos a tocar:** `src/app/actions/recetas.ts` (nueva action), `src/app/(dashboard)/recetas/[id]/page.tsx` (colocar el botón), nuevo `src/app/(dashboard)/recetas/[id]/duplicar-button.tsx`, `src/messages/es|pt/<recipes>.json`.

**Relacionado con:** Tarea #22 (ajustar ingredientes de una receta directamente en el plan — cubre "solo para este plan"; esta #68 cubre "mi versión permanente en mi biblioteca"). Se complementan.
**Prioridad:** Media-Alta — **4 solicitantes** (ver Origen); desbloquea personalizar el catálogo global de 316 recetas sin empezar de cero.
**Complejidad:** Baja-Media (una action de copia + un botón + i18n; sin cambios de modelo).
**Estado:** anotada, pendiente. ⚠️ NO implementar hasta que Guillermo lo indique expresamente (9 jul 2026).

---

## 69. Exclusiones automáticas por patología, alérgeno y tipo de cocinado ("Situaciones de Interés Nutricional")

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 2 junio 2026. Basado en el software que usa con su compañero: **Dietowin 11** (software de dietética de escritorio para Windows, clásico en consultas españolas). Vídeo demo oficial: https://www.youtube.com/watch?v=N5-4SQ0BN2I — capturas guardadas en el chat de Instagram. Dietowin es fuerte en lo clínico (exclusiones, objetivos, informes) pero anticuado (escritorio, sin web/portal del paciente) — referencia de competencia muy útil.

**Estado actual:** El paciente tiene alergias/intolerancias/alimentos a evitar como texto, y la IA las tiene en cuenta en el prompt. Pero NO existe un sistema estructurado donde alimentos y recetas estén marcados como contraindicados para patologías concretas, ni exclusión automática al montar la pauta.

**Petición (transcripción del audio):** "En la base de datos tengo metidas un montón de patologías. Dentro de todas las composiciones de alimentos y de todas las recetas son exclusiones. Si yo tengo un paciente diabético, todas las recetas que son dulces o con harinas procesadas las marco 'diabetes' y se eliminan automáticamente de la pauta que le voy a preparar. Lo mismo con cualquier patología: ácido úrico, Crohn, colitis… en función del tipo de cáncer, el efecto secundario que tengan. O si es vegano, todas las recetas y alimentos que no pueda comer van fuera. Así infinito — eso sí que lleva mucho curro."

**Cómo funciona en su software (capturas):**
- Cada alimento/receta tiene marcadas las **"Situaciones de Interés Nutricional"** en las que se excluye
- Al asignar la(s) patología(s) al paciente, el catálogo disponible para su pauta se filtra automáticamente
- Leyenda visual: "En uso / Excluido / **Excluido por referencia**" (si un ingrediente está excluido, las recetas que lo contienen quedan excluidas en cascada)
- **Niveles de exclusión** (pantalla "Condiciones Dieta"): por FAMILIA de alimentos, por ALÉRGENO, por INGREDIENTE, por TIPOLOGÍA de cocinado, por RECETA concreta, por NUTRIENTE
- **Alérgenos** (los 14 UE): altramuces, apio, cacahuete, crustáceos, frutos secos, gluten, huevo, lácteo, legumbre(*), moluscos, mostaza, nueces, pescado, sésamo, soja, sulfitos
- **Tipologías de cocinado** excluibles: asado, brasa, rebozado, fritos, gratinado, guisado, hervidos, horno, parrilla, plancha, vapor, vegetariano, "no niños", japonés, curry, disociada, féculas, lácteo…
- **Catálogo de patologías de referencia** (~50): acné seborreico, aerofagia/gastropatía, alcoholismo, anemias (ferropénica, por carencia de B12/ácido fólico/cobre), aterosclerosis, cardiopatías, cefaleas, celiaquía, cetosis acetonémica, cistitis-uretritis, colecistitis/insuficiencia biliar, colelitiasis, colitis ulcerosa, colon irritable, diabetes mellitus I y II, diarrea intestinal, dislipemias (IIA, IIB, IV), divertículos esofágicos, diverticulosis, embarazo, enteritis, esofagitis por reflujo, estreñimiento, FODMAPs, gastropatía por reflujo biliar, hemorroides, hepatopatía crónica, hernia de hiato, hipertensión arterial, hipertiroidismo, hiperuricemia-gota, hipoparatiroidismo, hipopotasemia, hipotensión, hipotiroidismo, insuficiencia renal (sobrepeso / diálisis), intolerancias (glucosa, leche, gluten), lactancia materna…
- **Todo ampliable por cada nutricionista** (puede crear sus propias situaciones y marcar sus exclusiones)

**Extra (restauración colectiva):** "Carta de alérgenos y las recetas que los contengan — importante para nutris que trabajan en restauración colectiva." → Poder generar la carta de alérgenos a partir de las recetas.

**Tareas:**
- [ ] Modelo de "situación nutricional" (patología/condición): catálogo global predefinido (~50 de referencia) + personalizadas por dietista
- [ ] Marcar alimentos y recetas con las situaciones en las que se excluyen (relación many-to-many)
- [ ] Marcado de alérgenos (14 UE) por alimento; herencia automática a recetas vía ingredientes ("excluido por referencia")
- [ ] Asignar situaciones al paciente (desde patologías de la anamnesis, relacionado con #67)
- [ ] Al montar la pauta (manual, IA o algorítmica #49): filtrar/avisar de alimentos y recetas excluidos para ese paciente
- [ ] Exclusión por tipología de cocinado (fritos, rebozados…) y por familia de alimentos
- [ ] Carta de alérgenos imprimible a partir de recetas (restauración colectiva)
- [ ] Empezar simple: etiquetar las 315 recetas globales con las exclusiones más comunes (diabetes, hiperuricemia, celiaquía, FODMAP, vegano…) — solapa con el etiquetado de la tarea #66

**Reforzado (reunión con universidad, vía Guillermo — 7 jul 2026):** matiz sobre intolerancias/alérgenos aplicado también al **buscador de alimentos** (no solo al montar la pauta): si el paciente es, p. ej., **intolerante a la lactosa**, que los alimentos con lactosa **no aparezcan** en la búsqueda, o —mejor— que aparezcan con un **aviso visual (icono de exclamación ⚠️)** en vez de desaparecer del todo, y que el nutri decida si es exclusión dura o solo advertencia. Es el mismo marcado de alérgenos (14 UE) de esta tarea, llevado a la búsqueda/selección de alimentos.

**Relacionado con:** #66 (etiquetas de dieta en recetas), #67 (patología del paciente), #56 (recomendaciones por patología), #49 (generación algorítmica), #44 (calidad de la IA)
**Prioridad:** Alta (diferenciador clínico potente — es EL sistema que hace útil su software de escritorio; "eso sí que lleva mucho curro" pero el valor es enorme)
**Complejidad:** Alta (modelo + etiquetado masivo + integración en todos los flujos de creación de pauta)

---

## 70. Plan de objetivos con proyección temporal (peso/grasa objetivo + evolución estimada)

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 2 junio 2026 (captura de su software)

**Estado actual:** Existe el objetivo del paciente (enum + texto), objetivos numéricos sueltos en el sidebar (tarea #60, con bugs de labels), y la pestaña Planificación calcula gasto y macros. Pero NO hay un "plan de objetivos" integrado que proyecte la evolución en el tiempo.

**Petición:** "Tengo una pestaña de objetivos: si la persona me dice que quiere bajar 5 kilos en 5 meses, yo le marco objetivo de reducir tanto peso y tanta grasa, con su metabolismo basal y los METs de consumo deportivo, y me calcula la restricción que debería hacerle."

**Cómo lo hace su software (captura "Plan de Objetivos"):**
- **Objetivo de peso** sobre una barra visual con rangos clasificados (bajo peso / normopeso / sobrepeso I / II / obesidad I…) — se ve dónde está y a dónde va
- **Objetivo de % masa grasa** con la misma barra (bajo / saludable / alto / obesidad)
- **Estado actual vs objetivo, lado a lado**: peso, masa grasa (kg y %), masa libre de grasa, agua corporal total, estado por IMC, estado por %MG, y **metabolismo basal actual vs MB en el objetivo** (ej: 1.736 → 1.478 kcal)
- **Plan**: pérdida por semana configurable (ej: 800 g/semana) + número de semanas → **evolución estimada semana a semana** (85,2 → 84,4 → 83,6 → 82,8 kg)
- Con eso **calcula la restricción calórica** que hay que aplicar (integrando MB + METs de la actividad deportiva)

**Tareas:**
- [ ] Vista "Plan de objetivos" en la ficha del paciente (o dentro de Planificación): peso objetivo + % grasa objetivo con clasificación visual por rangos
- [ ] Comparativa estado actual vs objetivo (usar las medidas ya registradas: peso, % grasa, masa muscular, agua…)
- [ ] Configurar ritmo (g/semana o kg/mes) y/o fecha objetivo → calcular el otro automáticamente
- [ ] Tabla/gráfica de evolución estimada semana a semana, superpuesta con la evolución REAL de las mediciones (objetivo vs realidad)
- [ ] Calcular la restricción calórica derivada (kcal/día) y ofrecer "Aplicar a Planificación" (enlaza con tarea #9)
- [ ] Recalcular el MB estimado en el peso objetivo
- [ ] Aviso si el ritmo configurado es poco saludable (>1% peso/semana, por ejemplo)
- [ ] **Contador / cuenta atrás de objetivos en el dashboard (opcional)** (Guillermo, 4 jun 2026) — si un objetivo tiene fecha límite, mostrar en el dashboard un contador del tipo "quedan X días/semanas para la fecha objetivo". Opcional (solo si el objetivo tiene fecha)

**Relacionado con:** #9 (aplicar macros al plan), #60 (objetivos del sidebar), #67 (patología/objetivo), #29 (composición corporal)
**Prioridad:** Alta (cierra el círculo: objetivo → cálculo → pauta → seguimiento; muy visual para motivar al paciente)
**Complejidad:** Media

---

## 71. Módulo de farmacología: interacciones fármaco-alimento en la pauta

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 2 junio 2026; José (WhatsApp) — 9 junio 2026 (preguntas concretas de un profesional riguroso, ver abajo); Joana (joananutrilim, Instagram) — 12 junio 2026 ("la warfarina no se debe mezclar con pomelo… poner un campo de medicación creo que es esencial"; trabaja patología digestiva y fertilidad — demanda repetida por tres profesionales).

**Estado actual (VERIFICADO en código, 9 jun 2026):** Los medicamentos del paciente se registran como lista de texto en la anamnesis (`string[]`, ver tarea #62). No hay base de datos de fármacos ni detección de interacciones. Y confirmado: **la IA NO recibe la medicación del paciente** al generar la dieta — el prompt (`src/lib/ai/prompts.ts`) solo recibe objetivo, alergias, intolerancias, patologías, preferencias e instrucciones del nutri; la medicación no se pasa. Así que hoy la IA no tiene en cuenta los fármacos (salvo que el nutri lo escriba a mano en instrucciones).

**Preguntas de José (9 jun 2026) — definen bien el alcance deseado:**
1. ¿La IA tiene en cuenta la medicación al generar la dieta? → HOY NO (verificado).
2. ¿Annonia detecta/avisa interacciones **alimento-medicamento**? → No, aún no (es este módulo).
3. ¿Y interacciones **suplemento-medicamento**? → Tampoco; añadir suplementos al alcance del módulo (enlaza con #62/#65).
4. ¿En qué **fuentes** se basarían las alertas? Él sugiere: **fichas técnicas (AEMPS/CIMA), BOT PLUS, CIM**. → Documentar la fuente de cada interacción y mostrarla; usar fuentes oficiales/farmacéuticas fiables (CIMA-AEMPS, BOT PLUS del CGCOF, etc.). La calidad y trazabilidad de la fuente es clave para que un profesional confíe.

**Estado actual:** Los medicamentos del paciente se registran como lista de texto en la anamnesis (`string[]`, ver tarea #62). No hay base de datos de fármacos ni detección de interacciones con alimentos.

**Petición (transcripción del audio):** "Otro módulo que yo metería, que yo estoy en ello: un modo de farmacología. Metería todos los medicamentos que haya con las posibles interacciones que puedan tener, sobre todo a nivel nutricional. Por ejemplo, casi todas las medicaciones interaccionan con el pomelo. Como se van a marcar en el listado de medicación, yo lo que estoy haciendo es configurar la IA para que me detecte los fármacos que yo escribo, y así si hay alguna posible interacción dentro de la pauta me la marque con un color más llamativo."

**Concepto:**
1. Base de datos de fármacos comunes con sus interacciones alimento-fármaco relevantes (pomelo, vitamina K/anticoagulantes, lácteos/tetraciclinas, tiramina/IMAOs, alcohol, regaliz, hipérico…)
2. Al registrar la medicación del paciente (idealmente estructurada, tarea #62), detectar los fármacos (texto libre → IA/matching)
3. Al montar o revisar la pauta: si un alimento del plan interacciona con su medicación → **resaltado visual llamativo** + explicación de la interacción
4. Aviso también en la generación con IA (pasar las interacciones como restricción al prompt)

**Tareas:**
- [ ] Investigar fuente de datos de interacciones fármaco-nutriente (AEMPS/CIMA, bases públicas, bibliografía) — calidad clínica crítica. José sugiere fichas técnicas (CIMA-AEMPS), **BOT PLUS** (CGCOF) y CIM. **Mostrar la fuente de cada alerta** (trazabilidad) para que el profesional confíe
- [ ] Modelo `Farmaco` (nombre, principio activo, interacciones: alimento/grupo + severidad + descripción + fuente)
- [ ] Matching de la medicación del paciente (texto libre) contra la BD de fármacos — IA o fuzzy matching
- [ ] **Paso rápido y previo: pasar la medicación del paciente al prompt de la IA** como contexto/restricción (hoy no se pasa). Aunque no haya BD de interacciones aún, que la IA al menos la conozca al generar la dieta
- [ ] Contemplar también interacciones **suplemento-medicamento** (no solo alimento-fármaco) — enlaza con el catálogo de suplementos (#62) y la pauta (#65)
- [ ] Resaltar en el editor del plan los alimentos con interacción para ese paciente (color llamativo + tooltip explicativo)
- [ ] Incluir aviso en el PDF/portal (opcional, configurable)
- [ ] Integrar como restricción en la generación IA y algorítmica
- [ ] Disclaimer clínico: es una ayuda, no sustituye la revisión profesional

**Relacionado con:** #62 (medicación estructurada), #69 (exclusiones), #25 (disclaimer IA)
**Prioridad:** Media-Alta (seguridad clínica + diferenciador fuerte; Ainara lo está montando por su cuenta — demanda real)
**Complejidad:** Alta (el reto es la calidad de la base de datos de interacciones)

---

### Nota: estrategia de pricing modular + posible expansión a fisioterapia (Ainara, 2 jun 2026)

**Pricing por módulos ("mentalidad tiburón"):** Ainara recomienda NO sacar todas las funcionalidades con la misma tarifa. Sobre los dos planes que vio (básico y profesional), metería **módulos de pago**: por ejemplo, una versión reducida del módulo digestivo incluida, y los nutricionistas clínicos que quieran ampliarla pagan la extensión. Lo mismo con farmacología (#71) o deportiva. Criterio: que sean de pago "las cosas que más curro llevan a nivel de programación". → Decisión de negocio para Guillermo; encaja con las futuras #69/#70/#71 como candidatos a módulos premium.

**Fisioterapia como segundo mercado:** Su compañero es fisioterapeuta. Las bases de datos/software de fisioterapia son "supercomplicadas para gente a la que no le gusta la informática" (a él le hizo un Excel simple para historiales médicos). Sugiere que a futuro se podría hacer un módulo de consulta u otro programa extrapolando Annonia a fisioterapia. → Idea de expansión a largo plazo; el sistema de fichas/anamnesis/citas/pagos ya cubriría gran parte.

**Vídeo de referencia del software que usan:** https://www.youtube.com/watch?v=N5-4SQ0BN2I — demo oficial de **Dietowin 11.0**, el programa de las capturas (exclusiones, objetivos, asistente de dieta, informes). Analizar Dietowin como referencia de competencia clínica.

---

### Nota: entrenutris (influencers de nutrición, Instagram) — lead + caso de uso club deportivo

**Origen:** entrenutris (Instagram, parecen argentinos) — 2 junio 2026. Influencers de nutrición contactados por Guillermo. Interesados pero con la agenda liada: la nutri del equipo que iba a probar la app está de viaje y vuelve a **mitad de junio** (agendado para entonces — hacer seguimiento si no contactan).

**Caso de uso que plantean:** uno de ellos trabaja en un **club deportivo** y quiere probar si la app "funciona bien en grupos, en equipos y demás". → Uso de Annonia para **equipos deportivos**: gestionar muchos deportistas a la vez, posiblemente con planes compartidos por grupo, vista de equipo, etc. Aún sin petición concreta — recoger qué echan en falta cuando lo prueben. Relacionado con #39 (cuenta profesor: asignación a grupos) por la mecánica de grupos.

**Seguimiento (19 jun 2026):** entrenutris ya probó la app (se dio de alta, creó paciente de prueba). Confirma el plan de **cargar pacientes/jugadores del club** y que lo usarían **las nutris del equipo** con sus pacientes; primero quiere meter a **algunos usuarios de su red** para probar. Pidió pasar la conversación a **WhatsApp** (Instagram no avisa de mensajes y se le mezclan) — se le pasó el WhatsApp del equipo. Feedback concreto: (a) no encontró cómo **generar el plato/plan con IA** → descubribilidad (la generación IA está dentro de un plan); (b) **terminología regional de los alimentos** (Argentina): "plátano→banana", "aguacate→palta" — pide que se adapten **automáticamente por país** al entregar el plan, no a mano ("como el idioma"). Ver #95 (nombres locales de alimentos por país) y #1 (tablas regionales LatAm). Lead caliente de **club deportivo** (LatAm).

---

## 72. Link a receta de Instagram/TikTok en las recetas

**Origen:** nutredesdeelalma (Instagram) — 2 junio 2026

**Estado actual:** Las recetas tienen nombre, ingredientes, instrucciones, macros y tiempo de preparación. No hay campo para enlazar a una receta publicada en redes sociales.

**Petición:** Opción de añadir un link en la receta, para quien tenga Instagram o TikTok y suba recetas allí — poder enlazar el vídeo/post de la receta desde la ficha de la receta en Annonia.

**Tareas:**
- [ ] Añadir campo `enlaceExterno` (String?, URL) al modelo `Receta` — script SQL manual (el cliente Prisma local no se regenera para `recetas`, usar raw SQL)
- [ ] Validar que sea una URL (idealmente reconocer Instagram/TikTok/YouTube y mostrar icono)
- [ ] UI en el formulario de receta: campo "Enlace a la receta (Instagram, TikTok, YouTube...)"
- [ ] Mostrar el enlace como botón/icono en la ficha de la receta y, si aplica, en el portal del paciente y el PDF
- [ ] Considerar embed/preview del vídeo en la ficha (opcional)

**Relacionado con:** #38 (foto del plato en recetas — también lo pide esta misma nutri)
**Prioridad:** Media
**Complejidad:** Baja

---

## 73. Enriquecer el catálogo de recetas globales (más recetas + pasos completos + fotos)

**Origen:** nutricionista (WhatsApp) — 3 junio 2026

**Estado actual (verificado en código, 3 jun 2026):**
- **Recetas globales: SÍ existen, son 316** precargadas (`scripts/data/recetas-seed.ts` + `scripts/seed-recetas-app.ts`). Lo de "que las recetas vengan al entrar, como los alimentos" YA ESTÁ.
- **Pasos de elaboración: casi ninguna los trae** — en el seed el campo `instrucciones` está prácticamente vacío (solo nombre, ingredientes, porciones y tiempo) → las recetas se ven simples y sin preparación.
- **Fotos: solo en alimentos, NO en recetas.** El modelo `Alimento` tiene `imagenUrl`; el modelo `Receta` NO tiene ningún campo de imagen → poner foto a las recetas es la tarea #38 (aún pendiente).

**Petición:** "Faltan alimentos y recetas; las recetas que hay son muy simples y quizás no tienen todos los pasos. Las fotografías de cada receta ayudan a que los menús sean mucho más agradables." (Reconoce que es normal por estar empezando.)

**Tareas:**
- [ ] **Pasos de elaboración completos** — Rellenar el campo `instrucciones` de las recetas globales con la preparación paso a paso (hoy está casi siempre vacío). Revisar/enriquecer las recetas seed existentes
- [ ] **Más recetas** — Ampliar el catálogo global (y seguir sumando alimentos a la base)
- [ ] **Foto por receta** — Ver tarea #38 (foto del plato en recetas): clave para que los menús/PDF sean más atractivos y mejoren la adherencia
- [ ] Considerar generar/completar instrucciones de las recetas existentes con IA y revisión manual

**Relacionado con:** #38 (foto del plato), #66 (etiquetas de dieta en recetas), #44 (faltan alimentos para la IA)
**Prioridad:** Media-Alta (calidad del contenido — afecta a la percepción de la app y a la utilidad del recetario)
**Complejidad:** Media (el grueso es el trabajo de contenido: escribir pasos y añadir fotos a cientos de recetas)

---

## 75. Agrupar/vincular días del plan para editar en bloque

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026

**Estado actual:** Cada día del plan se edita por separado. Para cambiar algo que se repite en varios días (ej: el mismo desayuno de lunes a viernes) hay que editar día por día. La tarea #31 cubre copiar/mover una comida a otro día, pero no editar varios días a la vez de forma vinculada.

**Petición:** Poder **agrupar varios días** y hacer un cambio una sola vez que se aplique a todos los días del grupo (ej: agrupar L-M-X-J-V y editar el desayuno una vez → se actualiza en los cinco). Acelera mucho el montaje de planes con días repetidos.

**Tareas:**
- [ ] UI para seleccionar/agrupar días en el editor de dietas
- [ ] Al editar una comida de un día agrupado, aplicar el cambio a todos los días del grupo
- [ ] Decidir modelo: ¿días "vinculados" de forma persistente (un cambio futuro también se propaga) o agrupación puntual para una edición concreta? (aclarar con Guillermo al implementar)
- [ ] Visual claro de qué días están agrupados

**Relacionado con:** #31 (copiar/mover comidas entre días), #5 (planes por opciones)
**Prioridad:** Alta (flujo principal de creación de planes)
**Complejidad:** Media

---

## 76. Acceso a lista de la compra y enlace compartido desde Entregables

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026; Guillermo (nota) — 15 junio 2026 (matiz "sin link" + meterlo dentro de la propia ficha del paciente).

**Estado actual (verificado en código):** Hoy **"compartir" = generar un enlace público con token** (`/compartido/{token}`, que se copia al portapapeles desde `copyUrl`) y **solo vive dentro del editor de dieta** (`/dietas/[id]/compartir`, panel `compartir-panel.tsx`; también en la action-bar móvil de la dieta). La pestaña **Entregables** de la ficha del paciente ya tiene un toggle `listaCompra` para incluir la lista en el PDF, pero **no** ofrece compartir el enlace ni entregar la lista de la compra de forma independiente. El paciente, por su lado, sí ve su lista de la compra en el portal (`/paciente/portal/dieta/lista-compra`). Resumen: la única vía de "compartir/entregar" desde el lado del nutri es el **enlace público**, y está escondida dentro de la dieta.

**Petición:** Mirar **dónde colocar** el acceso a compartir (lista de la compra, plan, etc.), que ahora solo está dentro de la dieta, para que sea más accesible. Dos ideas:
1. **Meterlo dentro de la propia ficha del paciente** (pestaña Entregables o sección propia), no solo en el editor de dieta — centralizar todo lo que se entrega al paciente en un mismo sitio.
2. **"Sin link"** (matiz Guillermo, 15 jun): poder compartir/entregar la lista de la compra **sin depender de generar un enlace público con token** — p. ej. descarga/entrega directa desde la ficha del paciente, o aprovechar que el paciente ya la tiene en su portal. Hoy todo compartir obliga a crear y copiar un link; valorar una vía más directa. *(Concretar el alcance exacto del "sin link" al diseñarlo.)*

**Tareas:**
- [ ] Añadir en la pestaña Entregables (o en una sección visible de la ficha del paciente) el botón/acceso para generar y copiar el enlace compartido del plan (reutilizar lo de `/dietas/[id]/compartir`)
- [ ] Permitir compartir/**descargar** la lista de la compra de forma independiente desde Entregables — vía **sin link** (descarga directa / PDF), además del enlace público
- [ ] Decidir el sitio definitivo del acceso a "compartir" para que no quede escondido solo dentro de la dieta
- [ ] Mantener la coherencia con lo que ya existe en el editor de dieta y con la lista del portal del paciente

**Archivos:** `src/components/paciente/entregables-tab.tsx`, `src/components/paciente/shopping-list.tsx`, `src/app/(dashboard)/dietas/[id]/compartir/` (`compartir-panel.tsx`)
**Prioridad:** Media
**Complejidad:** Baja

---

## 77. Resumen con IA del seguimiento del paciente (día / semana / mes)

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026

**Estado actual:** El seguimiento del paciente (registros diarios, revisiones, mediciones) se ve en datos sueltos. No hay un resumen automático que sintetice cómo ha ido un periodo.

**Petición:** Que la IA pueda **resumir el día, la semana o el mes** del paciente (adherencia, peso, ejercicio, sensaciones, respuestas de las revisiones...) y mostrarlo **de forma bonita y visual**, para que el nutricionista tenga de un vistazo el estado del paciente antes de la consulta.

**Tareas:**
- [ ] Generar resumen con IA del seguimiento por periodo (día/semana/mes): adherencia, evolución de peso/medidas, ejercicio, saciedad/síntomas, respuestas de revisiones
- [ ] Presentación visual atractiva (tarjetas, gráficas, highlights) — no un muro de texto
- [ ] Disparable manualmente y/o automático antes de cada revisión/cita
- [ ] Cuidar coste/tokens de IA y privacidad de datos del paciente

**Relacionado con:** #50 (revisiones y notas de sesión), #54 (saciedad/síntomas), #2 (analíticas)
**Prioridad:** Media-Alta
**Complejidad:** Media

---

## 78. Objetivos de la planificación que alimentan la dieta + múltiples planificaciones por tipo de día

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026

> ⚠️ **NO confundir con el déficit automático de calorías que se descartó** (esa decisión —ajuste de calorías siempre manual según objetivo del paciente— sigue en pie). Esto es distinto: reutilizar los objetivos YA marcados en la planificación para no escribirlos dos veces.

**🔒 DECISIONES DE DISEÑO CERRADAS (15 jun 2026, Guillermo + nutri por WhatsApp/vídeo):**
- **Planificación por tipo de día = cada planificación ES un tipo de día** ("Día competición", "Día descanso", "Día entreno"…), con sus kcal/macros. Reutiliza el modelo `Planificacion`, que YA admite varias por paciente (pestañas, crear, copiar). Cada día del plan se asigna a una planificación → **los objetivos pasan a ser POR DÍA** (no un único objetivo global del plan). Ese "objetivos por día" es el **CIMIENTO** del que dependen la Parte A, la Parte C y el resumen nuevo.
- **Juntar días (#75) es SEPARADO de esto** (Guillermo, confirmado al ver el vídeo del nutri): son DOS EJES independientes → *objetivos* (planificación por tipo de día) ≠ *menú* (agrupar días con la misma comida). El nutri los confundía bajo la palabra "plan"; en Nutrium van juntos, aquí los separamos (más flexible). En la práctica se agrupan días del mismo tipo, pero no se fuerza.
- **Objetivos al crear la dieta (Parte A): EDITABLES + aviso** "datos de la planificación actual" (NO se bloquean). El "no descuadre" lo garantiza una **validación de coherencia kcal↔macros** (aviso, no bloqueo duro): que P×4 + C×4 + G×9 ≈ kcal (con tolerancia). Hoy NO existe esa validación (se puede guardar 2000 kcal con 500 g de proteína).
- **Orden de trabajo acordado:** (1) CIMIENTO = planificación por tipo de día → objetivos por día + heredar al crear + validación de coherencia; (2) #104 ingestas configurables (nº de comidas, va antes del reparto); (3) Parte C reparto por comida; (4) #75 juntar días; (5) resumen nuevo (el HTML de Guillermo) al final.

> Verificado en código (15 jun): `Planificacion` ya soporta varias por paciente con CRUD y cálculo de kcal/macros (BMR→EER→ajuste→%→gramos, en `planificacion-por-defecto-tab.tsx`); hoy se usan como FASES TEMPORALES (`fechaInicio`/`fechaFin`), no como tipos de día simultáneos. `PlanAlimenticio` guarda objetivos GLOBALES (no por día). Falta: tipo de día asignado a cada `DiaDelPlan`, objetivos por día, y heredar al crear (hoy solo "aplicar a un plan ya existente").

**Input adicional (nutricionista, 3 jul 2026):** al hacer una dieta, "los cálculos de kcal y macros no se volcaron en el plan como para basarme en ellos". Confirma que **heredar los objetivos de la planificación al crear/editar la dieta y verlos como referencia en el editor (Parte A) es lo que más se echa en falta**: hoy el plan usa sus objetivos propios y, si no se asigna una planificación, el análisis del editor muestra valores genéricos. Priorizar que el volcado sea **automático y visible** al crear la dieta (aunque siga siendo editable).

### Parte A — Los objetivos de la planificación se autocompletan al crear la dieta

**Estado actual:** Al crear una planificación, el nutri marca objetivos (kcal, macros…). Pero al crear una dieta nueva (manual o con IA) tiene que volver a indicar los objetivos. Información duplicada.

**Petición:** Que al crear una dieta, los objetivos de la **planificación activa** aparezcan ya rellenos automáticamente, con un aviso tipo **"datos exportados de la planificación actual"**. No cambia el plan actual ni autocalcula nada: solo evita marcar lo mismo dos veces.

**Tareas:**
- [ ] Al abrir "crear dieta" (manual e IA), precargar kcal/macros objetivo desde la planificación activa del paciente
- [ ] Mostrar aviso "Datos exportados de la planificación actual" y permitir editarlos antes de generar
- [ ] (Era el espíritu de la antigua tarea #9 "aplicar a plan" — ahora concretado)
- [ ] **Confirmado por Guillermo (4 jun 2026):** hoy los objetivos de la planificación solo se pueden **aplicar a un plan/dieta YA existente**. Falta poder aplicarlos **al crear una dieta nueva** y **al generar con IA** (que se precarguen los macros objetivo en el formulario de IA)

### Parte B — Varias planificaciones activas a la vez, por tipo de día

**Estado actual:** Las planificaciones son generales/largas (mensuales) y solo hay una activa. No se pueden tener distintas según el tipo de día.

**Petición (lo piden nutris):** Que las planificaciones puedan ser **por tipo de día** en vez de una sola general: ej. "día de descanso", "día de gimnasio", "genérica". Poder **activar varias a la vez** y que cada una tenga sus objetivos. Guillermo reconoce que aún hay que pensar cómo encaja con la Parte A.

**Implicaciones (lo que toca):**
- [ ] Permitir **múltiples planificaciones activas** simultáneas (hoy solo una), etiquetadas por tipo de día (descanso / entreno / genérica / personalizada)
- [ ] **Pestaña de crear dieta**: aceptar varios objetivos a la vez (uno por tipo de día), no uno solo. Asignar qué objetivo aplica a qué día
- [ ] **Generación con IA**: que acepte una dieta con objetivos diferentes según el día (día gym vs día descanso)
- [ ] **Visualización y resúmenes**: al mostrar/resumir, contemplar que en una semana puede haber 2-3 planificaciones distintas, no una sola (diferentes resúmenes por tipo de día). Enlaza con el resumen IA (#77)
- [ ] Pensar bien el modelo: relación tipo-de-día ↔ planificación ↔ días del plan

### Parte C — Reparto de macros POR COMIDA en la planificación (configuración avanzada)

**Origen:** Guillermo (apuntes reunión, 5 jun 2026); Saija (nutricionista, WhatsApp — 11 jun 2026).

**Input de Saija (11 jun 2026):** Al crear el plan solo se piden las calorías (y macros) del DÍA, pero le gustaría **fijar el objetivo por comida** (ej. desayuno = 400 kcal + sus gramos de proteína/grasa/carbohidrato) y **ver en tiempo real, mientras monta el plan, si se va cumpliendo** ese objetivo por comida. VERIFICADO: hoy en el editor se ven los **macros TOTALES de cada comida** (pills en `comida-slot.tsx`) y el **total del día vs objetivo** (panel de análisis), pero NO hay objetivo POR comida ni indicador de cumplimiento por comida. → Sumar a esta tarea: (a) poder definir objetivo de kcal+macros por comida, (b) mostrar el cumplimiento por comida en vivo (ej. "Desayuno 380/400 kcal") mientras se añaden alimentos.

**Estado actual (verificado en código):** La sección "Distribución de macronutrientes" de la planificación reparte los macros **solo a nivel del día** (% y total del día). NO permite repartir por comida. En el editor se muestran los totales por comida pero sin objetivo por comida.

**Petición:** Que la barra de "2000 kcal, ¿cómo distribuirlas?" se pueda **abrir como "configuración avanzada por comida"**: definir el reparto de kcal y de macros **comida a comida**. Ejemplos:
- Día de descanso: desayuno 70% carbo / 20% grasa / 10% proteína; tarde otra distribución…
- O por reparto calórico: "2000 kcal hoy → desayuno 60% de las kcal, comida X%, cena Y%"
- **Ayuda de cálculo**: el nutri pone los % por comida y la app calcula los gramos/kcal de cada comida
- **Tener en cuenta el nº de comidas de ese día** (el reparto se adapta a cuántas comidas haya)
- Se puede definir **por varios días / por tipo de día** (enlaza con Parte B): el lunes esta distribución, etc.
- Luego, ese reparto por comida **ayuda a crear el plan**, recomendando alimentos que cuadren con cada comida (enlaza con #49 generación algorítmica)

**Nota:** esto es exactamente el "reparto de kcal por toma / reparto de proteínas por toma" del asistente de Dietowin que documentó Ainara (#49). Unificar criterio con #49.

**Tareas:**
- [ ] En la planificación, botón "Configuración avanzada por comida" que despliegue el reparto de kcal/macros por comida
- [ ] Calcular gramos/kcal por comida a partir de los % introducidos, según las kcal del día y el nº de comidas
- [ ] Guardar el reparto por comida en la planificación (JSON `datos`)
- [ ] Que al crear la dieta (manual/IA/algorítmica) se respete ese reparto por comida
- [ ] **Recálculo/redistribución al cambiar una comida (DECIDIDO por Guillermo, 5 jun 2026 → "las tres, configurable"):** al cambiar las kcal/macros de una comida:
  - Por defecto, **redistribución proporcional** entre las demás comidas para cuadrar con el total del día
  - Poder **bloquear/fijar** las comidas que el nutri ya tiene como quiere → solo se redistribuye entre las NO bloqueadas
  - **Siempre mostrar el aviso de desvío** respecto al objetivo (ej. "te sobran 200 kcal")
- [ ] **Presets de distribución de macros con nombre (DECIDIDO):** desplegable de distribuciones predefinidas con nombre (ej. 40/30/30 "la Zona", 60/20/20, cetogénica, etc.) que el nutri puede elegir y luego ajustar. (Esto era lo de "nombres de Coto" — se refería a presets de macros con nombre)

**Relacionado con:** #49 (asistente de pauta Dietowin: reparto por toma), #5 (planes por opciones), #9 (aplicar a plan)

**Relacionado con:** #5 (planes por opciones), #77 (resumen IA), #3 (combinar tipos de dieta), antigua #9 (aplicar macros al plan)
**Prioridad:** Alta (Parte A es rápida y muy útil; Parte B es más grande pero pedida por varios)
**Complejidad:** Baja (Parte A) / Alta (Parte B — toca planificación, editor de dieta, IA y visualización)

---

## 79. Preparación legal para presentar Annonia a universidades (checklist anti-preguntas)

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026

**Objetivo:** Tener TODO resuelto y documentado a nivel legal antes de presentar Annonia a universidades/centros de formación, para responder con solvencia a cualquier pregunta de su departamento legal/protección de datos. Es preparación legal + algo de producto (algunos puntos son programables: #51 consentimientos, #39 casos clínicos).

**Checklist de lo que pueden preguntar (y hay que tener listo):**

*Protección de datos (RGPD / LOPDGDD):*
- [ ] **Rol de Annonia**: definir si actúa como **encargado del tratamiento** y tener preparado un **contrato de encargo de tratamiento (DPA)** para firmar con la universidad / el nutricionista responsable
- [ ] **Dónde se alojan los datos**: servidores en la UE (Supabase eu-west-1 / Oracle). Documentarlo
- [ ] **Medidas de seguridad**: cifrado en tránsito (HTTPS) y en reposo, control de accesos, hashing de contraseñas, backups. Tener un resumen técnico presentable
- [ ] **Derechos ARCO/RGPD**: cómo se ejercen acceso, rectificación, supresión, portabilidad de datos
- [ ] **Base legal** del tratamiento (consentimiento) y registro de actividades de tratamiento

*Consentimientos (enlaza con #51):*
- [ ] **Consentimiento informado** del paciente antes de la anamnesis (documentado y firmado)
- [ ] **Consentimiento específico de uso de IA** con los datos — clave para universidades (#51)

*El punto crítico — IA y transferencia internacional:*
- [ ] ⚠️ La generación con IA usa **Groq (servidores en EE.UU.)** → enviar datos de pacientes a la IA es una **transferencia internacional de datos**. Hay que: (a) tenerlo cubierto en el consentimiento de IA, (b) valorar **anonimizar/seudonimizar** los datos antes de mandarlos a la IA, (c) documentar la base legal de la transferencia. Esto es lo primero que preguntará un DPO universitario

*Casos clínicos / docencia (enlaza con #39):*
- [ ] **Usar pacientes FICTICIOS/anonimizados** en los casos clínicos de clase → si no hay datos personales reales, gran parte del problema legal desaparece. Dejarlo claro como recomendación de uso docente
- [ ] **Datos de los estudiantes** (alumnos): tratamiento de sus datos como usuarios de la plataforma
- [ ] **Menores de edad**: política si hay alumnos o pacientes menores

*Comercial/contractual:*
- [ ] Términos de uso y contrato marco para universidades
- [ ] Modelo de licencia/pricing para centros educativos (relacionado con #39)

**Relacionado con:** #39 (cuenta profesor/universidades), #51 (consentimientos y RGPD)
**Prioridad:** Alta (bloqueante para cerrar universidades — sin esto resuelto, un departamento legal puede tumbar el acuerdo)
**Complejidad:** Media (mezcla de documentación legal + algún cambio de producto)

---

## 80. Desglose de macronutrientes (grasas y carbohidratos) en alimentos y análisis

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026; Antonia (nutrivibes.life, Instagram) — 17 jun 2026 (al crear un alimento, poder incluir **azúcares** y **grasas saturadas y trans**, "variables que en ciertos casos clínicos sí son relevantes" — demanda profesional externa).

**Estado actual (verificado en código):** El modelo `Alimento` guarda calorías, proteínas, carbohidratos, grasas, fibra, sodio + 24 micronutrientes. Pero **NO hay desglose** de:
- Grasas → saturadas / monoinsaturadas / poliinsaturadas / **trans** (Antonia)
- Carbohidratos → **azúcares** (simples) / complejos / almidón

**Petición:** Al elegir un alimento y en el análisis del plan, poder ver de dónde salen los macros: el tipo de grasas (saturadas, poli, monoinsaturadas) y el tipo de hidratos (azúcares simples vs complejos). Que se muestren en el análisis **igual que los micronutrientes** (mismo formato de barras/desglose).

**Tareas:**
- [ ] Añadir campos al modelo `Alimento`: `grasaSaturada`, `grasaMonoinsaturada`, `grasaPoliinsaturada`, `azucares`, (opcional `almidon`/`carbohidratosComplejos`) — todos `Float?`. Script SQL manual `ALTER TABLE`
- [ ] Rellenar estos valores en los alimentos (de OpenFoodFacts / tablas vienen estos datos; en los seed propios, estimar o dejar vacío)
- [ ] Mostrarlos en el análisis del plan (pestaña Análisis) junto a los micronutrientes, mismo formato
- [ ] Mostrarlos al ver el detalle de un alimento
- [ ] Sumar y mostrar el desglose a nivel de comida y de día

**Relacionado con:** #1 (tablas por país — la europea/BEDCA trae estos desgloses), #41 (ordenar por nutriente)
**Prioridad:** Media-Alta (dato clínico relevante — calidad de la grasa y del hidrato importa tanto como la cantidad)
**Complejidad:** Media (campos + relleno de datos + UI de análisis)

---

## 81. Crear plantilla desde la sección de Plantillas (no solo guardando el plan de un paciente)

**Origen:** Guillermo (apuntes de reuniones) — 4 junio 2026

**Estado actual (verificado en código):** Existe la sección `/dietas/plantillas` para ver/gestionar plantillas (listar, renombrar, eliminar, ver detalle). Pero crear una plantilla solo se puede vía `guardarComoPlantilla(planId)` — es decir, **guardando un plan que ya existe dentro de un paciente**. No se puede crear una plantilla en blanco directamente desde la sección de Plantillas.

**Petición:** Poder crear una plantilla **directamente desde la sección de Plantillas**, desde cero, sin tener que crearla primero en un paciente y luego guardarla. Hacer ese flujo más fácil.

**Reiterado y ampliado (Guillermo, 17 jul 2026):** crear plantillas hoy es engorroso (hay que entrar en un plan dentro de Dietas y guardarlo como plantilla; no se puede crear una nueva en blanco desde la sección Plantillas) → confirma la petición de arriba. **Además:** que **crear/guardar plantilla Y generar con IA se puedan hacer también desde el plan cuando estás dentro de un paciente**, no solo desde la sección Dietas — hoy esas acciones viven sobre todo en el flujo de Dietas y obligan a salir del paciente. Mejora de accesibilidad del flujo (relacionado con #23 comidas reutilizables y con la generación IA). Contexto: surge al explicar a un nutri (Saúl) cómo usar plantillas/IA — el propio flujo actual es poco descubrible. **Confirmado (22 jul 2026):** Saúl siguió los pasos y NO encontraba el botón "IA": `crearPlan` redirige a la ficha del paciente (`/pacientes/[id]?pestana=plan-alimentacion`, `plan-visual.tsx`) y el botón "IA" solo existe en la vista de dieta independiente `/dietas/[id]` (`page.tsx:94`), NO en `plan-visual`. Evidencia real de que la IA (y guardar/usar plantillas) debe estar accesible también desde el plan visto dentro del paciente.

**Tareas:**
- [ ] Botón "Nueva plantilla" en `/dietas/plantillas` que abra el editor de plan en modo plantilla (sin paciente asociado)
- [ ] Reutilizar el editor de dietas existente, pero guardando en `Plantilla` en vez de en un plan de paciente
- [ ] Mantener también el flujo actual (guardar un plan de paciente como plantilla)

**Archivos:** `src/app/(dashboard)/dietas/plantillas/`, `src/app/actions/plantillas.ts` / `planes.ts` (`guardarComoPlantilla`)
**Prioridad:** Media
**Complejidad:** Media

---

## 82. Bug responsive: el objetivo ("/ 2000 kcal") no se ve en el Análisis global en pantallas pequeñas

**Origen:** Guillermo + David Medina (reunión) — 4 junio 2026

**Problema:** En el panel **"Análisis global"** del editor de dietas (lado derecho), el valor debería mostrarse como **"actual / objetivo"** (ej. "1915 / 2000 kcal", y lo mismo en grasas, H. carbono, proteína…). En la pantalla de Guillermo se ve el objetivo, pero en la de David (resolución/ancho distinto) **el "/ 2000" no aparece** y solo se ve "1915 kcal". Es un fallo de visualización dependiente de la resolución de pantalla.

**Pista técnica:** `src/components/dieta/macro-barra.tsx` sí renderiza `{actual} / {objetivo} {unit}` (línea ~35), pero el bloque de cabecera del "Análisis global" / energía del editor parece ocultar o truncar el objetivo en anchos reducidos (posible `truncate`, clase responsive `hidden`/`sm:` o contenedor que recorta). Revisar el panel de Análisis global y su comportamiento a distintos anchos.

**Tareas:**
- [ ] Reproducir a distintas resoluciones (la de David) y localizar dónde se corta el "/ objetivo"
- [ ] Asegurar que "actual / objetivo" se muestre siempre en energía y en todos los macros del Análisis global, sin truncarse por ancho
- [ ] Revisar también la vista del paciente / compartido por si hereda el mismo recorte

**Archivos:** `src/components/dieta/analisis-sidebar.tsx`, `src/components/dieta/macro-barra.tsx`, `src/components/paciente/plan-visual.tsx`
**Prioridad:** Media (se ve poco profesional y confunde — falta un dato clave)
**Complejidad:** Baja

---

## 83. Recetas (y contenido) compartidas a nivel de centro/empresa

**Origen:** Guillermo (apuntes de reuniones) — 5 junio 2026

**Estado actual (verificado en código):** Existe el modelo `Empresa` (centros, con `lider` + `miembros` + `maxMiembros`), pero las **recetas son por dietista** (`Receta.dietistaId`); no hay recetas compartidas a nivel de empresa/centro. Lo mismo para alimentos personalizados, plantillas, etc. El stock sí tiene `MovimientoStock` ligado a empresa.

**Petición:** "Recetas también poner de centros" → que un centro/clínica pueda tener recetas (y probablemente alimentos, plantillas) **compartidas entre todos sus nutricionistas**, no solo propias de cada uno. Así el equipo de un centro trabaja con un recetario común.

**Tareas:**
- [ ] Permitir que una receta pertenezca a una `Empresa` (campo `empresaId` opcional en `Receta`) además de a un dietista
- [ ] Scope de recetas: propias del dietista + del centro + globales de la app (ampliar el sistema de scope actual, ver [[feedback-recetas]])
- [ ] Que los miembros del centro vean y usen las recetas del centro; definir quién puede crear/editar (¿todos los miembros, solo el líder?)
- [ ] Valorar extender lo mismo a alimentos personalizados y plantillas del centro
- [ ] UI: filtro "Recetas del centro" en la lista de recetas

**Relacionado con:** modelo `Empresa` existente, #39 (cuenta profesor — mecánica parecida de compartir), #43 (white-label de centros)
**Prioridad:** Media-Alta (los centros son un segmento clave — trabajar en equipo con recetario común es muy demandado)
**Complejidad:** Media

---

## 84. Bug: el checklist de comidas del paciente no se actualiza al cambiar el plan

**Origen:** nutricionista (WhatsApp) — 5 junio 2026 (aclaración del feedback de la tarea #31)

**Problema reportado:** Cuando el nutri modifica el plan de alimentación, el cambio **sí se ve en los entregables (PDF)** pero **NO en la lista que el paciente usa para hacer el check** diario de comidas. Para el paciente, su checklist sigue mostrando las comidas antiguas.

**Causa (verificada en código):** `getComidaDelDiaPaciente()` (`src/app/actions/seguimiento-paciente.ts`) sí lee el plan activo en vivo, PERO cuando el paciente guarda su seguimiento del día se almacena un **snapshot en `comidasData` (JSONB) en `seguimiento_diario`**. El checklist de un día ya registrado se pinta desde ese snapshot guardado, que **no se refresca** cuando el nutri cambia el plan después. El PDF sí cambia porque se genera en vivo desde el plan.

**Opciones de arreglo (a decidir):**
- [ ] Para días **de hoy/futuros y no cumplidos**: leer siempre del plan en vivo (no del snapshot), de modo que reflejen los cambios del nutri
- [ ] **Fusionar** snapshot + plan actual: mostrar las comidas del plan vivo conservando los checks ya marcados que coincidan
- [ ] Al **modificar el plan**, regenerar/invalidar el `comidasData` de los días afectados aún no cumplidos
- [ ] Mantener el snapshot solo para **días pasados ya cumplidos** (registro histórico fiel de lo que tocaba ese día)

**Decisión de diseño clave:** distinguir entre "lo que el paciente DEBÍA comer ese día" (histórico, congelado) y "lo que debe comer de ahora en adelante" (vivo, según el plan actual). El bug es que hoy se congela también lo futuro.

**Archivos:** `src/app/actions/seguimiento-paciente.ts` (`getComidaDelDiaPaciente`, `getSeguimientoPacienteDia`, `guardarSeguimientoPaciente`), `src/app/paciente/portal/seguimiento/page.tsx`
**Prioridad:** Alta (el paciente sigue un plan desactualizado — afecta directamente a la adherencia y genera confusión)
**Complejidad:** Media

---

## 86. Verificar la app en Google para que Google Calendar no salga como "sospechosa/no verificada"

**Origen:** Guillermo (apuntes) — 5 junio 2026

**Problema:** Al conectar Google Calendar (Ajustes → Integraciones), Google muestra la pantalla de advertencia **"Google no ha verificado esta aplicación"** (sale como app sospechosa / no segura), con el rodeo de "Configuración avanzada → Ir a Annonia (no seguro)". Esto asusta a los nutricionistas y muchos no completan la conexión.

**Causa (verificada en código):** La integración (`src/lib/google-oauth.ts`) solicita el scope **`https://www.googleapis.com/auth/calendar.events`**, que Google clasifica como **scope SENSIBLE**. Cualquier app con scopes sensibles que no haya pasado la **verificación de Google (OAuth consent screen verification)** muestra ese aviso a todos los usuarios que no estén en la lista de "usuarios de prueba". Los otros dos scopes (`userinfo.email`, `userinfo.profile`) no son sensibles.

**Buena noticia:** `calendar.events` es **sensible pero NO restringido** → la verificación requiere revisión de marca + vídeo, pero **NO** la auditoría de seguridad anual de terceros (lo caro, miles de $). Es un trámite asumible.

**Qué hay que hacer (verificación de OAuth con scope sensible) en Google Cloud Console → APIs y servicios → Pantalla de consentimiento de OAuth:**
- [ ] Completar la pantalla de consentimiento: nombre de la app (Annonia), logo, email de soporte, dominio de la app (annonia.com), enlace a la política de privacidad y a los términos
- [ ] **Verificar la propiedad del dominio** `annonia.com` en Google Search Console (asociado a la misma cuenta de Google Cloud) — ya tenemos dominio + HTTPS en producción, así que el prerequisito está cumplido (ver [[project-google-oauth-pendiente-dominio]] y [[project-annonia-produccion]])
- [ ] Añadir los **dominios autorizados** y las **redirect URIs** de producción (callbacks `/api/google/callback-nutri` y `/api/google/callback-paciente`)
- [ ] **Justificar cada scope** (por qué se necesita `calendar.events`: crear/editar eventos de cita del nutricionista y del paciente)
- [ ] Grabar el **vídeo de demostración** que pide Google: mostrar el flujo OAuth completo y cómo la app usa el scope de calendario
- [ ] **Publicar la app** (pasar el estado de "Testing" a "In production") y enviar a verificación
- [ ] Esperar la revisión de Google (suele tardar de días a algunas semanas)

**Workaround mientras tanto:**
- En modo "Testing" se pueden añadir hasta **100 usuarios de prueba** (sus emails) que NO ven el aviso → útil para los primeros nutricionistas mientras llega la verificación
- O instruir al nutri a pulsar "Configuración avanzada → Ir a Annonia (no seguro)" (mala experiencia, no escalable)

**Reiterado (Neus Pallarés, neuspallaresdn@gmail.com — 17 jul 2026):** "no deja vincular con Google Calendar porque dice que no es un sitio seguro". Confirma el impacto real (el aviso frena la vinculación). Se le indicó el workaround "Configuración avanzada → continuar". **Guillermo (17 jul) prefiere NO añadir usuarios de prueba uno a uno** → la vía es completar la verificación de la app (este trámite). VERIFICADO de nuevo (17 jul): el login con Google le funciona (scopes básicos), solo falla Calendar (scope sensible `calendar.events`).

**Prioridad:** Alta (afecta a la confianza y a la adopción de una feature ya construida — un aviso de "app sospechosa" frena a los usuarios)
**Complejidad:** Baja a nivel de código (casi todo es configuración/trámite en Google Cloud Console + grabar el vídeo); la espera de revisión de Google es el cuello de botella

---

## 87. Campo de notas/observaciones escritas en Mediciones (QUICK WIN: backend ya listo, falta el textarea)

**Origen:** nutricionista (WhatsApp) — 7 junio 2026 ("perdona que insista" → ya lo había pedido antes). Quiere poder **explicar por escrito las sensaciones del paciente de esa semana** dentro de Mediciones.

**Estado actual (VERIFICADO en código — está a medio conectar):**
- El modelo `MedidaAntropometrica` **YA tiene el campo `notas String?`** (`prisma/schema.prisma` ~línea 538).
- La acción `medidas.ts` **YA lo guarda y lo lee** (lo sanitiza hasta 1000 caracteres, líneas 38/72/121/171).
- El formulario `src/components/medidas-form.tsx` incluso **ya intenta leerlo** al enviar: `notas: form.get("notas")` (línea 124).
- ⚠️ PERO el formulario **NO tiene ningún `<textarea name="notas">`** — solo hay campos numéricos (`NumField`). Como el input no existe, `form.get("notas")` siempre es `undefined` → la nutri no puede escribir nada.
- La pestaña `paciente-ficha-mediciones-tab.tsx` **tampoco muestra** las notas.

→ Caso de libro del patrón "funcionalidad a medias: datos+backend listos, falta la UI" (ver [[feedback-patrones-flujo-producto]] #5). Para la nutri "no existe", pero por dentro está casi todo hecho.

**Tareas (muy poco trabajo):**
- [ ] Añadir un `<textarea name="notas">` (label "Notas / observaciones de la semana") al final de `medidas-form.tsx`, con `defaultValue` de la nota existente al editar
- [ ] Mostrar las notas guardadas en `paciente-ficha-mediciones-tab.tsx` (en cada medición / en la del día)
- [ ] Traducciones es/pt del label
- [ ] (Opcional) incluir las notas en el PDF de evolución

**Relacionado con:** #54 (sensaciones/síntomas que registra el PACIENTE — esto es la nota que escribe el NUTRI), #50 (notas de sesión), #29 (observaciones en bioimpedancia)
**Prioridad:** Alta (pedido más de una vez + es casi gratis: el backend ya está, solo falta el textarea)
**Complejidad:** Muy baja

---

## 89. BUG: no se pueden añadir instrucciones (paso a paso) al crear/editar una receta

**Origen:** nutricionista (email) — 8 junio 2026 ("al crear una receta nueva no aparece la opción para agregar el procedimiento"); **Antonia (nutrivibes.life, Instagram) — 17 jun 2026** ("al crear una receta hay un cuadro de descripción donde se indica poner los pasos, pero una vez guardada el apartado 'Instrucciones' queda vacío y no encontré cómo completarlo"). **RECONFIRMADO VIVO en código el 17 jun** (`receta-form.tsx:66` sigue con `instrucciones: undefined`; el único textarea es `descripcion`). El resumen de una sesión anterior creía que se había arreglado, pero NO: sigue sin arreglarse.

**Causa raíz (VERIFICADA en código):** En `src/components/receta-form.tsx`, al guardar se hace `instrucciones: undefined` **hardcodeado** (línea ~66) y **no existe ningún `<textarea name="instrucciones">`** en el formulario (el único textarea es `descripcion`). El campo `Receta.instrucciones` existe en el modelo y SÍ se muestra en el plan/PDF si tuviera valor, pero el formulario **nunca lo captura** → ninguna receta creada por el nutri tiene instrucciones. (Esta es también la causa raíz de la #73: las recetas salen sin pasos.)

**Solución (fácil):**
- [ ] Añadir un `<textarea name="instrucciones">` (label "Preparación / paso a paso") al formulario de receta (`receta-form.tsx`), con `defaultValue={defaultValues?.instrucciones}` para la edición
- [ ] Cambiar `instrucciones: undefined` por `instrucciones: (form.get("instrucciones") as string) || undefined`
- [ ] Verificar que se muestra en el plan, portal del paciente y PDF (el render ya existe)
- [ ] Traducciones es/pt del label
- [ ] **Quitar la confusión descripción↔instrucciones** (Antonia): el placeholder de "descripción" sugiere poner ahí los pasos, pero luego el apartado "Instrucciones" sale vacío. Dejar claro qué va en cada campo (descripción = breve; instrucciones = paso a paso).
- [ ] **Aprovechar el mismo form para las PORCIONES (punto 5 de Antonia):** hoy `receta-form.tsx:46` tiene `const porciones = 1` **hardcodeado** y no hay input → no se puede indicar para cuántas porciones es la receta al crearla (solo se ajusta luego al añadirla al plan). Añadir un input de nº de porciones al crear/editar la receta.

**Relacionado con:** #73 (recetas globales sin pasos — misma raíz), #38 (imágenes en recetas — mismo form)
**Prioridad:** Alta (afecta directamente al entregable: el paciente no ve cómo preparar la receta; y es un arreglo trivial)
**Complejidad:** Muy baja

---

## 90. BUG: las recetas no suman sus micronutrientes al total del día del plan

**Origen:** nutricionista (email) — 8 junio 2026. "Al incluir recetas propias en el plan, el sistema no suma los micronutrientes al total del día; solo se contabilizan si agrego los ingredientes de forma individual." **Segundo reporte (16 jun 2026):** otra nutricionista lo ve con la receta "paella mixta" ("no se añaden los micronutrientes en la valoración nutricional… no sé si pasa con más recetas o solo con esa"). → **Es general, no de esa receta: pasa con TODAS las recetas.** Reconfirmado vivo en código el 16 jun (`planes.ts`: `alimentoIdSet` solo añade `a.alimento?.id`; query `FROM alimentos`; el objeto `receta` construido trae macros pero no los 24 micros).

**Causa raíz (VERIFICADA en código):** En `src/app/actions/planes.ts` (agregación de micros del día, función con `MICRO_COLS`), la query de micronutrientes solo recoge **IDs de alimentos** (`if (a.alimento?.id) alimentoIdSet.add(...)` → `SELECT ... FROM alimentos WHERE id IN (...)`) y luego asigna `micros = a.alimento?.id ? microMap[...] : {}`. Para un entry que es **receta** (`a.receta`), `a.alimento?.id` es null → micros `{}`. Además, el `select` de la receta en esa consulta trae `carbohidratos/grasas/fibra/porciones/ingredientes` pero **no los 24 micros** de la receta. → Las recetas (que SÍ tienen sus 24 micros calculados y guardados) **no aportan micros al total diario**; los macros sí, los micros no.

**Solución:**
- [ ] Incluir los micros de la receta en el cálculo del día: cargar los micros escalares de `Receta` (ya existen) y sumarlos, escalados por las porciones/cantidad usada en el plan (igual que se hace con macros de receta)
- [ ] Añadir los micros al `select` de receta donde haga falta, o hacer una query de micros de recetas análoga a la de alimentos
- [ ] Verificar el total de micros del día en el editor (sidebar Análisis), en la pestaña Análisis y en el informe nutricional (#28)

**Relacionado con:** #28 (informe nutricional), #41 (buscar/ordenar por micros)
**Prioridad:** Alta (dato clínico incorrecto — el nutri ve menos micros de los reales si usa recetas, y puede tomar decisiones erróneas)
**Complejidad:** Media

---

## 91. Renombrar la pestaña "Información" del paciente a "Anamnesis"

**Origen:** Guillermo (apuntes) — 8 junio 2026

**Estado actual (verificado en código):** En la ficha del paciente, la pestaña donde se rellena la anamnesis (Consulta, Personal/Social, Clínica, Alimentaria) se llama **"Información"**. La etiqueta viene de las claves i18n `fichaTabs.informacion` (y `tabInformacion`) en `src/messages/es/patients.json` (y su equivalente en pt). La pestaña se monta en `getFichaTabs()` de `src/lib/paciente-ficha-pestanas.ts`; el componente es `paciente-ficha-informacion-tab.tsx`.

**Petición:** Cambiar la etiqueta de **"Información" → "Anamnesis"**, que es el término clínico correcto y más informativo/profesional para el nutricionista (deja claro qué contiene esa pestaña).

**Tareas:**
- [ ] Cambiar el texto de las claves `fichaTabs.informacion` y `tabInformacion` (la que use realmente `getFichaTabs`) de "Información" a "Anamnesis" en `src/messages/es/patients.json`
- [ ] Mismo cambio en `src/messages/pt/patients.json` ("Anamnese")
- [ ] Solo cambio de TEXTO visible — no renombrar componentes, ids de pestaña (`informacion`) ni rutas internas
- [ ] Revisar que no quede incoherente con otros textos que digan "Información" refiriéndose a esa pestaña (avisos, tours, etc.)

**Relacionado con:** #18 (personalizar anamnesis), #24 (terminología de la UI)
**Prioridad:** Baja-Media (mejora de claridad/profesionalidad, cambio de texto)
**Complejidad:** Muy baja

---

## 93. Que las recetas favoritas aparezcan en "Mis recetas" del buscador del plan (etiquetadas como "Favorito")

**Origen:** Guillermo (apuntes) — 8 junio 2026

**Petición:** Al añadir recetas en un plan de alimentación (y en todos los buscadores de alimentos/recetas), cuando el nutri filtra por **"Mis recetas"** deben aparecer también las recetas **favoritas** (las de la app que ha marcado con la estrella), además de las propias. Y que esas favoritas se muestren etiquetadas como **"Favorito"** en lugar de como propia/"Tuyo", para distinguirlas. Idea: "mis recetas" = mis propias + mis favoritas, cada una con su distintivo.

**Estado actual (VERIFICADO en código):** En el buscador del editor del plan (`buscarAlimentosYRecetas`, `src/app/actions/recetas.ts`):
- El filtro **"mis-recetas" trae SOLO las propias**: `WHERE r."dietistaId" = $1`. **NO incluye las globales marcadas como favoritas.**
- Los resultados solo llevan el flag `esPropio` (true para propias); **no hay flag `favorito`**, así que no se pueden distinguir/etiquetar las favoritas.
- (Para comparar: la LISTA de la sección Recetas con scope "mías" sí incluye propias + favoritas, y `getRecetas` ya devuelve un flag `favorito`. El buscador del plan se quedó sin esa lógica.)

**Tareas:**
- [ ] En `buscarAlimentosYRecetas`, filtro "mis-recetas": incluir también las recetas favoritas → `WHERE (r."dietistaId" = $1 OR (r."dietistaId" IS NULL AND fav.id IS NOT NULL))` (LEFT JOIN `receta_favoritos` como ya hace el filtro "recetas")
- [ ] Añadir un flag `favorito` a los resultados del buscador (no solo `esPropio`)
- [ ] En el selector (`selector-alimento.tsx`): mostrar un distintivo **"Favorito"** (estrella) en las favoritas, distinto del de receta propia/"App"
- [ ] Aplicar el mismo criterio en todos los sitios donde se buscan/añaden recetas, para consistencia
- [ ] Verificar que ahora que los favoritos funcionan (#92), las favoritas realmente aparecen

**Relacionado con:** #92 (bug favoritos, ya arreglado), #68 (duplicar/editar recetas de la app), [[feedback-recetas]] (scope mías = propias + favoritas)
**Prioridad:** Media-Alta (flujo principal: encontrar rápido las recetas que usas al montar el plan)
**Complejidad:** Baja

---

## 94. La sesión del dietista se cae tras varias horas / reinicio del servidor (revisar refresco de tokens)

**Origen:** Guillermo — 9 junio 2026

**Problema:** Inicias sesión, dejas el ordenador abierto unas horas (≈12h) y/o hay un reinicio del servidor (deploy, `pm2 restart`), y al volver te ha **deslogueado** y tienes que entrar de nuevo. Molesto en el uso diario.

**Estado actual (verificado en código):**
- La sesión del **dietista** es de **Supabase Auth** (cookies `sb-…`). Las sesiones JWT propias NO son el problema: paciente dura 30 días (`patient-auth.ts`), admin dura `ADMIN_SESSION_DAYS` (`admin.ts`). El deslogueo es de la sesión de Supabase.
- `src/lib/supabase-browser.ts`: el cliente está con **`persistSession: false, autoRefreshToken: false`** → el token de acceso **no se auto-refresca en el navegador**. El access token de Supabase caduca (~1h por defecto).
- El refresco se hace **server-side**: `middleware.ts` → `updateSession()` de `src/lib/supabase/middleware.ts` (patrón `@supabase/ssr`). Si una pestaña queda inactiva muchas horas sin navegar, el middleware no se ejecuta y el token caduca; al volver, si el refresh token está caducado/rotado, cae a login.

**Qué revisar (hipótesis a investigar):**
- [ ] Política de **refresh token** en el proyecto Supabase: caducidad del refresh token, rotación y "reuse detection". La combinación de `autoRefreshToken:false` en cliente + refresco solo en middleware puede provocar rotaciones cruzadas que invaliden el refresh token
- [ ] **JWT expiry** del proyecto Supabase (access token ~1h): valorar subirlo si procede
- [ ] **Matcher del middleware**: confirmar que `updateSession` se ejecuta en las rutas del dashboard, para que cada navegación refresque las cookies
- [ ] Valorar activar **`autoRefreshToken: true`** (y `persistSession`) en el cliente, o un refresco periódico, para que una pestaña abierta mantenga viva la sesión sin depender solo del middleware
- [ ] Confirmar que un `pm2 restart`/deploy NO invalida la sesión por sí mismo (las cookies viven en el navegador; si se cae al reiniciar, sospechar del refresh token / cookies reescritas en el arranque)
- [ ] Reproducir: dejar sesión abierta, esperar a que caduque el access token, navegar y ver si el refresh server-side la renueva o cae a `/login`

**Archivos:** `src/lib/supabase-browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/middleware.ts`, `src/middleware.ts`, `src/app/actions/auth.ts` (`getCurrentDietista`)
**Prioridad:** Media-Alta (mala experiencia recurrente — desloguearse solo frena el uso diario y da sensación de inestabilidad)
**Complejidad:** Media (auth/sesión: delicado, posible mezcla de config en Supabase + código)

---

## 95. Búsqueda de alimentos más flexible (por palabras en cualquier orden) + sinónimos/alias

**Origen:** Lucía Hernández (LinkedIn) — 9 junio 2026; nutricionista (audio, 3 semanas usándola) — 10 junio 2026; entrenutris (Argentina) — 19 junio 2026 (nombre local del alimento por país, ver abajo).

**Input adicional (entrenutris, Argentina — 19 jun 2026) — nombre LOCAL del alimento por país (presentación):** Pide que, al entregar el plan, los nombres de los alimentos se muestren con el término local del país, sin cambiarlos a mano ("como el idioma"): España "plátano" → Argentina "banana"; España "aguacate" → "palta". Dice que no queda bien entregar a un paciente argentino un plan con los nombres españoles. → Es la cara de **presentación** del sistema de sinónimos/alias: además de encontrar el alimento por su nombre local (búsqueda), poder **mostrar** el nombre regional en plan/PDF/portal según el país del nutri o del paciente (#7). Requiere un mapa de equivalencias regionales (es-ES ↔ es-AR ↔ es-PE…). Enlaza con #1 (tablas regionales LatAm) y #34 (terminología de la UI).

**Input adicional (nutricionista, 10 jun 2026) — relevancia confusa (palabra vs prefijo):** Al buscar "pan" salen antes alimentos como **"Panga"**, o al buscar "salmón" sale **"salmonete"**, en vez del alimento esperado. VERIFICADO: el buscador del editor SÍ reordena por relevancia (`recetas.ts` ~líneas 543-560: exacto > empieza-por > contiene), pero "Panga"/"salmonete" **empiezan por** "pan"/"salmon", así que entran en el mismo nivel que "Pan Blanco" y, al desempatar por longitud, la palabra más corta ("Panga") gana. → Afinar la relevancia para **distinguir "pan" como PALABRA completa** (que esté como token: "Pan Blanco", "Pan integral") de "pan" como mero prefijo de otra palabra ("Panga"): priorizar coincidencia de palabra completa sobre prefijo de cadena.

**Input adicional (nutricionista, 16 jun 2026) — sinónimo vacuno = ternera (caso real):** Pide "carne picada de vacuno con alto % de carne", dice que no la encuentra. VERIFICADO en BD: el catálogo SÍ tiene "Carne Picada De Ternera" en **5% / 10% / 20%** de grasa (ternera = vacuno en España), más "Mixta" y "Mixta Magra". Lo más probable es que buscara **"vacuno"** y no salga nada porque están como **"ternera"**. Caso de manual para los sinónimos: **vacuno ↔ ternera** (y similares: cerdo↔porcino, pollo↔pavo no, pero res↔ternera en LatAm sí). Refuerza la necesidad del campo de sinónimos/alias.

**Estado actual (VERIFICADO en código):** La búsqueda usa `nombreNormalizado` + `normalizarParaBusqueda()`, que **ya quita tildes, pasa a minúsculas y despluraliza** (las tareas #19 "sin tildes" y #45 "plural/singular" ya están cubiertas). PERO la coincidencia es por **subcadena en orden** (LIKE sobre el texto normalizado), así que:
- "copos de avena" NO encuentra "Avena (copos)" → falla por el **orden de las palabras** y por el "de"/paréntesis.
- No hay **sinónimos/alias**: si un alimento se llama distinto en otro país (LatAm), no se encuentra ni se puede mostrar con su nombre local.

**Petición de Lucía (dos cosas):**
1. **Búsqueda por palabras independientes del orden** — que al escribir "copos de avena" encuentre "Avena (copos)". Buscar cada palabra (token) como AND, sin exigir el orden literal ni los conectores ("de", paréntesis).
2. **Sinónimos / nombre alternativo del alimento** — poder indicar un sinónimo del nombre para pacientes de otras nacionalidades (ej. nombres distintos en Latinoamérica). Que sirva para (a) encontrar el alimento al buscar por el sinónimo y (b) opcionalmente mostrar ese nombre local al paciente.

**Tareas:**
- [ ] Búsqueda por tokens: dividir la consulta en palabras (ya normalizadas/despluralizadas) y exigir que TODAS aparezcan en `nombreNormalizado`, en cualquier orden (varios LIKE con AND, o full-text search). Ignorar conectores ("de", "con"...) y paréntesis
- [ ] Combinar con relevancia (#26): priorizar coincidencia exacta/prefijo, luego por tokens
- [ ] Campo `sinonimos`/`alias` (String[] o texto) en `Alimento`, incluido en `nombreNormalizado` para la búsqueda
- [ ] (Opcional) mostrar el sinónimo/nombre local al paciente según su país (enlaza con selector de país del paciente #7 y terminología regional #34)

**Relacionado con:** #19 (sin tildes — hecho), #45 (plural — hecho), #26 (relevancia), #7 (país del paciente), #34 (terminología regional)
**Prioridad:** Alta (la búsqueda es el flujo más usado al montar planes; que no encuentre "copos de avena" frustra)
**Complejidad:** Media (tokens: baja-media; sinónimos: media)

---

## 96. BUG: el paciente no puede acceder al portal desde el MÓVIL (sí desde el ordenador)

**Origen:** Lucía Hernández (LinkedIn) — 10 jun 2026. Corrige su reporte anterior: el paciente al que envió el acceso por correo **no podía entrar desde el móvil, pero desde el ordenador sí le dejó**. Por tanto NO es problema de credenciales/PIN ni de la función (que está habilitada): es algo específico del **móvil**.

**Estado actual (verificado en código):** El login del paciente (`/paciente/login`, email + PIN) y la cookie de sesión `annonia-paciente-session` parecen correctos (`httpOnly`, `secure` en https, `sameSite: "lax"`, 30 días) — no hay un problema evidente de cookie en el código. El fallo es solo en móvil, lo que apunta a entorno/cliente, no a la lógica.

**Hipótesis a investigar (reproducir en móvil real: iOS Safari y Android Chrome):**
- [ ] **Navegador in-app / webview del correo:** si el paciente abre el link desde la app de Gmail/Outlook/Instagram en el móvil, se abre en un navegador integrado (webview) donde las cookies o el JS pueden fallar y la sesión no persiste. Es la causa más típica de "en el móvil no me deja". Posible solución: forzar/instar a abrir en el navegador del sistema, o revisar el flujo de set-cookie tras login en webview
- [ ] **Responsive del login en móvil:** que el formulario/botón no se vea o no sea pulsable (teclado tapando el botón, overflow, etc.)
- [ ] **Input del PIN en móvil:** teclado numérico, autocompletado o gestor de contraseñas del móvil interfiriendo
- [ ] **Cookies en Safari iOS** (ITP / bloqueo de cookies) — confirmar que la cookie se setea y se reenvía en iOS
- [ ] Reproducir el caso EXACTO: abrir el enlace del email de acceso desde el móvil (no copiando la URL) y ver qué pasa al meter email + PIN

**Prioridad:** Alta (la mayoría de pacientes usan el portal desde el móvil; si no pueden entrar desde el móvil, el portal del paciente prácticamente no sirve)
**Complejidad:** Media (hay que reproducir en móvil para localizar; el arreglo depende de la causa)

---

## 97. Notificaciones del chat de mensajes en la campana (configurable por tipo)

**Origen:** nutricionista (reunión) — 10 junio 2026

**Estado actual (verificado en código):** Las notificaciones de la campana (`Notificacion` / `TipoNotificacion`) cubren citas, pagos, paciente sin consulta/medidas, plan antiguo, diario nuevo, empresa… pero **el chat de mensajes (paciente↔nutri) va por su cuenta** (tiene su propio contador de no leídos, `noLeidosSoporte` y conversaciones), no aparece como notificación en la campana.

**Petición:** En la campana de notificaciones (arriba, donde está la configuración), poder elegir que **las notificaciones del chat de mensajes también lleguen ahí**, como un bloque/categoría más. Es decir, unificar y permitir configurar qué tipos de notificación se reciben en la campana, incluyendo los mensajes.

**Tareas:**
- [ ] Añadir las notificaciones de mensajes nuevos a la campana (nuevo `TipoNotificacion` para mensaje, o integrar el contador de chat en el panel de la campana)
- [ ] En la configuración de notificaciones (la que ya hay arriba en la campana): permitir activar/desactivar por tipo, incluido "Mensajes"
- [ ] Agrupar el panel por bloques (citas, pagos, pacientes, mensajes…) — los mensajes como un cuarto bloque
- [ ] Cuidar no duplicar el aviso si el chat ya tiene su propio badge

**Prioridad:** Media
**Complejidad:** Media

---

## 98. Vista "Análisis → Todos": título de cada día en un recuadro centrado

**Origen:** nutricionista (reunión) — 10 junio 2026

**Estado actual:** En el editor de dietas, modo Análisis, al elegir "Todos" se muestran los días (Lunes, Martes, Miércoles…) uno debajo de otro. El título de cada día se ve como texto suelto, poco diferenciado.

**Petición:** Que en esa vista "Todos" el **título de cada día** (Lunes, Martes…) se muestre en un **recuadro/cuadrito y centrado**, para separar visualmente cada día y que sea más claro de leer.

**Tareas:**
- [ ] En el modo Análisis (vista "Todos"), maquetar el encabezado de cada día como una cabecera con fondo/recuadro y texto centrado
- [ ] Mantener coherencia con el resto del estilo de la app

**Archivos:** componentes del análisis del plan (`src/components/dieta/analisis-sidebar.tsx` / vista de análisis del editor)
**Prioridad:** Baja-Media (mejora visual/legibilidad)
**Complejidad:** Baja

---

## 99. Clasificar las recetas por categoría (desayuno, comida, snack, salsa, puré…)

**Origen:** nutricionista (reunión) — 10 junio 2026

**Estado actual (verificado en código):** Los alimentos tienen `CategoriaAlimento` (frutas, carnes, pescados, panes…) y se filtran por categoría. Las **recetas NO tienen categoría** (`Receta` no tiene campo de categoría/tipo) → no se pueden clasificar ni filtrar por tipo de plato.

**Petición:** Igual que los alimentos se clasifican (panes, pescados, carnes…), poder clasificar las **recetas** por tipo: desayunos, comidas, cenas, snacks, salsas, purés, postres, etc. Para encontrarlas y organizarlas mejor.

**Tareas:**
- [ ] Añadir campo `categoria`/`tipo` a `Receta` (enum o string) — script SQL manual (recordar: cliente Prisma local no regenera `recetas`, usar raw SQL)
- [ ] Definir el set de categorías de receta (desayuno, comida, cena, snack, salsa, puré, postre, bebida…)
- [ ] UI en el formulario de receta: selector de categoría
- [ ] Filtro por categoría en la lista de recetas y en el buscador del plan
- [ ] Etiquetar las 316 recetas globales con su categoría (semi-automatizable)

**Relacionado con:** #66 (etiquetas de tipo de dieta en recetas — son ejes distintos: #66 = paleo/keto/vegana; #99 = momento/tipo de plato)
**Prioridad:** Media-Alta (organiza el recetario — muy útil al montar planes)
**Complejidad:** Media (el grueso es etiquetar las recetas globales)

---

## 100. Vista "Resumen" del plan: mostrar los tiempos de comida por día (en vez de "X comidas sin alimentos")

**Origen:** nutricionista (mensaje) — 10 junio 2026. (También elogia que ya se añadió lo de copiar alimentos entre días, #31: "quedó súper".)

**Estado actual (verificado en código):** En la vista Resumen del plan, un día con comidas vacías muestra un texto genérico **"{count} comida(s) sin alimentos"** (`diets.json` → `mealsWithoutFoods`, usado en `resumen-diario.tsx` / `dia-columna.tsx`). No se ve QUÉ comidas faltan ni en qué día concreto.

**Petición:** En el Resumen, ver **todos los días de la semana con sus tiempos de comida** (desayuno, media mañana, almuerzo, merienda, cena…) y marcar cuáles están vacíos, para saber de un vistazo **en qué día y en qué comida falta agregar alimentos**. Mucho más visual que "5 comidas sin alimentos".

**Tareas:**
- [ ] En la vista Resumen, en vez del texto "{count} comida(s) sin alimentos", listar los tipos de comida del día y señalar visualmente los vacíos (ej. en gris/atenuado o con un icono) vs los que ya tienen alimentos
- [ ] Mantenerlo compacto para que el resumen siga siendo de un vistazo
- [ ] Coherencia con el orden de comidas del plan

**Archivos:** `src/components/dieta/resumen-diario.tsx`, `src/components/dieta/dia-columna.tsx`
**Relacionado con:** #31 (copiar comidas entre días — ya hecho), #37 (filas vacías en PDF)
**Prioridad:** Media (mejora de visibilidad al montar la semana)
**Complejidad:** Baja

---

## 101. Alimentos solicitados por nutricionistas para añadir al catálogo (lista acumulativa)

**Origen:** varios nutricionistas (se irá ampliando).

Lista de alimentos concretos que los nutris echan en falta en la base de datos global. En lugar de una entrada por alimento, se acumulan aquí para añadirlos por lotes al catálogo (con macros + micros + unidad/porción correcta, ver #21).

**Pendientes de añadir:**
- [ ] **Tortitas de legumbres** (nutricionista, 12 jun 2026) — existen "Tortita de arroz" y "Tortita de avena", pero no de legumbres.
- [x] **Carne picada de vacuno** (nutricionista, 16 jun 2026) — ✅ HECHO (16 jun): añadidas **2 versiones GLOBALES** con macros + **23 micros completos** (valores reales USDA FoodData Central): "Carne Picada De Vacuno (5%)" magra/alto % de carne (FDC 171790: 137 kcal, 21,4 P, 5 G) y "Carne Picada De Vacuno (10%)" estándar (FDC 174030: 176 kcal, 20 P, 10 G). Insertadas directamente en la BD (compartida → ya en producción), `dietistaId` NULL, categoría CARNES, unidad GRAMOS. Pendiente complementario (no bloqueante): sinónimo vacuno↔ternera (#95) para que "vacuno" también devuelva las de ternera.
- [ ] (Relacionado: panes/alimentos peruanos —pan francés, chiabatta…— pedidos por Betzabe, ver #1; faltan alimentos también reportado en #44)

**Nota:** mientras no estén en el catálogo global, el nutri puede crearlos como **alimento propio** con sus valores y le quedan guardados. Conviene revisar periódicamente esta lista y meterlos al seed global.

**Relacionado con:** #1 (tablas por país), #44 (faltan alimentos para la IA), #21 (unidad/porción correcta al añadirlos)
**Prioridad:** Media (contenido — mejora continua del catálogo)
**Complejidad:** Baja (añadir alimentos al seed)

---

## 102. Recordatorio de 24 horas (R24h) en la historia alimentaria, con cálculo aproximado de la ingesta

**Origen:** Saija (nutricionista, WhatsApp — 12 jun 2026). Relacionado con el "registro de 24h (día entre semana + día libre)" que pidió Ainara (#18).

**Estado actual (verificado en código):** La anamnesis tiene una sección "Historia alimentaria" (`historiaAlimentaria` en `ficha-informacion-types.ts`) con campos de TEXTO libre (tipos de dieta, alimentos favoritos/rechazados…). NO existe un recordatorio de 24 horas estructurado ni ningún cálculo de la ingesta que el paciente refiere.

**Petición:** Añadir un **cuadro de recordatorio de 24 horas** en la historia alimentaria donde el nutri va anotando lo que el paciente refiere haber comido (por comidas) y la app **calcula un aproximado de las calorías y macros consumidos**, reutilizando la base de alimentos. Ejemplo de Saija:
> Desayuno: 2 rebanadas de pan (30 g CH) · 1 cda de queso crema (5 g lípidos) · 2 huevos (10 g lípidos, 16 g proteína)… y así, para tener idea de cuánto consume el paciente al día. Un aproximado, porque nunca es exacto.

**Tareas:**
- [ ] Estructura de R24h: comidas (desayuno, media mañana, comida…) → alimentos con cantidad, usando el mismo buscador de alimentos del plan
- [ ] Calcular kcal y macros aproximados por comida y total del día, reutilizando `calcularMacrosPorcion` / el motor de cálculo que ya existe
- [ ] Mostrar el total estimado del día (con una nota de "aproximado")
- [ ] Guardarlo en la ficha del paciente (anamnesis / historia alimentaria)
- [ ] Idealmente permitir un día entre semana y un día libre/fin de semana (Ainara, #18)
- [ ] Útil para comparar la ingesta habitual estimada con el objetivo y enfocar el plan

**Relacionado con:** #18 (anamnesis / registro 24h de Ainara), #78 (objetivos y macros), #28 (informe nutricional), motor de cálculo de macros existente
**Prioridad:** Media-Alta (herramienta clásica de valoración inicial; muy útil y reutiliza lo que ya hay)
**Complejidad:** Media (UI + estructura nuevas, pero el buscador y el cálculo de macros ya existen)

---

## 103. Botón "Notificar al paciente" dentro del propio plan de alimentación

**Origen:** nutricionista (WhatsApp — 15 jun 2026), enseñando cómo lo hace Nutrium (captura). ⚠️ **POR VALORAR — a Guillermo no le convence del todo; queda apuntado como pendiente de decidir.**

**Estado actual:** Para hacerle llegar el plan al paciente o avisarle de que está listo/actualizado, el nutri tiene que ir a la pestaña **Entregables** (enviar plan por email, enviar instrucciones de acceso). No hay un botón directo en el editor del plan.

**Petición:** Un botón **"Notificar"** en el propio plan de alimentación que avise al paciente y le haga llegar el plan directamente, sin pasar por Entregables. En Nutrium el botón muestra además **"Cliente notificado por última vez hace X"** (queda registro de cuándo se le avisó). Más cómodo y rápido.

**Tareas:**
- [ ] Botón "Notificar al paciente" en el encabezado del editor del plan
- [ ] Decidir qué hace exactamente: ¿notificación en el portal/campana del paciente? ¿email con el plan? ¿ambas? (reutilizar lo de Entregables)
- [ ] Mostrar "última vez notificado hace X" junto al botón
- [ ] Coherencia con el snapshot del plan (#84): tener sentido avisar cuando el plan cambia

**Relacionado con:** #76 (acceso a entregables/compartir desde otras vistas), #97 (notificaciones de la campana), #84 (snapshot del plan al cambiarlo)
**Prioridad:** Baja — **por valorar** (a Guillermo no le convence de momento)
**Complejidad:** Baja

---

## 104. Ingestas configurables: renombrar, horas, número de comidas y comidas personalizadas (pre-entreno…)

**Origen:** nutricionista (WhatsApp — 15 jun 2026). Engloba y amplía la #34 (renombrar "Almuerzo").

**Estado actual (VERIFICADO en código):** las comidas de un plan son **6 FIJAS** definidas por el enum `TipoComida` (`DESAYUNO, MEDIA_MANANA, ALMUERZO, MERIENDA, CENA, RECENA` — `schema.prisma:166`). Se crean automáticamente al crear el plan y **no se pueden añadir, quitar ni renombrar**:
- **Renombrar la ingesta: NO.** El título sale del tipo (traducción). Existe un campo `descripcion` libre por comida (`actualizarDescripcionComida`, `ComidaDelDia.descripcion`), pero es una **nota**, no el nombre de la ingesta.
- **Editar la hora: NO.** La hora que se ve (`comida-slot.tsx:118,199`) es un **valor por defecto fijo por tipo** (i18n `comidaSlot.horaDefault.*`); `setHora` nunca se llama, **no es editable y no se guarda** (no hay campo `hora` en el modelo ni acción que lo persista).
- **Añadir una 7ª comida / "pre-entreno": NO.** No hay acción `crearComida`/`eliminarComida` en ningún sitio. El enum **no** tiene `PRE_ENTRENO`/`POST_ENTRENO`/`SNACK`/`OTROS` (ojo: la #34 afirmaba que sí, pero el schema real solo tiene los 6 de arriba).

**Petición:** Que el nutri pueda **renombrar las ingestas**, **editar su hora**, y **añadir/quitar comidas** (ej. montar 7 comidas, con una "Pre-entreno" y otra "Post-entreno"). Como en Nutrium, que en la captura muestra una comida "PRE-ENTRENO (19 pm)".

**Tareas:**
- [ ] Nº de comidas configurable por día (añadir/quitar ingestas), no fijo en 6
- [ ] Nombre editable por ingesta (título libre: "Pre-entreno", "Tentempié"…)
- [ ] Hora editable y **persistida** por ingesta (campo `hora` en `ComidaDelDia` + acción para guardarla; hoy solo es un default visual)
- [ ] Reordenar comidas (ya existe el campo `orden`)
- [ ] Decidir modelo: ¿ampliar el enum `TipoComida` o pasar a comidas con **nombre libre + orden** (más flexible y resuelve también la #34)?
- [ ] Reflejar en: editor, generación con IA (que acepte N comidas), PDF, portal del paciente, link compartido y el checklist de comidas del seguimiento (#84)

**Impacto en los entregables (PDF / portal / compartido) — nota pedida por Guillermo:**
Estos cambios (este #104 + la planificación por tipo de día #78-B + agrupar días #75) **mueven cuánto ocupa el PDF**, así que hay que **revalidar la maquinaria de salto de página que tocamos hace poco** (no partir una comida entre páginas con `break-inside:avoid` en `tbody/tr`, y los previews que miden la altura real en `entregables-tab.tsx` y `exportar-pdf/exportar-form.tsx`):
- **Más comidas por día (7+, pre/post-entreno):** más filas → el detalle diario y el resumen semanal crecen → **más páginas**; días que hoy caben en una hoja pasarán a dos. Reverificar que el corte de página sigue sin partir comidas y que los dos previews siguen cuadrando con el PDF real.
- **Planificación por tipo de día:** ya no hay "un objetivo del plan" sino **varios objetivos (kcal/macros) en la misma semana** → decidir cómo se muestran en portada/resumen (p. ej. un objetivo por tipo de día / por grupo de columnas).
- **Agrupar días con el mismo menú:** en el resumen semanal, columnas **agrupadas** ("L-X-V") en vez de 7 repetidas → **menos repetición y menos páginas** en planes con días iguales (ventaja). Enlaza con #57 (agrupar comidas repetidas en PDF) y #37 (ocultar filas vacías).

**Archivos:** `prisma/schema.prisma` (`ComidaDelDia`/`TipoComida`), `src/app/actions/planes.ts`, `src/components/dieta/comida-slot.tsx` + editor, `src/lib/pdf/generate-plan-pdf.ts`, previews (`entregables-tab.tsx`, `exportar-form.tsx`), portal y compartido, generación IA.
**Relacionado con:** #34 (renombrar Almuerzo), #57 (agrupar comidas repetidas en PDF), #37 (filas vacías PDF), #75 (agrupar días), #78 (planificación por tipo de día), #84 (checklist de comidas)
**Prioridad:** Alta (lo piden y bloquea casos reales: deportistas con pre/post-entreno)
**Complejidad:** Media-Alta (toca modelo, editor, IA, PDF, portal y seguimiento)

---

## 105. Editor: que el buscador de alimentos NO se cierre al añadir (encadenar varios)

**Origen:** nutricionista (Instagram — 16 jun 2026, feedback muy positivo, valora "copiar alimentos restando el % en kcal"). "Cuando quieres añadir un alimento al desayuno, que no se quite la barra de búsqueda tras añadir un alimento, sino que permanezca abierta para añadir el siguiente."

**Estado actual (VERIFICADO en código):** En `selector-alimento.tsx`, `doSelect()` para la acción "agregar" llama a `onClose()` tras añadir (~líneas 165-170) → el selector se cierra y hay que reabrirlo para cada alimento. Ralentiza montar una comida con varios alimentos.

**Petición:** Que al añadir un alimento el buscador **permanezca abierto** (limpiando query y resultados) para seguir añadiendo el siguiente sin reabrirlo. Cerrar solo manualmente (botón/Esc).

**Tareas:**
- [ ] En `doSelect`, acción "agregar": NO llamar `onClose()`; limpiar `query`/`alimentos`/`recetas`/`expanded` y devolver el foco al input
- [ ] Mantener el cierre para "sustituir"/"alternativa" (acciones únicas)
- [ ] Feedback breve de que se añadió (toast o el contador de la comida), ya que el panel no se cierra
- [ ] Coherente con lo ya hecho en el panel de equivalencias (#55), donde "+ Alternativa" tampoco cierra

**Archivos:** `src/components/dieta/selector-alimento.tsx`
**Prioridad:** Alta (agiliza el flujo más repetido al montar dietas; coste bajo)
**Complejidad:** Baja

---

## 106. Importar comida de OTRO plan eligiendo en qué comida pegarla

**Origen:** nutricionista (Instagram — 16 jun 2026). "Añadiría elegir en qué comida pegar, de forma que pueda pegar el desayuno de una persona en la merienda de otra, o la merienda en la cena de otra."

**Estado actual (VERIFICADO en código):** Copiar una comida **dentro del mismo plan** YA permite elegir el tipo de comida destino (`plan-visual.tsx` `handleCopiarComida` → `conTipoDestino: true`; `CopiarADiasModal` muestra el selector de tipos). PERO **importar una comida de OTRO plan** (`ImportarPlanModal` → `copiarComidaADias(comidaOrigen, díasDestino, modo)`) **NO** pasa tipo de comida destino → se pega manteniendo el tipo (desayuno→desayuno). El caso que pide la nutri es justo entre personas distintas (otro plan).

**Petición:** Que al importar/pegar una comida de otro plan se pueda **elegir el tipo de comida destino** (pegar un desayuno como merienda, etc.), igual que ya se hace dentro del mismo plan.

**Tareas:**
- [ ] En `ImportarPlanModal`, modo "una comida": mostrar el selector de tipo de comida destino (reutilizar `SelectorDiasModo`/`CopiarADiasModal`, ya existe)
- [ ] `copiarComidaADias` debe aceptar un `tipoDestino?` opcional y aplicarlo (como la versión de copiar dentro del mismo plan)
- [ ] Por defecto, el tipo de origen (no cambiar el comportamiento si no se toca)

**Archivos:** `src/components/dieta/importar-plan-modal.tsx`, `src/app/actions/planes.ts` (`copiarComidaADias`), `src/components/dieta/copiar-comida-modal.tsx` (selector ya hecho)
**Relacionado con:** #31 (copiar comidas entre días — hecho)
**Prioridad:** Media-Alta (lo piden; el selector ya existe, solo cablearlo al importar)
**Complejidad:** Baja-Media

---

## 107. PDF: opción de NO incluir las notas (descripción) en la tabla resumen

**Origen:** nutricionista (Instagram — 16 jun 2026). "A la hora de descargar el PDF con el plan, si se pudiese poner la opción de no incluir las notas en la tabla resumen, sería perfecto."

**Estado actual (VERIFICADO en código):** En el resumen semanal del PDF (`generate-plan-pdf.ts`, sección "RESUMEN SEMANAL") se pinta la **descripción/nota de cada comida** (`comida.descripcion`, ~líneas 334/379). Las opciones de PDF (`PDFSectionOptions`) permiten incluir/excluir **secciones enteras** (portada, plan semanal, detalle diario, recomendaciones, lista de compra, cantidades, valores nutricionales), pero **NO** hay una opción fina para excluir solo las notas dentro de la tabla resumen.

**Petición:** Un toggle en las opciones del PDF para **no mostrar las notas/descripción de las comidas en la tabla resumen** (manteniendo el resto).

**Tareas:**
- [ ] Añadir opción `notasEnResumen?: boolean` (default true = como ahora) a `PDFSectionOptions`
- [ ] En la sección RESUMEN SEMANAL, ocultar la descripción de la comida cuando esté desactivada
- [ ] Añadir el toggle en los formularios de exportar PDF (nutri y paciente)
- [ ] Decidir si afecta también al detalle diario (donde la nota puede tener sentido) o solo al resumen

**Archivos:** `src/lib/pdf/generate-plan-pdf.ts`, `src/components/dieta/exportar-pdf-button.tsx`, `src/app/paciente/portal/exportar-pdf/exportar-form.tsx`, `src/components/paciente/entregables-tab.tsx`
**Relacionado con:** #4 (PDF), #37 (filas vacías PDF)
**Prioridad:** Media (mejora concreta y pedida; coste bajo)
**Complejidad:** Baja

---

## 108. Mostrar la ingesta de agua también en vasos (además de litros)

**Origen:** Antonia (nutrivibes.life, Instagram) — 17 jun 2026.

**Estado actual (VERIFICADO en código):** El agua se muestra solo en ml/litros: seguimiento del paciente (`seguimiento-tab.tsx`, campo `aguaML`), `plan-visual.tsx`, recomendaciones y el PDF del plan (en litros). No hay conversión a vasos.

**Petición:** Mostrar la recomendación/ingesta de agua también en **equivalencia aproximada de vasos** (además de litros), porque suele ser una medida más fácil de interpretar para muchos pacientes.

**Tareas:**
- [ ] Definir equivalencia de vaso (≈250 ml estándar; fijo o configurable)
- [ ] Mostrar "X L (≈ Y vasos)" en el seguimiento, en la recomendación de agua y en portal/PDF
- [ ] Solo presentación; no cambia el dato base (`aguaML`)

**Prioridad:** Media-Baja (mejora de presentación; coste bajo)
**Complejidad:** Baja

---

## 109. Pautar objetivos en g/kg de peso (proteína sobre todo), no solo %/gramos — incluida la IA

**Origen:** Antonia (nutrivibes.life, Instagram) — 17 jun 2026 ("poder configurar específicamente la proteína en g/kg de peso/día, método habitual para pautar el aporte proteico con precisión"); Lucía Hernández (LinkedIn) — 9 jun 2026 (también preguntó por la calculadora de g de proteína por kg).

**Estado actual (VERIFICADO en código):** La pestaña **Planificación** YA MUESTRA los macros en g/kg (`planificacion-por-defecto-tab.tsx`: `protGKg`/`grasaGKg`/`carbGKg`, columna "g/kg"), pero es un valor **calculado/informativo** a partir de kcal + % + peso, **no un campo donde pautar directamente en g/kg**. Y la **generación con IA** (`ia-generation-form.tsx`) solo acepta gramos absolutos / kcal, **no** g/kg.

**Petición:** Poder **introducir el objetivo** de proteína (y opcionalmente grasa/carbos) directamente en **g/kg de peso/día**, que es el método estándar en clínica/deporte, en lugar de solo por porcentajes o gramos absolutos.

**Tareas:**
- [ ] Entrada conmutable del objetivo: % / gramos / **g/kg** (calcular gramos absolutos desde el peso del paciente)
- [ ] La planificación ya muestra g/kg; falta poder **pautarlo de origen**
- [ ] Llevar g/kg también a la **generación con IA** (hoy solo gramos absolutos)

**Relacionado con:** #78 (objetivos/planificación, reparto de macros)
**Prioridad:** Media-Alta (método estándar en nutrición clínica y deportiva; lo piden Antonia y Lucía)
**Complejidad:** Media

---

## 110. Imágenes (fotos de perfil y logos PDF) a Supabase Storage en vez de base64 en la BD — bajar el egress

**Origen (19 jun 2026):** el proyecto Supabase superó la cuota de **egress** del plan gratuito (**16,2 GB / 5 GB**) y Supabase **restringió el servicio con HTTP 402** → **se cayó el login de TODA la app** (local y producción comparten el mismo proyecto Supabase `kzbrugggurcjwxsmutic`). Se resolvió subiendo a **plan Pro** (250 GB de egress). Al investigar se detectó la causa raíz.

**Causa raíz (VERIFICADO en código):** las fotos de perfil (dietista y paciente) y los logos de PDF se guardan como **base64 dentro de la base de datos**, no en almacenamiento de archivos. Cada vez que se abre una ficha, un plan, el portal o se genera un PDF, esas imágenes se transfieren **enteras desde la BD** → dispara el egress. El **File Storage de Supabase está a 0 GB** (no se usa) y la BD pesa solo 91 MB.

**Lo que YA existe (migración a Storage empezada y dejada a medias):**
- `src/lib/storage.ts`: cliente admin de Storage, buckets `profile-images` y `pdf-logos`, `uploadDietistaPhoto` / `uploadPacientePhoto` / `uploadPdfLogo`, borrados, *path builders*, y helpers `isBase64DataUrl` / `isStorageUrl` / `resolveImageUrl` + `base64ToBuffer` (anotado "for migration script").
- `src/app/actions/storage-images.ts`: server actions `subirFotoDietista` / `subirLogoPdf` / `subirFotoPaciente(AlCompletar)` que SÍ suben a Storage (validan tipo con `file-type`, rate-limit) y guardan la URL pública en `dietista.logoUrl` / `dietista.pdfLogoUrl` / `paciente.fotoUrl`.

**Lo que FALTA (por eso sigue todo en base64):** los formularios siguen llamando a la ruta VIEJA (base64):
- `src/app/(dashboard)/ajustes/foto-perfil.tsx` → `actualizarFotoDietista(dataUrl)` (`perfil.ts`, base64)
- `src/app/(dashboard)/ajustes/logo-pdf-form.tsx` → `actualizarLogoPdf(dataUrl)` (`perfil.ts`, base64)
- `src/app/paciente/portal/perfil/perfil-form.tsx` → `actualizarFotoPaciente(dataUrl)` (`paciente-auth.ts`, base64)

**Tareas:**
- [ ] Enchufar los 3 formularios a las server actions de Storage ya existentes (`subirFotoDietista` / `subirLogoPdf` / `subirFotoPaciente`) en vez de las base64. Envían `File`/`FormData`, no `dataUrl`.
- [ ] Garantizar que la LECTURA admite ambos formatos durante la transición (`resolveImageUrl` ya lo hace: base64 o URL https de Storage). Revisar que TODAS las vistas pasan por ese resolver (ficha, plan, PDF, portal, compartido, email).
- [ ] **Script de migración** de las imágenes existentes base64 → Storage (`base64ToBuffer` ya preparado): recorrer `dietista.logoUrl`/`pdfLogoUrl` y `paciente.fotoUrl`, subir a Storage y reemplazar por la URL pública. ⚠️ **BD COMPARTIDA con producción** → por lotes + backup antes + probar con transacción/rollback (igual que se hizo en #75).
- [ ] Retirar las actions base64 (`actualizarFotoDietista` / `actualizarLogoPdf` / `actualizarFotoPaciente`) cuando ya nadie las use.
- [ ] (Opcional) revisar `Alimento.imagenUrl` y adjuntos por si también inflan el egress.

**Beneficio:** baja el egress drásticamente (imágenes servidas con CDN/caché de Storage, no desde la BD), libera la BD y usa el 1 GB de Storage gratis. Evita que vuelva a pasar el 402.

**Nota:** se trabaja en **OTRA terminal** (Guillermo, 19 jun). No urgente desde que está en Pro (250 GB), pero es la causa raíz del incidente de caída.

**Relacionado con:** infraestructura / coste Supabase; `CLAUDE.md` ("Images stored as base64 data URLs directly in the database").
**Prioridad:** Alta (provocó la caída total del login; prevención de reincidencia)
**Complejidad:** Media (el código de Storage ya está hecho; falta enchufar los forms + el script de migración con cuidado en la BD compartida)

---

## 111. Histórico de dietas del paciente accesible y exportable en un informe

**Origen:** nutriciondelargadistancia (Instagram) — 19 jun 2026. "Los informes, ¿se queda el histórico de dietas para poder sacarlo en un informe? En plan dietas del último mes."

**Estado actual (VERIFICADO en código):** Los planes **NO se sobreescriben**: cada `PlanAlimenticio` se guarda con `createdAt` y un flag `activo` (solo uno activo a la vez); los antiguos quedan con `activo:false` y **se conservan en BD**. Los reportes (`reportes/[id]`) ya incluyen la evolución de medidas (peso/IMC/grasa) y el número de planes del paciente. PERO **no hay una vista de "listado de planes anteriores"** en el dashboard ni un **informe que liste las dietas de un periodo** (ej. dietas del último mes). El dato está guardado, pero no expuesto.

**Petición:** Poder consultar el histórico de dietas de un paciente y **sacarlo en un informe** (ej. "dietas del último mes").

**Tareas:**
- [ ] Vista de histórico de planes del paciente (lista de planes anteriores con fecha; poder abrir/duplicar uno antiguo)
- [ ] Incluir el histórico de dietas en un informe/PDF (planes de un periodo)
- [ ] Los datos ya están (los planes se conservan); falta exponerlos en UI e informe

**Relacionado con:** #28 (informe de composición nutricional), reportes/evolución
**Prioridad:** Media
**Complejidad:** Media

---

## 112. El paciente puede registrar la comida REAL que ha comido (autorregistro / diario), no solo marcar cumplido

**Origen:** nutriciondelargadistancia (Instagram) — 19 jun 2026. "El paciente solo tiene opción de marcar si lo ha cumplido o no, pero no he visto la forma de que meta sus recetas o platos. Si no come lo que tiene en el plan, ¿cómo puede introducir la comida real que ha hecho?"

**Estado actual (VERIFICADO en código):** En el portal, el paciente **solo puede marcar cumplido/no cumplido** las comidas de su plan (`paciente/portal/seguimiento`, checkbox `cumplido`; `guardarSeguimientoPaciente` guarda en `SeguimientoDiario`). **NO puede registrar la comida real** que ha comido si se sale del plan. El modelo `EntradaDiario` (pacienteId, fecha, tipoComida, alimentoId/recetaId, cantidad, unidad, descripcion, notas) **existe en el schema pero está SIN USAR** (no hay UI ni acción que lo cree desde el portal) — está medio cimentado pero no implementado.

**Petición:** Que el paciente pueda **introducir lo que ha comido de verdad** (sus propios platos/alimentos) cuando no sigue el plan, no solo marcar si cumplió. Así el nutri ve la ingesta real, no solo el % de adherencia.

**Tareas:**
- [ ] UI en el portal del paciente para añadir alimentos/platos a un diario (buscar alimento + cantidad, o texto libre) por comida y día
- [ ] Server action con `getCurrentPaciente` que cree `EntradaDiario` (el modelo ya existe)
- [ ] Que el nutri vea el registro real del paciente (plan vs comido) en el seguimiento
- [ ] Decidir la relación con el "cumplido/no cumplido" actual (si no cumplió → qué comió)

**Relacionado con:** #54 (saciedad/cómo le sienta cada comida), #102 (recordatorio 24h), seguimiento del paciente
**Prioridad:** Media-Alta (cierra el bucle del seguimiento: hoy solo sabes si cumplió, no qué comió realmente)
**Complejidad:** Media (el modelo `EntradaDiario` ya existe; falta UI del portal + action + vista del nutri)

---

## 113. Botón rápido +20% en el ajuste calórico del objetivo (superávit para realimentación)

**Origen:** nutricionista (Instagram) — 19 jun 2026. "En Pacientes → Planificación → Cálculos, en el objetivo del día, que el porcentaje de ajuste automático tenga también **+20%**, para pacientes desnutridos a los que a la larga hay que subir las kcal."

**Estado:** ✅ **DESPLEGADO en producción (commit `a17c3e9`, 19 jun; verificado / 307 + /login 200).** Los botones rápidos de ajuste (`AJUSTE_OPCIONES` en `planificacion-por-defecto-tab.tsx`) iban de −20% a +15% — había asimetría: el déficit llegaba a −20% pero el superávit solo a +15%. Añadido `{ value: 20, label: "+20%" }`. `tsc` OK; `ajusteObjetivoPct` se guarda sin clamp, así que el +20% se aplica y persiste bien. (El EER objetivo ya era editable a mano, pero faltaba el botón rápido.)

**Archivos:** `src/components/paciente/planificacion-por-defecto-tab.tsx`
**Prioridad:** Baja (mejora pedida; trivial) · **Complejidad:** Mínima (1 línea)

---

## 114. BUG: las citas se ven a una hora distinta (desfasada) en la AGENDA — zona horaria

**Origen:** Yasmine (nutreyas, Instagram) — 21 jun 2026. "Creo la cita el viernes a las 18:00 y me salta a las 20:00. En 'próxima consulta' sale bien, pero en la agenda sale mal."

**Causa raíz REAL (VERIFICADA en código + servidor + datos reales, 22 jun):** son DOS cosas:
1. **Guardado dependiente del TZ del entorno:** el form manda `fechaHora` como string SIN zona (`` `${fecha}T${hora}:00` ``, `agenda/nueva/page.tsx:159`). `crearCita` hacía `new Date(ese string)`, que se interpreta en el TZ de QUIEN ejecuta el server action: en **producción (servidor UTC, verificado)** "18:00" → 18:00 UTC = se ve **20:00** en Madrid (el caso de Yasmine); en **local (Mac en Madrid)** "18:00" → 16:00 UTC = 18:00 Madrid (bien). Por eso en la BD las citas son una **MEZCLA**: las creadas en local están bien y las creadas en prod están +2h (verano) / +1h (invierno). VERIFICADO con datos reales: citas a 16:00 UTC=18:00 Madrid (bien) conviven con otras a 18:00 UTC=20:00 Madrid (mal).
2. **Visualización inconsistente:** `minutosDesdeInicio` (agenda) posicionaba con `getHours` (sin Madrid) y varias vistas formateaban sin `timeZone: "Europe/Madrid"` mientras otras sí → la misma cita se veía a distinta hora según la vista.

**✅ DESPLEGADO en producción (22 jun, commit `6ec154a`; verificado / 307 + /login 200). Pendiente: confirmación de Yasmine + corregir a mano las pocas citas futuras desfasadas creadas antes del fix.**
- **Guardado unificado a Madrid:** nuevo helper `fromMadridLocalString` en `tz.ts`; `crearCita` lo usa en vez de `new Date(string)` → "18:00" se guarda SIEMPRE como 16:00 UTC, en local y en prod (en local no cambia el resultado; en prod lo corrige).
- **Filtros de rango en Madrid:** `getCitasSemana/Mes/Hoy/Dia` (`citas.ts`) con `fromMadrid`/`toMadridDateStr`.
- **Posición de la agenda en Madrid:** `minutosDesdeInicio` (`agenda-semanal.tsx` y `agenda-vista-dia.tsx`) con `toMadridTimeStr`.
- **Todas las vistas a Madrid:** `timeZone: "Europe/Madrid"` (o componentes derivados en Madrid) en modal, sidebar, mensual, día-detalle, `email-citas`, `notificaciones`, `citas-flujo` y portal del paciente (incl. el día de la semana del portal, que en prod UTC daba el día equivocado cerca de medianoche). `tsc` OK. 13 archivos, todos de citas/agenda (no toca el WIP de planificación).

**⚠️ Migración de citas existentes: NO viable de forma masiva (DESCARTADA).** Las citas son una mezcla indistinguible de bien-guardadas (local) y mal-guardadas (prod); no hay forma fiable de saber cuáles corregir. Un script masivo rompería las correctas (verificado con dry-run: quería desplazar las 901, incluidas las buenas). → Tras desplegar, las citas ya creadas mal en prod (+2h; pocas — 31 reales en total, futuras menos) se verán 2h tarde de forma consistente en TODAS las vistas; **corregirlas/reprogramar a mano las próximas afectadas**. Las pasadas dan igual. De aquí en adelante todas se guardan bien. (El seed de demo también guarda en hora-UTC → citas demo +2h; arreglar el seed aparte si se quiere la demo perfecta, no crítico.)

**Pendiente:** que Guillermo lo pruebe en local (crear cita y verla a la hora correcta en agenda/dashboard/portal) → luego desplegar (commit quirúrgico solo de los 13 archivos de citas, sin el WIP).

**Prioridad:** Alta · **Complejidad:** Media-Alta (refactor de zona horaria de toda la agenda; la migración de datos viejos queda fuera por inviable)

---

## 115. Portal del paciente: permitir eventos solapados en el horario (hoy se borra el anterior)

**Origen:** Yasmine (nutreyas, Instagram) — 21 jun 2026. "En el portal del paciente no deja poner un evento por encima de otro: trabajo 09:00-15:00 + almuerzo 10:00-11:00; si pongo el almuerzo, se borra el de trabajo."

**Causa raíz (VERIFICADA en código):** En `src/components/paciente/horario/horario-paciente.tsx` (~línea 156), al guardar se hace `resto = resto.filter(b => !bloquesOverlap(b, nuevo))` → cualquier bloque que solape con el nuevo se ELIMINA (solapar = sobrescribir). No hay forma de tener dos eventos a la vez en la misma franja.

**Solución:**
- [ ] Permitir bloques solapados (no borrar el que solapa al añadir otro)
- [ ] Render del horario semanal que muestre los solapados en paralelo (apilar/columnas, como ya hace `layoutCitasDia` en la agenda del nutri)
- [ ] No toca BD (el horario ya se guarda como Json)

**Relacionado con:** #30 (editar horario del paciente)
**Prioridad:** Media (caso habitual: eventos dentro de la jornada) · **Complejidad:** Media (lógica + render de solapamiento)

---

## 116. Horario del nutri: excepciones puntuales por fecha (festivos / cambios de una semana)

**Origen:** Yasmine (nutreyas, Instagram) — 21 jun 2026. "Tengo consulta de 16:00-20:00 pero esa semana es festivo martes y miércoles; tengo que borrar el horario y rehacerlo la semana siguiente. No deja modificar semanalmente ni puntualmente."

**Causa raíz (VERIFICADA en código):** `horarioLaboral` (`Dietista.horarioLaboral` Json; estructura en `src/app/actions/horario-laboral.ts` ~línea 16: `DiaLaboral { dia, activo, intervalos }`) es **100% recurrente por día de la semana**, sin concepto de fecha ni excepción. El editor (`horario-laboral-editor.tsx`) solo permite la rejilla semanal. No hay forma de marcar un festivo o un cambio puntual de una semana concreta.

**Petición:** Poder añadir **excepciones por fecha** (festivos / días sin consulta / cambios puntuales) sin tocar el horario recurrente; y que el cálculo de huecos libres respete la excepción esa fecha.

**Tareas:**
- [ ] Extender la estructura: `{ dias: DiaLaboral[], excepciones?: { fecha, intervalos? }[] }` (Json, sin migración dura)
- [ ] UI: añadir/quitar excepciones por fecha (calendario), aparte de la rejilla recurrente
- [ ] Cálculo de huecos/disponibilidad: aplicar la excepción de la fecha con prioridad sobre el recurrente
- [ ] Reflejar en la agenda y en la reserva de cita del paciente

**Prioridad:** Media (lo piden; molesto cada festivo) · **Complejidad:** Alta (estructura + UI de calendario + lógica de huecos con prioridad fecha > recurrente)

---

## 117. Módulo de entrenamiento / rutinas para el cliente (POR VALORAR — fuera del core de nutrición)

**Origen:** Jesús (jesusmnutricion, Instagram) — 22 jun 2026. "Si quisiera hacer un entrenamiento para un cliente, ¿se puede?"

**Estado actual (VERIFICADO en código):** NO existe. Annonia es de nutrición; solo se registra el ejercicio realizado en el seguimiento diario del paciente (tipo, minutos, kcal, distancia). No hay forma de CREAR rutinas/planes de entrenamiento (ejercicios, series, repeticiones, cargas) para el cliente, ni modelos asociados.

**Petición:** Poder montar planes de entrenamiento para el cliente, además de la dieta (muchos nutricionistas trabajan también el entrenamiento, o son nutri-entrenadores).

**⚠️ POR VALORAR (decisión de producto / scope):** es un módulo GRANDE y fuera del core de nutrición. Decidir si Annonia entra en entrenamiento o se mantiene enfocada solo en nutrición. Recoger si lo piden más profesionales antes de invertir. Si se hace: modelo de rutina (días → ejercicios → series/reps/peso), editor, vista del cliente en el portal y PDF.

**Prioridad:** Por valorar (depende del scope del producto) · **Complejidad:** Alta (módulo nuevo completo)

---

## 118. Actividad física en la anamnesis: lista de actividades con su frecuencia (no un campo de texto)

**Origen:** nutricionista (WhatsApp, +34 642 53 00 93 — 22 jun 2026; feedback muy positivo: "interfaz muy moderna, práctica, no se queda colgada"). Lleva pacientes con varias actividades (pesas, natación, running) y quiere registrarlas por separado con su frecuencia.

**Estado actual (VERIFICADO en código):** En la anamnesis, "Actividad física y estilo de vida" es un **campo de TEXTO único** (`personal.actividadFisica: string`, `ficha-informacion-types.ts:39`). En cambio, el historial médico (medicamentos, alergias, patologías, suplementos…) SÍ son **listas escalables** (`Paciente.medicamentos String[]` etc., línea 201-218 del schema; se pintan con `TagLine` + botón de añadir). Por eso el nutri ve el "botón +" en medicamentos pero no en actividad física.

**Petición:** Aplicar el mismo patrón de **lista escalable (botón "+")** a la actividad física: poder añadir **varias actividades**, cada una con su **frecuencia/horas** (ej. natación 3 h/sem, running 6 h/sem), y que se vean divididas, no todo en un mismo texto.

**Input adicional (Helena Rodríguez, 9 jul 2026) — VERIFICADO:** pide que el **nivel de actividad de base** (sedentario / activo / muy activo) sea un campo **independiente del deporte** que practica (fútbol, tenis, gym…). Matiz técnico: en el **formulario clásico** de crear paciente YA están separados (`nivelActividad` como select + `tipoEjercicio` aparte, `paciente-form.tsx:518-553`). Pero en la **anamnesis** el "nivel de actividad" NO existe como campo propio: está fundido en el textarea libre `actividadFisica` (`anamnesis-plantillas.ts:137`), y la plantilla Deportiva lo mezcla en "Deporte / disciplina y nivel" (`:278`). → Al rehacer la actividad física de la anamnesis, separar el nivel de base (selector) del deporte/lista de actividades.

**Tareas:**
- [ ] Modelar la actividad física como lista: cada ítem = actividad + frecuencia (h/sem o sesiones/sem). Decidir si `String[]` simple ("Natación · 3 h/sem") o estructura `{actividad, frecuencia}`
- [ ] UI con el patrón de añadir/quitar de los medicamentos (input + botón, tags/filas)
- [ ] Migrar/compatibilizar el `actividadFisica` de texto actual
- [ ] Reflejar donde se use (anamnesis, PDF; y posible uso en el cálculo del gasto si aplica)

**Relacionado con:** #18 (anamnesis personalizable), registro multi-actividad del seguimiento (#9)
**Prioridad:** Media (mejora concreta; el patrón ya existe en la app) · **Complejidad:** Baja-Media

---

## 119. Recordatorios diarios personalizables para el paciente (beber agua, preparar comidas…)

**Origen:** Carmen Florensa (review en PDF, 23 jun 2026). "¿Está en los planes un sistema de alertas o recordatorios diarios personalizables (por ejemplo, recordar beber agua o preparar las comidas del día siguiente)?"

**Estado actual (VERIFICADO en código):** NO existe. Las notificaciones al paciente (`TipoNotificacion`) son **solo de citas** (CITA_HOY, CITA_CONFIRMADA…) y eventos puntuales; **no hay recordatorios diarios recurrentes ni configurables**, ni cron/push para ello, ni preferencias de recordatorio en el modelo `Paciente`. (Distinto del aviso de cita #74 y del R24h de la anamnesis #102.)

**Petición:** Recordatorios diarios que el nutri (o el paciente) configure: beber agua, tomar suplementos, preparar las comidas del día siguiente, registrar el seguimiento… enviados por push/notificación in-app (y opcionalmente email/WhatsApp).

**Tareas:**
- [ ] Modelo de recordatorio (texto, hora/frecuencia, destinatario, activo) por paciente o por defecto del nutri
- [ ] Programación recurrente (cron/scheduler) — evaluar coste e infraestructura
- [ ] Canal: notificación in-app (campana del portal) y/o email; WhatsApp más adelante (enlaza con #74)
- [ ] UI para configurarlos (el nutri los pauta; el paciente quizá ajusta los suyos)
- [ ] Recordatorio de cumplimiento del seguimiento (que el paciente no olvide registrar)

**Relacionado con:** #65 (cumplimiento de suplementos), #74 (avisos por WhatsApp), #54 (registro del paciente)
**Prioridad:** Media (mejora de adherencia del paciente) · **Complejidad:** Media-Alta (programación recurrente + canales + config)

---

## Bug a revisar · Acceso al portal con email duplicado

**Estado (VERIFICADO en código):** Al crear el acceso del paciente al portal ("Crear contraseña" → `crearAccesoPaciente`, o "Enviar por email" → `enviarAccesoPortal`), si el email ya lo usa OTRO paciente para su portal, el `prisma.accesoPaciente.upsert` falla por el constraint `email @unique` y **revienta con el overlay rojo** en vez de avisar con un toast claro.

**Arreglo propuesto:** antes del upsert, comprobar si existe otro `AccesoPaciente` con ese email (pacienteId distinto) y devolver un aviso amable ("Ese email ya lo usa otro paciente para su portal"), patrón `{ ok:false, error }` sin throw. Aplica a `email.ts` (enviarAccesoPortal) y `paciente-auth.ts` (crearAccesoPaciente).

**Prioridad:** Media (no rompe datos; es UX del error) · **Complejidad:** Baja

---

## 120. BUG CRÍTICO: altas de nutricionistas atascadas en la verificación de email

**Origen:** casos de soporte reales — Violeta (6 jul 2026), Helena (6 jul 2026) y "varias cuentas más". **Bloquea altas de nuevos nutris → pérdida directa de conversión.**

**Síntoma:** el nutri no puede entrar; le sale "Debes verificar tu email antes de iniciar sesión", pero el enlace caducó o no lo ve; al registrarse de nuevo, "el correo ya está en uso" pero no le deja rehacerlo → **cuenta atascada sin salida.**

**Causa raíz (VERIFICADA en código + BD + API de Resend, 6 jul 2026):**
- El registro (`registro.ts:77-163`) NO usa `supabase.auth.signUp`: hace INSERT crudo en `auth.users`/`auth.identities` (email sin confirmar) y envía un **email de verificación propio** (JWT, `verify-email.ts`) por Resend. Por eso `confirmation_sent_at` de Supabase siempre es null (normal, no es el bug).
- **El enlace de verificación caduca a las 24h** (`verify-email.ts:15`, `setExpirationTime("24h")`). Quien tarda (vacaciones, no ve el email) → "enlace expirado" → atascado (caso Violeta).
- **El re-registro no limpia bien el registro a medias:** `verificarEmailDisponible` (`registro.ts:36-75`) intenta borrar el `auth.users` no confirmado, pero los DELETE van con `.catch()` silencioso; si fallan (FK de sesiones), devuelve "disponible" igual y el INSERT choca con el UNIQUE de email → "email en uso" sin salida.
- **`mailer.ts:46-58` NO comprueba el error de Resend** (el SDK no lanza excepción, devuelve `{error}`): si un envío falla, `registrarCuenta` cree que fue bien, NO hace rollback → queda un `auth.users` huérfano (sin confirmar, sin fila en `dietistas` — que solo se crea tras un login verificado, `auth.ts:23-130`).
- El dominio annonia.com **SÍ está verificado en Resend** (comprobado: sending enabled) → los emails pueden salir; el problema es la caducidad + limpieza frágil + falta de reenvío, no el envío en sí.

**FIX (DESPLEGADO — commit `94803f4`, 7 jul 2026):**
- [x] **Ampliar el TTL del enlace** de 24h a 7 días (`verify-email.ts:15`) + textos i18n (es/pt)
- [x] **Botón "reenviar email de verificación"** en el login (`login/page.tsx`): cuando sale "verifica tu email", aparece un aviso con botón que regenera el JWT y reenvía (server action `reenviarVerificacion`, sin revelar si el email existe, con rate limit)
- [x] **Re-registro robusto:** `verificarEmailDisponible` limpia el `auth.users` SIN confirmar dentro de un try/catch; si el borrado falla, devuelve un error claro en vez de "disponible" falso (que dejaba el "email en uso" sin salida)
- [x] **Comprobar el error de Resend** en `mailer.ts` (`if (error) throw`) → `registrarCuenta` hace rollback del `auth.users`/`identities` si el email no sale, y devuelve error claro (no un "revisa tu email" falso)
- Nota: `EMAIL_FROM` no hizo falta tocarlo (el mailer ya usa un `DEFAULT_FROM` con el dominio verificado).

**Cuentas ya afectadas:** Violeta y Helena desatascadas manualmente el 6 jul 2026 con `UPDATE auth.users SET email_confirmed_at = NOW()` (entran con su contraseña; el primer login crea la ficha). `verificar-dietista.ts` NO sirve (marca `verificado` en `dietistas`, pero estas cuentas ni tienen fila ahí). Si vuelve a aparecer otra, mismo UPDATE o el nuevo botón de reenviar.

**Prioridad:** ⭐ CRÍTICA (bloquea altas = pérdida de conversión) · **Complejidad:** Media · **Estado:** ✅ DESPLEGADO

**AMPLIACIÓN — mismo patrón en "olvidé mi contraseña" (DESPLEGADO, commit `faba283`, 7 jul 2026):** salió un segundo caso (Violeta): pedía recuperar contraseña y el enlace no le llegaba. Causa raíz idéntica: `recovery.ts` (`solicitarRecuperacion`) buscaba al usuario **solo en la tabla `dietistas`**, pero esa fila se crea de forma perezosa en el primer login verificado; una cuenta que aún no ha entrado nunca (todas las "atascadas") no está ahí → devolvía `{ok:true}` sin enviar nada (y la UI decía "si existe la cuenta recibirás el enlace"). Fix: (1) si no hay fila en `dietistas`, buscar el usuario en `auth.users` y usar ese `authId`; (2) al resetear la contraseña desde el enlace, confirmar el email si estaba sin confirmar (`email_confirmed_at = COALESCE(...)`) → desatasca la cuenta del todo. **Lección para el catálogo de bugs:** cualquier flujo que dependa de la fila `dietistas` (creación perezosa) debe contemplar cuentas que solo existen en `auth.users`.

---

## 121. Composición nutricional ampliada: perfil de aminoácidos y desglose de grasas

**Origen:** reunión con una universidad (vía Guillermo, 7 jul 2026). Petición de mayor rigor científico en la composición de los alimentos, con respaldo académico.

**Estado actual (verificado en `prisma/schema.prisma`):** el modelo `Alimento` tiene macros (`proteinas`, `carbohidratos`, `grasas` totales, `fibra`) + un buen set de micronutrientes (vitaminas y minerales). **NO tiene:** perfil de aminoácidos, desglose de grasas (saturadas / monoinsaturadas / poliinsaturadas / trans / colesterol), ni desglose de azúcares dentro de los carbohidratos.

**Petición:**
- **Aminoácidos con más detalle:** añadir el perfil de aminoácidos (mínimo los 9 esenciales: histidina, isoleucina, leucina, lisina, metionina, fenilalanina, treonina, triptófano, valina). La universidad pidió apoyarse en **una base de datos concreta cuyo nombre hay que confirmar** — sonaba a "GEPCAT" o similar, Guillermo no lo recordaba con seguridad (confirmar en la próxima reunión). Candidatas reales con aminoácidos completos: **USDA** (perfil de aminoácidos muy completo), BEDCA (parcial), EuroFIR.
- **Grasas con más detalle:** desglosar las grasas en saturadas, monoinsaturadas, poliinsaturadas, trans y colesterol — **en general en todos los alimentos**, no solo en algunos.

**Tareas:**
- [ ] Confirmar con la universidad el **nombre exacto de la base de datos** de aminoácidos y si tienen acceso/licencia o es pública
- [ ] Ampliar el modelo `Alimento`: campos de grasas (`grasasSaturadas`, `grasasMonoinsaturadas`, `grasasPoliinsaturadas`, `grasasTrans`, `colesterol`), `azucares`, y perfil de aminoácidos (columnas o JSON `aminoacidos`)
- [ ] Poblar esos campos desde una tabla oficial (USDA/BEDCA/la que confirme la universidad) — enlaza con #15 (BEDCA) y #1 (tablas por país). Los ~3000 alimentos actuales en su mayoría no traen estos datos → **mostrar solo si hay dato** (no inventar; regla del catálogo de bugs)
- [ ] Mostrarlos en la ficha del alimento, el editor y el informe de análisis nutricional de la dieta (#73/análisis)
- [ ] Permitir al nutri rellenarlos al crear/editar un alimento propio

**Aclaración (Guillermo, 10 jul 2026):** esto NO es una feature aislada — va **de la mano de "añadir más alimentos / integrar bases de datos oficiales"** (#1, #15): al traer alimentos de USDA/BEDCA/etc. vienen ya con los aminoácidos y las grasas desglosadas, así que ampliar la composición y ampliar el catálogo son el mismo trabajo. Además pide un **filtro/etiqueta por base de datos de origen** en el buscador de alimentos ("poder buscar/ver según de qué base viene cada alimento"), que enlaza con la tarea de **mostrar la fuente/origen del alimento**. En resumen, tres piezas encadenadas: (1) integrar tablas oficiales completas, (2) guardar y mostrar sus campos extra (aminoácidos, grasas, azúcares), (3) filtro por fuente en el buscador.

**Relacionado con:** #15 (BEDCA), #41 (búsqueda por micronutriente), #1 (tablas por país), tarea de fuente/origen del alimento, informe nutricional del plan
**Prioridad:** Media (petición académica; aporta rigor y credibilidad ante universidades/profesionales) · **Complejidad:** Media-Alta (ampliar modelo + conseguir y poblar datos fiables)

---

## 122. Alimentos sostenibles / huella ambiental (filtro "eco-friendly") — a futuro

**Origen:** Guillermo (idea de la reunión con la universidad, 7 jul 2026). Explícitamente marcada como **"a futuro"**.

**Estado actual:** no existe ningún dato de sostenibilidad ni huella ambiental en el modelo de alimentos.

**Petición:** poder marcar los alimentos por su **impacto ambiental** y ofrecer un **filtro "eco-friendly"** (alimentos sostenibles / respetuosos con el medio ambiente), para poder montar dietas más sostenibles.

**Tareas (a futuro / por valorar):**
- [ ] Definir la métrica: huella de carbono (kg CO₂eq/kg), huella hídrica, o una **etiqueta simple** (impacto bajo/medio/alto) más fácil de comunicar
- [ ] Buscar un dataset de huella ambiental de alimentos. Candidato fuerte: **Agribalyse** (Francia) — combina composición nutricional Y huella ambiental (LCA) en el mismo alimento; también Poore & Nemecek (2018), SU-EATABLE LIFE
- [ ] Campo(s) en `Alimento` para el impacto ambiental
- [ ] Filtro y etiqueta visual en el buscador de alimentos / recetas

**Relacionado con:** #121 (Agribalyse traería de paso composición ampliada), #66 (etiquetas de recetas)
**Prioridad:** Por valorar (fuera del core, a futuro) · **Complejidad:** Alta (conseguir y mantener datos fiables de LCA)

---

## 123. Valoración de la frecuencia de consumo (cuestionario CFCA / FFQ)

**Origen:** reunión con una universidad (vía Guillermo, 7 jul 2026). **Pendiente de concretar con Claudia** (Guillermo lo señaló expresamente: "eso hay que hablarlo con Claudia").

**Estado actual:** la anamnesis (#6) recoge datos del paciente (hábitos, patologías, alergias…), pero **no existe** un cuestionario estructurado de frecuencia de consumo de alimentos del que derivar/orientar la pauta.

**Petición:** añadir una **"valoración de frecuencia de consumo"** — el instrumento clínico/epidemiológico estándar **Cuestionario de Frecuencia de Consumo Alimentario (CFCA / FFQ, *Food Frequency Questionnaire*)**: se pregunta al paciente **cada cuánto consume (o compra)** distintos alimentos o grupos (a diario, X veces/semana, X veces/mes, rara vez, nunca) y, a partir de esas respuestas, se **orienta el diseño de la dieta** (alimentos habituales, excesos y déficits del paciente).

**Tareas:**
- [ ] **Definir el cuestionario con Claudia:** qué grupos de alimentos incluir y qué escala de frecuencia usar (veces/día · /semana · /mes · nunca), y cómo se traduce en la pauta
- [ ] Modelar el cuestionario: plantilla + respuestas por paciente (integrado en la anamnesis o como sección propia)
- [ ] Que el nutri —y opcionalmente la IA (#44/#3)— use las respuestas para orientar la pauta (detectar patrones, alimentos habituales, excesos/carencias)
- [ ] Posible informe/entregable con la valoración

**Cómo funciona y cómo encajarlo (investigado, 10 jul 2026):**
- **Formato estándar (tipo Willett):** una lista de alimentos/grupos (versión corta ~30-50 ítems; completa 100-150) y, por cada uno, una **escala de frecuencia** con categorías fijas: nunca o <1/mes · 1-3/mes · 1/sem · 2-4/sem · 5-6/sem · 1/día · 2-3/día · 4+/día. Opcionalmente una **ración de referencia** (pequeña/media/grande). No busca el gramaje exacto, sino el **patrón habitual** de consumo.
- **Para qué sirve:** detectar excesos/carencias y los alimentos que el paciente ya consume → orientar la pauta (y de paso alimentar el prompt de la IA, #44/#3).
- **Ubicación recomendada → sección propia ESTRUCTURADA, no texto libre.** Lo natural es montarlo sobre el **motor de plantillas de anamnesis (#18)**: un tipo de bloque "frecuencia de consumo" con filas (alimento/grupo + selector de frecuencia), en vez de meterlo en un textarea. Así se puede **rellenar desde el portal del paciente** como parte de la pre-consulta (#6) —idealmente con aprobación del nutri antes de incorporarlo— o por el nutri en consulta, y dejar un resumen en la ficha. Respuesta a la duda de Guillermo ("¿anamnesis o aparte?"): **dentro del ecosistema de la anamnesis pero como bloque propio estructurado**, no como campo suelto.
- **Contenido clínico a validar** con Claudia y/o Helena (antropometrista): qué grupos de alimentos entran y qué escala exacta usar.

**Relacionado con:** #6 (anamnesis / pre-consulta), #18 (plantillas de anamnesis), #44/#3 (IA de dietas)
**Prioridad:** Media (instrumento clínico estándar, con respaldo académico) · **Complejidad:** Media-Alta · **Pendiente:** definir el cuestionario con Claudia antes de implementar

---

## 124. Panel admin: gestionar "cuentas incompletas" (registradas pero sin verificar) + reenviar link de confirmación

**Origen:** Guillermo + un colaborador (8 jul 2026), a raíz de los casos recurrentes de altas atascadas (Violeta, Helena, Gabriela Martins…). Textual: "Debería haber algo como *cuenta incompleta* cuando buscas, porque aquí no salen, y debería poner incompleta y poder modificarla. O volver a poder mandar el link de confirmación."

**Estado actual (verificado en código + BD, 8 jul 2026):** el buscador del admin lista la tabla `dietistas`. Las cuentas que se registraron pero **aún no han verificado el email** viven **solo en `auth.users`** (sin fila en `dietistas`, que se crea de forma perezosa en el primer login verificado) → **no aparecen en el admin**. Guillermo no puede verlas, ni reenviarles el enlace, ni activarlas: hoy las resuelve a mano por SQL o borrándolas.

**Diagnóstico de fondo (datos duros, 8 jul 2026):** de **349 cuentas, 18 sin verificar (~5 %)**. Los emails de verificación **SÍ se envían y se entregan** (Resend: 99/100 `delivered`; el único `bounced` fue un email mal escrito, `gmail.con`). Es decir, **NO es un fallo de envío** — el dominio está verificado en Resend, con DKIM + SPF (vía `send.annonia.com`) + DMARC `p=none` correctos. Los usuarios no ven el correo (spam/pestañas) o el enlace caducó (histórico; mitigado por #120). Lo que falta es la **herramienta operativa** para rescatar esas cuentas.

**Tareas:**
- [x] En el admin, listar también las **cuentas incompletas** (`auth.users` con `email_confirmed_at IS NULL` y sin fila en `dietistas`), con etiqueta visible **"Sin verificar"**
- [x] Que aparezcan al **buscar** (por email/nombre/apellidos del `raw_user_meta_data` de `auth.users`, no solo por la tabla `dietistas`) — `fetchCuentasIncompletas` en `admin.ts`
- [x] Botón **"Reenviar verificación"** (`reenviarVerificacionAdmin`, regenera el token del #120)
- [x] Botón **"Activar"** (`activarCuentaAdmin` → `UPDATE auth.users SET email_confirmed_at = NOW()`), sin borrar (entra con su contraseña; la ficha se crea al primer login)
- [x] **Corregir el email** (typos tipo `gmail.con` → `gmail.com`) antes de reenviar — `corregirEmailCuentaIncompleta`
- [x] Botón **"Eliminar"** la cuenta incompleta (`eliminarCuentaIncompleta`, solo si no tiene ficha)
- [x] **Aviso post-registro:** pantalla de confirmación tras darse de alta con "revisa spam/promociones" + botón reenviar (antes solo un toast fugaz y redirect)
- [ ] **Pendiente:** avisar de typos de dominio comunes en el propio registro (`gmail.con`, `hotmial`, `outook`…) antes de enviar (de momento se corrigen desde el admin)
- [ ] **Pendiente (entregabilidad, futuro):** subir DMARC de `p=none` a `p=quarantine` tras monitorizar; considerar remitente distinto de `noreply@` (peor reputación)

**Relacionado con:** #120 (raíz de las altas atascadas: cuentas en `auth.users` sin ficha), #6 (anamnesis)
- [x] **Filtro "Sin verificar"** en la barra de filtros del panel (junto a Instagram, LinkedIn…) para encontrarlas rápido (commit `522f2ab`)

**Prioridad:** Alta (recurrente; genera trabajo manual y fricción con nutris nuevos = pérdida de conversión directa) · **Complejidad:** Media · **Estado:** ✅ DESPLEGADO (commits `6c582ef` + `522f2ab`, 8 jul 2026) salvo los 2 "Pendiente" de arriba. **Nota bug:** el primer deploy no mostraba nada porque el JOIN `dietistas."authId" = auth.users.id` fallaba (`text = uuid`); arreglado con `u.id::text`. El apartado se llama **"Nutricionistas"** en la UI (ruta `/admin/dietistas`).

---

## 125. BUG (visual): los ingredientes de las recetas se cortan (truncate CSS)

**Estado:** ✅ **DESPLEGADO en producción (commit `540175c`, 20 ago 2026).** Primer PR del colaborador externo (PR #135, issue #112): se quitan los `truncate` de los tres puntos donde se cortaba el nombre del ingrediente y se añade `flex-wrap` para que los indicadores de macros y los controles se recoloquen en pantalla estrecha. Entrada añadida en `/novedades`.

**Origen:** Helena Rodríguez (WhatsApp, 9 jul 2026): "En las recetas, los alimentos de la lista de ingredientes, muchos no se terminan de ver."

**Causa (VERIFICADA en código):** el nombre del ingrediente vive en una columna `flex-1 min-w-0` con la clase **`truncate`** (`overflow-hidden` + `text-overflow: ellipsis` + `whitespace-nowrap`) y al lado lleva badges de macros `shrink-0`; en columnas estrechas el nombre se corta con "…". Ocurre en 4 sitios:
- `src/components/receta/ingredientes-lista.tsx:97` — ficha de receta `/recetas/[id]` (grid a 2 columnas → el corte principal)
- `src/components/dieta/selector-alimento.tsx:565` — lista de ingredientes de la receta en el selector del plan (unida por comas, una sola línea con `truncate`)
- `src/components/ingrediente-list.tsx:117` — formulario crear/editar receta
- `src/components/food-hover-card.tsx:258` — **(cuarto sitio, detectado el 20 ago 2026 al revisar el PR; NO estaba en este inventario ni en el issue #112)** tarjeta flotante al pasar el ratón por el nombre de una receta del plan: la lista de ingredientes va en `<li className="truncate">` dentro de un ancho fijo `w-72` (~264 px útiles a 12 px de letra). La usan `alimento-card.tsx` y `plan-visual.tsx`, así que se ve en más pantallas que los otros tres juntos: editor de dietas, ficha del paciente, plantillas, portal del paciente y enlace compartido. Ya limita a 6 ingredientes con "+N más", así que el corte es solo horizontal

**Fix:** permitir wrap del nombre (quitar `truncate`/`whitespace-nowrap`, o usar `line-clamp-2` + atributo `title` con el nombre completo) y que los badges de macros puedan bajar de línea en vez de aplastar el nombre. Solo CSS.
**Prioridad:** Media (afecta la legibilidad de todas las recetas) · **Complejidad:** Baja · **Estado:** ✅ DESPLEGADO (commit `540175c`, 20 ago 2026) — PR #135 de Gonzalo, el primero del colaborador externo. Cubre los **4** sitios: el cuarto (la tarjeta flotante `food-hover-card.tsx`) no estaba en el inventario ni en el issue y se le pidió al revisar el PR.

---

## 126. BUG: el reescalado de equivalencias APLASTA las cantidades (todas acaban con el mismo gramaje)

**Origen:** Helena Rodríguez (WhatsApp, 9-10 jul 2026). Primera versión del reporte: "si editas los gramos del alimento principal no se recalculan". Aclaración posterior (clave): estaba **creando un plan nuevo desde 0** (NO una plantilla), el toast "equivalencias recalculadas" **SÍ le salía**, y: "se recalculan pero te salen mal los valores… si los tengo cuadrados y luego cambio los gramos del principal **me sale el mismo gramaje en todos los otros alimentos equivalentes**". **Confirmación final (10 jul):** "si en el principal cambiaba los gramos a, por ejemplo, 100 g, **todos los alimentos equivalentes pasaban a 100 g**" — es decir, las equivalencias acaban clavadas AL VALOR DEL PRINCIPAL, que es exactamente lo que predice el diagnóstico de abajo (el paso intermedio "1" del tecleo las aplasta al clamp de 1 g = el principal en ese instante, y desde ahí el reescalado proporcional las mantiene idénticas al principal: 1→10→100).

**Causa raíz (DIAGNOSTICADA en código, 10 jul 2026):** el reescalado incremental se encadena sobre los **valores intermedios del input** y sus redondeos/mínimos destruyen las proporciones:
- El input de cantidad dispara el guardado con **debounce de 500 ms sobre cada valor intermedio** (`alimento-card.tsx:323-329` → `handleCantidadChange` → `actualizarCantidadAlimento`). Si el nutri borra el campo y teclea "150" con pausas ("1" … "15" … "150"), se ejecutan varios guardados encadenados.
- El servidor reescala las alternativas proporcionalmente (`planes.ts:484-496`) pero persiste con **`Math.round` a gramos enteros y `Math.max(1, …)` (mínimo 1 g)** (recetas: mínimo 0,5 raciones en pasos de 0,5).
- Secuencia destructiva (ejemplo real): principal 100 g, equivalencias 30/60/90 g → guardado intermedio `100→1` (factor 0,01) aplasta TODAS al clamp: 1/1/1 (información perdida, irreversible) → `1→15`: 15/15/15 → `15→150`: **150/150/150 = "el mismo gramaje en todos"**, con el toast saliendo cada vez. Sin valores intermedios (cambio limpio 100→150 de una vez) el reescalado es correcto — por eso no se detectó antes.
- Matemática del fix: los factores encadenados son telescópicos ((1/100)×(15/1)×(150/15) = 150/100) → **si no se redondea/clampa al persistir, el resultado final es exacto aunque haya pasos intermedios**. El error lo introducen SOLO el round a enteros + el clamp de 1 g en cada paso.

**Fix (DESPLEGADO — commit `62555ae`, 10 jul 2026):**
- [x] **No reescalar con valores intermedios del tecleo:** nueva prop `commitOnly` en `CantidadInput` (`cantidad-input.tsx`) que emite al padre SOLO al confirmar (blur/Enter), no en cada tecla. El input de cantidad del principal la activa cuando el ítem tiene alternativas (`alimento-card.tsx`). Así el reescalado (`planes.ts:484-496`) corre una vez con el valor final. Opt-in: el resto de usos de `CantidadInput` no cambian.
- [ ] (No hecho — no hizo falta) Persistir alternativas con decimales / clamp 0,1 en el servidor: se descartó para no arriesgar el redondeo de unidades discretas; con el fix del input ya no hay cadena que degradar. Queda como posible endurecimiento futuro si reaparece.
- [ ] (Aparte, sigue pendiente) En el **constructor de plantillas** las equivalencias no se soportan (`plan-editor.tsx:524`, `:908-910`) — limitación distinta, no este bug.

**Prioridad:** Alta (corrompía en silencio las equivalencias "cuadradas"; afectaba al editor normal de planes) · **Complejidad:** Media · **Estado:** ✅ DESPLEGADO (commit `62555ae`)

---

## 127. Navegación: al ver/editar un plan desde un paciente, el menú lateral salta a "Dietas" (pierdes la sensación de estar en el paciente)

**Origen:** nutricionista (vídeo, +34 727 77 19 93 — 2 jul 2026). "Si trabajo en el plan de alimentación tengo que seguir dentro del perfil del paciente; no entiendo por qué se me va a un apartado diferente. Es un coñazo tener que salirme y volver a entrar en el paciente."

**Estado (VERIFICADO):** todo el flujo de planes vive bajo `/dietas/*` y el sidebar (`src/components/sidebar.tsx:238-243`) marca activo con `pathname === href || pathname.startsWith(href+"/")`. Con `/dietas/[id]`, `/dietas/[id]/editar` o `/dietas/nuevo` resalta **"Dietas"**, no "Pacientes". Al *crear* un plan, al terminar ya redirige de vuelta a la ficha (`planes.ts:166` → `/pacientes/[id]?pestana=plan-alimentacion`); el salto molesto es sobre todo al **ver/editar**. Toda dieta pertenece SIEMPRE a un paciente (no hay dietas huérfanas).

**Solución (la "falsa percepción" que pide Guillermo, SIN mover rutas):**
- [ ] En `sidebar.tsx` (`isActive`, ~:238-243): tratar las rutas de **detalle** de dieta (`/dietas/[id]`, `/dietas/[id]/editar`, `/dietas/nuevo`) como contexto "Pacientes" → resaltar **Pacientes**; reservar "Dietas" solo para el índice (`/dietas`, `/dietas/plantillas`). **Un solo punto de cambio.** (Alternativa más fiel a "solo cuando vengo del paciente" pero más frágil: marcador `?pacienteId`/`?ctx=paciente` leído con `useSearchParams` y propagado en los enlaces de ver/editar — requiere `<Suspense>` y tocar varios enlaces.)
- [ ] (Nice to have) el editor ya conoce `plan.pacienteId` (`getPlan`): un botón/breadcrumb "← volver al paciente" visible en el editor de dieta refuerza la sensación.

**Prioridad:** Media (fricción diaria; barato) · **Complejidad:** Baja

---

## 128. Guardar como preferencia del nutri qué secciones lleva el PDF (hoy hay que remarcarlas en cada envío)

**Origen:** nutricionista (+34 727 77 19 93 — 2 jul 2026, **reiterado 14 jul**). "Cada vez que mando un plan tengo que marcar esa casilla porque no se queda marcada. Que las selecciones se guarden para todos los pacientes; y si en uno quieres cambiarlo, lo cambias puntualmente." Matiz: debe recordar tanto lo que **marca** como lo que **desmarca** ("si no quiero que aparezca, lo desmarco y que no lo haga la próxima vez"). Que lo haya repetido = le molesta de verdad; sube la señal de prioridad.

**Estado (VERIFICADO):** las casillas de "Contenido del PDF" (Portada, Plan semanal, Cantidades en resumen semanal, Detalle diario, Recomendaciones, Lista de la compra, Valores nutricionales) están en `src/components/paciente/entregables-tab.tsx` como **estado local `useState`** inicializado siempre desde la constante `PDF_OPTIONS_DEFAULT` (`:59-67`, init en `:312-316`). **No se persisten** (ni BD, ni localStorage) → se reinician a los defaults en cada apertura de la ficha.

**Solución (hay patrón ya montado):** `Dietista` ya guarda preferencias por nutri (tema/logo del PDF; y un JSON `notifPreferencias` con getter/setter `getNotifPreferencias`/`setNotifPreferencias`, `notificaciones.ts:585-610`).
- [ ] Añadir campo `pdfSeccionesDefault Json?` a `Dietista` (migración SQL `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`).
- [ ] Getter/setter por dietista al estilo de `notifPreferencias`.
- [ ] En `entregables-tab.tsx:314-316` inicializar `pdfOptions` desde esa preferencia (fallback a `PDF_OPTIONS_DEFAULT`) y **guardar la selección como default** (al enviar/descargar, o con un botón "recordar esta selección"). Un cambio puntual de un envío no sobrescribe el default salvo que el nutri lo pida.
- [ ] Mantener: `portada` forzada (disabled) y `valoresNutricionales` respetando "ocultar calorías" del paciente.

**Prioridad:** Media-Alta (molestia repetida en CADA envío de plan) · **Complejidad:** Baja-Media

---

## 129. Badges/notificaciones confusos: tres contadores que cuentan cosas distintas y avisos que no se pueden quitar desde donde se ven

**Origen:** nutricionista (vídeo, +34 727 77 19 93 — 2 jul 2026): ve un "3" y no sabe a qué se refiere, no le aparece ninguna notificación al buscarla, y hay avisos ("anamnesis completada", "horario completado") que no puede quitar y le parecen spam. Guillermo matiza: **no** es quitar las notificaciones, sino que **funcionen mejor** (menos spam, más fáciles de descartar; hay algunas que no se pueden quitar).

**Estado (VERIFICADO — 3 contadores desalineados sobre la misma tabla `Notificacion`):**
- **Badge del sidebar** (`getBadgesNavegacion`, `notificaciones.ts:320-373`): el bucket `/pacientes` = `PACIENTE_SIN_CONSULTA + PACIENTE_SIN_MEDIDAS + DIARIO_NUEVO + PLAN_ANTIGUO`. **NO** incluye `PRECONSULTA_COMPLETADA`. Un "3" ahí = 3 no leídas de esos tipos.
- **Campana** (`getNotificacionesCount`, `:307-314`): **todas** las no leídas (incluye `PRECONSULTA_COMPLETADA`, `STOCK_BAJO`…).
- **Dot por paciente** en la lista (`getMapaNotificacionesPacientes`): todas las no leídas de ese paciente.
→ Un "3" en el sidebar y un "3" en la campana/paciente **pueden referirse a cosas distintas** → "no sé a qué se refiere".
- **`PRECONSULTA_COMPLETADA`** (lo crea el paciente al rellenar anamnesis/horario, `preconsulta.ts:237-249` y `:358-370`) cuenta en la campana y en el dot del paciente, pero **no se limpia navegando la ficha**: el auto-mark por pestaña (`auto-mark-leidas.tsx`) no cubre ese tipo ni la pestaña "información", el banner descartable de la ficha solo hace estado local (no marca leído en BD), y la función que SÍ lo limpiaría (`marcarLeidasDePaciente`, `notificaciones.ts:449-464`) es **código muerto** (no se invoca). Única forma de bajarlo: campana → `/notificaciones` → marcar leída/borrar a mano. → "no se puede quitar / spam".

**A hacer (que funcionen mejor, sin eliminarlas):**
- [ ] **Coherencia de contadores:** que el numerito que ve el nutri corresponda con lo que encuentra al pulsarlo (unificar criterio o etiquetar qué cuenta cada uno). Decidir si `PRECONSULTA_COMPLETADA` entra o no en el badge lateral de /pacientes.
- [ ] **Descartar desde donde se ve:** al visitar la pestaña de información/anamnesis (o la ficha), marcar leídas las `PRECONSULTA_COMPLETADA` de ese paciente — añadir tipo+pestaña a `TIPOS_POR_PESTANA` (`auto-mark-leidas.tsx`) o invocar `marcarLeidasDePaciente`. Que el banner descartable marque leído en BD, no solo estado local.
- [ ] **Menos spam / silenciables:** revisar qué tipos generan badge y con qué frecuencia; permitir silenciar/ajustar por tipo aprovechando el `notifPreferencias` por dietista que ya existe.

**Prioridad:** Media-Alta (afecta la percepción diaria de toda la app; confusión + sensación de spam) · **Complejidad:** Media

---

## 130. Múltiples puntos de trabajo / ubicaciones, cada uno con su horario y su agenda compartible por centro

**Origen:** Karina Villavicencio (lic.karinavillavicencio@gmail.com — 14 jul 2026). "Muchos nutricionistas trabajamos en distintos puntos. ¿Se pueden crear agendas separadas para compartirlas con el centro? Ej.: un lunes atiendo en un centro por la tarde de 18-21 **cada 2 semanas**, y el siguiente lunes en otro centro de 11-16. Me gustaría compartir la agenda para que ellos agenden directamente."

**Estado actual (VERIFICADO):** no existe el concepto de "ubicación/punto de trabajo". El **horario laboral** es un único `horarioLaboral Json?` en `Dietista` (un solo horario, sin ubicaciones). La **`Cita`** solo distingue `isOnline` (online/presencial), sin campo de ubicación/centro/dirección. El dietista pertenece a **una sola** empresa (`empresaId`). O sea, hoy hay una única agenda con un único horario.

**Petición (dos piezas entrelazadas):**
1. **Varias ubicaciones/puntos de trabajo**, cada uno con **su propio horario**, y con **recurrencia flexible** incluida la **quincenal/alternante** ("un lunes sí y otro no"). La cita debería saber en qué punto es.
2. **Compartir cada agenda con su centro** para que agenden directamente → es el **link público de reserva (#11)** pero **segmentado por ubicación/agenda**.

**Tareas:**
- [ ] Modelar **ubicaciones/puntos de trabajo** del dietista (nombre, dirección, ¿centro asociado?) — 1..N por dietista
- [ ] **Horario laboral por ubicación** (hoy `horarioLaboral` es único) + soportar **recurrencia quincenal/alternante** (enlaza con #116 excepciones de horario y con la recurrencia de la agenda)
- [ ] Campo de **ubicación en `Cita`** (además de `isOnline`); que los huecos libres (`getHuecosLibresDelNutri`) se calculen por ubicación
- [ ] **Compartir agenda por ubicación:** ampliar #11 (link público) para que el link sea de una agenda/ubicación concreta (cada centro ve/agenda solo sus huecos)
- [ ] Mostrar la ubicación en la vista de agenda, en la cita y en los avisos

**Relacionado con:** #11 (link público de reserva = la vía de "compartir con el centro"), #116 (excepciones de horario por fecha), #115 (agenda), gestión de centros (Empresa/Centro)
**Prioridad:** Media (caso real y común: nutris que rotan por varios centros) · **Complejidad:** Alta (toca horario, citas, huecos libres y el link público)

---

## 131. La lista de la compra ignora las equivalencias (solo incluye el alimento principal)

**Origen:** nutricionista (+34 727 77 19 93 — 2 jul 2026). "En la lista de la compra solo sale el ingrediente principal, no tiene en cuenta las equivalencias."

**Estado (VERIFICADO):** `generarListaCompra` (`src/lib/shopping-list.ts:48-94`) recorre solo el alimento/receta **principal** de cada `AlimentoEnComida` y **nunca mira las `alternativas`** (`AlternativaAlimento`); la interfaz de entrada (`shopping-list.ts:16-21`) ni siquiera declara el campo. Afecta a las **tres superficies** (PDF del nutri `generate-plan-pdf.ts:299`, portal del paciente `lista-compra/page.tsx:51`, link público `compartido/[token]/lista-compra`), porque todas usan esa misma función. Incoherencia: el PDF SÍ muestra las equivalencias en el menú (detalle diario/resumen semanal), pero la lista de la compra las omite. No hay comentario que lo justifique → es un olvido, no una decisión.

**Matiz de diseño (importante):** las alternativas son **excluyentes** (el paciente compra una U OTRA, no ambas), así que **NO se deben sumar** ciegamente al total (sobrestimaría cantidades — de hecho por eso NO suman a los macros, `schema.prisma:529-531`). El arreglo correcto no es sumarlas, sino **mostrarlas como opción**: p. ej. una sub-línea "o bien: 30 g de frutos secos / 35 g de aguacate" bajo el principal, o una sección "alternativas" aparte. Decidir el formato con criterio nutricional (Helena/Claudia).

**Tareas:**
- [ ] Ampliar `generarListaCompra` (`shopping-list.ts`) para contemplar `alternativas`: añadir el campo a la interfaz de entrada y decidir el formato (mostrarlas como opción, sin sumarlas al total del principal)
- [ ] Añadir `alternativas` al `include` del portal del paciente (`lista-compra/page.tsx:22-27`), donde hoy ni se cargan
- [ ] Reflejarlo consistente en las 3 superficies (PDF, portal, link)

**Relacionado con:** #5/#55 (equivalencias por ítem), lista de la compra
**Prioridad:** Media (la equivalencia existe en el menú, pero el paciente no sabe qué comprar si elige la alternativa) · **Complejidad:** Media

---

## 132. BUG: el PDF del plan muestra "Annonia" en la portada aunque el nutri tenga su marca configurada

**Origen:** nutricionista (+34 727 77 19 93 — 2 jul 2026). Personaliza su marca ("Nutrition Efficiency") como cabecera en los entregables, la vista previa se ve bien, pero al generar el plan sigue apareciendo "Annonia".

**Estado (VERIFICADO — bug real, personalización PARCIAL):** la marca del nutri (`marcaPdf`/`pdfLogoUrl`) SÍ llega al generador y SÍ se aplica en la **cabecera**, el **pie** (texto de marca) y el **logo de portada** (`generate-plan-pdf.ts:294` usa `data.brandName || "Annonia"`, correcto). PERO:
- **Literal "Annonia" HARDCODEADO en la portada:** `generate-plan-pdf.ts:317` → `<p class="cover-platform">Annonia</p>`, fijo, nunca se sustituye por la marca. **Es el origen principal de la queja.**
- Pie con `annonia.com` fijo (`:309`) y contraportada con `annonia.com` (traducción `es/pdf.json:40`).
- **Por qué la vista previa "engaña":** la preview de ajustes (`pdf-preview.tsx`) es un mock en miniatura SIN portada → nunca muestra ese literal; se ve la marca correcta mientras el PDF real sigue con "Annonia" en la portada. Desconexión preview ≠ PDF real.

**Fix (✅ DESPLEGADO — commit `07e7f0d`, 18 ago 2026):**
- [x] Sustituido el literal de la portada por la marca del nutricionista. De paso, en el mismo cambio se declararon los iconos de 192 y 512 px en `layout.tsx` porque **Google exige un favicon cuadrado múltiplo de 48px** y el `favicon.ico` era de 32×32 (además de ser un PNG renombrado): por eso en los resultados de búsqueda salía el icono genérico en lugar del logo. Afectaba a TODO el sitio (el layout raíz es el único que define `icons`). Verificado en producción; el favicon en Google tarda de días a semanas en actualizarse.
- [ ] Decidir el `annonia.com` del pie (`:309`) y contraportada (`es/pdf.json:40`): mantener un "hecho con Annonia" discreto (plan gratis) o personalizarlo (Pro) — enlaza con la estrategia de #43 (marca Annonia en gratis / white-label en Pro).
- [ ] (Descartar) `actualizarMarcaPdf`/`actualizarLogoPdf` hacen `if (dietista.isDemo) return` (`perfil.ts:232,145`): en cuenta DEMO guardan en vano → si el nutri afectado fuese demo, sería otro motivo. Verificar que no es demo.

**Relacionado con:** #43 (white-label — este bug es un sub-caso concreto: la personalización que YA existe no se aplica del todo en la portada)
**Prioridad:** Media-Alta (el nutri espera su marca y ve la de la plataforma en su entregable; además el fix es pequeño) · **Complejidad:** Baja (el caso principal, 1 línea)

---

## 133. Copiar una ingesta debe conservar el nombre (alias) y la hora personalizados, no solo el tipo

**Origen:** nutricionista (+34 727 77 19 93 — 14 jul 2026). "Si pongo el almuerzo a las 10:00 y lo renombro a 'post-correr', y lo copio a miércoles y viernes, quiero que se copie tal cual (10:00, 'post-correr'), no que salga 'almuerzo 11:00'. Estoy copiando la ingesta tal cual."

**Estado (VERIFICADO):** el modelo `ComidaDelDia` tiene `nombre String?` (alias visible, #104) y `hora String?` (#104). Pero `copiarComidaADias` (`planes.ts:1043-1086`) y `copiarDiaADias` (`:1093-1134`) copian los ALIMENTOS y, en modo "reemplazar", solo la `descripcion` (`:1082`, `:1129`); **NO copian `nombre` ni `hora`**. El destino se obtiene/crea con `obtenerOCrearComidaDelTipo(dia, tipo)`, que empareja por TIPO y conserva el nombre/hora que tuviera (o los de por defecto). → Al copiar, el alias y la hora personalizados del origen se pierden y se ve la etiqueta del tipo con su hora por defecto. Confirma la queja.

**Fix:**
- [ ] En `copiarComidaADias` y `copiarDiaADias`, al copiar (modo reemplazar) llevar también `nombre` y `hora` del origen al destino (junto a `descripcion`). Ojo: `copiarDiaADias` ni los selecciona hoy (`:1107` solo trae `id, tipo, descripcion`) → añadirlos al `select`.
- [ ] Decidir el comportamiento en modo "añadir/fusionar" (probablemente conservar el destino).
- [ ] Aplica tanto a copiar una comida como a copiar un día completo.

**Relacionado con:** #31 (copiar/mover comidas entre días), #104 (nombre/hora configurables por comida), #106 (importar comida de otro plan)
**Prioridad:** Media (al copiar se pierde la personalización que el nutri ya hizo) · **Complejidad:** Baja

---


✅ **ARREGLADO** en la rama `feature/reparto-comidas` (26 ago 2026), **pendiente de desplegar**: `obtenerOCrearComida` empareja por identidad (nombre en las comidas propias) y `copiarDiaADias`/`copiarComidaADias` propagan nombre y hora al crear la comida destino. → cerrar issue #120 al desplegar.
## 134. En el PDF, las recetas usadas como equivalencia no despliegan sus ingredientes ni preparación (solo el nombre)

**Origen:** nutricionista (+34 727 77 19 93 — 3 jul 2026). Captura del PDF: el plato principal (receta "Tostada con jamón cocido y aguacate") muestra INGREDIENTES + RECETA, pero sus equivalencias ("o 1 rac. Tostada de tomate y jamón serrano", "o 1 rac. Tostada de salmón ahumado y aguacate"), que también son recetas, aparecen **solo con el nombre**, sin desplegarse. "La receta de las [tostadas alternativas] no se despliega."

**Estado (VERIFICADO):** en `generate-plan-pdf.ts`, `altLinesHtml` (`:50-63`) pinta cada alternativa como una única línea "o [cantidad] [nombre]" (`getAltNombre`). Para una alternativa que es receta (`esAltReceta`) muestra "o 1 rac. [nombre]" pero **no** sus ingredientes/instrucciones. Causa raíz: el tipo `AlternativaPDF` (`:71-79`) solo trae `receta: { nombre }` — **NO** carga `ingredientes` ni `instrucciones` (a diferencia del principal `AlimentoEnComida.receta`, `:98-102`, que sí los trae). O sea, ni siquiera hay datos para desplegarla. Confirma la queja.

**Fix:**
- [ ] Ampliar `AlternativaPDF.receta` para incluir `ingredientes` e `instrucciones`, y cargar esos datos en las queries que construyen el `PlanPDFData` (`planes.ts` `getPlanPDFData`, `email.ts`, exportador del paciente, link compartido).
- [ ] En el detalle diario del PDF, desplegar ingredientes (y quizá preparación) de las recetas alternativas igual que el principal.
- [ ] **Decidir por longitud:** desplegar la receta completa de cada alternativa puede alargar mucho el PDF. Valorar: solo ingredientes (no preparación), toggle "detallar recetas alternativas", o hacerlo solo en el detalle diario y no en el resumen semanal.

**Relacionado con:** #131 (lista de la compra ignora equivalencias — mismo patrón: las alternativas se tratan a medias), #22 (ingredientes de recetas), #5/#55 (equivalencias por ítem)
**Prioridad:** Media (el paciente no ve cómo preparar la opción alternativa) · **Complejidad:** Media

---

## 135. Infraestructura: aprovechar lo que ya da el plan Pro de Supabase (Storage de archivos + copias de seguridad)

**Origen:** Guillermo (16 jul 2026). El plan **Pro de Supabase** ya está contratado (a raíz del incidente de egress de #110); toca revisar y usar lo que ofrece.

**1. Storage para guardar archivos ("el giga") — YA cubierto por otras tareas; aquí el recordatorio de EJECUTARLO ahora que hay espacio:**
- Imágenes (fotos de perfil, logos PDF) a Storage en vez de base64 → **#110** (`src/lib/storage.ts` ya existe, con `base64ToBuffer` y script de migración preparado).
- Documentos / analíticas / archivos por paciente a Storage → **#2** (crear bucket; va de la mano con #51 acuerdo de tratamiento).
- Fotos de progreso (#59) y fotos de comidas del paciente también deberían ir a Storage, no base64.
- El plan Pro da 250 GB de egress + File Storage (hoy a 0 GB) → ya no aplica el límite del plan gratuito que frenaba esto.

**2. Copias de seguridad / backup de la BD (NUEVO — esto es lo que faltaba apuntar):**
- [ ] Revisar qué backups ofrece el plan Pro (backups diarios automáticos y **PITR / point-in-time recovery** si está incluido o es contratable) y **confirmar que están ACTIVOS** en el proyecto `kzbrugggurcjwxsmutic`.
- [ ] Documentar el **procedimiento de restauración** (cómo recuperar si algo se corrompe o se borra).
- [ ] **Crítico por el contexto:** local y producción comparten la MISMA BD Supabase → cualquier error en local o un script masivo toca datos reales. Un backup fiable + PITR es la red de seguridad. Antes de migraciones/scripts masivos, backup manual (como ya se hace en #110/#75).
- [ ] Valorar un export/backup periódico propio adicional (enlaza con la tarea de import/export de recetas/alimentos, útil también como respaldo).

**3. Revisar otras capacidades del plan de pago** que convenga aprovechar (límites de egress/almacenamiento, logs, métricas, políticas de tokens de #... auth) — revisión general para no dejar nada sin usar.

**Relacionado con:** #110 (imágenes a Storage), #2 (documentos/analíticas a Storage), #51 (acuerdo de tratamiento + documentos), #59 (fotos de progreso)
**Prioridad:** Media-Alta (los backups son seguridad de datos con BD compartida; el Storage desbloquea #2/#110/#59) · **Complejidad:** Baja (backups: configurar/verificar) – Media (Storage: la implementación vive en #110/#2)

---

## 136. Citas: descubribilidad de que el paciente acepta/rechaza en el portal (y del modo "proponer")

**Origen:** Neus Pallarés (17 jul 2026): "cuando se envía el recordatorio de la cita al paciente, el paciente no puede aceptar o rechazar; no sé si está pensado para responder por WhatsApp".

**Estado (VERIFICADO):** el paciente SÍ puede aceptar/rechazar/contraproponer, pero **solo desde el portal** (`/paciente/portal/citas`, `citas-client.tsx`) y **solo si la cita se creó en modo "proponer al paciente"** (nace PENDIENTE + origen DIETISTA). El **modo por defecto al crear una cita es "directa / cita ya acordada"** (`crearCita`, `agenda/nueva/page.tsx:331`), que la crea **ya CONFIRMADA** → no hay nada que aceptar (el paciente solo puede cancelar). El **email NO lleva botones** de aceptar/rechazar (solo un CTA "Ver mis citas" al portal; `email-citas-template.ts`), y **WhatsApp es solo informativo**. Por eso los nutris creen que "no se puede".

**Mejora (descubribilidad):**
- Hacer más visible/claro el modo "proponer al paciente" al crear la cita (hoy viene marcado "ya acordada" por defecto).
- Que el email de una cita *pendiente/propuesta* diga claramente "entra en tu portal para aceptar/rechazar" (ya existe `avisoPropuesta` en la variante "propuesta", pero no en "recordatorio"/"confirmada").
- (Más ambicioso) botones de aceptar/rechazar en el propio email.

**Prioridad:** Baja-Media (la función existe; es percepción/descubribilidad) · **Complejidad:** Baja (textos/UX) · **Estado:** anotado; **Guillermo (17 jul): de momento NO tocar.**

---

## 137. Guía visual de raciones (fotos de alimentos con su equivalencia en gramos y medidas caseras)

**Origen:** Marina Orea (oreanutri, Instagram — jul 2026), idea 3.

**Petición:** una guía visual con **imágenes de alimentos básicos** y su equivalencia en **gramos y en medidas caseras** (ej. foto de un plato de arroz = 60 g en crudo ≈ 1 taza), para los pacientes que no quieren pesar la comida.

**Estado actual:** no existe. Enlaza con #21 (medidas caseras) y #38 (fotos de platos).

**Tareas:**
- [ ] Definir el set de alimentos/raciones de referencia con foto + equivalencia (g y medida casera)
- [ ] Dónde vive: recurso consultable/descargable en el portal del paciente y/o adjuntable al plan (PDF)
- [ ] Reutilizar el trabajo de medidas caseras (#21) para las equivalencias

**Prioridad:** Media (mejora la adherencia sin pesar) · **Complejidad:** Media (el grueso es conseguir/crear las fotos)

---

## 138. Biblioteca de recetas compartidas por la comunidad de nutricionistas

**Origen:** Marina Orea (oreanutri, Instagram — jul 2026), idea 5.

**Estado actual (verificado):** hay recetas **globales** (de la app, ~316) y recetas **propias** por dietista (`Receta.dietistaId`). **NO existe** un espacio donde los nutris compartan sus recetas entre sí (comunidad); a nivel de centro/empresa tampoco (las recetas son por dietista).

**Petición:** una biblioteca de recetas que **otros nutricionistas comparten**, para nutrirse de recetas de colegas.

**Tareas / consideraciones:**
- [ ] Modelar recetas "compartidas a la comunidad" (opt-in del autor: marca de compartida + autoría)
- [ ] Buscador/biblioteca comunitaria, separada de las globales de la app y de las propias
- [ ] **Moderación/calidad** (evitar recetas erróneas o inapropiadas) — es el reto principal
- [ ] Poder **duplicar** una receta de la comunidad a tu biblioteca (enlaza con #68)
- [ ] Derechos/atribución de las recetas compartidas

**Relacionado con:** #68 (duplicar receta), #73 (catálogo global)
**Prioridad:** Media (efecto comunidad/red) · **Complejidad:** Alta (modelo + moderación + UX)

---

## 139. Módulo para deporte de élite y deportes de equipo (variables de rendimiento y recuperación)

**Origen:** Marina Orea (oreanutri, Instagram — jul 2026), idea 8.

**Petición:** un módulo para deportistas de élite / equipos con seguimiento de variables de rendimiento y recuperación: **cortisol, IgA, cuestionario wellness, hidratación, RPE (esfuerzo percibido), recuperación**, mostrando también la **media y la desviación estándar** de cada variable para facilitar la interpretación.

**Estado actual:** no existe. La app cubre nutrición y mediciones básicas; no hay seguimiento de marcadores de rendimiento deportivo ni estadística (media/DE).

**Tareas / a valorar:**
- [ ] Modelar variables de rendimiento por deportista (cortisol, IgA, wellness, hidratación, RPE, recuperación…) con registro temporal
- [ ] Evolución + media y desviación estándar por variable
- [ ] Cuestionario wellness que rellena el deportista

**⚠️ POR VALORAR (scope):** módulo MUY especializado (alto rendimiento), fuera del core de nutrición general — como el de entrenamiento (#117). Recoger si lo piden más profesionales del ámbito deportivo antes de invertir. Público: nutricionistas deportivos de alto rendimiento.
**Prioridad:** Por valorar (nicho) · **Complejidad:** Alta

---

## 140. UX del importar/copiar/juntar entre planes: hacerlo contextual (por comida), no "todo en la barra de arriba"

**Origen:** Guillermo (idea, jul 2026), comparando con **Nutrium**.

**Estado actual (VERIFICADO):** el `ImportarPlanModal` (`src/components/paciente/plan-visual.tsx:1444`, `src/components/dieta/importar-plan-modal.tsx`) YA ofrece un flujo muy parecido al de Nutrium: elegir **paciente → plan → día o comida** de origen y traerlo (`copiarComidaADias`). El problema NO es la funcionalidad, es el **ACCESO**: las acciones —importar/traer de otro plan, copiar a otro plan, juntar días (#75)— están concentradas en la **barra de acciones superior del plan**. Guillermo: "aquí lo tenéis todo como que tienes que subir arriba: subo arriba para juntar días, subo arriba para copiar a otro plan, subo arriba para importar…". En Nutrium el importar es más **contextual/por comida** (desde la propia comida: importar → lista de clientes → seleccionar la comida → se trae directa).

**Petición (mejora de UX, el backend ya existe):**
- Poder **importar/traer una comida de otro plan desde el contexto de cada comida** (un botón en la propia comida), no solo desde la barra global de arriba — menos "subir arriba" para todo.
- Revisar la ubicación/agrupación de las acciones del plan (juntar días, copiar a otro plan, importar) para que sean más accesibles y contextuales, al estilo Nutrium.

**Relacionado con:** #106 (elegir tipo de comida destino al importar), #31 (copiar/mover comidas entre días — hecho), #75 (juntar días), #133 (copiar ingesta conserva nombre/hora)
**Prioridad:** Media (mejora de flujo diario; el back ya está, es reubicar/contextualizar) · **Complejidad:** Media (UX: añadir el acceso por comida)

---

## 141. Horario semanal en franjas de media hora (no solo de hora en hora)

**Origen:** nutricionista (+34 727 77 19 93 — 21 jul 2026): "el calendario que sea de media hora en media hora".

**Estado actual (VERIFICADO):** el horario semanal es de HORA EN HORA. Grid del nutri `horario-semanal.tsx` (`HORAS` = 06:00…23:00, filas de 1 h; los selectores Desde/Hasta del panel "Nueva actividad" también en horas enteras). El del portal del paciente `horario-paciente.tsx` / `horario-utils.ts` usa `rangoHoras()` (START_HOUR 6 → END_HOUR 24, de hora en hora) con bloques.

**Petición:** que las franjas sean de **30 minutos** (06:00, 06:30, 07:00…), para ubicar actividades/comidas con más precisión.

**Tareas:**
- [ ] Grid del nutri (`horario-semanal.tsx`): generar `HORAS` cada 30 min y ajustar los selectores Desde/Hasta del modal (y `nextHour` → medias horas)
- [ ] Horario del paciente (`horario-utils.ts` `rangoHoras`, bloques): soportar medias horas, para que ambas vistas sean coherentes (comparten el mismo dato `horario`)
- [ ] Valorar que sea configurable (30 vs 60 min) o directamente 30 min

**Relacionado con:** #30 (editar horario del paciente — recién desplegado), #115 (horario del portal)
**Prioridad:** Media · **Complejidad:** Media (toca el grid + los selectores en las dos vistas del horario)

---

## 142. Entregable "tabla de frecuencia de consumo" (además de la tabla del plan)

**Origen:** nutricionista (+34 727 77 19 93 — 21 jul 2026): "al igual que se entrega una tabla de estructura [el plan], que se haga otra tabla pero con frecuencias de consumo sería bastante top".

**Petición:** poder generar/entregar al paciente, junto al plan, una **tabla de frecuencia de consumo**: con qué frecuencia debe consumir cada grupo de alimentos (ej. verduras a diario, legumbres 3-4/sem, pescado 3/sem, carne roja 1/sem, ultraprocesados ocasional…). Es un entregable clásico de consulta (guía de frecuencias por grupos), complementario al menú.

**Estado actual:** no existe. El plan se entrega como tabla de estructura (menú) + lista de la compra + recomendaciones, pero no hay tabla de frecuencias de consumo.

**Importante — NO confundir con #123:** #123 es el **cuestionario** de frecuencia de consumo (CFCA/FFQ) que rellena el paciente sobre lo que YA consume; este #142 es la **tabla de frecuencias RECOMENDADAS** que el nutri entrega como guía. Son cosas distintas (aunque podrían compartir el catálogo de grupos de alimentos).

**A decidir:** ¿frecuencias recomendadas editables por el nutri, o derivadas del propio plan (cuántas veces aparece cada grupo en la semana)? Probablemente una tabla editable de grupos + frecuencia, incluible en el PDF (toggle de entregables).

**Relacionado con:** #123 (cuestionario FFQ), #4 (mejorar entregables/PDF)
**Prioridad:** Media · **Complejidad:** Media

---

## 144. DESCUBRIBILIDAD: funciones que YA existen y los nutricionistas no encuentran

**Origen:** patrón detectado al responder soporte (jul–ago 2026). **Ya van 6 casos verificados** de profesionales que piden algo que la app **ya hace**. No es falta de funcionalidad: es que el acceso no está donde el nutri lo busca. Cada caso cuesta un mensaje de soporte y, lo peor, muchos nutris no preguntan y asumen que la app no lo hace.

**Casos verificados (todos comprobados en código):**
1. **Objetivos de macros en % (Ruth Magem, 2 ago 2026):** "al crear un plan no se tuviera que hacer obligatoriamente por gramos, se pudiera hacer por porcentajes". **SÍ existe**: en la ficha del paciente → pestaña **Planificación** hay sliders de % (grasa/carb/proteína) + presets nombrados (equilibrada 30/50/20, zona, cetogénica, alta proteína, low carb…) y los gramos se calculan solos; incluso editando gramos lo reconvierte a % (`planificacion-por-defecto-tab.tsx:160-166, 1538, 2255-2384`). El plan **hereda** esos objetivos, y por eso en `/dietas/nuevo` solo se ven **gramos** → parece que solo se puede por gramos.
2. **Generar con IA (Saúl, 22 jul):** el botón "IA" solo existe en `/dietas/[id]` (`page.tsx:94`), pero `crearPlan` redirige a la ficha del paciente (`plan-visual.tsx`), donde NO está → siguió los pasos y no lo encontró.
3. **Borrar una medición (Helena, jul):** la papelera está en `/pacientes/[id]/medidas` pero NO en la pestaña Mediciones de la ficha (ver #60).
4. **Fórmula Cunningham para la TMB (Helena, 2 ago):** existe, junto con otras 9 (OMS/Schofield, Henry, Harris-Benedict y su revisada, Mifflin-St Jeor, Katch-McArdle, Black, Ten Haaf peso y masa magra), en la pestaña Planificación.
5. **Formas de montar un plan rápido (Saúl, 17 jul):** copiar un día a varios días, plantillas y generación IA — no las estaba usando (ver #23).
6. **Plantillas (Saúl, 22 jul):** el botón "Plantillas" en `/dietas` **solo aparece si ya existe alguna plantilla** (`dietas/page.tsx:57`) → con cero plantillas es invisible y no hay forma de llegar salvo por URL.

**Denominador común:** casi todo el potencial "clínico" (fórmulas de TMB, % de macros, reparto por comida) vive en la pestaña **Planificación** del paciente, que mucha gente no abre; y varias acciones del plan solo existen en la vista `/dietas/[id]`, no en el plan visto desde el paciente (donde la app te deja tras crearlo).

**Acciones propuestas:**
- [ ] **Pistas contextuales donde el nutri mira:** en `/dietas/nuevo`, junto a los objetivos en gramos, una nota tipo "estos objetivos vienen de la Planificación del paciente — allí puedes definirlos en % con presets" + enlace directo.
- [ ] **Paridad de acciones** entre `/dietas/[id]` y el plan dentro del paciente (IA, guardar plantilla, importar) — ver #81.
- [ ] Botón "Plantillas" **siempre visible** en `/dietas` (con estado vacío que explique cómo crear la primera) — ver #81.
- [ ] Botón de borrar/editar medición también en la pestaña Mediciones — ver #60.
- [ ] Valorar un **onboarding / tour corto** para nuevas cuentas que enseñe: Planificación (fórmulas y %), copiar día a varios, plantillas e IA.
- [ ] Revisar la **ayuda** (`help.json`) para que estas funciones aparezcan buscables.

**Relacionado con:** #81 (crear plantillas / usar IA desde el paciente), #23 (comidas reutilizables + rapidez), #60 (editar objetivo y borrar medición desde la ficha), #140 (UX importar/copiar)
**Prioridad:** Alta (no cuesta features nuevas: es hacer visible lo ya construido; impacto directo en percepción de valor y en soporte) · **Complejidad:** Baja-Media (enlaces, textos y colocación; el tour sería lo único mayor)

---

## 145. BUG: al renombrar una comida (o cambiarle la hora) no se guarda — comidas recién añadidas

**Origen:** Guillermo (18 ago 2026), probando en local: en el plan dentro del paciente (`/pacientes/[id]?pestana=plan-alimentacion`), cambia el **nombre de una comida** y **no se guarda**; **la hora tampoco**. Captura: comida de las 10:30 llamada "o", creada con el botón "Añadir comida al día".

⚠️ **Contexto a confirmar:** se observó en **local** y los 3 archivos implicados (`comida-slot.tsx`, `plan-visual.tsx`, `plan-editor.tsx`) estaban **modificados sin commitear** (WIP en curso). **Verificar si reproduce también en producción** antes de dar por hecho que es un bug publicado.

**Causa raíz principal (VERIFICADA en código): se está usando el ID TEMPORAL de la comida optimista.**
- Al añadir una comida, `plan-visual.tsx:367-379` crea un objeto optimista con `id: tempId` (`tmp-comida-…`). Cuando el servidor responde, **solo se añade `realId: res.id`** — el `id` **sigue siendo el temporal** (`:379`).
- El slot recibe `comidaId={comida.id}` (`plan-editor.tsx:1081`, `dia-columna.tsx:86`), es decir el **tempId**.
- `comida-slot.tsx:174,182` llama a `actualizarMetaComida(comidaId, …)` con ese tempId → en el servidor `verificarPropietarioComida` no encuentra esa comida → **la acción falla** y ni el nombre ni la hora se guardan.
- **Y falla en SILENCIO:** las llamadas de `:174` y `:182` no llevan `await` ni `.catch()` → promesa rechazada sin manejar, sin toast de error. El nutri no se entera de que no se ha guardado (patrón del catálogo de bugs: fallo silencioso).

**Defectos secundarios detectados en el mismo bloque (arreglar de paso):**
- **Debounce COMPARTIDO entre hora y nombre:** ambos usan `metaDebounceRef` (`comida-slot.tsx:155, 172, 180`) y hacen `clearTimeout` del otro → si cambias la hora y el nombre seguidos (dentro de 500-700 ms), **el segundo cancela el guardado del primero** y uno de los dos se pierde. Bug real e independiente del anterior.
- **El `useEffect` de sincronización** (`:162-167`) puede revertir lo tecleado si el padre re-renderiza con el valor antiguo (mismo patrón que #126).

**Fix propuesto:**
- [ ] Usar el **id real**: pasar `realId ?? id` al slot (o sustituir `id` por el real al confirmar la creación, en `plan-visual.tsx:379`), y no permitir guardar mientras la comida siga siendo optimista.
- [ ] **Refs de debounce separados** para hora y para nombre.
- [ ] `await` + `catch` con aviso al usuario si la acción falla (no fallar en silencio).
- [ ] Comprobar que el `useEffect` de sincronización no pisa lo que se está escribiendo.

**Relacionado con:** #104 (nombre/hora de comida configurables), #133 (copiar ingesta pierde nombre y hora), #126 (mismo patrón de guardado que se pisa)
**Prioridad:** Alta (se pierde trabajo del nutri sin avisar) · **Complejidad:** Baja-Media

---


✅ **ARREGLADO** en la rama `feature/reparto-comidas` (26 ago 2026), **pendiente de desplegar**: la comida optimista pasa a usar su id real en cuanto se crea (con eso la acción ya encuentra la comida), un temporizador por campo, y guardado optimista con reversión y aviso si falla. Además `actualizarMetaComida` y `actualizarDescripcionComida` ahora revalidan: sin eso el dato se guardaba pero al salir y volver se veía el valor viejo. → cerrar issue #131 al desplegar.
## 143. Novedades: enlace directo a la pantalla de cada novedad (para quien ya está logueado)

**Origen:** mejora propia, al montar la página pública de novedades (29 jul 2026).

**Estado actual:** `/novedades` es **pública** (se ve sin cuenta, junto a la landing y precios). Por eso cada entrada dice **dónde está la mejora en texto** ("Ficha del paciente → pestaña General, cuadro del horario semanal") y no lleva enlaces: un visitante sin cuenta que pinchase acabaría en el login, y con un `pacienteId` no habría a dónde apuntar.

**Petición:** cuando quien mira la página **es un nutricionista con sesión**, cada novedad podría llevar además un botón "Ir ahí" que lo lleve a la pantalla real (`/dietas`, `/pacientes/[id]?pestana=general`, `/recetas`…). Leer la novedad y probarla serían un clic, en vez de leerla y luego buscar la pantalla a mano.

**Cómo encaja con lo que ya hay:** el contenido está en `src/content/novedades.ts` y la página ya distingue en el servidor si hay sesión (hoy solo para elegir el canal de contacto: Soporte si estás dentro, email si no). Bastaría con un campo opcional `enlace` por entrada (ruta + etiqueta) que se renderice **solo** con sesión.

**A decidir:**
- Rutas que necesitan un id (fichas de paciente, planes): o se apunta al listado (`/pacientes`), o se resuelve "el último paciente" en el servidor, o esas novedades se quedan sin enlace.
- Si el enlace debe abrir en pestaña nueva para no perder la lista de novedades.

**DECISIÓN (1 ago 2026): de momento las novedades van SIN enlace.** Se queda como idea a futuro; no volver a proponerlo salvo que se pida. Lo que sí está hecho es el resto de la fase 2: banner de novedad destacada (oculta el de beta), entrada "Novedades" en el menú bajo Ajustes con punto verde, y marcado de leídas en `localStorage`.

**Relacionado con:** #129 (badges/notificaciones).
**Prioridad:** Baja · **Complejidad:** Baja

## 146. BUG: el seguimiento del paciente NO cuenta las recetas (ni calorías ni macros ni micros)

**Origen:** auditoría de código (21 ago 2026), revisando los issues cerrados como "ya implementados". No lo ha reportado ningún nutricionista todavía: es un bug latente.

**Qué pasa:** cuando un paciente marca como cumplida una comida de su plan que es una **receta**, esa comida cuenta como **CERO** en la pestaña **Seguimiento** de su ficha. Cero calorías, cero macros y cero micronutrientes. El nutricionista ve que el paciente ha comido menos de lo que ha comido en realidad, y las conclusiones que saque de ahí son erróneas.

**Causa raíz (VERIFICADA en código):** en `src/app/actions/seguimiento.ts`, la función `calcularMacrosDia` (línea ~396):

1. Al construir `foodsToCalc` (línea ~411) **descarta el flag `esReceta`** que sí viene en el dato guardado.
2. La consulta de nutrientes es `SELECT ... FROM alimentos WHERE nombre IN (...)` (línea ~426): **solo mira la tabla `alimentos`**.
3. Y en el bucle de suma (línea ~440): `const food = foodMap.get(item.nombre); if (!food) continue;` → al ser una receta, no está en el mapa y **la línea entera se salta**.

Las recetas se guardan en `comidasData` **con su nombre de receta** y con el flag `esReceta: true` — el propio código lo dice en `seguimiento-paciente.ts:202-203`: *"sin esto la marca de receta se perdía al guardar y el día quedaba registrado como «Ensalada César 1g»"*. O sea: el dato para distinguirlas está ahí, y la función de cálculo no lo usa.

**Es el mismo patrón que la `#90`, pero en otro sitio y peor.** La `#90` (issue #78, ya cerrado) arregló los micros de las recetas **en el plan**; esto es el **seguimiento**, y aquí no se pierden solo los micros: se pierde todo.

**Impacto medido en producción (21 ago 2026):** de **4.242** días de seguimiento registrados, solo **2** incluyen alguna receta y **ninguna línea de receta está marcada como cumplida**. O sea: hoy no afecta a nadie, pero salta en cuanto el primer paciente marque una receta. Por eso es prioridad media y no alta.

**Solución:**
- [ ] Conservar `esReceta` al construir `foodsToCalc`
- [ ] Consultar también `FROM recetas` (nombre + macros + los 24 micros) para las líneas marcadas como receta
- [ ] Escalar los valores de receta por `cantidad` = porciones servidas (no por gramos/100, como se hace con los alimentos): mismo criterio que ya usa `plan-visual.tsx` para la `#90`
- [ ] Comprobar el resultado en la pestaña Seguimiento de la ficha del paciente

**Ojo al implementarlo:** las recetas se identifican por **nombre**, no por id. Si un nutricionista tiene una receta y un alimento con el mismo nombre, hay ambigüedad. Mirar si conviene guardar el id en `comidasData` de aquí en adelante.

**Relacionado con:** `#90` (mismo bug en el plan, ya arreglado), `#112` (registrar la comida real que ha comido)
**Prioridad:** Media (dato clínico incorrecto, pero hoy con impacto cero) · **Complejidad:** Baja

## 147. BUG de flujo: un plan creado desde plantilla nace sin planificación ni objetivos

**Origen:** Guillermo (21 ago 2026), probando el flujo. "Si se le crea un plan de alimentación a través de una plantilla, no se le puede poner una planificación, entonces no se puede poner calorías objetivo. Y esto rompe el flujo de primero la planificación y luego el plan."

**Issue:** #142

**Qué se rompe:** el flujo pensado es planificación primero (TMB, gasto, objetivo de calorías, reparto de macros) y plan de alimentación después, heredando esos objetivos para tenerlos como referencia mientras se montan las comidas. Creando el plan **desde plantilla**, ese enganche no ocurre: se monta la dieta a ciegas.

**Causa raíz (VERIFICADA en origin/main):** las dos vías de creación no hacen lo mismo.
- `crearPlan` (`planes.ts:72`) valida y guarda los cuatro objetivos (líneas 80-105) y recibe `planificacionIds` comprobando que son de ese paciente y ese dietista (líneas 122-135).
- `crearPlanDesdePlantilla` (`plantillas.ts:164`) solo acepta `plantillaId`, `pacienteId` y `nombre`. Su `create` pone únicamente el nombre y el paciente: **no toca objetivos, ni `planificacionIds`, ni `objetivosPorPlani`**.
- Y la pantalla que la llama (`dietas/nuevo/page.tsx`) no menciona la planificación en ninguna línea: no hay selector, así que el dato ni existe.

**Lo que lo hace peor: no se puede arreglar después.** Los objetivos numéricos sí (`actualizarPlan`, `planes.ts:169`, los acepta), pero **la asociación con la planificación no**: `planificacionIds` no está en su `updateData`, y no hay ninguna otra acción que lo haga. El plan queda desvinculado de forma permanente.

**Impacto medido en producción (21 ago 2026):** 2.307 planes en total, 87 con planificación asociada, 127 sin objetivo de calorías y **103 sin planificación Y sin objetivo** — esos son los que el nutricionista abre sin ninguna referencia. Matiz: `planificacionIds` es reciente, así que la mayoría de los 2.220 sin planificación son históricos, no culpa de las plantillas; el número que cuenta es 103. 598 pacientes sí tienen planificación.

**Propuesta (la idea de Guillermo):** que crear desde plantilla pase por el mismo sitio que el flujo normal —elegir la planificación al crear, con los objetivos precargados y editables— y que el ajuste fino se haga dentro del plan, como ya se hace. Además, poder asociar una planificación a un plan ya existente, para recuperar los 103 sueltos.

⚠️ **Solapa con el trabajo en curso del reparto de macros por comida** (`planificacionIds` / `objetivosPorPlani` son de la #78 bloque 2). Coordinar o esperar a que entre.

**Relacionado con:** #78 (reparto por comida), #23 (rapidez montando planes), #81 (plantillas)
**Prioridad:** Alta (rompe el flujo principal) · **Complejidad:** Media

## 148. BUG: al eliminar una dieta se ve un 404 antes de volver al listado

**Origen:** Guillermo (21 ago 2026). "Cuando se elimina una dieta aparece un momento el mensaje de error 404, page not found, y luego ya carga y te saca a todas las dietas. Quiero que no salga el mensaje de error, aunque tarde un poquito más en cargar."

**Issue:** #143

**Causa raíz (VERIFICADA en origin/main):** en `dietas/[id]/plan-actions.tsx:16-26` se borra el plan, se espera 800 ms con un `setTimeout` y luego se navega con `window.location.href`. El problema es lo que pasa en medio: al completarse la server action, Next revalida el árbol del router **incluida la ruta en la que sigues** (`/dietas/[id]`), esa página ejecuta `if (!plan) notFound()` (`page.tsx:24`) y pinta el 404. El `setTimeout(800)` no espera a nada: es exactamente el tiempo que el error está en pantalla.

**El patrón está a medias:** el componente ya importa `isNextNavigation` y hace `throw error` en el catch (línea 23), que es justo lo que se pone para dejar pasar la excepción de navegación cuando la **acción** hace el redirect. Pero la acción no lo hace. Comprobado: ni `eliminarPlan`, ni `eliminarPlantilla`, ni `eliminarPaciente` hacen `redirect`; las tres dejan que el cliente navegue a mano y por eso pasan por la página sin datos.

**Solución:** que la server action termine con `redirect(...)` después de los `revalidatePath`, y quitar del cliente el `setTimeout` y el `window.location.href` (que además fuerza recarga completa de la app). Mantener el `catch` con `isNextNavigation`, sin el cual el redirect se tragaría como un fallo y saldría el toast de error.

**Por qué ahora:** hoy el botón de eliminar solo está en la dieta, pero va a añadirse dentro del paciente, en el plan de alimentación y junto a las acciones de compartir. Si se copia el patrón actual —y se copiará, porque es el que hay— el 404 fantasma aparece en cada sitio nuevo.

⚠️ `planes.ts` tiene trabajo en curso (reparto por comida). El cambio son dos líneas al final de una función, riesgo de conflicto bajo, pero confirmar antes.

**Relacionado con:** #140 (eliminar un plan parece eliminar al paciente — misma pantalla)
**Prioridad:** Media-Alta · **Complejidad:** Baja

## 149. BUG: generar con IA borra el contenido de las comidas propias y no conoce el reparto por comida

**Origen:** análisis del épico del reparto por comida (21 ago 2026, workflow de auditoría). No lo ha reportado un nutricionista todavía: lo encontramos antes de que dé la cara, pero pasa **hoy en producción**.

**Issue:** pendiente de crear

⚠️ **DEPENDE del reparto por comida (#78-C / #104): primero se termina y se despliega eso, y luego esto.** Toca `ai.ts` y el prompt, y la solución correcta necesita que la dieta ya sepa qué comidas tiene y con qué porcentajes.

**Qué pasa (VERIFICADO en el código):**
1. `aceptarPlanIA` (`ai.ts:352-359`) recorre **todas** las comidas del plan existente y hace `deleteMany` de sus alimentos.
2. Después solo rellena las que consigue emparejar por tipo con `COMIDAS_MAP` (`ai.ts:368`), y ese mapa tiene **solo las 6 comidas fijas** (`ai.ts:273-276`): no contempla `OTRA`.
3. Resultado: una comida propia ("Pre-entreno", "Batido post-entreno") con alimentos dentro **se queda vacía para siempre**, sin ningún aviso, y no hay forma de recuperarla.

**Y además la IA no sabe nada del reparto:** `COMIDAS_POR_NUM` (`ai.ts:99-104`) solo ofrece combinaciones de 3, 4, 5 o 6 comidas fijas, el selector del formulario arranca en 6 a pelo (`ia-generation-form.tsx:185`, `defaultValue="6"`) y el prompt (`src/lib/ai/prompts.ts`) le pide cuadrar el día entero pero **no le pasa el % de cada comida**. Con el reparto activo, la dieta generada reparte a criterio de la IA → al aceptarla, las pastillas "llevas / objetivo" de cada comida salen casi todas en rojo, y el nutri tiene que recolocar a mano lo que la IA acaba de escribir.

**Propuesta:**
- [ ] Que `aceptarPlanIA` borre **solo** las comidas que va a rellenar; las que no empareja, no se tocan (arregla la pérdida de datos sin depender de nada más — es la parte urgente)
- [ ] Pasar a `generarPlanIA` las comidas **reales** del día (nombre, hora y % del reparto) en vez del `numComidas` fijo, y prellenar el selector desde el reparto de la dieta
- [ ] Mencionar los % por comida en el prompt, para que la IA reparta según el objetivo de cada toma y no solo cuadre el día
- [ ] Mientras (2) y (3) no existan: avisar en la pantalla de generación de que esa dieta tiene reparto activo y la IA no lo respeta

**Nota de pruebas:** la IA no se puede probar desde la máquina local (bloqueo de red del proxy corporativo). Verificar en producción o por hotspot.

**Relacionado con:** #78 (reparto de macros por comida), #104 (comidas configurables), #44 (coste del prompt)
**Prioridad:** Alta (pérdida de datos silenciosa) · **Complejidad:** Media

## 149. Feedback completo de una nutricionista tras probar la app a fondo (26 ago 2026)

**Origen:** nutricionista (WhatsApp, 26 ago 2026), llegada por recomendación de Álvaro. Probó la app a fondo antes de meter pacientes reales y mandó un repaso apartado por apartado. Es el feedback más completo recibido hasta ahora.

**Lo que más valoró:** las equivalencias y las recetas propias ("da bastante flexibilidad"), el bloque de análisis y resumen del plan, la lista de la compra y, sobre todo, **la personalización de los PDF** (colores, código hexadecimal propio, logo y marca): "hace que el material sea mucho más personal y profesional".

### Cuatro cosas que pidió y YA EXISTÍAN (problema de descubribilidad, no de producto)

Esto es lo más revelador del mensaje: cuatro de sus peticiones ya están hechas y no las encontró. Refuerza la #144 (descubribilidad, issue #130):

1. **Ocultar calorías al paciente** → existe (`ocultarCalorias` en el modelo Paciente, por paciente).
2. **Medidas caseras** → el enum `UnidadMedida` ya tiene CUCHARADA, CUCHARADITA, TAZA, REBANADA, PIEZA, LONCHA y LATA, y lo que se elige es lo que ve el paciente. Gramos es el valor por defecto, así que quien no sepa que se cambia, nunca lo cambia.
3. **Macros en g/kg editables** → existe (`handleGkgChange`, `planificacion-por-defecto-tab.tsx:1323`). **Con un fallo silencioso que explica su queja**: si el paciente no tiene peso registrado, el campo no responde y no dice por qué. Añadido al issue #96.
4. **Borrar una medición** → existe, pero solo en `/pacientes/[id]/medidas`, no en la pestaña Mediciones. **Segunda persona que lo reporta** (la primera fue Helena en julio).

### Issues creados a partir de este feedback

| Issue | Qué |
|---|---|
| #144 | Ajustes: el menú lateral no acompaña al scroll |
| #145 | Explicar para qué sirve cada fórmula de TMB al pasar el cursor |
| #146 | Calcular composición corporal, somatotipo y distribución de masas desde los datos ISAK |
| #147 | Anamnesis: patologías y frecuencias como listas, no separadas por comas |
| #148 | Biblioteca de materiales de educación nutricional editables |
| #149 | PDF: paleta de marca y no solo un color |
| #150 | App instalable (PWA) y notificaciones en el dispositivo |
| #151 | Sincronizar la agenda con Apple Calendar por enlace .ics |

Y se sumó su voz a **#105** (varios ejercicios con su frecuencia — coincide punto por punto, incluidos los ejemplos), **#130** (descubribilidad) y **#96** (g/kg).

### Idea que queda anotada sin issue

Representación visual/3D de la evolución corporal, con colores para masa grasa, muscular y ósea, pensada para explicárselo al paciente. Ambiciosa, pero la forma de plantearla —que sirva para la consulta, no para lucirse— es la buena. Va dentro del terreno del #146.

**Prioridad:** — (es un paraguas, cada issue lleva la suya) · **Complejidad:** —
