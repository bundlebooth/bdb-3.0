/*
    Migration Script: Create Table [FAQFeedback]
    Phase: 100 - Tables
    Description: Creates the [admin].[FAQFeedback] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[FAQFeedback]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[FAQFeedback]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[FAQFeedback](
	[FeedbackID] [int] IDENTITY(1,1) NOT NULL,
	[FAQID] [int] NOT NULL,
	[UserID] [int] NULL,
	[Rating] [nvarchar](20) NOT NULL,
	[CreatedAt] [datetime] NULL CONSTRAINT [DF__FAQFeedba__Creat__42CCE065] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[FeedbackID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[FAQFeedback] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[FAQFeedback] already exists. Skipping.';
END
GO
