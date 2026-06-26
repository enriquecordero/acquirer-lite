namespace AcquirerLite.Api.Models;

public class Merchant
{
    public int Id { get; set; }
    public string LegalName { get; set; } = string.Empty;
    public string MerchantCode { get; set; } = string.Empty;
    public MerchantStatus Status { get; set; } = MerchantStatus.Active;
    public DateTime OnboardedAt { get; set; } = DateTime.UtcNow;

    public ICollection<Terminal> Terminals { get; set; } = [];
    public ICollection<Transaction> Transactions { get; set; } = [];
    public ICollection<SettlementBatch> SettlementBatches { get; set; } = [];
}

public enum MerchantStatus { Active, Suspended, Closed }
