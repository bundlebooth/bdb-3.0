-- =============================================
-- Stored Procedure: sp_Vendor_UpdateGooglePlaceId
-- Description: Updates Google Place ID for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateGooglePlaceId]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateGooglePlaceId];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateGooglePlaceId]
    @VendorProfileID INT,
    @GooglePlaceId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET GooglePlaceId = @GooglePlaceId
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
