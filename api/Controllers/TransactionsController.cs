using AcquirerLite.Api.Data;
using AcquirerLite.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcquirerLite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TransactionsController(AcquirerDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<TransactionDto>>> GetByMerchant(
        [FromQuery] int merchantId,
        [FromQuery] TransactionStatus? status)
    {
        var query = db.Transactions
            .Where(t => t.MerchantId == merchantId);

        if (status.HasValue)
            query = query.Where(t => t.Status == status.Value);

        return await query
            .OrderByDescending(t => t.CreatedAt)
            .Select(t => new TransactionDto(
                t.Id, t.TerminalId, t.Terminal.TerminalCode,
                t.Amount, t.Currency, MaskToken(t.CardTokenRef),
                t.AuthCode, t.Status, t.BatchId, t.CreatedAt))
            .ToListAsync();
    }

    private static string MaskToken(string token)
    {
        if (token.Length <= 4) return token;
        return $"tok_••{token[^2..]}";
    }
}

public record TransactionDto(
    int Id, int TerminalId, string TerminalCode,
    decimal Amount, string Currency, string CardRef,
    string AuthCode, TransactionStatus Status,
    int? BatchId, DateTime CreatedAt);
