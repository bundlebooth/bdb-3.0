/*
    Migration Script: Create Table [VendorAvailabilityExceptions]
    Phase: 100 - Tables
    Script: cu_100_24_dbo.VendorAvailabilityExceptions.sql
    Description: Creates the [dbo].[VendorAvailabilityExceptions] table
    
    Execution Order: 24
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorAvailabilityExceptions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorAvailabilityExceptions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorAvailabilityExceptions](
	[ExceptionID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Date] [date] NOT NULL,
	[IsAvailable] [bit] NULL,
	[Reason] [nvarchar](255) NULL,
	[StartTime] [time](7) NULL,
	[EndTime] [time](7) NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[ExceptionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorAvailabilityExceptions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorAvailabilityExceptions] already exists. Skipping.';
END
GO
