/*
    Migration Script: Create Table [VendorImages]
    Phase: 100 - Tables
    Script: cu_100_25_dbo.VendorImages.sql
    Description: Creates the [vendors].[VendorImages] table
    
    Execution Order: 25
*/

SET NOCOUNT ON;
GO

PRINT 'Creating table [vendors].[VendorImages]...';
GO

IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[VendorImages]') AND type in (N'U'))
BEGIN
    CREATE TABLE [vendors].[VendorImages](
	[ImageID] [int] IDENTITY(1,1) NOT NULL,
	[VendorProfileID] [int] NOT NULL,
	[ImageURL] [nvarchar](500) NOT NULL,
	[CloudinaryPublicId] [nvarchar](200) NULL,
	[CloudinaryUrl] [nvarchar](500) NULL,
	[CloudinarySecureUrl] [nvarchar](500) NULL,
	[CloudinaryTransformations] [nvarchar](max) NULL,
	[IsPrimary] [bit] NOT NULL,
	[DisplayOrder] [int] NOT NULL,
	[ImageType] [nvarchar](20) NULL,
	[Caption] [nvarchar](255) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
 CONSTRAINT [PK_VendorImages] PRIMARY KEY CLUSTERED 
(
	[ImageID] ASC
)WITH (STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
    );
    PRINT 'Table [vendors].[VendorImages] created successfully.';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorImages] already exists. Skipping.';
END
GO
