-- =============================================
-- Vendor Packages Table
-- Allows vendors to create packages with multiple services, pricing models, and images
-- Pricing Models: time_based (hourly), fixed_price, per_attendee
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Packages] (
        [PackageID] INT IDENTITY(1,1) PRIMARY KEY,
        [VendorProfileID] INT NOT NULL,
        [PackageName] NVARCHAR(200) NOT NULL,
        [Description] NVARCHAR(MAX) NULL,
        [Price] DECIMAL(10, 2) NOT NULL,
        [SalePrice] DECIMAL(10, 2) NULL,
        [PriceType] NVARCHAR(50) NOT NULL DEFAULT 'fixed_price',
        [DurationMinutes] INT NULL,
        [ImageURL] NVARCHAR(500) NULL,
        [FinePrint] NVARCHAR(MAX) NULL,
        [IncludedServices] NVARCHAR(MAX) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [BaseRate] DECIMAL(10, 2) NULL,
        [OvertimeRate] DECIMAL(10, 2) NULL,
        [FixedPrice] DECIMAL(10, 2) NULL,
        [PricePerPerson] DECIMAL(10, 2) NULL,
        [MinAttendees] INT NULL,
        [MaxAttendees] INT NULL,
        
        CONSTRAINT [FK_VendorPackages_VendorProfiles] FOREIGN KEY ([VendorProfileID]) 
            REFERENCES [vendors].[VendorProfiles]([VendorProfileID]) ON DELETE CASCADE
    );

    CREATE INDEX [IX_VendorPackages_VendorProfileID] ON [vendors].[Packages]([VendorProfileID]);
    CREATE INDEX [IX_VendorPackages_IsActive] ON [vendors].[Packages]([IsActive]);
    
    PRINT 'Created vendors.Packages table';
END
ELSE
BEGIN
    PRINT 'vendors.Packages table already exists';
END
GO
