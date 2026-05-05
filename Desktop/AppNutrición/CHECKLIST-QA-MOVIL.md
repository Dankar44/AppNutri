# ✅ Checklist QA móvil — AppNutri

> Checklist manual para verificar los pasos 47-50 del plan de responsividad.
> Marcar `[x]` al completar cada ítem. Anotar bugs en sección "Notas".

---

## 📱 Paso 47 — Dispositivos a probar

Probar el flujo completo en TODOS estos dispositivos (físicos preferidos, emulador si no hay):

### Dispositivos prioritarios

- [ ] **iPhone SE 3ª gen (375×667)** — base iOS pequeño, el más crítico
- [ ] **iPhone 14 Pro (393×852)** — con Dynamic Island / notch
- [ ] **iPhone 15 Plus (430×932)** — iOS grande
- [ ] **Samsung Galaxy S22 (360×780)** — Android base
- [ ] **Google Pixel 7 (412×915)** — Android grande
- [ ] **iPad Mini 6 (744×1133)** — tablet vertical
- [ ] **iPad Pro 12.9" (1024×1366)** — tablet horizontal

### Navegadores

- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Firefox mobile
- [ ] Samsung Internet
- [ ] Instagram in-app browser (muchos usuarios entran desde ahí)

### Flujos clave a probar en cada dispositivo

**Flujo dietista:**
1. [ ] Login con email+password
2. [ ] Ver dashboard
3. [ ] Lista pacientes → abrir sidebar hamburguesa → navegar
4. [ ] Crear nuevo paciente (completar todos los campos)
5. [ ] Ver ficha paciente → scrollear tabs → entrar en cada una
6. [ ] Editar paciente y guardar
7. [ ] Crear dieta desde cero (añadir alimentos a Lunes)
8. [ ] Generar dieta con IA
9. [ ] Compartir plan (generar link)
10. [ ] Ver agenda → cambiar vista día/semana/mes → navegar entre meses
11. [ ] Crear cita nueva
12. [ ] Ver recetas → buscar → marcar favorita
13. [ ] Crear receta propia con ingredientes
14. [ ] Importar alimento custom
15. [ ] Ver notificaciones
16. [ ] Ajustes → modificar perfil → guardar

**Flujo paciente (portal):**
1. [ ] Login con email+PIN
2. [ ] Ver resumen día
3. [ ] Registrar agua (botones 250ml, 500ml, 1L)
4. [ ] Registrar ejercicio
5. [ ] Ver plan del día
6. [ ] Añadir entrada al diario alimentario
7. [ ] Eliminar entrada del diario (botón trash permanente)
8. [ ] Ver recomendaciones
9. [ ] Editar perfil
10. [ ] Cambiar PIN/contraseña

### Puntos críticos a observar en cada prueba

- [ ] **Sin scroll horizontal no deseado** en ninguna pantalla
- [ ] **Sin zoom automático** al enfocar inputs (prueba especialmente en Safari iOS)
- [ ] **Click targets cómodos** con el dedo (al menos 44×44px)
- [ ] **Texto legible** sin tener que hacer zoom manual (mínimo ~14px)
- [ ] **Avatares y SVG** renderizan sin distorsión
- [ ] **Dropdowns y modales** caben en viewport y no tapan lo importante
- [ ] **Formularios** funcionan con teclado virtual abierto
- [ ] **Botones con icono+texto** se ven completos o con fallback icon-only
- [ ] **Cabeceras sticky** no superponen contenido
- [ ] **Toast notifications** visibles pero no obstaculizan

---

## 🚦 Paso 48 — Lighthouse Mobile Audit

Ejecutar **Lighthouse** en Chrome DevTools con perfil "Mobile" para cada página clave.

### Páginas a auditar

- [ ] `/login`
- [ ] `/registro`
- [ ] `/pacientes` (listado)
- [ ] `/pacientes/[id]` (ficha)
- [ ] `/pacientes/[id]/editar`
- [ ] `/dietas` (listado)
- [ ] `/dietas/[id]` (detalle con PlanSelector)
- [ ] `/alimentos`
- [ ] `/recetas`
- [ ] `/agenda` (vista mes)
- [ ] `/paciente/portal` (home paciente)
- [ ] `/paciente/portal/seguimiento`
- [ ] `/paciente/portal/diario`

### Thresholds objetivo

| Categoría | Objetivo | Crítico si <. |
|---|---|---|
| **Performance** | ≥ 70 | < 50 |
| **Accessibility** | ≥ 90 | < 80 |
| **Best Practices** | ≥ 90 | < 80 |
| **SEO** | ≥ 85 | < 70 |
| **PWA** | ≥ 80 | < 60 |

### Checks específicos Lighthouse

- [ ] `viewport` meta tag presente (✅ añadido en Paso 1)
- [ ] `tap-targets` sin fallos (click targets ≥ 48dp)
- [ ] `font-size` legible sin zoom
- [ ] `image-aspect-ratio` correcto (avatar demo embebido como data URL base64)
- [ ] `color-contrast` cumple WCAG AA (ratio ≥ 4.5:1)
- [ ] `html-has-lang="es"` (✅ ya está)
- [ ] Sin `document.write`, sin APIs obsoletas

### Cómo ejecutar

