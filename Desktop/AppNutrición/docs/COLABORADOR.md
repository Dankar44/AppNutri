# Guía del colaborador

Bienvenido. Este documento explica **cómo montar el entorno**, **cómo trabajar** y **qué tareas
coger**. La guía técnica del proyecto (arquitectura, convenciones y errores típicos) está en
[`AGENTS.md`](../AGENTS.md) — si programas con un agente (Codex, Claude Code…), asegúrate de que
lo lea antes de empezar.

---

## 0. Lo primero: nunca vas a tocar datos reales

La base de datos de producción tiene **datos de nutricionistas y de sus pacientes**. No vas a
tener acceso a ella, y no lo necesitas: **te montas tu propia base de datos vacía** y trabajas
ahí. Es gratis y se hace en 10 minutos.

Tampoco despliegas tú: **el dueño del repo revisa tu PR y despliega**.

---

## 1. Requisitos

- **Node 22 o superior** (el proyecto tiene `.nvmrc`; con `nvm` basta `nvm use`).
- Una cuenta gratuita en [supabase.com](https://supabase.com).
- Git y una cuenta de GitHub.

---

## 2. Clonar el proyecto

Haz un **fork** del repositorio en GitHub y clónalo. Aviso importante:

> ⚠️ El código **no está en la raíz** del repositorio, sino en la carpeta
> **`Desktop/AppNutrición/`** (con tilde). Todos los comandos se ejecutan desde ahí.

```bash
git clone https://github.com/<tu-usuario>/AppNutri.git
cd AppNutri/Desktop/AppNutrición
nvm use          # Node 22
npm install
```

---

## 3. Tu propia base de datos (Supabase)

1. En [supabase.com](https://supabase.com) crea un **proyecto nuevo** (plan gratuito). Apunta la
   contraseña de la base de datos que te pida.
2. En el proyecto, ve a **Project Settings → API** y copia:
   - **Project URL**
   - **anon public key**
   - **service_role key** (es secreta: no la compartas ni la subas al repo)
3. Ve a **Project Settings → Database → Connection string → URI** y copia la cadena, cambiando
   `[YOUR-PASSWORD]` por tu contraseña.

---

## 4. Variables de entorno

Copia la plantilla y rellénala:

```bash
cp .env.example .env.local
```

**Obligatorias** (sin esto la app no arranca):

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL de tu Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SECRET_KEY` | service_role key |
| `DATABASE_URL` | cadena de conexión de tu Supabase |
| `PATIENT_JWT_SECRET` | invéntala: `openssl rand -hex 32` |
| `ENCRYPTION_KEY` | invéntala: `openssl rand -hex 32` |

**Opcionales** (déjalas vacías salvo que tu tarea las necesite):

- `GROQ_API_KEY_1/2` — solo para la generación de dietas con IA. Groq tiene plan gratuito.
- `RESEND_API_KEY` — solo para enviar emails de verdad.
- `STRIPE_*`, `GOOGLE_*` — pagos y Google Calendar. Para tareas de interfaz no hacen falta.
- `ADMIN_EMAILS` / `ADMIN_PASSWORD` — solo si necesitas el panel de administración.

`.env.local` está en el `.gitignore`: **nunca** lo subas.

---

## 5. Crear las tablas y meter datos de ejemplo

```bash
npx prisma db push       # crea todas las tablas en TU base de datos
npx prisma generate      # genera el cliente Prisma (requiere Node 22)
```

Para tener alimentos y recetas con los que trabajar (los datos están en el repo):

```bash
npx tsx scripts/seed-alimentos-completo.ts
npx tsx scripts/seed-recetas-app.ts
```

> Estos seeds leen `DATABASE_URL` de tu `.env.local`, así que van **a tu base de datos**.
> Si alguno falla, coméntalo en el issue en lugar de improvisar: puede necesitar un ajuste.
> **Nunca ejecutes nada de `scripts/` apuntando a una base de datos que no sea la tuya.**

---

## 6. Arrancar

```bash
npm run dev      # http://localhost:3000
```

Crea tu cuenta de nutricionista en `http://localhost:3000/registro`. Como el envío de correo no
está configurado, para poder entrar marca tu usuario como verificado desde el SQL Editor de
Supabase:

```sql
update auth.users set email_confirmed_at = now() where email = 'tu@correo.com';
```

Después crea un paciente de prueba y un plan, que es donde vive casi todo.

---

## 7. Flujo de trabajo

### El ciclo completo, de principio a fin

1. **Eliges un issue** de los etiquetados `apta-colaborador` (ver apartado 9) y **te lo asignas**
   (botón *Assignees* → tú) y lo comentas: "me pongo con esto". Así nadie trabaja en lo mismo.
2. **Lo lees entero.** Cada issue trae el diagnóstico ya hecho: qué pasa hoy, en qué archivos y
   líneas está, y las tareas concretas. Si algo no cuadra con el código que ves, **coméntalo en
   el issue antes de programar**: puede que el diagnóstico se haya quedado viejo.
3. **Rama nueva** desde `main` actualizado, con el número del issue en el nombre.
4. **Programas y pruebas** en tu entorno local.
5. **Abres el PR.** Se rellena sola una plantilla con las preguntas necesarias: qué hace, dónde
   se ve, cómo probarlo, si toca la base de datos y si necesita variables nuevas. **Rellénala de
   verdad**: es lo que se usa para revisar y para verificar el cambio después de publicarlo.
6. Escribe **`Closes #NN`** en la descripción (con el número del issue). Al hacer merge, el issue
   se cierra solo y queda enlazado.
7. **Revisión.** Puede que se te pidan cambios: haces commit en la misma rama y el PR se
   actualiza solo. No abras un PR nuevo.
8. **Merge y despliegue.** Los hace el dueño del repo. Cuando esté en producción te lo dirá, por
   si quieres comprobarlo en la web real.
9. Vuelves al paso 1 con el siguiente issue.

> **Un issue = una rama = un PR.** Si mientras trabajas ves otra cosa que arreglar, **no la metas
> en el mismo PR**: coméntala en el issue o abre uno nuevo. Los PRs pequeños se revisan y entran
> en el día; los grandes se atascan una semana.

### Los comandos

```bash
git checkout main
git pull upstream main            # trae los últimos cambios antes de empezar
git checkout -b fix/125-ingredientes-cortados
# … programas …
npx tsc --noEmit                 # OBLIGATORIO: tiene que estar en verde
# … pruebas en el navegador …
git commit -am "Recetas: los nombres largos de ingrediente ya no se cortan"
git push origin fix/125-ingredientes-cortados
```

Y abres el **PR** hacia `main` del repositorio original.

**Normas:**
1. **Una tarea = una rama = un PR.** PRs pequeños se revisan y entran rápido; los grandes se
   atascan.
2. En el PR: **qué has hecho**, **en qué pantallas se ve**, **qué has dejado fuera** y una
   **captura** si el cambio es visual.
3. Enlaza el issue escribiendo `closes #NN` en la descripción: se cerrará solo al hacer merge.
4. **No hagas push a `main`** ni despliegues: `main` es lo que va a producción.
5. Si una tarea necesita **cambiar la base de datos** (`prisma/schema.prisma`), **párate y
   coméntalo en el issue**. Esa parte la hace el dueño del repo; tú sigues con el resto.

---

## 8. Zonas "calientes": no las toques sin avisar

Hay trabajo en curso en el editor de dietas. Si tocas estos archivos, habrá conflictos:

- `src/components/dieta/plan-editor.tsx`
- `src/components/dieta/comida-slot.tsx`
- `src/components/paciente/plan-visual.tsx`
- `src/components/paciente/planificacion-por-defecto-tab.tsx`
- `src/app/actions/planificaciones.ts`
- `src/messages/es|pt/diets.json` y `patients.json` (se tocan a menudo)

Las tareas asignadas a colaboradores están **fuera** de esa zona a propósito.

---

## 9. Tus tareas

Filtra los issues por la etiqueta **`apta-colaborador`**: son las que **no tocan la base de
datos** ni pisan el trabajo en curso. Ahora mismo:

| Issue | Tarea | Buena para |
|---|---|---|
| **#112** | Los ingredientes de las recetas se cortan (CSS) | Empezar: es CSS, en 3 archivos, y el resultado se ve al momento |
| **#114** | Al abrir un plan desde un paciente, el menú lateral salta a "Dietas" | Cambio de una sola función |
| **#4** | Mejorar el formato del PDF (incluida la orientación horizontal) | CSS del PDF, aislado |
| **#130** | Hacer visibles funciones que ya existen (enlaces y textos) | Varias mejoras pequeñas e independientes |
| **#44** | Descargar recetas en PDF (recetario) | La más grande y golosa: generador nuevo, sin tocar el esquema |

Cada issue trae el diagnóstico ya hecho: estado actual verificado en el código, archivos y líneas
implicadas, y las tareas concretas. Empieza por **#112**, que sirve para rodar el proceso de PR.

---

## 10. Cosas que te van a pasar (atajos)

- **"He cambiado algo y no se aplica."** Caché de Turbopack, no es tu código:
  `pkill -f "next dev"` + `rm -rf .next` + `npm run dev`, y recarga forzada
  (Cmd/Ctrl+Shift+R). Pasa sobre todo al editar archivos de `src/lib/` o los JSON de textos.
- **"Veo la clave del texto en vez del texto"** (`diets.algo.otro`): falta la clave en
  `src/messages/es/*.json` o `pt/*.json`, o es la caché de arriba.
- **`prisma generate` falla** con `ERR_REQUIRE_ESM`: estás en Node 20, cambia a Node 22.
- **Error de tipo `Value 'X' not found in enum`**: alguien cambió el esquema; haz
  `npx prisma generate`.
- **La generación con IA no funciona**: necesita `GROQ_API_KEY_1`. No hace falta para las tareas
  de interfaz.
