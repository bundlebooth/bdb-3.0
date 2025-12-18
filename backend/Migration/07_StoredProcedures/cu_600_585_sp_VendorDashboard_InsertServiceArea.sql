-- =============================================
-- Stored Procedure: sp_VendorDashboard_InsertServiceArea
-- Description: Inserts a service area for vendor
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_InsertServiceArea]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_InsertServiceArea];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_InsertServiceArea]
    @VendorProfileID INT,
    @GooglePlaceID NVARCHAR(100),
    @CityName NVARCHAR(100),
    @StateProvince NVARCHAR(100),
    @Country NVARCHAR(100),
    @Latitude DECIMAL(9,6),
    @Longitude DECIMAL(9,6),
    @ServiceRadius DECIMAL(10,2),
    @FormattedAddress NVARCHAR(255),
    @PlaceType NVARCHAR(50),
    @PostalCode NVARCHAR(20),
    @TravelCost DECIMAL(10,2),
    @MinimumBookingAmount DECIMAL(10,2),
    @BoundsNortheastLat DECIMAL(9,6),
    @BoundsNortheastLng DECIMAL(9,6),
    @BoundsSouthwestLat DECIMAL(9,6),
    @BoundsSouthwestLng DECIMAL(9,6)
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorServiceAreas (
        VendorProfileID, GooglePlaceID, CityName, [State/Province], Country,
        Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, PostalCode,
        TravelCost, MinimumBookingAmount, BoundsNortheastLat, BoundsNortheastLng,
        BoundsSouthwestLat, BoundsSouthwestLng, IsActive, CreatedDate, LastModifiedDate
    ) VALUES (
        @VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country,
        @Latitude, @Longitude, @ServiceRadius, @FormattedAddress, @PlaceType, @PostalCode,
        @TravelCost, @MinimumBookingAmount, @BoundsNortheastLat, @BoundsNortheastLng,
        @BoundsSouthwestLat, @BoundsSouthwestLng, 1, GETDATE(), GETDATE()
    );
    
    SELECT SCOPE_IDENTITY() AS VendorServiceAreaID;
END
GO
