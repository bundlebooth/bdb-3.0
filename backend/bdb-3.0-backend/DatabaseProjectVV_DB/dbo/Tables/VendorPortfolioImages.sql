CREATE TABLE [dbo].[VendorPortfolioImages] (
    [PortfolioImageID]          INT            IDENTITY (1, 1) NOT NULL,
    [AlbumID]                   INT            NOT NULL,
    [VendorProfileID]           INT            NOT NULL,
    [ImageURL]                  NVARCHAR (500) NOT NULL,
    [CloudinaryPublicId]        NVARCHAR (200) NULL,
    [CloudinaryUrl]             NVARCHAR (500) NULL,
    [CloudinarySecureUrl]       NVARCHAR (500) NULL,
    [CloudinaryTransformations] NVARCHAR (MAX) NULL,
    [Caption]                   NVARCHAR (255) NULL,
    [DisplayOrder]              INT            DEFAULT ((0)) NOT NULL,
    [CreatedAt]                 DATETIME2 (7)  DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [PK_VendorPortfolioImages] PRIMARY KEY CLUSTERED ([PortfolioImageID] ASC),
    CONSTRAINT [FK_VendorPortfolioImages_Albums] FOREIGN KEY ([AlbumID]) REFERENCES [dbo].[VendorPortfolioAlbums] ([AlbumID]) ON DELETE CASCADE,
    CONSTRAINT [FK_VendorPortfolioImages_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

