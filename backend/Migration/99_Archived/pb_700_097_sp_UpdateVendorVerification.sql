/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorVerification]
    Phase: 600 - Stored Procedures
    Script: cu_600_111_dbo.sp_UpdateVendorVerification.sql
    Description: Creates the [vendors].[sp_UpdateVerification] stored procedure
    
    Execution Order: 111
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdateVerification]...';
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdateVerification]'))
    DROP PROCEDURE [vendors].[sp_UpdateVerification];
GO

CREATE   PROCEDURE [vendors].[sp_UpdateVerification]
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
        UPDATE vendors.VendorProfiles 
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

PRINT 'Stored procedure [vendors].[sp_UpdateVerification] created successfully.';
GO

