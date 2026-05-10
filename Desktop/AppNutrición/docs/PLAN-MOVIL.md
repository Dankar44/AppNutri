# 📱 Plan de responsividad móvil — AppNutri

> Plan de 50 pasos priorizado, consolidado a partir de la auditoría exhaustiva de 7 áreas (layout, listings, ficha paciente, editores, formularios, componentes UI, portal paciente).

---

## 📊 Resumen ejecutivo

### Hallazgos totales
- **17 problemas CRÍTICOS** (rompen la experiencia en móvil)
- **~35 problemas MEDIOS** (funcionan pero mal)
- **~12 problemas PULIDO** (detalles visuales)

### Breakpoints objetivo
| Nombre | Ancho | Dispositivo típico |
|---|---|---|
| **base** | 320-375px | iPhone SE, Android pequeño |
| **sm** | 640px+ | móvil grande / phablet landscape |
| **md** | 768px+ | tablet vertical |
| **lg** | 1024px+ | tablet horizontal / laptop pequeña |
| **xl** | 1280px+ | desktop |

### Principio rector
**Mobile-first real:** nada debe asumir desktop. El base (sin prefijo) siempre es móvil <640px; los prefijos `sm:`, `md:`, `lg:` añaden complejidad progresiva. Prohibido `grid-cols-N` o `w-[XXXpx]` sin variante responsive.

---

## 🧭 10 principios transversales (aplicar en TODO cambio)

1. **Inputs a 16px mínimo** (`text-base`) para evitar zoom automático en iOS al hacer focus.
2. **Click targets ≥ 44×44px** (WCAG 2.5): añadir `min-h-10 min-w-10` o `py-3 px-3` mínimo.
3. **Grids sin fallback prohibidos**: `grid-cols-2` debe ser `grid-cols-1 sm:grid-cols-2`.
4. **Anchos fijos prohibidos** (`w-[400px]`, `min-w-[600px]`): usar fracciones o `max-w-*`.
5. **Alturas con viewport dinámico**: `min-h-dvh` en lugar de `min-h-screen`.
6. **Safe areas iOS**: `env(safe-area-inset-top/bottom)` en elementos fixed.
7. **`inputMode`/`type` correctos** en inputs numéricos, email, tel — teclado virtual apropiado.
8. **Typography scale mobile-first**: `text-2xl sm:text-3xl` (no al revés).
9. **Overflow controlado**: cualquier tabla/fila con muchos campos → wrapper `overflow-x-auto` con scroll visible.
10. **Estados hover NO bloqueantes**: nunca información crítica detrás de `opacity-0 group-hover:opacity-100` porque en touch no hay hover.

---

## 🏗️ FASE 1 — Cimientos globales (pasos 1-6)

> Sin esto, el resto de arreglos no funciona correctamente. ORDEN OBLIGATORIO.

### **Paso 1** — Viewport y metadata móvil
**Archivo:** `src/app/layout.tsx`
**Acción:**
```ts
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#10b981",
  viewportFit: "cover",  // habilita safe-area
};
```
También añadir en `metadata`:
```ts
appleWebApp: { capable: true, statusBarStyle: "black-translucent", title: "AppNutri" },
formatDetection: { telephone: false },
```
**Criterio:** Inspector Chrome DevTools → Elements → `<meta name="viewport">` presente y correcto.

---

### **Paso 2** — Manifest PWA
**Archivo:** `public/manifest.webmanifest` (nuevo) + `src/app/layout.tsx`
**Acción:** Crear `manifest.webmanifest` con nombre, iconos 192/512, `display: "standalone"`, `theme_color`, `background_color`. Referenciarlo desde el layout.
**Criterio:** Lighthouse PWA audit no falla por manifest.

---

