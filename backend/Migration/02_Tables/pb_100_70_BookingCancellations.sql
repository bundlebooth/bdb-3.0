/*
    Migration Script: Create Table [BookingCancellations]
    Phase: 100 - Tables
    Description: Creates the [bookings].[BookingCancellations] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [bookings].[BookingCancellations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[BookingCancellations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [bookings].[BookingCancellations](
	[CancellationID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NOT NULL,
	[CancelledBy] [nvarchar](20) NOT NULL,
	[CancelledByUserID] [int] NULL,
	[CancellationReason] [nvarchar](max) NULL,
	[CancellationDate] [datetime2] NOT NULL CONSTRAINT [DF__BookingCa__Cance__6521F869] DEFAULT (getdate()),
	[RefundAmount] [decimal](10, 2) NULL,
	[RefundPercent] [decimal](5, 2) NULL,
	[RefundStatus] [nvarchar](50) NULL CONSTRAINT [DF__BookingCa__Refun__670A40DB] DEFAULT ('pending'),
	[StripeRefundID] [nvarchar](100) NULL,
	[StripeRefundStatus] [nvarchar](50) NULL,
	[ApplicationFeeRetained] [decimal](10, 2) NULL,
	[PolicyID] [int] NULL,
	[HoursBeforeEvent] [int] NULL,
	[AdminNotes] [nvarchar](max) NULL,
	[ProcessedAt] [datetime2] NULL,
	[ProcessedByUserID] [int] NULL,
	[CreatedAt] [datetime2] NOT NULL CONSTRAINT [DF__BookingCa__Creat__66161CA2] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[CancellationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [bookings].[BookingCancellations] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[BookingCancellations] already exists. Skipping.';
END
GO
