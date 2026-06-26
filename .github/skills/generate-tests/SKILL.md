# Generate Tests Skill

Genera pruebas unitarias y E2E para AcquirerLite.
Detecta la capa (API o Client) y aplica el framework correcto.

## Instrucciones

Cuando el usuario pida generar tests para un archivo o feature:

### 1. Detectar la capa

- Si el archivo está en `api/` → pruebas unitarias con **xUnit + Moq + FluentAssertions**
- Si el archivo está en `client/` → pruebas unitarias con **Jest** + pruebas E2E con **Playwright**
- Si no especifica archivo → preguntar qué quiere testear

### 2. Backend — xUnit (.NET)

#### Setup (si no existe el proyecto de tests)

```bash
# Crear proyecto de tests
dotnet new xunit -n AcquirerLite.Tests -o api.tests
dotnet add api.tests/AcquirerLite.Tests.csproj reference api/AcquirerLite.Api.csproj
dotnet add api.tests package Moq
dotnet add api.tests package FluentAssertions

# Crear solution si no existe
dotnet new sln -n AcquirerLite
dotnet sln add api/AcquirerLite.Api.csproj
dotnet sln add api.tests/AcquirerLite.Tests.csproj
```

#### Estructura de tests

```
api.tests/
├── Controllers/
│   ├── MerchantsControllerTests.cs
│   ├── TransactionsControllerTests.cs
│   └── BatchesControllerTests.cs
├── Services/
│   └── (si se extraen servicios)
├── Fixtures/
│   └── DbContextFixture.cs      ← InMemory EF Core
└── AcquirerLite.Tests.csproj
```

#### Reglas para tests .NET

- Usar **InMemoryDatabase** de EF Core para el DbContext, NO SQL Server real
- Naming: `MetodoQueTesteo_Escenario_ResultadoEsperado`
- Cada controller test recibe el DbContext mockeado via fixture
- Agrupar con `[Trait("Category", "Unit")]`
- El settle batch es la operación crítica — testear:
  - Batch Open con transacciones Captured → settle exitoso
  - Batch ya Settled → error 400
  - Batch sin transacciones Captured → error 400
  - Batch inexistente → 404
  - Verificar que TotalAmount = suma de montos Captured
  - Verificar que todas las transacciones cambian a Settled
  - Verificar que SettledAt se asigna
- CardTokenRef: verificar que NUNCA se devuelve sin máscara en responses
- Enums: verificar serialización como string, no int

#### Ejemplo de test

```csharp
public class BatchesControllerTests : IClassFixture<DbContextFixture>
{
    private readonly AcquirerLiteContext _context;
    private readonly BatchesController _controller;

    public BatchesControllerTests(DbContextFixture fixture)
    {
        _context = fixture.CreateContext();
        _controller = new BatchesController(_context);
    }

    [Fact]
    [Trait("Category", "Unit")]
    public async Task Settle_OpenBatchWithCaptured_ReturnsOkAndSettlesBatch()
    {
        // Arrange — batch Open con 3 transacciones Captured
        var merchant = new Merchant { MerchantCode = "T001", LegalName = "Test", Status = MerchantStatus.Active };
        _context.Merchants.Add(merchant);
        await _context.SaveChangesAsync();

        var batch = new SettlementBatch { MerchantId = merchant.Id, Status = BatchStatus.Open };
        _context.SettlementBatches.Add(batch);
        await _context.SaveChangesAsync();

        for (int i = 0; i < 3; i++)
            _context.Transactions.Add(new Transaction
            {
                MerchantId = merchant.Id,
                BatchId = batch.Id,
                Amount = 100.00m,
                Status = TransactionStatus.Captured,
                CardTokenRef = $"tok_sandbox_test{i}"
            });
        await _context.SaveChangesAsync();

        // Act
        var result = await _controller.Settle(batch.Id);

        // Assert
        result.Should().BeOfType<OkObjectResult>();
        var settled = await _context.SettlementBatches.FindAsync(batch.Id);
        settled!.Status.Should().Be(BatchStatus.Settled);
        settled.TotalAmount.Should().Be(300.00m);
    }
}
```

#### Ejecutar

```bash
dotnet test api.tests --verbosity normal
```

---

### 3. Frontend — Jest (unitarias) + Playwright (E2E)

#### Setup Jest (si no está instalado)

