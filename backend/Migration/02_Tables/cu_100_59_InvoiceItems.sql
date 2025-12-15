/*
    Migration Script: Create Table [InvoiceItems]
    Phase: 100 - Tables
    Script: cu_100_59_dbo.InvoiceItems.sql
    Description: Creates the [dbo].[InvoiceItems] table
    
    Execution Order: 59
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[InvoiceItems]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[InvoiceItems]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[InvoiceItems](
	[InvoiceItemID] [int] IDENTITY(1,1) NOT NULL,
	[InvoiceID] [int] NOT NULL,
	[ItemType] [nvarchar](50) NOT NULL,
	[RefID] [int] NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NULL,
	[Quantity] [decimal](10, 2) NOT NULL,
	[UnitPrice] [decimal](10, 2) NOT NULL,
	[Amount] [decimal](10, 2) NOT NULL,
	[IsPayable] [bit] NOT NULL,
	[CreatedAt] [datetime] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[InvoiceItemID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[InvoiceItems] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[InvoiceItems] already exists. Skipping.';
END
GO
