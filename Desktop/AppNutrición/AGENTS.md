# AGENTS.md — Guía para agentes de código (Codex, Claude Code, etc.)

Annonia es un SaaS para nutricionistas: gestión de pacientes, planes de alimentación,
agenda y entregables en PDF. Tiene **dos portales** (panel del nutricionista y portal del
paciente) con sistemas de autenticación separados.

> **Documentos que acompañan a este:**
> - `docs/COLABORADOR.md` — montar el entorno y flujo de ramas/PRs (empieza por ahí).
> - `docs/DESARROLLO.md` — **léelo entero antes de la primera tarea.** Entornos y base de datos,
>   cómo se despliega, migraciones (y por qué el orden importa), el catálogo de errores que ya
>   han tumbado la aplicación en producción, y las cuatro preguntas que hay que hacerse antes de
>   dar un cambio por terminado.
>
> Si eres un **colaborador externo**, respeta al pie de la letra la sección "Reglas del
> colaborador" de aquí abajo.

---

## Reglas del colaborador (LEER ANTES DE TOCAR NADA)

1. **NO modificar `prisma/schema.prisma`.** Ninguna tarea asignada a un colaborador lo necesita.
   Si crees que hace falta un campo nuevo, **párate y coméntalo en el issue**: la migración la
   hace el dueño del repo.
2. **NO ejecutar nada de `scripts/`.** Son migraciones y semillas que escriben en masa;
   algunas borran datos. Ahora exigen indicar la base (`DB=dev` o `DB=prod`) y avisan por
   pantalla, pero la regla para un colaborador es simple: no los ejecutes. Si crees que tu tarea
   lo necesita, dilo en el issue. Y **nunca** toques nada de `scripts/archivo/` (ver el apartado
   1.5 de `docs/DESARROLLO.md`).
3. **NO desplegar.** El despliegue lo hace siempre el dueño del repo. No existe pipeline
   automático: lo que entra en `main` es lo que acaba en producción.
4. **NO tocar `.env.local` ni pedir credenciales de producción.** La configuración se entrega
   ya hecha. **No pegues su contenido en un issue, en un PR ni en un commit**: el repositorio es
   público.
5. **NO ejecutar `prisma db push` ni ningún cambio de esquema.** La base de datos de desarrollo
   es **compartida** entre las personas que trabajan en el proyecto: un cambio de esquema se lo
   aplicas a todo el mundo a la vez.
6. **NO hacer commit, push ni merge sobre `main`**, y nunca un push forzado. Siempre en tu rama.
7. **Una tarea = una rama = un PR pequeño.** No mezcles tareas en el mismo PR.
8. Antes de abrir el PR: **`npx tsc --noEmit` en verde** y probado a mano en el navegador.
9. **NO tocar sin avisar las "zonas calientes"** (hay trabajo en curso y provocan conflictos):
   `src/components/dieta/plan-editor.tsx`, `src/components/dieta/comida-slot.tsx`,
   `src/components/paciente/plan-visual.tsx`,
   `src/components/paciente/planificacion-por-defecto-tab.tsx`,
   `src/app/actions/planificaciones.ts`, y `src/messages/es|pt/diets.json` y `patients.json`.

**El código está en `Desktop/AppNutrición/`** (con tilde), no en la raíz del repositorio. Todos
los comandos se ejecutan desde ahí.

**En desarrollo no funciona** (y no es un fallo que haya que arreglar): el registro desde
`/registro` y todo lo que envíe correo (no hay servicio configurado), la generación con IA (falta
`GROQ_API_KEY_1`) y el panel `/admin` (falta la clave de Stripe; `/pagos` y `/ajustes` sí van).
La aplicación crea sola un "Paciente Prueba" para cada nutricionista: no es un dato real ni un
bug. Para saber contra qué base estás: `curl -s localhost:3000/api/health`.

---

## Comandos

```bash
npm run dev          # servidor de desarrollo (Turbopack) en localhost:3000
npx tsc --noEmit     # comprobación de tipos: OBLIGATORIO antes de cada PR (no hay tests)
npx prisma generate  # regenerar el cliente Prisma (requiere Node 22+)
npx prisma studio    # explorador visual de la base de datos
```

**Node 22 o superior** (`.nvmrc`). Con Node 20 `prisma generate` falla con `ERR_REQUIRE_ESM`.

No hay tests automáticos. La verificación es: `tsc --noEmit` + probar el flujo en el navegador.

---

## Arquitectura

- **Next.js 16** (App Router) + **React 19** + **TypeScript strict**
- **Prisma 7.5** con `@prisma/adapter-pg` → **PostgreSQL (Supabase)**
- **Tailwind CSS 4**, sin librería de componentes: toda la interfaz está hecha a mano
- **next-intl** para español y portugués
- **Groq** (vía SDK de OpenAI) para generar dietas con IA
- **Stripe** (pagos), **Resend** (emails), **Google Calendar** (citas)
- **PDFs**: HTML+CSS propio renderizado con **puppeteer-core** en el servidor (`/api/pdf`)

