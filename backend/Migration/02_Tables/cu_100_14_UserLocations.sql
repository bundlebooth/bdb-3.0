/*
    Migration Script: Create Table [UserLocations]
    Phase: 100 - Tables
    Script: cu_100_14_dbo.UserLocations.sql
    Description: Creates the [dbo].[UserLocations] table
    
    Execution Order: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[UserLocations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[UserLocations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[UserLocations](
	[LocationID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Latitude] [decimal](10, 8) NOT NULL,
	[Longitude] [decimal](11, 8) NOT NULL,
	[City] [nvarchar](100) NULL,
	[State] [nvarchar](50) NULL,
	[Country] [nvarchar](50) NULL,
	[Timestamp] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[LocationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[UserLocations] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[UserLocations] already exists. Skipping.';
END
GO
