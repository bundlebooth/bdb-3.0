-- =============================================
-- Stored Procedure: sp_Vendor_UpdateBusinessBasics
-- Description: Updates vendor business basics (step 1)
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateBusinessBasics]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateBusinessBasics];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateBusinessBasics]
    @VendorProfileID INT,
    @BusinessName NVARCHAR(100),
    @DisplayName NVARCHAR(100),
    @BusinessEmail NVARCHAR(255),
    @BusinessPhone NVARCHAR(20),
    @Website NVARCHAR(255) = NULL,
    @BusinessDescription NVARCHAR(MAX) = NULL,
    @Tagline NVARCHAR(255) = NULL,
    @YearsInBusiness INT = NULL,
    @PriceLevel NVARCHAR(20) = '$$'
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET BusinessName = @BusinessName, DisplayName = @DisplayName, 
        BusinessEmail = @BusinessEmail, BusinessPhone = @BusinessPhone,
        Website = @Website, BusinessDescription = @BusinessDescription,
        Tagline = @Tagline, YearsInBusiness = @YearsInBusiness,
        PriceLevel = @PriceLevel,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
