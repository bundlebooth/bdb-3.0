-- =============================================
-- Stored Procedure: sp_Vendor_UpdateVerification
-- Description: Updates vendor verification and legal info
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdateVerification]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdateVerification];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdateVerification]
    @VendorProfileID INT,
    @LicenseNumber NVARCHAR(100) = NULL,
    @InsuranceVerified BIT = 0,
    @Awards NVARCHAR(MAX) = NULL,
    @Certifications NVARCHAR(MAX) = NULL,
    @IsEcoFriendly BIT = 0,
    @IsPremium BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET LicenseNumber = @LicenseNumber,
        InsuranceVerified = @InsuranceVerified,
        Awards = @Awards,
        Certifications = @Certifications,
        IsEcoFriendly = @IsEcoFriendly,
        IsPremium = @IsPremium,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
