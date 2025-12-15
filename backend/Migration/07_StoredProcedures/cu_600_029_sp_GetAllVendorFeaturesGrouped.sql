/*
    Migration Script: Create Stored Procedure [sp_GetAllVendorFeaturesGrouped]
    Phase: 600 - Stored Procedures
    Script: cu_600_029_dbo.sp_GetAllVendorFeaturesGrouped.sql
    Description: Creates the [dbo].[sp_GetAllVendorFeaturesGrouped] stored procedure
    
    Execution Order: 29
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetAllVendorFeaturesGrouped]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetAllVendorFeaturesGrouped]'))
    DROP PROCEDURE [dbo].[sp_GetAllVendorFeaturesGrouped];
GO

CREATE   PROCEDURE [dbo].[sp_GetAllVendorFeaturesGrouped]
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.CategoryName,
        c.CategoryName AS CategoryKey,
        NULL AS CategoryDescription,
        c.CategoryIcon,
        c.ApplicableVendorCategories,
        c.DisplayOrder AS CategoryOrder,
        f.FeatureID,
        f.FeatureName,
        f.FeatureName AS FeatureKey,
        f.FeatureDescription,
        f.FeatureIcon,
        f.DisplayOrder AS FeatureOrder
    FROM VendorFeatureCategories c
    LEFT JOIN VendorFeatures f ON c.CategoryID = f.CategoryID AND f.IsActive = 1
    WHERE c.IsActive = 1
    ORDER BY c.DisplayOrder, c.CategoryName, f.DisplayOrder, f.FeatureName;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetAllVendorFeaturesGrouped] created successfully.';
GO
