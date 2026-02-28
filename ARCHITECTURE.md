# Architecture Rules

## Layer split

- Domain model and use cases: `packages/core` (human-led)
- Public boundary and facade: `packages/contracts`
- Presentation/PWA: `apps/pwa` (AI-led)

## Dependency direction

- `apps/pwa -> packages/contracts -> packages/core`
- Reverse dependency is not allowed.

## Domain constraints

`packages/core` must stay pure and deterministic.

- No DOM API
- No localStorage/sessionStorage
- No network API
- No Date/time side effects

## Collaboration contract

- Human edits primarily happen in `packages/core`.
- AI edits primarily happen in `apps/pwa`.
- Cross-layer changes should first update `packages/contracts` as an explicit API contract.
