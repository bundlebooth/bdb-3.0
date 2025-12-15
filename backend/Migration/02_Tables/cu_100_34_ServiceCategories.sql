/*
    Migration Script: Create Table [ServiceCategories]
    Phase: 100 - Tables
    Script: cu_100_34_dbo.ServiceCategories.sql
    Description: Creates the [dbo].[ServiceCategories] table
    
    Execution Order: 34
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[ServiceCategories]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ServiceCategories]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ServiceCategories](
	[CategoryID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Name] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[CategoryID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[ServiceCategories] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[ServiceCategories] already exists. Skipping.';
END
GO
