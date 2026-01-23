/*
    Migration Script: Data - [VendorPortfolioImages]
    Phase: 900 - Data
    Script: cu_900_30_dbo.VendorPortfolioImages.sql
    Description: Inserts data into [vendors].[VendorPortfolioImages]
    
    Execution Order: 30
    Record Count: 5
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorPortfolioImages]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorPortfolioImages])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorPortfolioImages] ON;

    INSERT [vendors].[VendorPortfolioImages] ([PortfolioImageID], [AlbumID], [VendorProfileID], [ImageURL], [CloudinaryPublicId], [CloudinaryUrl], [CloudinarySecureUrl], [CloudinaryTransformations], [Caption], [DisplayOrder], [CreatedAt]) VALUES (1, 1, 138, N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609204/venuevue/gnnxmkrzf30z9f5del5g.png', NULL, NULL, NULL, NULL, N'planhive_logo.png', 0, CAST(N'2025-10-27T23:53:29.3733333' AS DateTime2));
    INSERT [vendors].[VendorPortfolioImages] ([PortfolioImageID], [AlbumID], [VendorProfileID], [ImageURL], [CloudinaryPublicId], [CloudinaryUrl], [CloudinarySecureUrl], [CloudinaryTransformations], [Caption], [DisplayOrder], [CreatedAt]) VALUES (2, 1, 138, N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609203/venuevue/gh89vle0q3tp4ixo7iux.gif', NULL, NULL, NULL, NULL, N'3dgifmaker44007.gif', 1, CAST(N'2025-10-27T23:53:29.6000000' AS DateTime2));
    INSERT [vendors].[VendorPortfolioImages] ([PortfolioImageID], [AlbumID], [VendorProfileID], [ImageURL], [CloudinaryPublicId], [CloudinaryUrl], [CloudinarySecureUrl], [CloudinaryTransformations], [Caption], [DisplayOrder], [CreatedAt]) VALUES (3, 1, 138, N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609203/venuevue/nwr0uogmjbqncoeiz5tf.gif', NULL, NULL, NULL, NULL, N'3dgifmaker18215.gif', 2, CAST(N'2025-10-27T23:53:29.8600000' AS DateTime2));
    INSERT [vendors].[VendorPortfolioImages] ([PortfolioImageID], [AlbumID], [VendorProfileID], [ImageURL], [CloudinaryPublicId], [CloudinaryUrl], [CloudinarySecureUrl], [CloudinaryTransformations], [Caption], [DisplayOrder], [CreatedAt]) VALUES (4, 1, 138, N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609203/venuevue/oooprmkyfekvssryynij.gif', NULL, NULL, NULL, NULL, N'3dgifmaker98522.gif', 3, CAST(N'2025-10-27T23:53:30.0800000' AS DateTime2));
    INSERT [vendors].[VendorPortfolioImages] ([PortfolioImageID], [AlbumID], [VendorProfileID], [ImageURL], [CloudinaryPublicId], [CloudinaryUrl], [CloudinarySecureUrl], [CloudinaryTransformations], [Caption], [DisplayOrder], [CreatedAt]) VALUES (5, 1, 138, N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609203/venuevue/sisvdamjewkgns0oz2ac.gif', NULL, NULL, NULL, NULL, N'ezgif.com-effects.gif', 4, CAST(N'2025-10-27T23:53:30.3600000' AS DateTime2));

    SET IDENTITY_INSERT [vendors].[VendorPortfolioImages] OFF;

    PRINT 'Inserted 5 records into [vendors].[VendorPortfolioImages].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorPortfolioImages] already contains data. Skipping.';
END
GO
