
-- Step 9: Verification & Legal
CREATE   PROCEDURE sp_UpdateVendorVerification
    @VendorProfileID INT,
    @LicenseNumber NVARCHAR(50),
    @InsuranceVerified BIT = 0,
    @BusinessType NVARCHAR(50),
    @TaxID NVARCHAR(50),
    @Awards NVARCHAR(MAX),
    @Certifications NVARCHAR(MAX),
    @IsEcoFriendly BIT = 0,
    @IsPremium BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE VendorProfiles 
        SET LicenseNumber = @LicenseNumber,
            InsuranceVerified = @InsuranceVerified,
            BusinessType = @BusinessType,
            TaxID = @TaxID,
            Awards = @Awards,
            Certifications = @Certifications,
            IsEcoFriendly = @IsEcoFriendly,
            IsPremium = @IsPremium,
            SetupStep9Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        SELECT 1 AS Success, 'Verification information updated successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

