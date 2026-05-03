# Tareas completadas — AppNutri (Annonia)

Registro de tareas finalizadas, ordenadas por fecha.

---

## 28 de abril de 2026

### #9. Email del paciente opcional

Email ahora es opcional en el formulario de crear/editar paciente. Si no tiene email: botón de enviar email desactivado, banner de aviso en portal, y las funciones de email devuelven error controlado. La base de datos ya era `String?`; se quitó la validación obligatoria del form y del server action.

### #12. BUG — Calorías no coinciden entre plan y entregables

Corregido. El bug afectaba solo a **recetas** (no a alimentos individuales). Tres archivos usaban `calcularMacrosPorcion` para recetas, que divide por 100 como si fueran gramos — pero las recetas almacenan macros por porción. Fórmula correcta: `receta.calorias * cantidad`. Archivos corregidos: `generate-plan-pdf.ts`, `plan-read-only.tsx`, `sugerencias.ts`.

---

## 29 de abril de 2026

### #3. Mover botón de vincular Google Calendar a "Mis citas"

Movido `IntegracionesCardPaciente` de `/paciente/portal/seguimiento/horario` a `/paciente/portal/citas`. Actualizados los `revalidatePath`, el redirect del callback OAuth y los flash messages de Google.

---

## 30 de abril de 2026

### #4. Seed de pagos de ejemplo en paciente demo

Añadidos 3 pagos demo: consulta inicial 45 EUR (pagado, transferencia), revisión 30 EUR (pagado, Stripe), revisión pendiente 30 EUR. Se eliminan al borrar el paciente demo (antes del delete, por el `onDelete: SetNull` del modelo Pago). Se recrean al restaurar. Auto-alineación mensual de fechas incluida. Script `seed-paciente-demo-existentes.ts` también actualizado.

### #8. Google OAuth en producción

Google Calendar, Meet y Sign in with Google configurados en producción (annonia.com). Incluye:

