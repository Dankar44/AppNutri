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

Si tienes acceso de colaborador, **clona el repositorio directamente** y trabaja en ramas dentro
de él (no necesitas fork). Si no lo tienes, haz un *fork* y clónalo. Aviso importante:

> ⚠️ El código **no está en la raíz** del repositorio, sino en la carpeta
> **`Desktop/AppNutrición/`** (con tilde). Todos los comandos se ejecutan desde ahí.

```bash
git clone https://github.com/<tu-usuario>/AppNutri.git
cd AppNutri/Desktop/AppNutrición
nvm use          # Node 22
npm install
```

---

## 3. Tu configuración: te la damos hecha

**No tienes que crear ninguna base de datos.** Ya existe un entorno de desarrollo compartido
(proyecto `Annonia-dev` en Supabase) con el catálogo completo cargado —2.662 alimentos con sus
micronutrientes y medidas caseras, y 315 recetas con ingredientes e instrucciones— y **cero datos
reales de pacientes**.

Pide el fichero **`.env.local` ya rellenado** y colócalo en `Desktop/AppNutrición/`. Es lo único
que necesitas.

> ⚠️ No cambies la `DATABASE_URL` de ese fichero por otra, y no uses nunca credenciales de
> producción. Con esa configuración, todo lo que ejecutes escribe en la base de desarrollo, que es
> exactamente lo que queremos.

## 4. Arrancar

```bash
npx prisma generate     # genera el cliente de base de datos (necesita Node 22)
npm run dev             # http://localhost:3000
```

Entra con el usuario de pruebas que ya está creado:

- **Correo:** `dev@annonia.dev`
- **Contraseña:** `desarrollo1234`

> El registro desde `/registro` **no funciona en desarrollo**: la aplicación crea la cuenta,
> intenta enviar el correo de verificación, falla porque no hay servicio de correo configurado y
> **deshace la cuenta que acababa de crear**. No es un fallo tuyo. Usa el usuario de arriba.

El entorno arranca **sin pacientes**: créate uno desde la aplicación y móntale un plan de comidas.
Es la mejor forma de entender qué hace la herramienta antes de tocar código.

## 5. Comprueba que estás en desarrollo (30 segundos)

Antes de cualquier prueba, confírmalo mirando la propia aplicación:

- En **Pacientes** debe haber **0** (o solo los que hayas creado tú).
- El único nutricionista es *Dev Pruebas*.

Si ves cientos de pacientes o nutricionistas, **estás en producción: para y avisa**.

Además, cualquier comando de Prisma imprime ahora a qué base se conecta antes de hacer nada:

```
[prisma] base de datos destino: vqjwxzzxmhudsggtsaaw     ← desarrollo, correcto
[prisma] ⚠️  BASE DE DATOS DESTINO: PRODUCCIÓN …          ← ¡para!
```

## 6. Qué NO ejecutar nunca

En `scripts/` hay migraciones y semillas. **Algunas borran datos y no avisan.** El caso peor:
`seed-alimentos-completo.ts` borra el catálogo de alimentos y, ejecutado contra producción,
dejaría ~180.000 líneas de dieta apuntando al vacío en más de 2.000 planes de pacientes reales,
de forma irreversible… y terminaría diciendo «Seed completado».

Regla simple: **no ejecutes nada de `scripts/`.** Si crees que una tarea lo necesita, dilo en el
issue.

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
git pull origin main              # trae los últimos cambios antes de empezar (upstream si usas fork)
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
