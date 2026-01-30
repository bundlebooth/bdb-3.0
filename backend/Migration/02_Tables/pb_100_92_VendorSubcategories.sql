/*
    Migration Script: Create Table [Subcategories]
    Phase: 100 - Tables
    Script: pb_100_92_VendorSubcategories.sql
    Description: Creates the [vendors].[Subcategories] junction table for vendor subcategory selections
    
    Execution Order: 92
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[Subcategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[Subcategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[Subcategories](
        [VendorSubcategoryID] [int] IDENTITY(1,1) NOT NULL,
        [VendorProfileID] [int] NOT NULL,
        [SubcategoryID] [int] NOT NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [VendorSubcategoryID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [FK_Subcategories_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [vendors].[VendorProfiles]([VendorProfileID]),
    CONSTRAINT [FK_Subcategories_AdminSubcategories] FOREIGN KEY ([SubcategoryID]) REFERENCES [admin].[Subcategories]([SubcategoryID]),
    CONSTRAINT [UQ_VendorSubcategories] UNIQUE NONCLUSTERED ([VendorProfileID], [SubcategoryID])
    );
    PRINT 'Table [vendors].[Subcategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[Subcategories] already exists. Skipping.';
END
GO
