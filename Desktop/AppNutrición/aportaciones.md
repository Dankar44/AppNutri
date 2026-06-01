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
| 29 | Sección de medidas de bioimpedancia (BIA Tanita) | Media-Alta | Media |
| 30 | Editar horario semanal del paciente | Media | Baja-Media |
| 31 | Copiar/mover comidas entre días del plan | Alta | Baja-Media |
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
| 44 | IA repite alimentos y dieta poco equilibrada | Alta | Media |
| 45 | Búsqueda tolerante a plural/singular | Alta | Baja |
| 46 | Changelog público de novedades | Media-Alta | Baja |
| 47 | Directorio público de nutricionistas | Alta | Alta |
| 48 | Ver todas las fórmulas de % grasa a la vez | Media | Baja |
| 49 | Generar plan algorítmico sin IA (desde BD de alimentos) | Media-Alta | Alta |
| 50 | Notas de consulta/seguimiento por sesión | Alta | Media |
| 51 | Documentación RGPD personalizada por nutricionista | Media-Alta | Media |
| 52 | Exportar/importar recetas y composición de alimentos | Media | Media |
| 53 | Recetario imprimible para entregar al paciente | Media-Alta | Media |
| 54 | Registro de saciedad/hambre en seguimiento diario | Media | Baja |
| 55 | Sistema de intercambio de alimentos | Media | Media-Alta |
| 56 | Recomendaciones predefinidas por patología | Alta | Media |
| 57 | Agrupar comidas repetidas en PDF (deduplicación) | Media | Baja-Media |

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

**Estado actual:** El sistema de mediciones del paciente registra peso, altura, IMC, perímetros corporales y % de grasa corporal (un solo valor global). No existe la posibilidad de registrar valores segmentados de bioimpedancia.

**Petición:** Muchos nutricionistas hacen seguimiento con BIA Tanita (básculas de bioimpedancia). Quieren poder registrar los valores segmentados: masa muscular, masa grasa, agua corporal y demás parámetros que proporciona la bioimpedancia, no solo el peso y % de grasa global.

**Tareas:**
- [ ] Investigar qué valores devuelve una BIA Tanita típica (masa muscular total y segmentada, masa grasa total y segmentada, agua corporal, masa ósea, metabolismo basal, edad metabólica, grasa visceral, etc.)
- [ ] Crear modelo `MedidaBioimpedancia` o ampliar el modelo `Medida` existente con campos opcionales para bioimpedancia
- [ ] Campos principales: masaMuscularKg, masaGrasaKg, aguaCorporalPct, masaOseaKg, grasaVisceralNivel, edadMetabolica, metabolismoBasalKcal
- [ ] Campos segmentados opcionales: brazo derecho/izquierdo, pierna derecha/izquierda, tronco (masa muscular y % grasa por segmento)
- [ ] UI en la ficha del paciente: nueva sección o pestaña "Bioimpedancia" con formulario para registrar estos valores
- [ ] Gráficas de evolución de los valores de bioimpedancia a lo largo del tiempo
- [ ] Considerar importación automática si Tanita tiene API o exportación de datos

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

**Origen:** Nutricionista argentina — mayo 2026; Guille (nutricionista) — 25 mayo 2026

**Estado actual:** En el editor de dietas, cada día (Lunes a Domingo) tiene sus comidas independientes. Para repetir un desayuno del lunes en el martes, hay que recrear la comida manualmente: añadir cada alimento con su cantidad uno por uno. Existen botones para mover un alimento individual a otra comida/día, pero no para copiar una comida entera (con todos sus alimentos) a otro día.

**Petición:** Poder copiar o mover una comida completa (ej: el desayuno del lunes) a otro día de la semana con un clic. Así se monta la semana mucho más rápido cuando varios días comparten comidas similares.

**Tareas:**
- [ ] Añadir botón "Copiar comida" en cada slot de comida (junto a los controles existentes)
- [ ] Al pulsar, mostrar selector de día destino (Martes, Miércoles, etc.) y tipo de comida destino (Desayuno, Almuerzo, etc.)
- [ ] Duplicar todos los `AlimentoEnComida` de la comida origen en la comida destino del día elegido
- [ ] Si la comida destino ya tiene alimentos, preguntar: ¿reemplazar o añadir encima?
- [ ] Opción de "Copiar día completo" — copiar todas las comidas de un día a otro día
- [ ] Opcionalmente: "Mover comida" (copiar + eliminar la original)
- [ ] Recalcular macros del día destino tras la copia
- [ ] **Copiar desde otros planes** — Poder importar una comida o día completo de otro plan nutricional del mismo paciente o de otro paciente. Selector: elegir plan origen → día → comida, y copiar al plan actual. Útil para reutilizar comidas ya probadas sin recrearlas desde cero.

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

