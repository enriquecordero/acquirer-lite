---
name: 'generate-qsr'
description: 'Genera el paquete de pase a PRD (QSR) con scripts de install, rollback, instrucciones y test script'
agent: 'agent'
argument-hint: 'numero de QSR y descripcion breve (ej: 1234567 Agregar campo Email a Merchants)'
---

@workspace Genera un paquete completo de pase a produccion (QSR) para los cambios de base de datos
que se hicieron en este feature.

## Contexto del proyecto
- App Code: ACQLITE
- Base de datos: AcquirerLite (SQL Server)
- Conexion PRD: Server=acquirer-prd.database.windows.net, Database=AcquirerLite
- Herramienta de ejecucion: SSMS o Azure Data Studio

## QSR Info
- QSR Number: ${input:qsrNumber}
- Descripcion: ${input:description}

## Estructura a generar

Crea la carpeta `deploy/QSR ${input:qsrNumber}/` con esta estructura:

### 1. install/01_DML_Validate.sql
SELECT queries que muestran el estado ANTES de aplicar los cambios.
- SELECT de las tablas afectadas filtrando por los registros que se van a modificar/insertar
- Si es un ALTER TABLE, un SELECT con INFORMATION_SCHEMA.COLUMNS mostrando las columnas actuales
- Incluir JOINs relevantes para ver datos relacionados

### 2. install/02_DML_Param.sql
Los cambios reales: INSERT, UPDATE, ALTER TABLE, CREATE INDEX, etc.
- Cada statement en su propio bloque
- Comentarios explicando cada cambio
- Si es INSERT: incluir valores explicitos (no SELECT INTO)
- Si es ALTER: incluir DEFAULT values donde aplique
- NUNCA incluir DROP TABLE, TRUNCATE, o DELETE sin WHERE

### 3. install/03_DML_Validate.sql
SELECT queries que verifican que los cambios se aplicaron correctamente.
- Mismas queries que 01 pero ahora deben mostrar los datos nuevos/modificados
- Incluir COUNT(*) para verificar cantidad de registros esperados

### 4. rollback/01_DML_Param.sql
Scripts para deshacer los cambios:
- Si fue INSERT → DELETE con WHERE especifico
- Si fue ALTER ADD column → ALTER DROP column
- Si fue UPDATE → UPDATE revirtiendo a valores anteriores
- NUNCA usar DELETE sin WHERE ni DROP TABLE

### 5. rollback/02_DML_Validate.sql
SELECT queries que verifican que el rollback se aplico:
- Mismas queries que install/01 — deben mostrar el estado original

### 6. ACQLITE - QSR ${input:qsrNumber} - Database Instructions.txt

Generar con este formato exacto:

```
▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

App Code: ACQLITE

Script Details: ${input:description}

▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

INSTALL INSTRUCTIONS:

Environment Information for PROD
	Server: acquirer-prd.database.windows.net
	Data Base (SQL Server): AcquirerLite

1. Conectar a la base de datos AcquirerLite en el servidor de produccion usando SSMS o Azure Data Studio.

2. Ejecutar los siguientes scripts en orden:

	- 1. 01_DML_Validate.sql
	- 2. 02_DML_Param.sql
	- 3. 03_DML_Validate.sql

▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬

ROLLBACK INSTRUCTIONS:

Environment Information for PROD
	Server: acquirer-prd.database.windows.net
	Data Base (SQL Server): AcquirerLite

1. Conectar a la base de datos AcquirerLite en el servidor de produccion usando SSMS o Azure Data Studio.

2. Ejecutar los siguientes scripts en orden:

	- 1. 01_DML_Param.sql
	- 2. 02_DML_Validate.sql

▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬ ▬
```

### 7. ACQLITE - QSR ${input:qsrNumber} - Testscript.md

Generar un test script en markdown (en vez de .docx) con:

```markdown
# Test Script

| Campo | Valor |
|-------|-------|
| Created by | [nombre] |
| Created Date | [fecha actual] |
| Application ID | ACQLITE |
| QSR | ${input:qsrNumber} |
| Description | ${input:description} |
| Testing Start Date | [fecha actual] |
| Test Type | Functional |

## Test Cases

| No. | Business Function | Actions/Setup | Expected Results | Actual Results | Status |
|-----|-------------------|---------------|------------------|----------------|--------|
| 01 | Install | 1. Conectar a AcquirerLite PRD<br>2. Ejecutar scripts de install en orden<br>3. Verificar con 03_DML_Validate.sql | [describir resultado esperado] | [pendiente] | [pendiente] |
| 02 | Rollback | 1. Conectar a AcquirerLite PRD<br>2. Ejecutar scripts de rollback en orden<br>3. Verificar con 02_DML_Validate.sql | Datos revertidos al estado original | [pendiente] | [pendiente] |
| 03 | Functional Test | [pasos de prueba funcional en la app] | [resultado esperado en la app] | [pendiente] | [pendiente] |

## Aprobaciones

| Rol | Nombre | Fecha |
|-----|--------|-------|
| Tester | | |
| End User Approval | | |
```

## Reglas importantes
- Analiza los cambios de DB del feature actual (mira git diff, archivos modificados en db/, y cambios en el DbContext)
- Los scripts deben ser T-SQL (SQL Server), no PostgreSQL
- NUNCA incluir datos sensibles (PAN, CVV, passwords reales)
- Los validate scripts deben ser identicos entre install/01 y rollback/02 (verifican el mismo estado)
- CardTokenRef en seed data: usar tok_sandbox_* (nunca PAN)
