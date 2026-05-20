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

**Tareas:**
- [ ] Crear modelo `ArchivoPaciente` en Prisma (id, pacienteId, dietistaId, nombre, tipo, url/base64, categoria, notas, createdAt)
- [ ] Categorías de archivo: analisis_sangre, estudio_medico, plan_externo, receta_medica, otro
- [ ] Implementar subida de archivos (Supabase Storage o base64 en BD según tamaño)
- [ ] Límite de tamaño por archivo y por paciente
- [ ] UI: nueva pestaña "Archivos" en ficha del paciente
- [ ] Vista previa de PDFs e imágenes
- [ ] Para análisis de sangre: parseo opcional con IA para extraer valores clave (hemoglobina, glucosa, colesterol, etc.) y mostrarlos en un resumen/cuadrito
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

**Tareas:**
- [ ] Auditar el CSS de impresión en `src/lib/pdf/generate-plan-pdf.ts` para eliminar espacios en blanco innecesarios
- [ ] Mejorar el `page-break` para que las comidas no dejen huecos grandes
- [ ] Implementar layout compacto: agrupar comidas cortas en la misma página
- [ ] Añadir opción de orientación: vertical (portrait) u horizontal (landscape) — vía `@page { size: A4 landscape; }`
- [ ] Opción de densidad: "normal" vs "compacto" (reduce paddings, fuentes más pequeñas)
- [ ] Considerar layout de 2 columnas en horizontal para aprovechar espacio
- [ ] Probar con planes reales de diferentes tamaños para verificar

**Archivos a modificar:**
- `src/lib/pdf/generate-plan-pdf.ts` (layout principal)
- `src/lib/pdf/pdf-themes.ts` (si se añaden opciones de densidad)
- `src/components/paciente/entregables-tab.tsx` (UI de opciones)

**Prioridad:** Media
**Complejidad:** Media

---

## 5. Planes por opciones de comida (sin separar por día)

**Estado actual:** Los planes SIEMPRE se organizan por día de la semana (LUNES a DOMINGO). Modelo: `PlanAlimenticio → DiaDelPlan(dia: DiaSemana) → ComidaDelDia → AlimentoEnComida`.

**Petición:** Modo alternativo donde el profesional da "opciones de desayuno", "opciones de almuerzo", etc., sin asignar a un día concreto. Que el profesional elija el formato según el paciente.

**Tareas:**
- [ ] Añadir campo `modalidad` al modelo `PlanAlimenticio`: "SEMANAL" (actual) o "OPCIONES"
- [ ] En modalidad OPCIONES: reutilizar `DiaDelPlan` pero renombrando conceptualmente (Opción 1, Opción 2, etc.) o crear nuevo modelo
- [ ] Alternativa: usar `DiaDelPlan.dia` con valores especiales (OPCION_1, OPCION_2...) o un campo `label` libre
- [ ] UI del editor de plan: cuando modalidad = OPCIONES, agrupar por tipo de comida (Desayunos, Almuerzos, Cenas) en vez de por día
- [ ] Actualizar generación con IA para soportar modalidad OPCIONES
- [ ] Actualizar PDF: en modalidad OPCIONES, layout agrupado por comida (no por día)
- [ ] Actualizar vista del paciente en portal para mostrar opciones correctamente
- [ ] Selector al crear plan: "¿Cómo quieres organizar este plan?"

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

## 9. Cálculo automático de gramos desde % de macros

**Estado actual:** En la pestaña "Planificación" del paciente existen las ecuaciones de metabolismo basal (Harris-Benedict, Mifflin-St Jeor, etc.) y se puede calcular el gasto energético. Hay referencias de rangos de macros (IOM, ANSES, etc.). Pero NO hay cálculo automático de: "pongo 2000 kcal y 30% proteínas → me calcula los gramos".

**Petición:** Poner las kcal objetivo, seleccionar % de cada macro, y que calcule automáticamente los gramos.

**Tareas:**
- [ ] En la sección de planificación, añadir inputs de % para proteínas, carbohidratos y grasas
- [ ] Validar que los % sumen 100% (o mostrar warning)
- [ ] Cálculo automático: proteínas_g = (kcal × %P) / 4, carbos_g = (kcal × %C) / 4, grasas_g = (kcal × %G) / 9
- [ ] Bidireccional: si se cambian los gramos, recalcular el %
- [ ] Guardar los valores calculados como objetivos del plan (`caloriasObjetivo`, `proteinasObjetivo`, etc.)
- [ ] Botón "Aplicar a plan" que establezca estos objetivos en el plan activo del paciente
- [ ] Integrar con las referencias de macros existentes (IOM, ANSES, SACN, SINU, NHMRC)

**Archivo principal:** `src/components/paciente/planificacion-por-defecto-tab.tsx`

**Prioridad:** Media
**Complejidad:** Baja

---

## 10. Ecuación de Harris-Benedict automática

