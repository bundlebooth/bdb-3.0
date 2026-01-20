/*
    Migration Script: Create Table [FAQCategories]
    Phase: 100 - Tables
    Script: cu_100_70_admin.FAQCategories.sql
    Description: Creates the [admin].[FAQCategories] table for organizing Help Centre FAQs
    
    Execution Order: 70
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[FAQCategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[FAQCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[FAQCategories](
        [CategoryID] [int] IDENTITY(1,1) NOT NULL,
        [Name] [nvarchar](100) NOT NULL,
        [Slug] [nvarchar](100) NOT NULL,
        [Description] [nvarchar](500) NULL,
        [Icon] [nvarchar](50) NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [ParentCategoryID] [int] NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [CategoryID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [UQ_FAQCategories_Slug] UNIQUE NONCLUSTERED ([Slug])
    );
    PRINT 'Table [admin].[FAQCategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[FAQCategories] already exists. Skipping.';
END
GO
