/*
    Migration Script: Create Table [VendorCategoryAnswers]
    Phase: 100 - Tables
    Script: cu_100_39_dbo.VendorCategoryAnswers.sql
    Description: Creates the [vendors].[VendorCategoryAnswers] table
    
    Execution Order: 39
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorCategoryAnswers]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorCategoryAnswers]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorCategoryAnswers](
	[AnswerID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[QuestionID] [int] NULL,
	[Answer] [nvarchar](max) NOT NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[AnswerID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorCategoryAnswers] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorCategoryAnswers] already exists. Skipping.';
END
GO
