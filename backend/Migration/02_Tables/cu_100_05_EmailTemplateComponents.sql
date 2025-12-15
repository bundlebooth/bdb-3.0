/*
    Migration Script: Create Table [EmailTemplateComponents]
    Phase: 100 - Tables
    Script: cu_100_05_dbo.EmailTemplateComponents.sql
    Description: Creates the [dbo].[EmailTemplateComponents] table
    
    Execution Order: 5
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[EmailTemplateComponents]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[EmailTemplateComponents]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[EmailTemplateComponents](
	[ComponentID] [int] IDENTITY(1,1) NOT NULL,
	[ComponentType] [nvarchar](20) NOT NULL,
	[ComponentName] [nvarchar](100) NOT NULL,
	[HtmlContent] [nvarchar](max) NOT NULL,
	[TextContent] [nvarchar](max) NULL,
	[Description] [nvarchar](500) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime] NULL,
	[UpdatedAt] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[ComponentID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[EmailTemplateComponents] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[EmailTemplateComponents] already exists. Skipping.';
END
GO
