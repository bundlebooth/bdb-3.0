/*
    Migration Script: Data - [Favorites]
    Phase: 900 - Data
    Script: cu_900_31_dbo.Favorites.sql
    Description: Inserts data into [users].[Favorites]
    
    Execution Order: 31
    Record Count: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [users].[Favorites]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [users].[Favorites])
BEGIN
    SET IDENTITY_INSERT [users].[Favorites] ON;

    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (1, 3, 3, CAST(N'2025-08-12T22:11:29.100' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (2, 2, 3, CAST(N'2025-08-12T22:12:16.270' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (3, 17, 16, CAST(N'2025-08-13T01:33:59.433' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (8, 45, 3, CAST(N'2025-08-14T16:40:54.807' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (9, 45, 16, CAST(N'2025-08-14T16:41:06.707' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (10, 53, 3, CAST(N'2025-08-15T06:06:58.103' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (43, 1, 138, CAST(N'2025-10-06T01:30:26.190' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (44, 1, 115, CAST(N'2025-10-06T02:02:56.300' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (92, 144, 1, CAST(N'2025-11-04T04:12:03.580' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (101, 144, NULL, CAST(N'2025-11-17T17:05:34.807' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (122, 144, 3, CAST(N'2025-11-29T17:33:51.020' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (123, 144, 43, CAST(N'2025-11-29T20:23:08.057' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (125, 144, 138, CAST(N'2025-12-11T20:47:14.770' AS DateTime));
    INSERT [users].[Favorites] ([FavoriteID], [UserID], [VendorProfileID], [CreatedAt]) VALUES (126, 144, 115, CAST(N'2025-12-11T23:52:46.953' AS DateTime));

    SET IDENTITY_INSERT [users].[Favorites] OFF;

    PRINT 'Inserted 14 records into [users].[Favorites].';
END
ELSE
BEGIN
    PRINT 'Table [users].[Favorites] already contains data. Skipping.';
END
GO
