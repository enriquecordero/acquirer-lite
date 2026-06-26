---
applyTo: "api/**"
---

# API Layer Instructions

- **.NET 10 / C# 13** — use latest language features (primary constructors, collection expressions, etc.)
- **EF Core** — use `DbContext` with fluent configuration, no data annotations on models
- **Native DI** — constructor injection via primary constructors, register services in `Program.cs`
- **Serilog** — structured logging, use `ILogger<T>` interface
- Use **Microsoft Learn MCP** (`microsoft_docs_search`) to verify current ASP.NET Core / EF Core APIs
- Controllers return DTOs (`record` types), never entities directly
- All monetary amounts: `decimal` with `HasPrecision(18, 2)`
- **Security:** never expose raw `CardTokenRef` — mask as `tok_••XX`
