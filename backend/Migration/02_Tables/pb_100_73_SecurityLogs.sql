/*
    Migration Script: Create Table [SecurityLogs]
    Phase: 100 - Tables
    Description: Creates the [users].[SecurityLogs] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[SecurityLogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[SecurityLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[SecurityLogs](
	[LogID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Email] [nvarchar](255) NULL,
	[Action] [nvarchar](100) NOT NULL,
	[ActionStatus] [nvarchar](50) NOT NULL,
	[IPAddress] [nvarchar](50) NULL,
	[UserAgent] [nvarchar](500) NULL,
	[Location] [nvarchar](255) NULL,
	[Device] [nvarchar](255) NULL,
	[Details] [nvarchar](max) NULL,
	[CreatedAt] [datetime] NOT NULL CONSTRAINT [DF__SecurityL__Creat__2E90DD8E] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[LogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[SecurityLogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[SecurityLogs] already exists. Skipping.';
END
GO
