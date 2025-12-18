-- =============================================
-- Stored Procedure: vendors.sp_InsertServiceAreaSimple
-- Description: Inserts a service area for a vendor (simple version)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_InsertServiceAreaSimple]'))
    DROP PROCEDURE [vendors].[sp_InsertServiceAreaSimple];
GO

CREATE PROCEDURE [vendors].[sp_InsertServiceAreaSimple]
    @VendorProfileID INT,
    @GooglePlaceID NVARCHAR(100) = '',
    @CityName NVARCHAR(100) = '',
    @StateProvince NVARCHAR(100) = '',
    @Country NVARCHAR(100) = 'Canada',
    @Latitude DECIMAL(9,6) = NULL,
    @Longitude DECIMAL(9,6) = NULL,
    @ServiceRadius DECIMAL(10,2) = 25.0,
    @FormattedAddress NVARCHAR(255) = NULL,
    @PlaceType NVARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    INSERT INTO VendorServiceAreas (VendorProfileID, GooglePlaceID, CityName, [State/Province], Country, Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, IsActive)
    VALUES (@VendorProfileID, @GooglePlaceID, @CityName, @StateProvince, @Country, @Latitude, @Longitude, @ServiceRadius, @FormattedAddress, @PlaceType, 1);
    
    SELECT SCOPE_IDENTITY() AS ServiceAreaID;
END
GO
