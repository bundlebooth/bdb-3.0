-- =============================================
-- Stored Procedure: admin.sp_GetVendorServiceAreas
-- Description: Gets vendor service areas
-- Phase: 600 (Stored Procedures)
-- Schema: admin
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[admin].[sp_GetVendorServiceAreas]'))
    DROP PROCEDURE [admin].[sp_GetVendorServiceAreas];
GO

CREATE PROCEDURE [admin].[sp_GetVendorServiceAreas]
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
        IsActive
    FROM VendorServiceAreas 
    WHERE VendorProfileID = @VendorProfileID
    ORDER BY CityName;
END
GO
