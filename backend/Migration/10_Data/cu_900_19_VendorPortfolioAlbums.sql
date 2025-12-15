/*
    Migration Script: Data - [VendorPortfolioAlbums]
    Phase: 900 - Data
    Script: cu_900_19_dbo.VendorPortfolioAlbums.sql
    Description: Inserts data into [dbo].[VendorPortfolioAlbums]
    
    Execution Order: 19
    Record Count: 2
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[VendorPortfolioAlbums]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[VendorPortfolioAlbums])
BEGIN
    SET IDENTITY_INSERT [dbo].[VendorPortfolioAlbums] ON;

    INSERT [dbo].[VendorPortfolioAlbums] ([AlbumID], [VendorProfileID], [AlbumName], [AlbumDescription], [CoverImageURL], [CloudinaryPublicId], [IsPublic], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (1, 138, N'Test', N'test', N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761609184/venuevue/rpatiol6ldt8ojo2bydn.gif', NULL, 1, 0, CAST(N'2025-10-27T23:53:14.2600000' AS DateTime2), CAST(N'2025-10-28T15:01:54.9800000' AS DateTime2));
    INSERT [dbo].[VendorPortfolioAlbums] ([AlbumID], [VendorProfileID], [AlbumName], [AlbumDescription], [CoverImageURL], [CloudinaryPublicId], [IsPublic], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (3, 138, N'Weddings 2024', N'TeST2', N'https://res.cloudinary.com/dxgy4apj5/image/upload/v1761742976/venuevue/c2hxeffqciudwphdtwh0.png', NULL, 1, 0, CAST(N'2025-10-29T13:02:58.6700000' AS DateTime2), CAST(N'2025-10-29T13:02:58.6700000' AS DateTime2));

    SET IDENTITY_INSERT [dbo].[VendorPortfolioAlbums] OFF;

    PRINT 'Inserted 2 records into [dbo].[VendorPortfolioAlbums].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorPortfolioAlbums] already contains data. Skipping.';
END
GO
