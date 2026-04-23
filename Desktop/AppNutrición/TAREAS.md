# Tareas pendientes

Tareas pendientes para Daniel sobre AppNutri. Se van añadiendo aquí según vayan surgiendo para que quede histórico de lo pedido.

---

## 1. Sistema de solicitud de citas paciente → nutricionista

Revisar/montar el flujo completo de reserva de citas con los siguientes requisitos.

### 1.1. Horario del nutricionista
- El nutricionista debe poder **guardar su horario de trabajo** (días y franjas horarias en los que está disponible).
- Este horario es la base de disponibilidad que verá el paciente.

### 1.2. Vista del paciente
- El paciente ve el **horario de trabajo de su nutricionista**.
- Puede **seleccionar una hora/media hora libre** (que no esté ya ocupada por otro paciente).
- Al seleccionarla, **solicita al nutricionista** que le asigne ese slot.

### 1.3. Notificación al nutricionista
- La solicitud llega al nutricionista como **notificación** (en el bell de notificaciones).
- La notificación debe mostrar:
  - **Foto/avatar del paciente** que la solicita.
  - Frase tipo: *"[Nombre del paciente] te ha solicitado una cita para [fecha/hora]"*.

### 1.4. Respuesta del nutricionista
- El nutricionista puede:
  - **Aceptar** la cita → se confirma el slot.
  - **Rechazar** y **proponer otra fecha/hora** que considere mejor.
- En caso de propuesta alternativa, el paciente debe recibir la contrapropuesta y poder aceptarla o rechazarla.

### 1.5. Integración con Google Calendar
- Una vez que la cita queda **confirmada**, debe guardarse automáticamente en:
  - El **Google Calendar del nutricionista**.
  - El **Google Calendar del paciente**.
- Toda la actividad de citas debe poder sincronizarse con Google Calendar.

### 1.6. Consideraciones
- Revisar qué parte de este flujo ya existe en el código (hay cosas de agenda y Google Calendar ya hechas) y qué falta.
- Evitar solapes: una franja reservada no debe aparecer seleccionable para otro paciente.
- El paciente solo puede ver horarios de **su** nutricionista asignado.

---

## 2. Paciente demo/imaginario — pagos pendientes

El paciente demo ya está implementado (seed automático al registrarse, badge "Paciente de ejemplo", auto-ajuste de fechas al mes actual, banner con credenciales del portal, flag de eliminación + botón Restaurar, seguimiento diario con estados reales, etc.). Lo único pendiente:

### 2.1. Pagos — **bloqueado por Stripe**

Aún no está integrado Stripe (ni otro proveedor) para cobros paciente → nutri. Cuando se integre, añadir al paciente demo (y al flujo general):

- Modelo `Pago { id, pacienteId, dietistaId, cantidad, concepto, estado (PAGADO/PENDIENTE/FALLIDO), fechaPago, metodoPago, stripePaymentIntentId? }`.
- Migración de BD.
- UI en la ficha del paciente (probablemente nueva pestaña "Pagos" o sección en "General").
- Seed del demo con 2-3 pagos de ejemplo (1 pagado, 1 pendiente).
- Revisar si hay código de **Stripe Connect** ya esbozado en el repo (hay commits previos mencionándolo) y completar a partir de ahí.

---

## 3. Facilitar el rellenado de micronutrientes al crear un alimento

### 3.1. Problema
Al añadir un alimento nuevo (ej. "Mousse de chocolate de la marca X" que un nutricionista recomienda a varios pacientes), el formulario pide **24 micronutrientes** (vitaminas A/B6/B12/C/D/E/K, tiamina, riboflavina, niacina, folato, ácido pantoténico, colina, calcio, hierro, magnesio, fósforo, potasio, sodio, cinc, cobre, manganeso, selenio, flúor).

En la práctica, el nutricionista **solo conoce los datos del etiquetado nutricional** del producto (calorías, proteínas, hidratos, grasas, fibra, sal). No tiene tabla completa de micros, y rellenarlos a mano 24 veces por alimento es inviable.

**Objetivo**: explorar formas de que el profesional pueda añadir alimentos con precisión **sin tener que conocer los 24 valores**, y que la app los complete o estime de forma razonable.

### 3.2. Opciones a explorar (Guillermo)

