-- =============================================
-- Stored Procedure: sp_VendorDashboard_UpdatePolicies
-- Description: Updates vendor policies
-- Phase: 600 (Stored Procedures)
-- =============================================
IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[dbo].[sp_VendorDashboard_UpdatePolicies]'))
    DROP PROCEDURE [dbo].[sp_VendorDashboard_UpdatePolicies];
GO

CREATE PROCEDURE [dbo].[sp_VendorDashboard_UpdatePolicies]
    @VendorProfileID INT,
    @DepositRequirements NVARCHAR(MAX),
    @CancellationPolicy NVARCHAR(MAX),
    @ReschedulingPolicy NVARCHAR(MAX),
    @PaymentMethods NVARCHAR(MAX),
    @PaymentTerms NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE VendorProfiles SET 
        DepositRequirements = @DepositRequirements,
        CancellationPolicy = @CancellationPolicy,
        ReschedulingPolicy = @ReschedulingPolicy,
        PaymentMethods = @PaymentMethods,
        PaymentTerms = @PaymentTerms,
        UpdatedAt = GETDATE()
    WHERE VendorProfileID = @VendorProfileID;
    
    SELECT @@ROWCOUNT AS RowsAffected;
END
GO
