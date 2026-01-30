-- =============================================
-- Stored Procedure: vendors.sp_UpdateBusinessBasics
-- Description: Updates vendor business basics (step 1)
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateBusinessBasics]'))
    DROP PROCEDURE [vendors].[sp_UpdateBusinessBasics];
GO

CREATE PROCEDURE [vendors].[sp_UpdateBusinessBasics]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessEmail NVARCHAR(255),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255) = NULL,
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @Tagline NVARCHAR(255) = NULL, -- Deprecated: kept for backward compatibility, ignored
    @YearsInBusiness INT = NULL,
    @PriceLevel NVARCHAR(20) = '$$'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles 
    SET BusinessName = @BusinessName, DisplayName = @DisplayName, 
        BusinessEmail = @BusinessEmail, BusinessPhone = @BusinessPhone,
        Website = @Website, BusinessDescription = @BusinessDescription,
        -- Tagline is deprecated and no longer updated
        YearsInBusiness = @YearsInBusiness,
        PriceLevel = @PriceLevel,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO

