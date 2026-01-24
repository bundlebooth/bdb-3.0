/*
    Migration Script: Create Table [Bookings]
    Phase: 100 - Tables
    Description: Creates the [bookings].[Bookings] table
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
	[BookingDate] [datetime] NULL CONSTRAINT [DF__Bookings__Bookin__6EAB62A3] DEFAULT (getdate()),
	[EventDate] [datetime] NOT NULL,
	[EndDate] [datetime] NULL,
	[Status] [nvarchar](50) NOT NULL CONSTRAINT [DF__Bookings__Status__6CC31A31] DEFAULT ('pending'),
	[TotalAmount] [decimal](10, 2) NULL,
	[DepositAmount] [decimal](10, 2) NULL,
	[DepositPaid] [bit] NULL CONSTRAINT [DF__Bookings__Deposi__6BCEF5F8] DEFAULT ((0)),
	[FullAmountPaid] [bit] NULL CONSTRAINT [DF__Bookings__FullAm__6ADAD1BF] DEFAULT ((0)),
	[AttendeeCount] [int] NULL CONSTRAINT [DF__Bookings__Attend__69E6AD86] DEFAULT ((1)),
	[SpecialRequests] [nvarchar](max) NULL,
	[CancellationDate] [datetime] NULL,
	[RefundAmount] [decimal](10, 2) NULL,
	[StripePaymentIntentID] [nvarchar](100) NULL,
	[CreatedAt] [datetime] NOT NULL CONSTRAINT [DF__Bookings__Create__6DB73E6A] DEFAULT (getdate()),
	[UpdatedAt] [datetime] NULL CONSTRAINT [DF__Bookings__Update__68F2894D] DEFAULT (getdate()),
	[EventLocation] [nvarchar](500) NULL CONSTRAINT [DF_Bookings_EventLocation] DEFAULT (''),
	[EventName] [nvarchar](255) NULL CONSTRAINT [DF_Bookings_EventName] DEFAULT ('Booking'),
	[EventType] [nvarchar](100) NULL,
	[TimeZone] [nvarchar](100) NULL,
	[StripeSessionID] [nvarchar](255) NULL,
	[RequestID] [int] NULL,
	[EventTime] [time] NULL,
	[EventEndTime] [time] NULL,
	[Budget] [decimal](10, 2) NULL,
	[Services] [nvarchar](max) NULL CONSTRAINT [DF_Bookings_Services] DEFAULT ('[]'),
	[ResponseMessage] [nvarchar](max) NULL,
	[ProposedPrice] [decimal](10, 2) NULL,
	[ExpiresAt] [datetime] NULL,
	[RespondedAt] [datetime] NULL,
	[ConfirmedAt] [datetime] NULL,
	[CancelledAt] [datetime] NULL,
	[CancellationReason] [nvarchar](max) NULL,
	[CancelledBy] [nvarchar](20) NULL,
	[DeclinedReason] [nvarchar](max) NULL,
	[ExpiredAt] [datetime] NULL,
	[GroupID] [nvarchar](100) NULL CONSTRAINT [DF_Bookings_GroupID] DEFAULT (''),
	[Subtotal] [decimal](10, 2) NULL,
	[PlatformFee] [decimal](10, 2) NULL,
	[TaxAmount] [decimal](10, 2) NULL,
	[TaxPercent] [decimal](5, 3) NULL,
	[TaxLabel] [nvarchar](50) NULL,
	[ProcessingFee] [decimal](10, 2) NULL,
	[GrandTotal] [decimal](10, 2) NULL,
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
