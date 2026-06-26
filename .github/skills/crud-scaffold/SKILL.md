# CRUD Scaffold Skill

Generates a complete CRUD for a given entity across all layers.

## Usage
"Scaffold CRUD for [Entity]"

## Steps
1. Create/verify SQL table in `db/` with proper constraints
2. Create EF Core model in `api/Models/`
3. Add `DbSet` to `AcquirerDbContext`
4. Create controller with GET (list + detail), POST, PUT endpoints in `api/Controllers/`
5. Create DTOs as `record` types
6. Create Angular service method in `client/src/app/services/api.service.ts`
7. Create list + detail standalone components with signals and `@for`/`@if`
8. Add lazy-loaded route in `app.routes.ts`

## Rules
- Mask any token fields in API responses
- Use Angular signals, standalone components, `inject()`
- Follow naming conventions from instructions
