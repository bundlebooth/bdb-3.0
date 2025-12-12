
-- Stored procedure to get vendor's feature summary (count per category)
CREATE   PROCEDURE sp_GetVendorFeatureSummary
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        c.CategoryID,
        c.CategoryName,
        c.CategoryIcon,
        COUNT(vsf.FeatureID) AS FeatureCount
    FROM VendorFeatureCategories c
    LEFT JOIN VendorFeatures f ON c.CategoryID = f.CategoryID AND f.IsActive = 1
    LEFT JOIN VendorSelectedFeatures vsf ON f.FeatureID = vsf.FeatureID AND vsf.VendorProfileID = @VendorProfileID
    WHERE c.IsActive = 1
    GROUP BY c.CategoryID, c.CategoryName, c.CategoryIcon, c.DisplayOrder
    ORDER BY c.DisplayOrder;
END

GO

