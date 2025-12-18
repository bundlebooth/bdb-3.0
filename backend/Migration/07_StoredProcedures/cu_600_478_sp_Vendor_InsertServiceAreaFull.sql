-- =============================================
-- Stored Procedure: sp_Vendor_InsertServiceAreaFull
-- Description: Inserts a service area with all fields for a vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_InsertServiceAreaFull]'))
    DROP PROCEDURE [dbo].[sp_Vendor_InsertServiceAreaFull];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_InsertServiceAreaFull]
    @VendorProfileID INT,
    @GooglePlaceID NVARCHAR(100) = '',
    @CityName NVARCHAR(100),
    @StateProvince NVARCHAR(100) = NULL,
    @Country NVARCHAR(100) = NULL,
    @Latitude DECIMAL(9,6) = NULL,
    @Longitude DECIMAL(9,6) = NULL,
    @ServiceRadius DECIMAL(10,2) = 25.0,
    @FormattedAddress NVARCHAR(255) = NULL,
    @PlaceType NVARCHAR(50) = NULL,
    @PostalCode NVARCHAR(20) = NULL,
    @TravelCost DECIMAL(10,2) = NULL,
    @MinimumBookingAmount DECIMAL(10,2) = NULL,
    @BoundsNortheastLat DECIMAL(9,6) = NULL,
    @BoundsNortheastLng DECIMAL(9,6) = NULL,
    @BoundsSouthwestLat DECIMAL(9,6) = NULL,
    @BoundsSouthwestLng DECIMAL(9,6) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorServiceAreas (
        VendorProfileID, GooglePlaceID, CityName, [State/Province], Country, 
        Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
        TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng, 
        BoundsSouthwestLat, BoundsSouthwestLng, IsActive, CreatedDate, LastModifiedDate
    )
    VALUES (
        @VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country,
        @Latitude, @Longitude, @ServiceRadius, @FormattedAddress, @PlaceType, @PostalCode,
        @TravelCost, @MinimumBookingAmount, @BoundsNortheastLat, @BoundsNortheastLng,
        @BoundsSouthwestLat, @BoundsSouthwestLng, 1, GETDATE(), GETDATE()
    );
    
    SELECT SCOPE_IDENTITY() AS ServiceAreaID;
END
GO
