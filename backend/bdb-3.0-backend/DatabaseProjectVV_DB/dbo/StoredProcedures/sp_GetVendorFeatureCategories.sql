
-- Stored procedure to get all feature categories
CREATE   PROCEDURE sp_GetVendorFeatureCategories
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        CategoryID,
        CategoryName,
        CategoryIcon,
        DisplayOrder,
        IsActive,
        CreatedAt
    FROM VendorFeatureCategories
    WHERE IsActive = 1
    ORDER BY DisplayOrder, CategoryName;
END

GO

