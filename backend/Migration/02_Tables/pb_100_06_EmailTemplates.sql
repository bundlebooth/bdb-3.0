/*
    Migration Script: Create Table [EmailTemplates]
    Phase: 100 - Tables
    Description: Creates the [admin].[EmailTemplates] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[EmailTemplates]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[EmailTemplates]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[EmailTemplates](
	[TemplateID] [int] IDENTITY(1,1) NOT NULL,
	[TemplateKey] [nvarchar](50) NOT NULL,
	[TemplateName] [nvarchar](100) NOT NULL,
	[HeaderComponentID] [int] NULL,
	[BodyComponentID] [int] NOT NULL,
	[FooterComponentID] [int] NULL,
	[Subject] [nvarchar](255) NOT NULL,
	[Category] [nvarchar](50) NULL,
	[AvailableVariables] [nvarchar](max) NULL,
	[IsActive] [bit] NULL CONSTRAINT [DF__EmailTemp__IsAct__40E497F3] DEFAULT ((1)),
	[CreatedAt] [datetime] NULL CONSTRAINT [DF__EmailTemp__Creat__41D8BC2C] DEFAULT (getdate()),
	[UpdatedAt] [datetime] NULL CONSTRAINT [DF__EmailTemp__Updat__3FF073BA] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[TemplateID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [admin].[EmailTemplates] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[EmailTemplates] already exists. Skipping.';
END
GO
