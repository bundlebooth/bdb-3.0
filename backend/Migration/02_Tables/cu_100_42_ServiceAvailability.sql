/*
    Migration Script: Create Table [ServiceAvailability]
    Phase: 100 - Tables
    Script: cu_100_42_dbo.ServiceAvailability.sql
    Description: Creates the [dbo].[ServiceAvailability] table
    
    Execution Order: 42
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[ServiceAvailability]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ServiceAvailability]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ServiceAvailability](
	[AvailabilityID] [int] IDENTITY(1,1) NOT NULL,
	[ServiceID] [int] NULL,
	[StartDateTime] [datetime] NOT NULL,
	[EndDateTime] [datetime] NOT NULL,
	[IsAvailable] [bit] NULL,
	[Reason] [nvarchar](255) NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[AvailabilityID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[ServiceAvailability] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[ServiceAvailability] already exists. Skipping.';
END
GO
