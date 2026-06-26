namespace AcquirerLite.Api.Models;

public class SettlementBatch
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public DateOnly BatchDate { get; set; }
    public BatchStatus Status { get; set; } = BatchStatus.Open;
    public decimal TotalAmount { get; set; }
    public DateTime? SettledAt { get; set; }

    public Merchant Merchant { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
}

public enum BatchStatus { Open, Settled }
