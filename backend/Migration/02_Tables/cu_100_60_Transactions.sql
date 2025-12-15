/*
    Migration Script: Create Table [Transactions]
    Phase: 100 - Tables
    Script: cu_100_60_dbo.Transactions.sql
    Description: Creates the [dbo].[Transactions] table
    
    Execution Order: 60
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[Transactions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Transactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Transactions](
	[TransactionID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[BookingID] [int] NULL,
	[Amount] [decimal](10, 2) NOT NULL,
	[FeeAmount] [decimal](10, 2) NULL,
	[NetAmount] [decimal](10, 2) NULL,
	[Currency] [nvarchar](3) NULL,
	[Description] [nvarchar](255) NULL,
	[StripeChargeID] [nvarchar](100) NULL,
	[Status] [nvarchar](20) NOT NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[TransactionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[Transactions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[Transactions] already exists. Skipping.';
END
GO
