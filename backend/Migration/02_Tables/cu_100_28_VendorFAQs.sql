/*
    Migration Script: Create Table [VendorFAQs]
    Phase: 100 - Tables
    Script: cu_100_28_dbo.VendorFAQs.sql
    Description: Creates the [vendors].[VendorFAQs] table
    
    Execution Order: 28
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorFAQs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorFAQs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorFAQs](
	[FAQID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NULL,
	[Question] [nvarchar](255) NOT NULL,
	[Answer] [nvarchar](max) NOT NULL,
	[DisplayOrder] [int] NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
	[AnswerType] [nvarchar](50) NULL,
	[AnswerOptions] [nvarchar](max) NULL,
PRIMARY KEY CLUSTERED 
(
	[FAQID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorFAQs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorFAQs] already exists. Skipping.';
END
GO
