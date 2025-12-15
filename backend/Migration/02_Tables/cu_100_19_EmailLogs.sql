/*
    Migration Script: Create Table [EmailLogs]
    Phase: 100 - Tables
    Script: cu_100_19_dbo.EmailLogs.sql
    Description: Creates the [dbo].[EmailLogs] table
    
    Execution Order: 19
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[EmailLogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailLogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailLogs](
	[EmailLogID] [int] IDENTITY(1,1) NOT NULL,
	[TemplateKey] [nvarchar](50) NULL,
	[RecipientEmail] [nvarchar](255) NOT NULL,
	[RecipientName] [nvarchar](100) NULL,
	[Subject] [nvarchar](255) NOT NULL,
	[Status] [nvarchar](20) NOT NULL,
	[ErrorMessage] [nvarchar](max) NULL,
	[UserID] [int] NULL,
	[BookingID] [int] NULL,
	[Metadata] [nvarchar](max) NULL,
	[SentAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[EmailLogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[EmailLogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[EmailLogs] already exists. Skipping.';
END
GO
