-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_UpdateVerification
-- Description: Updates vendor verification info
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_UpdateVerification]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_UpdateVerification];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_UpdateVerification]
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
    
    UPDATE vendors.VendorProfiles SET 
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

