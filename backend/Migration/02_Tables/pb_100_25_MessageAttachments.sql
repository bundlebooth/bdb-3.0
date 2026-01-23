/*
    Migration Script: Create Table [MessageAttachments]
    Phase: 100 - Tables
    Script: cu_100_52_dbo.MessageAttachments.sql
    Description: Creates the [messages].[MessageAttachments] table
    
    Execution Order: 52
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [messages].[MessageAttachments]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[messages].[MessageAttachments]') AND type in (N'U'))
BEGIN
    CREATE TABLE [messages].[MessageAttachments](
	[AttachmentID] [int] IDENTITY(1,1) NOT NULL,
	[MessageID] [int] NULL,
	[FileURL] [nvarchar](255) NOT NULL,
	[FileType] [nvarchar](50) NULL,
	[FileSize] [int] NULL,
	[OriginalName] [nvarchar](255) NULL,
PRIMARY KEY CLUSTERED 
(
	[AttachmentID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [messages].[MessageAttachments] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [messages].[MessageAttachments] already exists. Skipping.';
END
GO
