using AcquirerLite.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AcquirerLite.Api.Data;

public class AcquirerDbContext(DbContextOptions<AcquirerDbContext> options) : DbContext(options)
{
    public DbSet<Merchant> Merchants => Set<Merchant>();
    public DbSet<Terminal> Terminals => Set<Terminal>();
    public DbSet<Transaction> Transactions => Set<Transaction>();
    public DbSet<SettlementBatch> SettlementBatches => Set<SettlementBatch>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Merchant>(e =>
        {
            e.HasIndex(m => m.MerchantCode).IsUnique();
            e.Property(m => m.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Terminal>(e =>
        {
            e.HasIndex(t => t.TerminalCode).IsUnique();
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
        });

        modelBuilder.Entity<Transaction>(e =>
        {
            e.Property(t => t.Amount).HasPrecision(18, 2);
            e.Property(t => t.Currency).HasMaxLength(3);
            e.Property(t => t.CardTokenRef).HasMaxLength(50);
            e.Property(t => t.AuthCode).HasMaxLength(10);
            e.Property(t => t.Status).HasConversion<string>().HasMaxLength(20);
            e.HasIndex(t => t.MerchantId);
            e.HasIndex(t => t.BatchId);
        });

        modelBuilder.Entity<SettlementBatch>(e =>
        {
            e.Property(b => b.TotalAmount).HasPrecision(18, 2);
            e.Property(b => b.Status).HasConversion<string>().HasMaxLength(20);
        });
    }
}
