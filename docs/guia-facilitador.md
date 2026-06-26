# Guía del Facilitador — AcquirerLite Workshop

> Este documento es para el instructor. No se distribuye a los participantes.

## Antes del workshop

### Logística (1 semana antes)

- [ ] Confirmar que cada participante tiene licencia de Copilot activa
- [ ] Enviar pre-requisitos: Docker Desktop (o `container` CLI en macOS), VS Code, .NET 10 SDK, Node 22+
- [ ] Verificar red corporativa: `npx`, `dnx`, y `mcr.microsoft.com` deben ser accesibles
- [ ] Si la red bloquea npm/NuGet, preparar binarios locales de los MCPs
- [ ] Probar el setup completo en una laptop representativa del equipo (8GB+ RAM mínimo)
- [ ] Tener la rama `solution` revisada — es tu referencia para todo el taller

### Preparar tu máquina

```bash
git clone https://github.com/enriquecordero/acquirer-lite.git
cd acquirer-lite
bash scripts/start-mssql.sh
bash scripts/seed-db.sh
cd api && dotnet restore && ASPNETCORE_ENVIRONMENT=Development dotnet run &
cd ../client && npm install && npm start &
```

Verificar: `http://localhost:4200` muestra 3 merchants. Si algo falla, revisar la sección de troubleshooting al final.

---

## DÍA 1 — Entorno, el piso gratis y el "aha" del esquema

### Objetivo del día
Todos con el entorno corriendo, Copilot viendo el esquema real, y haber experimentado valor sin configuración extra.

---

### Bloque 1: Orientación (15 min) — 9:00

**Qué hacer:**
1. Proyectar el diagrama de arquitectura (Anexo A del temario)
2. Enfatizar las **dos flechas hacia mssql** — es el punto pedagógico:
   - Flecha 1: EF Core (la app consume datos)
   - Flecha 2: Extensión MSSQL (Copilot lee el esquema)
3. Explicar la tesis: *"el contexto es el producto"*

**Qué decir:**
> "Al final de estos 3 días, el repo va a tener un harness de archivos que hace que Copilot escriba código correcto para *nuestro* dominio, no código genérico. Hoy montamos la base."

**Punto clave:** la segunda flecha (Copilot → esquema) es lo que justifica el contenedor de SQL. Sin ella, Copilot adivina las tablas.

---

### Bloque 2: Reopen in Container (45 min) — 9:15

**Qué hacer:**
1. Cada participante clona el repo y abre en VS Code
2. `Cmd+Shift+P` → "Dev Containers: Reopen in Container"
3. Esperar que compose levante `app` + `mssql` (primera vez ~3-5 min por descarga)
4. Verificar juntos:
   - `dotnet --info` → .NET 10
   - `node -v` → v22+
   - `sqlcmd` accesible vía container exec

**Problemas comunes:**
| Síntoma | Causa | Fix |
|---------|-------|-----|
| Docker timeout | RAM insuficiente | Docker Desktop → Settings → Resources → 8GB+ |
| Puerto 1433 en uso | Otro SQL Server local | `lsof -i :1433`, matar el proceso |
| Imagen no descarga | Red corporativa bloquea MCR | Usar VPN o pre-descargar la imagen |
| macOS `container` CLI: "image does not support platforms" | SQL Server es amd64 | Usar `--arch amd64 --rosetta` (ya está en el script) |

**Tip de timing:** mientras Docker descarga, puedes adelantar la explicación del esquema de AcquirerLite en pizarra.

---

### Bloque 3: Conectar MSSQL Extension (30 min) — 10:00

**Qué hacer:**
1. Abrir la extensión MSSQL en la barra lateral
2. Crear connection profile:
   - Server: `mssql,1433` (nombre del servicio compose) o `localhost,1433` si corren fuera de devcontainer
   - User: `sa`
   - Password: `Workshop!Pass123`
   - Trust server certificate: Yes
3. Ejecutar `bash scripts/seed-db.sh` (o desde terminal en devcontainer)
4. Expandir el árbol de tablas — todos deben ver: Merchants, Terminals, Transactions, SettlementBatches

**Checkpoint visual:** si ves las 4 tablas en el árbol, estás bien. Si no, el seed falló — re-ejecutar.

---

### Bloque 4: El "aha" (30 min) — 10:30

**Este es el momento más importante del Día 1.**

