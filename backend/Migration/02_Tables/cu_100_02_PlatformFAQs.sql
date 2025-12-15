/*
    Migration Script: Create Table [PlatformFAQs]
    Phase: 100 - Tables
    Script: cu_100_02_dbo.PlatformFAQs.sql
    Description: Creates the [dbo].[PlatformFAQs] table
    
    Execution Order: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[PlatformFAQs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[PlatformFAQs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[PlatformFAQs](
	[FAQID] [int] IDENTITY(1,1) NOT NULL,
	[Question] [nvarchar](500) NOT NULL,
	[Answer] [nvarchar](max) NOT NULL,
	[Category] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NULL,
	[ViewCount] [int] NULL,
	[HelpfulCount] [int] NULL,
	[NotHelpfulCount] [int] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
PRIMARY KEY CLUSTERED 
(
	[FAQID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[PlatformFAQs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[PlatformFAQs] already exists. Skipping.';
END
GO
