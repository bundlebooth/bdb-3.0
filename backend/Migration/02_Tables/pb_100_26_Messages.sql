/*
    Migration Script: Create Table [Messages]
    Phase: 100 - Tables
    Script: cu_100_51_dbo.Messages.sql
    Description: Creates the [messages].[Messages] table
    
    Execution Order: 51
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [messages].[Messages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[Messages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [messages].[Messages](
	[MessageID] [int] IDENTITY(1,1) NOT NULL,
	[ConversationID] [int] NULL,
	[SenderID] [int] NULL,
	[SenderType] [nvarchar](50) NULL,
	[Content] [nvarchar](max) NOT NULL,
	[IsRead] [bit] NULL,
	[ReadAt] [datetime] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[MessageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [messages].[Messages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [messages].[Messages] already exists. Skipping.';
END
GO
