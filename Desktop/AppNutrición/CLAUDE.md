# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

Annonia is a SaaS platform for dietitians/nutritionists to manage patients, create personalized meal plans, schedule appointments, and generate PDF deliverables. It has two portals: a **dietist dashboard** and a **patient portal** with separate auth systems.

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
npx tsx scripts/<migration-name>.ts
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

PDFs are generated as HTML strings with inline CSS, opened in a new window via `window.print()`. No headless browser or PDF library.

- `src/lib/pdf/generate-plan-pdf.ts` — main meal plan PDF (cover, weekly summary, daily detail, recommendations, shopping list)
- `src/lib/pdf/pdf-themes.ts` — color theme system (5 presets + custom color derivation via HSL)
- `src/app/(dashboard)/reportes/[id]/generar-pdf.tsx` — simpler report PDFs (evolution, patient file, weekly diet)
- `src/app/paciente/portal/exportar-pdf/exportar-form.tsx` — patient-facing PDF exporter

### Data model (key relationships)

`Dietista` → has many `Paciente` → has many `PlanAlimenticio` → has many `DiaDelPlan` → has many `ComidaDelDia` → has many `AlimentoEnComida` (links to `Alimento` or `Receta`).

27 models total. Schema uses Spanish names with `@@map()` for table names. Enums for days (`DiaSemana`), meal types (`TipoComida`), food categories (`CategoriaAlimento`), measurement units (`UnidadMedida`).

### Images

Stored as base64 data URLs directly in the database (profile photos, PDF logos). Validated with `validateImageDataUrl()` in `src/lib/validation.ts`. No external storage.

### DB migrations

No Prisma Migrate. Schema changes use manual SQL scripts in `scripts/` with `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`. Run via `npx tsx scripts/<name>.ts`. Production DB is on Oracle Cloud, accessed via SSH.

## Conventions

- All UI text, variable names, and comments are in **Spanish**
- `escapeHtml()` must be applied to any user data injected into HTML templates (PDFs, emails)
- Toast notifications use `sonner` (`toast.success()`, `toast.error()`)
- Icons from `lucide-react`
- `cn()` utility (from `src/lib/utils.ts`) for conditional Tailwind classes — wraps `clsx` + `tailwind-merge`
- Server actions return `{ ok: boolean; error?: string }` pattern for error handling
