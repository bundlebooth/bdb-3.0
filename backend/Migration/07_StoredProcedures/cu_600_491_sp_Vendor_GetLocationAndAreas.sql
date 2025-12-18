-- =============================================
-- Stored Procedure: sp_Vendor_GetLocationAndAreas
-- Description: Gets vendor location and service areas
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_GetLocationAndAreas]'))
    DROP PROCEDURE [dbo].[sp_Vendor_GetLocationAndAreas];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_GetLocationAndAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile location
    SELECT Address, City, State, Country, PostalCode, Latitude, Longitude
    FROM VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Get service areas
    SELECT GooglePlaceID, CityName, [State/Province] as StateProvince, Country, 
           Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, IsActive
    FROM VendorServiceAreas
    WHERE VendorProfileID = @VendorProfileID;
END
GO
