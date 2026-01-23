-- =============================================
-- Stored Procedure: vendors.sp_Dashboard_UpdatePolicies
-- Description: Updates vendor policies
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_Dashboard_UpdatePolicies]'))
    DROP PROCEDURE [vendors].[sp_Dashboard_UpdatePolicies];
GO

CREATE PROCEDURE [vendors].[sp_Dashboard_UpdatePolicies]
    @VendorProfileID INT,
    @DepositRequirements NVARCHAR(MAX),
    @CancellationPolicy NVARCHAR(MAX),
    @ReschedulingPolicy NVARCHAR(MAX),
    @PaymentMethods NVARCHAR(MAX),
    @PaymentTerms NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE vendors.VendorProfiles SET 
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

