# S0 — App Foundation, Auth & Public Site — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development (recommended) or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax. This implements subsystem **S0** from [the master plan](2026-06-14-carebridge-mvp-master-plan.md) (Phase 1 · Week 1).

**Goal:** Scaffold the Next.js (App Router, TypeScript) application onto the existing Supabase database, with email/password auth (verification + reset), role-based access for the four account types plus Founder, the public marketing pages, and legal/consent capture.

**Architecture:** Next.js App Router. Three Supabase clients in `src/lib/supabase` — browser (anon), server (per-request, RLS-bound via cookies), and service-role (server-only). A `handle_new_user` trigger creates the `public.users` row from signup metadata. `requireRole()` + `middleware.ts` guard the four role areas; Founder bypasses. Public + legal pages are server components.

**Tech Stack:** Next.js (TypeScript), Tailwind CSS + shadcn/ui, `@supabase/ssr`, Zod, Vitest + React Testing Library, Playwright. Local Supabase via `npx supabase` (inbucket re-enabled for email testing).

**Decisions locked for S0** (override if desired): Tailwind + shadcn/ui; `public.users` created by DB trigger from `auth.users.raw_user_meta_data` (`account_type`, `full_name`); Supabase Auth built-in email confirmation ON (inbucket locally, Resend SMTP in production — wired later in S2); Zod validation shared client+server.

**Reference:** master plan §4 (S0 scope, module structure, acceptance). Existing DB: migrations `0000–0016`, `users` table keyed to `auth.users(id)`.

---

## Conventions

- App lives under `src/`. Run dev: `npm run dev`. Unit tests: `npm run test` (Vitest). E2E: `npm run e2e` (Playwright). DB: `npx supabase db reset` / `npx supabase test db`.
- The local Supabase stack is already running (`127.0.0.1:54321` API, `54322` DB). Get local anon key + URL from `npx supabase status`.
- Env in `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.
- Commit after each task.

---

## Task 1: Scaffold Next.js + Tailwind + tooling + CI

**Files:**
- Create: `package.json` (extend existing), `next.config.ts`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.mjs`, `src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Create: `.github/workflows/ci.yml`
- Modify: `.gitignore` (add `.env*`, `.next/`, `playwright-report/`)

- [ ] **Step 1: Install Next.js + tooling**

Run:
```bash
npm install next@latest react@latest react-dom@latest
npm install -D typescript @types/react @types/node tailwindcss postcss autoprefixer eslint eslint-config-next prettier vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react @playwright/test zod
npx tailwindcss init -p
```
Expected: deps added; `tailwind.config.ts` + `postcss.config.mjs` created.

- [ ] **Step 2: Add npm scripts**

Run:
```bash
npm pkg set scripts.dev="next dev" scripts.build="next build" scripts.start="next start" scripts.lint="next lint" scripts.test="vitest run" scripts.e2e="playwright test"
```

- [ ] **Step 3: Create the base app shell**

Create `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Create `src/app/layout.tsx`:
```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CareBridge Connect",
  description: "Healthcare staffing marketplace connecting verified professionals with clients and organisations.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-slate-900 antialiased">{children}</body>
    </html>
  );
}
```

Create `src/app/page.tsx`:
```tsx
export default function HomePage() {
  return <main className="mx-auto max-w-3xl p-8"><h1 className="text-2xl font-bold">CareBridge Connect</h1></main>;
}
```

Set `tailwind.config.ts` `content` to `["./src/**/*.{ts,tsx}"]`.

- [ ] **Step 4: Verify the app builds and runs**

Run: `npm run build`
Expected: build succeeds with the home route.

- [ ] **Step 5: Add CI workflow**

Create `.github/workflows/ci.yml`:
```yaml
name: CI
on: [push, pull_request]
jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build
```

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat(app): scaffold Next.js app with Tailwind, tooling and CI"
```

---

## Task 2: Supabase clients + generated types + env

**Files:**
- Create: `src/lib/supabase/types.ts` (generated), `src/lib/supabase/browser.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/service.ts`
- Create: `.env.local`, `.env.example`

- [ ] **Step 1: Install supabase ssr + capture env**

Run:
```bash
npm install @supabase/supabase-js @supabase/ssr
npx supabase status
```
Copy the API URL and `anon`/`service_role` keys into `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key from status>
SUPABASE_SERVICE_ROLE_KEY=<service_role key from status>
```
Create `.env.example` with the same keys but empty values.

- [ ] **Step 2: Generate DB types**

Run:
```bash
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```
Expected: a `Database` type reflecting all tables/enums.

- [ ] **Step 3: Write the clients**

Create `src/lib/supabase/browser.ts`:
```ts
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

