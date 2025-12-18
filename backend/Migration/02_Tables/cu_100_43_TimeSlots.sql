/*
    Migration Script: Create Table [TimeSlots]
    Phase: 100 - Tables
    Script: cu_100_43_dbo.TimeSlots.sql
    Description: Creates the [bookings].[TimeSlots] table
    
    Execution Order: 43
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [bookings].[TimeSlots]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[bookings].[TimeSlots]') AND type in (N'U'))
BEGIN
    CREATE TABLE [bookings].[TimeSlots](
	[SlotID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[ServiceID] [int] NULL,
	[DayOfWeek] [tinyint] NULL,
	[Date] [date] NULL,
	[StartTime] [time](7) NOT NULL,
	[EndTime] [time](7) NOT NULL,
	[MaxCapacity] [int] NULL,
	[IsAvailable] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[SlotID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [bookings].[TimeSlots] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [bookings].[TimeSlots] already exists. Skipping.';
END
GO
