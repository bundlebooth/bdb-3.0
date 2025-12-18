-- =============================================
-- Stored Procedure: vendors.sp_UpdateGooglePlaceId
-- Description: Updates Google Place ID for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateGooglePlaceId]'))
    DROP PROCEDURE [vendors].[sp_UpdateGooglePlaceId];
GO

CREATE PROCEDURE [vendors].[sp_UpdateGooglePlaceId]
    @VendorProfileID INT,
    @GooglePlaceId NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET GooglePlaceId = @GooglePlaceId
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

