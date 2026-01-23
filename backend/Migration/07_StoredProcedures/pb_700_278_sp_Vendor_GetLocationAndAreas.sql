-- =============================================
-- Stored Procedure: vendors.sp_GetLocationAndAreas
-- Description: Gets vendor location and service areas
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetLocationAndAreas]'))
    DROP PROCEDURE [vendors].[sp_GetLocationAndAreas];
GO

CREATE PROCEDURE [vendors].[sp_GetLocationAndAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    -- Get vendor profile location
    SELECT Address, City, State, Country, PostalCode, Latitude, Longitude
    FROM vendors.VendorProfiles
    WHERE VendorProfileID = @VendorProfileID;
    
    -- Get service areas
    SELECT GooglePlaceID, CityName, [State/Province] as StateProvince, Country, 
           Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, IsActive
    FROM VendorServiceAreas
    WHERE VendorProfileID = @VendorProfileID;
END
GO

