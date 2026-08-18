# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Annonia is a SaaS platform for dietitians/nutritionists to manage patients, create personalized meal plans, schedule appointments, and generate PDF deliverables. It has two portals: a **dietist dashboard** and a **patient portal** with separate auth systems.

## Entornos y base de datos — LEER ANTES DE CUALQUIER COMANDO QUE TOQUE LA BD

Hay **dos** proyectos Supabase distintos:

| Fichero | Proyecto | Qué contiene |
|---|---|---|
| `.env.local` | `kzbrugggurcjwxsmutic` | **PRODUCCIÓN.** Datos reales de cientos de nutricionistas y de sus pacientes. |
| `.env.dev.local` | `vqjwxzzxmhudsggtsaaw` | Desarrollo. Catálogo completo, sin datos de pacientes. Lo usa el colaborador externo. |

**En la máquina del mantenedor, `.env.local` es PRODUCCIÓN**, y es el fichero que cargan por
defecto `prisma.config.ts` y la mayoría de los scripts de `scripts/`. Consecuencias:

- **Scripts**: `DB=prod|dev npx tsx scripts/<x>.ts`. Solo los que empiezan por
  `import "./_guard";` lo exigen — el resto ignora `DB=` y escribe en producción sin avisar.
  **Mira siempre la primera línea del script antes de ejecutarlo.**
- **Prisma**: nunca `npx prisma db push` a secas. `prisma.config.ts` avisa del destino pero **no
  lo impide**.
- Antes de cualquier comando que escriba en producción: **dilo y espera confirmación explícita**.
- Toda migración se aplica en los **dos** entornos, y se comprueba con `npm run db:comparar`.

Las "Reglas del colaborador" de `docs/COLABORADOR.md` son para el colaborador externo, **no para
este agente**: aquí sí se despliega, se toca `main` y se ejecutan migraciones cuando el usuario lo
pide. Lo de arriba sí aplica siempre.

## Commands

```bash
# Development (requires Node 22+ — see .nvmrc)
npm run dev          # Next.js dev server with Turbopack on localhost:3000

# Type checking
npx tsc --noEmit     # Run this after changes — no test suite exists

# Database
npx prisma generate  # Regenerate Prisma client (MUST use Node 22+, fails on Node 20)
npx prisma studio    # Visual DB browser

# Migrations are manual SQL scripts in scripts/, run with:
DB=prod npx tsx scripts/<migration-name>.ts   # o DB=dev — nunca sin elegir
```

There are no automated tests. Verify changes with `npx tsc --noEmit` and manual browser testing.

## Architecture

### Stack
- **Next.js 16** (App Router) + React 19 + TypeScript strict
- **Prisma 7.5** with `@prisma/adapter-pg` (pg Pool) → PostgreSQL on Supabase
- **Supabase Auth** for dietist login (email/password + Google OAuth)
- **Custom JWT auth** (`jose`) for patient portal via PIN + email
- **Tailwind CSS 4** (no component library — all UI is hand-built)
- **Groq API** (via OpenAI SDK) for AI diet generation
- **Stripe** for subscriptions and payments
- **Google Calendar API** for appointment sync

### Prisma client output
Generated to `src/generated/prisma/` (gitignored). Import from `@/generated/prisma/client`. The singleton is in `src/lib/prisma.ts`.

Prisma 7.5 requires Node 22+ — `npx prisma generate` will fail with `ERR_REQUIRE_ESM` on Node 20.

### Two auth systems

1. **Dietist auth** — Supabase Auth. `getCurrentDietista()` in `src/app/actions/auth.ts` returns the current dietist or null. All `(dashboard)` routes check this.
2. **Patient auth** — Custom JWT in httpOnly cookie `annonia-paciente-session`. `getCurrentPaciente()` in `src/lib/patient-auth.ts`. All `/paciente/portal/*` routes check this.

### Route groups

- `(auth)/` — login, registration, pending verification
- `(dashboard)/` — dietist-facing app (patients, diets, agenda, foods, recipes, reports, settings, payments, messages)
- `(admin)/` — admin panel (protected by `ADMIN_EMAILS` env var)
- `paciente/` — patient portal (login via PIN, view diet, track weight, messages, export PDF)
- `compartido/[token]/` — public shared links for meal plans and shopping lists
- `api/` — Google OAuth callbacks, Stripe webhooks, health check, sidebar counts
- `landing/`, `precios/`, `legal/` — public marketing pages

### Server actions pattern

All mutations go through server actions in `src/app/actions/`. Each action:
1. Calls `getCurrentDietista()` to authenticate
2. Validates input with utilities from `src/lib/validation.ts`
3. Uses Prisma to read/write
4. Calls `revalidatePath()` if needed

### PDF generation

PDFs are generated two different ways, and it matters which one you are touching:

- **Headless Chrome** (`src/app/api/pdf/route.ts` + `src/lib/browser.ts`, puppeteer-core): the
  meal plan deliverable and the patient portal export. Page size and orientation are set here,
  server-side — they are **not** a CSS-only change.
