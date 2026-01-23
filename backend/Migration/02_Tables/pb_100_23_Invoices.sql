/*
    Migration Script: Create Table [Invoices]
    Phase: 100 - Tables
    Script: cu_100_58_dbo.Invoices.sql
    Description: Creates the [invoices].[Invoices] table
    
    Execution Order: 58
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [invoices].[Invoices]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[invoices].[Invoices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [invoices].[Invoices](
	[InvoiceID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NOT NULL,
	[UserID] [int] NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[InvoiceNumber] [nvarchar](50) NOT NULL,
	[IssueDate] [datetime] NOT NULL,
	[DueDate] [datetime] NULL,
	[Status] [nvarchar](20) NOT NULL,
	[Currency] [nvarchar](3) NOT NULL,
	[Subtotal] [decimal](10, 2) NOT NULL,
	[VendorExpensesTotal] [decimal](10, 2) NOT NULL,
	[PlatformFee] [decimal](10, 2) NOT NULL,
	[StripeFee] [decimal](10, 2) NOT NULL,
	[TaxAmount] [decimal](10, 2) NOT NULL,
	[TotalAmount] [decimal](10, 2) NOT NULL,
	[FeesIncludedInTotal] [bit] NOT NULL,
	[SnapshotJSON] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NOT NULL,
	[UpdatedAt] [datetime] NOT NULL,
	[ServiceSubtotal] [decimal](10, 2) NULL,
	[RenterProcessingFee] [decimal](10, 2) NULL,
	[PlatformCommission] [decimal](10, 2) NULL,
	[VendorPayout] [decimal](10, 2) NULL,
	[PaymentStatus] [nvarchar](50) NULL,
	[PaidAt] [datetime2](7) NULL,
	[StripeSessionId] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[InvoiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [invoices].[Invoices] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [invoices].[Invoices] already exists. Skipping.';
END
GO
