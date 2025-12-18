-- =============================================
-- Stored Procedure: vendors.sp_UpdateExtraFields
-- Description: Updates extra vendor profile fields (lat/long, tagline, etc.)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateExtraFields]'))
    DROP PROCEDURE [vendors].[sp_UpdateExtraFields];
GO

CREATE PROCEDURE [vendors].[sp_UpdateExtraFields]
    @VendorProfileID INT,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL,
    @Tagline NVARCHAR(255) = NULL,
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles SET
        Latitude = @Latitude,
        Longitude = @Longitude,
        Tagline = @Tagline,
        PriceLevel = @PriceLevel,
        LogoURL = @ProfileLogo
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

