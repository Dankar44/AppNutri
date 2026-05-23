# Tareas — AppNutri (Annonia)

Registro consolidado de tareas pendientes. Actualizado el 8 de mayo de 2026.

---

## Tareas pendientes

### 1. Micronutrientes — funcionalidades pendientes

La fase 1 (micronutrientes opcionales), parte de la fase 2 (Open Food Facts + equivalentes), y la edición de micros en el formulario de alimentos ya están hechas. Queda:

- **Escaneo de código de barras** — UI con cámara para escanear EAN y buscar en Open Food Facts.
- **Estimación por IA** — Pasar nombre del alimento a un LLM para estimar los 24 micronutrientes cuando no haya datos. Marcar como "estimado por IA".
- **Importación CSV** (opcional) — Botón "Importar CSV" con plantilla descargable para nutricionistas con muchos alimentos propios.

### ~~2. Responsividad móvil~~ ✅ COMPLETADO (mayo 2026)

Rediseño mobile-first del portal paciente completo: tarjetas en todas las secciones, nav móvil con drawer, lista de la compra (controles 2 filas, bottom sheet, filtros multiselect), horario compacto (36px/hora, scrollable), chat fullscreen, seguimiento, evolución, citas, exportar PDF, perfil, recomendaciones. PageHeader con line-clamp-1. Safe-area padding en inputs.

### 3. SEO — Monitorización semanal

**Cada lunes (5 min):**
1. Search Console → "Rendimiento" → ver impresiones, clicks, CTR, posición media
2. Search Console → "Cobertura" → ver si hay errores de indexación
3. Google Analytics → "En tiempo real" → ¿hay usuarios activos?
4. Google Analytics → "Adquisición" → ¿de dónde viene el tráfico?
5. Buscar "Annonia" en Google → ¿aparece el favicon? ¿sitelinks? ¿qué posición?

### 4. Lista de la compra — PREGUNTAR A CLAUDIA

Las unidades ya se muestran correctamente gracias al sistema de unidades end-to-end. Preguntar a Claudia si con la lista automática con unidades correctas le vale o si realmente necesita poder editar cantidades/unidades manualmente antes de exportar.

### 5. Probar todas las opciones de Google en producción

Una vez las inscripciones estén abiertas, probar todos los flujos de Google de principio a fin:

- **Nutri — Google Calendar:** conectar, sincronizar cita, desconectar con "dejar", desconectar con "borrar", toggle sincronización on/off.
- **Nutri — Vincular cuenta Google:** vincular desde Ajustes, cerrar sesión, volver a entrar con "Continuar con Google".
- **Nutri — Sign in con Google:** registrarse directamente con Google → verificar que si no tiene cuenta de dietista muestra mensaje claro (no estado roto) y que si crea cuenta sigue el flujo de registro (datos + colegiado).
- **Paciente — Google Calendar:** conectar, ver cita sincronizada, desconectar.
- **Cancelar flujo OAuth:** empezar a conectar y cancelar a medias → debe volver sin error roto.
- **Verificar en móvil** (Safari iOS, Chrome Android).

### 6. Comprobar guías interactivas en modo móvil

Las guías interactivas ya están revisadas y funcionan en desktop. Falta **probarlas en dispositivos móviles reales** (o DevTools → device toolbar):

- Verificar que el tooltip no desborda en iPhone SE (375px), iPhone 15 (393px) y Android típicos.
- Verificar que los botones tienen suficiente área táctil (min 44px).
- Comprobar que las posiciones "left"/"right" se convierten a "bottom" en pantallas ≤ 480px.
- Verificar el welcome modal en pantallas pequeñas (márgenes, padding, scroll).
- Probar en landscape: tooltip con scroll si el contenido es alto.
- Verificar resize/rotación: tooltip se reposiciona correctamente.

### 8. Revisar lista de la compra — opciones de compartir y link compartido

Las opciones del menú "···" de la lista de la compra (Copiar al portapapeles, Enviar por WhatsApp, Enviar por email, Imprimir) y el link compartido público necesitan revisión:

- Verificar que cada opción funciona correctamente.
- Comprobar que el enlace compartido público muestra la lista correctamente para quien lo reciba.
- Revisar formato y presentación del contenido compartido.

### ~~9. Cambiar contraseña en Ajustes~~ ✅ COMPLETADO (mayo 2026)

Implementado en Ajustes con confirmación de contraseña actual vía Supabase Auth.

### 10. Botón de ayuda solapa el botón de formularios

El botón flotante de ayuda (icono `?` verde, esquina inferior derecha) se superpone con los botones de acción de formularios como "Crear alimento". Investigar opciones: mover el botón de ayuda a otra posición, ocultarlo en páginas con formularios, o ajustar el z-index/posición de los botones de acción para que no colisionen.

