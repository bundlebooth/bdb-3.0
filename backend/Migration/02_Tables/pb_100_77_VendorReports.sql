-- ============================================================
-- Vendor Reports Table
-- For tracking reported vendor listings
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VendorReports' AND schema_id = SCHEMA_ID('vendors'))
BEGIN
    CREATE TABLE vendors.VendorReports (
        ReportID INT IDENTITY(1,1) PRIMARY KEY,
        VendorProfileID INT NOT NULL,
        ReportedByUserID INT NULL,
        Reason NVARCHAR(50) NOT NULL,
        Details NVARCHAR(MAX) NULL,
        Status NVARCHAR(20) DEFAULT 'pending', -- pending, reviewed, resolved, dismissed
        AdminNotes NVARCHAR(MAX) NULL,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        ReviewedAt DATETIME2 NULL,
        ReviewedByAdminID INT NULL,
        CONSTRAINT FK_VendorReports_VendorProfile FOREIGN KEY (VendorProfileID) 
            REFERENCES vendors.VendorProfiles(VendorProfileID)
    );
    
    CREATE INDEX IX_VendorReports_VendorProfileID ON vendors.VendorReports(VendorProfileID);
    CREATE INDEX IX_VendorReports_Status ON vendors.VendorReports(Status);
END
GO
