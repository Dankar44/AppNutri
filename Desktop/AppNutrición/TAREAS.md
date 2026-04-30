# Tareas — AppNutri (Annonia)

Registro consolidado de tareas pendientes. Actualizado el 30 de abril de 2026.

---

## Tareas pendientes

### 2. Revisar y actualizar las guías interactivas

Las guías/tours paso a paso (`src/lib/tour-data.ts`) que señalan elementos de la UI necesitan revisión completa:

- Verificar que cada tour funciona correctamente y los selectores (`data-tour`) apuntan a elementos que existen.
- Actualizar pasos que referencien UI obsoleta o reorganizada.
- Añadir tours nuevos para secciones que no existían: **recetas**, **pagos**, **seguimiento diario** (lado dietista) y **mensajes**.

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

### 10. Colores personalizables en entregables

Los entregables (PDF del plan de alimentación) usan siempre los mismos colores (verde, rojo). El nutricionista debería poder **elegir la paleta de colores** de sus entregables: colores de cabeceras, bordes de tabla, badges de comidas, etc. Permitir al menos 4-5 opciones de tema o un selector de color primario/secundario.

### 11. Logo y nombre del nutricionista en entregables

Permitir al nutricionista **subir su logo** (imagen) para que aparezca como encabezado en los entregables y, si quiere, en las páginas de la app. Posición configurable: arriba a la derecha o arriba a la izquierda. También opción de mostrar su **nombre/nombre de la consulta** como cabecera personalizada. Esto hace que los entregables sean más profesionales y con marca propia.

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

### 17. Sign in with Google (Supabase)

Permitir iniciar sesión y registrarse con Google. Independiente de la integración de Google Calendar (que ya funciona).

**Configuración manual en Supabase (pendiente):**
1. Supabase dashboard → Authentication → Providers → Google → activar
2. Pegar Client ID y Client Secret (mismos que Calendar)
3. Copiar la Callback URL que da Supabase y añadirla como redirect URI en Google Cloud Console

**Cambios de código necesarios:**
- Manejar el caso de alguien que entra con Google pero no tiene cuenta de dietista (mostrar mensaje, no estado roto)
- Opción de vincular cuenta de Google desde Ajustes (para usuarios que se registraron con email/contraseña)
- Que al crear cuenta con Google se siga el flujo de registro (datos + colegiado)

### 16. PREGUNTA PARA CLAUDIA — Ingredientes de "café con leche"

Duda pendiente de consultar con Claudia: cuando se pone "café con leche semidesnatada" como alimento, en los ingredientes del entregable no aparece "café" como ingrediente (o no como primer ingrediente). Parece que el desglose de ingredientes no refleja bien la composición del alimento compuesto. Preguntar a Claudia exactamente qué problema ve y qué esperaría que apareciera.