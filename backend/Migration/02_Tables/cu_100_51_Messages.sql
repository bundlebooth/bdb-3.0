/*
    Migration Script: Create Table [Messages]
    Phase: 100 - Tables
    Script: cu_100_51_dbo.Messages.sql
    Description: Creates the [dbo].[Messages] table
    
    Execution Order: 51
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[Messages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[Messages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[Messages](
	[MessageID] [int] IDENTITY(1,1) NOT NULL,
	[ConversationID] [int] NULL,
	[SenderID] [int] NULL,
	[Content] [nvarchar](max) NOT NULL,
	[IsRead] [bit] NULL,
	[ReadAt] [datetime] NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[MessageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[Messages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[Messages] already exists. Skipping.';
END
GO
