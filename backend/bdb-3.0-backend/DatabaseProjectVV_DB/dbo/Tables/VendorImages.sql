CREATE TABLE [dbo].[VendorImages] (
    [ImageID]                   INT            IDENTITY (1, 1) NOT NULL,
    [VendorProfileID]           INT            NOT NULL,
    [ImageURL]                  NVARCHAR (500) NOT NULL,
    [CloudinaryPublicId]        NVARCHAR (200) NULL,
    [CloudinaryUrl]             NVARCHAR (500) NULL,
    [CloudinarySecureUrl]       NVARCHAR (500) NULL,
    [CloudinaryTransformations] NVARCHAR (MAX) NULL,
    [IsPrimary]                 BIT            DEFAULT ((0)) NOT NULL,
    [DisplayOrder]              INT            DEFAULT ((0)) NOT NULL,
    [ImageType]                 NVARCHAR (20)  DEFAULT ('Gallery') NULL,
    [Caption]                   NVARCHAR (255) NULL,
    [CreatedAt]                 DATETIME2 (7)  DEFAULT (getutcdate()) NOT NULL,
    CONSTRAINT [PK_VendorImages] PRIMARY KEY CLUSTERED ([ImageID] ASC),
    CONSTRAINT [FK_VendorImages_VendorProfiles] FOREIGN KEY ([VendorProfileID]) REFERENCES [dbo].[VendorProfiles] ([VendorProfileID])
);


GO

