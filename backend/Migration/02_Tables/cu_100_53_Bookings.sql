/*
    Migration Script: Create Table [Bookings]
    Phase: 100 - Tables
    Script: cu_100_53_dbo.Bookings.sql
    Description: Creates the [bookings].[Bookings] table
    
    Execution Order: 53
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [bookings].[Bookings]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[Bookings]') AND type in (N'U'))
BEGIN
    CREATE TABLE [bookings].[Bookings](
	[BookingID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[ServiceID] [int] NULL,
	[BookingDate] [datetime] NULL,
	[EventDate] [datetime] NOT NULL,
	[EndDate] [datetime] NULL,
	[Status] [nvarchar](20) NULL,
	[TotalAmount] [decimal](10, 2) NULL,
	[DepositAmount] [decimal](10, 2) NULL,
	[DepositPaid] [bit] NULL,
	[FullAmountPaid] [bit] NULL,
	[AttendeeCount] [int] NULL,
	[SpecialRequests] [nvarchar](max) NULL,
	[CancellationDate] [datetime] NULL,
	[RefundAmount] [decimal](10, 2) NULL,
	[StripePaymentIntentID] [nvarchar](100) NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[EventLocation] [nvarchar](500) NULL,
	[EventName] [nvarchar](255) NULL,
	[EventType] [nvarchar](100) NULL,
	[TimeZone] [nvarchar](100) NULL,
	[StripeSessionID] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[BookingID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [bookings].[Bookings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[Bookings] already exists. Skipping.';
END
GO