```
1. Chrome DevTools → Lighthouse tab
2. Mode: "Navigation", Device: "Mobile"
3. Categories: Performance, Accessibility, Best Practices, SEO, PWA
4. "Analyze page load"
```

---

## ⌨️ Paso 49 — Test teclado virtual iOS

**Solo se puede verificar en iOS real o Simulator.** Android iOS Simulator NO cuenta.

### Formulario por formulario

Para cada uno, abrir en iPhone real:

- [ ] **Login**: focus en email → ¿hace zoom? ❌ NO debe
- [ ] **Login**: focus en password → teclado aparece → ¿queda visible el input? ✅ SÍ
- [ ] **Login**: con teclado abierto → ¿se ve el botón "Iniciar sesión"? ✅ SÍ

- [ ] **Registro paso 1**: tab entre nombre/apellido/email/password → teclado se mantiene abierto
- [ ] **Registro paso 1**: scroll automático al input activo
- [ ] **Registro paso 2 (planes)**: tap en plan → no hace zoom
- [ ] **Registro paso 3 (colegiado)**: input número → teclado numérico (por `inputMode="numeric"`)

- [ ] **Crear paciente**: todos los inputs → sin zoom
- [ ] **Crear paciente**: TagInput alergias → añadir tag con Enter → funciona
- [ ] **Crear paciente**: fecha nacimiento → abre picker nativo iOS
- [ ] **Crear paciente**: peso/altura → teclado numérico decimal

- [ ] **Editar dieta**: input cantidad alimento → teclado numérico
- [ ] **AlimentoSearch dropdown**: con teclado abierto → dropdown visible y scrollable

- [ ] **Diario paciente**: añadir entrada → input cantidad → teclado numérico
- [ ] **Seguimiento paciente**: botones agua → tap registra sin doble-tap

### Problemas comunes a verificar

- [ ] ¿Algún input hace zoom involuntario? → Revisar que tiene `text-base` o CSS global de `font-size: 16px`
- [ ] ¿Algún botón queda debajo del teclado? → Añadir `scroll-padding-bottom` o scroll into view
- [ ] ¿Teclado se abre y cierra sin motivo? → Revisar focus management
- [ ] ¿Teclado numérico aparece en inputs de texto? → Quitar `inputMode` mal puesto
- [ ] ¿Autocomplete iOS sugiere datos raros? → Añadir `autoComplete="off"` en inputs sensibles

---

## 🔄 Paso 50 — Test orientación y safe-area

### Cambios de orientación

Probar cada pantalla en **landscape** y rotar a portrait a mitad de uso:

- [ ] Login en landscape → no hay overflow
- [ ] Dashboard en landscape → sidebar desktop aparece (≥1024px) o se mantiene móvil
- [ ] Ficha paciente en landscape → tabs no se corten
- [ ] Agenda vista mes en landscape → calendario se ve completo
- [ ] Editor dieta en landscape → comidas caben
- [ ] Portal paciente en landscape → seguimiento y diario funcionan

### Safe-area iOS (iPhone con notch / Dynamic Island)

Solo iPhone X o más nuevos. Verificar:

**Portrait:**
- [ ] Topbar móvil respeta el notch (tiene `pt-safe`)
- [ ] Sidebar drawer: logo/avatar no tapados por notch (tiene `pt-safe`)
- [ ] Botón flotante inferior (si hay) sobre la home bar (tiene `pb-safe`)
- [ ] Modales bottom sheet tienen `pb-safe`
- [ ] Tour overlay no queda tapado por notch

**Landscape:**
- [ ] Notch a la izquierda no tapa contenido (tiene `pl-safe`)
- [ ] Home bar a la derecha tiene `pr-safe`
- [ ] Drawer sidebar respeta `pl-safe`

### Configuración de entorno

Para probar safe-area sin iPhone real:
```
Chrome DevTools → ⋮ → More tools → Sensors → Sensor overrides
→ "Model" seleccionar iPhone 14 Pro
```
O usar **Safari Technology Preview** con device simulator.

---

## 🐛 Notas y bugs encontrados

_Anotar aquí problemas detectados durante QA:_

### Bugs críticos
- [ ] ...

### Bugs medios
- [ ] ...

### Mejoras detectadas
- [ ] ...

---

## 🎯 Cobertura esperada tras QA

Una vez completado todo el checklist:

- [ ] **100%** pantallas verificadas en iPhone SE y iPhone 14 Pro
- [ ] **≥ 90%** pantallas verificadas en Android base (Galaxy S22)
- [ ] **Lighthouse mobile** ≥ 70 en 10 páginas clave
- [ ] **0 bugs críticos** pendientes
- [ ] **< 5 bugs medios** pendientes (documentados con prioridad)

---

## 📝 Registro de ejecución

| Fecha | Dispositivo | Tester | Flujos probados | Bugs encontrados |
|---|---|---|---|---|
| YYYY-MM-DD | iPhone SE 3 | — | — | — |
| YYYY-MM-DD | iPhone 14 Pro | — | — | — |
| YYYY-MM-DD | Galaxy S22 | — | — | — |
| YYYY-MM-DD | iPad Mini | — | — | — |

---

_Checklist generado como parte del plan de responsividad móvil — pasos 47-50._
