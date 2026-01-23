-- =============================================
-- Vendors - Get Vendor Categories
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_GetVendorCategories', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetVendorCategories;
GO

CREATE PROCEDURE vendors.sp_GetVendorCategories
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT vc.Category AS CategoryName, vc.IsPrimary
    FROM vendors.VendorCategories vc
    WHERE vc.VendorProfileID = @VendorProfileID
    ORDER BY vc.IsPrimary DESC, vc.Category;
END
GO
