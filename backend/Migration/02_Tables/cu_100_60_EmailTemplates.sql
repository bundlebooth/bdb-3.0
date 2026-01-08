/*
    Migration Script: Create Table [EmailTemplates]
    Phase: 100 - Tables
    Script: cu_100_60_EmailTemplates.sql
    Description: Creates the [admin].[EmailTemplates] table for email management
    
    Execution Order: 60
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[EmailTemplates]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EmailTemplates]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EmailTemplates](
        [TemplateID] [int] IDENTITY(1,1) NOT NULL,
        [TemplateName] [nvarchar](100) NOT NULL,
        [TemplateKey] [nvarchar](50) NOT NULL,
        [Subject] [nvarchar](255) NOT NULL,
        [HtmlContent] [nvarchar](max) NOT NULL,
        [TextContent] [nvarchar](max) NULL,
        [Category] [nvarchar](50) NULL DEFAULT 'General',
        [Variables] [nvarchar](max) NULL,
        [IsActive] [bit] NULL DEFAULT 1,
        [CreatedAt] [datetime] NULL DEFAULT GETDATE(),
        [UpdatedAt] [datetime] NULL DEFAULT GETDATE(),
        [CreatedBy] [int] NULL,
    PRIMARY KEY CLUSTERED 
    (
        [TemplateID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT UQ_EmailTemplates_TemplateKey UNIQUE ([TemplateKey])
    );
    
    PRINT 'Table [admin].[EmailTemplates] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailTemplates] already exists. Skipping.';
END
GO

