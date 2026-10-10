# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout: single-context

This repo is **single-context**: one shared `CONTEXT.md` at the repo root, and architecture decisions in `docs/adr/`.

```
/
├── CONTEXT.md        ← one shared context doc for the whole repo
├── docs/adr/         ← architecture decisions
└── cmd/, src/, pvl/  ← code
```

There is no `CONTEXT-MAP.md` and no per-subproject `CONTEXT.md`. Those only appear in a multi-context (monorepo) layout, which this repo is not. They get created lazily, if ever, by `/domain-modeling` — not at setup time.

## Before exploring, read these

- **`CONTEXT.md`** at the repo root: the project's shared domain vocabulary and context.
- **`docs/adr/`**: read ADRs that touch the area you're about to work in.

If either doesn't exist yet, **proceed silently**. Don't flag the absence; don't suggest creating them upfront. The `/domain-modeling` skill (reached via `/grill-with-docs` and `/improve-codebase-architecture`) creates them lazily when terms or decisions actually get resolved.

## Use the context doc's vocabulary

When your output names a domain concept (in an issue title, a refactor proposal, a hypothesis, a test name), use the term as defined in `CONTEXT.md`. Don't drift to synonyms it explicitly avoids.

If the concept you need isn't there yet, that's a signal: either you're inventing language the project doesn't use (reconsider), or there's a real gap (note it for `/domain-modeling`).

## Flag ADR conflicts

If your output contradicts an existing ADR, surface it explicitly rather than silently overriding:

> _Contradicts ADR-0007 (…), but worth reopening because…_
