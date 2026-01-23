/*
    Migration Script: Create Table [UserSessions]
    Phase: 100 - Tables
    Script: cu_100_13_dbo.UserSessions.sql
    Description: Creates the [users].[UserSessions] table
    
    Execution Order: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [users].[UserSessions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[users].[UserSessions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [users].[UserSessions](
	[SessionID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[Token] [nvarchar](255) NOT NULL,
	[IPAddress] [nvarchar](50) NULL,
	[UserAgent] [nvarchar](255) NULL,
	[CreatedAt] [datetime] NULL,
	[ExpiresAt] [datetime] NOT NULL,
	[IsActive] [bit] NULL,
PRIMARY KEY CLUSTERED 
(
	[SessionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [users].[UserSessions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [users].[UserSessions] already exists. Skipping.';
END
GO
