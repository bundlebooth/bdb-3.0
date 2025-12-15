/*
    Migration Script: Create Table [PaymentTransactions]
    Phase: 100 - Tables
    Script: cu_100_62_dbo.PaymentTransactions.sql
    Description: Creates the [dbo].[PaymentTransactions] table
    
    Execution Order: 62
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[PaymentTransactions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PaymentTransactions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PaymentTransactions](
	[TransactionID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[GrossAmount] [decimal](10, 2) NOT NULL,
	[PlatformFee] [decimal](10, 2) NOT NULL,
	[ProcessingFee] [decimal](10, 2) NOT NULL,
	[VendorPayout] [decimal](10, 2) NOT NULL,
	[StripePaymentIntentID] [nvarchar](255) NULL,
	[StripeTransferID] [nvarchar](255) NULL,
	[StripeChargeID] [nvarchar](255) NULL,
	[Status] [nvarchar](50) NULL,
	[PayoutStatus] [nvarchar](50) NULL,
	[PayoutDate] [datetime2](7) NULL,
	[Currency] [nvarchar](10) NULL,
	[Description] [nvarchar](500) NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[TransactionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[PaymentTransactions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[PaymentTransactions] already exists. Skipping.';
END
GO
