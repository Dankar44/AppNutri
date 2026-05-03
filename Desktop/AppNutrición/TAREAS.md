# Tareas — AppNutri (Annonia)

Registro consolidado de tareas pendientes. Actualizado el 3 de mayo de 2026.

---

## Tareas pendientes

### 5. Micronutrientes — funcionalidades pendientes

La fase 1 (micronutrientes opcionales), parte de la fase 2 (Open Food Facts + equivalentes), y la edición de micros en el formulario de alimentos ya están hechas. Queda:

- **Escaneo de código de barras** — UI con cámara para escanear EAN y buscar en Open Food Facts.
- **Estimación por IA** — Pasar nombre del alimento a un LLM para estimar los 24 micronutrientes cuando no haya datos. Marcar como "estimado por IA".
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

### 18. Probar todas las opciones de Google en producción

Una vez las inscripciones estén abiertas, probar todos los flujos de Google de principio a fin:

- **Nutri — Google Calendar:** conectar, sincronizar cita, desconectar con "dejar", desconectar con "borrar", toggle sincronización on/off.
- **Nutri — Vincular cuenta Google:** vincular desde Ajustes, cerrar sesión, volver a entrar con "Continuar con Google".
- **Nutri — Sign in con Google:** registrarse directamente con Google → verificar que si no tiene cuenta de dietista muestra mensaje claro (no estado roto) y que si crea cuenta sigue el flujo de registro (datos + colegiado).
- **Paciente — Google Calendar:** conectar, ver cita sincronizada, desconectar.
- **Cancelar flujo OAuth:** empezar a conectar y cancelar a medias → debe volver sin error roto.
- **Verificar en móvil** (Safari iOS, Chrome Android).

### 19. Preferencias del portal del paciente — PREGUNTAR A DANIEL

Los toggles de "Preferencias de la aplicación del cliente" en la pestaña de entregables (acceso móvil, mensajes, registro de peso, confirmación de consultas, diario alimentario, información nutricional) son puramente visuales: no se persisten ni afectan a nada. Preguntar a Daniel: **¿merece la pena darle funcionalidad real a estos toggles (que controlen qué ve el paciente en su portal) o los quitamos directamente?**

Si se mantienen, habría que:
- Persistir las preferencias en BD (campo JSON por paciente).
- Que cada toggle oculte/muestre la sección correspondiente en el portal del paciente.
- "Acceso a la app móvil" no aplica (el portal ya es responsive) → marcar como "Próximamente" o eliminar.

### 21. Comprobar guías interactivas en modo móvil

Las guías interactivas (#2) ya están revisadas y funcionan en desktop. Falta **probarlas en dispositivos móviles reales** (o DevTools → device toolbar):

- Verificar que el tooltip no desborda en iPhone SE (375px), iPhone 15 (393px) y Android típicos.
- Verificar que los botones tienen suficiente área táctil (min 44px).
- Comprobar que las posiciones "left"/"right" se convierten a "bottom" en pantallas ≤ 480px.
- Verificar el welcome modal en pantallas pequeñas (márgenes, padding, scroll).
- Probar en landscape: tooltip con scroll si el contenido es alto.
- Verificar resize/rotación: tooltip se reposiciona correctamente.

### 16. PREGUNTA PARA CLAUDIA — Ingredientes de "café con leche"

Duda pendiente de consultar con Claudia: cuando se pone "café con leche semidesnatada" como alimento, en los ingredientes del entregable no aparece "café" como ingrediente (o no como primer ingrediente). Parece que el desglose de ingredientes no refleja bien la composición del alimento compuesto. Preguntar a Claudia exactamente qué problema ve y qué esperaría que apareciera.

