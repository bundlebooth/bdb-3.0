/*
    Migration Script: Data - [ServiceCategories]
    Phase: 900 - Data
    Script: cu_900_25_dbo.ServiceCategories.sql
    Description: Inserts data into [dbo].[ServiceCategories]
    
    Execution Order: 25
    Record Count: 14
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[ServiceCategories]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[ServiceCategories])
BEGIN
    SET IDENTITY_INSERT [dbo].[ServiceCategories] ON;

    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (1, 3, N'Photography Packages', NULL, 0, CAST(N'2025-08-12T22:11:28.103' AS DateTime), CAST(N'2025-08-12T22:11:28.103' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (2, 89, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-18T21:29:20.850' AS DateTime), CAST(N'2025-08-18T21:29:20.850' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (3, 91, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-18T21:56:44.317' AS DateTime), CAST(N'2025-08-18T21:56:44.317' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (4, 105, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-18T23:40:53.100' AS DateTime), CAST(N'2025-08-18T23:40:53.100' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (5, 115, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-20T15:32:46.240' AS DateTime), CAST(N'2025-08-20T15:32:46.240' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (6, 126, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-20T18:34:16.423' AS DateTime), CAST(N'2025-08-20T18:34:16.423' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (8, 149, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-28T21:37:19.597' AS DateTime), CAST(N'2025-08-28T21:37:19.597' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (9, 150, N'Predefined Services', N'Services selected from predefined options', 1, CAST(N'2025-08-28T21:49:49.370' AS DateTime), CAST(N'2025-08-28T21:49:49.370' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (10, 163, N'Beauty & Wellness', NULL, 0, CAST(N'2025-10-05T21:03:17.413' AS DateTime), CAST(N'2025-10-05T21:03:17.413' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (13, 1, N'Beauty & Wellness', NULL, 0, CAST(N'2025-10-06T21:07:46.420' AS DateTime), CAST(N'2025-10-06T21:07:46.420' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (78, 138, N'Beauty & Wellness', NULL, 0, CAST(N'2025-11-28T23:47:27.477' AS DateTime), CAST(N'2025-11-28T23:47:27.477' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (79, 138, N'General', N'General services', 0, CAST(N'2025-11-28T23:47:27.650' AS DateTime), CAST(N'2025-11-28T23:47:27.650' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (80, 171, N'Beauty & Wellness', NULL, 0, CAST(N'2025-12-02T14:42:26.630' AS DateTime), CAST(N'2025-12-02T14:42:26.630' AS DateTime));
    INSERT [dbo].[ServiceCategories] ([CategoryID], [VendorProfileID], [Name], [Description], [DisplayOrder], [CreatedAt], [UpdatedAt]) VALUES (81, 171, N'General', N'General services', 0, CAST(N'2025-12-02T14:42:27.327' AS DateTime), CAST(N'2025-12-02T14:42:27.327' AS DateTime));

    SET IDENTITY_INSERT [dbo].[ServiceCategories] OFF;

    PRINT 'Inserted 14 records into [dbo].[ServiceCategories].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[ServiceCategories] already contains data. Skipping.';
END
GO