## 44. Feedback: IA repite alimentos y dieta poco equilibrada

**Origen:** Cris Asnadi Nutricionista (dietauric, WhatsApp) — 29 mayo 2026

**Feedback completo:** "La app me parece muy bien. El otro día intenté crear un plan con IA por curiosidad y no me funcionó muy bien me repetía muchos alimentos y no parecía equilibrada. Estoy utilizando la app como soporte a mi trabajo y me está ayudando mucho. Faltaban algunos alimentos es lo que he visto. Aún tengo que profundizar más en ella pero me parece que está muy bien y es muy completa. Lo que te dije del tema hormonal ya he visto que se puede poner la fecha de nacimiento a mano que eso agiliza el trabajo."

También dice: "Les diré a algunas compañeras a ver si les interesa algunas ya trabajan con otras apps!"

**Problemas reportados:**
1. **IA repite muchos alimentos** — El plan generado por IA no varía suficiente entre días/comidas
2. **Dieta no equilibrada** — La distribución nutricional del plan generado no parece correcta
3. **Faltan algunos alimentos** — La base de datos no tiene todos los alimentos que necesita

**Positivo:** Usa la app como soporte a su trabajo y le ayuda mucho. La considera muy completa. Va a recomendar a compañeras.

**Tareas:**
- [ ] Revisar el prompt de generación IA para forzar más variedad de alimentos entre días (penalizar repeticiones)
- [ ] Añadir instrucción explícita de equilibrio nutricional en el prompt (distribución de macros por comida)
- [ ] Investigar qué alimentos faltan — posiblemente alimentos específicos de su especialidad o región
- [ ] Relacionado con tarea #1 (tablas de composición por país) y #26 (relevancia en búsqueda)

**Prioridad:** Alta (la IA es feature clave — si genera planes malos, los nutris no la usan)
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

**Estado actual:** En la sección de Planificación existen múltiples ecuaciones de metabolismo basal (Harris-Benedict, Mifflin-St Jeor, OMS, etc.) que se pueden comparar. Para el % de grasa corporal, los cálculos se hacen a partir de pliegues cutáneos (#32) pero solo se muestra un resultado según la ecuación seleccionada, no una comparativa de todas las fórmulas disponibles.

**Petición:** Tener un apartado similar al de las fórmulas de metabolismo basal pero para % de grasa corporal, donde se puedan ver TODAS las fórmulas a la vez (Durnin & Womersley, Faulkner, Jackson & Pollock, Siri, Brozek, etc.) y no solo una. Ainara dice: "me gustan los datos, tener un apartado como el que aparece con las fórmulas para % de grasa donde se puedan ver todas de una, no marca una en concreto."

**Tareas:**
- [ ] Crear vista comparativa de fórmulas de composición corporal: mostrar el resultado de todas las ecuaciones aplicables simultáneamente
- [ ] Ecuaciones a incluir: Durnin & Womersley (1974), Faulkner (1968), Jackson & Pollock 3/7 pliegues, Siri (1961), Brozek (1963)
- [ ] Mostrar qué pliegues/datos usa cada ecuación y resaltar si faltan datos para alguna
- [ ] Formato similar al comparador de ecuaciones de metabolismo basal existente

**Relacionado con:** Tarea #32 (pliegues ISAK) y #10 (mejora UX ecuaciones)
**Prioridad:** Media
**Complejidad:** Baja

---

## 49. Generar plan alimenticio algorítmico sin IA (desde base de datos de alimentos)

**Origen:** Ainara Martín (ainara_nutri, Instagram) — 29 mayo 2026

**Estado actual:** Los planes se pueden crear manualmente (añadiendo alimentos uno a uno) o con IA (Groq genera el plan completo). No existe un punto intermedio que use la base de datos de alimentos y recetas para generar un plan calculado algorítmicamente según los objetivos de macros del paciente.

**Petición:** Ainara dice: "lo planes con IA genial pero si estaría guay como tiene bvas e de datos de composición de alimentos y recetas que he visto que vais añadiendo poco a poco, que te calcule con ello sin meter IA de por medio." Quiere que la app genere un plan basado en la BD de alimentos/recetas, ajustando cantidades para cumplir los objetivos de macros, sin depender de la IA.

**Concepto:** El nutricionista define: kcal objetivo, distribución de macros (% P/C/G), número de comidas, preferencias/restricciones. La app selecciona alimentos de la BD y calcula cantidades para alcanzar los objetivos, como una calculadora de dietas clásica.

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
1. Enviar el lunes un documento con todas las preguntas que usa en su base de datos de anamnesis
2. Hacer una videollamada para explicar su sistema si hace falta

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
