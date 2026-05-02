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
