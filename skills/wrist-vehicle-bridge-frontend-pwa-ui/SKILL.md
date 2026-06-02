---
name: wrist-vehicle-bridge-frontend-pwa-ui
description: >
  Deep knowledge for App Router shell, PWA, service worker, theme, and UI primitives.
  Trigger: When working on `src/app/`, `src/components/`, `public/sw.js`, manifest,
  service worker registration, layout, theme, or shared UI components.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "Working on PWA or service worker code"
    - "Creating or modifying files in src/app/ or src/components/"
    - "Changing UI primitives, manifest, theme, or global CSS"
allowed-tools: Read, Glob, Grep
---

## Purpose

Use this skill for App Router shell work, PWA installability, static caching, theme behavior, and shared UI primitives.

---

## Directory Structure

```
src/app/
├── api/auth/[...nextauth]/route.ts
├── favicon.ico
├── globals.css
├── layout.tsx
├── manifest.ts
└── page.tsx

src/components/
├── app-shell.tsx
├── service-worker-registration.tsx
├── theme-provider.tsx
└── ui/
    ├── badge.tsx
    ├── button.tsx
    ├── card.tsx
    └── skeleton.tsx

public/sw.js
public/icons/
```

---

## Key Patterns

### Service Worker Registration Must Be Non-blocking

PWA registration is client-side and must never break dashboard rendering.

```tsx
// From src/components/service-worker-registration.tsx
navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
  // PWA installability must never break the authenticated dashboard.
});
```

### Static-only Service Worker Cache

The service worker explicitly excludes API/auth/vehicle/push/dashboard paths and navigation requests.

```js
// From public/sw.js
const CACHEABLE_PATH_PREFIXES = ["/_next/static/", "/icons/"];
const NETWORK_ONLY_PATH_PREFIXES = ["/api/", "/api/auth/", "/api/vehicle/", "/api/push/", "/dashboard"];
```

### Dark Theme Is Locked

The layout starts in dark mode and `next-themes` disables system theme switching.

```tsx
// From src/components/theme-provider.tsx
<NextThemesProvider attribute="class" defaultTheme="dark" enableSystem={false}>
  {children}
</NextThemesProvider>
```

### UI Primitives Use `cn`

Shared primitives merge variants and Tailwind classes through `cn`.

```tsx
// From src/components/ui/button.tsx
className={cn(buttonVariants({ variant, size, className }))}
```

---

## Decision Trees

### Changing Service Worker Behavior

1. Keep authenticated and dynamic data network-only.
2. Add only static, same-origin, GET assets to cacheable prefixes.
3. Keep `/sw.js` response headers no-store in `next.config.ts`.
4. Verify push event handling still opens or focuses `/`.

---

## Critical Rules

- ALWAYS keep service worker caching static-only.
- NEVER cache navigations or authenticated API responses.
- ALWAYS keep service worker registration failure non-fatal.
- ALWAYS preserve App Router metadata/manifest patterns when changing PWA config.
- PREFER existing shadcn-style primitives and `cn()` for class merging.
- NEVER introduce client hooks into Server Components unless the file has `"use client"`.

---

## Testing

- **Framework**: none configured.
- **Location**: no UI/PWA tests detected.
- **Naming**: none detected.
- **Run**: `npm run lint`.

---

## Commands

```bash
# Lint UI/PWA changes
npm run lint

# Run app locally
npm run dev
```

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/app/layout.tsx` | Global metadata, font variables, service worker registration, theme provider. |
| `src/app/manifest.ts` | PWA manifest and app icons. |
| `src/components/service-worker-registration.tsx` | Browser service worker registration. |
| `public/sw.js` | Static cache, push notification handling, notification click focus/open behavior. |
| `next.config.ts` | `/sw.js` headers: JavaScript content type, no-store, CSP. |
| `src/app/globals.css` | Tailwind 4 import, theme tokens, animations, reduced-motion handling. |
