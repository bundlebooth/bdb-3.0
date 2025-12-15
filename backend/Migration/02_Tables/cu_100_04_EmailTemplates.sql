/*
    Migration Script: Create Table [EmailTemplates]
    Phase: 100 - Tables
    Script: cu_100_04_dbo.EmailTemplates.sql
    Description: Creates the [dbo].[EmailTemplates] table
    
    Execution Order: 4
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[EmailTemplates]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailTemplates]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailTemplates](
	[TemplateID] [int] IDENTITY(1,1) NOT NULL,
	[TemplateKey] [nvarchar](50) NOT NULL,
	[TemplateName] [nvarchar](100) NOT NULL,
	[HeaderComponentID] [int] NULL,
	[BodyComponentID] [int] NOT NULL,
	[FooterComponentID] [int] NULL,
	[Subject] [nvarchar](255) NOT NULL,
	[Category] [nvarchar](50) NULL,
	[AvailableVariables] [nvarchar](max) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[TemplateID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[EmailTemplates] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[EmailTemplates] already exists. Skipping.';
END
GO
