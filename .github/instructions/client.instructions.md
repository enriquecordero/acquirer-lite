---
applyTo: "client/**"
---

# Client Layer Instructions

- **Angular 19** — standalone components, NO NgModules
- Use `inject()` function, NOT constructor injection
- **Signals** for reactive state (`signal()`, `computed()`)
- **Control flow:** `@if`, `@for`, `@switch` — never `*ngIf`, `*ngFor`
- Lazy-load routes via `loadComponent`
- Use **Angular CLI MCP** — call `get_best_practices` before generating Angular code
- Typed reactive forms where applicable
- Card refs displayed masked: `tok_••XX`
