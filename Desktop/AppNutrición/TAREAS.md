# Tareas — AppNutri (Annonia)

Registro consolidado de tareas pendientes. Actualizado el 28 de abril de 2026.

---

## Tareas pendientes

### 1. Actualizar el Asistente Annonia (help-kb)

El widget de ayuda flotante ("Asistente Annonia") tiene ~400-500 preguntas y respuestas predeterminadas en 43 archivos (`src/lib/help-kb/sections/`). Se construyó antes de añadir muchas funcionalidades (agenda con Google Calendar/Meet, recetas globales/propias, favoritos, exportación PDF, seguimiento diario, Stripe, etc.).

- Revisar cada sección y actualizar las respuestas para que reflejen el estado actual de la app.
- Añadir entradas nuevas para funcionalidades que no existían cuando se creó.
- Revisar también el prompt del sistema de generación de dietas con IA (`src/lib/ai/prompts.ts`) para que conozca las features nuevas.

### 2. Actualizar las guías interactivas

Las guías/tours de la app están obsoletas. Hay que revisarlas una a una y reescribirlas para que reflejen la versión actual de la aplicación. Relacionado con la tarea 1 (el contenido de las guías está en la misma base de conocimiento).

### ~~3. Mover botón de vincular Google Calendar a "Mis citas"~~ ✅ (29/04/2026)

Movido `IntegracionesCardPaciente` de `/paciente/portal/seguimiento/horario` a `/paciente/portal/citas`. Actualizados los `revalidatePath`, el redirect del callback OAuth y los flash messages de Google.

### ~~4. Seed de pagos de ejemplo en paciente demo~~ ✅ (30/04/2026)

Añadidos 3 pagos demo: consulta inicial 45€ (pagado, transferencia), revisión 30€ (pagado, Stripe), revisión pendiente 30€. Se eliminan al borrar el paciente demo (antes del delete, por el `onDelete: SetNull` del modelo Pago). Se recrean al restaurar. Auto-alineación mensual de fechas incluida. Script `seed-paciente-demo-existentes.ts` también actualizado.

### 5. Micronutrientes — funcionalidades pendientes

La fase 1 (micronutrientes opcionales) y parte de la fase 2 (Open Food Facts + equivalentes) ya están hechas. Queda:

- **Escaneo de código de barras** — UI con cámara para escanear EAN y buscar en Open Food Facts.
- **Estimación por IA** — Pasar nombre del alimento a un LLM para estimar los 24 micronutrientes cuando no haya datos. Marcar como "estimado por IA".
- **Link del producto** (opcional) — Pegar URL de supermercado, extraer EAN, buscar en Open Food Facts.
- **Importación CSV** (opcional) — Botón "Importar CSV" con plantilla descargable para nutricionistas con muchos alimentos propios.

### 6. Responsividad móvil

Existe un plan detallado de 50 pasos en `PLAN-MOVIL.md` (34-47 horas estimadas) y un checklist de QA en `CHECKLIST-QA-MOVIL.md`. Cubre: cimientos globales, sistema de diseño, navegación, listings, ficha paciente, editores de dietas, formularios, portal paciente y testing en dispositivos reales. Ningún paso se ha ejecutado todavía.

### 7. SEO — Monitorización semanal

**Cada lunes (5 min):**
1. Search Console → "Rendimiento" → ver impresiones, clicks, CTR, posición media
2. Search Console → "Cobertura" → ver si hay errores de indexación
3. Google Analytics → "En tiempo real" → ¿hay usuarios activos?
4. Google Analytics → "Adquisición" → ¿de dónde viene el tráfico?
5. Buscar "Annonia" en Google → ¿aparece el favicon? ¿sitelinks? ¿qué posición?

### 8. Google OAuth en producción

Google Calendar, Meet y Sign in with Google funcionan en local pero **no en producción** (annonia.com). El código ya está listo; faltan configuraciones manuales en Google Cloud Console, Oracle y opcionalmente Supabase. Ver instrucciones detalladas compartidas aparte.

### ~~9. Email del paciente opcional~~ ✅ (28/04/2026)

Email ahora es opcional en el formulario de crear/editar paciente. Si no tiene email: botón de enviar email desactivado, banner de aviso en portal, y las funciones de email devuelven error controlado. La base de datos ya era `String?`; se quitó la validación obligatoria del form y del server action.

### 10. Colores personalizables en entregables

Los entregables (PDF del plan de alimentación) usan siempre los mismos colores (verde, rojo). El nutricionista debería poder **elegir la paleta de colores** de sus entregables: colores de cabeceras, bordes de tabla, badges de comidas, etc. Permitir al menos 4-5 opciones de tema o un selector de color primario/secundario.

### 11. Logo y nombre del nutricionista en entregables

Permitir al nutricionista **subir su logo** (imagen) para que aparezca como encabezado en los entregables y, si quiere, en las páginas de la app. Posición configurable: arriba a la derecha o arriba a la izquierda. También opción de mostrar su **nombre/nombre de la consulta** como cabecera personalizada. Esto hace que los entregables sean más profesionales y con marca propia.

### ~~12. BUG — Calorías no coinciden entre plan y entregables~~ ✅ (28/04/2026)

