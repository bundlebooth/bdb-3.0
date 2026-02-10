/*
    Migration Script: Create Table [Conversations]
    Phase: 100 - Tables
    Script: cu_100_48_dbo.Conversations.sql
    Description: Creates the [messages].[Conversations] table
    
    Execution Order: 48
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [messages].[Conversations]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[Conversations]') AND type in (N'U'))
BEGIN
    CREATE TABLE [messages].[Conversations](
	[ConversationID] [int] IDENTITY(1,1) NOT NULL,
	[UserID] [int] NULL,
	[VendorProfileID] [int] NULL,
	[BookingID] [int] NULL,
	[Subject] [nvarchar](255) NULL,
	[LastMessageAt] [datetime] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[ConversationType] [nvarchar](50) NULL,
	[GuestName] [nvarchar](255) NULL,
	[GuestEmail] [nvarchar](255) NULL,
	[ReferenceNumber] [nvarchar](50) NULL,
	[Category] [nvarchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[ConversationID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [messages].[Conversations] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [messages].[Conversations] already exists. Skipping.';
END
GO
