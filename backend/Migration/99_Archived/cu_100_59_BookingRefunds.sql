/*
    Migration Script: Create Table [BookingRefunds]
    Phase: 100 - Tables
    Script: cu_100_59_BookingRefunds.sql
    Description: Creates the [bookings].[BookingRefunds] table to track refund history
    
    Execution Order: 59
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [bookings].[BookingRefunds]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[BookingRefunds]') AND type in (N'U'))
BEGIN
    CREATE TABLE [bookings].[BookingRefunds](
        [RefundID] [int] IDENTITY(1,1) NOT NULL,
        [BookingID] [int] NOT NULL,
        [StripeRefundID] [nvarchar](100) NULL,
        [StripePaymentIntentID] [nvarchar](100) NULL,
        [RefundAmount] [decimal](10,2) NOT NULL,
        [ApplicationFeeRefunded] [bit] NULL DEFAULT 0,
        [RefundReason] [nvarchar](50) NULL,
        [CancelledBy] [nvarchar](20) NULL,
        [CancelledByUserID] [int] NULL,
        [RefundStatus] [nvarchar](20) NULL DEFAULT 'pending',
        [PolicyApplied] [nvarchar](100) NULL,
        [RefundPercentage] [decimal](5,2) NULL,
        [Notes] [nvarchar](max) NULL,
        [CreatedAt] [datetime] NULL DEFAULT GETDATE(),
        [ProcessedAt] [datetime] NULL,
    PRIMARY KEY CLUSTERED 
    (
        [RefundID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    
    -- Add foreign key to Bookings
    ALTER TABLE [bookings].[BookingRefunds]
    ADD CONSTRAINT FK_BookingRefunds_Bookings
    FOREIGN KEY ([BookingID]) REFERENCES [bookings].[Bookings]([BookingID]);
    
    PRINT 'Table [bookings].[BookingRefunds] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[BookingRefunds] already exists. Skipping.';
END
GO

