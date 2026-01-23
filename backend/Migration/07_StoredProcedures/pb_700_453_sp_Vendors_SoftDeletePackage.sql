-- =============================================
-- Vendors - Soft Delete Package
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_SoftDeletePackage', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SoftDeletePackage;
GO

CREATE PROCEDURE vendors.sp_SoftDeletePackage
    @PackageID INT,
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.Packages 
    SET IsActive = 0, UpdatedAt = GETDATE()
    WHERE PackageID = @PackageID AND VendorProfileID = @VendorProfileID;
END
GO
