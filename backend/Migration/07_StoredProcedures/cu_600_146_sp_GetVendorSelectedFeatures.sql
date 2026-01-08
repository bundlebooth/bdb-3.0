-- =============================================
-- Stored Procedure: vendors.sp_GetSelectedFeatures
-- Description: Gets selected features for a vendor with full category and feature details
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetSelectedFeatures]'))
    DROP PROCEDURE [vendors].[sp_GetSelectedFeatures];
GO

CREATE PROCEDURE [vendors].[sp_GetSelectedFeatures]
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
    FROM vendors.VendorSelectedFeatures vsf
    JOIN vendors.VendorFeatures f ON vsf.FeatureID = f.FeatureID
    JOIN vendors.VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE vsf.VendorProfileID = @VendorProfileID
        AND f.IsActive = 1
        AND c.IsActive = 1
    ORDER BY c.DisplayOrder, f.DisplayOrder;
END
GO



