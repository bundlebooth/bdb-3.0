/*
    Migration Script: Create Table [VendorPortfolio]
    Phase: 100 - Tables
    Script: cu_100_26_dbo.VendorPortfolio.sql
    Description: Creates the [dbo].[VendorPortfolio] table
    
    Execution Order: 26
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorPortfolio]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorPortfolio]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorPortfolio](
	[PortfolioID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Title] [nvarchar](100) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[ImageURL] [nvarchar](255) NOT NULL,
	[ProjectDate] [date] NULL,
	[DisplayOrder] [int] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[PortfolioID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorPortfolio] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorPortfolio] already exists. Skipping.';
END
GO
