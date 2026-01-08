-- =============================================
-- Vendor Badges Table
-- Stores badges assigned to vendors (New, Top Rated, Choice Awards, Premium, etc.)
-- =============================================

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorBadges]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorBadges] (
        [BadgeID] INT IDENTITY(1,1) PRIMARY KEY,
        [VendorProfileID] INT NOT NULL,
        [BadgeType] NVARCHAR(50) NOT NULL, -- 'new_vendor', 'top_rated', 'choice_award', 'premium', 'verified', 'featured'
        [BadgeName] NVARCHAR(100) NULL, -- Custom name like "Toronto's Choice Award 2024"
        [Year] INT NULL, -- Year the badge was awarded
        [ImageURL] NVARCHAR(500) NULL, -- Custom badge image
        [Description] NVARCHAR(500) NULL,
        [IsActive] BIT NOT NULL DEFAULT 1,
        [CreatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        [UpdatedAt] DATETIME NOT NULL DEFAULT GETDATE(),
        
        CONSTRAINT [FK_VendorBadges_VendorProfiles] FOREIGN KEY ([VendorProfileID]) 
            REFERENCES [vendors].[VendorProfiles]([VendorProfileID]) ON DELETE CASCADE
    );

    -- Create indexes for faster lookups
    CREATE INDEX [IX_VendorBadges_VendorProfileID] ON [vendors].[VendorBadges]([VendorProfileID]);
    CREATE INDEX [IX_VendorBadges_BadgeType] ON [vendors].[VendorBadges]([BadgeType]);
    CREATE INDEX [IX_VendorBadges_IsActive] ON [vendors].[VendorBadges]([IsActive]);
    
    PRINT 'Created vendors.VendorBadges table';
END
ELSE
BEGIN
    PRINT 'vendors.VendorBadges table already exists';
END
GO
