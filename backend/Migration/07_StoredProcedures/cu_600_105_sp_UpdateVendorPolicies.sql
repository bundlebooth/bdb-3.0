/*
    Migration Script: Create Stored Procedure [sp_UpdateVendorPolicies]
    Phase: 600 - Stored Procedures
    Script: cu_600_105_dbo.sp_UpdateVendorPolicies.sql
    Description: Creates the [vendors].[sp_UpdatePolicies] stored procedure
    
    Execution Order: 105
*/

SET NOCOUNT ON;
GO

PRINT 'Creating stored procedure [vendors].[sp_UpdatePolicies]...';
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_UpdatePolicies]'))
    DROP PROCEDURE [vendors].[sp_UpdatePolicies];
GO

CREATE   PROCEDURE [vendors].[sp_UpdatePolicies]
    @VendorProfileID INT,
    @DepositRequirements NVARCHAR(MAX),
    @CancellationPolicy NVARCHAR(MAX),
    @ReschedulingPolicy NVARCHAR(MAX),
    @PaymentMethods NVARCHAR(MAX), -- JSON array
    @PaymentTerms NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        UPDATE vendors.VendorProfiles 
        SET DepositRequirements = @DepositRequirements,
            CancellationPolicy = @CancellationPolicy,
            ReschedulingPolicy = @ReschedulingPolicy,
            PaymentMethods = @PaymentMethods,
            PaymentTerms = @PaymentTerms,
            SetupStep8Completed = 1,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        SELECT 1 AS Success, 'Policies updated successfully' AS Message;
        
    END TRY
    BEGIN CATCH
        SELECT 0 AS Success, ERROR_MESSAGE() AS Message;
    END CATCH
END;

GO

PRINT 'Stored procedure [vendors].[sp_UpdatePolicies] created successfully.';
GO