- **Redirect URIs** configuradas en Google Cloud Console para `https://annonia.com`.
- **Variables de entorno** (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI_NUTRI`, `GOOGLE_REDIRECT_URI_PACIENTE`) añadidas en Oracle.
- **Consent screen** publicado en modo producción.
- **Fix redirect a localhost** — Los callbacks OAuth leían `req.url` (que detrás de nginx da `localhost:3000`). Corregido leyendo headers `x-forwarded-proto` y `host` en los 3 callbacks: `callback-nutri`, `callback-paciente` y `auth/callback`.
- **Fix borrado silencioso** — Al desconectar con "borrar", `deleteGoogleEvent` fallaba silenciosamente pero se limpiaban los `googleEventId` igualmente. Corregido para solo limpiar los que realmente se borraron.
- **Mensajes de error amigables** — Reemplazados códigos técnicos (`state_mismatch`, `exchange_failed`, etc.) por mensajes en español comprensibles para el usuario, tanto en Ajustes (nutri) como en Citas (paciente).
- **Tarjeta Google Calendar en agenda** — Nuevo componente `GoogleCalendarSidebar` en el sidebar derecho de la agenda del nutricionista, mostrando estado de conexión y acceso rápido a conectar/ajustes.
- **Supabase Google provider** — Configurado en el dashboard de Supabase (Client ID, Client Secret, Callback URL) para Sign in with Google.
- **Botón "Continuar con Google"** en login ya funcional.

### SEO / GEO completado

- **Google Analytics 4** — Propiedad creada, ID `G-ZSXTK43JY0` configurado en producción. Componente reescrito con inyección DOM directa. CSP actualizada con wildcard para endpoints regionales EU.
- **Google Search Console** — Dominio verificado con DNS TXT en DonDominio. Sitemap enviado.
- **Google Business Profile** — Perfil creado y verificado.
- **PageSpeed Insights** — Desktop 99/92/100/92. Fixes de accesibilidad: headings footer, link descriptivo cookie banner.

---

## 1 de mayo de 2026

### #15. Link al alimento (alimentos propios)

Campo `enlaceProducto` en schema, validación segura de URLs (solo http/https), formulario de alta/edición, icono de link en editor de dieta, portal paciente, lista de la compra (UI + texto), PDF con links clicables, vista compartida, y 4 entradas nuevas en help-kb.

### #17. Sign in with Google (Supabase)

Supabase Google provider configurado (Client ID, Client Secret, Callback URL). Botón "Continuar con Google" funcional en login. Vincular cuenta Google desde Ajustes con `GoogleLoginCard` y `linkIdentity()`. Los edge cases pendientes (usuario Google sin cuenta dietista, flujo de registro con Google) se verificarán en #18 (testing Google en producción).

### Vincular cuenta de Google desde Ajustes

Nuevo componente `GoogleLoginCard` en la sección Integraciones de Ajustes. Permite vincular la cuenta de Google para iniciar sesión sin contraseña usando `supabase.auth.linkIdentity()`. Muestra el email vinculado cuando ya está conectado. Callback mejorado para manejar errores del flujo de linking sin redirigir a `/login`.

### Cifrado AES-256-GCM de tokens de Google Calendar

Tokens OAuth (`accessToken`, `refreshToken`) de Google Calendar cifrados con AES-256-GCM antes de guardarse en la base de datos. Módulo `src/lib/encryption.ts` con `encryptToken()`/`decryptToken()`. Backward compatible: detecta tokens en texto plano y los lee sin error. Script de migración `scripts/encrypt-tokens.ts` para cifrar tokens existentes. Sin `ENCRYPTION_KEY` (dev local), los tokens se guardan en plano.

### #5a. Micronutrientes editables en formulario de alimentos

Sección colapsable "Micronutrientes por 100g" en el formulario de crear/editar alimento con los 24 campos (13 vitaminas + 11 minerales). Semántica null/0/undefined: campo vacío = null (no medido), 0 = medido como cero, sección no abierta = no toca valores existentes en BD. Constantes compartidas extraídas a `src/lib/micronutrientes.ts` (reutilizadas por el formulario y la tarjeta de ficha). Tarjeta de micronutrientes actualizada para distinguir visualmente null (—) de 0. Fix del tipo de retorno de `validarMicros` (de `Record<string, ...>` a `Partial<Record<MicroKey, ...>>`) para evitar conflicto de overloads de Prisma. Mejora del manejo de errores del formulario: toast con mensaje específico del server action + reset del botón "Guardando" en caso de error. Fix de `enlaceProducto` faltante en los mapeos de datos del entregable PDF (`planes.ts`).

### #2. Revisar y actualizar las guías interactivas

Revisión completa del sistema de tours (14 tours: 11 dietista + 3 paciente). Cambios:

- **11 selectores rotos reparados**: Dashboard rediseñado (stats-cards → dashboard-proxima-cita, patients-attention → dashboard-quick-access, today-appointments → dashboard-notificacion), alimentos (food-list), reportes (reports-kpis, patient-reports), portal paciente (dietista-info → portal-hoy-card, quick-access → portal-progreso-card, diet-plan, shopping-list-link, evolution-charts).
- **Race condition con navegación**: Añadido `transitioning` state + `isNavigatingRef` guard en tour-provider. `usePathname()` para detectar cuándo la ruta ha cambiado. El overlay espera a que la ruta coincida antes de buscar el target.
- **Polling de elementos**: Reemplazado el timeout único de 300ms por polling (15 intentos × 200ms = 3s) que encuentra el target incluso si tarda en renderizar.
- **Doble-click salta pasos**: Guard con `isNavigatingRef` — si se está navegando, `nextStep()` y `prevStep()` no hacen nada.
- **Click accidental cierra tour**: Eliminado `onClick={skipTour}` del overlay. Ahora solo se cierra con el botón X.
- **Feedback visual**: Indicador `Loader2` spinning durante transición + botones deshabilitados + tooltip con opacity 0→1 en transición.
- **Pasos intro (sin target)**: Scrim ligero (bg-black/30) + tooltip centrado tipo modal, sin highlight confuso.
- **Responsividad móvil**: Tooltip con ancho dinámico `Math.min(340, window.innerWidth - 32)`, posiciones left/right forzadas a bottom en ≤480px, medición real de tooltipH con useRef+useLayoutEffect, overflow-y-auto max-h-[60vh] para landscape, botones min-h-[44px] para accesibilidad táctil, welcome modal max-w-sm en móvil, listener de orientationchange.

---

## 2 de mayo de 2026

### #2b. Arreglos adicionales en guías interactivas

Correcciones tras testing manual de las guías:

- **Flash entre pasos**: La `transition-opacity` CSS hacía que al ocultar el tooltip se viera brevemente el texto nuevo en la posición vieja. Corregido: transición solo al mostrar (fade-in), ocultado instantáneo.
- **Highlight descuadrado con "Anterior"**: El timeout fijo de 350ms tras `scrollIntoView` no era suficiente para scrolls largos hacia arriba. Reemplazado por polling de estabilidad: lee `getBoundingClientRect()` cada 50ms hasta que la posición se estabiliza (3 lecturas < 2px, máx 1.5s).
- **Tooltip aparece antes de cargar la página**: Los pasos intro (sin target) que navegan a ruta nueva se mostraban inmediatamente. Ahora esperan 500ms tras llegar a la ruta para que la página renderice.
- **Paso "Lista de pacientes" señalaba botón incorrecto**: El target `new-patient-btn` apuntaba al botón "Nuevo paciente" en vez de la tabla. Añadido `data-tour="patient-list"` en la página de pacientes y actualizado el target del paso.
- **Elementos demasiado anchos**: Targets que ocupan >90% del ancho del viewport no muestran highlight box (confuso). Tooltip se centra en pantalla con scrim ligero.
- **Fallback vertical**: Si el tooltip no cabe ni arriba ni abajo del target, se centra en pantalla en vez de quedar fuera del viewport.
- **Parpadeo esporádico**: Dos `useEffect` distintos podían llamar a `findTarget` simultáneamente. Añadido guard: el efecto de pathname solo dispara búsqueda si no hay timers activos.

### #10 + #11. Colores personalizables + Logo y marca en entregables PDF

Sistema completo de personalización de entregables PDF:

- **5 temas de color predefinidos** (verde, azul, morado, naranja, oscuro) + **color personalizado** con derivación HSL automática desde un color primario. Módulo `src/lib/pdf/pdf-themes.ts`.
- **Logo del nutricionista** en portada, cabecera y contraportada del PDF. Upload como base64 data URL. PNGs transparentes soportados.
- **Nombre de marca** personalizable que reemplaza "Annonia" en cabeceras y footers. "Annonia" y "annonia.com" siempre visibles como atribución de plataforma (portada + footers).
- **Sección "Documentos" en Ajustes** con selector de tema (swatches), color picker nativo, upload de logo, campo de marca, y vista previa mini en tiempo real.
- **Checkboxes de secciones del PDF funcionales**: portada, plan semanal, detalle diario, recomendaciones, lista de la compra, valores nutricionales. Generación condicional en origen (reemplaza regex rota de post-procesado).
- **Botón "Personalizar entregables"** en pestaña de entregables del paciente, enlaza a Ajustes > Documentos.
- **Headers/footers del navegador eliminados** en print (`@page { margin: 0 }`).
- **Branding propagado** a: PDF principal, email del plan, vista compartida, lista de la compra compartida, portal del paciente (exportar PDF), reportes simples (evolución, ficha, dieta semanal).
- **4 server actions** nuevas: `actualizarTemaPdf`, `actualizarLogoPdf`, `eliminarLogoPdf`, `actualizarMarcaPdf`.
- **4 campos nuevos en Dietista**: `pdfLogoUrl`, `marcaPdf`, `temaPdf`, `colorPrimarioPdf`.
- **Backward compatible**: sin branding configurado → PDF idéntico al anterior (tema verde, "Annonia").
- **XSS audit**: `escapeHtml()` aplicado a todo dato de usuario inyectado en HTML.

### #20. Mostrar motivo de la notificación dentro de cada pestaña

Banner ámbar inline dentro de cada pestaña de la ficha del paciente que muestra el motivo de la notificación (ej. "Paciente sin medidas recientes — Daniel Prieto lleva >30 días sin medidas"). El badge rojo desaparece al entrar en la pestaña, pero el banner persiste hasta que el usuario lo cierra con la X. Notificaciones cacheadas en estado cliente para que sobrevivan al `revalidatePath`. Tooltip de notificaciones en la lista de pacientes corregido: de `bg-popover` (transparente) a `bg-card` (opaco).