**Qué hacer:**
1. Abrir Copilot Chat en Agent Mode (`Cmd+Shift+I` o chat panel → Agent)
2. Pedir:

> Describe el esquema de esta base de datos, el flujo de una transacción desde autorización hasta liquidación, y cómo se cierra un batch.

3. **Pausar.** Dejar que los participantes lean la respuesta de Copilot.
4. Preguntar al grupo: *"¿Cómo supo Copilot las tablas que tenemos? ¿Las adivinó?"*
5. La respuesta: las leyó del contenedor vía la extensión MSSQL.

**Demostración contrastante (opcional pero poderosa):**
- Desconectar el connection profile MSSQL
- Hacer la misma pregunta → Copilot inventa tablas genéricas
- Reconectar → la respuesta ahora es precisa

**Qué decir:**
> "Sin el esquema, Copilot adivina. Con el esquema del contenedor, Copilot sabe. Esa es la diferencia entre código genérico y código que funciona para *nosotros*. Y eso es solo el primer nivel — en los próximos dos días vamos a darle más contexto."

---

### ALMUERZO (60 min) — 11:00

---

### Bloque 5: El piso gratis (60 min) — 12:00

**Qué hacer — demo en vivo sobre código de AcquirerLite:**

1. **Inline completions** (15 min): abrir un controller, empezar a escribir un método. Copilot completa.
   - Punto: esto es gratis, no consume AI Credits.

2. **NES — Next Edit Suggestions** (15 min): hacer un cambio en un modelo (ej: agregar una propiedad), Tab-Tab para que Copilot propague el cambio al DbContext y controller.
   - Punto: el 70% del valor diario es esto.

3. **Inline chat** (15 min): seleccionar un bloque de código → `Cmd+I` → "refactor this to use async/await properly"
   - Punto: refactoring sin salir del editor.

4. **Smart actions** (15 min): click derecho → Copilot → Generate Docs / Fix / Explain
   - Punto: acciones predefinidas, cero configuración.

**Qué decir:**
> "Todo esto viene gratis con la licencia. No hay que configurar nada. Si hoy solo se llevan esto, ya están produciendo más. Pero mañana vamos a hacer que Copilot sea *mucho* más preciso."

---

### Bloque 6: /init → copilot-instructions.md (60 min) — 13:00

**Qué hacer:**
1. En Copilot Chat: `/init`
2. Copilot genera un `copilot-instructions.md` inicial
3. **Revisión guiada** — el archivo generado necesita ajustes. Guiar al grupo:
   - ¿Menciona el stack completo? (.NET 10, Angular 19, SQL Server en contenedor)
   - ¿Menciona el dominio? (acquiring, merchants, terminals, transactions, batches)
   - ¿Tiene la regla de seguridad? (nunca PAN/CVV, solo CardTokenRef)
   - ¿Menciona los MCPs disponibles?
4. Cada participante ajusta su archivo

**Referencia del instructor:** rama `solution` tiene el `copilot-instructions.md` completo.

**Qué decir al cierre del día:**
> "Ya tienen entorno, Copilot con esquema, y las instrucciones globales. Mañana vamos a enseñarle qué convenciones usar en cada capa del stack."

---

## DÍA 2 — Context engineering por costura + el loop full-stack

### Objetivo del día
Instrucciones por capa cableadas a los MCPs, y construir la feature "liquidar batch" de punta a punta.

---

### Bloque 7: Instructions por costura (75 min) — 9:00

**Qué hacer:**
1. Explicar el concepto de "costura" (stitching):
   - Archivos `*.instructions.md` con frontmatter `applyTo`
   - Copilot los lee automáticamente cuando editas archivos que matchean el glob
2. Crear 3 archivos en `.github/instructions/`:

**`api.instructions.md`** — guiar que incluyan:
- applyTo: `"api/**"`
- .NET 10, C# 13 (collection expressions, primary constructors, global usings)
- EF Core con DbContext, relaciones Fluent API
- Serilog para logging
- Usar Microsoft Learn MCP (`microsoft_docs_search`) para APIs vigentes
- DTOs como `record`, nunca exponer entidades directamente
- Máscara obligatoria en CardTokenRef → `tok_••XX`

