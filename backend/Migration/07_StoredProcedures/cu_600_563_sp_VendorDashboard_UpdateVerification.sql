-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdateVerification
-- Description: Updates vendor verification info
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdateVerification]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdateVerification];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdateVerification]
    @VendorProfileID INT,
    @LicenseNumber NVARCHAR(100),
    @InsuranceVerified BIT,
    @Awards NVARCHAR(MAX),
    @Certifications NVARCHAR(MAX),
    @IsEcoFriendly BIT,
    @IsPremium BIT,
    @IsAwardWinning BIT,
    @IsLastMinute BIT
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET 
        LicenseNumber = @LicenseNumber,
        InsuranceVerified = @InsuranceVerified,
        Awards = @Awards,
        Certifications = @Certifications,
        IsEcoFriendly = @IsEcoFriendly,
        IsPremium = @IsPremium,
        IsAwardWinning = @IsAwardWinning,
        IsLastMinute = @IsLastMinute,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