### **Paso 3** — Safe-area CSS custom properties
**Archivo:** `src/app/globals.css`
**Acción:** Añadir utilidades:
```css
@layer utilities {
  .pt-safe { padding-top: max(env(safe-area-inset-top), 0px); }
  .pb-safe { padding-bottom: max(env(safe-area-inset-bottom), 0px); }
  .pl-safe { padding-left: max(env(safe-area-inset-left), 0px); }
  .pr-safe { padding-right: max(env(safe-area-inset-right), 0px); }
  .h-dvh  { height: 100dvh; }
  .min-h-dvh { min-height: 100dvh; }
}
```
**Criterio:** iPhone con notch no tapa contenido del topbar.

---

### **Paso 4** — Font-size base 16px para inputs
**Archivo:** `src/app/globals.css`
**Acción:** Regla global para evitar zoom iOS:
```css
@media (max-width: 640px) {
  input, select, textarea { font-size: 16px; }
}
```
O alternativamente migrar TODOS los inputs/textareas a `text-base` (preferido).
**Criterio:** Safari iOS no hace zoom al enfocar un input.

---

### **Paso 5** — Tailwind screen utilities extra (`xs`)
**Archivo:** `tailwind.config.ts` (o equivalente Tailwind 4)
**Acción:** Añadir breakpoint `xs: '375px'` para afinar iPhone SE. Útil en toolbars de 5 botones.
**Criterio:** Poder usar `xs:flex-row` para cambios entre 320 y 640px.

---

### **Paso 6** — Toaster (sonner) posición móvil
**Archivo:** `src/app/layout.tsx:38`
**Acción:** Cambiar `<Toaster position="top-right" richColors />` a:
```tsx
<Toaster
  position="top-center"
  richColors
  closeButton
  offset="max(env(safe-area-inset-top), 16px)"
/>
```
Con media query opcional para desktop volver a `top-right`.
**Criterio:** Toast no queda oculto por teclado virtual ni notch.

---

## 🎨 FASE 2 — Sistema de diseño móvil (pasos 7-12)

### **Paso 7** — PageHeader: title escalable + acciones apilables
**Archivo:** `src/components/page-header.tsx:10-32`
**Acción:**
- Cambiar `text-2xl sm:text-3xl` ✅ (ya está bien, verificar que `truncate` se cambie a `line-clamp-2` en base y `truncate` en `sm:`).
- Reducir `gap-4` a `gap-3 sm:gap-4`.
- `action` prop: wrapper con `w-full sm:w-auto` para que en móvil ocupe todo el ancho si el usuario quiere.
**Criterio:** Título de 40+ caracteres se ve en 2 líneas; botón de acción no corta título.

---

### **Paso 8** — MacroBadge legible en móvil
**Archivo:** `src/components/macro-badge.tsx:30-34`
**Acción:** Para `size="sm"`, cambiar `text-xs` a `text-[11px] sm:text-xs` o directamente `text-sm`. Asegurar `gap-1.5` siempre.
**Criterio:** Se leen los valores (ej. "632 kcal") sin esfuerzo a 30cm de distancia.

---

### **Paso 9** — AvatarPaciente: padding consistente
**Archivo:** `src/components/avatar-paciente.tsx`
**Acción:** Revisar que tamaños `sm`/`md`/`lg`/`xl` mantienen mínimo 36px en `sm`. Añadir `shrink-0` siempre para evitar compresión.
**Criterio:** En cabeceras con avatar + nombre largo, el avatar no se comprime.

---

### **Paso 10** — Botones: variantes de contenido icon-only
**Archivo:** componentes de botones reutilizables (o patrón Tailwind).
**Acción:** Donde hay `<span className="hidden sm:inline">Texto</span>`, asegurar que el botón sin el texto mantenga `min-w-10 min-h-10` y `aria-label`.
**Criterio:** Botones icon-only en móvil tienen tap target correcto y accesibilidad.

---

### **Paso 11** — Modal/Dialog: wrapper responsive standard
**Archivo:** crear `src/components/ui/dialog-wrapper.tsx` o actualizar patrón.
**Acción:** Regla: `w-full max-w-sm sm:max-w-md md:max-w-lg mx-4 max-h-[90dvh] overflow-y-auto`.
Aplicar a: `selector-alimento.tsx`, modal "Cambios sin guardar" en `paciente-form.tsx`, cualquier otro.
**Criterio:** Modal no desborda ni se corta en 320px; scroll interno funciona con teclado abierto.

