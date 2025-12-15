/*
    Migration Script: Create Table [CategoryQuestions]
    Phase: 100 - Tables
    Script: cu_100_38_dbo.CategoryQuestions.sql
    Description: Creates the [dbo].[CategoryQuestions] table
    
    Execution Order: 38
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[CategoryQuestions]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[CategoryQuestions]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[CategoryQuestions](
	[QuestionID] [int] IDENTITY(1,1) NOT NULL,
	[Category] [nvarchar](50) NOT NULL,
	[QuestionText] [nvarchar](500) NOT NULL,
	[QuestionType] [nvarchar](20) NOT NULL,
	[Options] [nvarchar](max) NULL,
	[IsRequired] [bit] NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[QuestionID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[CategoryQuestions] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[CategoryQuestions] already exists. Skipping.';
END
GO
