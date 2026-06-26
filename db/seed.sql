-- AcquirerLite — Schema & Sandbox Data
-- NUNCA almacena PAN/CVV — solo CardTokenRef (tokens)

USE master;
GO

IF DB_ID('AcquirerLite') IS NOT NULL
    DROP DATABASE AcquirerLite;
GO

CREATE DATABASE AcquirerLite;
GO

USE AcquirerLite;
GO

-- ============================================================
-- TABLES
-- ============================================================

CREATE TABLE Merchants (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    LegalName       NVARCHAR(200)   NOT NULL,
    MerchantCode    VARCHAR(20)     NOT NULL UNIQUE,
    Status          VARCHAR(20)     NOT NULL DEFAULT 'Active'
                    CHECK (Status IN ('Active', 'Suspended', 'Closed')),
    OnboardedAt     DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE TABLE Terminals (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    MerchantId      INT             NOT NULL REFERENCES Merchants(Id),
    TerminalCode    VARCHAR(20)     NOT NULL UNIQUE,
    Status          VARCHAR(20)     NOT NULL DEFAULT 'Active'
                    CHECK (Status IN ('Active', 'Inactive'))
);

CREATE TABLE SettlementBatches (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    MerchantId      INT             NOT NULL REFERENCES Merchants(Id),
    BatchDate       DATE            NOT NULL,
    Status          VARCHAR(20)     NOT NULL DEFAULT 'Open'
                    CHECK (Status IN ('Open', 'Settled')),
    TotalAmount     DECIMAL(18,2)   NOT NULL DEFAULT 0,
    SettledAt       DATETIME2       NULL
);

CREATE TABLE Transactions (
    Id              INT IDENTITY(1,1) PRIMARY KEY,
    MerchantId      INT             NOT NULL REFERENCES Merchants(Id),
    TerminalId      INT             NOT NULL REFERENCES Terminals(Id),
    Amount          DECIMAL(18,2)   NOT NULL,
    Currency        CHAR(3)         NOT NULL DEFAULT 'USD',
    CardTokenRef    VARCHAR(50)     NOT NULL,  -- token, NUNCA PAN
    AuthCode        VARCHAR(10)     NOT NULL,
    Status          VARCHAR(20)     NOT NULL DEFAULT 'Authorized'
                    CHECK (Status IN ('Authorized','Captured','Declined','Voided','Refunded','Settled')),
    BatchId         INT             NULL REFERENCES SettlementBatches(Id),
    CreatedAt       DATETIME2       NOT NULL DEFAULT SYSUTCDATETIME()
);

CREATE INDEX IX_Transactions_MerchantId ON Transactions(MerchantId);
CREATE INDEX IX_Transactions_BatchId    ON Transactions(BatchId);
CREATE INDEX IX_Terminals_MerchantId    ON Terminals(MerchantId);

-- ============================================================
-- SANDBOX DATA (tokens fake — nunca PAN)
-- ============================================================

INSERT INTO Merchants (LegalName, MerchantCode, Status) VALUES
    (N'Café Rivera SRL',    'M001', 'Active'),
    (N'Tienda Pocitos',     'M002', 'Active'),
    (N'Bazar Centro',       'M003', 'Suspended');

INSERT INTO Terminals (MerchantId, TerminalCode, Status) VALUES
    (1, 'T-01', 'Active'),
    (1, 'T-02', 'Active'),
    (1, 'T-03', 'Inactive'),
    (2, 'T-04', 'Active'),
    (3, 'T-05', 'Active'),
    (3, 'T-06', 'Active');

-- Batch abierto para M001
INSERT INTO SettlementBatches (MerchantId, BatchDate, Status) VALUES
    (1, '2026-06-26', 'Open');

DECLARE @BatchId INT = SCOPE_IDENTITY();

-- Transacciones para M001 — mezcla de estados
INSERT INTO Transactions (MerchantId, TerminalId, Amount, Currency, CardTokenRef, AuthCode, Status, BatchId) VALUES
    (1, 1,  120.00, 'USD', 'tok_sandbox_4f71', 'A2F1', 'Captured', @BatchId),
    (1, 1,   54.50, 'USD', 'tok_sandbox_a208', 'A2F4', 'Captured', @BatchId),
    (1, 2,   90.00, 'USD', 'tok_sandbox_c933', 'A3B0', 'Captured', @BatchId),
    (1, 2,  215.00, 'USD', 'tok_sandbox_e112', 'A3B1', 'Captured', @BatchId),
    (1, 1,   78.00, 'USD', 'tok_sandbox_b445', 'A4C2', 'Captured', @BatchId),
    (1, 2,  340.00, 'USD', 'tok_sandbox_d667', 'A4C5', 'Captured', @BatchId),
    (1, 1,  160.00, 'USD', 'tok_sandbox_f789', 'A5D0', 'Captured', @BatchId),
    (1, 1,   45.00, 'USD', 'tok_sandbox_1234', 'A5D3', 'Captured', @BatchId),
    (1, 2,  520.00, 'USD', 'tok_sandbox_5678', 'A6E1', 'Captured', @BatchId),
    (1, 1,   92.50, 'USD', 'tok_sandbox_9abc', 'A6E4', 'Captured', @BatchId),
    (1, 2,  188.00, 'USD', 'tok_sandbox_def0', 'A7F2', 'Captured', @BatchId),
    (1, 1,   67.00, 'USD', 'tok_sandbox_1122', 'A7F5', 'Captured', @BatchId),
    (1, 2,  110.00, 'USD', 'tok_sandbox_3344', 'A8G0', 'Captured', @BatchId),
    (1, 1,  205.50, 'USD', 'tok_sandbox_5566', 'A8G3', 'Captured', @BatchId),
    (1, 2,   33.00, 'USD', 'tok_sandbox_7788', 'A9H1', 'Captured', @BatchId),
    (1, 1,  150.00, 'USD', 'tok_sandbox_99aa', 'A9H4', 'Captured', @BatchId),
    (1, 2,   88.00, 'USD', 'tok_sandbox_bbcc', 'B0I2', 'Captured', @BatchId),
    (1, 1,  275.00, 'USD', 'tok_sandbox_ddee', 'B0I5', 'Captured', @BatchId),
    (1, 2,   42.00, 'USD', 'tok_sandbox_ff00', 'B1J0', 'Captured', @BatchId),
    (1, 1,  130.00, 'USD', 'tok_sandbox_1a2b', 'B1J3', 'Captured', @BatchId),
    (1, 2,   98.50, 'USD', 'tok_sandbox_3c4d', 'B2K1', 'Captured', @BatchId),
    (1, 1,  310.00, 'USD', 'tok_sandbox_5e6f', 'B2K4', 'Captured', @BatchId),
    (1, 2,   56.00, 'USD', 'tok_sandbox_7g8h', 'B3L2', 'Captured', @BatchId),
    (1, 1,   50.00, 'USD', 'tok_sandbox_9i0j', 'B3L5', 'Captured', @BatchId);

-- Transacciones authorized (aún no captured) para M001
INSERT INTO Transactions (MerchantId, TerminalId, Amount, Currency, CardTokenRef, AuthCode, Status) VALUES
    (1, 1, 200.00, 'USD', 'tok_sandbox_new1', 'C1M0', 'Authorized'),
    (1, 2,  75.00, 'USD', 'tok_sandbox_new2', 'C1M3', 'Authorized');

-- Transacciones voided/declined para M001
INSERT INTO Transactions (MerchantId, TerminalId, Amount, Currency, CardTokenRef, AuthCode, Status) VALUES
    (1, 1,  30.00, 'USD', 'tok_sandbox_v001', 'D1N0', 'Voided'),
    (1, 2,  15.00, 'USD', 'tok_sandbox_d001', 'D1N3', 'Declined');

-- Transacciones para M002
INSERT INTO Transactions (MerchantId, TerminalId, Amount, Currency, CardTokenRef, AuthCode, Status) VALUES
    (2, 4, 450.00, 'USD', 'tok_sandbox_m2a1', 'E1O0', 'Authorized'),
    (2, 4, 125.00, 'USD', 'tok_sandbox_m2a2', 'E1O3', 'Captured');

-- Batch cerrado previo para M001 (histórico)
INSERT INTO SettlementBatches (MerchantId, BatchDate, Status, TotalAmount, SettledAt) VALUES
    (1, '2026-06-25', 'Settled', 2150.00, '2026-06-25T23:00:00');

PRINT 'AcquirerLite seed completed.';
GO
