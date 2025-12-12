
-- Stored procedure to get all features grouped by category
CREATE   PROCEDURE sp_GetAllVendorFeaturesGrouped
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

