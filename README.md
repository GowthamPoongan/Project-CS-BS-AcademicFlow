# CS&BS AcademicFlow

AcademicFlow is a responsive academic profile and document platform built with React, TypeScript, TanStack Start, and Supabase.

## Local configuration

Copy `.env.example` to `.env` and set the Supabase URL and publishable key for the project you own:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_URL`
- `SUPABASE_PUBLISHABLE_KEY`

The server variables must point to the same project as the browser variables. Never put a Supabase secret or service-role key in a `VITE_` variable. Marksheet auto-read is optional and uses `AI_GATEWAY_URL`, `AI_GATEWAY_API_KEY`, and `AI_MODEL`; without them, users can enter marks manually.

## Database setup

Apply the SQL files in `supabase/migrations` to a new Supabase project in timestamp order, or use the Supabase CLI migration workflow after linking the project. The schema currently used by the application is `profiles`, `user_roles`, `semester_records`, `subject_marks`, `documents`, and `achievements`. Migrations configure private `academic-docs` and `profile-photos` buckets and their access rules.

Google sign-in also requires enabling Google as a provider in the Supabase Auth settings and configuring the provider's redirect URLs. Email/password registration and password reset use Supabase Auth.

## Run

Install dependencies with Bun or npm, then run `bun run dev` (or `npm run dev`). Use `bun run build` (or `npm run build`) for a production build.
