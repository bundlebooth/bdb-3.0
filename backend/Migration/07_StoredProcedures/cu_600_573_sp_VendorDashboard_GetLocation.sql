-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_GetLocation
-- Description: Gets vendor location and service areas
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_GetLocation]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_GetLocation];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_GetLocation]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- First recordset: Profile location
    SELECT Address, City, State, Country, PostalCode, Latitude, Longitude
    FROM vendors.VendorProfiles WHERE VendorProfileID = @VendorProfileID;
    
    -- Second recordset: Service areas
    SELECT VendorServiceAreaID, GooglePlaceID, CityName, [State/Province] AS StateProvince, Country,
           Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
           TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng,
           BoundsSouthwestLat, BoundsSouthwestLng, IsActive
    FROM VendorServiceAreas WHERE VendorProfileID = @VendorProfileID ORDER BY VendorServiceAreaID;
END
GO