```bash
cd client
npm install --save-dev jest @jest/globals ts-jest @types/jest
npx ts-jest config:init
```

Agregar a `package.json`:
```json
"scripts": {
  "test:unit": "jest"
}
```

#### Setup Playwright (si no está instalado)

```bash
cd client
npm init playwright@latest
# Seleccionar: TypeScript, tests folder: e2e, NO GitHub Actions, instalar browsers
```

Agregar a `package.json`:
```json
"scripts": {
  "test:e2e": "npx playwright test",
  "test:e2e:ui": "npx playwright test --ui"
}
```

#### Estructura de tests frontend

```
client/
├── src/app/
│   ├── services/
│   │   └── api.service.spec.ts        ← Jest unit
│   ├── merchants/
│   │   └── merchant-list.component.spec.ts
│   ├── batches/
│   │   └── batch-settle.component.spec.ts
│   └── transactions/
│       └── transaction-list.component.spec.ts
├── e2e/
│   ├── merchants.spec.ts              ← Playwright E2E
│   ├── transactions.spec.ts
│   ├── settle-batch.spec.ts
│   └── playwright.config.ts
```

#### Reglas para tests Jest (unitarias)

- Mockear HttpClient con `jest.fn()`
- Testear services y component logic, NO templates
- Signals: testear que `computed()` y `effect()` reaccionan correctamente
- Verificar que `cardRef` se muestra enmascarado (`tok_••XX`)

#### Reglas para tests Playwright (E2E)

- Base URL: `http://localhost:4200` (Angular dev server con proxy)
- Prerequisito: API corriendo en `:5100` y Angular en `:4200`
- Usar `page.getByRole()` y `page.getByText()` — evitar selectores CSS frágiles
- Testear flujos completos:
  - Navegar a merchants → ver lista → click en merchant → ver terminals
  - Navegar a transactions → filtrar por merchant → verificar cards enmascaradas
  - Navegar a batches → ver batch Open → ejecutar settle → verificar estado Settled
- El settle batch E2E es el **test más importante**:
  1. Navegar a batches del merchant M001
  2. Verificar Batch 1 está Open con 24 Captured
  3. Click en Settle
  4. Verificar que cambia a Settled
  5. Verificar que TotalAmount se muestra
  6. Verificar que transacciones cambian a Settled
- Screenshots en failures: `use: { screenshot: 'only-on-failure' }`

#### Ejemplo Playwright

```typescript
import { test, expect } from '@playwright/test';

test.describe('Settle Batch', () => {
  test('should settle an open batch with captured transactions', async ({ page }) => {
    await page.goto('/batches');

    // Verify batch is Open
    await expect(page.getByText('Open')).toBeVisible();
    await expect(page.getByText('24 captured')).toBeVisible();

    // Settle
    await page.getByRole('button', { name: /settle/i }).click();

    // Confirm
    await expect(page.getByText('Settled')).toBeVisible();
    await expect(page.getByText('24 captured')).not.toBeVisible();
  });

  test('should mask card references in transaction list', async ({ page }) => {
    await page.goto('/transactions');
    const cards = page.locator('[data-testid="card-ref"]');
    const count = await cards.count();
    for (let i = 0; i < count; i++) {
      const text = await cards.nth(i).textContent();
      expect(text).toMatch(/tok_••\w{2}/);
    }
  });
});
```

#### Ejecutar Playwright

```bash
# Asegurarse que API y Angular están corriendo
cd client
npx playwright test                    # headless
npx playwright test --ui               # con UI interactiva
npx playwright test --project=chromium # solo Chrome
npx playwright show-report             # ver reporte HTML
```

---

### 4. Ambas capas

Si el usuario pide "genera todos los tests":

1. Crear proyecto xUnit + tests de controllers
2. Instalar Jest + tests de services/components
3. Instalar Playwright + tests E2E de flujos
4. Agregar script combinado en el root:

```json
// package.json (root)
"scripts": {
  "test:api": "dotnet test api.tests",
  "test:unit": "cd client && npm run test:unit",
  "test:e2e": "cd client && npm run test:e2e",
  "test:all": "npm run test:api && npm run test:unit && npm run test:e2e"
}
```

## Seguridad en tests

- NUNCA usar PAN reales en test data — siempre `tok_sandbox_*` o `tok_test_*`
- NUNCA hardcodear passwords de producción
- Test data debe usar el mismo patrón que `db/seed.sql`
