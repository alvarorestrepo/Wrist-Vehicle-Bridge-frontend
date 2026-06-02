---
name: wrist-vehicle-bridge-frontend-overview
description: >
  Global architecture, conventions, and patterns for Wrist Vehicle Bridge Frontend.
  Trigger: When working on cross-cutting concerns, understanding project architecture,
  environment variables, commands, or general frontend/backend-boundary context.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "General Wrist Vehicle Bridge development questions"
    - "Understanding project architecture"
    - "Changing app-wide security or environment handling"
allowed-tools: Read, Glob, Grep
---

## Purpose

Use this skill for global context before touching multiple modules in the Wrist Vehicle Bridge frontend.

---

## Directory Structure

```
./
├── src/app/                    # App Router routes, layout, manifest, global CSS
├── src/auth.ts                 # Auth.js configuration and exports
├── src/components/             # App shell, service worker registration, UI primitives
├── src/features/auth/          # Sign-in and sign-out UI actions
├── src/features/vehicle/       # Tesla backend status and command flows
├── src/features/push/          # Web Push subscription flows
├── src/lib/server/env.ts       # Server-only environment validation
├── public/sw.js                # PWA service worker
├── next.config.ts              # Next headers for service worker
├── eslint.config.mjs           # ESLint flat config with Next core web vitals/typescript
└── package.json                # npm scripts and dependencies
```

---

## Architecture

Server Components gate the authenticated dashboard (`src/app/page.tsx`). Server Actions require session checks before private operations. Backend API access is centralized in server-only clients that validate responses with Zod and use no-store fetches.

```
Browser UI -> Server Actions -> server-only client -> TESLA_BACKEND_URL
       |             |                  |
       |             |                  +-- Authorization: Bearer TESLA_CLIENT_API_TOKEN
       |             +-- auth() session guard
       +-- service worker caches static assets only
```

---

## Key Patterns

### Server-only Environment

Environment validation is centralized and guarded by `server-only`.

```ts
// From src/lib/server/env.ts
import "server-only";

const serverEnvSchema = z.object({
  TESLA_BACKEND_URL: z.url(),
  TESLA_CLIENT_API_TOKEN: z.string().min(1),
});
```

### Authenticated App Gate

The home route reads Auth.js session server-side before rendering dashboard modules.

```tsx
// From src/app/page.tsx
export default async function Home() {
  const session = await auth();

  if (!session?.user) {
    return <SignInScreen />;
  }
```

---

## Critical Rules

- ALWAYS read relevant `node_modules/next/dist/docs/` docs before writing Next.js code.
- NEVER expose `TESLA_CLIENT_API_TOKEN` outside server-only modules.
- ALWAYS keep authenticated backend fetches `cache: "no-store"`.
- NEVER let the service worker cache auth/API/vehicle/push/dashboard/navigation responses.
- ALWAYS validate backend responses with strict Zod schemas.
- NEVER run `npm run build` unless explicitly requested by the user.

---

## Testing

- **Framework**: none configured in the current repo.
- **Location**: no test files detected.
- **Naming**: none detected.
- **Run**: `npm run lint` for the only configured lightweight check.

---

## Commands

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Lint
npm run lint

# Build (do not run unless user explicitly asks)
npm run build

# Start production server
npm run start
```

---

## Environment

Detected from code:

| Variable | Used By | Notes |
| -------- | ------- | ----- |
| `AUTH_ALLOWED_EMAILS` | `src/auth.ts` | Optional comma-separated allowlist; empty allows any Google-authenticated email. |
| `TESLA_BACKEND_URL` | `src/lib/server/env.ts` | Backend base URL for vehicle and push routes. |
| `TESLA_CLIENT_API_TOKEN` | `src/lib/server/env.ts` | Secret token; server-only only. |

---

## Git Conventions

Recent commits are free-form (`first commit`, `Initial commit from Create Next App`). Branching appears trunk-based: `main` plus `origin/main` only.