- **`window.print()`**: everything else (reports, measurements tab, shopping list, shared links).

- `src/lib/pdf/generate-plan-pdf.ts` — main meal plan PDF (cover, weekly summary, daily detail, recommendations, shopping list)
- `src/lib/pdf/pdf-themes.ts` — color theme system (5 presets + custom color derivation via HSL)
- `src/app/(dashboard)/reportes/[id]/generar-pdf.tsx` — simpler report PDFs (evolution, patient file, weekly diet)
- `src/app/paciente/portal/exportar-pdf/exportar-form.tsx` — patient-facing PDF exporter

### Data model (key relationships)

`Dietista` → has many `Paciente` → has many `PlanAlimenticio` → has many `DiaDelPlan` → has many `ComidaDelDia` → has many `AlimentoEnComida` (links to `Alimento` or `Receta`).

34 models total. Schema uses Spanish names with `@@map()` for table names. Enums for days (`DiaSemana`), meal types (`TipoComida`), food categories (`CategoriaAlimento`), measurement units (`UnidadMedida`).

### Images

Stored as base64 data URLs directly in the database (profile photos, PDF logos). Validated with `validateImageDataUrl()` in `src/lib/validation.ts`. No external storage.

### DB migrations

No Prisma Migrate. Schema changes use manual SQL scripts in `scripts/` with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Run via `DB=prod npx tsx scripts/<name>.ts` (see the environments section at the top). The
production database is **PostgreSQL on Supabase**; Oracle Cloud hosts the application server, not
the database.

## Conventions

- All UI text, variable names, and comments are in **Spanish**
- `escapeHtml()` must be applied to any user data injected into HTML templates (PDFs, emails)
- Toast notifications use `sonner` (`toast.success()`, `toast.error()`)
- Icons from `lucide-react`
- `cn()` utility (from `src/lib/utils.ts`) for conditional Tailwind classes — wraps `clsx` + `tailwind-merge`
- Server actions return `{ ok: boolean; error?: string }` pattern for error handling

### Error boundaries

Three `error.tsx` files catch runtime errors and prevent infinite loading:
- `src/app/global-error.tsx` — root-level (catches hydration/module errors). Uses inline styles (no Tailwind, since layout may not be available).
- `src/app/(dashboard)/error.tsx` — dashboard errors. Uses Tailwind + lucide icons.
- `src/app/paciente/error.tsx` — patient portal errors. Uses Tailwind + lucide icons.

All three detect stale-module errors (Turbopack "module factory not available") and show a "Recargar" button that does `window.location.reload()`. For other errors, they show "Reintentar" that calls the Next.js `reset()` function.

### Turbopack stale cache

The `predev` npm script (`rm -rf .next`) runs automatically before `npm run dev` to prevent Turbopack from serving stale module chunks. If the browser still shows module errors after restart, hard-reload (Cmd+Shift+R) to clear the browser cache.

### Server actions — error handling rules

- **Catch blocks**: always use `isNextNavigation(error)` from `@/lib/utils` — never the old `"digest" in error` pattern (it swallows real errors in Next.js 16).
- **Validation errors**: return `{ error: string }` instead of `throw new Error()` — thrown errors cause red overlays in production.
- **Server→client boundary**: never pass functions or React components as props to "use client" components — use string keys and resolve on the client side.

## Product mindset — think like the dietitian using the app

Don't implement requests literally and stop there: the user is building this for working nutritionists, and a feature that is technically done but unusable counts as unfinished.

**Discoverability.** Real users keep asking about "buttons they can't find". If a feature ends up hidden, it does not exist for them. Put the entry point or the hint where the user is already looking: a link to where a thing is configured, a line explaining where a number comes from, a visible state when something is active. "The author knows where it is" is not enough.

**Cross-screen implications.** Before closing a change, ask *"if this is configured here, where else does it have to live?"* — and verify it in the code. The same data/action usually has to appear in several places:

- `(dashboard)/dietas/[id]` — diet editor
- `pacientes/[id]?pestana=plan-alimentacion` — **`crearPlan` redirects here**, so it is where the dietitian edits right after creating a diet. Easy to forget; if it is missing here the feature looks broken.
- `paciente/portal/*` — patient portal (decide explicitly whether the patient should see it; usually not for internal targets)
- `compartido/[token]` — public shared link
- `src/lib/pdf/*` + `entregables-tab.tsx` — PDF deliverables
- `dietas/plantillas/[id]` — diet templates (no patient → no planificación: make sure nothing breaks or shows an empty link)
- AI generation (`dietas/[id]/generar-ia`)

Shared logic belongs in `src/lib/` (see `reparto-comidas.ts`, `comida-horas.ts`) so the planning screen and the editor cannot drift apart.

**When reporting back**, say what was done, on which screens it is visible, what was deliberately left out and why. If another place needs touching for the change to make sense, propose it or do it — but say so; never leave it silently half-wired.

**Don't overreach.** No inventing whole features or redesigning what wasn't asked. Small usability improvements tied to the code being touched: yes. Anything bigger: propose it first.