---

### **Paso 12** — Typography scale coherente en toda la app
**Acción:** Revisión transversal:
- `text-[10px]` → `text-xs sm:text-[10px]` (o directamente `text-xs`).
- `text-xs` en información crítica → subir a `text-sm` o `text-[13px]`.
- Títulos card `text-lg` sin variante → añadir `text-base sm:text-lg`.
**Archivos (muestra):** `plan-read-only.tsx:55-109`, `plan-de-alimentacion-tab.tsx:714`.
**Criterio:** Ningún texto por debajo de 12px en móvil.

---

## 🧭 FASE 3 — Navegación y shell (pasos 13-18)

### **Paso 13** — Sidebar móvil: drawer width y safe-area
**Archivo:** `src/components/sidebar.tsx:191, 216`
**Acción:**
- Topbar: añadir `pt-safe` y ajustar `h-14 pt-safe`.
- Drawer: cambiar `w-72` a `w-64 xs:w-72` para dejar ver fondo en iPhone SE.
- Botón hamburguesa: `p-2` → `p-2.5` + `min-h-11 min-w-11`.
- Items nav: `py-2.5` → `py-3 lg:py-2.5` (44px en móvil, 40px en desktop).
- Backdrop overlay: verificar `z-40` (un nivel abajo del drawer).
**Criterio:** En iPhone SE el drawer deja 50-70px visibles al abrir; todos los taps se registran.

---

### **Paso 14** — Dashboard layout: padding y pt-safe
**Archivo:** `src/app/(dashboard)/layout.tsx:41-42`
**Acción:**
- Cambiar `pt-16` a `pt-14 pt-safe lg:pt-0 lg:pt-safe` (alinear con topbar h-14).
- `px-3 sm:px-4` → `px-4 sm:px-5 md:px-6` (aire mínimo).
- Card interior: `p-4 sm:p-5` → `p-4 sm:p-6`.
**Criterio:** Contenido empieza exactamente debajo del topbar; inputs tienen aire visual.

---

### **Paso 15** — PatientNav (sidebar portal paciente): compactar
**Archivo:** `src/components/paciente/patient-nav.tsx:141, 63`
**Acción:**
- Drawer: cambiar `w-72` a `w-[min(80vw,288px)]`.
- Botones/items: `min-h-11`.
- Close button (X): `min-h-11 min-w-11`.
**Criterio:** Usable con dedo, no tapa pantalla completa.

---

### **Paso 16** — Tabs horizontales de la ficha del paciente
**Archivo:** `src/components/paciente/paciente-ficha-client.tsx:191-207`
**Acción:**
- Mantener `overflow-x-auto` pero añadir `-webkit-overflow-scrolling: touch` (nativo iOS) y `scroll-snap-type: x mandatory` + `scroll-snap-align: start` en cada tab.
- Abreviar labels en móvil: usar `<span className="hidden sm:inline">Plan de alimentación</span><span className="sm:hidden">Plan</span>`.
- Añadir gradient fade a derecha para indicar "hay más".
**Criterio:** Swipe horizontal fluido entre 9 tabs; usuario sabe visualmente que hay más.

---

### **Paso 17** — NotificationBell: tap target
**Archivo:** `src/components/notification-bell.tsx:29`
**Acción:** `p-2` → `p-2.5 min-h-11 min-w-11`. Badge dots a `min-w-5 h-5` (20px).
**Criterio:** Tap registra al primer intento.

---

### **Paso 18** — Breadcrumbs y "Volver a X" links: tap size
**Archivos:** buscar todos los `<Link>` con patrón "Volver a..." (ej. `dietas/[id]/page.tsx:58-64`).
**Acción:** Asegurar `py-2` mínimo y `text-sm`.
**Criterio:** Links accesibles en touch.

