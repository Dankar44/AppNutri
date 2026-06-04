# Peticiones de nutricionistas - Mayo 2025

Feedback recopilado de un nutricionista argentino (usuario real) tras probar Annonia en producción.

---

## 1. Tablas de composición de alimentos por país

**Estado actual:** OpenFoodFacts (API global con filtro español) + ~3000 alimentos precargados. Micronutrientes basados en USDA/BEDCA estimados por categoría. El dietista puede crear alimentos personalizados.

**Petición:** Poder seleccionar la tabla de composición según el país del profesional. Ejemplo: Argenfood (Argentina), BEDCA (España), USDA (EE.UU.), etc.

**Tareas:**
- [ ] Investigar APIs o datasets descargables de Argenfood, BEDCA, y USDA
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

**Tareas:**
- [ ] Crear modelo `ArchivoPaciente` en Prisma (id, pacienteId, dietistaId, nombre, tipo, url/base64, categoria, notas, createdAt)
- [ ] Categorías de archivo: analisis_sangre, estudio_medico, plan_externo, receta_medica, otro
- [ ] Implementar subida de archivos (Supabase Storage o base64 en BD según tamaño)
- [ ] Límite de tamaño por archivo y por paciente
- [ ] UI: nueva pestaña "Archivos" en ficha del paciente
- [ ] Vista previa de PDFs e imágenes
- [ ] Para análisis de sangre: parseo opcional con IA para extraer valores clave (hemoglobina, glucosa, colesterol, etc.) y mostrarlos en un resumen/cuadrito
- [ ] **Histórico de analíticas** — Vista tipo tabla/gráfica donde se vean todos los valores de todas las analíticas del paciente a lo largo del tiempo (ej: glucosa en enero 95, en abril 88, en julio 82). Similar a lo que Ainara hace manualmente con IA + Excel
- [ ] **Más marcadores de analítica con evolutivo** (María Marqués, 3 jun 2026) — Hoy en mediciones solo hay colesterol HDL/LDL/total, triglicéridos y presión. Faltan y los pide expresamente: **glucosa, HbA1c, TSH, T4 libre y marcadores de función hepática** (GOT/GPT/GGT...). Que se puedan introducir y ver su evolución en el tiempo
- [ ] Permitir al paciente subir archivos desde su portal (opcional, configurable por dietista)

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

**Estado actual:** PDF vertical (A4) generado via `window.print()`. Se reporta que queda media hoja vacía en algunos casos. Layout fijo.

**Petición:** Ajustar formato para que no queden hojas medio vacías. Opción de orientación horizontal.

**Input adicional (Ainara Martín, 2 jun 2026):**
1. **Orden de secciones del PDF** — Ella pondría el "Plan semanal completo" (tabla de los 7 días) **al final, justo antes de la lista de la compra**, en vez de al principio. → Idealmente: poder reordenar las secciones del PDF, o al menos revisar el orden por defecto
2. **Recetas en el entregable, opción más visible** — No encontraba cómo incluir las recetas en el PDF. VERIFICADO en código: los ingredientes e instrucciones de las recetas SÍ salen, pero **dentro** del bloque "Detalle diario de comidas" (sin toggle propio). → Valorar opción explícita "Incluir recetas (ingredientes y preparación)" en el modal, o aclarar en el texto descriptivo del toggle de detalle diario
3. **Referencia: plantillas de informes de su software de escritorio** (ver vídeo abajo) — Su programa permite elegir entre múltiples modelos de informe activables con ✓/✗: Portada, Consejos, Ficha Técnica, Lista de la Compra, **Recetas Alternativas**, Menú Diario, Menú en Columnas, **Menú con Fotos**, Menú Distribuido, Menú del Día, **Menú Colectividades**, Planning Días, Planning Comidas — con cabecera personalizable (clínica, doctor, dirección, email, teléfono), texto alternativo a "Paciente", texto a pie de página, logotipo y posición del logotipo, estilos vinculables

