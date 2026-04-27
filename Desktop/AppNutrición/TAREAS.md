# Tareas — AppNutri (Annonia)

Registro consolidado de tareas del proyecto. Actualizado el 27 de abril de 2026 (tarde).

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

### 8. SEO — Pasos manuales de Guillermo

Las 8 tareas técnicas de SEO ya están implementadas (ver sección "Tareas completadas"). Quedan los pasos manuales:

#### 8.1. Google Analytics 4 — Crear propiedad (5 min)

1. Ir a https://analytics.google.com
2. Click "Administrar" (rueda dentada abajo izquierda)
3. Click "Crear propiedad"
4. Nombre: "Annonia" — Zona horaria: España — Moneda: EUR
5. Tipo de negocio: "Tecnología" → Tamaño: "Pequeña"
6. Objetivo: "Generar clientes potenciales" + "Analizar el comportamiento del usuario"
7. Click "Crear"
8. En "Flujos de datos" → Click "Web"
9. URL: `https://annonia.com` — Nombre: "Annonia Web"
10. Copiar el **ID de medición** (empieza por `G-`)
11. Ponerlo en `.env.local` como `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX`
12. Redesplegar la app (Vercel + Oracle)

#### 8.2. Google Search Console — Dar de alta (10 min)

1. Ir a https://search.google.com/search-console
2. Click "Añadir propiedad" → seleccionar "Dominio" → escribir `annonia.com`
3. Google pedirá verificar con registro DNS TXT
4. Ir al panel del registrador de dominio (donde se compró annonia.com)
5. Añadir un registro TXT con el valor que da Google (tipo `google-site-verification=XXXXX`)
6. Esperar 5-10 min → Click "Verificar" en Search Console
7. Una vez verificado, ir a "Sitemaps" en el menú izquierdo
8. Escribir `https://annonia.com/sitemap.xml` → Click "Enviar"
9. Esperar a que Google lo procese (puede tardar 1-3 días)
10. Revisar "Cobertura" para ver qué páginas se indexan y si hay errores
11. Ir a "Inspección de URLs" → escribir `https://annonia.com/landing` → Click "Solicitar indexación"
12. Repetir para `/precios`, `/login`, `/registro`

#### 8.3. Google Business Profile (15 min)

1. Ir a https://business.google.com
2. Click "Gestionar ahora"
3. Buscar "Annonia Software S.L." → Si no aparece, click "Añadir tu empresa"
4. Nombre: "Annonia"
5. Categoría: "Consultoría informática" o "Software"
6. Dirección: poner la dirección fiscal de Annonia Software S.L.
7. Zona de servicio: "España"
8. Teléfono y web: `https://annonia.com`
9. Subir logo (usar `public/icon-512.png`)
10. Escribir descripción: "Annonia es una plataforma profesional para dietistas-nutricionistas. Permite crear dietas personalizadas con inteligencia artificial, gestionar pacientes, agendar citas y mucho más."
11. Verificar la empresa (Google enviará carta postal o verificará por email/teléfono)

#### 8.4. Extensiones Chrome SEO (5 min)

Instalar desde Chrome Web Store:
- **SEOquake** — métricas SEO en tiempo real
- **Ahrefs SEO Toolbar** — DR, backlinks, keywords
- **Keywords Everywhere** — volúmenes de búsqueda
- **MozBar** — autoridad de dominio y página
- **GeoClark** — simular búsquedas desde otras ubicaciones

#### 8.5. PageSpeed Insights (5 min)

1. Ir a https://pagespeed.web.dev
2. Introducir `https://annonia.com/landing`
3. Esperar análisis — Objetivo: >90 en Performance mobile
4. Repetir para `/precios` y `/login`

#### 8.6. Monitorización semanal (5 min/semana)

**Cada lunes:**
1. Search Console → "Rendimiento" → ver impresiones, clicks, CTR, posición media
2. Search Console → "Cobertura" → ver si hay errores de indexación
3. Google Analytics → "En tiempo real" → ¿hay usuarios activos?
4. Google Analytics → "Adquisición" → ¿de dónde viene el tráfico?
5. Buscar "Annonia" en Google → ¿aparece el favicon? ¿sitelinks? ¿qué posición?
6. Comparar métricas con competidores usando las extensiones de Chrome

### 9. Google OAuth en producción

Google Calendar, Meet y Sign in with Google funcionan en local pero **no en producción** (Oracle) porque necesitan dominio con HTTPS. Pasos detallados en la memoria `project_google_oauth_pendiente_dominio.md`. Cuando haya dominio, seguir esa guía.

### 10. Email del paciente opcional

Actualmente el email es obligatorio al crear un paciente. Hay pacientes (sobre todo personas mayores) que no tienen correo o no quieren darlo. El email debe ser **opcional**: el nutricionista puede dejarlo en blanco y el paciente funciona igual, simplemente sin acceso al portal de paciente ni notificaciones por email.

### 11. Colores personalizables en entregables

Los entregables (PDF del plan de alimentación) usan siempre los mismos colores (verde, rojo). El nutricionista debería poder **elegir la paleta de colores** de sus entregables: colores de cabeceras, bordes de tabla, badges de comidas, etc. Permitir al menos 4-5 opciones de tema o un selector de color primario/secundario.

### 12. Logo y nombre del nutricionista en entregables