---

## 📋 FASE 4 — Listings y tablas (pasos 19-25)

### **Paso 19** — Filtros ALIMENTOS: rehacer grids
**Archivo:** `src/app/(dashboard)/alimentos/alimentos-filter.tsx:109, 156, 286`
**Acción:**
- Barra principal: `flex flex-col sm:flex-row gap-3` en lugar de `flex gap-3`.
- Grid macros: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.
- Grid vitaminas: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`.
- Quitar `truncate` en labels de vitaminas (texto crítico).
**Criterio:** Todos los campos min/max usables en 375px sin zoom.

---

### **Paso 20** — Filtros RECETAS: rehacer grids
**Archivo:** `src/app/(dashboard)/recetas/recetas-filter.tsx:127, 208, 216`
**Acción:** Idéntico al paso 19, pero con las 6 dimensiones (ingredientes, tiempo, cal, prot, carbs, grasas).
**Criterio:** Igual que paso 19.

---

### **Paso 21** — Agenda: vista día responsive
**Archivo:** `src/app/(dashboard)/agenda/agenda-vista-dia.tsx:121-200`
**Acción:**
- Ocultar franja horaria izquierda en móvil: `hidden sm:block` en `w-14`.
- Mover hora a inline dentro de cada evento (ya hay clock icon; mostrar "09:00" al lado).
- Card evento: `flex flex-col sm:flex-row` para que texto se lea.
- Altura evento: `min-h-11` en móvil (tap comfort).
**Criterio:** En 375px se leen nombre de cita + hora sin overflow.

---

### **Paso 22** — Agenda: vista mes → lista agrupada en móvil
**Archivo:** `src/app/(dashboard)/agenda/agenda-mensual.tsx:103`
**Acción:** En móvil reemplazar calendario 7×5 por lista colapsable:
- `<div className="sm:hidden">`: lista de días con citas agrupadas (solo días con contenido).
- `<div className="hidden sm:block">`: calendario actual.
**Criterio:** En móvil no hay celdas de 53×80px ilegibles; desktop mantiene calendario.

---

### **Paso 23** — Agenda: controles de navegación
**Archivo:** `src/app/(dashboard)/agenda/agenda-client.tsx:137-231`
**Acción:**
- Envolver controles en `flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between`.
- Grupo prev/hoy/next: `w-full sm:w-auto justify-center`.
- Grupo Día/Semana/Mes: `w-full sm:w-auto`.
**Criterio:** En 375px los controles no se solapan, cada grupo ocupa su fila.

---

### **Paso 24** — Botones "Nueva X" en listings
**Archivos:** `pacientes/page.tsx:30`, `dietas/page.tsx:49-67`, `recetas/page.tsx`.
**Acción:** Patrón consistente:
```tsx
<Link className="inline-flex items-center gap-2 px-3 sm:px-4 py-2.5 ...">
  <Plus className="w-4 h-4" />
  <span className="hidden xs:inline">Nuevo paciente</span>
