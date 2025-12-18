-- =============================================
-- Stored Procedure: sp_Vendor_UpdateExtraFields
-- Description: Updates extra vendor profile fields (lat/long, tagline, etc.)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateExtraFields]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateExtraFields];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateExtraFields]
    @VendorProfileID INT,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL,
    @Tagline NVARCHAR(255) = NULL,
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET
        Latitude = @Latitude,
        Longitude = @Longitude,
        Tagline = @Tagline,
        PriceLevel = @PriceLevel,
        LogoURL = @ProfileLogo
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
