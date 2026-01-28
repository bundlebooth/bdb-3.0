/*
    Migration Script: Create Table [Subcategories]
    Phase: 100 - Tables
    Script: pb_100_91_Subcategories.sql
    Description: Creates the [admin].[Subcategories] lookup table for category-specific subcategories (admin-managed reference data)
    
    Execution Order: 91
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[Subcategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Subcategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Subcategories](
        [SubcategoryID] [int] IDENTITY(1,1) NOT NULL,
        [Category] [nvarchar](50) NOT NULL,
        [SubcategoryKey] [nvarchar](50) NOT NULL,
        [SubcategoryName] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](500) NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [SubcategoryID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [UQ_Subcategories_CategoryKey] UNIQUE NONCLUSTERED ([Category], [SubcategoryKey])
    );
    PRINT 'Table [admin].[Subcategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Subcategories] already exists. Skipping.';
END
GO