Permitir al nutricionista **subir su logo** (imagen) para que aparezca como encabezado en los entregables y, si quiere, en las páginas de la app. Posición configurable: arriba a la derecha o arriba a la izquierda. También opción de mostrar su **nombre/nombre de la consulta** como cabecera personalizada. Esto hace que los entregables sean más profesionales y con marca propia.

### 13. BUG — Calorías no coinciden entre plan y entregables

Las calorías que aparecen en el **plan de alimentación** (editor de dietas) no coinciden con las que salen en los **entregables** (PDF/vista compartida). Ejemplo: el plan marca ~1227 kcal pero el entregable muestra ~729 kcal para el mismo día. La diferencia es muy grande y no debería existir. Investigar de dónde viene la discrepancia y corregir.

### 14. Cantidades editables en entregables

En los entregables, las cantidades de cada alimento deben ser **editables por el nutricionista**:

- Todo viene predeterminado como hasta ahora (calculado automáticamente).
- Pero el nutricionista puede ajustar: más gramos, menos gramos, cambiar unidades (gramos → unidades → cucharadas, etc.).
- Opción de poner "libre" o "sin cantidad" para un alimento concreto.
- **Importante**: al modificar cantidades, las calorías y macros ya calculados **NO se modifican**. El nutricionista ya tiene el cálculo hecho y los ajustes de cantidad son solo orientativos para el paciente.

### 15. Lista de la compra — cantidades editables y unidad por defecto

La lista de la compra se genera automáticamente pero a veces las unidades son incorrectas. Ejemplo: "mousse de chocolate" aparece como "4g" cuando debería ser "4 unidades".

- La lista de la compra debe ser **editable**: el nutricionista o paciente puede cambiar cantidades y unidades antes de exportar/compartir.
- **Al crear un alimento propio**, añadir un campo: "¿Cómo se añade a la lista de la compra?" con opciones: gramos, unidades, mililitros, etc. Así no hay que corregirlo manualmente cada vez. Solo aplica a alimentos propios del nutricionista (los de la base de datos general ya están bien).

### 16. Link al alimento (alimentos propios)

Al crear un alimento propio, el nutricionista puede opcionalmente añadir un **enlace (URL)** al producto. Cuando el paciente ve el alimento en su plan/lista de la compra, puede hacer clic en el enlace para ver el producto exacto en la web del supermercado o tienda. Esto evita tener que cargar imágenes (que pesan mucho) y el paciente puede ver las fotos directamente en la página del producto.

### 17. PREGUNTA PARA CLAUDIA — Ingredientes de "café con leche"

Duda pendiente de consultar con Claudia: cuando se pone "café con leche semidesnatada" como alimento, en los ingredientes del entregable no aparece "café" como ingrediente (o no como primer ingrediente). Parece que el desglose de ingredientes no refleja bien la composición del alimento compuesto. Preguntar a Claudia exactamente qué problema ve y qué esperaría que apareciera.

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

### ~~SEO completo — Infraestructura técnica~~ ✅ 27/04/2026

Implementación completa de las 8 tareas técnicas SEO:

- **robots.txt** dinámico (`src/app/robots.ts`) — Allow páginas públicas, Disallow dashboard/admin/portal/api.
- **sitemap.xml** dinámico (`src/app/sitemap.ts`) — 7 URLs públicas con prioridades y frecuencias.
- **JSON-LD / Schema.org** — 5 schemas: Organization, WebSite (con SearchAction para sitelinks), SoftwareApplication (3 ofertas), FAQPage landing (5 Q&A), FAQPage precios (4 Q&A). Componente `<JsonLd>` reutilizable.
- **Google Analytics 4** — Componente `<GoogleAnalytics>` que solo carga gtag.js si hay consentimiento de cookies (`annonia-cookie-consent === "accepted"`). Cumple RGPD/LSSI-CE. Variable `NEXT_PUBLIC_GA_MEASUREMENT_ID` preparada en `.env.local`.
- **Iconos PNG** — favicon.ico (16+32), apple-touch-icon.png (180x180), icon-192.png, icon-512.png, icon-maskable-512.png. Manifest actualizado.
- **Imagen Open Graph** — `og-image.png` 1200x630 con gradiente verde + logo + texto.
- **Twitter Cards** — `summary_large_image` en landing/precios/registro, `summary` en login. Tags en todas las páginas públicas.
- **Canonical URLs** — `<link rel="canonical">` en las 7 páginas públicas.
- **Metadata por página** — OG + Twitter + canonical en landing, precios, login (via layout.tsx wrapper), registro, y 3 páginas legales.
- **CSP actualizado** — Dominios de Google Analytics añadidos a script-src y connect-src.
- **Middleware fix** — Excluidos robots.txt, sitemap.xml y manifest.webmanifest del middleware de autenticación.
- **Cookie banner + política** — Actualizados para reflejar Google Analytics con consentimiento.
- **Optimización de keywords SEO/GEO** — Textos de landing, precios, registro, login y datos estructurados optimizados para keywords objetivo: "software nutricionista", "software para dietistas", "app para nutricionistas", "gestión de pacientes nutrición", "dietas personalizadas online", etc. Keywords integradas naturalmente en títulos (H1, H2), meta descriptions, OG tags, Twitter cards, JSON-LD y textos visibles.
