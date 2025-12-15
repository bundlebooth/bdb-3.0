/*
    Migration Script: Create Table [SecurityLogs]
    Phase: 100 - Tables
    Script: cu_100_16_dbo.SecurityLogs.sql
    Description: Creates the [dbo].[SecurityLogs] table
    
    Execution Order: 16
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[SecurityLogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SecurityLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SecurityLogs](
	[LogID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Email] [nvarchar](255) NULL,
	[Action] [nvarchar](50) NOT NULL,
	[ActionStatus] [nvarchar](20) NOT NULL,
	[IPAddress] [nvarchar](50) NULL,
	[UserAgent] [nvarchar](500) NULL,
	[Location] [nvarchar](100) NULL,
	[Device] [nvarchar](100) NULL,
	[Details] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[LogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[SecurityLogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[SecurityLogs] already exists. Skipping.';
END
GO
