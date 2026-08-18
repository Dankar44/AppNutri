# Guía del colaborador

Cómo montar el entorno, cómo trabajar y qué tareas coger. La guía técnica del proyecto
(arquitectura, convenciones y errores típicos) está en [`AGENTS.md`](../AGENTS.md) — si programas
con un agente (Codex, Claude Code…), asegúrate de que lo lea antes de empezar.

---

## 0. Lo primero: nunca vas a tocar datos reales

La base de datos de producción tiene datos de nutricionistas y de sus pacientes. **No tienes
acceso a ella y no la necesitas**: hay una base de datos de desarrollo aparte, con el catálogo
completo cargado (2.662 alimentos y 315 recetas) y cero datos reales. La configuración que se te
entrega ya apunta ahí.

Tampoco despliegas tú: **el dueño del repo revisa tu PR y despliega**.

---

## 1. Instalación (una sola vez)

**Git** — Mac: ya lo tienes (`git --version`). Windows: git-scm.com, y usa *Git Bash* como
terminal. Linux: `sudo apt install git`.

**Node 22** (obligatorio: con Node 20 falla `prisma generate`). Lo más cómodo es `nvm`:

```bash
# Mac / Linux
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
# (cierra y reabre la terminal)
nvm install 22 && nvm use 22
```

En Windows, `nvm-windows` desde github.com/coreybutler/nvm-windows/releases. Comprueba con
`node -v` que dice `v22.x`.

---

## 2. Clonar el proyecto

Si tienes acceso de colaborador, clona directamente y trabaja en ramas dentro del repo (no
necesitas fork). Si no lo tienes, haz un *fork*.

```bash
git clone https://github.com/Dankar44/AppNutri.git
cd AppNutri
```

> ⚠️ El código **no está en la raíz** del repositorio, sino en **`Desktop/AppNutrición/`** (con
> tilde). Todos los comandos se ejecutan desde ahí.

```bash
cd "Desktop/AppNutrición"
nvm use          # coge Node 22 automáticamente (hay .nvmrc)
npm install
```

---

## 3. Tu configuración: te la damos hecha

**No tienes que crear ninguna base de datos.** Pide el fichero **`.env.local` ya rellenado** y
colócalo en `Desktop/AppNutrición/`, al mismo nivel que `package.json`. Es lo único que necesitas.

Tres avisos:

- El fichero **tiene que llamarse exactamente `.env.local`**. Con cualquier otro nombre, la
  aplicación arranca sin base de datos y da errores incomprensibles.
- `.env.local` está en `.gitignore`, así que **no se te va a subir por accidente**. Aun así, no
  pegues nunca su contenido en un issue ni en un PR.
- **No cambies la `DATABASE_URL`** por otra, y no uses nunca credenciales de producción.

## 4. Arrancar

```bash
npx prisma generate     # genera el cliente de base de datos (necesita Node 22)
npm run dev             # http://localhost:3000
```

Las credenciales del usuario de pruebas **se entregan por privado**, no están en el repositorio.

> El registro desde `/registro` **no funciona en desarrollo**: la aplicación crea la cuenta,
> intenta enviar el correo de verificación, falla porque no hay servicio de correo configurado y
> **deshace la cuenta que acababa de crear**. No es un fallo tuyo. Usa el usuario de pruebas.

## 5. Comprueba que estás en desarrollo (30 segundos)

La comprobación más fiable:

```bash
curl -s localhost:3000/api/health
```

Te dice si faltan variables, si la base conecta y **cuántos nutricionistas hay**. En desarrollo
debe salir **1**. Si salen decenas o cientos, estás en producción: **para y avisa**.

En la propia aplicación: en **Pacientes** verás **un paciente, "Paciente Prueba"** — lo crea la
aplicación sola al entrar, no es un dato real. Lo que delata producción son *decenas* de
pacientes o de nutricionistas, no que haya uno.

Además, cualquier comando de Prisma imprime a qué base se conecta antes de hacer nada:

```
[prisma] base de datos destino: vqjw…              ← desarrollo, correcto
[prisma] ⚠️  BASE DE DATOS DESTINO: PRODUCCIÓN …   ← ¡para!
```

## 6. Qué NO ejecutar nunca

En `scripts/` hay migraciones y semillas. **Algunas borran datos y no avisan.** El caso peor:
`seed-alimentos-completo.ts` borra el catálogo de alimentos y, ejecutado contra producción,
dejaría ~180.000 líneas de dieta apuntando al vacío en más de 2.000 planes de pacientes reales,
de forma irreversible… y terminaría diciendo «Seed completado». Ese ya está archivado, pero la
regla es simple: **no ejecutes nada de `scripts/`.** Si crees que una tarea lo necesita, dilo en
el issue.

