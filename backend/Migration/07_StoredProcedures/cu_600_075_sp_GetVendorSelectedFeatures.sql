/*
    Migration Script: Create Stored Procedure [sp_GetVendorSelectedFeatures]
    Phase: 600 - Stored Procedures
    Script: cu_600_075_dbo.sp_GetVendorSelectedFeatures.sql
    Description: Creates the [dbo].[sp_GetVendorSelectedFeatures] stored procedure
    
    Execution Order: 75
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_GetVendorSelectedFeatures]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorSelectedFeatures]'))
    DROP PROCEDURE [dbo].[sp_GetVendorSelectedFeatures];
GO

CREATE   PROCEDURE [dbo].[sp_GetVendorSelectedFeatures]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        vsf.VendorFeatureSelectionID,
        vsf.VendorProfileID,
        vsf.FeatureID,
        f.FeatureName,
        f.FeatureName AS FeatureKey,
        f.FeatureDescription,
        f.FeatureIcon,
        c.CategoryID,
        c.CategoryName,
        c.CategoryName AS CategoryKey,
        c.CategoryIcon,
        vsf.CreatedAt AS SelectedAt
    FROM VendorSelectedFeatures vsf
    JOIN VendorFeatures f ON vsf.FeatureID = f.FeatureID
    JOIN VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE vsf.VendorProfileID = @VendorProfileID
        AND f.IsActive = 1
        AND c.IsActive = 1
    ORDER BY c.DisplayOrder, f.DisplayOrder;
END

GO

PRINT 'Stored procedure [dbo].[sp_GetVendorSelectedFeatures] created successfully.';
GO
