/*
    Migration Script: Data - [VendorFeatureCategories]
    Phase: 900 - Data
    Script: cu_900_07_dbo.VendorFeatureCategories.sql
    Description: Inserts data into [vendors].[VendorFeatureCategories]
    
    Execution Order: 7
    Record Count: 13
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorFeatureCategories]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorFeatureCategories])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorFeatureCategories] ON;

    -- Descriptive category names for display, ApplicableVendorCategories used for filtering by vendor category ID
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (1, N'Venue Features', N'building-2', 1, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'venue');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (2, N'Photography & Video', N'camera', 2, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'photo');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (3, N'Music & Entertainment', N'music', 3, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'music');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (4, N'Catering & Bar', N'utensils', 4, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'catering');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (5, N'Floral & Decor', N'flower-2', 5, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'decor');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (6, N'Event Services', N'party-popper', 6, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'entertainment');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (7, N'Transportation', N'car', 7, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'transport');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (8, N'Experience Services', N'sparkles', 8, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'experiences');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (9, N'Event Planning', N'clipboard-list', 9, 1, CAST(N'2025-10-24T14:15:15.497' AS DateTime), N'planner');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (10, N'Beauty & Fashion Services', N'sparkles', 10, 1, CAST(N'2025-10-31T13:22:59.923' AS DateTime), N'beauty');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (11, N'Stationery & Paper Goods', N'file', 11, 1, CAST(N'2025-10-31T13:23:00.517' AS DateTime), N'stationery');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (12, N'Cake & Desserts', N'cake', 12, 1, CAST(N'2025-10-31T13:23:00.940' AS DateTime), N'cake');
    INSERT [vendors].[VendorFeatureCategories] ([CategoryID], [CategoryName], [CategoryIcon], [DisplayOrder], [IsActive], [CreatedAt], [ApplicableVendorCategories]) VALUES (13, N'Fashion & Attire', N'sparkles', 13, 1, CAST(N'2025-10-31T13:23:01.373' AS DateTime), N'fashion');

    SET IDENTITY_INSERT [vendors].[VendorFeatureCategories] OFF;

    PRINT 'Inserted 13 records into [vendors].[VendorFeatureCategories].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorFeatureCategories] already contains data. Skipping.';
END
GO