</Link>
```
Y `flex-wrap` en contenedor cuando hay varios botones.
**Criterio:** En iPhone SE el botón es al menos un icono-solo accesible; en móvil grande muestra el texto.

---

### **Paso 25** — RecetasGrid: tap targets y paginación
**Archivo:** `src/app/(dashboard)/recetas/recetas-grid.tsx`
**Acción:** Verificar que cada card tiene `min-h-24` y el botón "Ver más" es `w-full sm:w-auto` con `py-3`.
**Criterio:** Cards pulsables cómodamente; botón ver más no es pequeño.

---

## 👤 FASE 5 — Ficha del paciente (pasos 26-31)

### **Paso 26** — Cabecera paciente: reordenar en móvil
**Archivo:** `src/components/paciente/paciente-ficha-client.tsx:149-189`
**Acción:**
- Avatar + nombre: fila principal.
- Metadata (fecha, edad): debajo del nombre en móvil (`flex flex-col sm:flex-row sm:items-center`).
- Botones acciones: `flex-wrap gap-2 w-full sm:w-auto`.
**Criterio:** En 375px, nombre visible completo, botones caben en 2 filas máximo.

---

### **Paso 27** — Tab General: grid gap y padding
**Archivo:** `src/components/paciente/paciente-ficha-general-tab.tsx:130`
**Acción:**
- `gap-5` → `gap-4 lg:gap-5` (reducir spacing en móvil).
- Cards internas: `p-5` → `p-4 sm:p-5`.
**Criterio:** Menos scroll en móvil, spacing proporcional.

---

### **Paso 28** — Tabla horario semanal (8 columnas) → vista acordeón móvil
**Archivo:** `src/components/horario-semanal.tsx:172-173`
**Acción:** Dos vistas:
- Desktop (`hidden sm:block`): mantener tabla actual con `overflow-x-auto` + `min-w-[480px]`.
- Móvil (`sm:hidden`): acordeón por día (Lunes, Martes...), cada día expande con sus franjas de horas.
**Criterio:** Sin scroll horizontal en 375px; todas las celdas editables.

---

### **Paso 29** — Tab Plan de alimentación: grid macros
**Archivo:** `src/components/paciente/plan-de-alimentacion-tab.tsx:444, 714`
**Acción:**
- Grid `lg:grid-cols-[1fr_400px]` → `lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_400px]` (sidebar más flexible).
- Grid `grid-cols-[auto_auto_auto_auto]` → `grid grid-cols-2 lg:grid-cols-4 gap-x-3 gap-y-1.5`.
- Donut charts: wrapper con `ResponsiveContainer` + `h-[160px] sm:h-[200px]`.
**Criterio:** Sin overflow horizontal; donuts visibles; macros legibles.

---

### **Paso 30** — Tab Mediciones: gráfico y tabla responsivos
**Archivo:** `src/components/paciente/paciente-ficha-mediciones-tab.tsx:346`
**Acción:**
- `grid-cols-1 xl:grid-cols-[min(100%,320px)_1fr]` → añadir breakpoint intermedio `lg:grid-cols-[280px_1fr] xl:grid-cols-[320px_1fr]`.
- `gap-6` → `gap-4 lg:gap-6`.
- Altura gráfico: `h-[220px]` → `h-[180px] sm:h-[220px]`.
- Tabla mediciones: envolver en `overflow-x-auto` + columnas priorizadas (mostrar peso+fecha, ocultar otras con `hidden md:table-cell`).
**Criterio:** Gráfico se ve en móvil sin cortarse; tabla tiene scroll o columnas ocultas prioritarias.

---

### **Paso 31** — Plan visual: selector día full width
**Archivo:** `src/components/paciente/plan-visual.tsx:379`
**Acción:** Cambiar `inline-flex` por `flex w-full` y revisar que cada pill tiene `min-h-10`.
**Criterio:** Selector de día no se sale del viewport.

---

## 🍽️ FASE 6 — Editores de dietas (pasos 32-37)

### **Paso 32** — PlanSelector responsive
**Archivo:** `src/app/(dashboard)/dietas/[id]/plan-selector.tsx:76-177`
**Acción:**
- Contenedor externo: `flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-2`.
- Botón "Marcar como actual" en móvil: solo icono con `aria-label`.
- Dropdown: `absolute left-0 right-0` ya está bien pero asegurar `z-50` y `max-h-[60dvh]`.
**Criterio:** En 375px, selector y botón se apilan en 2 filas sin superposición.

---

### **Paso 33** — Cabecera dieta: toolbar responsive
**Archivo:** `src/app/(dashboard)/dietas/[id]/page.tsx:66-106`
**Acción:**
- Toolbar (`inline-flex ... flex-wrap ml-auto`): reemplazar por `grid grid-cols-3 gap-1 sm:inline-flex sm:flex-row sm:gap-1` para orden consistente en móvil (3 columnas).
- Botones IA/Plantilla/Compartir/Editar/Eliminar: siempre iconos + texto oculto en xs (`hidden xs:inline`).
**Criterio:** 5 botones caben en 2 filas ordenadas en 375px.

---

### **Paso 34** — AlimentoForm: grid de macros
**Archivo:** `src/components/alimento-form.tsx:139`
**Acción:**
- `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5`.
- Aplicar también al grid de micronutrientes (24 campos).
- Labels: `break-words` para texto largo ("Ácido pantoténico").
**Criterio:** En móvil cada input ocupa fila completa.

---

### **Paso 35** — PlanEditor: layout sidebar
**Archivo:** `src/components/dieta/plan-editor.tsx:402`
**Acción:**
- `flex flex-col xl:flex-row` → `flex flex-col lg:flex-row` (stack hasta tablet horizontal).
- Sidebar análisis en móvil: mover al final con `order-last lg:order-none`.
- Selector días con `overflow-x-auto` + botones `min-h-10`.
**Criterio:** En tablet vertical se ve cómodo; en móvil el análisis queda al final.

---

### **Paso 36** — AlimentoCard: input cantidad táctil
**Archivo:** `src/components/dieta/alimento-card.tsx:81-108`
**Acción:**
- Input cantidad: `w-14` → `w-16 sm:w-14`, `py-0.5` → `py-1.5`, añadir `inputMode="decimal"` y `text-base`.
- Badges macros: `flex-wrap justify-end` → `flex-wrap justify-start sm:justify-end`.
- Grip handle: mostrar solo en desktop (`hidden sm:flex`); en móvil usar long-press o swipe.
**Criterio:** En móvil se puede editar cantidad sin zoom; badges no desbordan.

---

### **Paso 37** — ComidaSlot: padding y drag alternativo táctil
**Archivo:** `src/components/dieta/comida-slot.tsx:143, 245`
**Acción:**
- Header `px-6 py-4` → `px-4 py-3 sm:px-6 sm:py-4`.
- Badges pills `px-3.5 py-1.5` → `px-2.5 py-1 sm:px-3.5 sm:py-1.5`.
- Reemplazar reordenamiento drag por botones "↑↓" en móvil (`sm:hidden`).
**Criterio:** Header no se corta; reordenar funciona con touch.

---

## 📝 FASE 7 — Formularios (pasos 38-42)

### **Paso 38** — PacienteForm: TagInput y spacing
**Archivo:** `src/components/paciente-form.tsx:32-100, 223-562`
**Acción:**
- TagInput: `flex gap-2` → `flex flex-col xs:flex-row gap-2`.
- Reducir `space-y-8` a `space-y-6 sm:space-y-8`.
- Inputs: asegurar `text-base` (eliminar `text-sm`).
- Modal "cambios sin guardar": `mx-4` → `mx-4 pb-safe`.
**Criterio:** En 320px se puede escribir alergias/patologías; no hay zoom iOS.

---

### **Paso 39** — Login y Registro: viewport y padding
**Archivos:** `src/app/(auth)/login/page.tsx:39, 74`, `registro/page.tsx:104, 122, 168, 314`
**Acción:**
- `min-h-screen` → `min-h-dvh`.
- `px-8` → `px-4 sm:px-6 lg:px-8`.
- Grid Paso 1 (nombre/apellido): `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
- Features Paso 2 en planes: `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
- Añadir `pb-safe` al botón submit.
**Criterio:** Formulario no se corta en iPhone SE con URL bar; no requiere zoom.

---

### **Paso 40** — RecetaForm: sidebar sticky
**Archivo:** `src/components/receta-form.tsx:93, 144-162`
**Acción:**
- `grid grid-cols-1 lg:grid-cols-[3fr_2fr]` — mantener.
- `aside lg:sticky lg:top-4`: cambiar a `aside lg:sticky lg:top-4 order-first lg:order-last`. Así en móvil sale el resumen arriba (más útil).
- Botones footer: `flex justify-end gap-3` → `flex flex-col-reverse sm:flex-row sm:justify-end gap-3`.
**Criterio:** En móvil, análisis arriba; botones apilados (primario arriba).

---

### **Paso 41** — AlimentoSearch: dropdown altura dinámica
**Archivo:** `src/components/alimento-search.tsx:92`
**Acción:**
- `max-h-64` → `max-h-[min(16rem,50dvh)]`.
- Gestionar teclado virtual: detectar `window.visualViewport.height` y reposicionar dropdown.
- Añadir `scroll-pb-4 pb-safe`.
**Criterio:** Dropdown no se tapa con teclado iOS.

---

### **Paso 42** — Inputs numéricos transversales: `inputMode`
**Archivos múltiples:** `alimento-form.tsx`, `planificacion-por-defecto-tab.tsx:1107+`, `ingrediente-list.tsx:110`, `paciente-form.tsx`.
**Acción:** Añadir a todos los `<input type="number">`:
```tsx
<input type="number" inputMode="decimal" step="0.1" ... />
```
Para enteros usar `inputMode="numeric"`.
**Criterio:** Teclado móvil muestra teclado numérico, no alfabético.

---

## 📱 FASE 8 — Portal del paciente (pasos 43-46)

### **Paso 43** — Diario alimentario: delete button táctil
**Archivo:** `src/app/paciente/portal/diario/page.tsx:107-112`
**Acción:**
- Eliminar `opacity-0 group-hover:opacity-100` (hover no funciona en touch).
- Hacer botón siempre visible con icono trash y `min-h-10`.
- Alternativa: swipe-to-delete con librería `react-swipeable`.
**Criterio:** En móvil se ve y se puede usar el botón borrar.

---

### **Paso 44** — Seguimiento: inputs agua/ejercicio táctiles
**Archivo:** `src/app/paciente/portal/seguimiento/page.tsx:531-607, 626`
**Acción:**
- Botones agua: `px-3 py-2` → `px-4 py-3 min-h-11`.
- Grid ejercicio `grid-cols-2` → `grid-cols-1 sm:grid-cols-2`.
- Date input: `text-xs border-none` → `text-sm border border-border px-3 py-2`.
- Toggle ejercicio: tamaño táctil OK (48×24), documentar.
**Criterio:** Todos los inputs con tap target ≥44px; legibles.

---

### **Paso 45** — Plan read-only (compartido): tipografía legible
**Archivo:** `src/components/compartido/plan-read-only.tsx:55-109`
**Acción:**
- `text-[10px]` → `text-xs sm:text-[11px]`.
- Aumentar spacing en filas: `py-1` → `py-1.5 sm:py-2`.
**Criterio:** Paciente puede leer ingredientes de receta sin zoom.

---

### **Paso 46** — Tour overlay: safe-area
**Archivo:** `src/components/tour/tour-overlay.tsx:70-82`
**Acción:** Tooltip `position: fixed` añadir `padding: max(env(safe-area-inset-top), 16px) ...`. También verificar `z-[9999]` para estar por encima.
**Criterio:** Tour no queda tapado por notch/status bar en iPhone con notch.

---

## ✅ FASE 9 — Testing y QA (pasos 47-50)

### **Paso 47** — Dispositivos físicos / emulados obligatorios
**Acción:** Probar en:
- **iPhone SE (375×667)** — el más crítico
- **iPhone 14 Pro (393×852)** — con Dynamic Island
- **Samsung Galaxy S8 (360×740)** — Android pequeño
- **iPad Mini (768×1024)** — tablet vertical
- **iPad Pro (1024×1366)** — tablet horizontal
Safari iOS, Chrome Android, Firefox mobile.
**Criterio:** Checklist de 10 flujos clave por dispositivo (login → crear paciente → crear dieta → ver plan).

---

### **Paso 48** — Lighthouse mobile audit
**Acción:** Ejecutar Lighthouse con "Mobile" en todas las páginas principales. Objetivo:
- Performance ≥ 70
- Accessibility ≥ 90
- Best Practices ≥ 90
- PWA ≥ 80 (si se aplicó Paso 2)
Verificar tap targets, text contrast, viewport.
**Criterio:** Todas las pantallas pasan thresholds.

---

### **Paso 49** — Test de teclado virtual iOS
**Acción:** Probar en iOS real (no emulador):
- Focus en cada input → ¿hace zoom? NO.
- Input visible con teclado abierto → SÍ.
- Botón submit accesible con teclado abierto → SÍ (añadir `scroll-padding-bottom` o scroll automático).
**Criterio:** Ningún formulario requiere hacer scroll manual mientras escribes.

---

### **Paso 50** — Test de orientación y safe-area
**Acción:**
- Rotar device a landscape: ¿hay overflow? ¿topbar cambia bien?
- iPhone con notch: ¿topbar respeta safe-area? ¿drawer tiene padding izquierdo con notch en landscape?
- Sidebar en landscape iPad: ¿no se queda abierto por error?
**Criterio:** App funcional en landscape; notch nunca tapa UI.

---

## 📊 Matriz de priorización

| Fase | Tiempo estimado | Impacto usuario | Riesgo regresión |
|------|----------------|-----------------|------------------|
| Fase 1 (cimientos) | 2-3h | **ALTO** | Bajo |
| Fase 2 (design system) | 3-4h | **ALTO** | Medio |
| Fase 3 (navegación) | 3-4h | **ALTO** | Medio |
| Fase 4 (listings) | 4-6h | **ALTO** | Medio |
| Fase 5 (ficha paciente) | 6-8h | **ALTO** | Alto (archivo complejo) |
| Fase 6 (editores) | 5-7h | **ALTO** | Alto (DnD) |
| Fase 7 (formularios) | 4-5h | **MEDIO** | Medio |
| Fase 8 (portal) | 3-4h | **CRÍTICO para pacientes** | Bajo |
| Fase 9 (testing) | 4-6h | **ALTO** | — |

**Total estimado: 34-47 horas** de trabajo.

---

## 🎯 Recomendación de ejecución

### Sprint 1 (prioridad máxima, ~1 semana)
Pasos **1-6, 14, 16, 19, 20, 26, 28, 34, 38, 39, 47**
→ Arregla cimientos + top 10 pantallas más rotas.

### Sprint 2 (refinamiento, ~1 semana)
Resto de pasos de Fases 3-7.

### Sprint 3 (portal + testing, ~3-4 días)
Fases 8 y 9 completas.

---

## 🔥 Top 10 problemas críticos (prioridad absoluta)

1. ⚠️ **Sin `<meta viewport>`** → iOS hace zoom (Paso 1)
2. ⚠️ **Inputs `text-sm`** → zoom automático en focus (Paso 4)
3. ⚠️ **AlimentoForm grid 5 cols** → inutilizable en móvil (Paso 34)
4. ⚠️ **Filtros alimentos/recetas grids** → apretados (Pasos 19-20)
5. ⚠️ **Agenda vista mes** → 7×5 celdas en 375px (Paso 22)
6. ⚠️ **Tabs ficha paciente** → scroll no fluido (Paso 16)
7. ⚠️ **Tabla horario semanal** → overflow imposible (Paso 28)
8. ⚠️ **Toaster top-right** → tapa contenido con teclado (Paso 6)
9. ⚠️ **Diario delete hover-only** → inutilizable touch (Paso 43)
10. ⚠️ **Registro grid cols-2** → inputs muy pequeños (Paso 39)

---

## 📝 Notas finales

- Este plan es **no-destructivo**: ningún paso rompe desktop.
- Usa siempre **mobile-first**: base sin prefijo = móvil; prefijos `sm:`/`md:`/`lg:` añaden complejidad.
- **NO implementar todo de una**: seguir sprints y testear tras cada fase.
- Actualizar este archivo al completar cada paso (`- [x]` al lado).

---

_Plan generado el 2026-04-18 a partir de auditoría exhaustiva de 7 agentes paralelos._
