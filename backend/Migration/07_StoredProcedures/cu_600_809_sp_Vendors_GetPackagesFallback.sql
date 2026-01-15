-- =============================================
-- Vendors - Get Packages Fallback
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_GetPackagesFallback', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetPackagesFallback;
GO

CREATE PROCEDURE vendors.sp_GetPackagesFallback
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PackageID, VendorProfileID, PackageName, Description,
        Price, SalePrice, PriceType, DurationMinutes, ImageURL, FinePrint,
        IncludedServices, IsActive, CreatedAt, UpdatedAt
    FROM vendors.Packages
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
    ORDER BY CreatedAt DESC;
END
GO
