#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = process.env.ACQUIRERLITE_API_URL || "http://localhost:5100";

async function api(path) {
  const res = await fetch(`${API_BASE}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

async function apiPost(path) {
  const res = await fetch(`${API_BASE}${path}`, { method: "POST" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new McpServer({
  name: "acquirerlite",
  version: "1.0.0",
});

// --- Tools ---

server.tool(
  "list_merchants",
  "List all merchants with their status and terminal count",
  {},
  async () => {
    const merchants = await api("/api/merchants");
    const lines = merchants.map(
      (m) =>
        `${m.merchantCode} | ${m.legalName} | ${m.status} | ${m.terminalCount} terminals`
    );
    return {
      content: [
        {
          type: "text",
          text: `${merchants.length} merchants:\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "get_merchant",
  "Get merchant details including terminals",
  { merchantId: z.number().describe("Merchant ID") },
  async ({ merchantId }) => {
    const m = await api(`/api/merchants/${merchantId}`);
    const terminals = m.terminals
      .map((t) => `  ${t.terminalCode} (${t.status})`)
      .join("\n");
    return {
      content: [
        {
          type: "text",
          text: `${m.merchantCode} — ${m.legalName}\nStatus: ${m.status}\nOnboarded: ${m.onboardedAt}\n\nTerminals:\n${terminals}`,
        },
      ],
    };
  }
);

server.tool(
  "list_transactions",
  "List transactions for a merchant, showing masked card refs",
  { merchantId: z.number().describe("Merchant ID") },
  async ({ merchantId }) => {
    const txns = await api(`/api/transactions?merchantId=${merchantId}`);
    const lines = txns.map(
      (t) =>
        `#${t.id} | ${t.terminalCode} | $${t.amount.toFixed(2)} ${t.currency} | ${t.status} | ${t.cardRef} | auth:${t.authCode}`
    );
    return {
      content: [
        {
          type: "text",
          text: `${txns.length} transactions for merchant ${merchantId}:\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "list_batches",
  "List settlement batches for a merchant with captured count",
  { merchantId: z.number().describe("Merchant ID") },
  async ({ merchantId }) => {
    const batches = await api(`/api/batches?merchantId=${merchantId}`);
    const lines = batches.map(
      (b) =>
        `Batch #${b.id} | ${b.batchDate} | ${b.status} | $${b.totalAmount.toFixed(2)} | ${b.capturedCount} captured`
    );
    return {
      content: [
        {
          type: "text",
          text: `${batches.length} batches for merchant ${merchantId}:\n${lines.join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "get_batch",
  "Get batch details with its captured transactions",
  { batchId: z.number().describe("Batch ID") },
  async ({ batchId }) => {
    const b = await api(`/api/batches/${batchId}`);
    const txLines = b.transactions.map(
      (t) =>
        `  #${t.id} | ${t.terminalCode} | ${t.authCode} | ${t.cardRef} | $${t.amount.toFixed(2)}`
    );
    return {
      content: [
        {
          type: "text",
          text: `Batch #${b.id} — ${b.merchantName} (${b.merchantCode})\nDate: ${b.batchDate}\nStatus: ${b.status}\nTotal: $${b.total.toFixed(2)}\n\n${b.transactions.length} transactions:\n${txLines.join("\n")}`,
        },
      ],
    };
  }
);

server.tool(
  "settle_batch",
  "Settle an open batch — marks all Captured transactions as Settled and calculates TotalAmount. This is irreversible.",
  { batchId: z.number().describe("Batch ID to settle") },
  async ({ batchId }) => {
    const result = await apiPost(`/api/batches/${batchId}/settle`);
    return {
      content: [
        {
          type: "text",
          text: `Batch #${result.id} settled successfully.\nStatus: ${result.status}\nTotal: $${result.total.toFixed(2)}\nTransactions settled: ${result.transactions.length}`,
        },
      ],
    };
  }
);

// --- Resources ---

server.resource("schema", "acquirerlite://schema", async (uri) => ({
  contents: [
    {
      uri: uri.href,
      mimeType: "text/plain",
      text: `AcquirerLite Database Schema:

Merchants: Id, MerchantCode (unique), LegalName, Status (Active|Suspended|Closed), OnboardedAt
Terminals: Id, MerchantId (FK), TerminalCode (unique), Status (Active|Inactive)
Transactions: Id, MerchantId (FK), TerminalId (FK), Amount (decimal), Currency, CardTokenRef (tok_sandbox_*), AuthCode, Status (Authorized|Captured|Declined|Voided|Refunded|Settled), BatchId (FK, nullable), CreatedAt
SettlementBatches: Id, MerchantId (FK), BatchDate, Status (Open|Settled), TotalAmount, SettledAt

Transaction lifecycle: Authorized → Captured → Settled (via batch) | Voided | Refunded
Settlement: POST /api/batches/{id}/settle closes an Open batch by summing Captured transactions.

SECURITY: CardTokenRef is always masked as tok_••XX in API responses. NEVER store PAN/CVV.`,
    },
  ],
}));

// --- Start ---

const transport = new StdioServerTransport();
await server.connect(transport);