**Estado actual:** YA IMPLEMENTADA. En `planificacion-por-defecto-tab.tsx` están:
- Harris-Benedict original (1919)
- Harris-Benedict revisada (Roza & Shizgal, 1984)
- Mifflin-St Jeor (1990)
- OMS/Schofield (1985)
- Henry/Oxford (2005)
- Katch-McArdle (1983) — requiere % grasa
- Cunningham (1980)
- Black et al. (1996)
- Ten Haaf & Weijs (2014)

**Petición del nutricionista:** "Que calcule automático y después me deje modificar para hacer déficit".

**Tareas (mejora UX):**
- [ ] Verificar que el flujo actual sea intuitivo: seleccionar ecuación → resultado → poder editar el valor
- [ ] Añadir botones rápidos de ajuste: "-10%", "-15%", "-20%" para déficit, y "+10%", "+15%" para superávit
- [ ] Mostrar claramente el valor "calculado" vs el valor "ajustado" (ej: "2200 kcal calculadas → 1870 kcal con déficit 15%")
- [ ] Auto-rellenar peso, altura, edad y sexo desde los datos del paciente (verificar que ya lo haga)

**Prioridad:** Baja (ya funciona, solo mejora UX)
**Complejidad:** Baja

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

**Prioridad:** Media
**Complejidad:** Media-Alta

---

## 12. Bug: instrucciones del email no se pueden abrir

**Estado actual:** El email de acceso al portal envía un link a `{NEXT_PUBLIC_APP_URL}/paciente/login`. El nutricionista reporta que "las instrucciones que llegan al mail para usar el portal no se pueden abrir. No es válido."

**Posibles causas:**
- Variable `NEXT_PUBLIC_APP_URL` mal configurada en producción
- El link del email apunta a HTTP en vez de HTTPS
- El email client corta o modifica la URL
- El paciente no tiene cuenta creada / PIN asignado

**Tareas:**
- [ ] Verificar el valor de `NEXT_PUBLIC_APP_URL` en producción (debe ser `https://annonia.com`)
- [ ] Revisar email recibido por el paciente: qué link exacto se muestra
- [ ] Probar el flujo completo: crear paciente → enviar acceso → paciente abre email → clic en link → login
- [ ] Si es problema de URL, corregir la variable de entorno
- [ ] Considerar añadir fallback: "Si el botón no funciona, copia este enlace: ..."

**Prioridad:** Urgente (bug en producción que bloquea onboarding de pacientes)
**Complejidad:** Baja (probablemente configuración)

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

## 14. Ocultar calorías al paciente (vista web del portal)

**Estado actual:** En el PDF se puede toggle "Valores nutricionales" para mostrar/ocultar. Pero en la vista web del portal (`/paciente/portal/dieta`) las calorías SIEMPRE se muestran.

**Petición:** Que el profesional pueda elegir, por cada paciente, si las calorías y macros son visibles en el portal web. Importante para pacientes con riesgo de obsesión con el conteo.

**Tareas:**
- [ ] Añadir campo `ocultarCalorias` (Boolean, default false) al modelo `Paciente` o `PlanAlimenticio`
- [ ] UI en la ficha del paciente: toggle "Ocultar calorías y macros al paciente"
- [ ] En el portal del paciente (`/paciente/portal/dieta`): condicionar la visualización de kcal, proteínas, carbos, grasas según el flag
- [ ] En el portal del paciente: ocultar también en el resumen diario/semanal
- [ ] En el seguimiento: si calorías ocultas, no mostrar kcal de ejercicio tampoco
- [ ] El dietista siempre ve todo en su dashboard (el flag solo afecta al portal)
- [ ] Considerar granularidad: ocultar solo kcal, o también macros, o configurable

**Archivos a modificar:**
- `prisma/schema.prisma`
- `src/app/paciente/portal/dieta/page.tsx`
- `src/components/paciente/paciente-ficha-client.tsx` (toggle en ficha)
- `src/app/actions/pacientes.ts`

**Prioridad:** Alta (pedido explícito por razones clínicas)
**Complejidad:** Baja-Media

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

**Prioridad:** Alta
**Complejidad:** Media-Alta

---

## 19. Búsqueda de alimentos sin importar tildes

**Estado actual:** El buscador de alimentos (en el editor de dietas, recetas, y la lista de alimentos) usa `mode: "insensitive"` de Prisma, que ignora mayúsculas/minúsculas pero NO ignora tildes/acentos. Buscar "platano" no encuentra "Plátano".

**Petición (Anabel Segura, mayo 2025):** Que al buscar alimentos no sea necesario poner las tildes correctamente. "Platano" debería encontrar "Plátano", "salmon" debería encontrar "Salmón", etc. Para ser más rápida al escribir.

