/*
    Migration Script: Create Table [SupportConversations]
    Phase: 100 - Tables
    Script: cu_100_49_dbo.SupportConversations.sql
    Description: Creates the [dbo].[SupportConversations] table
    
    Execution Order: 49
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[SupportConversations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportConversations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportConversations](
	[SupportConversationID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [int] NOT NULL,
	[ConversationID] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[SupportConversationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[SupportConversations] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[SupportConversations] already exists. Skipping.';
END
GO
