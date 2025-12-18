/*
    Migration Script: Create Table [FAQs]
    Phase: 100 - Tables
    Script: cu_100_63_dbo.FAQs.sql
    Description: Creates the [admin].[FAQs] table
    
    Execution Order: 63
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
	[Category] [nvarchar](100) NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
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