**Tareas:**
- [ ] Auditar el CSS de impresión en `src/lib/pdf/generate-plan-pdf.ts` para eliminar espacios en blanco innecesarios
- [ ] Mejorar el `page-break` para que las comidas no dejen huecos grandes
- [ ] Implementar layout compacto: agrupar comidas cortas en la misma página
- [ ] Añadir opción de orientación: vertical (portrait) u horizontal (landscape) — vía `@page { size: A4 landscape; }`
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

## 6. Formulario pre-consulta para pacientes

**Estado actual:** La anamnesis la rellena el dietista en la pestaña "Información" de cada paciente. Soporta campos personalizados. Hay función de enviar cuestionario por email (`enviarCuestionarioPaciente`), pero es solo informativo, no editable por el paciente.

**Petición:** Enviar al paciente un formulario ANTES de la consulta para que complete sus datos (contacto, fecha de nacimiento, alergias, etc.) y no perder tiempo de consulta.

**Input adicional (Alejandra, 2 jun 2026):** Lo pide como "informe de salud pre-entrevista" que el paciente rellene antes de la primera consulta, y recalca que esos datos **se vuelquen automáticamente en los apartados correspondientes** de la ficha (historial médico, alergias, medicamentos, suplementos, actividad física…), no que queden como un documento aparte.

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

**Prioridad:** Alta
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

**Petición:** Incluir la tabla de composición de alimentos BEDCA como opción.

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

## 20. Mostrar cantidad de referencia y editar cantidad en el selector de alimentos

**Estado actual:** Al buscar un alimento en el panel "Añadir alimento o receta" del editor de dietas, cada resultado muestra nombre + macros (kcal, proteínas, carbos, grasas). Pero NO se indica a qué cantidad corresponden esos valores (¿100g? ¿una ración? ¿60g?). Tras añadir el alimento, el nutri tiene que ir a la tarjeta del alimento en la comida para cambiar la cantidad.

**Petición (Anabel Segura, mayo 2025):** Dos mejoras en el selector de alimentos:

1. **Mostrar la cantidad de referencia** junto a los macros — que se vea "por 100g" o "por ración (60g)" de un vistazo, para saber qué significan los números.
2. **Poder editar la cantidad directamente en el selector** antes de añadir — un input de cantidad + unidad en cada resultado, que recalcule los macros en tiempo real. Así se añade el alimento ya con la cantidad correcta sin tener que buscarlo después.

**Tareas:**
- [ ] Mostrar la porción de referencia en cada resultado del selector (ej: "por 100g" o "por ración")
- [ ] Añadir input de cantidad + selector de unidad inline en cada resultado del buscador
- [ ] Recalcular macros en tiempo real al cambiar la cantidad (kcal, P, C, G proporcionales)
- [ ] Al hacer clic en "añadir", usar la cantidad introducida en vez del default
- [ ] Mantener el flujo rápido: que el input no estorbe si el nutri solo quiere añadir rápido con la cantidad por defecto

**Archivos a modificar:**
- `src/components/dieta/selector-alimento.tsx` — resultados de búsqueda y lógica de añadir
- `src/components/dieta/comida-slot.tsx` — recibe el alimento añadido con su cantidad

**Prioridad:** Alta (afecta directamente a la eficiencia del flujo principal de trabajo)
**Complejidad:** Media

---

## 21. Medidas caseras y porciones por unidades

**Estado actual:** Existe el enum `UnidadMedida` con 8 unidades (GRAMOS, UNIDAD, CUCHARADA, TAZA, etc.) y cada alimento tiene un campo `porcion` (gramos por unidad). `convertirAGramos()` calcula correctamente: 2 UNIDAD × porcion(125g) = 250g. El paciente ve la unidad original ("2 ud"), no los gramos.

**Petición (Alba F. / albaf.nutricion, mayo 2025; nutricionista argentina, mayo 2026; Ainara Martín, mayo 2026):** Quiere poner "2 yogures" y que la app entienda que son 250g. O "2 huevos" y que sepa que son 120g. Sin tener que calcular los gramos manualmente. Más visual para el paciente también. La nutricionista argentina pide poder usar medidas caseras (1 taza, 2 tazas…) en los alimentos precargados/globales, no solo en los personalizados. Ainara refuerza: "que en las recetas haya equivalencias a medidas caseras, a la gente no le gusta pesar la comida pero si le dices 2 cazos de alubias sí lo hacen". Aplicar especialmente en recetas, donde los ingredientes deberían mostrarse en medidas caseras (cazos, vasos, cucharadas) además de gramos.

