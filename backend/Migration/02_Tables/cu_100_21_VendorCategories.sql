/*
    Migration Script: Create Table [VendorCategories]
    Phase: 100 - Tables
    Script: cu_100_21_dbo.VendorCategories.sql
    Description: Creates the [vendors].[VendorCategories] table
    
    Execution Order: 21
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorCategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorCategories](
	[VendorCategoryID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Category] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorCategoryID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorCategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorCategories] already exists. Skipping.';
END
GO
