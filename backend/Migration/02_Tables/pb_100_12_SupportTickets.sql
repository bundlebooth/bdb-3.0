/*
    Migration Script: Create Table [SupportTickets]
    Phase: 100 - Tables
    Script: cu_100_20_dbo.SupportTickets.sql
    Description: Creates the [admin].[SupportTickets] table
    
    Execution Order: 20
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[SupportTickets]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[SupportTickets]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[SupportTickets](
	[TicketID] [int] IDENTITY(1,1) NOT NULL,
	[TicketNumber] [nvarchar](20) NOT NULL,
	[UserID] [int] NULL,
	[UserEmail] [nvarchar](255) NULL,
	[UserName] [nvarchar](100) NULL,
	[Subject] [nvarchar](255) NOT NULL,
	[Description] [nvarchar](max) NOT NULL,
	[Category] [nvarchar](50) NULL,
	[Priority] [nvarchar](20) NULL,
	[Status] [nvarchar](20) NULL,
	[AssignedTo] [int] NULL,
	[Source] [nvarchar](50) NULL,
	[ConversationID] [int] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[ResolvedAt] [datetime2](7) NULL,
	[ClosedAt] [datetime2](7) NULL,
	[Attachments] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[TicketID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[SupportTickets] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[SupportTickets] already exists. Skipping.';
END
GO