**Lo que falta (gap):**
- [ ] **Porciones nombradas por alimento** — Que yogur tenga "1 yogur = 125g", huevo tenga "1 huevo = 60g", pan tenga "1 rebanada = 30g". No solo la genérica "UNIDAD" sino nombres específicos
- [ ] **Múltiples porciones por alimento** — Un alimento podría tener varias medidas: "1 unidad (125g)", "1 tarrina (250g)", "1 cucharada (15g)"
- [ ] **UX más clara en el selector** — Que al añadir un alimento sea obvio que puedes cambiar de gramos a unidades, y que se vea cuántos gramos equivale
- [ ] **Valores de porción correctos en alimentos precargados** — Muchos alimentos tienen porcion=100 por defecto, deberían tener porciones reales (yogur=125, huevo=60, etc.)

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
| 12 | Bug email portal | Urgente | Baja |
| 1 | Tablas composición por país | Alta | Alta |
| 5 | Planes por opciones (no por día) | Alta | Alta |
| 6 | Formulario pre-consulta paciente | Alta | Media-Alta |
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
| 19 | Búsqueda sin tildes en alimentos | Media-Alta | Baja |
| 20 | Cantidad + macros en selector alimentos | Alta | Media |
| 21 | Medidas caseras / porciones por unidades | Alta | Media |
| 22 | Ajustar ingredientes de receta en plan | Alta | Alta |
| 23 | Comidas reutilizables (grupo de alimentos) | Media-Alta | Media |
| 24 | Cambiar "dietista" → "nutricionista" | Media | Baja |
| 25 | Disclaimer legal al generar con IA | Media-Alta | Baja |
| 26 | Ordenar resultados de búsqueda por relevancia | Alta | Baja |
| 27 | Reordenar alimentos dentro de una comida (drag & drop) | Media-Alta | Media |
| 28 | Informe de composición nutricional de la dieta | Alta | Media |
| 29 | Sección de medidas de bioimpedancia (BIA Tanita) | Media-Alta | Media |
| 30 | Editar horario semanal del paciente | Media | Baja-Media |
| 31 | ✅ Copiar/mover comidas entre días del plan | Alta | Baja-Media |
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
| 45 | Búsqueda tolerante a plural/singular | Alta | Baja |
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

---

## 27. Reordenar alimentos dentro de una comida (drag & drop)

**Estado actual:** En el editor de dietas, cada comida (Desayuno, Almuerzo, etc.) muestra los alimentos en el orden en que se añadieron. Existen botones para mover un alimento a otra comida o a otro día, pero NO se puede cambiar el orden de los alimentos dentro de la misma comida. El modelo `AlimentoEnComida` no tiene campo de orden.

**Petición (Anabel Segura, mayo 2025):** Poder reordenar los alimentos dentro de una comida para que el orden tenga sentido lógico (ej: primero el plato principal, luego la guarnición, luego el postre). Idealmente con drag & drop, o con flechas arriba/abajo.

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

**Origen:** María Moreno Nutricionista — 23 mayo 2026

**Estado actual:** María reporta que en el horario semanal no le deja aplicar las celdas ni editarlo. Puede tratarse de un bug en la funcionalidad de agenda/horario existente, o de la necesidad de que el nutricionista pueda gestionar el horario del paciente directamente.

**Petición:** Que el nutricionista pueda editar el horario semanal del paciente (horarios de comidas, rutinas, disponibilidad) desde su panel, sin depender de que el paciente lo rellene.

**Tareas:**
- [ ] Investigar el bug reportado: verificar por qué no se pueden editar las celdas del horario semanal
- [ ] Asegurar que el nutricionista pueda crear y modificar el horario semanal del paciente desde la ficha del paciente
- [ ] Verificar permisos: el nutricionista debería poder editar el horario de sus pacientes

**Prioridad:** Media (bug reportado + mejora de flujo de trabajo)
**Complejidad:** Baja (si es bug) / Media (si requiere nueva funcionalidad)