**`client.instructions.md`** — guiar que incluyan:
- applyTo: `"client/**"`
- Angular 19: standalone components, signals, `inject()`, `@if`/`@for`
- Usar Angular CLI MCP (`get_best_practices` primero)
- Card refs siempre enmascarados en UI

**`db.instructions.md`** — guiar que incluyan:
- applyTo: `"db/**"`
- PascalCase para tablas/columnas, NVARCHAR para unicode
- CHECK constraints para enums, FKs con índices
- **REGLA DURA: ninguna columna almacena PAN/CVV, solo tokens**

**Referencia:** rama `solution` tiene las tres completas.

---

### Bloque 8: Antes/después por costura (45 min) — 10:15

**Qué hacer — demo contrastante en cada capa:**

1. **Sin instructions:** pedir a Copilot "create a new endpoint to list terminals by merchant"
   - Observar: probablemente usa patrón viejo, no enmascara tokens, puede generar NgModule

2. **Con instructions:** repetir la misma petición
   - Observar: usa `record` DTOs, standalone component, enmascara CardTokenRef

3. **Con instructions + MCP:** agregar "use the Microsoft Learn MCP to check the latest EF Core API"
   - Observar: Copilot consulta docs actuales antes de generar

**Qué decir:**
> "El mismo Copilot, tres niveles de contexto, tres calidades de output. Las instructions son archivos de texto — cuestan cero pero cambian todo."

---

### ALMUERZO (60 min) — 11:00

---

### Bloque 9: Feature "liquidar batch" — full-stack (120 min) — 12:00

**Esta es la vitrina del workshop. Es el momento que justifica los 3 días.**

**Estructura:** build-along guiado. El instructor demuestra cada paso, los participantes lo replican con Copilot.

**Paso 1 — DB / Esquema (15 min):**
- Abrir la extensión MSSQL, explorar las tablas `Transactions` y `SettlementBatches`
- En Agent Mode: *"¿Qué transacciones del batch 1 están en status Captured y cuánto suman?"*
- Copilot ejecuta un query real contra el contenedor

**Paso 2 — API / EF Core (35 min):**
- En `BatchesController.cs`, hay un TODO para el endpoint `POST /api/batches/{id}/settle`
- Guiar a los participantes a pedirle a Copilot:

> Implementa el endpoint POST /api/batches/{id}/settle. Debe abrir una transacción de DB, obtener el batch con sus transacciones Captured, validar que esté Open, sumar los montos, marcar las transacciones como Settled, actualizar el batch con TotalAmount y SettledAt, y hacer commit.

- **Puntos a verificar en el código generado:**
  - [ ] ¿Usa `BeginTransactionAsync`?
  - [ ] ¿Filtra solo `TransactionStatus.Captured`?
  - [ ] ¿Valida que el batch esté `Open`?
  - [ ] ¿Calcula `TotalAmount` como suma de los amounts?
  - [ ] ¿Marca cada transacción como `Settled`?
  - [ ] ¿Usa `CommitAsync` / maneja rollback?
  - [ ] ¿Devuelve 400 si ya está Settled o no hay transacciones?

**Paso 3 — Angular service (15 min):**
- En `api.service.ts`, hay un TODO para `settleBatch(id)`
- Pedir a Copilot que lo implemente: `POST /api/batches/{id}/settle`

**Paso 4 — Angular component (40 min):**
- En `batch-settle.component.ts`, hay un placeholder
- Guiar a los participantes a pedirle a Copilot:

> Implementa este componente. Debe cargar el batch por ID de la ruta, mostrar una tabla con las transacciones Captured (terminal, auth code, card ref enmascarado, amount), el total, y un botón "Confirm Settle" que llama al API y redirige a merchants al completar.

- **Puntos a verificar:**
  - [ ] ¿Usa signals (`signal()`, `computed()`)?
  - [ ] ¿Usa `inject()` en vez de constructor DI?
  - [ ] ¿Usa `@if`/`@for` en vez de `*ngIf`/`*ngFor`?
  - [ ] ¿Card refs aparecen enmascarados (`tok_••XX`)?
  - [ ] ¿Standalone component (no NgModule)?
  - [ ] ¿Maneja estado de loading en el botón?

**Paso 5 — Probar end-to-end (15 min):**
1. Navegar a Merchants → Café Rivera SRL → tab Batches → "Settle" en el batch Open
2. Ver la tabla de transacciones con totales
3. Click "Confirm Settle"
4. Verificar: batch pasa a Settled, transacciones marcadas, total calculado

