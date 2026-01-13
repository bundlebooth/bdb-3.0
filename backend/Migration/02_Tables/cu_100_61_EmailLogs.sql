/*
    Migration Script: Create Table [EmailLogs]
    Phase: 100 - Tables
    Script: cu_100_61_EmailLogs.sql
    Description: Creates the [admin].[EmailLogs] table for tracking sent emails
    
    Execution Order: 61
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[EmailLogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EmailLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EmailLogs](
        [LogID] [int] IDENTITY(1,1) NOT NULL,
        [TemplateID] [int] NULL,
        [TemplateKey] [nvarchar](50) NULL,
        [RecipientEmail] [nvarchar](255) NOT NULL,
        [RecipientName] [nvarchar](255) NULL,
        [Subject] [nvarchar](255) NOT NULL,
        [Status] [nvarchar](20) NULL DEFAULT 'pending',
        [SentAt] [datetime] NULL,
        [ErrorMessage] [nvarchar](max) NULL,
        [UserID] [int] NULL,
        [BookingID] [int] NULL,
        [Metadata] [nvarchar](max) NULL,
        [HtmlBody] [nvarchar](max) NULL,
        [CreatedAt] [datetime] NULL DEFAULT GETDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [LogID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    
    PRINT 'Table [admin].[EmailLogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailLogs] already exists. Skipping.';
END
GO

