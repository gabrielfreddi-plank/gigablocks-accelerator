# Supabase Integration Plan — apps/home

## Overview

Add authentication (sign in / sign up) to `apps/home` using Supabase Auth + SSR.
Scope: email/password auth + OAuth (GitHub/Google), session management via middleware,
protected routes, and a `lib/supabase/` utility layer ready for future DB usage.

---

## Environment Variables Required

Add these to `apps/home/.env.local` (create the file — it's gitignored):

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
```

> Find both in your Supabase dashboard → Project Settings → API.

For server-side operations (optional now, needed later for admin/DB actions):

```env
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

> **Never expose `SUPABASE_SERVICE_ROLE_KEY` to the client.**

---

## Phase 1 — Dependencies

```bash
pnpm --filter=home add @supabase/supabase-js @supabase/ssr
```

---

## Phase 2 — Supabase Client Utilities

Create `src/lib/supabase/`:

### `client.ts` — browser client (Client Components)
```ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `server.ts` — server client (Server Components, Route Handlers, Actions)
```ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        },
      },
    }
  )
}
```

### `middleware.ts` — refresh session (at `src/middleware.ts`)

Intercepts every request to refresh the Supabase session cookie.
Also protects routes under `/dashboard` (or any future app routes).

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (cookiesToSet) => {
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect /dashboard (add more protected paths here later)
  if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

---

## Phase 3 — Auth Routes

Structure inside `src/app/(auth)/`:

```
src/app/(auth)/
  layout.tsx          # Centered layout — clean, no Navbar
  sign-in/
    page.tsx          # Sign in form
  sign-up/
    page.tsx          # Sign up form
  auth/
    callback/
      route.ts        # OAuth + email link callback handler
```

### `auth/callback/route.ts`
Exchanges the auth code for a session after OAuth or magic link:

```ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  return NextResponse.redirect(`${origin}${next}`)
}
```

> In Supabase dashboard → Auth → URL Configuration, set:
> - **Site URL**: `http://localhost:3000` (dev) / your prod URL
> - **Redirect URL**: `http://localhost:3000/auth/callback`

---

## Phase 4 — Sign In / Sign Up Pages

Both pages will use `@supabase/ssr` browser client + shadcn/ui form components.
Minimum viable forms:

- **Sign in**: email + password → `supabase.auth.signInWithPassword()`
- **Sign up**: email + password → `supabase.auth.signUp()`
- **OAuth**: GitHub / Google → `supabase.auth.signInWithOAuth()`
- **Sign out**: Server Action → `supabase.auth.signOut()`

---

## Phase 5 — Navbar Update

Update `src/components/marketing/Navbar.tsx`:
- "Sign in" → `/sign-in`
- "Get started" → `/sign-up`

---

## Future — Database (when needed)

When adding Supabase DB queries:
- Use `createClient()` from `server.ts` in Server Components / Route Handlers
- Use `createClient()` from `client.ts` in Client Components with real-time
- Add Row Level Security (RLS) policies in Supabase dashboard for every table
- Store types in `src/lib/supabase/types.ts` (generated via `supabase gen types`)

---

## Summary Checklist

- [ ] Create `apps/home/.env.local` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `pnpm --filter=home add @supabase/supabase-js @supabase/ssr`
- [x] Create `src/lib/supabase/client.ts`
- [x] Create `src/lib/supabase/server.ts`
- [x] Create `src/middleware.ts`
- [x] Create `src/app/(auth)/layout.tsx`
- [x] Create `src/app/(auth)/sign-in/page.tsx`
- [x] Create `src/app/(auth)/sign-up/page.tsx`
- [x] Create `src/app/auth/callback/route.ts`
- [x] Update Navbar links (`/sign-in` and `/sign-up`)
- [ ] Configure Supabase dashboard redirect URLs