### Dos sistemas de autenticación
1. **Nutricionista** → Supabase Auth. `getCurrentDietista()` en `src/app/actions/auth.ts`.
   Todas las rutas de `(dashboard)` lo comprueban.
2. **Paciente** → JWT propio (`jose`) en cookie httpOnly. `getCurrentPaciente()` en
   `src/lib/patient-auth.ts`. Todas las rutas de `/paciente/portal/*` lo comprueban.

### Grupos de rutas
- `(auth)/` — login, registro, verificación
- `(dashboard)/` — panel del nutricionista (pacientes, dietas, agenda, alimentos, recetas,
  informes, ajustes, pagos, mensajes)
- `(admin)/` — panel de administración (protegido por `ADMIN_EMAILS`)
- `paciente/` — portal del paciente
- `compartido/[token]/` — enlaces públicos de planes y listas de la compra
- `landing/`, `precios/`, `legal/` — páginas públicas

### Modelo de datos
`Dietista` → `Paciente` → `PlanAlimenticio` → `DiaDelPlan` → `ComidaDelDia` →
`AlimentoEnComida` (apunta a `Alimento` o a `Receta`).

El esquema está en español con `@@map()` para los nombres de tabla. El cliente Prisma se genera
en `src/generated/prisma/` (ignorado por git); se importa desde `@/generated/prisma/client` y el
singleton está en `src/lib/prisma.ts`.

### Server actions
Todas las mutaciones van por server actions en `src/app/actions/`. Cada una:
1. Autentica con `getCurrentDietista()` (o `getCurrentPaciente()`).
2. Valida la entrada con las utilidades de `src/lib/validation.ts`.
3. Lee/escribe con Prisma.
4. Llama a `revalidatePath()` si hace falta.

---

## Convenciones

- **Todo el texto visible, los nombres de variables y los comentarios van en español.**
- Cualquier texto de interfaz va en `src/messages/es/*.json` **y** `src/messages/pt/*.json`.
  Si añades una clave solo en `es`, en portugués se verá la clave cruda.
- `escapeHtml()` obligatorio en cualquier dato de usuario que se inyecte en HTML (PDFs, emails).
- Avisos con `sonner`: `toast.success()` / `toast.error()`.
- Iconos de `lucide-react`. Clases condicionales con `cn()` de `src/lib/utils.ts`.
- Las server actions devuelven `{ ok: boolean; error?: string }`.

### Manejo de errores en server actions
- En los `catch`: usar **`isNextNavigation(error)`** de `@/lib/utils`. **Nunca** el patrón viejo
  `"digest" in error` — en Next.js 16 se traga los errores reales.
- Errores de validación: **devolver `{ error: string }`**, no `throw`. Un throw provoca la
  pantalla roja de error en producción.
- **Nunca** pasar funciones ni componentes como props de un server component a un
  `"use client"`: usar claves de texto y resolverlas en el cliente.

### Guardados: interfaz optimista
Norma del proyecto: al guardar, **reflejar el cambio en la interfaz al instante**, lanzar la
mutación por detrás y, si falla, **revertir al estado anterior con un `toast.error`**. Guarda el
valor previo antes de mutar para poder deshacer.

### Inputs de cantidad
Usa **siempre** `CantidadInput` (`src/components/cantidad-input.tsx`), nunca un
`<input type="number">` crudo. Motivos ya resueltos ahí: se puede vaciar el campo mientras
escribes, el separador decimal es **siempre el punto**, no acepta letras, y las recetas y
unidades caseras (ud/loncha/lata) van en **pasos de 0,5** (`redondearA={0.5}`, se decide con
`esUnidadDiscreta(unidad)` de `@/lib/units` o el flag `esReceta`).

### Recetas: "1 ración = 1 persona"
- `Receta.porciones` = para cuántas personas están escritos los ingredientes.
- `Receta.calorias/proteinas/…` = **por ración**.
- `AlimentoEnComida.cantidad` con `recetaId` = **raciones servidas** (se guarda con
  `unidad = GRAMOS` por defecto del esquema → **formatéalo con `esReceta`, nunca con
  `formatQuantity`**, o saldrá "1 g" donde debería decir "1 ración").
- El escalado vive en `src/lib/receta-porciones.ts`. Si la receta rinde 1, los ingredientes se
  escalan a lo que come el paciente; si rinde más (una tanda: bizcocho, salsa de tarro), se
  muestran **enteros** con la nota "salen N raciones".
- Al presentarlo: "1 ración" **no se escribe** (es el caso por defecto); solo se escribe cuando
  no es 1 ("· 2 raciones", "· media ración"). La palabra es **ración**, no *porción*.

---

