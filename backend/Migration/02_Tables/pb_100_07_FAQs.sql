/*
    Migration Script: Create Table [FAQs]
    Phase: 100 - Tables
    Description: Creates the [admin].[FAQs] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[FAQs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[FAQs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[FAQs](
	[FAQID] [int] IDENTITY(1,1) NOT NULL,
	[Question] [nvarchar](500) NOT NULL,
	[Answer] [nvarchar](max) NOT NULL,
	[Category] [nvarchar](100) NULL CONSTRAINT [DF__FAQs__Category__4885B9BB] DEFAULT ('General'),
	[DisplayOrder] [int] NULL CONSTRAINT [DF__FAQs__DisplayOrd__44B528D7] DEFAULT ((0)),
	[IsActive] [bit] NULL CONSTRAINT [DF__FAQs__IsActive__45A94D10] DEFAULT ((1)),
	[CreatedAt] [datetime2] NULL CONSTRAINT [DF__FAQs__CreatedAt__43C1049E] DEFAULT (getutcdate()),
	[UpdatedAt] [datetime2] NULL CONSTRAINT [DF__FAQs__UpdatedAt__4B622666] DEFAULT (getutcdate()),
	[ViewCount] [int] NULL CONSTRAINT [DF__FAQs__ViewCount__4A6E022D] DEFAULT ((0)),
	[HelpfulCount] [int] NULL CONSTRAINT [DF__FAQs__HelpfulCou__469D7149] DEFAULT ((0)),
	[NeutralCount] [int] NULL CONSTRAINT [DF__FAQs__NeutralCou__47919582] DEFAULT ((0)),
	[NotHelpfulCount] [int] NULL CONSTRAINT [DF__FAQs__NotHelpful__4979DDF4] DEFAULT ((0)),
PRIMARY KEY CLUSTERED 
(
	[FAQID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[FAQs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[FAQs] already exists. Skipping.';
END
GO
