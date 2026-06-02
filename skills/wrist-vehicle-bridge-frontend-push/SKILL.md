---
name: wrist-vehicle-bridge-frontend-push
description: >
  Deep knowledge for Web Push notifications in Wrist Vehicle Bridge Frontend.
  Trigger: When working on push notifications, push subscriptions, VAPID key flow,
  `src/features/push/`, or push-related server actions/client UI.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "Working on push notification code"
    - "Creating or modifying files in src/features/push/"
    - "Debugging Web Push subscription issues"
allowed-tools: Read, Glob, Grep
---

## Purpose

Use this skill for browser Web Push support, backend subscription sync, and push-related security boundaries.

---

## Directory Structure

```
src/features/push/
├── components/
│   └── push-notifications-card.tsx
└── server/
    ├── actions.ts             # Session-guarded push Server Actions
    ├── client.ts              # server-only push backend client
    ├── index.ts               # server-only exports
    └── schemas.ts             # Strict Zod push contracts
```

---

## Key Patterns

### Server-only Push Client

Push backend requests use the same private backend URL/token as vehicle calls.

```ts
// From src/features/push/server/client.ts
return await fetch(url, {
  ...init,
  headers: {
    Authorization: `Bearer ${TESLA_CLIENT_API_TOKEN}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  },
  cache: "no-store",
  signal: controller.signal,
});
```

### Session Email Is Server-Owned

The server action reads account identity from `auth()`, not from client payload.

```ts
// From src/features/push/server/actions.ts
async function requireSessionEmail() {
  const session = await auth();
  const email = session?.user?.email;

  if (!session?.user || !email) {
    throw new Error("Unauthorized");
  }

  return email;
}
```

### Browser Capability Checks

The client checks secure context and browser APIs before attempting subscription.

```tsx
// From src/features/push/components/push-notifications-card.tsx
function isPushSupported() {
  return (
    typeof window !== "undefined" &&
    window.isSecureContext &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}
```

---

## Decision Trees

### Changing Push Registration

1. Keep browser-only APIs in `push-notifications-card.tsx` behind `"use client"`.
2. Keep backend communication in `server/client.ts` with `import "server-only"`.
3. Validate subscription payloads with `pushSubscriptionSchema` in server actions.
4. Use session email from `auth()` for backend registration.
5. If backend returns `push_not_configured`, show non-fatal UI state.

---

## Critical Rules

- ALWAYS validate `subscription` and `deviceLabel` before backend calls.
- ALWAYS derive email from the authenticated server session.
- NEVER trust a client-provided email for push registration.
- NEVER expose the backend token to the browser; only the VAPID public key goes client-side.
- ALWAYS unsubscribe a newly created browser subscription if backend registration fails.
- NEVER cache push API responses in the service worker.

---

## Testing

- **Framework**: none configured.
- **Location**: no push tests detected.
- **Naming**: none detected.
- **Run**: `npm run lint`.

---

## Commands

```bash
# Lint push changes
npm run lint

# Run app locally over a secure context for Web Push testing
npm run dev
```

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/features/push/server/client.ts` | Push backend request wrapper and known error normalization. |
| `src/features/push/server/actions.ts` | Authenticated VAPID lookup, registration, unregister actions. |
| `src/features/push/server/schemas.ts` | Zod schemas for VAPID, subscriptions, backend responses. |
| `src/features/push/components/push-notifications-card.tsx` | Browser permission, service worker, PushManager, and subscription UI. |
| `public/sw.js` | Receives push events and shows notifications. |
