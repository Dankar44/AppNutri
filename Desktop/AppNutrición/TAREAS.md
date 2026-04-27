# Tareas — AppNutri (Annonia)

Registro consolidado de tareas del proyecto. Actualizado el 27 de abril de 2026.

---

## Tareas pendientes

### 1. Actualizar el Asistente Annonia (help-kb)

El widget de ayuda flotante ("Asistente Annonia") tiene ~400-500 preguntas y respuestas predeterminadas en 43 archivos (`src/lib/help-kb/sections/`). Se construyó antes de añadir muchas funcionalidades (agenda con Google Calendar/Meet, recetas globales/propias, favoritos, exportación PDF, seguimiento diario, Stripe, etc.).

- Revisar cada sección y actualizar las respuestas para que reflejen el estado actual de la app.
- Añadir entradas nuevas para funcionalidades que no existían cuando se creó.
- Revisar también el prompt del sistema de generación de dietas con IA (`src/lib/ai/prompts.ts`) para que conozca las features nuevas.

### 2. Actualizar las guías interactivas

Las guías/tours de la app están obsoletas. Hay que revisarlas una a una y reescribirlas para que reflejen la versión actual de la aplicación. Relacionado con la tarea 1 (el contenido de las guías está en la misma base de conocimiento).

### 3. Portal paciente — simetría perfil y espaciado

En **Ajustes del paciente** (`/paciente/portal/perfil`), el cuadro de **Datos personales** y el cuadro de **Cambiar contraseña** deben tener exactamente las mismas dimensiones (mismos píxeles, perfectamente simétricos). Actualmente el grid usa `items-start` lo que permite alturas diferentes.

- Igualar alturas de ambas cards (quitar `items-start` o añadir min-height).
- Dejar un poco de espacio por debajo entre estos dos cuadros y la tarjeta siguiente.
- Archivo: `src/app/paciente/portal/perfil/perfil-form.tsx`

### 4. Mover botón de vincular Google Calendar a "Mis citas"

En el portal paciente, el botón para vincular con Google Calendar está actualmente en **"Mi horario"** (`/paciente/portal/seguimiento/horario`). Debería estar en **"Mis citas"** (`/paciente/portal/citas`).

- Mover `IntegracionesCardPaciente` de `src/app/paciente/portal/seguimiento/horario/` a la página de citas.
- Ajustar los `revalidatePath` asociados para que apunten a la nueva ruta.

### 5. Seed de pagos de ejemplo en paciente demo

Stripe Connect está integrado y funcional, pero el paciente demo no incluye pagos de ejemplo en su seed. Añadir 2-3 pagos (1 pagado, 1 pendiente) al seed del paciente demo en `src/lib/paciente-demo.ts`.

### 6. Micronutrientes — funcionalidades pendientes

La fase 1 (micronutrientes opcionales) y parte de la fase 2 (Open Food Facts + equivalentes) ya están hechas. Queda:

- **Escaneo de código de barras** — UI con cámara para escanear EAN y buscar en Open Food Facts.
- **Estimación por IA** — Pasar nombre del alimento a un LLM para estimar los 24 micronutrientes cuando no haya datos. Marcar como "estimado por IA".
- **Link del producto** (opcional) — Pegar URL de supermercado, extraer EAN, buscar en Open Food Facts.
- **Importación CSV** (opcional) — Botón "Importar CSV" con plantilla descargable para nutricionistas con muchos alimentos propios.

### 7. Responsividad móvil

Existe un plan detallado de 50 pasos en `PLAN-MOVIL.md` (34-47 horas estimadas) y un checklist de QA en `CHECKLIST-QA-MOVIL.md`. Cubre: cimientos globales, sistema de diseño, navegación, listings, ficha paciente, editores de dietas, formularios, portal paciente y testing en dispositivos reales. Ningún paso se ha ejecutado todavía.

### 8. SEO y posicionamiento web

Para que Annonia aparezca correctamente en Google (favicon, sitelinks, posicionamiento), hay dos bloques de trabajo:

#### 8.1. Tareas técnicas (desarrollo)

- **sitemap.xml** — Crear sitemap dinámico con todas las páginas públicas (landing, login, registro, precios, legal).
- **robots.txt** — Crear robots.txt permitiendo indexación de páginas públicas y bloqueando dashboard/admin/portal.
- **JSON-LD / Schema.org** — Añadir datos estructurados en la landing: `Organization`, `WebSite` con `SearchAction`, `SoftwareApplication`, `FAQPage`.
- **Google Analytics 4** — Añadir tag de medición (gtag.js) en el `<head>`. Configurar conversiones (registro, login, visita a /precios) y eventos (click en "Empieza gratis", scroll, etc.).
- **apple-touch-icon.png** — Crear icono 180x180 para iOS.
- **Open Graph image** — Añadir imagen OG para compartir en redes (1200x630).
- **Twitter Cards** — Añadir meta tags de Twitter Card.
- **Canonical URLs** — Añadir `<link rel="canonical">` en páginas públicas.

#### 8.2. Tareas manuales (Guillermo)

