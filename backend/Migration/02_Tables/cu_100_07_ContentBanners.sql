/*
    Migration Script: Create Table [ContentBanners]
    Phase: 100 - Tables
    Script: cu_100_07_dbo.ContentBanners.sql
    Description: Creates the [dbo].[ContentBanners] table
    
    Execution Order: 7
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[ContentBanners]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[ContentBanners]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[ContentBanners](
	[BannerID] [int] IDENTITY(1,1) NOT NULL,
	[Title] [nvarchar](200) NOT NULL,
	[Subtitle] [nvarchar](500) NULL,
	[ImageURL] [nvarchar](500) NULL,
	[LinkURL] [nvarchar](500) NULL,
	[LinkText] [nvarchar](100) NULL,
	[BackgroundColor] [nvarchar](20) NULL,
	[TextColor] [nvarchar](20) NULL,
	[Position] [nvarchar](50) NULL,
	[DisplayOrder] [int] NULL,
	[StartDate] [datetime2](7) NULL,
	[EndDate] [datetime2](7) NULL,
	[IsActive] [bit] NULL,
	[CreatedAt] [datetime2](7) NULL,
	[UpdatedAt] [datetime2](7) NULL,
	[CreatedBy] [int] NULL,
PRIMARY KEY CLUSTERED 
(
	[BannerID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[ContentBanners] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[ContentBanners] already exists. Skipping.';
END
GO
