/*
    Migration Script: Create Stored Procedure [vendors].[sp_GetCancellationPolicy]
    Description: Creates the [vendors].[sp_GetCancellationPolicy] stored procedure
*/

SET NOCOUNT ON;
GO

SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

IF EXISTS (SELECT 1 FROM sys.procedures WHERE object_id = OBJECT_ID(N'[vendors].[sp_GetCancellationPolicy]'))
    DROP PROCEDURE [vendors].[sp_GetCancellationPolicy];
GO


CREATE PROCEDURE [vendors].[sp_GetCancellationPolicy]
    @VendorProfileID INT
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        PolicyID,
        VendorProfileID,
        PolicyName,
        FullRefundHours,
        PartialRefundHours,
        PartialRefundPercent,
        NoRefundHours,
        AllowClientCancellation,
        AllowVendorCancellation,
        CancellationFee,
        PolicyDescription,
        IsActive,
        CreatedAt,
        UpdatedAt
    FROM vendors.VendorCancellationPolicies
    WHERE VendorProfileID = @VendorProfileID AND IsActive = 1;
    
    -- If no policy exists, return default values
    IF @@ROWCOUNT = 0
    BEGIN
        SELECT 
            0 AS PolicyID,
            @VendorProfileID AS VendorProfileID,
            'Standard' AS PolicyName,
            48 AS FullRefundHours,
            24 AS PartialRefundHours,
            50.00 AS PartialRefundPercent,
            0 AS NoRefundHours,
            1 AS AllowClientCancellation,
            1 AS AllowVendorCancellation,
            0.00 AS CancellationFee,
            'Standard cancellation policy: Full refund if cancelled 48+ hours before event, 50% refund if cancelled 24-48 hours before, no refund within 24 hours.' AS PolicyDescription,
            1 AS IsActive,
            GETDATE() AS CreatedAt,
            GETDATE() AS UpdatedAt;
    END
END
GO