## Errores que ya nos han mordido (catálogo)

Repasa esta lista antes de dar una tarea por terminada.

1. **Fallos silenciosos.** Es el patrón más repetido: una acción falla y nadie se entera porque
   no hay `catch` ni aviso. Si llamas a una server action, **maneja el error y avisa al usuario**.
   Nunca dejes una promesa sin `await` ni `.catch()`.
2. **Caché obsoleta de Turbopack.** Si un cambio "no se aplica" (sobre todo en `src/lib/*.ts` o
   en los JSON de traducciones), no busques el bug: `pkill -f "next dev"` + `rm -rf .next` +
   `npm run dev`, y recarga forzada en el navegador (Cmd/Ctrl+Shift+R). Síntoma típico de los
   JSON: las claves nuevas se ven crudas (`MISSING_MESSAGE`) mientras las viejas van bien.
3. **Acceso a datos que pueden venir incompletos.** Los planes y plantillas guardan JSON; usa
   optional chaining (`?.`) al recorrer estructuras anidadas.
4. **Textos que no existen en `pt`.** Añade siempre la clave en los dos idiomas.
5. **Enums crudos en la interfaz.** Nunca renderices la clave (`PERDER_PESO`,
   `grasa_corporal`): pásala por un map a etiqueta traducida.
6. **Truncado responsive que esconde datos clave.** Prueba las vistas en pantallas estrechas;
   si algo "se ve en mi pantalla pero no en la del cliente", sospecha `truncate`/`hidden`/`sm:`
   antes que un bug de datos.
7. **Guardar con debounce mientras se teclea, si eso dispara cálculos derivados.** Ya provocó
   corrupción de datos: al teclear "150" se guardaba también el "1" intermedio y arrastraba los
   valores dependientes. Si un input recalcula OTROS datos, guarda **al confirmar** (blur/Enter),
   no en cada pulsación.
8. **Identificadores temporales de interfaz optimista.** Si pintas un elemento antes de que el
   servidor confirme, **sustituye el id temporal por el real** en cuanto llegue; si no, las
   ediciones posteriores intentan guardar contra algo que no existe.
9. **Comparar `dietistas."authId"` (text) con `auth.users.id` (uuid) en SQL crudo.** Falla con
   `operator does not exist: text = uuid`. Hay que castear: `d."authId" = u.id::text`.
10. **Cambios de enum en `schema.prisma`.** Rompen los entornos cuyo cliente Prisma no se ha
    regenerado (`Value 'X' not found in enum`). Tras un pull que toque el esquema:
    `npx prisma generate`.

---

## Pensar como el nutricionista que usa la app

Una funcionalidad técnicamente correcta pero que el usuario no encuentra **no existe** para él.
Esto nos ha pasado seis veces con nutricionistas reales pidiendo cosas que ya estaban hechas.

- **Visibilidad.** Pon el acceso o la pista donde el usuario ya está mirando: un enlace a donde
  se configura algo, una línea explicando de dónde sale un número, un estado visible cuando algo
  está activo. "Yo sé dónde está" no basta.
- **Implicaciones entre pantallas.** Antes de cerrar un cambio, pregúntate *"si esto se
  configura aquí, ¿en qué otros sitios tiene que aparecer?"* — y compruébalo en el código. El
  mismo dato suele vivir en varios lugares:
  - `(dashboard)/dietas/[id]` — editor de dietas
  - `pacientes/[id]?pestana=plan-alimentacion` — **`crearPlan` redirige aquí**, así que es donde
    el nutricionista edita justo después de crear una dieta. Si falta aquí, parece roto.
  - `paciente/portal/*` — portal del paciente (decide si debe verlo; normalmente no)
  - `compartido/[token]` — enlace público
  - `src/lib/pdf/*` + `entregables-tab.tsx` — entregables en PDF
  - `dietas/plantillas/[id]` — plantillas (no tienen paciente: que no rompa)
  - generación con IA (`dietas/[id]/generar-ia`)
- La lógica compartida va en `src/lib/` (mira `reparto-comidas.ts`, `comida-horas.ts`) para que
  dos pantallas no puedan divergir.
- **En móvil**, cada sección se ve como su propia tarjeta (`rounded-2xl border border-border
  bg-card`), pero **sin una tarjeta exterior que las envuelva todas** (solo con prefijo `lg:`).
- **Sin invenciones.** No añadas funcionalidades ni rediseñes lo que no se ha pedido. Mejoras
  pequeñas de usabilidad ligadas al código que tocas: bien. Algo más grande: proponlo en el issue.

---

## Al terminar una tarea, en el PR

Explica **qué has hecho**, **en qué pantallas se ve**, **qué has dejado fuera a propósito** y si
algo más necesita tocarse para que el cambio tenga sentido. Nunca dejes algo a medio conectar en
silencio. Adjunta captura si el cambio es visual.
