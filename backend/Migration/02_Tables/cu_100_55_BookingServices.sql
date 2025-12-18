/*
    Migration Script: Create Table [BookingServices]
    Phase: 100 - Tables
    Script: cu_100_55_dbo.BookingServices.sql
    Description: Creates the [bookings].[BookingServices] table
    
    Execution Order: 55
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [bookings].[BookingServices]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[BookingServices]') AND type in (N'U'))
BEGIN
    CREATE TABLE [bookings].[BookingServices](
	[BookingServiceID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NULL,
	[ServiceID] [int] NULL,
	[AddOnID] [int] NULL,
	[Quantity] [int] NULL,
	[PriceAtBooking] [decimal](10, 2) NOT NULL,
	[Notes] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[BookingServiceID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [bookings].[BookingServices] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[BookingServices] already exists. Skipping.';
END
GO
