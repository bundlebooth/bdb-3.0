/*
    Migration Script: Create Table [Bookings]
    Phase: 100 - Tables
    Script: cu_100_53_Bookings.sql
    Description: Creates the unified [bookings].[Bookings] table
                 This table handles the entire booking lifecycle:
                 pending -> approved -> paid -> completed
                        -> declined
                        -> expired
                        -> cancelled
    
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
        [RequestID] [int] NULL,
        [UserID] [int] NULL,
        [VendorProfileID] [int] NULL,
        [ServiceID] [int] NULL,
        [GroupID] [nvarchar](100) CONSTRAINT DF_Bookings_GroupID DEFAULT '' NULL,
        [BookingDate] [datetime] NULL,
        [EventDate] [datetime] NOT NULL,
        [EndDate] [datetime] NULL,
        [EventTime] [time](7) NULL,
        [EventEndTime] [time](7) NULL,
        [EventLocation] [nvarchar](500) CONSTRAINT DF_Bookings_EventLocation DEFAULT '' NULL,
        [EventName] [nvarchar](255) CONSTRAINT DF_Bookings_EventName DEFAULT 'Booking' NULL,
        [EventType] [nvarchar](100) NULL,
        [TimeZone] [nvarchar](100) NULL,
        [AttendeeCount] [int] NULL,
        [Budget] [decimal](10, 2) NULL,
        [TotalAmount] [decimal](10, 2) NULL,
        [DepositAmount] [decimal](10, 2) NULL,
        [DepositPaid] [bit] NULL,
        [FullAmountPaid] [bit] NULL,
        [Services] [nvarchar](max) CONSTRAINT DF_Bookings_Services DEFAULT '[]' NULL,
        [SpecialRequests] [nvarchar](max) NULL,
        [Status] [nvarchar](50) NULL,
        [ResponseMessage] [nvarchar](max) NULL,
        [ProposedPrice] [decimal](10, 2) NULL,
        [DeclinedReason] [nvarchar](max) NULL,
        [ExpiresAt] [datetime] NULL,
        [RespondedAt] [datetime] NULL,
        [ConfirmedAt] [datetime] NULL,
        [CancelledAt] [datetime] NULL,
        [CancelledBy] [nvarchar](20) NULL,
        [CancelledByUserID] [int] NULL,
        [CancellationReason] [nvarchar](max) NULL,
        [CancellationDate] [datetime] NULL,
        [ExpiredAt] [datetime] NULL,
        [RefundAmount] [decimal](10, 2) NULL,
        [StripePaymentIntentID] [nvarchar](100) NULL,
        [StripeSessionID] [nvarchar](255) NULL,
        [CreatedAt] [datetime] NULL,
        [UpdatedAt] [datetime] NULL,
    PRIMARY KEY CLUSTERED ([BookingID] ASC)
    );
    PRINT 'Table [bookings].[Bookings] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[Bookings] already exists. Skipping.';
END
GO
