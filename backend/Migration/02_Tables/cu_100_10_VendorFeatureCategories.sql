/*
    Migration Script: Create Table [VendorFeatureCategories]
    Phase: 100 - Tables
    Script: cu_100_10_dbo.VendorFeatureCategories.sql
    Description: Creates the [vendors].[VendorFeatureCategories] table
    
    Execution Order: 10
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorFeatureCategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorFeatureCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorFeatureCategories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[CategoryName] [nvarchar](100) NOT NULL,
	[CategoryIcon] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[ApplicableVendorCategories] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorFeatureCategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorFeatureCategories] already exists. Skipping.';
END
GO
