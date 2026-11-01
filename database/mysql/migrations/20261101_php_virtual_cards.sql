-- PHP-owned virtual-card store. PAN/CVV are encrypted with the PHP AES-GCM key.
-- Legacy ASP.NET DataProtection ciphertext is not interchangeable with this format.
CREATE TABLE IF NOT EXISTS VirtualCards (
    Id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    TenantId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    LoanId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    UserId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    HolderName VARCHAR(120) NOT NULL,
    Last4 VARCHAR(8) NOT NULL,
    Bin VARCHAR(8) NOT NULL DEFAULT '9101',
    PanHash CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    PanEnc LONGTEXT NOT NULL,
    CvvEnc LONGTEXT NOT NULL,
    ExpMonth INT NOT NULL,
    ExpYear INT NOT NULL,
    `Limit` DECIMAL(18,2) NOT NULL,
    Spent DECIMAL(18,2) NOT NULL DEFAULT 0,
    PerTxnLimit DECIMAL(18,2) NOT NULL,
    Status VARCHAR(20) NOT NULL DEFAULT 'Active',
    CreatedOn DATETIME(6) NOT NULL,
    PRIMARY KEY (Id),
    UNIQUE KEY uq_virtual_cards_pan_hash (PanHash),
    KEY idx_virtual_cards_tenant_user (TenantId, UserId, CreatedOn),
    KEY idx_virtual_cards_tenant_loan (TenantId, LoanId, Status),
    KEY idx_virtual_cards_tenant_status (TenantId, Status, CreatedOn),
    CONSTRAINT fk_virtual_cards_tenant
        FOREIGN KEY (TenantId) REFERENCES Tenants(Id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_virtual_cards_identity
        FOREIGN KEY (UserId) REFERENCES PhpIdentityLinks(CoreUserId)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS VirtualCardTxns (
    Id CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    CardId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    Type VARCHAR(40) NOT NULL DEFAULT 'Charge',
    Amount DECIMAL(18,2) NOT NULL DEFAULT 0,
    Merchant VARCHAR(120) NOT NULL DEFAULT '',
    Reference VARCHAR(80) NOT NULL DEFAULT '',
    Note VARCHAR(200) NOT NULL DEFAULT '',
    CreatedOn DATETIME(6) NOT NULL,
    PRIMARY KEY (Id),
    KEY idx_virtual_card_txns_card_created (CardId, CreatedOn),
    KEY idx_virtual_card_txns_card_reference (CardId, Reference, Type),
    CONSTRAINT fk_virtual_card_txns_card
        FOREIGN KEY (CardId) REFERENCES VirtualCards(Id)
        ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
