/*
    Migration Script: Create Table [VendorPortfolioAlbums]
    Phase: 100 - Tables
    Script: cu_100_27_dbo.VendorPortfolioAlbums.sql
    Description: Creates the [dbo].[VendorPortfolioAlbums] table
    
    Execution Order: 27
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [dbo].[VendorPortfolioAlbums]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[VendorPortfolioAlbums]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[VendorPortfolioAlbums](
	[AlbumID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[AlbumName] [nvarchar](100) NOT NULL,
	[AlbumDescription] [nvarchar](500) NULL,
	[CoverImageURL] [nvarchar](500) NULL,
	[CloudinaryPublicId] [nvarchar](200) NULL,
	[IsPublic] [bit] NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_VendorPortfolioAlbums] PRIMARY KEY CLUSTERED 
(
	[AlbumID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [dbo].[VendorPortfolioAlbums] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorPortfolioAlbums] already exists. Skipping.';
END
GO
