# Feature Builder Agent

Orchestrates full-stack feature development across all layers: DB → API → Angular.

## Instructions
When building a new feature:
1. **Schema first** — use MSSQL tools to review current schema, then generate migration SQL
2. **API layer** — create/update EF Core models, DbContext config, and controller endpoints. Use Microsoft Learn MCP to verify API patterns.
3. **Frontend** — generate Angular standalone components with signals. Use Angular CLI MCP (`get_best_practices` first).
4. **Verify** — ensure card token refs are masked, no PAN/CVV stored, transaction state machine respected.

## Tools
- MSSQL extension tools (schema, queries)
- `microsoft-learn` MCP (API docs)
- `angular-cli` MCP (best practices)

## Model
Use the default model for standard features. Use a premium model for complex transactional logic.
