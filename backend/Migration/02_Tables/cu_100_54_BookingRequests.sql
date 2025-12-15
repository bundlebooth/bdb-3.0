/*
    Migration Script: Create Table [BookingRequests]
    Phase: 100 - Tables
    Script: cu_100_54_dbo.BookingRequests.sql
    Description: Creates the [dbo].[BookingRequests] table
    
    Execution Order: 54
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[BookingRequests]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BookingRequests]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[BookingRequests](
	[RequestID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[EventDate] [datetime] NOT NULL,
	[EventTime] [time](7) NOT NULL,
	[EventLocation] [nvarchar](255) NULL,
	[AttendeeCount] [int] NOT NULL,
	[Budget] [decimal](10, 2) NULL,
	[Services] [nvarchar](max) NOT NULL,
	[SpecialRequests] [nvarchar](max) NULL,
	[Status] [nvarchar](20) NULL,
	[ResponseMessage] [nvarchar](max) NULL,
	[ProposedPrice] [decimal](10, 2) NULL,
	[ExpiresAt] [datetime] NOT NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[RespondedAt] [datetime] NULL,
	[ConfirmedAt] [datetime] NULL,
	[PaymentIntentID] [nvarchar](100) NULL,
	[GroupID] [nvarchar](100) NULL,
	[ServiceID] [int] NULL,
	[AlternativeDate] [date] NULL,
	[AlternativeTime] [time](7) NULL,
	[CancellationReason] [nvarchar](max) NULL,
	[CancelledAt] [datetime] NULL,
	[CounterOfferAcceptedAt] [datetime] NULL,
	[ExpiredAt] [datetime] NULL,
	[EventEndTime] [time](7) NULL,
	[EventName] [nvarchar](255) NULL,
	[EventType] [nvarchar](100) NULL,
	[TimeZone] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[RequestID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[BookingRequests] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[BookingRequests] already exists. Skipping.';
END
GO