---

## 31. Copiar/mover comidas entre días del plan

**Origen:** Nutricionista argentina — mayo 2026; Guille (nutricionista) — 25 mayo 2026; nutricionista (WhatsApp) — 3 junio 2026 (cita explícitamente el **batch cooking** como caso de uso: muchas comidas se reutilizan y reescribirlas es tedioso).

**✅ IMPLEMENTADO Y DESPLEGADO (3 jun 2026).** En el editor de dietas: copiar un alimento suelto (portapapeles → botón "Pegar aquí" en cualquier comida; suma si ya existe, también en recetas), copiar una comida (a varios días y opcionalmente como otro tipo de comida), copiar un día entero, y "Traer de otro plan" (del mismo paciente —aparece el primero— o de otro). El modo "Añadir encima" suma cantidades en vez de duplicar líneas. Extra: buscador de alimentos mejorado (pestañas Alimentos/Recetas además de Mis alimentos/Mis recetas, recetas de la app ahora buscables, badge "Tuyo/Tuya" siempre que el item es propio, abre en Alimentos con sugerencias de macros).

**Estado actual:** En el editor de dietas, cada día (Lunes a Domingo) tiene sus comidas independientes. Para repetir un desayuno del lunes en el martes, hay que recrear la comida manualmente: añadir cada alimento con su cantidad uno por uno. Existen botones para mover un alimento individual a otra comida/día, pero no para copiar una comida entera (con todos sus alimentos) a otro día.

**Petición:** Poder copiar o mover una comida completa (ej: el desayuno del lunes) a otro día de la semana con un clic. Así se monta la semana mucho más rápido cuando varios días comparten comidas similares.

**Tareas:**
- [x] Añadir botón "Copiar comida" en cada slot de comida (junto a los controles existentes)
- [x] Al pulsar, mostrar selector de día destino (Martes, Miércoles, etc.) y tipo de comida destino (Desayuno, Almuerzo, etc.)
- [x] Duplicar todos los `AlimentoEnComida` de la comida origen en la comida destino del día elegido
- [x] Si la comida destino ya tiene alimentos, preguntar: ¿reemplazar o añadir encima? (Añadir = suma cantidades, no duplica)
- [x] Opción de "Copiar día completo" — copiar todas las comidas de un día a otro día
- [ ] Opcionalmente: "Mover comida" (copiar + eliminar la original) — NO incluido (el drag & drop ya mueve alimentos; se valoró innecesario)
- [x] Recalcular macros del día destino tras la copia (automático al refrescar)
- [x] **Copiar desde otros planes** — Importar una comida o día completo de otro plan del mismo paciente o de otro (asistente "Traer de otro plan": paciente → plan → día/comida → días destino)
- [x] **Extra:** copiar/pegar un alimento suelto (portapapeles + "Pegar aquí" en cualquier comida, con suma)

**Archivos a modificar:**
- `src/components/dieta/comida-slot.tsx` — botón de copiar comida y selector de destino
- `src/components/dieta/dia-plan.tsx` — botón de copiar día completo
- `src/app/actions/planes.ts` — server action para duplicar alimentos de una comida/día a otro, incluyendo desde otros planes

**Prioridad:** Alta (afecta directamente a la velocidad de creación de planes — flujo principal de trabajo, pedido por múltiples nutricionistas)
**Complejidad:** Baja-Media (media si se incluye copiar desde otros planes)

---

## 32. Pliegues cutáneos — protocolo ISAK completo y sumatoria

**Origen:** Guille (nutricionista) — 25 mayo 2026; Álvaro (nutricionista, LinkedIn) — 27 mayo 2026

**Estado actual:** La app ya registra 7 pliegues cutáneos basados en el protocolo Jackson & Pollock: abdominal, axilar, pectoral, subescapular, suprailiaco, tricipital y muslo. Se miden en mm con precisión de 0.1 mm. Se guardan en el modelo `MedidaAntropometrica` y se muestran en la pestaña "Mediciones" de la ficha del paciente. No existe cálculo de sumatoria de pliegues ni ecuaciones de composición corporal a partir de los pliegues.

