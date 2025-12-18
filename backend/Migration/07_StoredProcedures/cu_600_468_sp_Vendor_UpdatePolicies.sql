-- =============================================
-- Stored Procedure: sp_Vendor_UpdatePolicies
-- Description: Updates vendor policies and preferences
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_Vendor_UpdatePolicies]'))
    DROP PROCEDURE [dbo].[sp_Vendor_UpdatePolicies];
GO

CREATE PROCEDURE [dbo].[sp_Vendor_UpdatePolicies]
    @VendorProfileID INT,
    @DepositRequirements NVARCHAR(MAX) = NULL,
    @CancellationPolicy NVARCHAR(MAX) = NULL,
    @ReschedulingPolicy NVARCHAR(MAX) = NULL,
    @PaymentMethods NVARCHAR(MAX) = NULL,
    @PaymentTerms NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles 
    SET DepositRequirements = @DepositRequirements,
        CancellationPolicy = @CancellationPolicy,
        ReschedulingPolicy = @ReschedulingPolicy,
        PaymentMethods = @PaymentMethods,
        PaymentTerms = @PaymentTerms,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
