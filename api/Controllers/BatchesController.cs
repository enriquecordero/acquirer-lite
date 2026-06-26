using AcquirerLite.Api.Data;
using AcquirerLite.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcquirerLite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BatchesController(AcquirerDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<BatchListDto>>> GetByMerchant(
        [FromQuery] int merchantId)
    {
        return await db.SettlementBatches
            .Where(b => b.MerchantId == merchantId)
            .OrderByDescending(b => b.BatchDate)
            .Select(b => new BatchListDto(
                b.Id, b.BatchDate, b.Status,
                b.TotalAmount, b.SettledAt,
                b.Transactions.Count(t => t.Status == TransactionStatus.Captured)))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<BatchDetailDto>> Get(int id)
    {
        var batch = await db.SettlementBatches
            .Include(b => b.Transactions.Where(t => t.Status == TransactionStatus.Captured))
                .ThenInclude(t => t.Terminal)
            .Include(b => b.Merchant)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (batch is null) return NotFound();

        return new BatchDetailDto(
            batch.Id,
            batch.MerchantId,
            batch.Merchant.LegalName,
            batch.Merchant.MerchantCode,
            batch.BatchDate,
            batch.Status,
            batch.Transactions.Select(t => new BatchTransactionDto(
                t.Id, t.Terminal.TerminalCode, t.AuthCode,
                MaskToken(t.CardTokenRef), t.Amount)).ToList(),
            batch.Transactions.Sum(t => t.Amount));
    }

    // TODO (Día 2): Implementar POST /api/batches/{id}/settle
    // La operación debe:
    // 1. Abrir una transacción de DB
    // 2. Obtener el batch con sus transacciones Captured
    // 3. Validar que el batch esté Open y tenga transacciones
    // 4. Sumar los montos, marcar transacciones como Settled
    // 5. Marcar el batch como Settled con TotalAmount y SettledAt
    // 6. Commit de la transacción

    private static string MaskToken(string token)
    {
        if (token.Length <= 4) return token;
        return $"tok_••{token[^2..]}";
    }
}

public record BatchListDto(int Id, DateOnly BatchDate, BatchStatus Status, decimal TotalAmount, DateTime? SettledAt, int CapturedCount);
public record BatchDetailDto(int Id, int MerchantId, string MerchantName, string MerchantCode, DateOnly BatchDate, BatchStatus Status, List<BatchTransactionDto> Transactions, decimal Total);
public record BatchTransactionDto(int Id, string TerminalCode, string AuthCode, string CardRef, decimal Amount);