**Si algo falla:** la rama `solution` tiene todo implementado. Usar como referencia, no como copiar/pegar.

---

### Bloque 10: Seguridad de datos (30 min) — 14:00

**Qué hacer:**
1. En Agent Mode con MSSQL conectado, pedir:

> Revisa el código generado para el endpoint de settle y el componente Angular. ¿Hay riesgos de SQL injection? ¿Se filtra algún dato sensible en las respuestas del API? ¿Los permisos de la conexión a DB son excesivos?

2. Discusión grupal sobre lo que Copilot encontró
3. Verificar que CardTokenRef siempre pasa por `MaskToken()` antes de llegar al frontend

**Qué decir al cierre del día:**
> "Hoy construyeron un feature completo de DB a UI con Copilot. Pero fíjense — no fue magia. Fue contexto: el esquema del contenedor, las instructions por costura, los MCPs. Mañana vamos a automatizar estos flujos con agents y ponerle guardrails."

---

## DÍA 3 — Custom agents, skills, hooks y costo

### Objetivo del día
Las capas avanzadas del harness: agents que orquestan, skills que repiten, hooks que garantizan.

---

### Bloque 11: Custom agent full-stack (75 min) — 9:00

**Qué hacer:**
1. Explicar el concepto: un `.agent.md` define un agente especializado con instrucciones, tools, y modelo
2. Construir `feature-builder.agent.md` juntos:
   - Propósito: orquestar features full-stack (DB → API → Angular)
   - Tools: terminal, MSSQL, angular-cli MCP, Microsoft Learn MCP
   - Instrucciones: seguir el orden de capas, verificar cada paso
3. Probarlo: *"@feature-builder agrega un campo `Email` a Merchants, que sea nullable, con validación de formato"*

**Referencia:** rama `solution` tiene el agent completo.

**Puntos de discusión:**
- ¿Por qué definir el orden de capas (DB → API → Angular)? Porque el esquema informa al modelo, que informa al controller, que informa al componente.
- ¿Qué modelo asignar? El más capaz para features multi-capa.

---

### Bloque 12: Segundo agente + handoffs (45 min) — 10:15

**Qué hacer:**
1. Construir `payments-reviewer.agent.md`:
   - Propósito: revisar reglas de dominio (estados de transacción, seguridad de datos, integridad de settlement)
   - Tools: MSSQL para verificar constraints, terminal para grep/search
2. Configurar handoff desde feature-builder → payments-reviewer
3. Demo: el feature-builder genera código → automáticamente el reviewer lo valida

**Qué decir:**
> "El builder construye, el reviewer valida. Es el mismo patrón que PR reviews — pero antes de que el humano lo vea."

---

### ALMUERZO (60 min) — 11:00

---

### Bloque 13: Agent Skills (60 min) — 12:00

**Qué hacer:**
1. Explicar skills: workflows repetibles definidos en `SKILL.md`
2. Construir `crud-scaffold/SKILL.md` juntos — los 8 pasos:
   1. SQL table (con CHECK constraints)
   2. EF Core model
   3. DbContext config (Fluent API)
   4. Controller con DTOs
   5. Angular service method
   6. Angular component (list + detail)
   7. Route en app.routes.ts
   8. Verificar que CardTokenRef esté enmascarado si aplica
3. Probarlo: *"Usa la skill crud-scaffold para crear un CRUD de Refunds"*

**Carga progresiva — explicar este patrón:**
- Primero Copilot lee `name` y `description` → decide si aplica
- Luego carga el `body` → sigue los pasos
- Si hay scripts asociados → los ejecuta

---

### Bloque 14: Hooks deterministas (45 min) — 13:00

**Qué hacer:**
1. Explicar hooks: código que corre antes o después de cada acción de Copilot
2. Construir dos hooks:

**`block-destructive-sql.json`** (PreToolUse):
- Interceptar tool calls que contengan: `DROP TABLE`, `DELETE FROM` sin WHERE, `TRUNCATE TABLE`, `DROP DATABASE`, `rm -rf`
- Acción: bloquear con mensaje explicativo

**`format-on-save.json`** (PostToolUse):
- Después de editar un `.cs`: `dotnet format`
- Después de editar un `.ts`: `npx prettier --write`

