# AcquirerLite — Workshop Full-stack con Copilot

Workshop de 3 días: Angular + .NET + SQL Server, usando GitHub Copilot con context engineering.

**Audiencia:** equipo PayStudio (Evertec)
**Tesis:** *el contexto es el producto* — Copilot escribe código full-stack correcto solo cuando ve el esquema, los docs vigentes y las reglas del equipo.

## La app

Un mini-acquirer: comercios, terminales, transacciones y liquidación por batch. Espejo simplificado del dominio de PayStudio.

> **Regla de diseño:** la app **nunca** almacena PAN, CVV ni datos del tarjetahabiente. Solo `CardTokenRef` (token/referencia). Secure-by-design.

### Stack

| Capa | Tecnología |
|------|-----------|
| Backend | .NET 10 / C# 13, ASP.NET Core, EF Core, Serilog |
| Frontend | Angular 19 (standalone, signals, `@if`/`@for`, typed forms) |
| Datos | SQL Server 2022 en contenedor |

### Esquema

```
Merchants 1──* Terminals
    │ 1              │ 1
    │ *              │ *
    └───── Transactions ─────┘
              │ * (BatchId nullable)
              ▼ 1
       SettlementBatches
```

**Máquina de estados:** Authorized → Captured → Settled (vía batch) | Voided | Refunded

## Pre-requisitos

- [ ] macOS con [container CLI](https://developer.apple.com/documentation/containerization) (`brew install container`) o Docker Desktop
- [ ] VS Code + extensión Dev Containers
- [ ] .NET 10 SDK (`brew install dotnet`)
- [ ] Node.js 22+ (`brew install node`)
- [ ] Licencia de GitHub Copilot activa

## Setup rápido

### 1. SQL Server

```bash
# Con container CLI nativo de macOS (ARM + Rosetta)
container run --name acquirer-mssql -d -p 1433:1433 -m 2048M \
  --arch amd64 --rosetta \
  -e ACCEPT_EULA=Y -e "MSSQL_SA_PASSWORD=Workshop!Pass123" \
  mcr.microsoft.com/mssql/server:2022-latest

# Esperar a que esté listo
container exec acquirer-mssql /opt/mssql-tools18/bin/sqlcmd \
  -S localhost -U sa -P "Workshop!Pass123" -C -Q "SELECT 1"
```

### 2. Seed de la base de datos

```bash
bash scripts/seed-db.sh
```

### 3. API (.NET)

```bash
cd api
dotnet restore
ASPNETCORE_ENVIRONMENT=Development dotnet run
# → http://localhost:5100
```

### 4. Frontend (Angular)

```bash
cd client
npm install
npm start
# → http://localhost:4200 (proxy a API en :5100)
```

## Estructura del repo

```
acquirer-lite/
├── .devcontainer/          # Dev Container config (VS Code)
│   ├── devcontainer.json
│   └── docker-compose.yml
├── .github/
│   ├── copilot-instructions.md    # Día 1: instrucciones globales
│   ├── instructions/              # Día 2: instrucciones por costura
│   │   ├── api.instructions.md
│   │   ├── client.instructions.md
│   │   └── db.instructions.md
│   ├── agents/                    # Día 3: custom agents
│   │   ├── feature-builder.agent.md
│   │   └── payments-reviewer.agent.md
│   ├── skills/                    # Día 3: agent skills
│   │   └── crud-scaffold/SKILL.md
│   └── hooks/                     # Día 3: hooks deterministas
│       ├── block-destructive-sql.json
│       └── format-on-save.json
├── .vscode/
│   └── mcp.json                   # MCPs: Angular CLI, Learn, NuGet
├── api/                           # .NET 10 API
│   ├── Controllers/
│   ├── Models/
│   ├── Data/
│   └── Program.cs
├── client/                        # Angular 19
│   └── src/app/
├── db/
│   └── seed.sql                   # Schema + data sandbox
└── scripts/
    ├── start-mssql.sh
    └── seed-db.sh
```

## Arco del workshop

| Día | Capa del harness | Vitrina |
|-----|------------------|---------|
| 1 | Entorno + `copilot-instructions.md` | Copilot lee el esquema del contenedor |
| 2 | Instructions por costura + MCPs | Feature "liquidar batch" full-stack |
| 3 | Custom agents + skills + hooks | Workflow multi-agente con guardrails |

## Ramas

- **`main`** — esqueleto de partida para participantes (TODOs guiados)
- **`solution`** — referencia del instructor con todo implementado

## Endpoints del API

| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | `/api/merchants` | Lista merchants (filtro: `?search=&status=`) |
| GET | `/api/merchants/:id` | Detalle con terminales |
| POST | `/api/merchants` | Crear merchant |
| GET | `/api/transactions?merchantId=` | Transacciones por merchant |
| GET | `/api/batches?merchantId=` | Batches por merchant |
| GET | `/api/batches/:id` | Detalle del batch con transacciones |
| POST | `/api/batches/:id/settle` | **Liquidar batch** *(Día 2 — TODO)* |

## Data sandbox

| Tabla | Registros | Notas |
|-------|-----------|-------|
| Merchants | 3 | M001 Active, M002 Active, M003 Suspended |
| Terminals | 6 | 3 para M001, 1 para M002, 2 para M003 |
| Transactions | 30 | 24 Captured en batch, 3 Authorized, 1 Voided, 1 Declined, 1 Captured sin batch |
| Batches | 2 | 1 Open (para settle), 1 Settled (histórico) |

Todos los `CardTokenRef` son tokens sandbox (`tok_sandbox_*`) — nunca PAN.
