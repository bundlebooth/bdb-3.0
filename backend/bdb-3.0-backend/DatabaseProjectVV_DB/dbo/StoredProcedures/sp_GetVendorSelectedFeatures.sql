
-- Stored procedure to get vendor's selected features
CREATE   PROCEDURE sp_GetVendorSelectedFeatures
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

