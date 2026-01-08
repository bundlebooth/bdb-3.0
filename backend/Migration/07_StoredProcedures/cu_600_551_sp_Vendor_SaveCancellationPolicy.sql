-- =============================================
-- Stored Procedure: vendors.sp_SaveCancellationPolicy
-- Description: Creates or updates a vendor's cancellation policy
-- Phase: 600 (Stored Procedures)
-- Schema: vendors
-- =============================================
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_SaveCancellationPolicy]'))
    DROP PROCEDURE [vendors].[sp_SaveCancellationPolicy];
GO

CREATE PROCEDURE [vendors].[sp_SaveCancellationPolicy]
    @VendorProfileID INT,
    @PolicyName NVARCHAR(100) = 'Standard',
    @FullRefundHours INT = 48,
    @PartialRefundHours INT = 24,
    @PartialRefundPercent DECIMAL(5,2) = 50.00,
    @NoRefundHours INT = 0,
    @AllowClientCancellation BIT = 1,
    @AllowVendorCancellation BIT = 1,
    @CancellationFee DECIMAL(10,2) = 0.00,
    @PolicyDescription NVARCHAR(MAX) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    IF EXISTS (SELECT 1 FROM vendors.VendorCancellationPolicies WHERE VendorProfileID = @VendorProfileID)
    BEGIN
        UPDATE vendors.VendorCancellationPolicies
        SET PolicyName = @PolicyName,
            FullRefundHours = @FullRefundHours,
            PartialRefundHours = @PartialRefundHours,
            PartialRefundPercent = @PartialRefundPercent,
            NoRefundHours = @NoRefundHours,
            AllowClientCancellation = @AllowClientCancellation,
            AllowVendorCancellation = @AllowVendorCancellation,
            CancellationFee = @CancellationFee,
            PolicyDescription = @PolicyDescription,
            UpdatedAt = GETDATE()
        WHERE VendorProfileID = @VendorProfileID;
        
        SELECT PolicyID FROM vendors.VendorCancellationPolicies WHERE VendorProfileID = @VendorProfileID;
    END
    ELSE
    BEGIN
        INSERT INTO vendors.VendorCancellationPolicies 
            (VendorProfileID, PolicyName, FullRefundHours, PartialRefundHours, PartialRefundPercent, 
             NoRefundHours, AllowClientCancellation, AllowVendorCancellation, CancellationFee, PolicyDescription)
        VALUES 
            (@VendorProfileID, @PolicyName, @FullRefundHours, @PartialRefundHours, @PartialRefundPercent,
             @NoRefundHours, @AllowClientCancellation, @AllowVendorCancellation, @CancellationFee, @PolicyDescription);
        
        SELECT SCOPE_IDENTITY() AS PolicyID;
    END
END
GO

