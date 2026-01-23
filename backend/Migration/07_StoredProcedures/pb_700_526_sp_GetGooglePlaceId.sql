-- ============================================================
-- Get Google Place ID for a vendor
-- ============================================================
IF OBJECT_ID('vendors.sp_GetGooglePlaceId', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_GetGooglePlaceId;
GO

CREATE PROCEDURE vendors.sp_GetGooglePlaceId
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT GooglePlaceId
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
END
GO
