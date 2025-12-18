-- =============================================
-- Stored Procedure: sp_Vendor_UpdateProfileExtended
-- Description: Updates vendor profile with extended fields including location
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateProfileExtended]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateProfileExtended];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateProfileExtended]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255) = NULL,
    @YearsInBusiness INT = 1,
    @Address NVARCHAR(255) = NULL,
    @City NVARCHAR(100) = NULL,
    @State NVARCHAR(50) = NULL,
    @Country NVARCHAR(50) = 'Canada',
    @PostalCode NVARCHAR(20) = NULL,
    @Latitude DECIMAL(10,8) = NULL,
    @Longitude DECIMAL(11,8) = NULL,
    @Tagline NVARCHAR(255) = NULL,
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET
        BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessDescription = @BusinessDescription,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        YearsInBusiness = @YearsInBusiness,
        Address = @Address,
        City = @City,
        State = @State,
        Country = @Country,
        PostalCode = @PostalCode,
        Latitude = @Latitude,
        Longitude = @Longitude,
        Tagline = @Tagline,
        PriceLevel = @PriceLevel,
        LogoURL = @ProfileLogo,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
