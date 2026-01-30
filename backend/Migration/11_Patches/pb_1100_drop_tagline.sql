-- =============================================
-- Drop Tagline column from VendorProfiles table
-- This column is no longer used in the application
-- =============================================

-- First, update stored procedures to remove Tagline parameter

-- Update sp_Vendor_UpdateBusinessBasics
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateBusinessBasics]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [vendors].[sp_UpdateBusinessBasics];
END
GO

CREATE PROCEDURE [vendors].[sp_UpdateBusinessBasics]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessEmail NVARCHAR(255),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255) = NULL,
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @Tagline NVARCHAR(255) = NULL, -- Keep parameter for backward compatibility but ignore it
    @YearsInBusiness INT = NULL,
    @PriceLevel NVARCHAR(20) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET 
        BusinessName = @BusinessName,
        DisplayName = @DisplayName,
        BusinessEmail = @BusinessEmail,
        BusinessPhone = @BusinessPhone,
        Website = @Website,
        BusinessDescription = @BusinessDescription,
        -- Tagline is intentionally not updated (deprecated)
        YearsInBusiness = @YearsInBusiness,
        PriceLevel = @PriceLevel,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
END
GO

-- Update sp_Vendor_UpdateProfileExtended
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateProfileExtended]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [vendors].[sp_UpdateProfileExtended];
END
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
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @Tagline NVARCHAR(255) = NULL, -- Keep parameter for backward compatibility but ignore it
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET 
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
        -- Tagline is intentionally not updated (deprecated)
        PriceLevel = @PriceLevel,
        LogoURL = COALESCE(@ProfileLogo, LogoURL),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
END
GO

-- Update sp_Vendor_UpdateExtraFields
IF EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateExtraFields]') AND type in (N'P', N'PC'))
BEGIN
    DROP PROCEDURE [vendors].[sp_UpdateExtraFields];
END
GO

CREATE PROCEDURE [vendors].[sp_UpdateExtraFields]
    @VendorProfileID INT,
    @Latitude DECIMAL(10, 8) = NULL,
    @Longitude DECIMAL(11, 8) = NULL,
    @Tagline NVARCHAR(255) = NULL, -- Keep parameter for backward compatibility but ignore it
    @PriceLevel NVARCHAR(20) = NULL,
    @ProfileLogo NVARCHAR(255) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles
    SET 
        Latitude = COALESCE(@Latitude, Latitude),
        Longitude = COALESCE(@Longitude, Longitude),
        -- Tagline is intentionally not updated (deprecated)
        PriceLevel = COALESCE(@PriceLevel, PriceLevel),
        LogoURL = COALESCE(@ProfileLogo, LogoURL),
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
END
GO

-- Clear existing Tagline values (set to NULL)
UPDATE vendors.VendorProfiles SET Tagline = NULL WHERE Tagline IS NOT NULL;
GO

PRINT 'Tagline column deprecated - stored procedures updated to ignore Tagline parameter';
GO
