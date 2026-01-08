-- =============================================
-- Stored Procedure: admin.sp_GetVendorFeatures
-- Description: Gets vendor selected features
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorFeatures]'))
    DROP PROCEDURE [admin].[sp_GetVendorFeatures];
GO

CREATE PROCEDURE [admin].[sp_GetVendorFeatures]
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
    FROM vendors.VendorSelectedFeatures vsf
    LEFT JOIN vendors.VendorFeatures f ON vsf.FeatureID = f.FeatureID
    LEFT JOIN vendors.VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE vsf.VendorProfileID = @VendorProfileID
        AND (f.IsActive = 1 OR f.IsActive IS NULL)
    ORDER BY COALESCE(c.DisplayOrder, 999), COALESCE(f.DisplayOrder, 999);
END
GO



