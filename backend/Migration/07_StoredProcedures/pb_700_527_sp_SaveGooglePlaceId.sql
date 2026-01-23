-- ============================================================
-- Save/Update Google Place ID for a vendor
-- ============================================================
IF OBJECT_ID('vendors.sp_SaveGooglePlaceId', 'P') IS NOT NULL
    DROP PROCEDURE vendors.sp_SaveGooglePlaceId;
GO

CREATE PROCEDURE vendors.sp_SaveGooglePlaceId
    @VendorProfileID INT,
    @GooglePlaceId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET GooglePlaceId = @GooglePlaceId,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 'error' AS Status, 'Vendor profile not found' AS Message;
        RETURN;
    END
    
    SELECT 'success' AS Status, 'Google Place ID saved successfully' AS Message;
END
GO