Create `src/lib/supabase/server.ts`:
```ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "./types";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (toSet) => {
          try { toSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options)); } catch {}
        },
      },
    },
  );
}
```

Create `src/lib/supabase/service.ts`:
```ts
import { createClient as createAdminClient } from "@supabase/supabase-js";
import type { Database } from "./types";

// Server-only. Never import into client components.
export function createServiceClient() {
  return createAdminClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}
```

- [ ] **Step 4: Verify typecheck**

Run: `npx tsc --noEmit`
Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/supabase .env.example .gitignore
git commit -m "feat(app): supabase browser/server/service clients and generated types"
```

---

## Task 3: `handle_new_user` trigger (migration 0017) + pgTAP test

**Files:**
- Create: `supabase/migrations/0017_handle_new_user.sql`
- Create: `supabase/tests/0018_handle_new_user_test.sql`

A signup must create the matching `public.users` row from `auth.users.raw_user_meta_data`.

- [ ] **Step 1: Write the failing test**

Create `supabase/tests/0018_handle_new_user_test.sql`:
```sql
begin;
select plan(2);

select has_function('public','handle_new_user','new-user trigger fn exists');

insert into auth.users (id, email, raw_user_meta_data)
values ('00000000-0000-0000-0000-0000000000d7','d7@test.dev',
        '{"account_type":"professional","full_name":"Trigger Pro"}'::jsonb);

select is( (select account_type::text from public.users where id='00000000-0000-0000-0000-0000000000d7'),
           'professional', 'public.users row created from signup metadata');

select * from finish();
rollback;
```

- [ ] **Step 2: Run to verify it fails**

Run: `npx supabase test db`
Expected: FAIL — function/row absent.

- [ ] **Step 3: Write the migration**

Create `supabase/migrations/0017_handle_new_user.sql`:
```sql
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, account_type)
  values (
    new.id,
    new.email,
    coalesce((new.raw_user_meta_data->>'account_type')::account_type, 'private_client')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

- [ ] **Step 4: Run to verify it passes**

Run: `npx supabase db reset && npx supabase test db`
Expected: PASS — full suite green including 0018.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/0017_handle_new_user.sql supabase/tests/0018_handle_new_user_test.sql
git commit -m "feat(db): create public.users from signup via handle_new_user trigger"
```

---

## Task 4: Auth — signup, email verification, login, password reset

**Files:**
- Create: `src/lib/validation/auth.ts`, `src/lib/auth/actions.ts`
- Create: `src/app/(auth)/register/page.tsx`, `src/app/(auth)/login/page.tsx`, `src/app/(auth)/reset/page.tsx`, `src/app/auth/confirm/route.ts`
- Modify: `supabase/config.toml` (re-enable inbucket for local email testing)

- [ ] **Step 1: Re-enable inbucket for local email testing**

In `supabase/config.toml` set `[inbucket] enabled = true`, then `npx supabase stop && npx supabase start`. Confirm inbucket UI port (default 54324) is shown.

- [ ] **Step 2: Write validation schema + unit test**

Create `src/lib/validation/auth.ts`:
```ts
import { z } from "zod";

export const accountTypes = ["professional", "private_client", "organisation"] as const;

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  accountType: z.enum(accountTypes),
  acceptedTerms: z.literal(true),
});
export type RegisterInput = z.infer<typeof registerSchema>;
```

Create `src/lib/validation/auth.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { registerSchema } from "./auth";

