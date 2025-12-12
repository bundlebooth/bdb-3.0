CREATE TABLE [dbo].[VendorPortfolioAlbums] (
    [AlbumID]            INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]    INT            NOT NULL,
    [AlbumName]          NVARCHAR (100) NOT NULL,
    [AlbumDescription]   NVARCHAR (500) NULL,
    [CoverImageURL]      NVARCHAR (500) NULL,
    [CloudinaryPublicId] NVARCHAR (200) NULL,
    [IsPublic]           BIT            DEFAULT ((1)) NOT NULL,
    [DisplayOrder]       INT            DEFAULT ((0)) NOT NULL,
    [CreatedAt]          DATETIME2 (7)  DEFAULT (getutcdate()) NOT NULL,
    [UpdatedAt]          DATETIME2 (7)  DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [PK_VendorPortfolioAlbums] PRIMARY KEY CLUSTERED ([AlbumID] ASC),
    CONSTRAINT [FK_VendorPortfolioAlbums_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

