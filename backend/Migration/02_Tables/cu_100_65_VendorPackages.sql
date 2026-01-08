-- =============================================
-- Vendor Packages Table
-- Allows vendors to create packages with multiple services, pricing, sale prices, and images
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
        [PriceType] NVARCHAR(50) NOT NULL DEFAULT 'fixed', -- 'fixed' or 'per_person'
        [ImageURL] NVARCHAR(500) NULL,
        [FinePrint] NVARCHAR(MAX) NULL,
        [IncludedServices] NVARCHAR(MAX) NULL, -- JSON array of service IDs and names
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_VendorPackages_VendorProfiles] FOREIGN KEY ([VendorProfileID]) 
            REFERENCES [vendors].[VendorProfiles]([VendorProfileID]) ON DELETE CASCADE
    );

    -- Create index for faster lookups
    CREATE INDEX [IX_VendorPackages_VendorProfileID] ON [vendors].[Packages]([VendorProfileID]);
    CREATE INDEX [IX_VendorPackages_IsActive] ON [vendors].[Packages]([IsActive]);
    
    PRINT 'Created vendors.Packages table';
END
ELSE
BEGIN
    PRINT 'vendors.Packages table already exists - checking for missing columns';
    
    -- Add PackageName column if it doesn't exist (old schema used 'Name')
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'PackageName')
    BEGIN
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'Name')
        BEGIN
            EXEC sp_rename 'vendors.Packages.Name', 'PackageName', 'COLUMN';
            PRINT 'Renamed Name column to PackageName';
        END
        ELSE
        BEGIN
            ALTER TABLE [vendors].[Packages] ADD [PackageName] NVARCHAR(200) NOT NULL DEFAULT '';
            PRINT 'Added PackageName column';
        END
    END
    
    -- Add SalePrice column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'SalePrice')
    BEGIN
        ALTER TABLE [vendors].[Packages] ADD [SalePrice] DECIMAL(10, 2) NULL;
        PRINT 'Added SalePrice column';
    END
    
    -- Add PriceType column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'PriceType')
    BEGIN
        ALTER TABLE [vendors].[Packages] ADD [PriceType] NVARCHAR(50) NOT NULL DEFAULT 'fixed';
        PRINT 'Added PriceType column';
    END
    
    -- Add ImageURL column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'ImageURL')
    BEGIN
        ALTER TABLE [vendors].[Packages] ADD [ImageURL] NVARCHAR(500) NULL;
        PRINT 'Added ImageURL column';
    END
    
    -- Add FinePrint column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'FinePrint')
    BEGIN
        ALTER TABLE [vendors].[Packages] ADD [FinePrint] NVARCHAR(MAX) NULL;
        PRINT 'Added FinePrint column';
    END
    
    -- Add IncludedServices column if it doesn't exist
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID(N'[vendors].[Packages]') AND name = 'IncludedServices')
    BEGIN
        ALTER TABLE [vendors].[Packages] ADD [IncludedServices] NVARCHAR(MAX) NULL;
        PRINT 'Added IncludedServices column';
    END
END
GO
