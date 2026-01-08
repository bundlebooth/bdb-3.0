-- =============================================
-- Stored Procedure: vendors.sp_GetSelectedFeatures
-- Description: Gets selected features for a vendor
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
        vsf.FeatureID,
        vf.FeatureName,
        vf.FeatureDescription,
        vf.FeatureIcon,
        vf.DisplayOrder AS FeatureOrder,
        vfc.CategoryID,
        vfc.CategoryName,
        vfc.CategoryIcon,
        vfc.DisplayOrder AS CategoryOrder,
        vsf.CreatedAt AS SelectedAt
    FROM vendors.VendorSelectedFeatures vsf
    INNER JOIN vendors.VendorFeatures vf ON vsf.FeatureID = vf.FeatureID
    INNER JOIN vendors.VendorFeatureCategories vfc ON vf.CategoryID = vfc.CategoryID
    WHERE vsf.VendorProfileID = @VendorProfileID
    ORDER BY vfc.DisplayOrder, vf.DisplayOrder;
END
GO