Corregido. El bug afectaba solo a **recetas** (no a alimentos individuales). Tres archivos usaban `calcularMacrosPorcion` para recetas, que divide por 100 como si fueran gramos — pero las recetas almacenan macros por porción. Fórmula correcta: `receta.calorias * cantidad`. Archivos corregidos: `generate-plan-pdf.ts`, `plan-read-only.tsx`, `sugerencias.ts`.

### 13. Cantidades editables en entregables

En los entregables, las cantidades de cada alimento deben ser **editables por el nutricionista**:

- Todo viene predeterminado como hasta ahora (calculado automáticamente).
- Pero el nutricionista puede ajustar: más gramos, menos gramos, cambiar unidades (gramos → unidades → cucharadas, etc.).
- Opción de poner "libre" o "sin cantidad" para un alimento concreto.
- **Importante**: al modificar cantidades, las calorías y macros ya calculados **NO se modifican**. El nutricionista ya tiene el cálculo hecho y los ajustes de cantidad son solo orientativos para el paciente.

### 14. Lista de la compra — cantidades editables y unidad por defecto

La lista de la compra se genera automáticamente pero a veces las unidades son incorrectas. Ejemplo: "mousse de chocolate" aparece como "4g" cuando debería ser "4 unidades".

- La lista de la compra debe ser **editable**: el nutricionista o paciente puede cambiar cantidades y unidades antes de exportar/compartir.
- **Al crear un alimento propio**, añadir un campo: "¿Cómo se añade a la lista de la compra?" con opciones: gramos, unidades, mililitros, etc. Así no hay que corregirlo manualmente cada vez. Solo aplica a alimentos propios del nutricionista (los de la base de datos general ya están bien).

### 15. Link al alimento (alimentos propios)

Al crear un alimento propio, el nutricionista puede opcionalmente añadir un **enlace (URL)** al producto. Cuando el paciente ve el alimento en su plan/lista de la compra, puede hacer clic en el enlace para ver el producto exacto en la web del supermercado o tienda. Esto evita tener que cargar imágenes (que pesan mucho) y el paciente puede ver las fotos directamente en la página del producto.

### 16. PREGUNTA PARA CLAUDIA — Ingredientes de "café con leche"

Duda pendiente de consultar con Claudia: cuando se pone "café con leche semidesnatada" como alimento, en los ingredientes del entregable no aparece "café" como ingrediente (o no como primer ingrediente). Parece que el desglose de ingredientes no refleja bien la composición del alimento compuesto. Preguntar a Claudia exactamente qué problema ve y qué esperaría que apareciera.

---

## Guía de pruebas — Flujo Google

Integración Google Calendar + Meet + Sign in with Google ya implementada. En local, configurada en `.env.local`. OAuth consent screen en modo **"Testing"** — quien pruebe debe estar añadido como **Test user** en Google Cloud Console (ver tarea #8, paso 4).

### Dónde se conecta Google Calendar

- **Nutricionista**: desde `/ajustes` (sección Integraciones) o desde `/agenda` (tarjeta en el sidebar derecho)
- **Paciente**: desde `/paciente/portal/citas` (tarjeta al final de la página)

### Pasos a probar

1. **Conectar Google del nutri** — Ir a Ajustes o Agenda > Conectar con Google. Si sale aviso "App no verificada" > Avanzado > Ir a NutriApp. Verificar email conectado y toggles de sincronización y Meet.

2. **Crear una cita online con Meet** — Agenda > Nueva cita > seleccionar paciente + fecha + hora > checkbox "Cita online (Google Meet)" > Crear. Verificar link de Meet en el modal y en Google Calendar real.

3. **Backfill al conectar** — Tras conectar, las citas existentes deben aparecer en Google Calendar automáticamente.

4. **Desconectar con dialog** — Ajustes > Desconectar > probar "Dejar citas en Google" y "Borrar citas de Google".

5. **Sign in with Google** — Requiere configurar Supabase primero (ver tarea #8, paso 5). Luego: `/login` > "Continuar con Google".

6. **Paciente conecta su Google Calendar** — Portal paciente > Mis citas > sección Google Calendar > Conectar. Verificar que citas confirmadas aparecen en el calendar personal del paciente.

### Qué mirar con atención
- Zona horaria Europe/Madrid correcta en los eventos.
- Al cancelar/contraponer cita, el evento desaparece de Google Calendar.
- Tokens refrescan sin pedir re-login tras 1h.
- En producción: verificar que los redirects van a `https://annonia.com/...` (no localhost).

### Si algo falla
Reportar con error concreto. Callbacks en: `/api/google/callback-nutri`, `/api/google/callback-paciente`, `/auth/callback`.

---

## Info externa (no derivable del código)

### SEO — Pasos manuales completados (28/04/2026)

- **Google Analytics 4** — Propiedad creada, ID `G-ZSXTK43JY0` configurado en producción. Componente reescrito con inyección DOM directa y `function gtag(){dataLayer.push(arguments);}` (no rest params). CSP actualizada con wildcard `*.google-analytics.com` para endpoints regionales EU.
- **Google Search Console** — Dominio verificado con DNS TXT en DonDominio. Sitemap enviado.
- **Google Business Profile** — Perfil creado y verificado.
- **PageSpeed Insights** — Desktop 99/92/100/92. Fixes de accesibilidad: headings footer (h4→p), link descriptivo cookie banner.
