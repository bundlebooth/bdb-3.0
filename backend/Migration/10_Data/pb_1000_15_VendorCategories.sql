/*
    Migration Script: Data - [VendorCategories]
    Phase: 900 - Data
    Script: cu_900_15_dbo.VendorCategories.sql
    Description: Inserts data into [vendors].[VendorCategories]
    
    Execution Order: 15
    Record Count: 146
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorCategories]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorCategories])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorCategories] ON;

    -- Updated to use separate category IDs (2026-02-13): photo, video, music, dj
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (238, 1, N'catering');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (4, 3, N'photo');
    -- Removed duplicate videography row (5, 3) - now separate video category available
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (6, 4, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (9, 5, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (10, 7, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (13, 8, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (15, 10, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (16, 11, N'decorations');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (17, 12, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (18, 13, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (19, 14, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (20, 16, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (21, 17, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (23, 18, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (24, 19, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (25, 20, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (26, 24, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (29, 25, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (30, 27, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (31, 28, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (32, 29, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (33, 30, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (43, 32, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (44, 36, N'cake');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (48, 37, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (46, 38, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (49, 40, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (50, 41, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (51, 42, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (54, 43, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (55, 46, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (56, 47, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (57, 48, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (68, 49, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (59, 50, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (60, 51, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (69, 53, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (70, 54, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (71, 55, N'experiences');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (72, 56, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (73, 57, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (74, 58, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (75, 59, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (76, 61, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (77, 62, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (78, 63, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (79, 64, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (80, 65, N'catering');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (81, 66, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (82, 67, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (83, 68, N'fashion');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (84, 69, N'decorations');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (85, 70, N'experiences');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (86, 71, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (87, 72, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (88, 73, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (89, 75, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (90, 76, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (92, 77, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (94, 79, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (95, 80, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (96, 81, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (97, 82, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (98, 83, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (99, 84, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (100, 85, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (101, 86, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (102, 87, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (103, 88, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (104, 89, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (105, 90, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (106, 91, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (107, 92, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (108, 93, N'music');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (110, 94, N'planners');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (111, 95, N'entertainment');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (113, 96, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (115, 98, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (116, 99, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (117, 100, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (118, 101, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (119, 102, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (120, 103, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (121, 104, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (122, 105, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (124, 106, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (125, 107, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (126, 108, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (127, 109, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (128, 110, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (129, 111, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (130, 112, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (132, 113, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (134, 114, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (135, 115, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (136, 116, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (137, 117, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (140, 118, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (141, 120, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (147, 121, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (148, 124, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (149, 125, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (152, 126, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (155, 128, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (156, 129, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (157, 130, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (159, 131, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (160, 132, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (162, 134, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (163, 135, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (164, 136, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (165, 137, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (612, 138, N'catering');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (613, 138, N'entertainment');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (614, 138, N'music');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (615, 138, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (167, 139, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (168, 140, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (169, 141, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (170, 142, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (171, 143, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (379, 144, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (173, 145, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (174, 146, N'cake');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (175, 147, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (176, 148, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (177, 149, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (178, 150, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (179, 151, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (180, 152, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (181, 153, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (182, 154, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (183, 155, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (184, 156, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (185, 157, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (186, 158, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (187, 159, N'catering');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (188, 160, N'entertainment');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (189, 161, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (190, 162, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (197, 163, N'venue');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (200, 166, N'beauty');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (201, 169, N'entertainment');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (402, 171, N'photo');
    INSERT [vendors].[VendorCategories] ([VendorCategoryID], [VendorProfileID], [Category]) VALUES (401, 171, N'venue');

    SET IDENTITY_INSERT [vendors].[VendorCategories] OFF;

    PRINT 'Inserted 145 records into [vendors].[VendorCategories].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorCategories] already contains data. Skipping.';
END
GO
