# Workshop: Full-stack con Copilot — Angular + .NET + SQL en contenedor

## Tabla de Contenidos

- [Introduccion](#introduccion)
- [Conceptos Clave de GitHub Copilot](#conceptos-clave-de-github-copilot)
- [Pre-requisitos](#%EF%B8%8F-pre-requisitos)
- [Agenda del Workshop](#-agenda-del-workshop)
- [Dia 1 Ejercicio 1: Levantar el Entorno Contenedorizado](#-dia-1-ejercicio-1-levantar-el-entorno-contenedorizado)
- [Dia 1 Ejercicio 2: El Piso Gratis y copilot-instructions](#-dia-1-ejercicio-2-el-piso-gratis-y-copilot-instructions)
- [Dia 2 Ejercicio 3: Instructions por Costura y MCPs](#-dia-2-ejercicio-3-instructions-por-costura-y-mcps)
- [Dia 2 Ejercicio 4: Construir "Liquidar Batch" Full-stack](#-dia-2-ejercicio-4-construir-liquidar-batch-full-stack)
- [Dia 3 Ejercicio 5: Custom Agents y Handoffs](#-dia-3-ejercicio-5-custom-agents-y-handoffs)
- [Dia 3 Ejercicio 6: Skills, Hooks y Disciplina de Costo](#-dia-3-ejercicio-6-skills-hooks-y-disciplina-de-costo)
- [Referencia Rapida](#-referencia-rapida)
- [Troubleshooting](#-troubleshooting)
- [Recursos Adicionales](#-recursos-adicionales)

---

## Introduccion

Este workshop practico de **3 dias** tiene dos objetivos:

1. **Hacer a Copilot consciente del esquema, las convenciones y las reglas del equipo** para que genere codigo full-stack correcto desde el primer intento
2. **Construir un feature real** ("liquidar batch") de punta a punta — SQL → .NET API → Angular — usando ese contexto

> **La idea central:** *El contexto es el producto.* Copilot escribe codigo full-stack correcto solo cuando ve el esquema de la base, los docs vigentes y las reglas del equipo. Sin eso, adivina.

### Aprenderas a:

- Conectar Copilot al esquema real de SQL Server via la extension MSSQL
- Crear instrucciones por capa (`.instructions.md`) que se activan segun el archivo que editas
- Usar MCPs (Angular CLI, Microsoft Learn, NuGet, MSSQL) para que Copilot consulte docs actuales
- Crear Custom Agents que orquesten features multi-capa
- Crear Skills para workflows repetibles (scaffold CRUD)
- Crear Hooks deterministas que bloqueen SQL destructivo y formateen codigo
- **Usar todo lo anterior para construir la liquidacion de un batch** — la operacion estrella del dominio acquiring

### La App: AcquirerLite

Un mini-acquirer: comercios, terminales, transacciones y liquidacion por batch. Espejo simplificado del dominio de PayStudio — reconocible para el equipo, pero claramente un juguete de ensenanza.

> **Regla de diseno (y punto de ensenanza):** la app **nunca** almacena PAN, CVV ni datos del tarjetahabiente. Solo un `CardTokenRef` (token/referencia). Es exactamente como un sistema PCI-compliant tokeniza — asi que el ejemplo ensena *secure-by-design*, no malas practicas.

### Stack

| Capa | Tecnologia |
|------|-----------|
| Backend | .NET 10 / C# 13, ASP.NET Core (controllers), EF Core, Serilog |
| Frontend | Angular 19 (standalone, signals, `inject()`, `@if`/`@for`) |
| Datos | SQL Server 2022 en contenedor |

### Esquema de la Base de Datos

```
Merchants 1──* Terminals
    │ 1              │ 1
    │ *              │ *
    └───── Transactions ─────┘
              │ * (BatchId nullable)
              ▼ 1
       SettlementBatches
```

| Tabla | Campos clave | Ensena |
|-------|-------------|--------|
| `Merchants` | Id, LegalName, MerchantCode (unique), Status (Active/Suspended/Closed) | Unique + enum |
| `Terminals` | Id, MerchantId (FK), TerminalCode (unique), Status | FK + unique |
| `Transactions` | Id, MerchantId, TerminalId, Amount, **CardTokenRef (token, NO PAN)**, AuthCode, Status, BatchId (nullable) | FK + enum + tokenizacion |
| `SettlementBatches` | Id, MerchantId, BatchDate, Status (Open/Settled), TotalAmount, SettledAt | Agregado + maquina de estados |

### Maquina de Estados

```
Authorized → Captured → Settled (via batch)
                ↓
              Voided

Settled → Refunded
```

### Operacion Estrella: "Liquidar un Batch"

Toma las transacciones `Captured` de un comercio en un batch abierto, las suma, marca el batch `Settled`, asocia las transacciones y calcula `TotalAmount` — todo en una transaccion de DB. Es el caso que demuestra a Copilot generando logica transaccional coherente de DB → EF Core → API → Angular.

### Arquitectura

```
┌─ VS Code ────────────────────────────────────────────────────────┐
│                                                                   │
│   GitHub Copilot   (inline · NES · chat · agent mode)             │
│        │ lee                                                      │
│        ▼                                                          │
│   .github/ + .vscode/   ──── HARNESS ────                         │
│     copilot-instructions.md                                       │
│     instructions/{api,client,db}.instructions.md                  │
│     agents/*.agent.md · skills/*/SKILL.md · hooks/*.json          │
│        │ MCP                                                      │
│        ├──▶ angular-cli      (npx @angular/cli mcp)               │
│        ├──▶ microsoft-learn  (HTTP · learn.microsoft.com)         │
│        ├──▶ nuget            (dnx NuGet.Mcp.Server)               │
│        └──▶ MSSQL extension ──────────────┐  (schema-aware)       │
│                                           │                       │
└───────────────────────────────────────────┼───────────────────────┘
                                            │
┌─ Contenedor SQL ──────────────────────────┼───────────────────────┐
│  DB AcquirerLite:                         │                       │
│    Merchants · Terminals · Transactions · SettlementBatches       │
│    CardTokenRef = token   (NUNCA PAN / CVV)                       │
└───────────────────────────────────────────────────────────────────┘
```

> **Las dos flechas hacia SQL** son el punto pedagogico: EF Core (la app consume datos) y la extension MSSQL (Copilot lee el esquema). Esa segunda flecha justifica el contenedor.

---

## Conceptos Clave de GitHub Copilot

### Modos de GitHub Copilot Chat

| Modo | Funcion | Cuando usarlo |
|------|---------|--------------|
| **Ask** | Solo responde, NO modifica archivos | Explorar, entender, planificar |
| **Agent** | PUEDE crear y modificar archivos | Implementar, crear codigo |

### El Piso Gratis (no consume AI Credits)

| Funcion | Que hace | Shortcut |
|---------|----------|----------|
| **Inline completions** | Autocompleta mientras escribes | `Tab` para aceptar |
| **NES** (Next Edit Suggestions) | Propaga cambios a archivos relacionados | `Tab` → `Tab` |

> **Estos dos representan ~70% del valor diario** y son totalmente gratis.

### Herramientas que consumen AI Credits

| Funcion | Que hace | Shortcut |
|---------|----------|----------|
| **Inline chat** | Refactoring en contexto | `Cmd+I` |
| **Chat panel** | Conversacion con contexto del proyecto | `Cmd+Shift+I` |
| **Agent mode** | Crea/modifica archivos, usa tools | Chat → Agent |

### Comandos Especiales

| Comando | Descripcion |
|---------|-------------|
| `/init` | Genera `copilot-instructions.md` inicial |
| `/tests` | Genera pruebas unitarias |
| `/doc` | Genera documentacion |
| `/fix` | Propone correccion de errores |
| `/explain` | Explica codigo seleccionado |

### MCPs (Model Context Protocol)

Los MCPs le dan a Copilot acceso a fuentes de datos externas:

| MCP | Que aporta | Mata |
|-----|-----------|------|
| **Angular CLI** | `get_best_practices`, `search_documentation`, `modernize` | Angular de 2021 (NgModules, `*ngIf`) |
| **Microsoft Learn** | `microsoft_docs_search`, `microsoft_docs_fetch` | .NET stale (no conoce APIs actuales) |
| **NuGet** | Detecta vulnerabilidades, actualiza por grafo de deps | Paquetes vulnerables |
| **MSSQL Extension** | Esquema real, queries, deteccion SQL injection | Copilot adivinando el esquema |

---

## Pre-requisitos

### Software Necesario

```bash
dotnet --info           # .NET 10 SDK
node --version          # 22 o superior
code --version          # Visual Studio Code
git --version
container --version     # macOS native (o Docker Desktop)
```

### Extensiones de VS Code

**Requeridas:**
- **GitHub Copilot** (`github.copilot`)
- **GitHub Copilot Chat** (`github.copilot-chat`)
- **MSSQL** (`ms-mssql.mssql`)
- **C# Dev Kit** (`ms-dotnettools.csdevkit`)
- **Angular Language Service** (`Angular.ng-template`)

**Instalacion rapida:**

```bash
code --install-extension github.copilot
code --install-extension github.copilot-chat
code --install-extension ms-mssql.mssql
code --install-extension ms-dotnettools.csdevkit
code --install-extension Angular.ng-template
```

### Acceso

- Cuenta GitHub con licencia de Copilot activa
- Clon del repositorio con SQL Server corriendo

---

## Agenda del Workshop

### Dia 1 — Entorno, el piso gratis y el "aha" del esquema

| Hora | Bloque | Actividad | Modo Copilot |
|------|--------|-----------|--------------|
| 9:00 | Orientacion | Arquitectura, por que dos flechas a SQL | - |
| 9:15 | Ejercicio 1.1 | Levantar contenedor SQL Server | Terminal |
| 10:00 | Ejercicio 1.2 | Conectar extension MSSQL + seedear | MSSQL |
| 10:30 | Ejercicio 1.3 | **El "aha"**: Copilot lee el esquema real | Agent |
| 11:00 | *Almuerzo* | | |
| 12:00 | Ejercicio 2.1 | Inline completions y NES sobre AcquirerLite | Tab |
| 12:30 | Ejercicio 2.2 | Demo "antes": pedir feature SIN instrucciones | Agent |
| 13:00 | Ejercicio 2.3 | `/init` → `copilot-instructions.md` + ajustar | Agent |
| 13:40 | Ejercicio 2.4 | Demo "despues": repetir el mismo pedido | Agent |

### Dia 2 — Context engineering por costura + el loop full-stack

| Hora | Bloque | Actividad | Modo Copilot |
|------|--------|-----------|--------------|
| 9:00 | Ejercicio 3.1 | Crear `api.instructions.md` | Agent |
| 9:25 | Ejercicio 3.2 | Crear `client.instructions.md` | Agent |
| 9:50 | Ejercicio 3.3 | Crear `db.instructions.md` | Agent |
| 10:15 | Ejercicio 3.4 | Antes/despues por costura (demo contrastante) | Agent |
| 11:00 | *Almuerzo* | | |
| 12:00 | Ejercicio 4.1 | Explorar esquema con MSSQL Agent | Agent + MSSQL |
| 12:15 | Ejercicio 4.2 | Implementar endpoint `POST settle` en API | Agent |
| 12:50 | Ejercicio 4.3 | Implementar `settleBatch()` en Angular service | Agent |
| 13:05 | Ejercicio 4.4 | Implementar componente `batch-settle` | Agent |
| 13:45 | Ejercicio 4.5 | Probar end-to-end + revision de seguridad | Agent + MSSQL |

### Dia 3 — Custom agents, skills, hooks y costo

| Hora | Bloque | Actividad | Modo Copilot |
|------|--------|-----------|--------------|
| 9:00 | Ejercicio 5.1 | Crear agent `feature-builder` | Agent |
| 10:00 | Ejercicio 5.2 | Crear agent `payments-reviewer` + handoff | Agent |
| 11:00 | *Almuerzo* | | |
| 12:00 | Ejercicio 6.1 | Crear skill `crud-scaffold` | Agent |
| 13:00 | Ejercicio 6.2 | Crear hooks (block-sql + format-on-save) | Agent |
| 13:45 | Ejercicio 6.3 | Disciplina de costo + cierre | - |

---

## Dia 1 Ejercicio 1: Levantar el Entorno Contenedorizado

> **Objetivo:** SQL Server corriendo en contenedor, extension MSSQL conectada, y Copilot consciente del esquema real.

---

### Paso 1.1: Clonar el repo y levantar SQL Server

```bash
git clone https://github.com/enriquecordero/acquirer-lite.git
cd acquirer-lite

# Levantar SQL Server en contenedor
bash scripts/start-mssql.sh
```

**Que esperar:** El script descarga la imagen (~700MB la primera vez), crea el contenedor con Rosetta (ARM → x86), y espera a que SQL Server responda. Al final veras:

```
✓ SQL Server is ready on port 1433
```

> **Si usas Docker Desktop** en vez del container CLI nativo, el mismo script funciona — solo cambia `container` por `docker` en los comandos.

---

### Paso 1.2: Seedear la base de datos

```bash
bash scripts/seed-db.sh
```

**Que esperar:**
```
✓ Database seeded successfully
```

Esto crea la base `AcquirerLite` con 4 tablas, 3 merchants, 6 terminales, 30 transacciones y 2 batches de prueba.

---

### Paso 1.3: Conectar la extension MSSQL

1. Abre VS Code en la carpeta del proyecto: `code .`
2. Abre la extension MSSQL (icono de base de datos en la barra lateral)
3. Click en **"Add Connection"** y configura:

| Campo | Valor |
|-------|-------|
| Server | `localhost,1433` |
| Authentication | SQL Login |
| User | `sa` |
| Password | `Workshop!Pass123` |
| Trust Server Certificate | Yes |
| Database | `AcquirerLite` |

4. Expande el arbol de tablas — debes ver: **Merchants, Terminals, Transactions, SettlementBatches**

> **Checkpoint:** Si ves las 4 tablas en el arbol, estas bien. Si no, el seed fallo — re-ejecuta `bash scripts/seed-db.sh`.

---

### Paso 1.4: El "aha" — Copilot lee el esquema real

**Este es el momento mas importante del Dia 1.**

Abre Copilot Chat en **Agent Mode** (`Cmd+Shift+I` o panel de chat → Agent) y pega:

```
Describe el esquema de esta base de datos, el flujo de una transaccion
desde autorizacion hasta liquidacion, y como se cierra un batch.
```

**Pausa.** Lee la respuesta de Copilot. Preguntate: *¿Como supo las tablas que tenemos? ¿Las adivino?*

La respuesta: **las leyo del contenedor via la extension MSSQL.**

**Demo contrastante (opcional pero poderosa):**

1. Desconecta el connection profile MSSQL (click derecho → Disconnect)
2. Haz la misma pregunta → Copilot inventa tablas genericas
3. Reconecta → la respuesta ahora es precisa

> **Momento wow:** Sin el esquema, Copilot adivina. Con el esquema del contenedor, Copilot sabe. Esa es la diferencia entre codigo generico y codigo que funciona para *nosotros*.

---

### Paso 1.5: Levantar la app (API + Angular)

Abre dos terminales:

**Terminal 1 — API (.NET):**

```bash
cd api
dotnet restore
ASPNETCORE_ENVIRONMENT=Development dotnet run
```

Espera a ver: `Now listening on: http://localhost:5100`

**Terminal 2 — Frontend (Angular):**

```bash
cd client
npm install
npm start
```

Espera a ver: `Compiled successfully`

**Verificar:** Abre `http://localhost:4200` en el browser. Debes ver la lista de 3 merchants (Cafe Rivera SRL, Tienda Pocitos, Bazar Centro).

---

## Dia 1 Ejercicio 2: El Piso Gratis y copilot-instructions

> **Objetivo:** Experimentar inline completions/NES (gratis) y crear las instrucciones globales del proyecto.

---

### Paso 2.1: Inline Completions y NES (el 70% gratis)

**Inline completions (15 min):**

1. Abre `api/Controllers/MerchantsController.cs`
2. Al final de la clase, antes del `}`, empieza a escribir:
   ```csharp
   [HttpPut("{id:int}")]
   public async Task<ActionResult>
   ```
3. Copilot deberia completar el metodo. Presiona `Tab` para aceptar.

**NES — Next Edit Suggestions (15 min):**

1. Abre `api/Models/Merchant.cs`
2. Agrega una propiedad nueva:
   ```csharp
   public string Email { get; set; } = string.Empty;
   ```
3. Presiona `Tab` repetidamente — Copilot deberia propagar el cambio al DbContext, al DTO del controller, etc.

> **Punto clave:** Todo esto es gratis. No consume AI Credits. Si hoy solo te llevas esto, ya estas produciendo mas.

**Deshaz todos los cambios** (`Cmd+Z` en cada archivo) antes de continuar.

---

### Paso 2.2: Demo "Antes" — Sin instrucciones

> **Guardamos el resultado para comparar despues.**

**PROMPT en Agent Mode:**

```
Crea un endpoint GET /api/transactions que liste las transacciones
de un merchant, con filtro opcional por status. Incluye un DTO
para la respuesta.
```

**Observa y anota:**
- ¿Usa `record` para el DTO o una `class`?
- ¿Enmascara el `CardTokenRef`?
- ¿Incluye `JsonStringEnumConverter` para los enums?
- ¿Referencia el esquema real de la base?

> **Spoiler:** Probablemente genera algo generico. Guardalo — al final del ejercicio vamos a comparar.

**Deshaz los cambios** antes de continuar.

---

### Paso 2.3: /init → copilot-instructions.md

Ahora le ensenamos a Copilot quien somos.

**Paso A — Generar el archivo inicial:**

En Copilot Chat: `/init`

Copilot genera un `copilot-instructions.md`. Leelo — probablemente es generico.

**Paso B — Ajustar con el contexto real:**

El archivo generado necesita incluir nuestro dominio. Usa este prompt para mejorarlo:

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Reescribe .github/copilot-instructions.md con las instrucciones
reales del proyecto. Analiza el codigo existente e incluye:

# Proyecto
- AcquirerLite: mini-acquirer (comercios, terminales, transacciones, batches)
- Dominio: acquiring (procesamiento de pagos con tarjeta)
- Esqueleto funcional para workshop — no es produccion

# Stack
- Backend: .NET 10 / C# 13, ASP.NET Core (controllers), EF Core, Serilog
- Frontend: Angular 19 (standalone components, signals, inject(), @if/@for)
- Datos: SQL Server 2022 en contenedor
- MCPs: Angular CLI, Microsoft Learn, NuGet, extension MSSQL

# Seguridad — REGLA DURA
- NUNCA almacenar PAN, CVV, ni datos del tarjetahabiente
- Solo CardTokenRef (token/referencia)
- En respuestas de API: enmascarar como tok_••XX (ultimos 2 chars)
- Esta regla NO es negociable

# Dominio
- Maquina de estados: Authorized → Captured → Settled (via batch) | Voided | Refunded
- Operacion estrella: liquidar batch (sumar Captured, marcar Settled, calcular total)
- Entidades: Merchant, Terminal, Transaction, SettlementBatch

# Convenciones
- DTOs como record (no class)
- Enums serializados como string (JsonStringEnumConverter)
- Collection expressions [] en vez de new List<T>()
- Primary constructors donde aplique
- EF Core: Fluent API (no data annotations), unique indexes, enum-to-string
- Angular: standalone, signals, inject(), @if/@for, nunca NgModule/*ngIf/*ngFor
- Usar MCPs: Learn MCP para .NET actual, Angular CLI MCP para best practices
```

**Revisa el resultado** — debe cubrir stack, dominio, seguridad y convenciones.

---

### Paso 2.4: Demo "Despues" — Con instrucciones

Ahora repetimos **exactamente el mismo prompt** del Paso 2.2:

```
Crea un endpoint GET /api/transactions que liste las transacciones
de un merchant, con filtro opcional por status. Incluye un DTO
para la respuesta.
```

**Compara con el resultado del Paso 2.2.** Ahora Copilot deberia:
- Usar `record` para el DTO (por las convenciones)
- Enmascarar `CardTokenRef` como `tok_••XX` (por la regla de seguridad)
- Usar `JsonStringEnumConverter` (por las convenciones)
- Referenciar el esquema real de la base (por la extension MSSQL)

> **Momento wow:** El mismo prompt, resultados completamente diferentes. Eso es lo que las instrucciones hacen por el equipo, sin esfuerzo extra en cada prompt.

**Deshaz los cambios** antes de pasar al Dia 2.

**Entregable del Dia 1:** entorno funcionando + `copilot-instructions.md` ajustado al proyecto.

---

## Dia 2 Ejercicio 3: Instructions por Costura y MCPs

> **Objetivo:** Instrucciones que se activan automaticamente segun la capa que editas, cableadas a los MCPs.

---

### Paso 3.1: Crear api.instructions.md

Las instrucciones por costura se activan **automaticamente** cuando editas un archivo que matchea el glob `applyTo`.

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea el archivo .github/instructions/api.instructions.md con:

---
applyTo: "api/**"
---

# API Layer — Convenciones .NET 10 / C# 13

## Stack
- .NET 10, C# 13, ASP.NET Core controllers, EF Core, Serilog
- Usar Microsoft Learn MCP (microsoft_docs_search) para verificar APIs vigentes

## Patrones obligatorios
- DTOs como record, nunca class
- Primary constructors en controllers y servicios
- Collection expressions [] en vez de new List<T>() o new T[] {}
- Global usings en el proyecto (no repetir using System.Linq, etc.)
- async/await en toda operacion de DB

## EF Core
- Fluent API en OnModelCreating (no data annotations)
- Unique indexes para codes (MerchantCode, TerminalCode)
- Enum-to-string conversion con HasConversion<string>()
- Include con filtros (.Where) para cargas selectivas
- Transacciones explicitas con BeginTransactionAsync para operaciones multi-tabla

## Seguridad — REGLA DURA
- CardTokenRef NUNCA se expone sin mascara
- Metodo MaskToken(): tok_••{ultimos 2 chars}
- Aplicar en TODOS los endpoints que devuelvan transacciones
- Sin excepciones

## API Design
- Enums serializados como string (JsonStringEnumConverter ya configurado)
- Filtros opcionales via query params (?status=, ?search=)
- 400 para validaciones de negocio (batch ya settled, sin transacciones)
- 404 para entidades no encontradas
- Logging con Serilog (ya configurado en Program.cs)
```

---

### Paso 3.2: Crear client.instructions.md

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea el archivo .github/instructions/client.instructions.md con:

---
applyTo: "client/**"
---

# Client Layer — Angular 19 Moderno

## Stack
- Angular 19 con standalone components (NUNCA NgModule)
- Usar Angular CLI MCP: llamar get_best_practices PRIMERO antes de generar

## Patrones obligatorios
- Standalone components siempre (standalone: true en @Component)
- Signals para estado reactivo: signal(), computed(), effect()
- inject() para DI (NUNCA constructor injection)
- Control flow moderno: @if/@for/@switch (NUNCA *ngIf, *ngFor, *ngSwitch)
- Imports explicitos en el array imports del componente

## Formularios
- FormsModule para formularios simples
- ReactiveFormsModule con typed forms para formularios complejos

## Servicio HTTP
- HttpClient via inject()
- Tipar respuestas con interfaces
- Usar HttpParams para query parameters

## Seguridad — Card refs siempre enmascarados
- El API ya devuelve CardTokenRef enmascarado (tok_••XX)
- Mostrar tal cual — nunca intentar desenmascarar
- Verificar visualmente en la UI que aparece enmascarado

## Estilos
- Usar variables CSS definidas en styles.css
- Clases utilitarias: .btn, .card, .badge, .table existentes
- Responsive: considerar mobile en layouts de tabla
```

---

### Paso 3.3: Crear db.instructions.md

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea el archivo .github/instructions/db.instructions.md con:

---
applyTo: "db/**"
---

# Database Layer — SQL Server / T-SQL

## Convenciones
- PascalCase para tablas y columnas
- NVARCHAR para cualquier campo con texto unicode
- CHECK constraints para columnas tipo enum (Status IN ('Active','Suspended','Closed'))
- Foreign keys con ON DELETE CASCADE solo si es intencional
- Indexes en foreign keys y columnas de busqueda frecuente

## REGLA DURA — Seguridad de datos
- NINGUNA columna almacena PAN, CVV, numero de tarjeta ni datos del tarjetahabiente
- Solo CardTokenRef: un token/referencia (ej: tok_sandbox_01)
- Si Copilot sugiere una columna CardNumber, PAN, CVV, ExpiryDate → RECHAZAR
- Esta regla NO es negociable — violaciones son un hallazgo de auditoria PCI

## Seed data
- Usar tokens sandbox: tok_sandbox_01, tok_sandbox_02, etc.
- Datos realistas pero ficticios (nombres, montos, fechas)
- Incluir variedad de estados para testing (Captured, Authorized, Voided, etc.)
```

---

### Paso 3.4: Antes/despues por costura (demo contrastante)

Ahora verificamos que las instrucciones funcionan.

**Sin instrucciones por costura (ya lo vimos ayer):**

Copilot genera Angular con `*ngIf`, inyeccion por constructor, etc.

**Con instrucciones por costura — prueba en cada capa:**

**Prueba API — abre un archivo en `api/Controllers/` y pide:**

```
Agrega un endpoint PUT /api/merchants/{id} para actualizar
el LegalName y Status de un merchant.
```

**Verificar:** ¿Usa `record` DTO? ¿Primary constructor? ¿Devuelve 404 si no existe?

**Prueba Angular — abre un archivo en `client/src/app/` y pide:**

```
Crea un componente para crear un merchant nuevo con un formulario
de LegalName y MerchantCode.
```

**Verificar:** ¿Es standalone? ¿Usa `inject()` en vez de constructor? ¿Usa `@if` en vez de `*ngIf`?

**Prueba SQL — abre `db/seed.sql` y pide:**

```
Agrega una tabla AuditLog con campos: Id, TableName, Action, OldValues,
NewValues, ChangedAt, ChangedBy.
```

**Verificar:** ¿PascalCase? ¿NVARCHAR? ¿NO agrega columnas de PAN o datos sensibles?

> **Punto clave:** El mismo Copilot, tres niveles de contexto, tres calidades de output. Las instrucciones son archivos de texto — cuestan cero pero cambian todo.

**Deshaz todos los cambios** antes de continuar.

---

## Dia 2 Ejercicio 4: Construir "Liquidar Batch" Full-stack

> **Esta es la vitrina del workshop.** Los participantes construyen el feature estrella de punta a punta con Copilot.

---

### Paso 4.1: Explorar el esquema con MSSQL Agent Mode

Antes de construir, entendamos los datos.

**PROMPT en Agent Mode:**

```
@workspace Usando la base de datos conectada, responde:
1. Cuantas transacciones tiene el batch 1 en status Captured?
2. Cuanto suman sus montos?
3. Cual es el status actual del batch 1?
```

> **Observa:** Copilot ejecuta un query real contra el contenedor y te da numeros exactos. No adivina.

---

### Paso 4.2: Implementar el endpoint POST /api/batches/{id}/settle

Abre `api/Controllers/BatchesController.cs`. Hay un TODO en la linea 50.

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Implementa el endpoint POST /api/batches/{id}/settle
en BatchesController.cs donde esta el TODO.

La operacion debe:
1. Abrir una transaccion de DB con BeginTransactionAsync
2. Obtener el batch con sus transacciones Captured (Include + Where)
3. Validar que el batch este Open (si no, retornar 400 "Batch already settled")
4. Validar que tenga transacciones Captured (si no, retornar 400 "No captured transactions")
5. Sumar los montos de las transacciones (TotalAmount)
6. Marcar cada transaccion como TransactionStatus.Settled
7. Marcar el batch como BatchStatus.Settled, asignar TotalAmount y SettledAt = DateTime.UtcNow
8. SaveChangesAsync + CommitAsync
9. Retornar el batch actualizado como BatchDetailDto

Usa el patron que ya tienen los demas endpoints en el controller.
El MaskToken ya existe en la clase — reutilizalo.
```

**Checklist — verificar en el codigo generado:**

- [ ] ¿Usa `await using var transaction = await db.Database.BeginTransactionAsync()`?
- [ ] ¿Filtra solo `TransactionStatus.Captured`?
- [ ] ¿Valida que el batch este `Open`?
- [ ] ¿Calcula `TotalAmount` como suma de los amounts?
- [ ] ¿Marca cada transaccion como `Settled` (loop o ForEach)?
- [ ] ¿Usa `CommitAsync` y maneja el rollback (try/catch o using)?
- [ ] ¿Devuelve 400 con mensaje claro si ya esta Settled?
- [ ] ¿Usa `MaskToken()` en el CardTokenRef del response?

> **Si el codigo generado no pasa algun check:** pide a Copilot que corrija especificamente ese punto. Ejemplo: *"El endpoint no valida que el batch este Open. Agrega esa validacion."*

---

### Paso 4.3: Implementar settleBatch() en el Angular service

Abre `client/src/app/services/api.service.ts`. Hay un TODO al final.

**PROMPT en Agent Mode:**

```
@workspace Implementa el metodo settleBatch(id: number) en ApiService
donde esta el TODO. Debe hacer POST a /api/batches/{id}/settle
y retornar Observable<BatchDetail>.
```

**Verificar:** ¿Usa `this.http.post<BatchDetail>`? ¿Pasa `{}` como body?

---

### Paso 4.4: Implementar el componente batch-settle

Abre `client/src/app/batches/batch-settle.component.ts`. Es un placeholder.

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Reescribe batch-settle.component.ts como un componente
funcional completo. Debe:

1. Leer el id del batch de la ruta (ActivatedRoute, inject())
2. Cargar el batch con ApiService.getBatch(id) al inicializar
3. Mostrar una tabla con las transacciones del batch:
   - Columnas: Terminal, Auth Code, Card Ref (ya viene enmascarado), Amount
4. Mostrar el total sumado debajo de la tabla
5. Boton "Confirm Settle" que:
   - Llama a ApiService.settleBatch(id)
   - Muestra loading state mientras procesa
   - Al completar: navega a /merchants
   - Si hay error: muestra mensaje de error
6. Boton "Cancel" que navega a /merchants

Usa: standalone component, signals, inject(), @if/@for, DecimalPipe.
Estilos: usa las clases .card, .table, .btn, .badge de styles.css.
```

**Checklist — verificar en el codigo generado:**

- [ ] ¿Es standalone (`standalone: true`)?
- [ ] ¿Usa `inject()` para ApiService, ActivatedRoute, Router?
- [ ] ¿Usa `signal()` para el batch y el loading state?
- [ ] ¿Usa `@if` y `@for` (no `*ngIf`/`*ngFor`)?
- [ ] ¿Card refs aparecen como `tok_••XX`? (ya vienen enmascarados del API)
- [ ] ¿El boton se deshabilita durante loading?
- [ ] ¿Importa `DecimalPipe` y otros pipes necesarios?

---

### Paso 4.5: Probar end-to-end

1. Reinicia el API si es necesario: `cd api && ASPNETCORE_ENVIRONMENT=Development dotnet run`
2. El Angular dev server deberia seguir corriendo (HMR)
3. Abre `http://localhost:4200`
4. Navega a **Cafe Rivera SRL** (M001)
5. Click en la tab **Batches**
6. Click **Settle** en el batch Open
7. Verifica: tabla de transacciones con card refs enmascarados (`tok_••XX`), total correcto
8. Click **Confirm Settle**
9. Verifica: el batch pasa a Settled, te redirige a merchants

**Revision de seguridad (bonus):**

**PROMPT en Agent Mode con MSSQL conectado:**

```
@workspace Revisa el codigo que acabamos de generar para el endpoint
de settle y el componente Angular. Busca:
1. Riesgos de SQL injection
2. Datos sensibles en las respuestas del API (CardTokenRef sin mascara)
3. Permisos de conexion excesivos
4. Race conditions en la liquidacion
```

**Entregable del Dia 2:** instructions por costura + feature "liquidar batch" funcionando end-to-end.

---

## Dia 3 Ejercicio 5: Custom Agents y Handoffs

> **Objetivo:** Agents que orquestan features multi-capa y revisan reglas de dominio.

---

### Paso 5.1: Crear el agent feature-builder

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea el archivo .github/agents/feature-builder.agent.md con:

---
name: 'Feature Builder'
description: 'Orquesta features full-stack: DB schema → EF Core → API controller → Angular component. Sigue el orden de capas para que cada una informe a la siguiente.'
tools: ['terminal', 'search/codebase']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Revisar con payments-reviewer
    agent: payments-reviewer
    prompt: Revisa los cambios que acabo de generar.
---

# Feature Builder

Eres un desarrollador full-stack especializado en AcquirerLite.

## Tu orden de trabajo (SIEMPRE en esta secuencia)

1. **DB primero**: schema SQL (tabla, constraints, indexes, seed data)
   - Verificar con MSSQL extension que el esquema es correcto
   - NUNCA agregar columnas de PAN/CVV — solo tokens
2. **EF Core**: modelo + DbContext config (Fluent API)
   - Unique indexes, enum-to-string, relaciones
3. **API controller**: endpoints REST + DTOs como record
   - Siempre enmascarar CardTokenRef con MaskToken()
   - Usar Microsoft Learn MCP para verificar APIs .NET 10 vigentes
4. **Angular**: service method + componente standalone
   - Usar Angular CLI MCP (get_best_practices primero)
   - Signals, inject(), @if/@for

## Por que este orden
El esquema informa al modelo EF Core. El modelo informa al controller.
El controller define el contrato que el Angular service consume.
Saltarse el orden produce inconsistencias.

## Al terminar
Ofrece handoff al payments-reviewer para validar reglas de dominio.
```

**Probar el agent — seleccionalo del dropdown:**

```
@feature-builder Agrega un campo Email opcional a Merchants.
Debe ser nullable, con validacion de formato en el API.
Muestra el email en el detalle del merchant en Angular.
```

> **Observa:** El agent sigue el orden DB → EF Core → API → Angular automaticamente.

**Deshaz los cambios** antes de continuar.

---

### Paso 5.2: Crear el agent payments-reviewer + handoff

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea el archivo .github/agents/payments-reviewer.agent.md con:

---
name: 'Payments Reviewer'
description: 'Revisa reglas de dominio acquiring: estados de transaccion validos, seguridad de datos, integridad de settlement.'
tools: ['search/codebase']
model: ['Claude Sonnet 4', 'GPT-4o']
handoffs:
  - label: Corregir problemas
    agent: agent
    prompt: Corrige los problemas que identifique.
    send: false
---

# Payments Reviewer

Eres un revisor de codigo especializado en el dominio acquiring/payments.

## Al revisar, SIEMPRE verifica:

### Maquina de estados
- [ ] Transacciones solo transitan: Authorized → Captured → Settled | Voided | Refunded
- [ ] No hay transiciones invalidas (ej: Voided → Captured)
- [ ] Settlement solo aplica a transacciones Captured

### Seguridad de datos — CRITICO
- [ ] CardTokenRef NUNCA aparece sin mascara en responses
- [ ] Ningun log expone CardTokenRef completo
- [ ] No hay columnas de PAN, CVV, ExpiryDate en SQL
- [ ] Connection strings no estan hardcodeados en codigo versionado

### Integridad de settlement
- [ ] Liquidacion usa transaccion de DB (BeginTransactionAsync)
- [ ] TotalAmount = suma de montos de transacciones Captured
- [ ] Batch solo se puede Settle una vez (validacion de status Open)
- [ ] Todas las transacciones del batch se marcan Settled atomicamente

### Reportar con severidades
- CRITICO: Puede causar perdida de datos, fuga de info sensible, o transacciones inconsistentes
- IMPORTANTE: Viola patrones de arquitectura o convenciones del equipo
- MENOR: Mejora de codigo o legibilidad
```

**Probar el handoff:**

1. Selecciona **Feature Builder** del dropdown
2. Pide: *"Agrega un campo PhoneNumber a Merchants"*
3. Al terminar, el agent ofrece "Revisar con payments-reviewer"
4. Click en el boton — el payments-reviewer revisa automaticamente

> **Momento wow:** El builder construye, el reviewer valida. Es el mismo patron que PR reviews — pero antes de que el humano lo vea.

**Deshaz los cambios** antes de continuar.

---

## Dia 3 Ejercicio 6: Skills, Hooks y Disciplina de Costo

> **Objetivo:** Workflows repetibles, guardrails automaticos, y entender el modelo de costos.

---

### Paso 6.1: Crear el skill crud-scaffold

**PROMPT en Agent Mode (copiar TODO el bloque):**

~~~
@workspace Crea el archivo .github/skills/crud-scaffold/SKILL.md con:

---
name: crud-scaffold
description: >
  Genera un CRUD completo end-to-end para una entidad nueva.
  Se activa cuando el usuario pide scaffoldear, crear, o generar
  un CRUD, modulo, o feature CRUD.
user-invocable: true
argument-hint: 'nombre de la entidad (ej: refund, chargeback, fee)'
---

# Skill: CRUD Scaffold

## Cuando se activa

Cuando el usuario pide crear un CRUD, modulo, o feature para una entidad nueva.

## Pasos (ejecutar EN ORDEN)

### Paso 1: SQL Table
Crear tabla en `db/seed.sql` con:
- Id (int, PK, identity)
- MerchantId (FK a Merchants)
- Campos de la entidad (PascalCase, NVARCHAR para texto)
- Status enum con CHECK constraint
- CreatedAt (datetime2, default GETUTCDATE())
- NUNCA agregar columnas de PAN/CVV
- Indexes en FKs y campos de busqueda
- 5 registros de seed data realista

### Paso 2: EF Core Model
Crear clase en `api/Models/` con:
- Primary constructor
- Enum para Status (si aplica)
- Navigation properties con collection expressions []

### Paso 3: DbContext Config
Agregar al `OnModelCreating` en `api/Data/AcquirerDbContext.cs`:
- Fluent API: unique indexes, enum-to-string, precision para decimals
- DbSet<T> property

### Paso 4: Controller + DTOs
Crear en `api/Controllers/` con:
- Primary constructor con AcquirerDbContext
- GET lista (con filtros opcionales)
- GET por id (Include navegaciones)
- POST crear
- DTOs como record
- MaskToken() si hay CardTokenRef

### Paso 5: Angular Service
Agregar metodos al `ApiService` o crear servicio nuevo:
- Metodos tipados con interfaces
- HttpParams para filtros

### Paso 6: Angular Component (List)
Crear componente standalone en `client/src/app/`:
- signals para estado
- inject() para DI
- @if/@for para control flow
- Tabla con estilos existentes (.table, .card, .badge)

### Paso 7: Angular Component (Detail)
Crear componente standalone:
- ActivatedRoute para leer id
- Tabs si hay datos relacionados

### Paso 8: Route
Agregar lazy routes en `client/src/app/app.routes.ts`

## Verificacion final
- [ ] CardTokenRef enmascarado si existe
- [ ] Enums como string en responses
- [ ] Standalone components (no NgModule)
- [ ] Signals (no BehaviorSubject)
- [ ] @if/@for (no *ngIf/*ngFor)
~~~

**Probar la skill:**

```
Usa la skill crud-scaffold para crear un CRUD de Refunds.
Un refund tiene: transactionId, amount, reason, status (Pending/Approved/Rejected), createdAt.
```

> **Observa:** La skill ejecuta los 8 pasos en orden, generando codigo consistente en todas las capas.

**Deshaz los cambios** antes de continuar.

---

### Paso 6.2: Crear hooks deterministas

Los hooks son la capa que **garantiza** — las instrucciones guian, los hooks bloquean.

**PROMPT en Agent Mode (copiar TODO el bloque):**

```
@workspace Crea 2 archivos de hooks:

1. .github/hooks/block-destructive-sql.json

{
  "hooks": [
    {
      "event": "PreToolUse",
      "tools": ["terminal", "shell"],
      "steps": [
        {
          "type": "gate",
          "condition": "matches(tool_input, '(?i)(DROP\\s+TABLE|DELETE\\s+FROM\\s+\\w+\\s*$|DELETE\\s+FROM\\s+\\w+\\s*;|TRUNCATE\\s+TABLE|DROP\\s+DATABASE|rm\\s+-rf\\s+/)')",
          "action": "block",
          "message": "BLOQUEADO: Operacion destructiva detectada. DROP TABLE, DELETE sin WHERE, TRUNCATE y rm -rf estan prohibidos. Si necesitas eliminar datos, usa DELETE con una clausula WHERE especifica."
        }
      ]
    }
  ]
}

2. .github/hooks/format-on-save.json

{
  "hooks": [
    {
      "event": "PostToolUse",
      "tools": ["write_file", "edit_file"],
      "steps": [
        {
          "type": "command",
          "condition": "endsWith(file_path, '.cs')",
          "command": "cd api && dotnet format --include {{file_path}} --no-restore"
        },
        {
          "type": "command",
          "condition": "endsWith(file_path, '.ts')",
          "command": "cd client && npx prettier --write {{file_path}}"
        }
      ]
    }
  ]
}
```

**Demo del hook de seguridad:**

Pide a Copilot en Agent Mode:

```
Elimina todas las transacciones de la tabla Transactions
```

**Resultado esperado:** El hook bloquea con un mensaje claro.

Ahora cambia el prompt:

```
Elimina las transacciones con status 'Declined' de la tabla Transactions
```

**Resultado esperado:** Pasa — tiene WHERE clause.

> **Punto clave:** Las instrucciones guian. Los hooks garantizan. Un archivo de texto puede ser ignorado — un hook no.

---

### Paso 6.3: Disciplina de costo

**Que es gratis vs. que consume:**

| Accion | Consume AI Credits? |
|--------|---------------------|
| Inline completions | No |
| NES (Next Edit Suggestions) | No |
| Inline chat (`Cmd+I`) | Si |
| Chat panel | Si |
| Agent Mode | Si (mas: contexto + tools) |

**Reglas de eficiencia:**

1. **El 70% del valor diario (inline + NES) es gratis** — usarlo primero
2. **Los MCPs mantienen el contexto magro**: traen solo el doc/esquema relevante, no todo
3. **Para features multi-capa**, Agent Mode con el modelo mas capaz vale la pena
4. **Para un rename o format**, inline completion es suficiente
5. **Las instrucciones son texto plano** — cero costo, maximo impacto

---

### Cierre del workshop

Cada participante verifica su repo:

- [ ] `copilot-instructions.md` completo (Dia 1)
- [ ] 3 archivos `*.instructions.md` por costura (Dia 2)
- [ ] Feature "liquidar batch" funcionando (Dia 2)
- [ ] Al menos 1 custom agent (Dia 3)
- [ ] 1 skill CRUD (Dia 3)
- [ ] 2 hooks de seguridad/formato (Dia 3)

> **Lo que hicieron en 3 dias son archivos de texto en `.github/`.** No instalan nada mas. El lunes, hagan `/init` en su repo real, escriban una instruction para su capa, y prueben. Eso es todo.

---

## Referencia Rapida

### 5 Niveles de Personalizacion de Copilot

| Nivel | Archivo | Se activa | Proposito |
|-------|---------|-----------|-----------|
| 1 | `copilot-instructions.md` | Siempre | Reglas globales del proyecto |
| 2 | `*.instructions.md` + `applyTo` | Al editar archivo que matchea | Convenciones por capa |
| 3 | `*.prompt.md` | Al invocar `/nombre` | Comandos reutilizables |
| 4 | `SKILL.md` | Al detectar intent | Workflows multi-paso |
| 5 | `*.agent.md` | Al seleccionar del dropdown | Agentes especializados |

### MCPs del Proyecto

| MCP | Como usarlo |
|-----|-------------|
| Angular CLI | "usa Angular CLI MCP para verificar best practices" |
| Microsoft Learn | "busca en Microsoft Learn la API actual de EF Core" |
| NuGet | "verifica vulnerabilidades en los paquetes NuGet" |
| MSSQL Extension | Conectar via connection profile — agent mode lo usa automaticamente |

### Estructura del Repo

```
acquirer-lite/
├── .github/
│   ├── copilot-instructions.md         # Dia 1
│   ├── instructions/                   # Dia 2
│   │   ├── api.instructions.md
│   │   ├── client.instructions.md
│   │   └── db.instructions.md
│   ├── agents/                         # Dia 3
│   │   ├── feature-builder.agent.md
│   │   └── payments-reviewer.agent.md
│   ├── skills/                         # Dia 3
│   │   └── crud-scaffold/SKILL.md
│   └── hooks/                          # Dia 3
│       ├── block-destructive-sql.json
│       └── format-on-save.json
├── .vscode/
│   └── mcp.json                        # MCPs configurados
├── api/                                # .NET 10 API
├── client/                             # Angular 19
├── db/
│   └── seed.sql                        # Schema + data sandbox
└── scripts/
    ├── start-mssql.sh
    └── seed-db.sh
```

### Ramas

| Rama | Contenido |
|------|-----------|
| `main` | Esqueleto de partida — TODOs guiados para cada ejercicio |
| `solution` | Referencia del instructor — todo implementado |

### Endpoints del API

| Metodo | Ruta | Estado |
|--------|------|--------|
| GET | `/api/merchants` | Funciona |
| GET | `/api/merchants/:id` | Funciona |
| POST | `/api/merchants` | Funciona |
| GET | `/api/transactions?merchantId=` | Funciona |
| GET | `/api/batches?merchantId=` | Funciona |
| GET | `/api/batches/:id` | Funciona |
| POST | `/api/batches/:id/settle` | **TODO — Dia 2** |

### Data Sandbox

| Tabla | Registros | Notas |
|-------|-----------|-------|
| Merchants | 3 | M001 Active, M002 Active, M003 Suspended |
| Terminals | 6 | 2-3 por merchant |
| Transactions | 30 | 24 Captured, 3 Authorized, 1 Voided, 1 Declined, 1 extra |
| Batches | 2 | 1 Open (para settle), 1 Settled (historico) |

---

## Troubleshooting

| Problema | Solucion |
|----------|----------|
| SQL Server se cae | Subir memoria: `-m 3072M` en `start-mssql.sh` o Docker Desktop → 8GB+ |
| `npm install` falla con E401 | Registry corporativo con token expirado. Ya existe `client/.npmrc` con registry publico |
| Pagina Angular en blanco | Falta `import 'zone.js'` en `main.ts` — verificar consola del browser (NG0908) |
| Enums aparecen como numeros (0, 1) | Verificar `JsonStringEnumConverter` en `Program.cs` |
| MSSQL extension no muestra tablas | Verificar connection profile, re-ejecutar `bash scripts/seed-db.sh` |
| Puerto 5000 en uso | AirPlay en macOS usa 5000. API ya usa 5100 |
| MCP angular-cli no aparece | Requiere Node 22.16+: `node -v` |
| Container CLI: "image does not support platforms" | Ya resuelto: script usa `--arch amd64 --rosetta` |
| `dotnet run` falla con package not found | Ejecutar `dotnet restore` primero |
| Connection string falla en devcontainer | Usar `mssql,1433` (nombre del servicio). Fuera de devcontainer: `localhost,1433` |

---

## Recursos Adicionales

### Documentacion

- [GitHub Copilot Docs](https://docs.github.com/en/copilot)
- [Copilot Customization](https://docs.github.com/en/copilot/customizing-copilot)
- [MCP Servers](https://docs.github.com/en/copilot/using-github-copilot/using-extensions-to-integrate-external-tools-with-copilot-chat)
- [Angular CLI MCP](https://www.npmjs.com/package/@angular/cli)
- [Microsoft Learn MCP](https://learn.microsoft.com/en-us/copilot/mcp)
- [EF Core Docs](https://learn.microsoft.com/en-us/ef/core/)

### FAQ

**¿Puedo usar esto en mi proyecto real?**
Si. Todo el harness (`.github/`) es portable. Copia la estructura, ajusta las instrucciones a tu dominio y stack.

**¿Los MCPs son gratis?**
Si. Los MCPs son herramientas que se ejecutan localmente o via HTTP. No tienen costo adicional. Lo que consume AI Credits es la conversacion de Copilot que los invoca.

**¿Que pasa si Copilot genera codigo incorrecto?**
Itera. El feedback loop es: generar → verificar → corregir. Con las instrucciones bien configuradas, la primera generacion es mucho mas precisa.

**¿Puedo usar Docker Desktop en vez del container CLI nativo?**
Si. Cambia `container` por `docker` en los scripts. El resto funciona igual.
