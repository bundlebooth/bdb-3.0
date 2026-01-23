/*
    Migration Script: Create Table [VendorPortfolioImages]
    Phase: 100 - Tables
    Script: cu_100_44_dbo.VendorPortfolioImages.sql
    Description: Creates the [vendors].[VendorPortfolioImages] table
    
    Execution Order: 44
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorPortfolioImages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorPortfolioImages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorPortfolioImages](
	[PortfolioImageID] [int] IDENTITY(1,1) NOT NULL,
	[AlbumID] [int] NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[ImageURL] [nvarchar](500) NOT NULL,
	[CloudinaryPublicId] [nvarchar](200) NULL,
	[CloudinaryUrl] [nvarchar](500) NULL,
	[CloudinarySecureUrl] [nvarchar](500) NULL,
	[CloudinaryTransformations] [nvarchar](max) NULL,
	[Caption] [nvarchar](255) NULL,
	[DisplayOrder] [int] NOT NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_VendorPortfolioImages] PRIMARY KEY CLUSTERED 
(
	[PortfolioImageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorPortfolioImages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorPortfolioImages] already exists. Skipping.';
END
GO
