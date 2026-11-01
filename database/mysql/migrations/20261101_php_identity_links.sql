-- Stable bridge between legacy BIGINT ASP.NET Identity IDs and GUID-based core-domain identities.
-- Existing users are intentionally not auto-mapped; their GUIDs must be reconciled from source databases.
CREATE TABLE IF NOT EXISTS PhpIdentityLinks (
    LegacyUserId BIGINT NOT NULL,
    CoreUserId CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    MappingSource VARCHAR(32) NOT NULL,
    VerifiedAt DATETIME(6) NULL,
    CreatedOn DATETIME(6) NOT NULL,
    PRIMARY KEY (LegacyUserId),
    UNIQUE KEY uq_php_identity_core_guid (CoreUserId),
    KEY idx_php_identity_source (MappingSource),
    CONSTRAINT fk_php_identity_legacy_user
        FOREIGN KEY (LegacyUserId) REFERENCES AspNetUsers(Id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