- **Google Search Console** — Dar de alta annonia.com, verificar propiedad, enviar sitemap, monitorizar cobertura.
- **Google Analytics 4** — Crear propiedad GA4 en analytics.google.com (el tag lo añadimos en 8.1).
- **Google Business Profile** — Crear perfil en business.google.com (categoría "Software de nutrición", descripción, logo, enlace).
- **Extensiones Chrome** — Instalar: SEOquake, Ahrefs SEO Toolbar, Keywords Everywhere, MozBar, GeoClark.
- **Monitorización semanal** — Revisar Search Console (impresiones, clicks, posición) y GA4 (comportamiento usuarios).
- **Favicon en Search Console** — Verificar que aparece correctamente con la herramienta de inspección de URLs.
- **PageSpeed Insights** — Comprobar velocidad (objetivo: >90 en mobile).

### 9. Google OAuth en producción

Google Calendar, Meet y Sign in with Google funcionan en local pero **no en producción** (Oracle) porque necesitan dominio con HTTPS. Pasos detallados en la memoria `project_google_oauth_pendiente_dominio.md`. Cuando haya dominio, seguir esa guía.

---

## Guía de pruebas — Flujo Google (para Guillermo)

Integración Google Calendar + Meet + Sign in with Google ya implementada y configurada en `.env.local`. OAuth consent screen en modo "Testing" — Guillermo debe añadirse como **Test user** en Google Cloud Console si no lo está ya.

### Pasos a probar en local (después de reiniciar `npm run dev`)

1. **Conectar Google del nutri** — `http://localhost:3000/ajustes` > Integraciones > Conectar con Google. Aceptar aviso "App no verificada" > Avanzado > Ir a NutriApp. Verificar email conectado y toggle de sincronización.

2. **Crear una cita online con Meet** — `/agenda/nueva` > seleccionar paciente + fecha + hora > checkbox "Cita online (Google Meet)" > Crear. Verificar link de Meet en el modal y en Google Calendar real.

3. **Backfill al conectar** — Tras conectar, las citas existentes deben aparecer en Google Calendar automáticamente.

4. **Desconectar con dialog** — Ajustes > Desconectar > probar "Dejar citas en Google" y "Borrar citas de Google".

5. **Sign in with Google** — Antes: habilitar provider en Supabase (proyecto `kzbrugggurcjwxsmutic`) + pegar Client ID/Secret + añadir Callback URL como redirect URI en Google Cloud. Luego: `/login` > "Continuar con Google".

6. **Paciente conecta su Google Calendar** — `/paciente/portal/perfil` > sección Google Calendar > Conectar. Verificar que citas confirmadas aparecen en el calendar personal.

### Qué mirar con atención
- Zona horaria Europe/Madrid correcta.
- Al cancelar/contraponer cita, el evento desaparece de Google Calendar.
- Tokens refrescan sin pedir re-login tras 1h.

### Si algo falla
Reportar con error concreto. Callbacks en: `/api/google/callback-nutri`, `/api/google/callback-paciente`, `/auth/callback`.

---

## Tareas completadas

### ~~Sistema de solicitud de citas paciente → nutricionista~~ ✅

Flujo completo implementado:
- Horario configurable del nutricionista (editor visual drag).
- Paciente ve disponibilidad y solicita citas.
- Notificaciones al nutricionista (`CITA_SOLICITADA`).
- Aceptar/Rechazar/Contraponer bidireccional.
- Google Calendar sync (nutri + paciente, backfill, token refresh).
- Google Meet para citas online.
- Anti-solapes y restricción por nutricionista asignado.

### ~~Paciente demo~~ ✅

Seed automático al registrarse, badge "Paciente de ejemplo", auto-ajuste de fechas al mes actual, flag de eliminación + restaurar, seguimiento diario con estados reales. Tarjeta `PacienteDemoCard` reubicada en Ajustes.

### ~~Integración Stripe Connect~~ ✅

Modelo `Pago`, Stripe Connect Express para dietistas, webhooks (`checkout.session.completed`, `account.updated`), UI de onboarding y gestión de pagos, links de pago con expiración 24h.

### ~~Micronutrientes — fases 1 y 2 (parcial)~~ ✅

- Micronutrientes opcionales (24 campos `Float?` nullable).
- Open Food Facts API integrada (búsqueda por nombre + página de importación).
- Alimentos equivalentes por categoría y similitud de macros.

### ~~Bug notificaciones duplicadas al crear paciente~~ ✅ 21/04/2026

No era bug. `generarNotificaciones()` recorre todos los pacientes activos >30 días sin datos. Las notificaciones eran legítimas.

### ~~Gráfica dashboard: "Pacientes nuevos" → "Pacientes totales"~~ ✅ 21/04/2026

Línea verde del gráfico de actividad ahora muestra acumulado total hasta fin de cada mes. Paciente demo excluido del conteo.

### ~~Reorganizar ajustes del nutricionista~~ ✅ 21/04/2026

Rediseño completo de `/ajustes` con sidebar interno de secciones (sticky desktop, scroll móvil), resumen de cuenta, 8 secciones organizadas y `SectionHeader` unificado.

### ~~Mover banner de restaurar paciente demo a Ajustes~~ ✅ 21/04/2026

Reubicado como `PacienteDemoCard` en sección "Paciente de ejemplo" de Ajustes. Retirado `RestaurarDemoBanner` de pacientes.

### ~~SEO básico (titles, meta, keywords, OG parcial, PWA manifest)~~ ✅

- `<title>` y `<meta description>` en root layout y landing.
- Keywords configuradas.
- Open Graph title/description/locale.
- `manifest.webmanifest` con PWA standalone.
- `icon.svg` como favicon.
- `lang="es"` en HTML.
