/*
    Migration Script: Create Table [EmailLogs]
    Phase: 100 - Tables
    Description: Creates the [admin].[EmailLogs] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[EmailLogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EmailLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EmailLogs](
	[EmailLogID] [int] IDENTITY(1,1) NOT NULL,
	[TemplateKey] [nvarchar](50) NULL,
	[RecipientEmail] [nvarchar](255) NOT NULL,
	[RecipientName] [nvarchar](100) NULL,
	[Subject] [nvarchar](255) NOT NULL,
	[Status] [nvarchar](20) NOT NULL CONSTRAINT [DF__EmailLogs__Statu__3572E547] DEFAULT ('sent'),
	[ErrorMessage] [nvarchar](max) NULL,
	[UserID] [int] NULL,
	[BookingID] [int] NULL,
	[Metadata] [nvarchar](max) NULL,
	[SentAt] [datetime] NULL CONSTRAINT [DF__EmailLogs__SentA__36670980] DEFAULT (getdate()),
	[HtmlBody] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[EmailLogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[EmailLogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailLogs] already exists. Skipping.';
END
GO