En perímetros, se registran 4: cintura, cadera, brazo y abdomen. No existe perímetro del muslo.

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

**Origen:** Álvaro (nutricionista, LinkedIn) — 27 mayo 2026

**Estado actual:** Los alimentos individuales pueden tener imagen (campo `imagen` base64 en el modelo `Alimento`). Las recetas (`Receta`) no tienen campo de imagen. Cuando el paciente ve su plan en el portal o en el PDF, no hay foto visual del plato montado.

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

**Origen:** Guillermo — mayo 2026

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

*Flujo de revisiones programadas (Miguel, mayo 2026):*
- [ ] Programar revisiones recurrentes por paciente (ej: martes y viernes) — puede ser tipo de cita especial "Revisión"
- [ ] "Lanzar revisión" al paciente: enviar formulario o cuestionario al paciente antes de la revisión (cómo le ha ido, dudas, adherencia)
- [ ] Tras la revisión: registrar nota de sesión + enviar feedback estructurado al paciente por email o portal (resumen de lo hablado, próximos pasos, ajustes al plan)
- [ ] El paciente recibe el feedback y puede consultarlo desde su portal

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

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

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

**Prioridad:** Media-Alta (requisito legal para muchos nutricionistas — el RGPD exige consentimiento documentado)
**Complejidad:** Media

---

## 52. Exportar e importar recetas y composición de alimentos

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** Las recetas y alimentos personalizados se crean dentro de la app y no hay forma de exportarlos (para backup o uso fuera de la app) ni de importar datos masivamente (ej: un nutricionista que tiene sus recetas en Excel o en otra app).

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

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** Las recetas existen como entidad en la app y se pueden añadir a planes alimenticios. En el PDF del plan, las recetas aparecen como parte de las comidas (con ingredientes e instrucciones si se activa la opción). Sin embargo, no se pueden seleccionar recetas sueltas para generar un recetario independiente del plan.

**Petición:** Ainara dice: "si yo quiero darle recetas dulces al paciente además de plan de alimentación, poder hacer por IA o con las que ya están, una selección y bajarlas para imprimírselas." Quiere poder seleccionar un conjunto de recetas (ej: "5 postres saludables") y generar un PDF/recetario bonito para entregar al paciente, independiente del plan alimenticio.

**Concepto:** El nutricionista selecciona recetas de su biblioteca → genera un recetario PDF con portada, índice, y cada receta con ingredientes, instrucciones, macros y foto (si tiene). Puede ser temático: "Recetas dulces", "Cenas rápidas", "Batch cooking semanal", etc.

**Tareas:**
- [ ] UI: seleccionar múltiples recetas desde la lista de recetas (checkboxes)
- [ ] Botón "Generar recetario" con opciones: título del recetario, incluir macros sí/no, incluir fotos sí/no
- [ ] Generar PDF con: portada (título + logo del nutricionista), índice, y cada receta en una página
- [ ] Cada receta muestra: nombre, ingredientes con cantidades (en medidas caseras si aplica), instrucciones paso a paso, macros por porción, foto del plato (si existe)
- [ ] Opción de generar recetas con IA para el recetario (ej: "genera 5 postres saludables sin azúcar")
- [ ] Guardar recetarios creados para reutilizar con otros pacientes
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

**Origen:** María José Sánchez (@Comiendoavocados) — 29 mayo 2026

**Estado actual:** El modelo `SeguimientoDiario` registra: cumplimiento del plan, agua, ejercicio (tipo, minutos, kcal, distancia), notas y datos de comidas (`comidasData` JSON). No existe ningún campo para registrar la sensación de saciedad o hambre del paciente tras las comidas.

**Petición:** Añadir algún tipo de registro para evaluar cómo de saciado se ha quedado el paciente con cada comida, o si se ha quedado con hambre. Información clave para que el nutricionista ajuste las cantidades y la composición del plan.

**Input adicional (Alejandra, 2 jun 2026):** Ampliar el registro más allá de la saciedad — que el paciente pueda anotar **cómo le sienta cada comida**:
- Saciedad: insatisfecho / normal / muy lleno
- Síntomas posprandiales: somnolencia, reflujo, dolor estomacal, inflamación posprandial
- Estado positivo: "en buen estado" (podría salir a caminar 15-20 min después)

