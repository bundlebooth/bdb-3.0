-- =============================================
-- Stored Procedure: vendors.sp_UpdateProfileExtended
-- Description: Updates vendor profile with extended fields including location
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfileExtended]'))
    DROP PROCEDURE [vendors].[sp_UpdateProfileExtended];
GO

CREATE PROCEDURE [vendors].[sp_UpdateProfileExtended]
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
    @Tagline NVARCHAR(255) = NULL, -- Deprecated: kept for backward compatibility, ignored
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles SET
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
        -- Tagline is deprecated and no longer updated
        PriceLevel = @PriceLevel,
        LogoURL = @ProfileLogo,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

