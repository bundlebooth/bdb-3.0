/*
    Migration Script: Data - [VendorSelectedFeatures]
    Phase: 900 - Data
    Script: cu_900_23_dbo.VendorSelectedFeatures.sql
    Description: Inserts data into [dbo].[VendorSelectedFeatures]
    
    Execution Order: 23
    Record Count: 12
*/

SET NOCOUNT ON;
GO

PRINT 'Inserting data into [dbo].[VendorSelectedFeatures]...';
GO

IF NOT EXISTS (SELECT TOP 1 1 FROM [dbo].[VendorSelectedFeatures])
BEGIN
    SET IDENTITY_INSERT [dbo].[VendorSelectedFeatures] ON;

    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (382, 171, 1, CAST(N'2025-12-03T00:04:41.480' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (383, 171, 2, CAST(N'2025-12-03T00:04:41.480' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (384, 171, 14, CAST(N'2025-12-03T00:04:41.480' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (385, 171, 75, CAST(N'2025-12-03T00:04:41.480' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (389, 1, 1, CAST(N'2025-12-08T23:51:34.753' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (390, 1, 2, CAST(N'2025-12-08T23:51:34.753' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (391, 1, 3, CAST(N'2025-12-08T23:51:34.753' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (490, 138, 1, CAST(N'2025-12-09T20:46:41.810' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (491, 138, 4, CAST(N'2025-12-09T20:46:41.810' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (492, 138, 19, CAST(N'2025-12-09T20:46:41.810' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (493, 138, 22, CAST(N'2025-12-09T20:46:41.810' AS DateTime));
    INSERT [dbo].[VendorSelectedFeatures] ([VendorFeatureSelectionID], [VendorProfileID], [FeatureID], [CreatedAt]) VALUES (494, 138, 41, CAST(N'2025-12-09T20:46:41.810' AS DateTime));

    SET IDENTITY_INSERT [dbo].[VendorSelectedFeatures] OFF;

    PRINT 'Inserted 12 records into [dbo].[VendorSelectedFeatures].';
END
ELSE
BEGIN
    PRINT 'Table [dbo].[VendorSelectedFeatures] already contains data. Skipping.';
END
GO
