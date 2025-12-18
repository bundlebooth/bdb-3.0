-- =============================================
-- Stored Procedure: sp_Admin_GetVendorFeatures
-- Description: Gets vendor selected features
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Admin_GetVendorFeatures]'))
    DROP PROCEDURE [dbo].[sp_Admin_GetVendorFeatures];
GO

CREATE PROCEDURE [dbo].[sp_Admin_GetVendorFeatures]
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
        c.CategoryIcon
    FROM VendorSelectedFeatures vsf
    LEFT JOIN VendorFeatures f ON vsf.FeatureID = f.FeatureID
    LEFT JOIN VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE vsf.VendorProfileID = @VendorProfileID
        AND (f.IsActive = 1 OR f.IsActive IS NULL)
    ORDER BY COALESCE(c.DisplayOrder, 999), COALESCE(f.DisplayOrder, 999);
END
GO
