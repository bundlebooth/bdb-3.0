-- =============================================
-- Stored Procedure: sp_GetVendorSelectedFeatures
-- Description: Gets selected features for a vendor with full category and feature details
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_GetVendorSelectedFeatures]'))
    DROP PROCEDURE [dbo].[sp_GetVendorSelectedFeatures];
GO

CREATE PROCEDURE [dbo].[sp_GetVendorSelectedFeatures]
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
