#!/usr/bin/env node
// TODO (Día 3): Implementar MCP server para AcquirerLite
//
// Este servidor MCP debe exponer la API REST de AcquirerLite
// para que Copilot pueda consultar y operar el sistema directamente.
//
// Tools a implementar:
// 1. list_merchants — Lista merchants con status y terminal count
// 2. get_merchant — Detalle de merchant con sus terminals
// 3. list_transactions — Transacciones de un merchant (cards enmascaradas)
// 4. list_batches — Batches de un merchant con captured count
// 5. get_batch — Detalle de batch con sus transacciones
// 6. settle_batch — Liquidar un batch Open (POST, irreversible)
//
// Resources:
// 1. acquirerlite://schema — Schema de la DB con reglas de negocio
//
// Setup:
// - import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js"
// - import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js"
// - API base URL: process.env.ACQUIRERLITE_API_URL || "http://localhost:5100"
// - Usar zod (viene incluido en el SDK) para validar argumentos
// - Formatear respuestas como texto legible (no JSON crudo)
