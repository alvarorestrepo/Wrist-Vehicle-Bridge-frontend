---
name: wrist-vehicle-bridge-frontend-vehicle
description: >
  Deep knowledge for the Tesla vehicle module of Wrist Vehicle Bridge Frontend.
  Trigger: When working on vehicle status, vehicle commands, Tesla backend calls,
  `src/features/vehicle/`, or vehicle schemas/actions/components.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "Working on vehicle code"
    - "Creating or modifying files in src/features/vehicle/"
    - "Debugging Tesla backend status or command issues"
allowed-tools: Read, Glob, Grep
---

## Purpose

Use this skill for Tesla backend integration, status loading, command execution, and command UI safety.

---

## Directory Structure

```
src/features/vehicle/
├── components/
│   ├── placeholder-vehicle-card.tsx
│   ├── sensitive-command-confirmation.tsx
│   ├── vehicle-action-grid.tsx
│   ├── vehicle-hero.tsx
│   └── vehicle-status-card.tsx
└── server/
    ├── actions.ts             # Session-guarded Server Actions
    ├── client.ts              # server-only Tesla backend client
    ├── index.ts               # server-only exports
    └── schemas.ts             # Strict Zod backend contracts
```

---

## Key Patterns

### Server-only Backend Client

The token is only read inside server-only code; all fetches are no-store and timeout guarded.

```ts
// From src/features/vehicle/server/client.ts
response = await fetch(url, {
  ...init,
  headers: {
    Authorization: `Bearer ${TESLA_CLIENT_API_TOKEN}`,
    Accept: "application/json",
  },
  cache: "no-store",
  signal: controller.signal,
});
```

### Strict Response Schemas

Backend response shapes are Zod unions, not loose TypeScript guesses.

```ts
// From src/features/vehicle/server/schemas.ts
export const vehicleStatusSchema = z.union([
  vehicleStatusSuccessSchema,
  vehicleStatusUnavailableSchema,
]);
```

### Session-Guarded Server Actions

Every private action requires an authenticated session before backend access.

```ts
// From src/features/vehicle/server/actions.ts
async function requireSession() {
  const session = await auth();

  if (!session?.user) {
    throw new Error("Unauthorized");
  }
}
```

### Sensitive Command Confirmation

Unlock, frunk, and trunk are flagged sensitive and open a confirmation flow.

```tsx
// From src/features/vehicle/components/vehicle-action-grid.tsx
const sensitiveCommandLabels = {
  unlock: "Unlock",
  openFrunk: "Open Frunk",
  openTrunk: "Open Trunk",
} as const satisfies Partial<Record<EnabledCommand, string>>;
```

---

## Decision Trees

### Adding a Vehicle Command

1. Add the backend command literal in `server/schemas.ts`.
2. Add the frontend command mapping in `vehicleCommandEndpointMap`.
3. Add it to `enabledVehicleCommandSchema` in `server/actions.ts`.
4. Add a button entry in `vehicle-action-grid.tsx`.
5. If the command can physically affect the vehicle, add it to `sensitiveCommandLabels`.

---

## Critical Rules

- ALWAYS keep vehicle backend clients under `server/` with `import "server-only"`.
- ALWAYS use `Authorization: Bearer ${TESLA_CLIENT_API_TOKEN}` only in server-only code.
- ALWAYS use `cache: "no-store"` for vehicle status and command requests.
- ALWAYS validate command inputs with `enabledVehicleCommandSchema` before calling the backend.
- NEVER auto-retry a command when status is `waking`; UI tells the user to retry later.
- NEVER add a physically sensitive command without confirmation UX.

---

## Testing

- **Framework**: none configured.
- **Location**: no vehicle tests detected.
- **Naming**: none detected.
- **Run**: `npm run lint`.

---

## Commands

```bash
# Lint vehicle changes
npm run lint

# Run app locally
npm run dev
```

---

## Key Files

| File | Purpose |
| ---- | ------- |
| `src/features/vehicle/server/client.ts` | Tesla backend request wrapper, error normalization, command endpoint map. |
| `src/features/vehicle/server/actions.ts` | Authenticated status refresh and command execution actions. |
| `src/features/vehicle/server/schemas.ts` | Zod schemas for status, command results, known API errors. |
| `src/features/vehicle/components/vehicle-status-card.tsx` | Server Component that displays live vehicle status or safe errors. |
| `src/features/vehicle/components/vehicle-action-grid.tsx` | Client command grid and command result presentation. |
| `src/features/vehicle/components/sensitive-command-confirmation.tsx` | Dialog/countdown confirmation for live sensitive commands. |
