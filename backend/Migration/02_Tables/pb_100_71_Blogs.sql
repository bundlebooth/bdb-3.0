/*
    Migration Script: Create Table [Blogs]
    Phase: 100 - Tables
    Description: Creates the [content].[Blogs] table
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [content].[Blogs]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[content].[Blogs]') AND type in (N'U'))
BEGIN
    CREATE TABLE [content].[Blogs](
	[BlogID] [int] IDENTITY(1,1) NOT NULL,
	[Title] [nvarchar](255) NOT NULL,
	[Slug] [nvarchar](255) NOT NULL,
	[Excerpt] [nvarchar](500) NULL,
	[Content] [nvarchar](max) NOT NULL,
	[FeaturedImageURL] [nvarchar](500) NULL,
	[Category] [nvarchar](100) NULL CONSTRAINT [DF__Blogs__Category__7A1D154F] DEFAULT ('General'),
	[Tags] [nvarchar](500) NULL,
	[Author] [nvarchar](100) NULL CONSTRAINT [DF__Blogs__Author__764C846B] DEFAULT ('PlanBeau Team'),
	[AuthorImageURL] [nvarchar](500) NULL,
	[Status] [nvarchar](50) NULL CONSTRAINT [DF__Blogs__Status__7B113988] DEFAULT ('draft'),
	[IsFeatured] [bit] NULL CONSTRAINT [DF__Blogs__IsFeature__7C055DC1] DEFAULT ((0)),
	[ViewCount] [int] NULL CONSTRAINT [DF__Blogs__ViewCount__7740A8A4] DEFAULT ((0)),
	[PublishedAt] [datetime2] NULL,
	[CreatedAt] [datetime2] NULL CONSTRAINT [DF__Blogs__CreatedAt__7928F116] DEFAULT (getdate()),
	[UpdatedAt] [datetime2] NULL CONSTRAINT [DF__Blogs__UpdatedAt__7834CCDD] DEFAULT (getdate()),
PRIMARY KEY CLUSTERED 
(
	[BlogID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [content].[Blogs] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [content].[Blogs] already exists. Skipping.';
END
GO