3. Demo: intentar pedirle a Copilot *"elimina todas las transacciones de la tabla"*
   - El hook bloquea → mensaje explica por qué
   - Cambiar a *"elimina las transacciones con status Declined"* → pasa (tiene WHERE)

**Qué decir:**
> "Las instructions guían. Los hooks garantizan. Un archivo de texto puede ser ignorado — un hook no."

---

### Bloque 15: Disciplina de costo (30 min) — 13:45

**Qué hacer — presentación con discusión:**

| Acción | ¿Consume AI Credits? |
|--------|---------------------|
| Inline completions | No |
| NES (Next Edit Suggestions) | No |
| Inline chat (`Cmd+I`) | Sí |
| Chat panel | Sí |
| Agent Mode | Sí (más: contexto + tools) |
| MCP tool calls | Sí (por la conversación, no por el MCP) |

**Puntos clave:**
1. El 70% del valor diario (inline + NES) es gratis
2. Los MCPs mantienen el contexto magro: traen solo el doc/esquema relevante, no todo
3. Para features multi-capa, usar el modelo más capaz vale la pena — pero no para un rename
4. Las instructions son texto plano — cero costo, máximo impacto

**Qué decir:**
> "La meta no es minimizar el uso — es maximizar el *valor por crédito*. Inline completions para el 70%, agent mode para el 30% que vale la pena."

---

### Bloque 16: Cierre (15 min) — 14:15

**Qué hacer:**
1. Cada participante verifica su repo tiene:
   - [ ] `copilot-instructions.md` completo
   - [ ] 3 archivos `*.instructions.md` por costura
   - [ ] Al menos 1 custom agent
   - [ ] 1 skill
   - [ ] 2 hooks
   - [ ] Feature "liquidar batch" funcionando
2. Ronda rápida: ¿qué fue lo más útil? ¿qué aplicarían mañana?

**Qué decir:**
> "Todo lo que hicieron en 3 días son archivos de texto en `.github/`. No instalan nada más. El lunes, hagan `/init` en su repo real, escriban una instruction para su capa, y prueben. Eso es todo."

---

## Troubleshooting rápido

| Problema | Solución |
|----------|----------|
| SQL Server se cae después de unos minutos | Subir memoria: `-m 3072M` en el script o Docker Desktop → 8GB+ |
| `npm install` falla con E401 | Registry corporativo con token expirado. Crear `client/.npmrc` con `registry=https://registry.npmjs.org/` |
| Página Angular en blanco | Falta `import 'zone.js'` en `main.ts` — verificar consola del browser |
| Enums aparecen como números (0, 1) | Falta `JsonStringEnumConverter` en `Program.cs` |
| MSSQL extension no muestra tablas | Verificar connection profile apunta al contenedor correcto, re-ejecutar seed |
| Puerto 5000 en uso | AirPlay en macOS. Cambiar a 5100 en `appsettings.json` + `proxy.conf.json` |
| MCP angular-cli no aparece | Requiere Node 22.16+. Verificar `node -v` |
| `dotnet run` falla con package not found | Ejecutar `dotnet restore` primero |
| Container CLI: "image does not support platforms" | Agregar `--arch amd64 --rosetta` al `container run` |

## Tiempos del workshop

| Hora | Día 1 | Día 2 | Día 3 |
|------|-------|-------|-------|
| 9:00 | Orientación + Reopen Container | Instructions por costura | Custom agent full-stack |
| 10:00 | Conectar MSSQL + "aha" | Antes/después por costura | Segundo agent + handoffs |
| 11:00 | *Almuerzo* | *Almuerzo* | *Almuerzo* |
| 12:00 | Piso gratis (inline/NES) | Feature "liquidar batch" | Agent Skills |
| 13:00 | `/init` → copilot-instructions | Seguridad de datos | Hooks + Costo |
| 14:00 | — | — | Cierre |

## Checklist pre-workshop

- [ ] Repo clonado y probado end-to-end en tu máquina
- [ ] Rama `solution` revisada — conoces cada línea
- [ ] Laptop de respaldo con todo configurado
- [ ] Proyector/pantalla para demos
- [ ] WiFi con acceso a npm, NuGet, MCR, y learn.microsoft.com
- [ ] Cada participante tiene Copilot activo (verificar con IT 1 semana antes)
- [ ] Imprimir diagrama de arquitectura (Anexo A) como referencia de mesa
