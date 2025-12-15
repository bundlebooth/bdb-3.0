/*
    Migration Script: Create Table [FAQFeedback]
    Phase: 100 - Tables
    Script: cu_100_64_dbo.FAQFeedback.sql
    Description: Creates the [dbo].[FAQFeedback] table
    
    Execution Order: 64
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[FAQFeedback]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[FAQFeedback]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[FAQFeedback](
	[FeedbackID] [int] IDENTITY(1,1) NOT NULL,
	[FAQID] [int] NOT NULL,
	[UserID] [int] NULL,
	[Rating] [nvarchar](20) NOT NULL,
	[CreatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[FeedbackID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[FAQFeedback] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[FAQFeedback] already exists. Skipping.';
END
GO
