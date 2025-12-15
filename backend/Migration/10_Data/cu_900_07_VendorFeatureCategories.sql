/*
    Migration Script: Data - [VendorFeatureCategories]
    Phase: 900 - Data
    Script: cu_900_07_dbo.VendorFeatureCategories.sql
    Description: Inserts data into [dbo].[VendorFeatureCategories]
    
    Execution Order: 7
    Record Count: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[VendorFeatureCategories]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[VendorFeatureCategories])
BEGIN
    SET IDENTITY_INSERT [dbo].[VendorFeatureCategories] ON;

    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (1, N'Venue Features', N'building-2', 1, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'venue');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (2, N'Photography & Video', N'camera', 2, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'photo');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (3, N'Music & Entertainment', N'music', 3, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'music,entertainment');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (4, N'Catering & Bar', N'utensils', 4, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'catering,cake');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (5, N'Floral & Decor', N'flower-2', 5, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'decor');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (6, N'Event Services', N'party-popper', 6, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'planner,venue');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (7, N'Transportation', N'car', 7, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'transport');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (8, N'Special Features', N'sparkles', 8, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'venue,entertainment,experiences,catering');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (9, N'Event Planning', N'clipboard-list', 9, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'planner');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (10, N'Beauty & Fashion Services', N'sparkles', 10, 1, CAST(N'2025-10-31T13:22:59.923' AS DateTime), N'beauty,fashion');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (11, N'Stationery & Paper Goods', N'file', 11, 1, CAST(N'2025-10-31T13:23:00.517' AS DateTime), N'stationery');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (12, N'Cake & Desserts', N'cake', 12, 1, CAST(N'2025-10-31T13:23:00.940' AS DateTime), N'cake');
    INSERT [dbo].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (13, N'Experience Services', N'sparkles', 13, 1, CAST(N'2025-10-31T13:23:01.373' AS DateTime), N'experiences');

    SET IDENTITY_INSERT [dbo].[VendorFeatureCategories] OFF;

    PRINT 'Inserted 13 records into [dbo].[VendorFeatureCategories].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorFeatureCategories] already contains data. Skipping.';
END
GO