**Tareas:**
- [ ] Normalizar el input de búsqueda eliminando diacríticos (`.normalize("NFD").replace(/[̀-ͯ]/g, "")`) en `sanitizeSearch()` de `validation.ts`
- [ ] Añadir columna `nombreNormalizado` en el modelo `Alimento` (sin tildes) para buscar contra ella, o usar `unaccent` de PostgreSQL
- [ ] Aplicar la misma normalización en todos los puntos de búsqueda: `buscarAlimentosYRecetas()`, `getAlimentos()`, `buscarAlimentosParaReceta()`
- [ ] Verificar que también funcione para recetas (búsqueda de ingredientes)

**Archivos a modificar:**
- `src/lib/validation.ts` — `sanitizeSearch()`
- `src/app/actions/alimentos.ts` — `getAlimentos()`, `buscarAlimentosParaReceta()`
- `src/app/actions/recetas.ts` — `buscarAlimentosYRecetas()`

**Prioridad:** Media-Alta (afecta a la velocidad de trabajo diaria del nutri)
**Complejidad:** Baja

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

**Petición (Alba F. / albaf.nutricion, mayo 2025):** Quiere poner "2 yogures" y que la app entienda que son 250g. O "2 huevos" y que sepa que son 120g. Sin tener que calcular los gramos manualmente. Más visual para el paciente también.

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

**Petición (Alba F. / albaf.nutricion, mayo 2025):** Poder ajustar las cantidades de cada ingrediente de una receta directamente desde el plan, sin tener que editar la receta original. Dice que ninguna plataforma que ha visto lo hace bien.

**Tareas:**
- [ ] Al añadir una receta a un plan, crear una "instancia" editable de la receta (no una referencia fija)
- [ ] UI para expandir la receta dentro de la comida y ajustar cantidades de cada ingrediente
- [ ] Los cambios solo afectan a esa instancia en ese plan, no a la receta original
- [ ] Recalcular macros totales de la receta cuando se cambia un ingrediente
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
| 14 | Ocultar calorías al paciente | Alta | Baja-Media |
| 1 | Tablas composición por país | Alta | Alta |
| 5 | Planes por opciones (no por día) | Alta | Alta |
| 6 | Formulario pre-consulta paciente | Alta | Media-Alta |
| 15 | Integrar BEDCA | Alta | Media |
| 2 | Subir análisis/archivos | Media-Alta | Media |
| 3 | Combinar tipos de dieta | Media | Baja-Media |
| 4 | Mejorar formato PDF | Media | Media |
| 8 | Múltiples actividades/día | Media | Media |
| 9 | % macros → gramos automático | Media | Baja |
| 11 | Link público reserva citas | Media | Media-Alta |
| 13 | Multi-moneda (pesos) | Media | Media-Alta |
| 7 | Selector país paciente | Baja-Media | Baja |
| 16 | Indicador visual fuente alimento | Media | Baja |
| 17 | Newsletter actualizaciones semanales | Media | Media |
| 10 | Mejora UX Harris-Benedict | Baja | Baja |
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

---

## 26. Ordenar resultados de búsqueda de alimentos por relevancia

**Estado actual:** Al buscar alimentos (en el editor de dietas, recetas, y la lista de alimentos), los resultados se devuelven por orden de BD (normalmente por ID o nombre alfabético). Si buscas "tomate", puede aparecer "Tomate cherry" o "Salsa de tomate" antes que "Tomate". Lo mismo con "plátano" — el resultado exacto no se prioriza.

**Petición (Anabel Segura, mayo 2025):** Que al buscar un alimento, el resultado más relevante (coincidencia exacta o más cercana) aparezca primero. Si escribes "tomate", lo primero debe ser "Tomate", y después "Tomate cherry", "Salsa de tomate", etc. Si escribes "plátano", lo primero debe ser "Plátano".

**Tareas:**
- [ ] Implementar ordenación por relevancia en los resultados de búsqueda de alimentos:
  1. **Coincidencia exacta** (nombre = búsqueda) → primero
  2. **Empieza por la búsqueda** (nombre starts with búsqueda) → segundo, ordenados por longitud de nombre (más corto = más relevante)
  3. **Contiene la búsqueda** (nombre contains búsqueda) → tercero
- [ ] Aplicar la misma lógica en todos los puntos de búsqueda: `getAlimentosPaginados()`, `buscarAlimentosYRecetas()`, `buscarAlimentosParaReceta()`
- [ ] La ordenación debe ser case-insensitive y accent-insensitive (complementa tarea #19)
- [ ] Considerar hacer la ordenación en el servidor (SQL `ORDER BY CASE WHEN...`) o en el cliente tras recibir resultados

**Archivos a modificar:**
- `src/app/actions/alimentos.ts` — `getAlimentosPaginados()`, `buscarAlimentosParaReceta()`
- `src/app/actions/recetas.ts` — `buscarAlimentosYRecetas()`
- Alternativa: ordenar en el componente cliente que recibe los resultados

**Relacionado con:** Tarea #19 (búsqueda sin tildes)
**Prioridad:** Alta (afecta a la velocidad de trabajo diaria — el nutri pierde tiempo buscando entre resultados desordenados)
**Complejidad:** Baja

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