Además, pide un **registro dietético con fotos**: que el paciente pueda subir fotos de los platos que come en cada comida. Muy útil para que el nutricionista vea raciones y composición reales sin depender de la descripción escrita.

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

**Estado actual:** En el plan alimenticio, cada comida tiene alimentos fijos con sus cantidades. Si el paciente no quiere o no tiene un alimento, no hay un sistema dentro de la app que le sugiera alternativas equivalentes. El nutricionista puede escribir notas o poner "libre" en algunos alimentos, pero no existe un sistema estructurado de intercambios.

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

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** La sección "Recomendaciones" del PDF es un campo de texto libre que el nutricionista escribe manualmente para cada paciente. No existen plantillas ni bloques predefinidos de recomendaciones por condición.

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

**Origen:** Remedios Velasco (remediosvelascosalazar@gmail.com) — 1 junio 2026; Antonio (antoniofs.nutricion, 4 jun 2026) — lo pide para los que trabajan **online**: apartado para registrar fotos de perfil, de frente y de espalda

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

**Prioridad:** Media (afecta a la imagen de la herramienta — se ven valores sin formatear)
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

**Origen:** nutricionista (WhatsApp) — 1 jun 2026

**Estado actual:** Medicamentos, suplementos, alergias, intolerancias y patologías son listas de texto (`string[]`) y se muestran como texto/lista simple (`renderLista`) en la ficha general del paciente.

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

**Relacionado con:** Tarea #62 (catálogo de suplementos con marca/dosis/posología)
**Prioridad:** Media-Alta (flujo habitual en consulta — la suplementación es parte de la pauta y hoy hay que darla por fuera de la app)
**Complejidad:** Media

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

