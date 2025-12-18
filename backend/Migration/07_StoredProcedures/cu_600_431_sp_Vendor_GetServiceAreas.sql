-- =============================================
-- Stored Procedure: vendors.sp_GetServiceAreas
-- Description: Gets active service areas for a vendor
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetServiceAreas]'))
    DROP PROCEDURE [vendors].[sp_GetServiceAreas];
GO

CREATE PROCEDURE [vendors].[sp_GetServiceAreas]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT VendorServiceAreaID, GooglePlaceID, CityName, [State/Province] AS StateProvince, 
           Country, Latitude, Longitude, ServiceRadius, FormattedAddress, PlaceType, IsActive
    FROM VendorServiceAreas 
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1
    ORDER BY CityName;
END
GO
