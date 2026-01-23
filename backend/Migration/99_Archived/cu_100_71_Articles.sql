/*
    Migration Script: Create Table [Articles]
    Phase: 100 - Tables
    Script: cu_100_71_admin.Articles.sql
    Description: Creates the [admin].[Articles] table for Help Centre articles and platform content
    
    Execution Order: 71
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [admin].[Articles]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[admin].[Articles]') AND type in (N'U'))
BEGIN
    CREATE TABLE [admin].[Articles](
        [ArticleID] [int] IDENTITY(1,1) NOT NULL,
        [Title] [nvarchar](255) NOT NULL,
        [Slug] [nvarchar](255) NOT NULL,
        [Summary] [nvarchar](500) NULL,
        [Content] [nvarchar](max) NOT NULL,
        [CategoryID] [int] NULL,
        [ArticleType] [nvarchar](50) NOT NULL DEFAULT 'help',
        [FeaturedImage] [nvarchar](500) NULL,
        [Author] [nvarchar](100) NULL DEFAULT 'Planbeau Team',
        [Tags] [nvarchar](500) NULL,
        [DisplayOrder] [int] NOT NULL DEFAULT 0,
        [IsActive] [bit] NOT NULL DEFAULT 1,
        [IsFeatured] [bit] NOT NULL DEFAULT 0,
        [ViewCount] [int] NOT NULL DEFAULT 0,
        [HelpfulCount] [int] NOT NULL DEFAULT 0,
        [NotHelpfulCount] [int] NOT NULL DEFAULT 0,
        [PublishedAt] [datetime2](7) NULL,
        [CreatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
        [UpdatedAt] [datetime2](7) NOT NULL DEFAULT GETUTCDATE(),
    PRIMARY KEY CLUSTERED 
    (
        [ArticleID] ASC
    )WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY],
    CONSTRAINT [UQ_Articles_Slug] UNIQUE NONCLUSTERED ([Slug])
    );
    PRINT 'Table [admin].[Articles] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [admin].[Articles] already exists. Skipping.';
END
GO