**Implicación técnica para Annonia:** el catálogo de suplementos (#62) y la pauta de suplementos en el plan (#65) necesitarán soporte de afiliación: código de afiliado por nutricionista (por marca), link de afiliado por producto, y que el código/link aparezca en la pauta (PDF + portal del paciente).

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

**Origen:** nutricionista por WhatsApp (sin identificar) — 2 junio 2026

**Estado actual (verificado en código):** Las recetas globales ("de la app") solo se pueden marcar como favoritas — **no se pueden editar ni duplicar**. En `/recetas/[id]` el botón Editar solo aparece si `!receta.esGlobal`. Si una nutricionista quiere su versión del "Gazpacho andaluz" con otros ingredientes, tiene que crear la receta desde cero.

**Petición:** Quiere "poder modificarlo aquí directamente" al ver una receta de la app. Como las globales son compartidas, la solución natural es **duplicar**: botón "Crear mi versión" / "Duplicar y editar" que copie la receta global a su biblioteca como receta propia, ya editable.

**Tareas:**
- [ ] Botón "Duplicar y editar" en la ficha de recetas globales (junto al de favorito)
- [ ] Server action `duplicarReceta`: copiar receta + ingredientes con `dietistaId` del nutricionista (raw SQL — recordar que el cliente Prisma local no conoce campos nuevos de `recetas`)
- [ ] Tras duplicar, redirigir a `/recetas/[nuevoId]/editar`
- [ ] Indicar en la copia su origen ("basada en Gazpacho andaluz") — opcional
- [ ] Permitir duplicar también recetas propias (útil para variantes por paciente)

**Relacionado con:** Tarea #22 (ajustar ingredientes de receta en el plan — cubre el caso "solo para este plan"; esta cubre "mi versión permanente")
**Prioridad:** Media-Alta (desbloquea personalizar el catálogo global de 315 recetas sin trabajo duplicado)
**Complejidad:** Baja-Media

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

**Relacionado con:** #9 (aplicar macros al plan), #60 (objetivos del sidebar), #67 (patología/objetivo), #29 (composición corporal)
**Prioridad:** Alta (cierra el círculo: objetivo → cálculo → pauta → seguimiento; muy visual para motivar al paciente)
**Complejidad:** Media

---

## 71. Módulo de farmacología: interacciones fármaco-alimento en la pauta

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 2 junio 2026

**Estado actual:** Los medicamentos del paciente se registran como lista de texto en la anamnesis (`string[]`, ver tarea #62). No hay base de datos de fármacos ni detección de interacciones con alimentos.

**Petición (transcripción del audio):** "Otro módulo que yo metería, que yo estoy en ello: un modo de farmacología. Metería todos los medicamentos que haya con las posibles interacciones que puedan tener, sobre todo a nivel nutricional. Por ejemplo, casi todas las medicaciones interaccionan con el pomelo. Como se van a marcar en el listado de medicación, yo lo que estoy haciendo es configurar la IA para que me detecte los fármacos que yo escribo, y así si hay alguna posible interacción dentro de la pauta me la marque con un color más llamativo."

**Concepto:**
1. Base de datos de fármacos comunes con sus interacciones alimento-fármaco relevantes (pomelo, vitamina K/anticoagulantes, lácteos/tetraciclinas, tiramina/IMAOs, alcohol, regaliz, hipérico…)
2. Al registrar la medicación del paciente (idealmente estructurada, tarea #62), detectar los fármacos (texto libre → IA/matching)
3. Al montar o revisar la pauta: si un alimento del plan interacciona con su medicación → **resaltado visual llamativo** + explicación de la interacción
4. Aviso también en la generación con IA (pasar las interacciones como restricción al prompt)

**Tareas:**
- [ ] Investigar fuente de datos de interacciones fármaco-nutriente (AEMPS/CIMA, bases públicas, bibliografía) — calidad clínica crítica
- [ ] Modelo `Farmaco` (nombre, principio activo, interacciones: alimento/grupo + severidad + descripción)
- [ ] Matching de la medicación del paciente (texto libre) contra la BD de fármacos — IA o fuzzy matching
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

## 74. Notificaciones de cita que lleguen de verdad al paciente (email automático + botón WhatsApp)

**Origen:** Noelia (noelia_kreasalud, Instagram) — 4 junio 2026

**Estado actual (verificado en código):** La "notificación al paciente" de una cita es **solo in-app**: crea un registro en la tabla `notificacion` que el paciente ve como badge/aviso DENTRO de su portal cuando entra (`notificaciones-paciente.ts`). **No se envía nada externo** al móvil del paciente: ni email, ni SMS, ni WhatsApp, ni push. Por eso Noelia probó "notificar al paciente" para una cita de prueba y no le llegó nada al teléfono. No es un bug de envío fallido — es que esa notificación nunca sale de la app.

**Petición:** Que cuando se notifica/recuerda una cita, al paciente le llegue de verdad (no solo dentro del portal).

**Solución (dos vías, ambas sin coste):**
- [ ] **Email automático de cita** — Enviar email al paciente al crear/confirmar/recordar una cita, reutilizando el mailer existente (gratis, ya montado). Plantilla con fecha, hora, modalidad y, si es online, el enlace. Es la opción "automática".
- [ ] **Botón "Avisar por WhatsApp"** — Botón que abra el WhatsApp del propio nutricionista (`https://wa.me/<telefono>?text=<mensaje>`) con el recordatorio ya escrito al paciente, y el nutri solo le da a enviar. Coste cero, sin API ni plantillas de Meta. Mismo patrón que ya se usa con el teléfono de los solicitantes de ofertas (copy/WhatsApp de un clic, commit 1a6cd8c).

**Descartado por coste/complejidad (de momento):**
- SMS: de pago (proveedor tipo Twilio, ~0,05-0,08 €/SMS)
- WhatsApp Business API oficial: de pago + registro y aprobación de plantillas por Meta

**Archivos probables:** `src/app/actions/citas-flujo.ts` / `citas.ts` (disparar email al notificar), `src/app/actions/email.ts` + `src/lib/mailer.ts` (plantilla de cita), UI de la cita en la agenda (botón WhatsApp).
**Prioridad:** Alta (un recordatorio que no llega al paciente no sirve; es funcionalidad básica esperada y reduce ausencias a consulta)
**Complejidad:** Baja (email) / Baja (botón WhatsApp con wa.me)
