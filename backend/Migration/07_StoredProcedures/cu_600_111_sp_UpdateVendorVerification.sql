/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorVerification]
    Phase: 600 - Stored Procedures
    Script: cu_600_111_dbo.sp_UpdateVendorVerification.sql
    Description: Creates the [dbo].[sp_UpdateVendorVerification] stored procedure
    
    Execution Order: 111
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [dbo].[sp_UpdateVendorVerification]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_UpdateVendorVerification]'))
    DROP PROCEDURE [dbo].[sp_UpdateVendorVerification];
GO

CREATE   PROCEDURE [dbo].[sp_UpdateVendorVerification]
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

PRINT 'Stored procedure [dbo].[sp_UpdateVendorVerification] created successfully.';
GO
