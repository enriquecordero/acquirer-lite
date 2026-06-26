using AcquirerLite.Api.Data;
using AcquirerLite.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AcquirerLite.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class MerchantsController(AcquirerDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<List<MerchantListDto>>> GetAll(
        [FromQuery] string? search,
        [FromQuery] MerchantStatus? status)
    {
        var query = db.Merchants.AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            query = query.Where(m =>
                m.LegalName.Contains(search) || m.MerchantCode.Contains(search));

        if (status.HasValue)
            query = query.Where(m => m.Status == status.Value);

        return await query
            .Select(m => new MerchantListDto(
                m.Id, m.MerchantCode, m.LegalName,
                m.Terminals.Count, m.Status))
            .ToListAsync();
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<MerchantDetailDto>> Get(int id)
    {
        var m = await db.Merchants
            .Include(m => m.Terminals)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (m is null) return NotFound();

        return new MerchantDetailDto(
            m.Id, m.MerchantCode, m.LegalName,
            m.Status, m.OnboardedAt,
            m.Terminals.Select(t => new TerminalDto(
                t.Id, t.TerminalCode, t.Status)).ToList());
    }

    [HttpPost]
    public async Task<ActionResult<MerchantDetailDto>> Create(CreateMerchantDto dto)
    {
        var merchant = new Merchant
        {
            LegalName = dto.LegalName,
            MerchantCode = dto.MerchantCode
        };

        db.Merchants.Add(merchant);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(Get), new { id = merchant.Id },
            new MerchantDetailDto(
                merchant.Id, merchant.MerchantCode, merchant.LegalName,
                merchant.Status, merchant.OnboardedAt, []));
    }
}

public record MerchantListDto(int Id, string MerchantCode, string LegalName, int TerminalCount, MerchantStatus Status);
public record MerchantDetailDto(int Id, string MerchantCode, string LegalName, MerchantStatus Status, DateTime OnboardedAt, List<TerminalDto> Terminals);
public record TerminalDto(int Id, string TerminalCode, TerminalStatus Status);
public record CreateMerchantDto(string LegalName, string MerchantCode);
