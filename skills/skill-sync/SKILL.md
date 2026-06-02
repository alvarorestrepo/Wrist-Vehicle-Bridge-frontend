---
name: skill-sync
description: >
  Regenerate Auto-invoke Skills tables from generated skill metadata.
  Trigger: After adding, removing, or editing skills under `skills/`.
license: MIT
metadata:
  author: user
  version: "1.1.2"
  scope: [root]
  generated_by: project-knowledge-bootstrap
  generated_at: "2026-06-02T00:00:00Z"
  source_version: "1.1.2"
  auto_invoke:
    - "Syncing skill metadata"
    - "Adding or editing skills"
allowed-tools: Bash, Read, Glob, Grep
---

## Purpose

Use this skill to keep `AGENTS.md` Auto-invoke Skills sections synchronized with `metadata.auto_invoke` entries in `skills/*/SKILL.md`.

## Command

```bash
./skills/skill-sync/assets/sync.sh
```

## Notes

- The sync script is idempotent.
- Scope `root` maps to the root `AGENTS.md` in this single-app repository.
- Generated Auto-invoke sections should not be edited manually.
