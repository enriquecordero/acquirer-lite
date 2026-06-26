namespace AcquirerLite.Api.Models;

public class Terminal
{
    public int Id { get; set; }
    public int MerchantId { get; set; }
    public string TerminalCode { get; set; } = string.Empty;
    public TerminalStatus Status { get; set; } = TerminalStatus.Active;

    public Merchant Merchant { get; set; } = null!;
    public ICollection<Transaction> Transactions { get; set; } = [];
}

public enum TerminalStatus { Active, Inactive }