### 11. Investigar funcionalidad "Ver historial" en Planes alimenticios

En la vista de Planes alimenticios, cada paciente muestra un enlace "Ver historial" junto al número de planes. Investigar qué hace exactamente y si funciona correctamente.

### 12. Hacer guías interactivas más realistas

Las guías interactivas ya usan datos del paciente demo real ("Paciente Prueba"). Falta que las páginas tour-demo sean más fieles a la app real (más detalle visual, interacciones simuladas más creíbles). Revisar cada una de las 5 guías y mejorar la fidelidad de los datos y el aspecto.

### 14. Migrar fotos base64 a Supabase Storage (1 GB gratis) — DANIEL

Actualmente las fotos de perfil (nutricionista y paciente) y el logo del PDF se guardan como base64 directamente en la base de datos PostgreSQL (500 MB gratis). Supabase incluye 1 GB de Storage gratuito que no estamos usando. Migrar las fotos ahí liberaría espacio en la BD y multiplicaría la capacidad x3-5.

**Pasos:**
1. Activar Supabase Storage en el dashboard del proyecto (Storage → Create bucket).
2. Crear buckets: `profile-photos` (público) y `pdf-logos` (público).
3. Configurar políticas RLS: solo el propietario puede subir/borrar, lectura pública.
4. Modificar los formularios de subida de foto/logo para subir el archivo a Storage en vez de convertir a base64.
5. Guardar en BD solo la URL pública del archivo (ej: `https://xxxx.supabase.co/storage/v1/object/public/profile-photos/abc.webp`).
6. Migrar las fotos existentes: script que lea base64 de la BD, suba a Storage y actualice la URL.
7. Verificar que las fotos se ven correctamente en: ajustes, ficha paciente, PDF, portal paciente.

**Prioridad:** baja (ahora estamos usando <10 MB de 500 MB). Hacer cuando haya más nutricionistas registrados.

### 15. Rediseñar visualización de objetivos de macros en dietas

La fila de objetivos (calorías, proteínas, carbos, grasas) que aparece debajo de los tabs Resumen/Plan/Análisis usa los mismos badges de colores que la sección "Media diaria de la semana" del resumen. Queda repetitivo y visualmente confuso al verlos juntos. Rediseñar los objetivos para que se diferencien claramente: usar barras de progreso que se vayan rellenando (actual vs objetivo), o un formato distinto que no repita la misma paleta de pastillas de colores.

### 16. Recuperar contraseña ("¿Olvidaste tu contraseña?")

No existe ningún flujo de recuperación de contraseña. Si un nutricionista olvida su contraseña, no puede entrar. Implementar el flujo completo:

**Componentes necesarios:**

1. **Enlace en login** — Añadir enlace "¿Olvidaste tu contraseña?" debajo del campo de contraseña en `src/app/(auth)/login/page.tsx`, apuntando a `/recuperar-contrasena`.

2. **Página `/recuperar-contrasena`** — Formulario con campo de email. Al enviar:
   - Llamar a `supabase.auth.resetPasswordForEmail(email, { redirectTo: '${origin}/auth/callback?next=/nueva-contrasena' })`.
   - Mostrar mensaje de confirmación ("Si existe una cuenta con ese email, recibirás un enlace para restablecer tu contraseña"). No revelar si el email existe o no (seguridad).
   - Ruta: `src/app/(auth)/recuperar-contrasena/page.tsx`.

3. **Página `/nueva-contrasena`** — Formulario con dos campos (nueva contraseña + confirmar). Al enviar:
   - Llamar a `supabase.auth.updateUser({ password: nuevaContrasena })`.
   - El token de reset viene en la URL como fragment (Supabase lo inyecta), y el callback de `/auth/callback` ya establece la sesión.
   - Validar: mínimo 6 caracteres, ambos campos coinciden.
   - Ruta: `src/app/(auth)/nueva-contrasena/page.tsx`.

4. **Callback** — Verificar que `src/app/auth/callback/route.ts` maneja correctamente el flujo de reset (el `code` de Supabase se intercambia por sesión, luego redirige a `/nueva-contrasena`).

5. **Traducciones** — Añadir claves en `messages/es.json`, `messages/en.json` y `messages/pt.json` bajo `auth.recovery.*`: título, descripción, placeholder, botones, mensajes de éxito/error, validaciones.

6. **Email de Supabase** — Verificar/personalizar el template de email de reset en el dashboard de Supabase (Authentication → Email Templates → Reset Password). Idealmente con branding Annonia.

**Notas:**
- El flujo es solo para nutricionistas (Supabase Auth). Los pacientes usan PIN + email, no tienen contraseña.
- Supabase gestiona el envío del email y la generación del token — no hay que implementar nada server-side para eso.
- Seguir el mismo estilo visual que login y registro (panel izquierdo decorativo en desktop, formulario a la derecha).
