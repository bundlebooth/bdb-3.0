/*
    Migration Script: Create Table [VendorCategories]
    Phase: 100 - Tables
    Script: cu_100_21_dbo.VendorCategories.sql
    Description: Creates the [dbo].[VendorCategories] table
    
    Execution Order: 21
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorCategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorCategories](
	[VendorCategoryID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Category] [nvarchar](50) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[VendorCategoryID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorCategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorCategories] already exists. Skipping.';
END
GO
