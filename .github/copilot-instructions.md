# AcquirerLite — Copilot Instructions

## Project Overview
AcquirerLite is a mini-acquirer workshop app: merchants, terminals, transactions, and settlement batches.

## Stack
- **Backend:** .NET 10 / C# 13, ASP.NET Core controllers, EF Core, native DI + Options, Serilog
- **Frontend:** Angular 19 standalone components, signals, `inject()`, control flow (`@if`/`@for`), typed forms
- **Database:** SQL Server 2022 in container, connected via EF Core

## Critical Security Rule
**NEVER** store PAN, CVV, or cardholder data. Only `CardTokenRef` (token/reference) is allowed. This is a PCI-compliant tokenization pattern. Any generated code that stores raw card data MUST be rejected.

## Domain
- **Merchants** have Terminals. Terminals process Transactions.
- **Transaction states:** Authorized → Captured → Settled (via batch) | Voided | Refunded
- **Settlement:** closing a batch sums all Captured transactions, marks them Settled, updates TotalAmount, marks batch Settled — all in a DB transaction.

## Conventions
- Use `record` types for DTOs
- Mask card token refs in API responses: `tok_••XX` (last 2 chars)
- Use `DateOnly` for batch dates, `DateTime` with UTC for timestamps
- Frontend: standalone components, lazy-loaded routes, signals for state
