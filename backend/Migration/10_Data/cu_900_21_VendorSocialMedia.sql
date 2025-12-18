/*
    Migration Script: Data - [VendorSocialMedia]
    Phase: 900 - Data
    Script: cu_900_21_dbo.VendorSocialMedia.sql
    Description: Inserts data into [vendors].[VendorSocialMedia]
    
    Execution Order: 21
    Record Count: 53
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [vendors].[VendorSocialMedia]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [vendors].[VendorSocialMedia])
BEGIN
    SET IDENTITY_INSERT [vendors].[VendorSocialMedia] ON;

    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (1, 14, N'facebook', N'facebook.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (2, 14, N'instagram', N'instagram.com/bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (4, 16, N'facebook', N'facebook.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (5, 16, N'instagram', N'instagram.com/bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (6, 17, N'facebook', N'facebook.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (7, 17, N'instagram', N'instagram.com/bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (8, 17, N'twitter', N'twitter.com/bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (10, 20, N'instagram', N'bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (11, 43, N'facebook', N'bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (12, 43, N'facebook', N'bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (13, 43, N'instagram', N'bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (14, 43, N'instagram', N'bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (15, 43, N'twitter', N'bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (16, 43, N'twitter', N'bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (17, 43, N'linkedin', N'bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (18, 43, N'linkedin', N'bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (19, 43, N'youtube', N'bundlebooth.ca', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (20, 43, N'youtube', N'bundlebooth.ca', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (21, 43, N'tiktok', N'bundlebooth.ca', 5);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (22, 43, N'tiktok', N'bundlebooth.ca', 5);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (23, 48, N'facebook', N'bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (24, 48, N'instagram', N'bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (25, 48, N'twitter', N'bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (26, 48, N'linkedin', N'bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (27, 53, N'facebook', N'bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (28, 53, N'instagram', N'bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (29, 53, N'twitter', N'bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (30, 53, N'linkedin', N'bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (31, 54, N'facebook', N'https://facebook.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (32, 54, N'instagram', N'https://instagram.com/bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (33, 54, N'twitter', N'https://twitter.com/bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (34, 54, N'linkedin', N'https://linkedin.com/in/bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (35, 54, N'youtube', N'https://youtube.com/bundlebooth.ca', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (36, 54, N'tiktok', N'https://tiktok.com/@bundlebooth.ca', 5);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (40, 1, N'Instagram', N'https://instagram.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (41, 163, N'Facebook', N'https://facebook.com/bundlebooth.ca', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (42, 163, N'Instagram', N'https://instagram.com/bundlebooth.ca', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (43, 163, N'Twitter', N'https://twitter.com/bundlebooth.ca', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (44, 163, N'LinkedIn', N'https://linkedin.com/in/bundlebooth.ca', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (45, 163, N'YouTube', N'https://youtube.com/bundlebooth.ca', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (46, 163, N'TikTok', N'https://tiktok.com/@bundlebooth.ca', 5);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (50, 171, N'Facebook', N'test', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (51, 171, N'Instagram', N'test', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (52, 171, N'Twitter', N'test', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (53, 171, N'LinkedIn', N'set', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (54, 171, N'YouTube', N'st', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (55, 171, N'TikTok', N'test', 5);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (239, 138, N'Facebook', N'fivefeetabove12', 0);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (240, 138, N'Instagram', N'fivefeetabove23', 1);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (241, 138, N'Twitter', N'fivefeetabove3', 2);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (242, 138, N'LinkedIn', N'fivefeetabove4', 3);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (243, 138, N'YouTube', N'fivefeetabove5', 4);
    INSERT [vendors].[VendorSocialMedia] ([SocialID], [VendorProfileID], [Platform], [URL], [DisplayOrder]) VALUES (244, 138, N'TikTok', N'fivefeetabove6', 5);

    SET IDENTITY_INSERT [vendors].[VendorSocialMedia] OFF;

    PRINT 'Inserted 53 records into [vendors].[VendorSocialMedia].';
END
ELSE
BEGIN
    PRINT 'Table [vendors].[VendorSocialMedia] already contains data. Skipping.';
END
GO
