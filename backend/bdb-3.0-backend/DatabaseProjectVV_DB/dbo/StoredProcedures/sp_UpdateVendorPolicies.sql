
-- Step 8: Policies & Preferences
CREATE   PROCEDURE sp_UpdateVendorPolicies
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
        UPDATE VendorProfiles 
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