Tampoco ejecutes **`prisma db push`**: la base de desarrollo es compartida y se lo cambiarías a
todo el mundo.

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
7. **Pides revisión**: en el PR, *Reviewers* → `guillermop2002`.
8. **Revisión.** Puede que se te pidan cambios: haces commit en la misma rama y el PR se
   actualiza solo. No abras un PR nuevo.
9. **Merge y despliegue.** Los hace el dueño del repo. Cuando esté en producción te lo dirá, por
   si quieres comprobarlo en la web real.
10. Vuelves al paso 1 con el siguiente issue.

> **Un issue = una rama = un PR.** Si mientras trabajas ves otra cosa que arreglar, **no la metas
> en el mismo PR**: coméntala en el issue o abre uno nuevo. Los PRs pequeños se revisan y entran
> en el día; los grandes se atascan una semana.

### Los comandos

```bash
git checkout main
git pull origin main              # trae los últimos cambios antes de empezar (upstream si usas fork)
git checkout -b fix/125-ingredientes-cortados
# … programas …
npx tsc --noEmit                 # OBLIGATORIO: tiene que estar en verde
# … pruebas en el navegador …
git commit -am "Recetas: los nombres largos de ingrediente ya no se cortan"
git push origin fix/125-ingredientes-cortados
```

Y abres el **PR** hacia `main`. No hay tests automáticos en el proyecto: `tsc` y tus pruebas en
el navegador son toda la red de seguridad que existe.

**Normas:**
1. **Una tarea = una rama = un PR.**
2. En el PR: **qué has hecho**, **en qué pantallas se ve**, **qué has dejado fuera** y una
   **captura** si el cambio es visual.
3. Enlaza el issue escribiendo `closes #NN` en la descripción.
4. **No hagas push a `main`** ni despliegues: `main` es lo que va a producción.
5. Si una tarea necesita **cambiar la base de datos** (`prisma/schema.prisma`), **párate y
   coméntalo en el issue**. Esa parte la hace el dueño del repo; tú sigues con el resto.

### Si programas con un agente (Codex, Claude Code…)

Lo hace bien: leer el issue y localizar los archivos, programar el cambio, ejecutar
`npx tsc --noEmit` y corregir lo que salga, y los comandos de git (rama, commit, push).

Mejor tú, a mano: **probar en el navegador** (no puede, y es lo que de verdad detecta si el
arreglo funciona) y **rellenar la plantilla del PR** (no sabe si probaste en móvil ni qué dejaste
fuera a propósito; si se lo inventa, la plantilla deja de servir para verificar el despliegue).

El PR lo puede crear con `gh pr create` si tienes `gh` con sesión iniciada; si no, desde la web.

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
datos** ni pisan el trabajo en curso. Las recomendadas, por orden:

| Issue | Tarea | Buena para |
|---|---|---|
| **#112** | Los ingredientes de las recetas se cortan (CSS) | Empezar: es CSS, en 3 archivos, y el resultado se ve al momento |
| **#114** | Al abrir un plan desde un paciente, el menú lateral salta a "Dietas" | Cambio de una sola función |
| **#76** | Campo de notas en Mediciones | El backend ya está listo, falta el textarea |
| **#94** | PDF: opción de no incluir las notas en la tabla resumen | Acotada |
| **#95** | Mostrar la ingesta de agua también en vasos | Acotada |
| **#4** | Mejorar el formato del PDF entregable | Ojo: la orientación horizontal no es solo CSS, se fija en el servidor |
| **#130** | Hacer visibles funciones que ya existen | Varias mejoras pequeñas e independientes |
| **#44** | Descargar recetas en PDF (recetario) | La más grande y golosa: generador nuevo, sin tocar el esquema |

Cada issue trae el diagnóstico ya hecho. Empieza por **#112**, que sirve para rodar el proceso
de PR.

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
- **El panel de administración no abre** (`/admin-login`, `/admin/*`): es normal, no hay clave de
  Stripe en desarrollo y `src/lib/stripe.ts` falla al cargarse. `/pagos` y `/ajustes` sí
  funcionan. Si una tarea necesita el panel, pide una clave de prueba.
- **La generación con IA no funciona**: necesita `GROQ_API_KEY_1`. No hace falta para las tareas
  de interfaz.
- **Nada funciona y el error es incomprensible**: mira que estén las dos claves de Supabase en el
  `.env.local`. Si faltan, no carga ni la portada ni el login.
- **Todo falla de golpe después de unos días sin tocarlo**: el proyecto gratuito de Supabase se
  pausa por inactividad. Avisa y se reactiva.
