# Propuestas — Annonia

Registro de propuestas y sugerencias de usuarios/clientes. Actualizado el 20 de mayo de 2026.

---

## Propuestas pendientes

### 1. Auto-registro de peso y mediciones por parte del paciente

**Origen:** Martín (nutricionista beta tester) — 20 mayo 2026

**Idea:** Que los pacientes puedan registrar ellos mismos su peso y mediciones corporales desde el portal del paciente, sin necesidad de que la nutricionista lo haga en cada consulta. Incluir un enlace directo en el PDF del plan alimenticio para que el paciente acceda fácilmente.

**Estado actual:**
- El portal del paciente ya existe con auth por PIN+email
- Los pacientes ya ven su evolución (gráficas de peso, IMC, grasa corporal, perímetros)
- Los pacientes ya hacen seguimiento diario (comidas, agua, ejercicio)
- Lo que falta: formulario para que el paciente registre sus propias mediciones

**Qué habría que hacer:**
1. Crear un formulario simplificado en `/paciente/portal/evolucion` (o nueva sección) con campos básicos: peso, perímetro abdominal, y opcionalmente grasa corporal
2. Nuevo server action `crearMedidaPaciente()` (actualmente solo la nutricionista puede crear mediciones via `crearMedida()`)
3. Distinguir visualmente en la ficha del paciente las mediciones auto-registradas vs las de consulta (ej: badge "registrado por paciente")
4. Opcionalmente: enlace directo en el PDF del plan alimenticio que lleve al portal de seguimiento
5. Notificación a la nutricionista cuando el paciente registre una nueva medición

**Valor:** Alto — reduce trabajo manual de la nutricionista y aumenta frecuencia de datos de seguimiento entre consultas.

**Complejidad:** Media-baja — la infraestructura del portal ya está completa, solo falta la pieza de input.

---

### 2. Enlaces directos a acciones desde WhatsApp (deep links)

**Origen:** Nutriconday (clínica interesada) — 20 mayo 2026

**Idea:** Generar enlaces directos a acciones concretas de la app (registrar mediciones, consulta online, etc.) que la nutricionista pueda compartir con el paciente por WhatsApp. La nutricionista prefiere WhatsApp al chat integrado porque el paciente lo tiene más a mano.

**Contexto:** La nutricionista indica que no usaría el chat de la app — prefiere WhatsApp para dar un servicio más cercano. Propone que en vez de depender del chat interno, se faciliten links directos que pueda pegar en WhatsApp (incluso como respuestas rápidas con "/").

**Qué implicaría:**
1. Crear rutas públicas o del portal del paciente que lleven directamente a acciones específicas (ej: `/paciente/portal/mediciones/nueva`)
2. Sección en la ficha del paciente para copiar estos enlaces rápidamente
3. Valorar si el chat integrado tiene sentido como feature principal o si es secundario frente a WhatsApp

**Valor:** Medio — reduce fricción para nutricionistas que ya usan WhatsApp como canal principal.

**Señal importante:** El chat integrado puede no ser prioritario para muchos usuarios si prefieren WhatsApp.