#### A. Escaneo de código de barras / búsqueda por producto
- **Open Food Facts API** ([world.openfoodfacts.org](https://world.openfoodfacts.org)) — base de datos colaborativa, gratuita, con millones de productos europeos. Incluye muchos productos españoles por EAN. Permite buscar por código de barras o por nombre y devuelve macros + varios micros.
- **FatSecret Platform API** — base de datos comercial muy extensa, tiene tier gratuito limitado.
- **Nutritionix API** — base de datos grande (restaurantes + productos), freemium.

#### B. Bases de datos oficiales de composición de alimentos
- **BEDCA** (Base Española de Datos de Composición de Alimentos, [bedca.net](https://www.bedca.net)) — oficial del MSC, cubre ~900 alimentos genéricos españoles con los 24 micros completos. Sería ideal para alimentos base ("pollo", "arroz blanco", "manzana"), no tanto para productos de marca.
- **USDA FoodData Central** — estándar americano, muy completo pero en inglés y unidades no 100% alineadas.
- **CIQUAL** (Francia) — equivalente al BEDCA francés.

**Uso**: el nutricionista escribe "mousse de chocolate" → la app sugiere matches de BEDCA / Open Food Facts y rellena los 24 micros automáticamente.

#### C. Link del producto (idea del cliente)
El nutricionista pega la URL de Mercadona / Carrefour / Amazon / web de la marca, y la app:
- Extrae el EAN o nombre del producto.
- Busca en Open Food Facts por EAN.
- Si encuentra match → rellena todo.
- Si no → al menos extrae los macros del schema.org del HTML (muchas webs de supermercados ya los publican en formato estructurado).

Es una buena UX pero **dependiente** de que el producto esté indexado en Open Food Facts o que la web publique datos estructurados. Sería un "best effort" — si funciona, genial; si no, cae al plan B.

#### D. Estimación por IA (Groq / GPT)
Pasar el nombre del alimento a un LLM con el prompt "estima valores nutricionales para 100g de [X]" y que devuelva JSON con los 24 micros.
- **Pros**: rellena cualquier alimento, incluso recetas caseras.
- **Contras**: son **estimaciones**, no datos reales. Hay que dejar claro al nutricionista que son valores aproximados y marcarlos visualmente (ej. badge "estimado por IA").
- Buena opción como **fallback** cuando las bases de datos no tienen el producto.

#### E. Duplicar desde alimento similar
Botón "Crear a partir de un alimento existente" → el nutricionista busca "mousse de chocolate genérica", selecciona, y la app precarga todos los valores. Luego el nutricionista **solo modifica los macros del etiquetado** del producto nuevo y mantiene los micros del original. Asume que los micros son similares (razonable para productos parecidos).

#### F. Micronutrientes **opcionales** + estimación sobre la marcha
Hacer que los 24 micros no sean obligatorios. El nutricionista guarda el alimento con solo macros. Cuando se calcule la micronutrición del día del paciente, la app:
- Usa los micros del alimento si existen.
- Si no, los estima desde una categoría genérica ("categoría: dulces/postres") usando valores promedio de BEDCA.
- Se avisa en la ficha del paciente: "12 alimentos del día tienen micronutrientes estimados".

Es la solución más pragmática a corto plazo. **Probablemente debería combinarse con una de las anteriores.**

#### G. Importación masiva CSV
Para nutricionistas con muchos alimentos propios, un botón "Importar CSV" con plantilla descargable. No resuelve el caso del cliente pero es un complemento.

### 3.3. Recomendación inicial
La combinación más realista sería:

1. **Fase 1 (corto)**: hacer micronutrientes **opcionales** (opción F) para no bloquear. Añadir estimación por categoría.
2. **Fase 2 (medio)**: integrar **Open Food Facts** (opción A) con búsqueda por nombre + código de barras desde móvil (la cámara del paciente/nutricionista puede escanear).
3. **Fase 3 (largo)**: añadir **IA de estimación** (opción D) para alimentos que no aparezcan en ninguna base de datos.

El **link del producto** (opción C) puede ser parte de la fase 2 como atajo — si detecta EAN en la URL, buscar en Open Food Facts.

### 3.4. Preguntas a resolver
- ¿Los alimentos son por-dietista o globales? Si son globales, hay que moderar lo que se añade (evitar duplicados y basura).
- ¿Queremos que los valores estimados por IA se marquen como tal en la ficha del paciente (trazabilidad)?
- ¿Open Food Facts permite uso comercial? (Sí, ODbL — hay que atribuir.)

---

## 4. Revisión manual del flujo Google (Guillermo, pruebas en local)

Integración Google Calendar + Meet + Sign in with Google ya implementada y configurada en `.env.local` (Client ID + Secret reales). OAuth consent screen en modo "Testing" → Guillermo debe añadirse como **Test user** en Google Cloud Console (APIs & Services → OAuth consent screen → Test users) si no lo está ya, o Google lo bloqueará.

### 4.1. Pasos a probar en local (después de reiniciar `npm run dev`)

1. **Conectar Google del nutri**
   - Ir a `http://localhost:3000/ajustes` → sección **Integraciones** → **Conectar con Google**.
   - Debe abrir pantalla de consentimiento de Google.
   - Primera vez aparecerá aviso *"App no verificada"* → pulsar **Avanzado → Ir a NutriApp (no seguro)**.
   - Aceptar permisos → debe volver a Ajustes con mensaje verde "conectado correctamente".
   - Verificar que aparece el email conectado y el toggle "Sincronizar citas automáticamente".

2. **Crear una cita online con Meet**
   - `/agenda/nueva` → seleccionar paciente + fecha + hora → marcar checkbox **"Cita online (Google Meet)"** → Crear cita.
   - Abrir la cita desde la agenda → en el modal debe aparecer *"Unirse a Google Meet"* con link clicable en pocos segundos.
   - Comprobar en Google Calendar real que el evento aparece con el link de Meet generado.

3. **Backfill al conectar**
   - Tras conectar, citas existentes deberían aparecer también en Google Calendar automáticamente (últimos 100 eventos no sincronizados se suben al conectar o al reactivar el toggle).

4. **Desconectar con dialog**
   - En Ajustes → **Desconectar** → sale modal con dos opciones:
     - *"Dejar las citas en Google"*: desconecta pero los eventos quedan en el Calendar.
     - *"Borrar las citas de Google"*: desconecta y elimina todos los eventos creados por AppNutri.
   - Probar ambas y verificar comportamiento en Google Calendar.

5. **Sign in with Google (login nutri)**
   - ⚠️ Antes de probar: **habilitar el provider en Supabase**. Ir a `dashboard.supabase.com` → proyecto `kzbrugggurcjwxsmutic` → Authentication → Providers → Google → **Enable** y pegar el mismo `CLIENT_ID` + `CLIENT_SECRET`.
   - Supabase mostrará una Callback URL (tipo `https://kzbrugggurcjwxsmutic.supabase.co/auth/v1/callback`) — copiarla y añadirla **también** al OAuth Client de Google Cloud como redirect URI adicional.
   - Cerrar sesión, ir a `/login` → botón **"Continuar con Google"** → debe entrar al dashboard sin pedir contraseña.

6. **Paciente conecta su Google Calendar personal**
   - Entrar como paciente en `/paciente/portal/perfil` → sección **Google Calendar** → **Conectar con Google**.
   - Mismo flujo OAuth.
   - Verificar que las citas confirmadas aparecen también en el calendar personal del paciente (sin link Meet, solo el evento).

### 4.2. Qué mirar con especial atención
- Que los eventos aparecen en la **zona horaria Europe/Madrid** correcta (no hay shift de hora).
- Que al **cancelar** o **contraponer** una cita, el evento desaparece del Google Calendar (o se actualiza si es contrapropuesta).
- Que los **tokens refrescan correctamente** sin pedir re-login al cabo de 1h (los access tokens expiran, el refresh_token los renueva automáticamente).
- Si Google revoca acceso (ir a myaccount.google.com → Seguridad → Apps con acceso → quitar AppNutri), las siguientes sincronizaciones fallan silenciosamente (se loguean en consola del server, no se muestra error al usuario). Es comportamiento esperado — caso edge.

### 4.3. Si algo falla
Reportar a Claude con el error concreto (mensaje de error, URL del navegador, captura de consola si hay). Los callbacks están en:
- `/api/google/callback-nutri` (OAuth nutri)
- `/api/google/callback-paciente` (OAuth paciente)
- `/auth/callback` (Supabase Sign in with Google)

### 4.4. Producción (Oracle)
Todavía **no funciona en Oracle** porque necesita dominio + HTTPS. Pasos detallados en la memoria `project_google_oauth_pendiente_dominio.md`. Cuando haya dominio, seguir esa guía y decirle a Claude *"ya tengo dominio, vamos a configurar Google en Oracle"*.

---

## 5. Tareas para Guillermo — 19 de abril, 10:44

### ~~5.1. Bug: notificaciones duplicadas al crear paciente desde dashboard~~ ✅ HECHO 21/04/2026

**Diagnóstico**: No era un bug. `generarNotificaciones()` se ejecuta al cargar el dashboard y recorre TODOS los pacientes activos del nutri, creando notificaciones de `PACIENTE_SIN_MEDIDAS` / `PACIENTE_SIN_CONSULTA` para todos los que lleven >30 días sin datos. Las 4 notifs que saltaban eran legítimas — correspondían a otros pacientes con datos antiguos, no al nuevo.

**Cambio extra hecho**: en el **gráfico de actividad del dashboard**, la línea verde pasó de mostrar "Pacientes nuevos" (nuevos de ese mes) a **"Pacientes totales"** (acumulado hasta fin de cada mes). Ficheros: `src/app/actions/metricas.ts` + `src/app/(dashboard)/dashboard/dashboard-charts.tsx`.

### ~~5.1.bis. Cambiar gráfica del dashboard: "Pacientes nuevos" → "Pacientes totales"~~ ✅ HECHO 21/04/2026

La línea verde de la gráfica de actividad del dashboard ahora representa el **acumulado total de pacientes hasta fin de cada mes**, no los nuevos de ese mes. Además se **excluye al paciente demo** del conteo. Ficheros tocados: `src/app/actions/metricas.ts`, `src/app/(dashboard)/dashboard/dashboard-charts.tsx`.

### ~~5.2. Reorganizar ajustes del nutricionista~~ ✅ HECHO 21/04/2026

Rediseño completo de `/ajustes`:
- Layout nuevo con **sidebar interno de secciones** (sticky en desktop, scroll en móvil) y tracking de sección activa por IntersectionObserver (`ajustes-nav.tsx`).
- **Resumen de cuenta** arriba (avatar + nombre + email + chips de especialidad y plan).
- 8 secciones organizadas: Perfil, Profesional, Integraciones, Paciente de ejemplo, Suscripción, Cobros (Stripe), Guías, Zona peligrosa.
- `SectionHeader` común con icono coloreado + título + descripción para unificar jerarquía.
- Incluye la **tarjeta de Paciente de ejemplo** reubicada desde el listado de pacientes (cumple también 5.7).
- Zona peligrosa en rojo suave con mensaje claro.

### 5.3. Actualizar el chat IA de la app
- El **chat IA** integrado en el programa se construyó hace bastante tiempo.
- Desde entonces se han añadido muchas funcionalidades nuevas (agenda, recetas globales/propias, favoritos, exportación PDF, Google Calendar, horario paciente, etc.).
- Hay que **actualizar el contexto/funciones del chat** para que conozca todas las funcionalidades nuevas y pueda ayudar al usuario correctamente.
- Revisar también el prompt del sistema y las herramientas disponibles.

### 5.4. Actualizar las guías
- Las **guías** de la app están **obsoletas** (reflejan un estado anterior del producto).
- Hay que revisarlas una a una y reescribirlas para que reflejen la versión actual de la aplicación.

### 5.5. Portal paciente — simetría perfil y espaciado
- En **Ajustes del paciente** (portal paciente → perfil), el cuadro de **Datos personales** y el cuadro de **Cambiar contraseña** deben tener **exactamente las mismas dimensiones** (mismos píxeles, perfectamente simétricos).
- Además, debe quedar **un poco de espacio por debajo** entre estos dos cuadros y la tarjeta siguiente (actualmente están demasiado pegados).

### 5.6. Mover botón de vincular Google Calendar a "Mis citas"
- En el portal paciente, el botón para **vincular con Google Calendar** está actualmente en **"Mi horario"**.
- Debería estar en **"Mis citas"**, porque el objetivo real del paciente al vincular Google Calendar es sincronizar **las citas con su nutricionista** (no su horario personal).
- Mover la tarjeta `IntegracionesCardPaciente` desde `/paciente/portal/seguimiento/horario` hacia la página de citas (`/paciente/portal/citas`).
- Ajustar también los `revalidatePath` asociados para que apunten a la nueva ruta.

### ~~5.7. Mover banner de restaurar paciente de ejemplo a Ajustes~~ ✅ HECHO 21/04/2026

Reubicada como tarjeta `PacienteDemoCard` dentro de la sección "Paciente de ejemplo" de Ajustes. Dos estados:
- **Activo**: muestra mensaje informativo + botón "Ver ficha" (link a `/pacientes?busqueda=Paciente+Prueba`).
- **Eliminado**: muestra el antiguo banner ámbar con botón "Restaurar".

Retirado el `<RestaurarDemoBanner />` de `src/app/(dashboard)/pacientes/page.tsx`.
