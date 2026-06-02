---
name: wrist-vehicle-bridge-frontend-auth
description: >
  Deep knowledge for Auth.js authentication in Wrist Vehicle Bridge Frontend.
  Trigger: When working on Auth.js, Google sign-in, session gating, allowlists,
  `src/auth.ts`, `src/features/auth/`, or `src/app/api/auth/`.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "Working on authentication"
    - "Creating or modifying files in src/features/auth/"
    - "Changing src/auth.ts or auth route handlers"
allowed-tools: Read, Glob, Grep
---

## Purpose

Use this skill for Auth.js session behavior, Google SSO, and authenticated dashboard gating.

---

## Directory Structure

```
src/features/auth/
└── components/
    ├── auth-actions.tsx       # Server-action forms for sign-in/sign-out
    └── sign-in-screen.tsx     # Unauthenticated landing screen

src/auth.ts                    # NextAuth config and exported helpers
src/app/api/auth/[...nextauth]/route.ts
```

---

## Key Patterns

### Optional Email Allowlist

`AUTH_ALLOWED_EMAILS` is optional. Empty allowlist means any Google-authenticated user can sign in.

```ts
// From src/auth.ts
function getAllowedEmails() {
  return new Set(
    (process.env.AUTH_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}
```

### Route Handler Delegation

Auth routes are delegated directly to Auth.js handlers.

```ts
// From src/app/api/auth/[...nextauth]/route.ts
import { handlers } from "@/auth";

export const { GET, POST } = handlers;
```

### Server Action Forms

Sign-in/sign-out are form actions with inline `"use server"` directives.

```tsx
// From src/features/auth/components/auth-actions.tsx
<form
  action={async () => {
    "use server";

    await signIn("google");
  }}
>
```

---

## Decision Trees

### Adding Auth-Protected UI

1. Read the session server-side with `auth()` in a Server Component or Server Action.
2. Render `SignInScreen` or throw `Unauthorized` when `!session?.user`.
3. Do not move secret/backend token access into auth components.
4. Keep provider-specific sign-in through Auth.js helpers from `@/auth`.

---

## Critical Rules

- ALWAYS use `auth()` as the source of session truth for private server operations.
- ALWAYS keep account identity for push registration from the server session, not client input.
- NEVER assume `AUTH_ALLOWED_EMAILS` is configured; empty allowlist intentionally permits Google SSO users.
- NEVER expose private backend env vars through auth pages or session props.

---

## Testing

- **Framework**: none configured.
- **Location**: no auth tests detected.
- **Naming**: none detected.
- **Run**: `npm run lint`.

---

## Commands

```bash
# Lint auth changes
npm run lint

# Run app locally
npm run dev
```

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/auth.ts` | Auth.js provider config and email allowlist callback. |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth.js App Router route handlers. |
| `src/features/auth/components/auth-actions.tsx` | Server-action forms for Google sign-in and sign-out. |
| `src/features/auth/components/sign-in-screen.tsx` | Unauthenticated screen before dashboard access. |
