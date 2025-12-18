-- =============================================
-- Stored Procedure: vendors.sp_GetServiceAreasDetailed
-- Description: Gets detailed service areas for a vendor including bounds
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServiceAreasDetailed]'))
    DROP PROCEDURE [vendors].[sp_GetServiceAreasDetailed];
GO

CREATE PROCEDURE [vendors].[sp_GetServiceAreasDetailed]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        VendorServiceAreaID,
        GooglePlaceID,
        CityName,
        [State/Province] AS StateProvince,
        Country,
        Latitude,
        Longitude,
        ServiceRadius,
        FormattedAddress,
        PlaceType,
        PostalCode,
        TravelCost,
        MinimumBookingAmount,
        IsActive,
        BoundsNortheastLat,
        BoundsNortheastLng,
        BoundsSouthwestLat,
        BoundsSouthwestLng
    FROM VendorServiceAreas 
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
    ORDER BY CityName;
END
GO
