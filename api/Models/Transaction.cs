namespace AcquirerLite.Api.Models;

public class Transaction
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public int TerminalId { get; set; }
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string CardTokenRef { get; set; } = string.Empty;
    public string AuthCode { get; set; } = string.Empty;
    public TransactionStatus Status { get; set; } = TransactionStatus.Authorized;
    public int? BatchId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Merchant Merchant { get; set; } = null!;
    public Terminal Terminal { get; set; } = null!;
    public SettlementBatch? Batch { get; set; }
}

public enum TransactionStatus { Authorized, Captured, Declined, Voided, Refunded, Settled }
