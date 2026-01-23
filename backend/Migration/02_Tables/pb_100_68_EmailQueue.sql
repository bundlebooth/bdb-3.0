/*
    Migration Script: Create Table [EmailQueue]
    Phase: 100 - Tables
    Description: Creates the [admin].[EmailQueue] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[EmailQueue]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EmailQueue]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EmailQueue](
	[QueueID] [int] IDENTITY(1,1) NOT NULL,
	[TemplateKey] [nvarchar](50) NOT NULL,
	[RecipientEmail] [nvarchar](255) NOT NULL,
	[RecipientName] [nvarchar](255) NULL,
	[Variables] [nvarchar](max) NULL,
	[Subject] [nvarchar](500) NULL,
	[ScheduledAt] [datetime2] NOT NULL,
	[Status] [nvarchar](20) NOT NULL CONSTRAINT [DF__EmailQueu__Statu__3943762B] DEFAULT ('pending'),
	[Priority] [int] NOT NULL CONSTRAINT [DF__EmailQueu__Prior__3A379A64] DEFAULT ((5)),
	[UserID] [int] NULL,
	[BookingID] [int] NULL,
	[EmailCategory] [nvarchar](50) NULL,
	[Metadata] [nvarchar](max) NULL,
	[AttemptCount] [int] NOT NULL CONSTRAINT [DF__EmailQueu__Attem__3B2BBE9D] DEFAULT ((0)),
	[LastAttemptAt] [datetime2] NULL,
	[SentAt] [datetime2] NULL,
	[CancelledAt] [datetime2] NULL,
	[CancelledBy] [int] NULL,
	[CancelReason] [nvarchar](500) NULL,
	[ErrorMessage] [nvarchar](max) NULL,
	[CreatedAt] [datetime2] NOT NULL CONSTRAINT [DF__EmailQueu__Creat__3C1FE2D6] DEFAULT (getdate()),
	[UpdatedAt] [datetime2] NOT NULL CONSTRAINT [DF__EmailQueu__Updat__375B2DB9] DEFAULT (getdate()),
	[RetryCount] [int] NOT NULL CONSTRAINT [DF__EmailQueu__Retry__384F51F2] DEFAULT ((0)),
PRIMARY KEY CLUSTERED 
(
	[QueueID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[EmailQueue] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailQueue] already exists. Skipping.';
END
GO