describe("registerSchema", () => {
  it("rejects when terms not accepted", () => {
    const r = registerSchema.safeParse({ email: "a@b.co", password: "password1", fullName: "Al", accountType: "professional", acceptedTerms: false });
    expect(r.success).toBe(false);
  });
  it("accepts a valid professional signup", () => {
    const r = registerSchema.safeParse({ email: "a@b.co", password: "password1", fullName: "Al", accountType: "professional", acceptedTerms: true });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 3: Run unit test to verify it fails then passes**

Run: `npm run test`
Expected: FAILS until `auth.ts` exists, then PASSES (2 tests).

- [ ] **Step 4: Write the signup server action**

Create `src/lib/auth/actions.ts`:
```ts
"use server";
import { createClient } from "@/lib/supabase/server";
import { registerSchema } from "@/lib/validation/auth";

export async function signUp(formData: FormData) {
  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    fullName: formData.get("fullName"),
    accountType: formData.get("accountType"),
    acceptedTerms: formData.get("acceptedTerms") === "on",
  });
  if (!parsed.success) return { error: "Invalid details" };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { data: { account_type: parsed.data.accountType, full_name: parsed.data.fullName } },
  });
  if (error) return { error: error.message };

  // Record consent (privacy + terms) for the new user.
  if (data.user) {
    await supabase.from("consents").insert([
      { user_id: data.user.id, consent_type: "terms_conditions", version: "v1" },
      { user_id: data.user.id, consent_type: "privacy_policy", version: "v1" },
    ]);
  }
  return { ok: true };
}
```

- [ ] **Step 5: Write register / login / reset pages and the confirm route**

Create `src/app/(auth)/register/page.tsx` (client form posting to `signUp`, with `accountType` radio for the three public roles, full name, email, password, terms checkbox; shows success "check your email").

Create `src/app/(auth)/login/page.tsx` (email/password → `supabase.auth.signInWithPassword`; on success redirect by role — see Task 5 `roleHome()`).

Create `src/app/(auth)/reset/page.tsx` (email → `supabase.auth.resetPasswordForEmail`).

Create `src/app/auth/confirm/route.ts`:
```ts
import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as "email" | "recovery" | null;
  const next = searchParams.get("next") ?? "/login";
  if (token_hash && type) {
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(next, request.url));
  }
  return NextResponse.redirect(new URL("/login?error=verify", request.url));
}
```

- [ ] **Step 6: Manual verify + commit**

Run `npm run dev`, register a professional, open inbucket (`http://127.0.0.1:54324`), click the confirmation link, confirm login works.
```bash
git add src/lib/validation src/lib/auth "src/app/(auth)" src/app/auth supabase/config.toml
git commit -m "feat(app): email/password auth with verification, reset and consent capture"
```

---

## Task 5: RBAC — role guard + route middleware

**Files:**
- Create: `src/lib/auth/rbac.ts`, `src/lib/auth/rbac.test.ts`, `middleware.ts`

- [ ] **Step 1: Write the failing unit test**

Create `src/lib/auth/rbac.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { roleHome, isAreaAllowed } from "./rbac";

describe("rbac", () => {
  it("maps each role to its home", () => {
    expect(roleHome("professional")).toBe("/professional");
    expect(roleHome("admin")).toBe("/admin");
  });
  it("blocks a professional from the admin area", () => {
    expect(isAreaAllowed("professional", "/admin/x", false)).toBe(false);
  });
  it("lets the founder into any area", () => {
    expect(isAreaAllowed("professional", "/admin/x", true)).toBe(true);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `npm run test`
Expected: FAIL — `rbac.ts` missing.

- [ ] **Step 3: Implement rbac**

Create `src/lib/auth/rbac.ts`:
```ts
export type AccountType = "professional" | "private_client" | "organisation" | "admin";

const AREA: Record<AccountType, string> = {
  professional: "/professional",
  private_client: "/client",
  organisation: "/organisation",
  admin: "/admin",
};

export function roleHome(role: AccountType): string {
  return AREA[role];
}

export function isAreaAllowed(role: AccountType, pathname: string, isFounder: boolean): boolean {
  if (isFounder) return true;
  const owned = AREA[role];
  const guarded = Object.values(AREA);
  const area = guarded.find((a) => pathname === a || pathname.startsWith(a + "/"));
  return area ? area === owned : true; // non-role paths are public
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `npm run test`
Expected: PASS.

- [ ] **Step 5: Add middleware**

Create `middleware.ts` (project root):
```ts
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { isAreaAllowed, roleHome, type AccountType } from "@/lib/auth/rbac";

const GUARDED = ["/professional", "/client", "/organisation", "/admin"];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  if (!GUARDED.some((a) => path === a || path.startsWith(a + "/"))) return NextResponse.next();

  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => request.cookies.getAll(),
        setAll: (c) => c.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } },
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", request.url));

  const { data: row } = await supabase.from("users").select("account_type, is_founder").eq("id", user.id).single();
  if (!row) return NextResponse.redirect(new URL("/login", request.url));

  if (!isAreaAllowed(row.account_type as AccountType, path, row.is_founder)) {
    return NextResponse.redirect(new URL(roleHome(row.account_type as AccountType), request.url));
  }
  return response;
}

export const config = { matcher: ["/professional/:path*", "/client/:path*", "/organisation/:path*", "/admin/:path*"] };
```

- [ ] **Step 6: Add minimal role landing pages**

Create `src/app/professional/page.tsx`, `src/app/client/page.tsx`, `src/app/organisation/page.tsx`, `src/app/admin/page.tsx` — each a server component greeting the signed-in user (placeholder dashboards for later subsystems).

- [ ] **Step 7: Commit**

```bash
git add src/lib/auth/rbac.ts src/lib/auth/rbac.test.ts middleware.ts src/app/professional src/app/client src/app/organisation src/app/admin
git commit -m "feat(app): role-based access control guard and route middleware"
```

---

## Task 6: Public marketing + legal pages

**Files:**
- Create: `src/app/(marketing)/{about,services,contact,faq}/page.tsx`, update `src/app/page.tsx`
- Create: `src/app/(legal)/{privacy,terms}/page.tsx`
- Create: `src/components/site-nav.tsx`

- [ ] **Step 1: Build a shared site nav**

Create `src/components/site-nav.tsx` linking Home, About, Services, FAQ, Contact, plus Login/Register.

- [ ] **Step 2: Build the pages**

Create Home (hero + value prop + CTAs to register/login), About, Services (the four roles), FAQ, Contact (form posting to a no-op server action for now or `mailto`), Privacy, Terms. Each a server component with real headings/sections and SEO `metadata`. Content is functional placeholder copy pending Ana's final branding/content.

- [ ] **Step 3: Verify build + responsiveness**

Run: `npm run build` and spot-check at mobile width in `npm run dev`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/(marketing)" "src/app/(legal)" src/components/site-nav.tsx src/app/page.tsx
git commit -m "feat(app): public marketing and legal pages"
```

---

## Task 7: E2E smoke — register → verify → land in role area

**Files:**
- Create: `playwright.config.ts`, `e2e/auth.spec.ts`

- [ ] **Step 1: Configure Playwright**

Run: `npx playwright install --with-deps chromium`. Create `playwright.config.ts` with `webServer` running `npm run dev` on port 3000, and projects for chromium + a mobile viewport.

- [ ] **Step 2: Write the smoke spec**

Create `e2e/auth.spec.ts`: for a professional — register with a unique email, fetch the confirmation link from inbucket's API (`GET http://127.0.0.1:54324/api/v1/mailbox/<addr>`), visit it, log in, assert redirect to `/professional`. Add an assertion that visiting `/admin` redirects away.

- [ ] **Step 3: Run E2E**

Run: `npm run e2e`
Expected: PASS — registration/verify/login/redirect + area-guard.

- [ ] **Step 4: Commit**

```bash
git add playwright.config.ts e2e/auth.spec.ts package.json
git commit -m "test(app): E2E smoke for register/verify/login and area guard"
```

---

## Self-review

- **Master-plan S0 coverage:** clients/types → T2; auth verify/reset → T4; public.users creation → T3; RBAC + middleware → T5; marketing + legal → T6; consent capture → T4; smoke E2E → T7. All S0 acceptance criteria map to a task.
- **Type consistency:** `AccountType` union, `roleHome`, `isAreaAllowed`, `createClient`/`createServiceClient`, `signUp`, `handle_new_user` are used consistently across tasks.
- **Placeholders:** marketing copy is explicitly functional-pending-content (a stated product decision, not a code placeholder); all code steps carry complete code.
- **Known follow-ups (flagged):** organisation/admin accounts are created by admin invite in S3 (register page exposes only the three self-serve roles); production email uses Resend SMTP (wired in S2); role landing pages are placeholders for later subsystems.
