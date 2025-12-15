/*
    Migration Script: Create Table [BookingTimeline]
    Phase: 100 - Tables
    Script: cu_100_57_dbo.BookingTimeline.sql
    Description: Creates the [dbo].[BookingTimeline] table
    
    Execution Order: 57
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[BookingTimeline]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[BookingTimeline]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[BookingTimeline](
	[TimelineID] [int] IDENTITY(1,1) NOT NULL,
	[BookingID] [int] NULL,
	[Status] [nvarchar](50) NOT NULL,
	[ChangedBy] [int] NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[TimelineID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[BookingTimeline] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[BookingTimeline] already exists. Skipping.';
END
GO
