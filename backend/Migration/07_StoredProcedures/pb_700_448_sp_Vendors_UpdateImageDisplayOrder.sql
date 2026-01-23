-- =============================================
-- Vendors - Update Image Display Order
-- Created: API Audit - Security Enhancement
-- =============================================
IF OBJECT_ID('vendors.sp_UpdateImageDisplayOrder', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_UpdateImageDisplayOrder;
GO

CREATE PROCEDURE vendors.sp_UpdateImageDisplayOrder
    @ImageID INT,
    @VendorProfileID INT,
    @DisplayOrder INT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorImages 
    SET DisplayOrder = @DisplayOrder 
    WHERE ImageID = @ImageID AND VendorProfileID = @VendorProfileID;
END
GO
