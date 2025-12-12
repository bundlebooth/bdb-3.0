
-- Stored procedure to get features by category
CREATE   PROCEDURE sp_GetVendorFeaturesByCategory
    @CategoryKey NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        f.FeatureID,
        f.CategoryID,
        f.FeatureName,
        f.FeatureDescription,
        f.FeatureIcon,
        f.DisplayOrder,
        f.IsActive,
        c.CategoryName,
        c.CategoryIcon AS CategoryIconName
    FROM VendorFeatures f
    JOIN VendorFeatureCategories c ON f.CategoryID = c.CategoryID
    WHERE f.IsActive = 1 
        AND c.IsActive = 1
        AND (@CategoryKey IS NULL OR c.CategoryName = @CategoryKey)
    ORDER BY f.DisplayOrder, f.FeatureName;
END

GO

