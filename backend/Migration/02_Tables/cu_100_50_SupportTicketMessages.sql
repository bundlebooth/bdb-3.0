/*
    Migration Script: Create Table [SupportTicketMessages]
    Phase: 100 - Tables
    Script: cu_100_50_dbo.SupportTicketMessages.sql
    Description: Creates the [dbo].[SupportTicketMessages] table
    
    Execution Order: 50
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[SupportTicketMessages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[SupportTicketMessages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[SupportTicketMessages](
	[MessageID] [int] IDENTITY(1,1) NOT NULL,
	[TicketID] [int] NOT NULL,
	[SenderID] [int] NULL,
	[SenderType] [nvarchar](20) NOT NULL,
	[Message] [nvarchar](max) NOT NULL,
	[Attachments] [nvarchar](max) NULL,
	[IsInternal] [bit] NULL,
	[CreatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[MessageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[SupportTicketMessages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[SupportTicketMessages] already exists. Skipping.';
END
GO
